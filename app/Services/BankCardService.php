<?php

namespace App\Services;

use App\Models\BankAccount;
use App\Models\BankCard;
use Illuminate\Support\Str;

class BankCardService
{
    /**
     * Generate a bank card for the given bank account.
     */
    public function createForAccount(BankAccount $account): BankCard
    {
        $cardNumber = $this->generateUniqueCardNumber();
        $last4 = substr($cardNumber, -4);
        $masked = $this->maskCardNumber($cardNumber);
        $expiry = now()->addYears(5);

        return BankCard::create([
            'user_id' => $account->user_id,
            'bank_account_id' => $account->id,
            'card_holder_name' => $account->user->name,
            'card_number_last4' => $last4,
            'masked_card_number' => $masked,
            'expiry_month' => $expiry->month,
            'expiry_year' => $expiry->year,
            'card_token' => Str::uuid()->toString(),
            'status' => 'active',
        ]);
    }

    private function generateUniqueCardNumber(): string
    {
        do {
            // Visa-like 16-digit number starting with 4
            $number = '4' . str_pad((string) random_int(0, 999999999999999), 15, '0', STR_PAD_LEFT);
        } while (BankCard::where('card_number_last4', substr($number, -4))
            ->where('masked_card_number', $this->maskCardNumber($number))
            ->exists());

        return $number;
    }

    private function maskCardNumber(string $number): string
    {
        $first4 = substr($number, 0, 4);
        $last4 = substr($number, -4);

        return "{$first4}  ****  ****  {$last4}";
    }
}
