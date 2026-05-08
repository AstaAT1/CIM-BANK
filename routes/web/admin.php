<?php

use App\Http\Controllers\Admin\AccountOpeningReviewController;
use App\Http\Controllers\Admin\AppointmentAttendeesController;
use App\Http\Controllers\Admin\AppointmentController;
use App\Http\Controllers\Admin\AtmController;
use App\Http\Controllers\Admin\BankAccountController;
use App\Http\Controllers\Admin\CustomerController;
use App\Http\Controllers\Admin\DocumentReviewController;
use App\Http\Controllers\Admin\Machrou3iController;
use App\Http\Controllers\Admin\TransferReviewController;
use App\Http\Controllers\Admin\UserRoleController;
use App\Models\Document;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Route;

/*
 |--------------------------------------------------------------------------
 | Admin & Employee Routes
 |--------------------------------------------------------------------------
 | Protected by 'role.admin' middleware alias, which maps to
 | EnsureAdminOrEmployee — granting access to BOTH admin AND employee roles.
 */
Route::middleware(['auth', 'role.admin'])->prefix('admin')->name('admin.')->group(function () {

    // ── Dashboard ──────────────────────────────────────────────────────────
    Route::redirect('/', '/admin/customers-dashboard')->name('dashboard');

    // ── Customers Dashboard (legacy appointment-attendees URL kept) ────────
    Route::get('/customers-dashboard', [AppointmentAttendeesController::class, 'index'])->name('customers-dashboard.index');
    Route::get('/appointment-attendees', [AppointmentAttendeesController::class, 'index'])->name('appointment-attendees.index');
    Route::post('/appointment-attendees/{appointment}/mark-verified',  [AppointmentAttendeesController::class, 'markVerified'])->name('appointment-attendees.verify');
    Route::post('/appointment-attendees/{appointment}/mark-rejected',  [AppointmentAttendeesController::class, 'markRejected'])->name('appointment-attendees.reject');
    Route::post('/appointment-attendees/{appointment}/mark-completed', [AppointmentAttendeesController::class, 'markCompleted'])->name('appointment-attendees.completed');
    Route::post('/appointment-attendees/{appointment}/mark-missed',    [AppointmentAttendeesController::class, 'markMissed'])->name('appointment-attendees.missed');

    // ── Account Opening Requests ───────────────────────────────────────────
    Route::get('/account-opening-requests',                                          [AccountOpeningReviewController::class, 'index'])->name('account-opening-requests.index');
    Route::get('/account-opening-requests/{accountOpeningRequest}',                  [AccountOpeningReviewController::class, 'show'])->name('account-opening-requests.show');
    Route::post('/account-opening-requests/{accountOpeningRequest}/under-review',    [AccountOpeningReviewController::class, 'markUnderReview'])->name('account-opening-requests.under-review');
    Route::post('/account-opening-requests/{accountOpeningRequest}/approve',         [AccountOpeningReviewController::class, 'approve'])->name('account-opening-requests.approve');
    Route::post('/account-opening-requests/{accountOpeningRequest}/reject',          [AccountOpeningReviewController::class, 'reject'])->name('account-opening-requests.reject');

    // ── Document Viewer ────────────────────────────────────────────────────
    Route::get('/documents/{document}/view', function (Document $document) {
        abort_unless(Storage::disk('local')->exists($document->file_path), 404, 'Document not found.');

        $absolutePath = Storage::disk('local')->path($document->file_path);
        $mimeType = $document->mime_type ?: Storage::disk('local')->mimeType($document->file_path) ?: 'application/octet-stream';
        $fileName = $document->original_name ?: basename($document->file_path);

        return response()->file($absolutePath, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'inline; filename="'.$fileName.'"',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    })->name('admin.documents.view');

    // ── Appointments ───────────────────────────────────────────────────────
    Route::get('/appointments',                              [AppointmentController::class, 'index'])->name('appointments.index');
    Route::post('/appointments/{appointment}/completed',     [AppointmentController::class, 'markCompleted'])->name('appointments.completed');
    Route::post('/appointments/{appointment}/missed',        [AppointmentController::class, 'markMissed'])->name('appointments.missed');
    Route::post('/appointments/{appointment}/cancel',        [AppointmentController::class, 'cancel'])->name('appointments.cancel');
    Route::post('/appointments/{appointment}/reschedule',    [AppointmentController::class, 'reschedule'])->name('appointments.reschedule');

    // ── ATM Management (preview routes — business logic in backend/admin.php) ──
    Route::get('/atms',         [AtmController::class, 'index'])->name('atms.index');
    Route::get('/atms/{atm}',   [AtmController::class, 'show'])->name('atms.show');

    // Beneficiary approvals are obsolete; customers now validate CIM beneficiaries instantly.
    Route::redirect('/beneficiaries', '/admin/customers-dashboard')->name('beneficiaries.index');

    // ── Machrou3i Review Foundation ───────────────────────────────────────
    Route::get('/machrou3i', [Machrou3iController::class, 'index'])->name('machrou3i.index');
    Route::get('/machrou3i/{application}', [Machrou3iController::class, 'show'])->name('machrou3i.show');
    Route::get('/machrou3i/{application}/documents/{document}/view', [Machrou3iController::class, 'viewDocument'])->name('machrou3i.documents.view');
});
