<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Beneficiary;
use App\Services\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BeneficiaryController extends Controller
{
    public function index(Request $request): Response
    {
        $status = trim((string) $request->query('status', 'pending'));
        $search = trim((string) $request->query('search', ''));

        $beneficiaries = Beneficiary::query()
            ->with([
                'user:id,name,email',
                'linkedBankAccount:id,user_id,account_number,rib,status,balance,currency',
                'linkedBankAccount.user:id,name,email',
            ])
            ->when(in_array($status, ['pending', 'active', 'rejected'], true), fn ($query) => $query->where('status', $status))
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('full_name', 'like', "%{$search}%")
                        ->orWhere('rib', 'like', "%{$search}%")
                        ->orWhere('account_number', 'like', "%{$search}%")
                        ->orWhereRelation('user', 'name', 'like', "%{$search}%")
                        ->orWhereRelation('user', 'email', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Beneficiary $beneficiary): array => [
                'id' => $beneficiary->id,
                'full_name' => $beneficiary->full_name,
                'bank_name' => $beneficiary->bank_name ?: 'CIM Bank',
                'rib' => $beneficiary->rib,
                'account_number' => $beneficiary->account_number,
                'phone' => $beneficiary->phone,
                'status' => $beneficiary->status,
                'linked_bank_account_id' => $beneficiary->linked_bank_account_id,
                'verified_at' => $beneficiary->verified_at?->toIso8601String(),
                'created_at' => $beneficiary->created_at?->toIso8601String(),
                'owner' => [
                    'id' => $beneficiary->user?->id,
                    'name' => $beneficiary->user?->name,
                    'email' => $beneficiary->user?->email,
                ],
                'target_account' => $beneficiary->linkedBankAccount ? [
                    'id' => $beneficiary->linkedBankAccount->id,
                    'user_id' => $beneficiary->linkedBankAccount->user_id,
                    'owner_name' => $beneficiary->linkedBankAccount->user?->name,
                    'owner_email' => $beneficiary->linkedBankAccount->user?->email,
                    'account_number' => $beneficiary->linkedBankAccount->account_number,
                    'rib' => $beneficiary->linkedBankAccount->rib,
                    'status' => $beneficiary->linkedBankAccount->status,
                    'currency' => $beneficiary->linkedBankAccount->currency,
                ] : null,
            ]);

        return Inertia::render('admin/beneficiaries/index', [
            'beneficiaries' => $beneficiaries,
            'filters' => [
                'status' => $status,
                'search' => $search,
            ],
            'pendingCount' => Beneficiary::where('status', 'pending')->count(),
        ]);
    }

    public function activate(Request $request, Beneficiary $beneficiary, AuditLogService $auditLogService): RedirectResponse
    {
        $beneficiary->load('linkedBankAccount');

        if (! $beneficiary->linkedBankAccount) {
            return back()->with('error', 'This beneficiary cannot be activated because no CIM account is linked.');
        }

        if ($beneficiary->linkedBankAccount->status !== 'active') {
            return back()->with('error', 'This beneficiary cannot be activated because the target CIM account is not active.');
        }

        if ($beneficiary->linkedBankAccount->user_id === $beneficiary->user_id) {
            return back()->with('error', 'Customers cannot add their own account as a beneficiary.');
        }

        $beneficiary->update([
            'status' => 'active',
            'verified_at' => now(),
        ]);

        $auditLogService->log($request, 'beneficiary_activated', $beneficiary, 'Beneficiary activated for internal transfers.', [
            'linked_bank_account_id' => $beneficiary->linked_bank_account_id,
        ]);

        return back()->with('success', 'Beneficiary activated.');
    }

    public function reject(Request $request, Beneficiary $beneficiary, AuditLogService $auditLogService): RedirectResponse
    {
        $beneficiary->update([
            'status' => 'rejected',
            'verified_at' => null,
        ]);

        $auditLogService->log($request, 'beneficiary_rejected', $beneficiary, 'Beneficiary rejected for internal transfers.');

        return back()->with('success', 'Beneficiary rejected.');
    }
}
