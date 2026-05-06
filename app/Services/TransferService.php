<?php

namespace App\Services;

use App\Models\AccountTransaction;
use App\Models\TransferRequest;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class TransferService
{
    public function complete(TransferRequest $transferRequest): TransferRequest
    {
        return DB::transaction(function () use ($transferRequest): TransferRequest {
            $transferRequest = TransferRequest::query()
                ->with('sourceAccount')
                ->lockForUpdate()
                ->findOrFail($transferRequest->id);

            if (! in_array($transferRequest->status, ['pending', 'processing'], true)) {
                throw new RuntimeException('Only pending or processing transfers can be completed.');
            }

            $account = $transferRequest->sourceAccount()->lockForUpdate()->firstOrFail();

            if ($account->status !== 'active') {
                throw new RuntimeException('The source bank account is not active.');
            }

            $balanceCents = $this->toCents($account->balance);
            $amountCents = $this->toCents($transferRequest->amount);
            $feeCents = $this->toCents($transferRequest->fee);
            $totalCents = $amountCents + $feeCents;

            if ($balanceCents < $totalCents) {
                throw new RuntimeException('The source bank account does not have enough balance.');
            }

            $newBalance = $this->fromCents($balanceCents - $totalCents);

            $account->update(['balance' => $newBalance]);

            AccountTransaction::create([
                'bank_account_id' => $account->id,
                'reference' => $this->uniqueTransactionReference(),
                'type' => 'transfer',
                'direction' => 'out',
                'amount' => $this->fromCents($totalCents),
                'balance_after' => $newBalance,
                'description' => sprintf(
                    'Transfer %s completed. Amount: %s MAD. Fee: %s MAD.',
                    $transferRequest->reference,
                    $this->fromCents($amountCents),
                    $this->fromCents($feeCents)
                ),
                'status' => 'completed',
                'performed_at' => now(),
            ]);

            $transferRequest->update([
                'status' => 'completed',
                'processed_at' => $transferRequest->processed_at ?? now(),
                'completed_at' => now(),
            ]);

            return $transferRequest->fresh(['sourceAccount', 'beneficiary']);
        });
    }

    private function uniqueTransactionReference(): string
    {
        do {
            $reference = 'TX-'.now()->format('YmdHis').'-'.random_int(1000, 9999);
        } while (AccountTransaction::where('reference', $reference)->exists());

        return $reference;
    }

    private function toCents(string|int|float $amount): int
    {
        $normalized = str_replace(',', '', trim((string) $amount));
        [$dirhams, $cents] = array_pad(explode('.', $normalized, 2), 2, '0');
        $cents = str_pad(substr($cents, 0, 2), 2, '0');

        return ((int) $dirhams * 100) + (int) $cents;
    }

    private function fromCents(int $cents): string
    {
        return intdiv($cents, 100).'.'.str_pad((string) ($cents % 100), 2, '0', STR_PAD_LEFT);
    }
}
