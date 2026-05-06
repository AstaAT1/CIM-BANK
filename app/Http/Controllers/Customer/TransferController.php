<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\AccountTransaction;
use App\Models\BankAccount;
use App\Models\Beneficiary;
use App\Models\TransferRequest;
use App\Services\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class TransferController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $accounts = $user->bankAccounts()
            ->where('status', 'active')
            ->latest('opened_at')
            ->latest()
            ->get()
            ->map(fn (BankAccount $account): array => [
                'id' => $account->id,
                'account_number' => $account->account_number,
                'rib' => $account->rib,
                'account_type' => $account->account_type,
                'balance' => (float) $account->balance,
                'currency' => $account->currency,
                'status' => $account->status,
            ]);

        $beneficiaries = $user->beneficiaries()
            ->with('linkedBankAccount:id,user_id,account_number,rib,status')
            ->where('status', 'active')
            ->whereHas('linkedBankAccount', fn ($query) => $query->where('status', 'active'))
            ->latest()
            ->get()
            ->map(fn (Beneficiary $beneficiary): array => [
                'id' => $beneficiary->id,
                'full_name' => $beneficiary->full_name,
                'bank_name' => $beneficiary->bank_name ?: 'CIM Bank',
                'rib' => $beneficiary->rib,
                'account_number' => $beneficiary->account_number,
                'status' => $beneficiary->status,
                'linked_bank_account_id' => $beneficiary->linked_bank_account_id,
                'linked_account_status' => $beneficiary->linkedBankAccount?->status,
                'transfers_available' => $beneficiary->status === 'active'
                    && $beneficiary->linkedBankAccount?->status === 'active',
            ]);

        $accountIds = $user->bankAccounts()->pluck('id');

        $recentTransfers = TransferRequest::query()
            ->with(['beneficiary:id,full_name,rib,account_number', 'receiverAccount:id,account_number,rib'])
            ->where(function ($query) use ($user, $accountIds) {
                $query->where('sender_user_id', $user->id)
                    ->orWhere('receiver_user_id', $user->id)
                    ->orWhereIn('from_account_id', $accountIds);
            })
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn (TransferRequest $transfer): array => [
                'id' => $transfer->id,
                'reference' => $transfer->reference,
                'beneficiary_name' => $transfer->beneficiary?->full_name,
                'amount' => (float) $transfer->amount,
                'currency' => $transfer->currency ?: 'MAD',
                'status' => $transfer->status,
                'direction' => $transfer->sender_user_id === $user->id || $accountIds->contains($transfer->from_account_id)
                    ? 'out'
                    : 'in',
                'note' => $transfer->note ?? $transfer->reason,
                'completed_at' => $transfer->completed_at?->toIso8601String(),
                'created_at' => $transfer->created_at?->toIso8601String(),
            ]);

        return Inertia::render('customer/transfers/index', [
            'accounts' => $accounts,
            'beneficiaries' => $beneficiaries,
            'recentTransfers' => $recentTransfers,
        ]);
    }

    public function store(Request $request, AuditLogService $auditLogService): RedirectResponse
    {
        $validated = $request->validate([
            'from_account_id' => ['required', 'integer', 'exists:bank_accounts,id'],
            'beneficiary_id' => ['required', 'integer', 'exists:beneficiaries,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'note' => ['nullable', 'string', 'max:500'],
        ]);

        $user = $request->user();
        $amountCents = $this->toCents($validated['amount']);

        $result = DB::transaction(function () use ($validated, $user, $amountCents, $request, $auditLogService) {
            $beneficiary = Beneficiary::query()
                ->whereKey($validated['beneficiary_id'])
                ->where('user_id', $user->id)
                ->lockForUpdate()
                ->first();

            if (! $beneficiary) {
                return ['errors' => ['beneficiary_id' => 'This beneficiary does not belong to you.']];
            }

            if ($beneficiary->status !== 'active') {
                return ['errors' => ['beneficiary_id' => 'Only active beneficiaries can receive transfers.']];
            }

            if (! $beneficiary->linked_bank_account_id) {
                return ['errors' => ['beneficiary_id' => 'This beneficiary is not linked to an active CIM account.']];
            }

            $senderAccountId = (int) $validated['from_account_id'];
            $receiverAccountId = (int) $beneficiary->linked_bank_account_id;

            $accounts = BankAccount::query()
                ->whereIn('id', [$senderAccountId, $receiverAccountId])
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $sender = $accounts->get($senderAccountId);
            $receiver = $accounts->get($receiverAccountId);

            if (! $sender || $sender->user_id !== $user->id) {
                return ['errors' => ['from_account_id' => 'This bank account does not belong to you.']];
            }

            if (! $receiver) {
                return ['errors' => ['beneficiary_id' => 'The receiver CIM account could not be found.']];
            }

            if ($sender->status !== 'active') {
                return ['errors' => ['from_account_id' => 'Your sender bank account is not active.']];
            }

            if ($receiver->status !== 'active') {
                return ['errors' => ['beneficiary_id' => 'The receiver bank account is not active.']];
            }

            if ($sender->id === $receiver->id || $sender->user_id === $receiver->user_id) {
                return ['errors' => ['beneficiary_id' => 'You cannot transfer money to yourself.']];
            }

            $senderBalanceCents = $this->toCents($sender->balance);
            $receiverBalanceCents = $this->toCents($receiver->balance);

            if ($amountCents > $senderBalanceCents) {
                return ['errors' => ['amount' => 'Insufficient balance for this transfer.']];
            }

            $reference = $this->uniqueTransferReference();
            $senderBalanceAfter = $this->fromCents($senderBalanceCents - $amountCents);
            $receiverBalanceAfter = $this->fromCents($receiverBalanceCents + $amountCents);
            $amount = $this->fromCents($amountCents);
            $note = $validated['note'] ?? null;

            $sender->update(['balance' => $senderBalanceAfter]);
            $receiver->update(['balance' => $receiverBalanceAfter]);

            $description = $note ?: "Internal CIM transfer {$reference}";

            AccountTransaction::create([
                'bank_account_id' => $sender->id,
                'reference' => "{$reference}-OUT",
                'type' => 'transfer',
                'direction' => 'out',
                'amount' => $amount,
                'balance_after' => $senderBalanceAfter,
                'description' => $description,
                'status' => 'completed',
                'performed_at' => now(),
            ]);

            AccountTransaction::create([
                'bank_account_id' => $receiver->id,
                'reference' => "{$reference}-IN",
                'type' => 'transfer',
                'direction' => 'in',
                'amount' => $amount,
                'balance_after' => $receiverBalanceAfter,
                'description' => $description,
                'status' => 'completed',
                'performed_at' => now(),
            ]);

            $transfer = TransferRequest::create([
                'from_account_id' => $sender->id,
                'beneficiary_id' => $beneficiary->id,
                'sender_user_id' => $sender->user_id,
                'receiver_user_id' => $receiver->user_id,
                'sender_bank_account_id' => $sender->id,
                'receiver_bank_account_id' => $receiver->id,
                'reference' => $reference,
                'amount' => $amount,
                'fee' => 0,
                'currency' => 'MAD',
                'transfer_type' => 'internal',
                'status' => 'completed',
                'note' => $note,
                'reason' => $note,
                'processed_at' => now(),
                'completed_at' => now(),
            ]);

            $auditLogService->log($request, 'internal_transfer_completed', $transfer, 'Internal CIM transfer completed.', [
                'reference' => $reference,
                'sender_bank_account_id' => $sender->id,
                'receiver_bank_account_id' => $receiver->id,
                'amount' => $amount,
            ]);

            return ['transfer' => $transfer, 'reference' => $reference];
        });

        if (isset($result['errors'])) {
            return back()->withErrors($result['errors'])->withInput();
        }

        return back()->with('success', "Transfer completed. Reference: {$result['reference']}");
    }

    private function uniqueTransferReference(): string
    {
        do {
            $reference = 'TRF-'.now()->format('YmdHis').'-'.Str::upper(Str::random(6));
        } while (TransferRequest::where('reference', $reference)->exists());

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
        return intdiv($cents, 100).'.'.str_pad((string) abs($cents % 100), 2, '0', STR_PAD_LEFT);
    }
}
