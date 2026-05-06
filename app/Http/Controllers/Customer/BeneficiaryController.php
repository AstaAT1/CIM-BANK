<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Models\Beneficiary;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BeneficiaryController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $status = trim((string) $request->query('status', ''));

        $beneficiaries = $request->user()
            ->beneficiaries()
            ->with('linkedBankAccount:id,user_id,account_number,rib,status')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('full_name', 'like', "%{$search}%")
                        ->orWhere('rib', 'like', "%{$search}%")
                        ->orWhere('account_number', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->when(in_array($status, ['pending', 'active', 'rejected'], true), fn ($query) => $query->where('status', $status))
            ->latest()
            ->get()
            ->map(fn (Beneficiary $beneficiary): array => [
                'id' => $beneficiary->id,
                'full_name' => $beneficiary->full_name,
                'bank_name' => $beneficiary->bank_name ?: 'CIM Bank',
                'rib' => $beneficiary->rib,
                'account_number' => $beneficiary->account_number,
                'phone' => $beneficiary->phone,
                'status' => $beneficiary->status,
                'linked_bank_account_id' => $beneficiary->linked_bank_account_id,
                'linked_account_status' => $beneficiary->linkedBankAccount?->status,
                'transfers_available' => $beneficiary->status === 'active'
                    && $beneficiary->linkedBankAccount?->status === 'active',
                'created_at' => $beneficiary->created_at?->toIso8601String(),
                'updated_at' => $beneficiary->updated_at?->toIso8601String(),
            ]);

        return Inertia::render('customer/beneficiaries/index', [
            'beneficiaries' => $beneficiaries,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:200'],
            'identifier' => ['nullable', 'string', 'max:50'],
            'rib' => ['nullable', 'string', 'max:50'],
            'account_number' => ['nullable', 'string', 'max:50'],
            'bank_name' => ['required', 'string', 'max:200'],
            'phone' => ['nullable', 'string', 'max:30'],
        ]);

        $identifier = $this->normalizeIdentifier(
            $validated['identifier'] ?? $validated['rib'] ?? $validated['account_number'] ?? null
        );

        if ($identifier === '') {
            return back()->withErrors([
                'identifier' => 'A RIB or account number is required.',
            ])->withInput();
        }

        $user = $request->user();
        $linkedAccount = BankAccount::query()
            ->with(['user.profile'])
            ->where('rib', $identifier)
            ->orWhere('account_number', $identifier)
            ->first();

        if (! $linkedAccount) {
            return back()->withErrors([
                'identifier' => 'No active CIM account was found for this RIB or account number.',
            ])->withInput();
        }

        if ($linkedAccount->status !== 'active') {
            return back()->withErrors([
                'identifier' => 'The receiver CIM account is not active.',
            ])->withInput();
        }

        if ($linkedAccount->user_id === $user->id) {
            return back()->withErrors([
                'identifier' => 'You cannot add your own account as a beneficiary.',
            ])->withInput();
        }

        $duplicateExists = Beneficiary::query()
            ->where('user_id', $user->id)
            ->where(function ($query) use ($identifier, $linkedAccount) {
                $query->where('rib', $identifier)
                    ->orWhere('account_number', $identifier)
                    ->orWhere('rib', $linkedAccount->rib)
                    ->orWhere('account_number', $linkedAccount->account_number)
                    ->orWhere('linked_bank_account_id', $linkedAccount->id);
            })
            ->exists();

        if ($duplicateExists) {
            return back()->withErrors([
                'identifier' => 'This beneficiary is already in your list.',
            ])->withInput();
        }

        Beneficiary::create([
            'user_id' => $user->id,
            'full_name' => $this->receiverDisplayName($linkedAccount) ?: $validated['full_name'],
            'bank_name' => $validated['bank_name'] ?: 'CIM Bank',
            'rib' => $linkedAccount->rib,
            'account_number' => $linkedAccount->account_number,
            'phone' => $validated['phone'] ?? null,
            'status' => 'active',
            'linked_bank_account_id' => $linkedAccount->id,
            'verified_at' => now(),
        ]);

        return back()->with('success', 'Beneficiary added and ready for transfers.');
    }

    private function normalizeIdentifier(?string $identifier): string
    {
        return strtoupper(str_replace(' ', '', trim((string) $identifier)));
    }

    private function receiverDisplayName(BankAccount $account): ?string
    {
        $profileName = trim(implode(' ', array_filter([
            $account->user?->profile?->first_name,
            $account->user?->profile?->last_name,
        ])));

        return $profileName !== ''
            ? $profileName
            : $account->user?->name;
    }
}
