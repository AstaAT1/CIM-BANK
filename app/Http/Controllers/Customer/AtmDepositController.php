<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Atm;
use App\Models\BankAccount;
use App\Services\AtmTransactionService;
use App\Services\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AtmDepositController extends Controller
{
    private const MAX_SINGLE_DEPOSIT = 20000;

    public function store(
        Request $request,
        Atm $atm,
        AtmTransactionService $atmTransactionService,
        AuditLogService $auditLogService
    ): RedirectResponse {
        $validated = $request->validate([
            'bank_account_id' => ['required', 'integer', 'exists:bank_accounts,id'],
            'amount' => ['required', 'numeric', 'min:0.01', 'max:' . self::MAX_SINGLE_DEPOSIT],
        ], [
            'amount.max' => 'The maximum single ATM cash deposit is 20,000 MAD.',
        ]);

        $bankAccount = BankAccount::whereKey($validated['bank_account_id'])->firstOrFail();
        $amount = (float) $validated['amount'];

        $result = $atmTransactionService->deposit(
            $request->user(),
            $atm,
            $bankAccount,
            $amount,
            $request,
            $auditLogService
        );

        if (isset($result['errors'])) {
            return back()->withErrors($result['errors']);
        }

        return back()->with('success', 'Cash deposited successfully. Your account balance has been updated.');
    }
}
