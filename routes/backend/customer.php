<?php

use App\Http\Controllers\Customer\AtmMapController;
use App\Http\Controllers\Customer\AtmWithdrawalController;
use App\Http\Controllers\Customer\BeneficiaryController;
use App\Http\Controllers\Customer\BillController;
use App\Http\Controllers\Customer\TransferController;
use App\Models\AccountOpeningRequest;
use App\Models\Appointment;
use App\Models\CustomerProfile;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;

/*
 |--------------------------------------------------------------------------
 | Backend Customer Routes
 |--------------------------------------------------------------------------
 | Profile edits are available to authenticated customers.
 | Banking and ATM routes require a verified customer profile.
 */

// ── Limited customer routes (auth + verified customer role) ───────────────
Route::middleware(['auth', 'verified', 'role.customer'])
    ->prefix('backend/customer')
    ->name('backend.customer.')
    ->group(function () {
        Route::patch('/profile', function (Request $request) {
            $validated = $request->validate([
                'cin'               => ['required', 'string', 'max:20'],
                'first_name'        => ['required', 'string', 'max:100'],
                'last_name'         => ['required', 'string', 'max:100'],
                'phone'             => ['nullable', 'string', 'max:30'],
                'birth_date'        => ['nullable', 'date'],
                'address'           => ['nullable', 'string', 'max:500'],
                'city'              => ['nullable', 'string', 'max:100'],
                'employment_status' => ['nullable', 'string', 'max:100'],
                'monthly_income'    => ['nullable', 'numeric', 'min:0'],
            ]);

            CustomerProfile::updateOrCreate(
                ['user_id' => $request->user()->id],
                array_merge($validated, ['user_id' => $request->user()->id])
            );

            return back()->with('success', 'Profile updated.');
        })->name('profile.update');
    });

// ── Verified customer banking routes ──────────────────────────────────────
Route::middleware(['auth', 'verified', 'role.customer', 'verified.customer'])
    ->prefix('backend/customer')
    ->name('backend.customer.')
    ->group(function () {

        Route::get('/dashboard', function () {
            return response()->json(['status' => 'ok']);
        })->name('dashboard');

        Route::post('/account-opening', function (Request $request) {
            $validated = $request->validate([
                'branch_id'    => ['required', 'exists:branches,id'],
                'account_type' => ['required', 'string'],
            ]);

            $user    = $request->user();
            $profile = CustomerProfile::where('user_id', $user->id)->first();

            AccountOpeningRequest::create([
                'user_id'             => $user->id,
                'customer_profile_id' => $profile?->id,
                'branch_id'           => $validated['branch_id'],
                'account_type'        => $validated['account_type'],
                'request_number'      => 'CIM-' . strtoupper(Str::random(8)),
                'status'              => 'submitted',
                'submitted_at'        => now(),
            ]);

            return back()->with('success', 'Account opening request submitted.');
        })->name('account-opening.store');

        Route::post('/documents', function (Request $request) {
            $validated = $request->validate([
                'document_type' => ['required', 'string'],
                'file_path'     => ['required', 'string'],
            ]);

            $user = $request->user();
            $aor  = $user->accountOpeningRequests()->latest()->first();

            Document::create([
                'user_id'                    => $user->id,
                'account_opening_request_id' => $aor?->id,
                'document_type'              => $validated['document_type'],
                'file_path'                  => $validated['file_path'],
                'status'                     => 'pending',
            ]);

            return back()->with('success', 'Document uploaded.');
        })->name('documents.store');

        Route::post('/appointments', function (Request $request) {
            $validated = $request->validate([
                'branch_id'    => ['required', 'exists:branches,id'],
                'scheduled_at' => ['required', 'date'],
                'notes'        => ['nullable', 'string'],
            ]);

            $user = $request->user();
            $aor  = $user->accountOpeningRequests()->latest()->firstOrFail();

            Appointment::create([
                'account_opening_request_id' => $aor->id,
                'branch_id'                  => $validated['branch_id'],
                'customer_id'                => $user->id,
                'scheduled_at'               => $validated['scheduled_at'],
                'status'                     => 'scheduled',
                'notes'                      => $validated['notes'] ?? null,
            ]);

            $aor->update(['status' => 'appointment_scheduled']);

            return back()->with('success', 'Appointment booked.');
        })->name('appointments.store');

        Route::post('/beneficiaries', [BeneficiaryController::class, 'store'])->name('beneficiaries.store');
        Route::post('/transfers', [TransferController::class, 'store'])->name('transfers.store');
        Route::post('/bills', [BillController::class, 'store'])->name('bills.store');
        Route::patch('/bills/{bill}', [BillController::class, 'update'])->name('bills.update');
        Route::delete('/bills/{bill}', [BillController::class, 'destroy'])->name('bills.destroy');
        Route::post('/bills/{bill}/pay-now', [BillController::class, 'payNow'])->name('bills.pay-now');
        Route::patch('/bills/{bill}/toggle-autopay', [BillController::class, 'toggleAutopay'])->name('bills.toggle-autopay');

        // ATM map — list all Casablanca ATMs
        Route::get('/atm-map', [AtmMapController::class, 'index'])
            ->name('atm-map.index');

        // ATM detail
        Route::get('/atm-map/{atm}', [AtmMapController::class, 'show'])
            ->name('atm-map.show');

        // ATM withdrawal
        Route::post('/atm-withdrawals', [AtmWithdrawalController::class, 'store'])
            ->name('atm-withdrawals.store');
    });
