<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\BillProvider;
use App\Models\CustomerBill;
use App\Services\BillPaymentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class BillController extends Controller
{
    private const CATEGORIES = ['water', 'electricity', 'internet', 'school', 'phone', 'subscription', 'other'];

    private const FREQUENCIES = ['one_time', 'weekly', 'monthly'];

    public function index(Request $request): Response
    {
        $user = $request->user();

        $accounts = $user->bankAccounts()
            ->where('status', 'active')
            ->latest('opened_at')
            ->latest()
            ->get()
            ->map(fn ($account): array => [
                'id' => $account->id,
                'account_number' => $account->account_number,
                'rib' => $account->rib,
                'balance' => (float) $account->balance,
                'currency' => $account->currency,
                'status' => $account->status,
            ]);

        $bills = $user->customerBills()
            ->with(['payments' => fn ($query) => $query->latest()->limit(5)])
            ->latest('next_due_at')
            ->get();

        $payments = $bills
            ->flatMap(fn (CustomerBill $bill) => $bill->payments->map(fn ($payment) => [
                'id' => $payment->id,
                'bill_label' => $bill->label,
                'provider_name' => $bill->provider_name,
                'amount' => (float) $payment->amount,
                'reference' => $payment->reference,
                'status' => $payment->status,
                'failure_reason' => $payment->failure_reason,
                'paid_at' => $payment->paid_at?->toIso8601String(),
                'created_at' => $payment->created_at?->toIso8601String(),
            ]))
            ->sortByDesc('created_at')
            ->values()
            ->take(12)
            ->all();

        return Inertia::render('customer/bills/index', [
            'accounts' => $accounts,
            'providers' => BillProvider::query()
                ->where('status', 'active')
                ->orderBy('name')
                ->get(['id', 'name', 'category'])
                ->map(fn (BillProvider $provider): array => [
                    'id' => $provider->id,
                    'name' => $provider->name,
                    'category' => $provider->category,
                ]),
            'bills' => $bills->map(fn (CustomerBill $bill): array => [
                'id' => $bill->id,
                'bank_account_id' => $bill->bank_account_id,
                'label' => $bill->label,
                'category' => $bill->category,
                'provider_name' => $bill->provider_name,
                'reference_number' => $bill->reference_number,
                'amount' => (float) $bill->amount,
                'frequency' => $bill->frequency,
                'next_due_at' => $bill->next_due_at?->toIso8601String(),
                'autopay_enabled' => (bool) $bill->autopay_enabled,
                'minimum_balance_after_payment' => (float) $bill->minimum_balance_after_payment,
                'status' => $bill->status,
                'reminder_sent_at' => $bill->reminder_sent_at?->toIso8601String(),
                'last_paid_at' => $bill->last_paid_at?->toIso8601String(),
                'last_payment_status' => $bill->payments->first()?->status,
                'payments' => $bill->payments->map(fn ($payment): array => [
                    'id' => $payment->id,
                    'amount' => (float) $payment->amount,
                    'reference' => $payment->reference,
                    'status' => $payment->status,
                    'failure_reason' => $payment->failure_reason,
                    'paid_at' => $payment->paid_at?->toIso8601String(),
                    'created_at' => $payment->created_at?->toIso8601String(),
                ])->values(),
            ])->values(),
            'overview' => $this->overview($bills),
            'paymentHistory' => $payments,
            'categories' => self::CATEGORIES,
            'frequencies' => self::FREQUENCIES,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validatedBillData($request);
        $provider = $this->providerFor($validated['provider_name'], $validated['category']);

        CustomerBill::create([
            ...$validated,
            'user_id' => $request->user()->id,
            'provider_id' => $provider?->id,
            'status' => 'active',
        ]);

        return back()->with('success', 'Bill added.');
    }

    public function update(Request $request, CustomerBill $bill): RedirectResponse
    {
        $this->authorizeBill($request, $bill);
        $validated = $this->validatedBillData($request);
        $provider = $this->providerFor($validated['provider_name'], $validated['category']);

        $bill->update([
            ...$validated,
            'provider_id' => $provider?->id,
            'status' => 'active',
        ]);

        return back()->with('success', 'Bill updated.');
    }

    public function destroy(Request $request, CustomerBill $bill): RedirectResponse
    {
        $this->authorizeBill($request, $bill);

        if ($bill->payments()->where('status', 'completed')->exists()) {
            $bill->update([
                'status' => 'cancelled',
                'autopay_enabled' => false,
            ]);

            return back()->with('success', 'Bill cancelled.');
        }

        $bill->delete();

        return back()->with('success', 'Bill deleted.');
    }

    public function payNow(Request $request, CustomerBill $bill, BillPaymentService $billPayments): RedirectResponse
    {
        $this->authorizeBill($request, $bill);

        $result = $billPayments->pay($bill, 'manual');

        if (! ($result['ok'] ?? false)) {
            return back()->withErrors(['bill' => $result['error'] ?? 'Bill payment failed.']);
        }

        return back()->with('success', "Bill paid. Reference: {$result['reference']}");
    }

    public function toggleAutopay(Request $request, CustomerBill $bill): RedirectResponse
    {
        $this->authorizeBill($request, $bill);

        $bill->update([
            'autopay_enabled' => ! $bill->autopay_enabled,
        ]);

        return back()->with('success', $bill->fresh()->autopay_enabled ? 'AutoPay enabled.' : 'AutoPay disabled.');
    }

    private function validatedBillData(Request $request): array
    {
        return $request->validate([
            'bank_account_id' => [
                'required',
                'integer',
                Rule::exists('bank_accounts', 'id')
                    ->where('user_id', $request->user()->id)
                    ->where('status', 'active'),
            ],
            'label' => ['required', 'string', 'max:120'],
            'category' => ['required', Rule::in(self::CATEGORIES)],
            'provider_name' => ['required', 'string', 'max:120'],
            'reference_number' => ['required', 'string', 'max:120'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'frequency' => ['required', Rule::in(self::FREQUENCIES)],
            'next_due_at' => ['required', 'date'],
            'autopay_enabled' => ['boolean'],
            'minimum_balance_after_payment' => ['nullable', 'numeric', 'min:0'],
        ]) + [
            'autopay_enabled' => false,
            'minimum_balance_after_payment' => 0,
        ];
    }

    private function providerFor(string $name, string $category): ?BillProvider
    {
        return BillProvider::firstOrCreate(
            ['name' => trim($name), 'category' => $category],
            ['status' => 'active'],
        );
    }

    private function authorizeBill(Request $request, CustomerBill $bill): void
    {
        abort_unless($bill->user_id === $request->user()->id, 404);
    }

    private function overview($bills): array
    {
        $now = now();
        $monthStart = $now->copy()->startOfMonth();
        $monthEnd = $now->copy()->endOfMonth();

        return [
            'total_bills' => $bills->where('status', 'active')->count(),
            'upcoming_bills' => $bills
                ->where('status', 'active')
                ->filter(fn (CustomerBill $bill): bool => $bill->next_due_at?->between($now, $now->copy()->addDays(14)) ?? false)
                ->count(),
            'autopay_active' => $bills->where('status', 'active')->where('autopay_enabled', true)->count(),
            'paid_this_month' => $bills
                ->flatMap(fn (CustomerBill $bill) => $bill->payments)
                ->filter(fn ($payment): bool => $payment->status === 'completed'
                    && $payment->paid_at
                    && $payment->paid_at->between($monthStart, $monthEnd))
                ->count(),
            'failed_or_skipped' => $bills
                ->flatMap(fn (CustomerBill $bill) => $bill->payments)
                ->whereIn('status', ['failed', 'skipped'])
                ->count(),
        ];
    }
}
