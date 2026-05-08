<?php

namespace App\Services;

use App\Models\BillPayment;
use App\Models\Machrou3iApplication;
use Illuminate\Support\Facades\Schema;

class Machrou3iRiskService
{
    /**
     * @return array{
     *     risk_score:int,
     *     risk_level:string,
     *     suggested_amount:float,
     *     suggested_monthly_installment:float,
     *     monthly_obligations:float,
     *     safe_remaining_income:float,
     *     debt_to_income_ratio:float,
     *     current_balance:float,
     *     reasons:array<int, string>
     * }
     */
    public function score(Machrou3iApplication $application): array
    {
        $application->loadMissing(['user.profile', 'bankAccount.transactions', 'user.customerBills']);

        $user = $application->user;
        $account = $application->bankAccount;
        $monthlySalary = (float) $application->monthly_salary;
        $requestedAmount = (float) $application->requested_amount;
        $expectedProfit = (float) $application->expected_monthly_profit;
        $repaymentMonths = max(1, (int) $application->repayment_months);
        $currentBalance = (float) ($account?->balance ?? 0);
        $monthlyObligations = $this->monthlyObligations($application);
        $estimatedInstallment = $requestedAmount / $repaymentMonths;
        $safeRemainingIncome = max(0, ($monthlySalary * 0.6) - $monthlyObligations);
        $debtToIncomeRatio = $monthlySalary > 0 ? $monthlyObligations / $monthlySalary : 1;
        $failedPaymentsExist = $this->failedPaymentsExist($application);
        $hasPositiveTransactionHistory = $this->hasPositiveTransactionHistory($application);

        $score = 50;
        $reasons = [];

        $this->addWhen($score, $reasons, $user?->profile?->status === 'verified', 10, 'Customer profile is verified.');
        $this->addWhen($score, $reasons, $account?->status === 'active', 10, 'Bank account is active.');
        $this->addWhen($score, $reasons, filled($application->salary_proof_path), 10, 'Salary proof was uploaded.');
        $this->addWhen($score, $reasons, $monthlySalary >= 5000, 10, 'Monthly salary is at least 5000 MAD.');
        $this->addWhen($score, $reasons, $expectedProfit >= $estimatedInstallment, 10, 'Expected profit covers the estimated installment.');
        $this->addWhen($score, $reasons, $currentBalance >= 1000, 5, 'Current balance is at least 1000 MAD.');
        $this->addWhen($score, $reasons, ! $failedPaymentsExist, 5, 'No failed or skipped bill payments were found.');
        $this->addWhen($score, $reasons, $hasPositiveTransactionHistory, 5, 'Positive transaction history is present.');
        $this->addWhen($score, $reasons, (bool) $application->has_experience_in_field, 5, 'Customer has experience in the project field.');

        $this->subtractWhen($score, $reasons, $monthlySalary > 0 && $requestedAmount > $monthlySalary * 8, 15, 'Requested amount is above eight months of salary.');
        $this->subtractWhen($score, $reasons, $currentBalance < 500, 10, 'Current balance is below 500 MAD.');
        $this->subtractWhen($score, $reasons, $debtToIncomeRatio >= 0.35, 10, 'Monthly obligations are high versus salary.');
        $this->subtractWhen($score, $reasons, $expectedProfit < $estimatedInstallment, 10, 'Expected profit is below the estimated installment.');
        $this->subtractWhen($score, $reasons, $failedPaymentsExist, 10, 'Failed or skipped bill payments were found.');
        $this->subtractWhen($score, $reasons, ! $application->has_experience_in_field, 5, 'Customer has no prior experience in the project field.');

        $score = max(0, min(100, $score));
        $riskLevel = match (true) {
            $score >= 75 => 'low',
            $score >= 50 => 'medium',
            default => 'high',
        };

        $affordableByIncome = $safeRemainingIncome * $repaymentMonths;
        $affordableByProfit = max(0, $expectedProfit * 0.8 * $repaymentMonths);
        $salaryCap = $monthlySalary * ($riskLevel === 'high' ? 4 : 8);
        $suggestedAmount = min($requestedAmount, max(0, $affordableByIncome), max(0, $affordableByProfit), max(0, $salaryCap));

        if ($riskLevel === 'high') {
            $suggestedAmount = min($suggestedAmount, $requestedAmount * 0.6);
        }

        $suggestedAmount = round(max(0, $suggestedAmount), 2);

        return [
            'risk_score' => $score,
            'risk_level' => $riskLevel,
            'suggested_amount' => $suggestedAmount,
            'suggested_monthly_installment' => round($suggestedAmount / $repaymentMonths, 2),
            'monthly_obligations' => round($monthlyObligations, 2),
            'safe_remaining_income' => round($safeRemainingIncome, 2),
            'debt_to_income_ratio' => round($debtToIncomeRatio, 4),
            'current_balance' => round($currentBalance, 2),
            'reasons' => $reasons,
        ];
    }

    public function storeSnapshot(Machrou3iApplication $application): array
    {
        $score = $this->score($application);

        $application->riskSnapshots()->create([
            'monthly_salary' => $application->monthly_salary,
            'current_balance' => $score['current_balance'],
            'monthly_obligations' => $score['monthly_obligations'],
            'safe_remaining_income' => $score['safe_remaining_income'],
            'requested_amount' => $application->requested_amount,
            'expected_profit' => $application->expected_monthly_profit,
            'debt_to_income_ratio' => $score['debt_to_income_ratio'],
            'risk_score' => $score['risk_score'],
            'risk_level' => $score['risk_level'],
            'suggested_amount' => $score['suggested_amount'],
            'suggested_monthly_installment' => $score['suggested_monthly_installment'],
            'reasons' => $score['reasons'],
        ]);

        $application->update([
            'risk_score' => $score['risk_score'],
            'risk_level' => $score['risk_level'],
            'suggested_amount' => $score['suggested_amount'],
            'suggested_monthly_installment' => $score['suggested_monthly_installment'],
        ]);

        return $score;
    }

    private function monthlyObligations(Machrou3iApplication $application): float
    {
        if (! Schema::hasTable('customer_bills')) {
            return 0;
        }

        return (float) $application->user
            ->customerBills()
            ->where('status', 'active')
            ->where('autopay_enabled', true)
            ->sum('amount');
    }

    private function failedPaymentsExist(Machrou3iApplication $application): bool
    {
        if (! Schema::hasTable('bill_payments')) {
            return false;
        }

        return BillPayment::query()
            ->where('user_id', $application->user_id)
            ->whereIn('status', ['failed', 'skipped'])
            ->exists();
    }

    private function hasPositiveTransactionHistory(Machrou3iApplication $application): bool
    {
        if (! Schema::hasTable('account_transactions')) {
            return false;
        }

        return $application->bankAccount
            ->transactions()
            ->where('status', 'completed')
            ->where('amount', '>', 0)
            ->exists();
    }

    private function addWhen(int &$score, array &$reasons, bool $condition, int $points, string $reason): void
    {
        if ($condition) {
            $score += $points;
            $reasons[] = "+{$points}: {$reason}";
        }
    }

    private function subtractWhen(int &$score, array &$reasons, bool $condition, int $points, string $reason): void
    {
        if ($condition) {
            $score -= $points;
            $reasons[] = "-{$points}: {$reason}";
        }
    }
}
