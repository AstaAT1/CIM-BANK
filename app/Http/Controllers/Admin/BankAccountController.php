<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Services\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BankAccountController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/accounts', [
            'accounts' => BankAccount::with('user')->latest()->paginate(20),
            'statuses' => ['active', 'pending', 'frozen', 'closed'],
        ]);
    }

    public function freeze(Request $request, BankAccount $bankAccount, AuditLogService $auditLogService): RedirectResponse
    {
        $bankAccount->update(['status' => 'frozen']);
        $auditLogService->log($request, 'bank_account_frozen', $bankAccount, 'Bank account frozen.');

        return back()->with('success', 'Bank account frozen.');
    }

    public function activate(Request $request, BankAccount $bankAccount, AuditLogService $auditLogService): RedirectResponse
    {
        $bankAccount->update(['status' => 'active', 'closed_at' => null]);
        $auditLogService->log($request, 'bank_account_activated', $bankAccount, 'Bank account activated.');

        return back()->with('success', 'Bank account activated.');
    }

    public function close(Request $request, BankAccount $bankAccount, AuditLogService $auditLogService): RedirectResponse
    {
        $bankAccount->update(['status' => 'closed', 'closed_at' => now()]);
        $auditLogService->log($request, 'bank_account_closed', $bankAccount, 'Bank account closed.');

        return back()->with('success', 'Bank account closed.');
    }
}
