<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();

        // Load all related data from DB
        $user->load([
            'profile',
            'accountOpeningRequests.branch',
            'accountOpeningRequests.appointment',
            'bankAccounts',
            'bankCards',
        ]);

        $latestRequest = $user->accountOpeningRequests->sortByDesc('created_at')->first();
        $latestAppointment = $latestRequest?->appointment;
        $activeBankAccount = $user->bankAccounts->where('status', 'active')->first();
        $activeCard = $user->bankCards->where('status', 'active')->first();

        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
            'profileData' => [
                'phone' => $user->phone,
                'date_of_birth' => $user->profile?->birth_date?->format('Y-m-d'),
                'address' => $user->profile?->address,
                'cin' => $user->profile?->cin,
                'profession' => $user->profile?->employment_status,
                'verification_status' => $user->profile?->status ?? 'none',
            ],
            'requestData' => $latestRequest ? [
                'request_number' => $latestRequest->request_number,
                'status' => $latestRequest->status,
                'branch_name' => $latestRequest->branch?->name,
                'submitted_at' => $latestRequest->submitted_at?->toIso8601String(),
            ] : null,
            'appointmentData' => $latestAppointment ? [
                'scheduled_at' => $latestAppointment->scheduled_at?->toIso8601String(),
                'status' => $latestAppointment->status,
            ] : null,
            'bankAccountData' => $activeBankAccount ? [
                'account_number' => $activeBankAccount->account_number,
                'status' => $activeBankAccount->status,
            ] : null,
            'cardData' => $activeCard ? [
                'card_holder_name' => $activeCard->card_holder_name,
                'masked_card_number' => $activeCard->masked_card_number,
                'expiry_date' => str_pad($activeCard->expiry_month, 2, '0', STR_PAD_LEFT) . '/' . substr($activeCard->expiry_year, -2),
                'status' => $activeCard->status,
            ] : null,
        ]);
    }

    /**
     * Verify password before allowing edits.
     */
    public function confirmPassword(Request $request): RedirectResponse|\Illuminate\Http\JsonResponse
    {
        $request->validate([
            'password' => ['required', 'string'],
        ]);

        if (!Hash::check($request->password, $request->user()->password)) {
            return back()->withErrors(['password' => 'The password is incorrect.']);
        }

        // Store confirmation in session (valid for 5 minutes)
        $request->session()->put('profile_edit_confirmed_at', now()->timestamp);

        return back()->with('editUnlocked', true);
    }

    /**
     * Update the user's profile information (password-protected).
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $confirmedAt = $request->session()->get('profile_edit_confirmed_at', 0);
        if (now()->timestamp - $confirmedAt > 300) {
            return back()->withErrors(['password' => 'Please confirm your password before editing.']);
        }

        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        // Clear the confirmation
        $request->session()->forget('profile_edit_confirmed_at');

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Profile updated.')]);

        return to_route('profile.edit');
    }

    /**
     * Delete the user's profile.
     */
    public function destroy(ProfileDeleteRequest $request): RedirectResponse
    {
        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}

