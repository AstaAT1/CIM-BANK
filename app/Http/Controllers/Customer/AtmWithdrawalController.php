<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\AccountTransaction;
use App\Models\Atm;
use App\Models\AtmCashMovement;
use App\Models\AtmWithdrawal;
use App\Models\BankAccount;
use App\Services\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AtmWithdrawalController extends Controller
{
    public function store(Request $request, AuditLogService $auditLogService): RedirectResponse
    {
        // ── Step 1: Input validation ──────────────────────────────────────────
        $validated = $request->validate([
            'atm_id'          => ['required', 'integer', 'exists:atms,id'],
            'bank_account_id' => ['required', 'integer', 'exists:bank_accounts,id'],
            'amount'          => ['required', 'numeric', 'min:0.01'],
        ]);

        $user    = $request->user();
        $amount  = (float) $validated['amount'];

        // ── Step 2: Atomic transaction with row-level balance checks ──────────
        $result = DB::transaction(function () use ($user, $validated, $amount, $request, $auditLogService) {
            $atm = Atm::whereKey($validated['atm_id'])->lockForUpdate()->firstOrFail();
            $bankAccount = BankAccount::whereKey($validated['bank_account_id'])->lockForUpdate()->firstOrFail();

            if ($bankAccount->user_id !== $user->id) {
                return ['errors' => ['bank_account_id' => 'This bank account does not belong to you.']];
            }

            if ($bankAccount->status !== 'active') {
                return ['errors' => ['bank_account_id' => 'Your bank account is not active.']];
            }

            if (! $atm->is_active) {
                return ['errors' => ['atm_id' => 'This ATM is currently out of service.']];
            }

            if (in_array($atm->status, ['empty', 'out_of_service'], true)) {
                return [
                    'errors' => [
                        'atm_id' => match ($atm->status) {
                            'empty'          => 'This ATM has no cash available.',
                            'out_of_service' => 'This ATM is out of service.',
                            default          => 'This ATM is not available.',
                        },
                    ],
                ];
            }

            if ($amount > (float) $bankAccount->balance) {
                return [
                    'errors' => [
                        'amount' => sprintf(
                            'Insufficient balance. Your account has %.2f MAD.',
                            $bankAccount->balance
                        ),
                    ],
                ];
            }

            if ($amount > (float) $atm->current_cash) {
                return [
                    'errors' => [
                        'amount' => sprintf(
                            'The ATM only has %.2f MAD available.',
                            $atm->current_cash
                        ),
                    ],
                ];
            }

            $cashBefore    = (float) $atm->current_cash;
            $balanceBefore = (float) $bankAccount->balance;
            $cashAfter     = $cashBefore - $amount;
            $balanceAfter  = $balanceBefore - $amount;

            // 4a. Debit bank account
            $bankAccount->update(['balance' => $balanceAfter]);

            // 4b. Deduct cash from ATM
            $newStatus = match (true) {
                $cashAfter <= 0                                              => 'empty',
                $cashAfter < ((float) $atm->max_capacity * 0.20)            => 'low_cash',
                default                                                      => 'active',
            };

            $atm->update([
                'current_cash' => $cashAfter,
                'status'       => $newStatus,
            ]);

            // 4c. Record ATM withdrawal
            $withdrawal = AtmWithdrawal::create([
                'atm_id'          => $atm->id,
                'user_id'         => $user->id,
                'bank_account_id' => $bankAccount->id,
                'amount'          => $amount,
                'status'          => 'completed',
                'note'            => "Withdrawal of {$amount} MAD at {$atm->name} ({$atm->code})",
            ]);

            // 4d. Record ATM cash movement
            AtmCashMovement::create([
                'atm_id'        => $atm->id,
                'admin_user_id' => null, // customer action, not admin
                'type'          => 'withdrawal',
                'amount'        => $amount,
                'cash_before'   => $cashBefore,
                'cash_after'    => $cashAfter,
                'note'          => "Customer withdrawal by user #{$user->id}",
            ]);

            // 4e. Record bank account transaction
            AccountTransaction::create([
                'bank_account_id' => $bankAccount->id,
                'reference'       => 'ATM-' . strtoupper(Str::random(10)),
                'type'            => 'withdrawal',
                'direction'       => 'out',
                'amount'          => $amount,
                'balance_after'   => $balanceAfter,
                'description'     => "ATM withdrawal at {$atm->name} ({$atm->code}), {$atm->area}",
                'status'          => 'completed',
                'performed_at'    => now(),
            ]);

            // 4f. Audit log
            $auditLogService->log(
                $request,
                'atm_withdrawal',
                $withdrawal,
                "Customer withdrew {$amount} MAD from ATM {$atm->code}.",
                [
                    'atm_id'          => $atm->id,
                    'atm_code'        => $atm->code,
                    'bank_account_id' => $bankAccount->id,
                    'amount'          => $amount,
                    'balance_after'   => $balanceAfter,
                    'atm_cash_after'  => $cashAfter,
                ]
            );

            return [
                'withdrawal' => $withdrawal,
                'atm_name' => $atm->name,
            ];
        });

        if (isset($result['errors'])) {
            return back()->withErrors($result['errors']);
        }

        return back()->with('success', sprintf(
            'Withdrawal of %.2f MAD from %s was successful.',
            $amount,
            $result['atm_name']
        ));
    }
}
