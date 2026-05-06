<?php

namespace App\Services;

use App\Models\AccountOpeningRequest;
use App\Models\BankAccount;
use App\Models\BankCard;

class BankAccountService
{
    private const LOCAL_TEST_INITIAL_BALANCE = 1000;

    /**
     * Ensure an approved customer has an active bank account and active card.
     *
     * @return array{account: BankAccount, card: BankCard}
     */
    public function ensureActiveAccountAndCard(AccountOpeningRequest $request): array
    {
        $account = BankAccount::query()
            ->where('user_id', $request->user_id)
            ->latest()
            ->first();

        if (! $account) {
            $account = $this->createFromAccountOpeningRequest($request);
            $account->refresh();

            return [
                'account' => $account,
                'card' => $account->activeBankCard()->firstOrFail(),
            ];
        }

        $account->update([
            'status' => 'active',
            'opened_at' => $account->opened_at ?? now(),
            'closed_at' => null,
        ]);

        $account->load('user');

        $card = BankCard::query()
            ->where('bank_account_id', $account->id)
            ->latest()
            ->first();

        if ($card) {
            $card->update(['status' => 'active']);
        } else {
            $card = (new BankCardService)->createForAccount($account);
        }

        return [
            'account' => $account->refresh(),
            'card' => $card->refresh(),
        ];
    }

    public function createFromAccountOpeningRequest(AccountOpeningRequest $request): BankAccount
    {
        $account = BankAccount::create([
            'user_id' => $request->user_id,
            'account_number' => $this->uniqueAccountNumber(),
            'rib' => $this->uniqueRib(),
            'account_type' => $request->account_type,
            'balance' => $this->initialBalance(),
            'currency' => 'MAD',
            'status' => 'active',
            'opened_at' => now(),
        ]);

        // Auto-generate a bank card for this account
        $account->load('user');
        (new BankCardService)->createForAccount($account);

        return $account;
    }

    private function initialBalance(): float
    {
        return app()->environment(['local', 'testing'])
            ? self::LOCAL_TEST_INITIAL_BALANCE
            : 0;
    }

    private function uniqueAccountNumber(): string
    {
        do {
            $accountNumber = 'MA'.now()->format('ymd').random_int(100000000000, 999999999999);
        } while (BankAccount::where('account_number', $accountNumber)->exists());

        return $accountNumber;
    }

    private function uniqueRib(): string
    {
        do {
            $rib = '01178'.str_pad((string) random_int(0, 999999999999999999), 18, '0', STR_PAD_LEFT);
        } while (BankAccount::where('rib', $rib)->exists());

        return $rib;
    }
}
