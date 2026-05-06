<?php

namespace App\Services;

use App\Mail\BillPaymentFailedMail;
use App\Mail\BillPaymentReminderMail;
use App\Mail\BillPaymentSuccessMail;
use App\Models\AccountTransaction;
use App\Models\BankAccount;
use App\Models\BillPayment;
use App\Models\CustomerBill;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class BillPaymentService
{
    /**
     * @return array{ok: bool, payment?: BillPayment, reference?: string, error?: string}
     */
    public function pay(CustomerBill $bill, string $mode = 'manual'): array
    {
        $result = DB::transaction(function () use ($bill, $mode): array {
            $lockedBill = CustomerBill::query()
                ->with('user.profile')
                ->whereKey($bill->id)
                ->lockForUpdate()
                ->first();

            if (! $lockedBill) {
                return ['ok' => false, 'error' => 'Bill not found.'];
            }

            $user = $lockedBill->user;
            $account = BankAccount::query()
                ->whereKey($lockedBill->bank_account_id)
                ->lockForUpdate()
                ->first();

            $failure = $this->firstFailureReason($lockedBill, $user, $account);

            if ($failure) {
                $payment = $this->recordPayment($lockedBill, $account, 'failed', $failure);
                $this->advanceBillAfterAttempt($lockedBill, false, $mode);

                return ['ok' => false, 'payment' => $payment, 'error' => $failure];
            }

            $amountCents = $this->toCents($lockedBill->amount);
            $balanceCents = $this->toCents($account->balance);
            $minimumBalanceCents = $this->toCents($lockedBill->minimum_balance_after_payment);
            $balanceAfterCents = $balanceCents - $amountCents;

            if ($amountCents <= 0) {
                $payment = $this->recordPayment($lockedBill, $account, 'failed', 'Bill amount must be positive.');
                $this->advanceBillAfterAttempt($lockedBill, false, $mode);

                return ['ok' => false, 'payment' => $payment, 'error' => 'Bill amount must be positive.'];
            }

            if ($amountCents > $balanceCents) {
                $payment = $this->recordPayment($lockedBill, $account, 'failed', 'Insufficient balance.');
                $this->advanceBillAfterAttempt($lockedBill, false, $mode);

                return ['ok' => false, 'payment' => $payment, 'error' => 'Insufficient balance.'];
            }

            if ($balanceAfterCents < $minimumBalanceCents) {
                $payment = $this->recordPayment($lockedBill, $account, 'skipped', 'Minimum balance protection would be breached.');
                $this->advanceBillAfterAttempt($lockedBill, false, $mode);

                return ['ok' => false, 'payment' => $payment, 'error' => 'Minimum balance protection would be breached.'];
            }

            $reference = $this->uniqueBillReference();
            $amount = $this->fromCents($amountCents);
            $balanceAfter = $this->fromCents($balanceAfterCents);

            $account->update(['balance' => $balanceAfter]);

            AccountTransaction::create([
                'bank_account_id' => $account->id,
                'reference' => "{$reference}-OUT",
                'type' => 'bill_payment',
                'direction' => 'out',
                'amount' => $amount,
                'balance_after' => $balanceAfter,
                'description' => "{$lockedBill->label} bill payment to {$lockedBill->provider_name}",
                'status' => 'completed',
                'performed_at' => now(),
            ]);

            $payment = BillPayment::create([
                'customer_bill_id' => $lockedBill->id,
                'user_id' => $lockedBill->user_id,
                'bank_account_id' => $account->id,
                'amount' => $amount,
                'reference' => $reference,
                'status' => 'completed',
                'paid_at' => now(),
            ]);

            $this->advanceBillAfterAttempt($lockedBill, true, $mode);

            return [
                'ok' => true,
                'payment' => $payment,
                'reference' => $reference,
                'remaining_balance' => $balanceAfter,
            ];
        });

        $freshBill = $bill->fresh(['user', 'bankAccount']);

        if (($result['ok'] ?? false) && $freshBill?->user) {
            Mail::to($freshBill->user->email)->send(new BillPaymentSuccessMail(
                $freshBill,
                $result['payment'],
                (string) ($result['remaining_balance'] ?? '')
            ));
        }

        if (! ($result['ok'] ?? false) && $mode === 'autopay' && $freshBill?->user && isset($result['payment'])) {
            Mail::to($freshBill->user->email)->send(new BillPaymentFailedMail(
                $freshBill,
                $result['payment'],
                $result['error'] ?? 'AutoPay could not process this bill.'
            ));
        }

        return $result;
    }

    public function sendReminder(CustomerBill $bill): void
    {
        $bill->loadMissing(['user', 'bankAccount']);

        if (! $bill->user) {
            return;
        }

        Mail::to($bill->user->email)->send(new BillPaymentReminderMail($bill));
        $bill->forceFill(['reminder_sent_at' => now()])->save();
    }

    public function shouldSendReminder(CustomerBill $bill): bool
    {
        return ! $bill->reminder_sent_at || $bill->reminder_sent_at->lt($bill->next_due_at);
    }

    private function firstFailureReason(CustomerBill $bill, ?User $user, ?BankAccount $account): ?string
    {
        if (! $user || $user->profile?->status !== 'verified') {
            return 'Customer is not verified.';
        }

        if ($bill->status !== 'active') {
            return 'Bill is not active.';
        }

        if (! $account || $account->user_id !== $bill->user_id) {
            return 'Bank account is unavailable.';
        }

        if ($account->status !== 'active') {
            return 'Bank account is not active.';
        }

        return null;
    }

    private function recordPayment(CustomerBill $bill, ?BankAccount $account, string $status, string $reason): BillPayment
    {
        return BillPayment::create([
            'customer_bill_id' => $bill->id,
            'user_id' => $bill->user_id,
            'bank_account_id' => $account?->id ?? $bill->bank_account_id,
            'amount' => $this->fromCents(max(0, $this->toCents($bill->amount))),
            'reference' => $this->uniqueBillReference(),
            'status' => $status,
            'failure_reason' => $reason,
            'paid_at' => null,
        ]);
    }

    private function advanceBillAfterAttempt(CustomerBill $bill, bool $paid, string $mode): void
    {
        if ($paid) {
            $bill->last_paid_at = now();
        }

        if ($bill->frequency === 'one_time') {
            if ($paid) {
                $bill->status = 'cancelled';
            }

            $bill->save();

            return;
        }

        if ($paid || $mode === 'autopay') {
            $bill->next_due_at = $this->nextDueAt($bill->next_due_at, $bill->frequency);
            $bill->reminder_sent_at = null;
            $bill->save();
        }
    }

    private function nextDueAt(CarbonInterface $currentDueAt, string $frequency): CarbonInterface
    {
        return match ($frequency) {
            'weekly' => $currentDueAt->copy()->addWeek(),
            'monthly' => $currentDueAt->copy()->addMonthNoOverflow(),
            default => $currentDueAt,
        };
    }

    private function uniqueBillReference(): string
    {
        do {
            $reference = 'BILL-'.now()->format('YmdHis').'-'.Str::upper(Str::random(6));
        } while (
            BillPayment::where('reference', $reference)->exists()
            || AccountTransaction::where('reference', "{$reference}-OUT")->exists()
        );

        return $reference;
    }

    private function toCents(string|int|float|null $amount): int
    {
        $normalized = str_replace(',', '', trim((string) ($amount ?? 0)));
        [$dirhams, $cents] = array_pad(explode('.', $normalized, 2), 2, '0');
        $cents = str_pad(substr($cents, 0, 2), 2, '0');

        return ((int) $dirhams * 100) + (int) $cents;
    }

    private function fromCents(int $cents): string
    {
        return intdiv($cents, 100).'.'.str_pad((string) abs($cents % 100), 2, '0', STR_PAD_LEFT);
    }
}
