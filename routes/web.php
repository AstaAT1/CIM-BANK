<?php

use App\Http\Controllers\Customer\DashboardController as CustomerDashboardController;
use App\Http\Controllers\OnboardingController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),

])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('account/pending', function () {
        $user = request()->user();
        $user->load(['profile', 'accountOpeningRequests' => fn ($q) => $q->latest()->first()]);
        $latestRequest = $user->accountOpeningRequests->first();
        $status = $user->profile?->status ?? 'none';

        return Inertia::render('account-pending', [
            'verificationStatus' => $status,
            'requestStatus' => $latestRequest?->status ?? 'none',
        ]);
    })->name('account.pending');
});

Route::middleware(['auth', 'verified', 'role.customer', 'verified.customer'])->group(function () {
    Route::get('dashboard', CustomerDashboardController::class)->name('dashboard');
});

// ── Onboarding (registration flow) ──
Route::post('/onboarding/register', [OnboardingController::class, 'register'])->name('onboarding.register');

Route::middleware(['auth'])->group(function () {
    Route::get('/onboarding/appointment/{accountOpeningRequest}', [OnboardingController::class, 'showAppointment'])->name('onboarding.appointment');
    Route::post('/onboarding/appointment/{accountOpeningRequest}', [OnboardingController::class, 'bookAppointment'])->name('onboarding.appointment.book');
    Route::get('/onboarding/confirmation/{accountOpeningRequest}', [OnboardingController::class, 'showConfirmation'])->name('onboarding.confirmation');
    Route::get('/api/onboarding/available-slots', [OnboardingController::class, 'availableSlots'])->name('onboarding.slots');
});

require __DIR__.'/settings.php';
require __DIR__.'/web/customer.php';
require __DIR__.'/web/admin.php';
require __DIR__.'/backend/customer.php';
require __DIR__.'/backend/admin.php';
