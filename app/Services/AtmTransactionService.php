<?php

namespace App\Services;

use App\Models\AccountTransaction;
use App\Models\Atm;
use App\Models\AtmCashMovement;
use App\Models\BankAccount;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AtmTransactionService
{
    public function deposit(User $user, Atm $atm, BankAccount $bankAccount, float $amount, Request $request, AuditLogService $auditLogService): array
    {
        return DB::transaction(function () use ($user, $atm, $bankAccount, $amount, $request, $auditLogService) {
            $lockedAtm = Atm::whereKey($atm->id)->lockForUpdate()->firstOrFail();
            $lockedAccount = BankAccount::whereKey($bankAccount->id)->lockForUpdate()->firstOrFail();

            if (($user->profile?->status ?? null) !== 'verified') {
                return ['errors' => ['customer' => 'Your customer profile is not verified.']];
            }

            if ($lockedAccount->user_id !== $user->id) {
                return ['errors' => ['bank_account_id' => 'This bank account does not belong to you.']];
            }

            if ($lockedAccount->status !== 'active') {
                return ['errors' => ['bank_account_id' => 'Your bank account is not active.']];
            }

            if (! $lockedAtm->is_active || in_array($lockedAtm->status, ['out_of_service', 'maintenance'], true)) {
                return ['errors' => ['atm_id' => 'This ATM is currently out of service.']];
            }

            $cashBefore = (float) $lockedAtm->current_cash;
            $balanceBefore = (float) $lockedAccount->balance;
            $cashAfter = $cashBefore + $amount;
            $balanceAfter = $balanceBefore + $amount;

            $lockedAccount->update(['balance' => $balanceAfter]);

            $newStatus = match (true) {
                $cashAfter <= 0 => 'empty',
                $cashAfter < ((float) $lockedAtm->max_capacity * 0.20) => 'low_cash',
                default => 'active',
            };

            $lockedAtm->update([
                'current_cash' => $cashAfter,
                'status' => $newStatus,
            ]);

            AtmCashMovement::create([
                'atm_id' => $lockedAtm->id,
                'admin_user_id' => null,
                'type' => 'deposit',
                'amount' => $amount,
                'cash_before' => $cashBefore,
                'cash_after' => $cashAfter,
                'note' => "Customer deposit by user #{$user->id} into account #{$lockedAccount->id}",
            ]);

            $transaction = AccountTransaction::create([
                'bank_account_id' => $lockedAccount->id,
                'reference' => 'ATMD-' . strtoupper(Str::random(10)),
                'type' => 'atm_deposit',
                'direction' => 'in',
                'amount' => $amount,
                'balance_after' => $balanceAfter,
                'description' => "ATM cash deposit at {$lockedAtm->name} ({$lockedAtm->code}), {$lockedAtm->area}",
                'status' => 'completed',
                'performed_at' => now(),
            ]);

            $auditLogService->log(
                $request,
                'atm_deposit',
                $transaction,
                "Customer deposited {$amount} MAD at ATM {$lockedAtm->code}.",
                [
                    'atm_id' => $lockedAtm->id,
                    'atm_code' => $lockedAtm->code,
                    'bank_account_id' => $lockedAccount->id,
                    'amount' => $amount,
                    'balance_after' => $balanceAfter,
                    'atm_cash_after' => $cashAfter,
                ]
            );

            return [
                'transaction' => $transaction,
                'atm_name' => $lockedAtm->name,
                'balance_after' => $balanceAfter,
            ];
        });
    }
}
