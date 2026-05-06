<?php

use App\Http\Controllers\Admin\AtmController;
use App\Http\Controllers\Admin\BeneficiaryController;
use App\Models\AccountOpeningRequest;
use App\Models\AccountTransaction;
use App\Models\TransferRequest;
use App\Models\User;
use App\Services\AuditLogService;
use App\Services\CustomerApprovalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;

/*
 |--------------------------------------------------------------------------
 | Backend Admin Routes
 |--------------------------------------------------------------------------
 | role.admin  = EnsureAdminOrEmployee  → admin + employee
 | role.admin-only = EnsureAdminOnly   → admin ONLY
 */

// ── Shared admin+employee view routes ─────────────────────────────────────
Route::middleware(['auth', 'role.admin'])
    ->prefix('backend/admin')
    ->name('backend.admin.')
    ->group(function () {

        // Dashboard
        Route::get('/dashboard', function () {
            return response()->json(['status' => 'ok', 'role' => 'admin_or_employee']);
        })->name('dashboard');

        // Users (admin only — guarded inside)
        Route::get('/users', function (Request $request) {
            if (! $request->user()->hasRole('admin')) {
                abort(403, 'Admin access only.');
            }

            return response()->json(User::with('roles')->latest()->paginate(20));
        })->name('users.index');

        // Account Opening Reviews
        Route::patch('/account-opening-requests/{accountOpeningRequest}/under-review',
            function (Request $request, AccountOpeningRequest $accountOpeningRequest, AuditLogService $auditLogService) {
                $accountOpeningRequest->update([
                    'status' => 'under_review',
                    'reviewed_by' => $request->user()->id,
                    'reviewed_at' => now(),
                ]);
                $auditLogService->log($request, 'account_opening_under_review', $accountOpeningRequest, 'Request marked under review.');

                return back()->with('success', 'Request marked as under review.');
            }
        )->name('account-opening-requests.under-review');

        Route::patch('/account-opening-requests/{accountOpeningRequest}/approve',
            function (Request $request, AccountOpeningRequest $accountOpeningRequest, CustomerApprovalService $customerApprovalService, AuditLogService $auditLogService) {
                try {
                    $approved = $customerApprovalService->approveAccountOpeningRequest($accountOpeningRequest, $request->user()->id);
                } catch (RuntimeException $exception) {
                    return back()->with('error', $exception->getMessage());
                }

                $auditLogService->log($request, 'bank_account_created', $approved['account'], 'Bank account ensured during account approval.', [
                    'account_opening_request_id' => $accountOpeningRequest->id,
                ]);
                $auditLogService->log($request, 'account_opening_approved', $accountOpeningRequest->refresh(), 'Request approved and customer dashboard access enabled.');

                return back()->with('success', 'Request approved. Customer access, profile, bank account, and card are active.');
            }
        )->name('account-opening-requests.approve');

        Route::post('/account-opening-requests/{accountOpeningRequest}/bank-account',
            function (Request $request, AccountOpeningRequest $accountOpeningRequest, CustomerApprovalService $customerApprovalService, AuditLogService $auditLogService) {
                if (! in_array($accountOpeningRequest->status, ['approved', 'account_created'])) {
                    return back()->with('error', 'Request must be approved before creating a bank account.');
                }

                try {
                    $approved = $customerApprovalService->approveAccountOpeningRequest($accountOpeningRequest, $request->user()->id);
                } catch (RuntimeException $exception) {
                    return back()->with('error', $exception->getMessage());
                }

                $auditLogService->log($request, 'bank_account_created', $approved['account'], 'Bank account and card ensured.', [
                    'account_opening_request_id' => $accountOpeningRequest->id,
                ]);

                return back()->with('success', 'Customer access, bank account, and card are active.');
            }
        )->name('account-opening-requests.bank-account');

        // Transfers
        Route::patch('/transfers/{transferRequest}/complete',
            function (Request $request, TransferRequest $transferRequest, AuditLogService $auditLogService) {
                $transferRequest->load(['sourceAccount.user', 'beneficiary']);
                $account = $transferRequest->sourceAccount;
                $total = $transferRequest->amount + $transferRequest->fee;
                if ($account->status !== 'active') {
                    return back()->with('error', 'Cannot complete transfer — account is not active.');
                }
                if ($account->balance < $total) {
                    return back()->with('error', 'Cannot complete transfer — insufficient balance.');
                }
                DB::transaction(function () use ($request, $transferRequest, $account, $total, $auditLogService) {
                    $newBalance = $account->balance - $total;
                    $account->update(['balance' => $newBalance]);
                    AccountTransaction::create([
                        'bank_account_id' => $account->id,
                        'reference' => 'TXN-'.strtoupper(Str::random(10)),
                        'type' => 'transfer',
                        'direction' => 'out',
                        'amount' => $total,
                        'balance_after' => $newBalance,
                        'description' => 'Transfer to '.($transferRequest->beneficiary->full_name ?? 'beneficiary'),
                        'status' => 'completed',
                        'performed_at' => now(),
                    ]);
                    $transferRequest->update([
                        'status' => 'completed', 'processed_by' => $request->user()->id,
                        'processed_at' => now(), 'completed_at' => now(),
                    ]);
                    $auditLogService->log($request, 'transfer_completed', $transferRequest, 'Transfer completed.', [
                        'amount' => $total, 'balance_after' => $newBalance,
                    ]);
                });

                return back()->with('success', 'Transfer completed successfully.');
            }
        )->name('transfers.complete');

        Route::patch('/beneficiaries/{beneficiary}/activate', [BeneficiaryController::class, 'activate'])
            ->name('beneficiaries.activate');
        Route::patch('/beneficiaries/{beneficiary}/reject', [BeneficiaryController::class, 'reject'])
            ->name('beneficiaries.reject');

        // ── ATM view routes (admin + employee) ───────────────────────────
        Route::get('/atms', [AtmController::class, 'index'])->name('atms.index');
        Route::get('/atms/{atm}', [AtmController::class, 'show'])->name('atms.show');
        Route::get('/atms/{atm}/cash-movements', [AtmController::class, 'cashMovements'])->name('atms.cash-movements');
        Route::get('/atms/{atm}/withdrawals', [AtmController::class, 'withdrawals'])->name('atms.withdrawals');
    });

// ── Admin-only ATM management routes ──────────────────────────────────────
Route::middleware(['auth', 'role.admin-only'])
    ->prefix('backend/admin')
    ->name('backend.admin.')
    ->group(function () {
        Route::patch('/atms/{atm}', [AtmController::class, 'update'])->name('atms.update');
        Route::post('/atms/{atm}/load-cash', [AtmController::class, 'loadCash'])->name('atms.load-cash');
    });
