<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\AccountTransaction;
use App\Models\CustomerBill;
use Carbon\Carbon;
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

        $accounts = $user->bankAccounts()
            ->latest('opened_at')
            ->latest()
            ->get();

        $account = $user->bankAccounts()
            ->where('status', 'active')
            ->latest('opened_at')
            ->latest()
            ->first()
            ?? $accounts->first();

        $card = $account
            ? $user->bankCards()
                ->where('bank_account_id', $account->id)
                ->where('status', 'active')
                ->latest()
                ->first()
            : null;

        $card ??= $user->bankCards()
            ->where('status', 'active')
            ->latest()
            ->first()
            ?? $user->bankCards()->latest()->first();

        $accountIds = $accounts->pluck('id');
        $currency = $account?->currency ?? 'MAD';
        $monthlyActivity = $this->monthlyActivity($accountIds);
        $recentTransactions = $this->latestActivity($accountIds, $currency);
        $balanceChart = $this->balanceTimeline($account);
        $activeAccounts = $accounts->where('status', 'active')->count();
        $activeCards = $user->bankCards()->where('status', 'active')->count();
        $securityLevel = $this->securityLevel($user);
        $accountSummary = $this->accountSummary($account);
        $latestCard = $this->cardSummary($card);

        return Inertia::render('dashboard', [
            'customer' => [
                'name' => $user->name,
                'first_name' => $user->profile?->first_name,
                'email' => $user->email,
                'verification_status' => $user->profile?->status ?? 'none',
                'city' => $user->profile?->city,
            ],
            'profile' => [
                'status' => $user->profile?->status ?? 'none',
                'city' => $user->profile?->city,
                'verified_at' => $user->profile?->verified_at?->toIso8601String(),
            ],
            'account' => $accountSummary,
            'accountSummary' => $accountSummary,
            'card' => $latestCard,
            'latestCard' => $latestCard,
            'transactions' => $recentTransactions,
            'recentTransactions' => $recentTransactions,
            'balanceChart' => $balanceChart,
            'stats' => [
                'activeAccounts' => $activeAccounts,
                'activeCards' => $activeCards,
                'monthlyActivity' => $monthlyActivity,
                'securityLevel' => $securityLevel,
            ],
            'summary' => [
                'active_accounts' => $activeAccounts,
                'active_cards' => $activeCards,
                'monthly_activity' => $monthlyActivity,
                'security_level' => $securityLevel,
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
    private function accountSummary($account): ?array
    {
        if (! $account) {
            return null;
        }

        return [
            'id' => $account->id,
            'account_number' => $this->maskValue($account->account_number),
            'account_number_last4' => $this->lastFour($account->account_number),
            'rib' => $this->maskValue($account->rib, 6, 4),
            'rib_last4' => $this->lastFour($account->rib),
            'account_type' => $account->account_type,
            'balance' => (float) $account->balance,
            'currency' => $account->currency,
            'status' => $account->status,
            'opened_at' => $account->opened_at?->toIso8601String(),
        ];
    }

    private function cardSummary($card): ?array
    {
        if (! $card) {
            return null;
        }

        return [
            'card_holder_name' => $card->card_holder_name,
            'masked_card_number' => $card->masked_card_number,
            'card_number_last4' => $card->card_number_last4,
            'expiry_date' => $card->expiry_formatted,
            'status' => $card->status,
        ];
    }

    /**
     * @param  Collection<int, int>  $accountIds
     * @return array<int, array<string, mixed>>
     */
    private function latestActivity(Collection $accountIds, string $currency): array
    {
        if ($accountIds->isEmpty()) {
            return [];
        }

        return AccountTransaction::query()
            ->whereIn('bank_account_id', $accountIds)
            ->latest('performed_at')
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn ($transaction): array => [
                'id' => 'transaction-'.$transaction->id,
                'reference' => $transaction->reference,
                'type' => $transaction->type,
                'label' => $this->activityLabel($transaction->type),
                'description' => $transaction->description,
                'direction' => $this->normalizedDirection($transaction->direction, $transaction->type),
                'amount' => (float) $transaction->amount,
                'currency' => $currency,
                'status' => $transaction->status,
                'balance_after' => (float) $transaction->balance_after,
                'occurred_at' => ($transaction->performed_at ?? $transaction->created_at)?->toIso8601String(),
            ])
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

    /**
     * @param  Collection<int, int>  $accountIds
     */
    private function monthlyActivity(Collection $accountIds): float
    {
        if ($accountIds->isEmpty()) {
            return 0.0;
        }

        $start = now()->startOfMonth();
        $end = now()->endOfMonth();

        return (float) AccountTransaction::query()
            ->whereIn('bank_account_id', $accountIds)
            ->where('status', 'completed')
            ->whereBetween('performed_at', [$start, $end])
            ->sum('amount');
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function balanceTimeline($account): array
    {
        if (! $account) {
            return [];
        }

        $transactions = AccountTransaction::query()
            ->where('bank_account_id', $account->id)
            ->where('status', 'completed')
            ->latest('performed_at')
            ->latest()
            ->limit(120)
            ->get()
            ->sortBy(fn ($transaction) => ($transaction->performed_at ?? $transaction->created_at)?->getTimestamp() ?? 0)
            ->values();

        if ($transactions->isEmpty()) {
            return [];
        }

        $currentBalance = (float) $account->balance;
        $signedTotal = $transactions->sum(fn ($transaction): float => $this->signedAmount($transaction));
        $runningBalance = $currentBalance - $signedTotal;

        return $transactions
            ->map(function ($transaction) use (&$runningBalance): array {
                $runningBalance += $this->signedAmount($transaction);
                $performedAt = $transaction->performed_at ?? $transaction->created_at ?? Carbon::now();

                return [
                    'date' => $performedAt->toDateString(),
                    'label' => $performedAt->format('M d'),
                    'balance' => round($runningBalance, 2),
                    'amount' => (float) $transaction->amount,
                    'direction' => $this->normalizedDirection($transaction->direction, $transaction->type),
                    'type' => $transaction->type,
                    'reference' => $transaction->reference,
                ];
            })
            ->all();
    }

    private function signedAmount(AccountTransaction $transaction): float
    {
        $amount = abs((float) $transaction->amount);

        return $this->normalizedDirection($transaction->direction, $transaction->type) === 'out'
            ? -$amount
            : $amount;
    }

    private function normalizedDirection(?string $direction, ?string $type = null): string
    {
        $direction = strtolower((string) $direction);
        $type = strtolower((string) $type);

        if (in_array($direction, ['in', 'incoming', 'credit', 'deposit'], true)) {
            return 'in';
        }

        if (in_array($direction, ['out', 'outgoing', 'debit', 'withdrawal'], true)) {
            return 'out';
        }

        return match ($type) {
            'deposit', 'atm_deposit', 'salary', 'transfer_in', 'credit' => 'in',
            'withdrawal', 'atm', 'atm_withdrawal', 'transfer', 'transfer_out', 'bill_payment', 'card_payment', 'fee', 'debit' => 'out',
            default => 'out',
        };
    }

    private function securityLevel($user): string
    {
        if ($user->two_factor_confirmed_at) {
            return 'strong';
        }

        if (($user->profile?->status ?? null) === 'verified') {
            return 'verified';
        }

        return $user->profile?->status ?? 'pending';
    }

    private function activityLabel(string $type): string
    {
        return match ($type) {
            'atm', 'withdrawal' => 'ATM withdrawal',
            'atm_deposit' => 'ATM Deposit',
            'deposit', 'salary' => 'Deposit',
            'transfer_in' => 'Incoming transfer',
            'transfer_out' => 'Outgoing transfer',
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

    private function maskValue(?string $value, int $visibleStart = 4, int $visibleEnd = 4): ?string
    {
        if (! $value) {
            return null;
        }

        $length = strlen($value);

        if ($length <= $visibleStart + $visibleEnd) {
            return str_repeat('*', max(0, $length - $visibleEnd)).substr($value, -$visibleEnd);
        }

        return substr($value, 0, $visibleStart)
            .str_repeat('*', $length - $visibleStart - $visibleEnd)
            .substr($value, -$visibleEnd);
    }

    private function lastFour(?string $value): ?string
    {
        if (! $value) {
            return null;
        }

        return substr($value, -4);
    }
}
