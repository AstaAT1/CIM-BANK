<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\AccountTransaction;
use App\Models\AtmWithdrawal;
use App\Models\CustomerBill;
use App\Models\TransferRequest;
use Carbon\CarbonInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $user->load('profile');

        $account = $user->bankAccounts()
            ->where('status', 'active')
            ->latest('opened_at')
            ->latest()
            ->first()
            ?? $user->bankAccounts()->latest()->first();

        $card = $account
            ? $user->bankCards()
                ->where('bank_account_id', $account->id)
                ->where('status', 'active')
                ->latest()
                ->first()
            : $user->bankCards()->where('status', 'active')->latest()->first();

        $accountIds = $user->bankAccounts()->pluck('id');

        return Inertia::render('dashboard', [
            'customer' => [
                'name' => $user->name,
                'first_name' => $user->profile?->first_name,
                'email' => $user->email,
                'verification_status' => $user->profile?->status ?? 'none',
                'city' => $user->profile?->city,
            ],
            'account' => $account ? [
                'id' => $account->id,
                'account_number' => $account->account_number,
                'rib' => $account->rib,
                'account_type' => $account->account_type,
                'balance' => (float) $account->balance,
                'currency' => $account->currency,
                'status' => $account->status,
                'opened_at' => $account->opened_at?->toIso8601String(),
            ] : null,
            'card' => $card ? [
                'card_holder_name' => $card->card_holder_name,
                'masked_card_number' => $card->masked_card_number,
                'expiry_date' => $card->expiry_formatted,
                'status' => $card->status,
            ] : null,
            'transactions' => $this->latestActivity($user->id, $accountIds),
            'summary' => [
                'active_accounts' => $user->bankAccounts()->where('status', 'active')->count(),
                'active_cards' => $user->bankCards()->where('status', 'active')->count(),
                'last_activity_at' => $this->lastActivityAt($accountIds)?->toIso8601String(),
                'upcoming_bill' => $this->upcomingBill($user->id),
                'machrou3i' => $this->latestMachrou3iApplication($user->id),
            ],
        ]);
    }

    /**
     * @param  Collection<int, int>  $accountIds
     * @return array<int, array<string, mixed>>
     */
    private function latestActivity(int $userId, Collection $accountIds): array
    {
        if ($accountIds->isEmpty()) {
            return [];
        }

        $accountTransactions = AccountTransaction::query()
            ->whereIn('bank_account_id', $accountIds)
            ->latest('performed_at')
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn ($transaction): array => [
                'id' => 'transaction-'.$transaction->id,
                'type' => $transaction->type,
                'label' => $this->activityLabel($transaction->type),
                'description' => $transaction->description,
                'direction' => $transaction->direction,
                'amount' => (float) $transaction->amount,
                'currency' => 'MAD',
                'status' => $transaction->status,
                'occurred_at' => ($transaction->performed_at ?? $transaction->created_at)?->toIso8601String(),
            ]);

        $atmWithdrawals = AtmWithdrawal::query()
            ->with('atm:id,code,name,area')
            ->where('user_id', $userId)
            ->whereIn('bank_account_id', $accountIds)
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (AtmWithdrawal $withdrawal): array => [
                'id' => 'atm-withdrawal-'.$withdrawal->id,
                'type' => 'atm_withdrawal',
                'label' => 'ATM withdrawal',
                'description' => $withdrawal->atm
                    ? "{$withdrawal->atm->name} - {$withdrawal->atm->area}"
                    : $withdrawal->note,
                'direction' => 'out',
                'amount' => (float) $withdrawal->amount,
                'currency' => 'MAD',
                'status' => $withdrawal->status,
                'occurred_at' => $withdrawal->created_at?->toIso8601String(),
            ]);

        $transfers = TransferRequest::query()
            ->with('beneficiary:id,full_name')
            ->whereIn('from_account_id', $accountIds)
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (TransferRequest $transfer): array => [
                'id' => 'transfer-'.$transfer->id,
                'type' => 'transfer_request',
                'label' => 'Transfer',
                'description' => $transfer->beneficiary?->full_name ?? $transfer->reason,
                'direction' => 'out',
                'amount' => (float) $transfer->amount + (float) $transfer->fee,
                'currency' => 'MAD',
                'status' => $transfer->status,
                'occurred_at' => ($transfer->completed_at ?? $transfer->processed_at ?? $transfer->created_at)?->toIso8601String(),
            ]);

        return $accountTransactions
            ->concat($atmWithdrawals)
            ->concat($transfers)
            ->sortByDesc('occurred_at')
            ->values()
            ->take(10)
            ->all();
    }

    /**
     * @param  Collection<int, int>  $accountIds
     */
    private function lastActivityAt(Collection $accountIds): ?CarbonInterface
    {
        if ($accountIds->isEmpty()) {
            return null;
        }

        return AccountTransaction::query()
            ->whereIn('bank_account_id', $accountIds)
            ->latest('performed_at')
            ->value('performed_at');
    }

    private function activityLabel(string $type): string
    {
        return match ($type) {
            'atm', 'withdrawal' => 'ATM withdrawal',
            'deposit', 'salary' => 'Deposit',
            'transfer' => 'Transfer',
            'card_payment' => 'Card payment',
            'bill_payment' => 'Bill payment',
            default => str($type)->replace('_', ' ')->title()->toString(),
        };
    }

    private function upcomingBill(int $userId): ?array
    {
        $bill = CustomerBill::query()
            ->where('user_id', $userId)
            ->where('status', 'active')
            ->orderBy('next_due_at')
            ->first();

        if (! $bill) {
            return null;
        }

        return [
            'label' => $bill->label,
            'provider_name' => $bill->provider_name,
            'amount' => (float) $bill->amount,
            'next_due_at' => $bill->next_due_at?->toIso8601String(),
            'autopay_enabled' => (bool) $bill->autopay_enabled,
        ];
    }

    private function latestMachrou3iApplication(int $userId): ?array
    {
        $application = \App\Models\Machrou3iApplication::query()
            ->where('user_id', $userId)
            ->latest()
            ->first();

        if (! $application) {
            return null;
        }

        return [
            'project_name' => $application->project_name,
            'status' => $application->status,
            'requested_amount' => (float) $application->requested_amount,
            'risk_level' => $application->risk_level,
        ];
    }
}
