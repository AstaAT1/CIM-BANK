<?php

namespace App\Http\Controllers;

use App\Models\AccountOpeningRequest;
use App\Models\Appointment;
use App\Models\Branch;
use App\Models\CustomerProfile;
use App\Models\Document;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class OnboardingController extends Controller
{
    /**
     * Handle the multi-step registration submission.
     * Receives all data from steps 1-3 at once.
     */
    public function register(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            // Step 1: Contact
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:20'],

            // Step 2: Personal
            'password' => ['required', 'string', Password::default(), 'confirmed'],
            'date_of_birth' => ['required', 'date', 'before:-18 years'],
            'address' => ['required', 'string', 'max:500'],

            // Step 3: Identity
            'cin' => ['required', 'string', 'max:20', 'unique:customer_profiles,cin'],
            'cin_front' => ['required', 'image', 'max:5120'],
            'cin_back' => ['required', 'image', 'max:5120'],
            'profession' => ['required', 'string', 'max:255'],

            // Branch selection
            'branch_id' => ['required', 'exists:branches,id'],
        ]);

        $accountOpeningRequest = DB::transaction(function () use ($validated, $request) {
            // 1. Create user
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'],
                'password' => Hash::make($validated['password']),
            ]);
            Role::findOrCreate('customer', 'web');
            $user->assignRole('customer');

            // 2. Create customer profile
            $nameParts = explode(' ', $validated['name'], 2);
            $profile = CustomerProfile::create([
                'user_id' => $user->id,
                'cin' => $validated['cin'],
                'first_name' => $nameParts[0],
                'last_name' => $nameParts[1] ?? '',
                'phone' => $validated['phone'],
                'birth_date' => $validated['date_of_birth'],
                'address' => $validated['address'],
                'employment_status' => $validated['profession'],
                'status' => 'pending',
            ]);

            // 3. Create account opening request
            $accountOpeningRequest = AccountOpeningRequest::create([
                'user_id' => $user->id,
                'customer_profile_id' => $profile->id,
                'branch_id' => $validated['branch_id'],
                'request_number' => 'CIM-'.strtoupper(Str::random(8)),
                'account_type' => 'current',
                'status' => 'submitted',
                'submitted_at' => now(),
            ]);

            // 4. Store CIN documents
            $this->storeDocument($request, $user, $accountOpeningRequest, 'cin_front', 'cin_front');
            $this->storeDocument($request, $user, $accountOpeningRequest, 'cin_back', 'cin_back');

            // 5. Log user in
            Auth::login($user);

            return $accountOpeningRequest;
        });

        return redirect()->route('onboarding.appointment', $accountOpeningRequest->id);
    }

    /**
     * Show the appointment booking page.
     */
    public function showAppointment(AccountOpeningRequest $accountOpeningRequest): Response
    {
        // Ensure the current user owns this request
        if ($accountOpeningRequest->user_id !== Auth::id()) {
            abort(403);
        }

        // Check if already has an appointment
        if ($accountOpeningRequest->appointment) {
            return Inertia::render('onboarding/confirmation', [
                'request' => $accountOpeningRequest->load(['user', 'customerProfile', 'branch', 'appointment']),
            ]);
        }

        $accountOpeningRequest->load(['user', 'customerProfile', 'branch']);

        // Get booked slots for the selected branch
        $bookedSlots = Appointment::where('branch_id', $accountOpeningRequest->branch_id)
            ->whereIn('status', ['scheduled', 'rescheduled'])
            ->where('scheduled_at', '>=', now())
            ->pluck('scheduled_at')
            ->map(fn ($dt) => $dt->toIso8601String())
            ->toArray();

        return Inertia::render('onboarding/appointment', [
            'request' => $accountOpeningRequest,
            'bookedSlots' => $bookedSlots,
            'branches' => Branch::where('is_active', true)->get(),
        ]);
    }

    /**
     * Book an appointment.
     */
    public function bookAppointment(Request $request, AccountOpeningRequest $accountOpeningRequest): RedirectResponse
    {
        if ($accountOpeningRequest->user_id !== Auth::id()) {
            abort(403);
        }

        $validated = $request->validate([
            'scheduled_at' => ['required', 'date', 'after:now'],
        ]);

        // Prevent double-booking same slot at same branch
        $exists = Appointment::where('branch_id', $accountOpeningRequest->branch_id)
            ->where('scheduled_at', $validated['scheduled_at'])
            ->whereIn('status', ['scheduled', 'rescheduled'])
            ->exists();

        if ($exists) {
            return back()->withErrors(['scheduled_at' => 'This time slot is already booked. Please choose another.']);
        }

        DB::transaction(function () use ($validated, $accountOpeningRequest) {
            Appointment::create([
                'account_opening_request_id' => $accountOpeningRequest->id,
                'branch_id' => $accountOpeningRequest->branch_id,
                'customer_id' => $accountOpeningRequest->user_id,
                'scheduled_at' => $validated['scheduled_at'],
                'status' => 'scheduled',
            ]);

            $accountOpeningRequest->update(['status' => 'appointment_scheduled']);
        });

        return redirect()->route('onboarding.confirmation', $accountOpeningRequest->id);
    }

    /**
     * Show confirmation page.
     */
    public function showConfirmation(AccountOpeningRequest $accountOpeningRequest): Response
    {
        if ($accountOpeningRequest->user_id !== Auth::id()) {
            abort(403);
        }

        $accountOpeningRequest->load(['user', 'customerProfile', 'branch', 'appointment']);

        return Inertia::render('onboarding/confirmation', [
            'request' => $accountOpeningRequest,
        ]);
    }

    /**
     * API: Fetch available appointment slots.
     */
    public function availableSlots(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'branch_id' => ['required', 'exists:branches,id'],
            'start' => ['required', 'date'],
            'end' => ['required', 'date', 'after:start'],
        ]);

        $branch = Branch::findOrFail($validated['branch_id']);

        // Get already booked slots
        $bookedSlots = Appointment::where('branch_id', $validated['branch_id'])
            ->whereIn('status', ['scheduled', 'rescheduled'])
            ->whereBetween('scheduled_at', [$validated['start'], $validated['end']])
            ->pluck('scheduled_at')
            ->map(fn ($dt) => $dt->format('Y-m-d H:i:s'))
            ->toArray();

        // Generate available slots: weekdays, 9:00–15:30, every 30 min
        $slots = [];
        $start = Carbon::parse($validated['start'])->startOfDay();
        $end = Carbon::parse($validated['end'])->endOfDay();

        while ($start->lte($end)) {
            if ($start->isWeekday() && $start->isAfter(now())) {
                $openingHour = $branch->opening_time ? (int) substr($branch->opening_time, 0, 2) : 9;
                $closingHour = $branch->closing_time ? (int) substr($branch->closing_time, 0, 2) : 16;

                for ($hour = $openingHour; $hour < $closingHour; $hour++) {
                    foreach ([0, 30] as $minute) {
                        $slotTime = $start->copy()->setTime($hour, $minute);
                        if ($slotTime->isAfter(now()) && ! in_array($slotTime->format('Y-m-d H:i:s'), $bookedSlots)) {
                            $slots[] = [
                                'id' => $slotTime->format('Y-m-d-H-i'),
                                'title' => 'Available',
                                'start' => $slotTime->toIso8601String(),
                                'end' => $slotTime->copy()->addMinutes(30)->toIso8601String(),
                                'backgroundColor' => '#0A6474',
                                'borderColor' => '#082F54',
                            ];
                        }
                    }
                }
            }
            $start->addDay();
        }

        return response()->json($slots);
    }

    /**
     * Store an uploaded CIN document.
     */
    private function storeDocument(Request $request, User $user, AccountOpeningRequest $accountOpeningRequest, string $fieldName, string $documentType): void
    {
        if ($request->hasFile($fieldName)) {
            $file = $request->file($fieldName);
            $path = $file->store("documents/{$user->id}", 'local');

            Document::create([
                'user_id' => $user->id,
                'account_opening_request_id' => $accountOpeningRequest->id,
                'document_type' => $documentType,
                'file_path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
                'status' => 'pending',
            ]);
        }
    }
}
