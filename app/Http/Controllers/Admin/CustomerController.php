<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AccountTransaction;
use App\Models\AuditLog;
use App\Models\TransferRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'status', 'city']);

        $customers = User::role('customer')
            ->with(['profile', 'accountOpeningRequests' => fn ($query) => $query->latest()])
            ->withCount('bankAccounts')
            ->when($filters['search'] ?? null, function ($query, string $search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhereHas('profile', fn ($query) => $query->where('cin', 'like', "%{$search}%"));
                });
            })
            ->when($filters['status'] ?? null, fn ($query, string $status) => $query->whereHas('profile', fn ($query) => $query->where('status', $status)))
            ->when($filters['city'] ?? null, fn ($query, string $city) => $query->whereHas('profile', fn ($query) => $query->where('city', $city)))
            ->latest()
            ->paginate(20)
            ->withQueryString()
            ->through(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'profile' => $user->profile,
                'profile_status' => $user->profile?->status,
                'city' => $user->profile?->city,
                'cin' => $user->profile?->cin,
                'bank_accounts_count' => $user->bank_accounts_count,
                'latest_account_opening_request_status' => $user->accountOpeningRequests->first()?->status,
            ]);

        return Inertia::render('admin/customers/index', [
            'customers' => $customers,
            'filters' => $filters,
            'profileStatuses' => ['pending', 'verified', 'rejected', 'blocked'],
        ]);
    }

    public function show(User $user): Response
    {
        $accountIds = $user->bankAccounts()->pluck('id');

        return Inertia::render('admin/customers/show', [
            'customer' => $user->load('roles'),
            'profile' => $user->profile,
            'accountOpeningRequests' => $user->accountOpeningRequests()->with(['branch', 'appointment', 'documents', 'reviewer'])->latest()->get(),
            'documents' => $user->documents()->with(['accountOpeningRequest', 'reviewer'])->latest()->get(),
            'appointments' => $user->appointments()->with(['branch', 'accountOpeningRequest'])->latest('scheduled_at')->get(),
            'bankAccounts' => $user->bankAccounts()->latest()->get(),
            'accountTransactions' => AccountTransaction::whereIn('bank_account_id', $accountIds)->with('bankAccount')->latest('performed_at')->get(),
            'beneficiaries' => $user->beneficiaries()->latest()->get(),
            'transferRequests' => TransferRequest::whereIn('from_account_id', $accountIds)->with(['sourceAccount', 'beneficiary', 'processor'])->latest()->get(),
            'auditLogs' => AuditLog::where('user_id', $user->id)
                ->orWhere(fn ($query) => $query->where('model_type', User::class)->where('model_id', $user->id))
                ->latest()
                ->get(),
        ]);
    }
}
