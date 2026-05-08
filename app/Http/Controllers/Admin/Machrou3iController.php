<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\Machrou3iDecisionMail;
use App\Models\AccountTransaction;
use App\Models\AtmWithdrawal;
use App\Models\BillPayment;
use App\Models\CustomerBill;
use App\Models\Machrou3iApplication;
use App\Models\TransferRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class Machrou3iController extends Controller
{
    public function index(): Response
    {
        $applications = Machrou3iApplication::query()
            ->with(['user:id,name,email', 'bankAccount:id,account_number,status'])
            ->latest()
            ->get();

        return Inertia::render('admin/machrou3i/index', [
            'stats' => [
                'total' => $applications->count(),
                'pending_review' => $applications->whereIn('status', ['submitted', 'under_review', 'need_more_documents'])->count(),
                'pre_approved_offers' => $applications->whereIn('status', ['pre_approved', 'offer_sent', 'customer_accepted_offer'])->count(),
                'rejected' => $applications->where('status', 'rejected')->count(),
                'high_risk' => $applications->where('risk_level', 'high')->count(),
            ],
            'applications' => $applications
                ->map(fn (Machrou3iApplication $application) => [
                    'id' => $application->id,
                    'applicant_name' => $application->user?->name,
                    'applicant_email' => $application->user?->email,
                    'monthly_salary' => $application->monthly_salary,
                    'company_name' => $application->company_name,
                    'project_name' => $application->project_name,
                    'project_type' => $application->project_type,
                    'requested_amount' => $application->requested_amount,
                    'risk_level' => $application->risk_level,
                    'risk_score' => $application->risk_score,
                    'status' => $application->status,
                    'submitted_at' => $application->submitted_at,
                ])
                ->values(),
        ]);
    }

    public function show(Machrou3iApplication $application): Response
    {
        $application->load([
            'user.profile',
            'bankAccount',
            'documents',
            'latestRiskSnapshot',
            'reviewer:id,name,email',
        ]);

        $account = $application->bankAccount;
        $user = $application->user;
        $snapshot = $application->latestRiskSnapshot;

        return Inertia::render('admin/machrou3i/show', [
            'application' => [
                'id' => $application->id,
                'status' => $application->status,
                'submitted_at' => $application->submitted_at,
                'reviewed_at' => $application->reviewed_at,
                'decision_note' => $application->decision_note,
                'required_documents_note' => $application->required_documents_note,
                'reviewer' => $application->reviewer ? [
                    'name' => $application->reviewer->name,
                    'email' => $application->reviewer->email,
                ] : null,
                'customer' => [
                    'name' => $user?->name,
                    'email' => $user?->email,
                    'phone' => $user?->phone ?: $user?->profile?->phone,
                    'cin' => $user?->profile?->cin,
                    'address' => $user?->profile?->address,
                    'city' => $user?->profile?->city,
                    'verification_status' => $user?->profile?->status,
                ],
                'employment' => [
                    'monthly_salary' => $application->monthly_salary,
                    'company_name' => $application->company_name,
                    'job_title' => $application->job_title,
                    'employment_type' => $application->employment_type,
                    'hiring_date' => $application->hiring_date,
                    'salary_proof_original_name' => $application->salary_proof_original_name,
                    'salary_proof_mime_type' => $application->salary_proof_mime_type,
                    'salary_proof_size' => $application->salary_proof_size,
                    'salary_proof_url' => route('admin.machrou3i.documents.view', [$application, 'salary-proof']),
                ],
                'bank_account' => [
                    'account_number_masked' => $this->maskAccountNumber($account?->account_number),
                    'rib_masked' => $this->maskAccountNumber($account?->rib),
                    'balance' => $account?->balance,
                    'currency' => $account?->currency,
                    'status' => $account?->status,
                    'opened_at' => $account?->opened_at,
                ],
                'banking_behavior' => $this->bankingBehavior($application),
                'project' => [
                    'project_name' => $application->project_name,
                    'project_type' => $application->project_type,
                    'project_location' => $application->project_location,
                    'has_experience_in_field' => $application->has_experience_in_field,
                    'needs_equipment' => $application->needs_equipment,
                    'project_description' => $application->project_description,
                    'why_this_project' => $application->why_this_project,
                    'requested_amount' => $application->requested_amount,
                    'expected_monthly_revenue' => $application->expected_monthly_revenue,
                    'expected_monthly_expenses' => $application->expected_monthly_expenses,
                    'expected_monthly_profit' => $application->expected_monthly_profit,
                    'repayment_months' => $application->repayment_months,
                ],
                'risk' => [
                    'risk_score' => $application->risk_score,
                    'risk_level' => $application->risk_level,
                    'suggested_amount' => $application->suggested_amount,
                    'suggested_monthly_installment' => $application->suggested_monthly_installment,
                    'debt_to_income_ratio' => $snapshot?->debt_to_income_ratio,
                    'safe_remaining_income' => $snapshot?->safe_remaining_income,
                    'monthly_obligations' => $snapshot?->monthly_obligations,
                    'current_balance' => $snapshot?->current_balance,
                    'reasons' => $snapshot?->reasons ?? [],
                ],
                'offer' => [
                    'offered_amount' => $application->offered_amount,
                    'offered_repayment_months' => $application->offered_repayment_months,
                    'offered_monthly_installment' => $application->offered_monthly_installment,
                ],
                'documents' => $application->documents
                    ->map(fn ($document) => [
                        'id' => $document->id,
                        'document_type' => $document->document_type,
                        'original_name' => $document->original_name,
                        'mime_type' => $document->mime_type,
                        'size' => $document->size,
                        'status' => $document->status,
                        'view_url' => route('admin.machrou3i.documents.view', [$application, $document->id]),
                    ])
                    ->values(),
            ],
        ]);
    }

    public function viewDocument(Machrou3iApplication $application, string $document)
    {
        if ($document === 'salary-proof') {
            abort_unless($application->salary_proof_path, 404);

            return $this->privateFileResponse(
                $application->salary_proof_path,
                $application->salary_proof_mime_type,
                $application->salary_proof_original_name
            );
        }

        $machrou3iDocument = $application->documents()->whereKey($document)->firstOrFail();

        return $this->privateFileResponse(
            $machrou3iDocument->file_path,
            $machrou3iDocument->mime_type,
            $machrou3iDocument->original_name
        );
    }

    public function preApprove(Request $request, Machrou3iApplication $application)
    {
        $validated = $request->validate([
            'decision_note' => ['nullable', 'string', 'max:5000'],
        ]);

        $amount = $application->requested_amount;
        $months = $application->repayment_months;

        $application->update([
            'status' => 'pre_approved',
            'offered_amount' => $amount,
            'offered_repayment_months' => $months,
            'offered_monthly_installment' => round(((float) $amount) / max(1, (int) $months), 2),
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'decision_note' => $validated['decision_note'] ?? null,
        ]);

        $this->sendDecision($application->refresh(), 'pre_approved');

        return back()->with('success', 'Machrou3i application pre-approved.');
    }

    public function preApproveLower(Request $request, Machrou3iApplication $application)
    {
        $validated = $request->validate([
            'offered_amount' => ['required', 'numeric', 'min:1', 'max:'.$application->requested_amount],
            'offered_repayment_months' => ['required', 'integer', 'min:1', 'max:120'],
            'decision_note' => ['nullable', 'string', 'max:5000'],
        ]);

        $application->update([
            'status' => 'offer_sent',
            'offered_amount' => $validated['offered_amount'],
            'offered_repayment_months' => $validated['offered_repayment_months'],
            'offered_monthly_installment' => round(((float) $validated['offered_amount']) / (int) $validated['offered_repayment_months'], 2),
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'decision_note' => $validated['decision_note'] ?? null,
        ]);

        $this->sendDecision($application->refresh(), 'offer_sent');

        return back()->with('success', 'Lower Machrou3i offer sent.');
    }

    public function reject(Request $request, Machrou3iApplication $application)
    {
        $validated = $request->validate([
            'decision_note' => ['required', 'string', 'max:5000'],
        ]);

        $application->update([
            'status' => 'rejected',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'decision_note' => $validated['decision_note'],
        ]);

        $this->sendDecision($application->refresh(), 'rejected');

        return back()->with('success', 'Machrou3i application rejected.');
    }

    public function requestDocuments(Request $request, Machrou3iApplication $application)
    {
        $validated = $request->validate([
            'required_documents_note' => ['required', 'string', 'max:5000'],
        ]);

        $application->update([
            'status' => 'need_more_documents',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'required_documents_note' => $validated['required_documents_note'],
        ]);

        $this->sendDecision($application->refresh(), 'need_more_documents');

        return back()->with('success', 'More documents requested.');
    }

    private function privateFileResponse(string $path, ?string $mimeType, ?string $fileName)
    {
        abort_unless(Storage::disk('local')->exists($path), 404, 'Document not found.');

        return response()->file(Storage::disk('local')->path($path), [
            'Content-Type' => $mimeType ?: Storage::disk('local')->mimeType($path) ?: 'application/octet-stream',
            'Content-Disposition' => 'inline; filename="'.($fileName ?: basename($path)).'"',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    private function sendDecision(Machrou3iApplication $application, string $decision): void
    {
        $application->loadMissing('user');
        Mail::to($application->user->email)->send(new Machrou3iDecisionMail($application, $decision));
    }

    private function maskAccountNumber(?string $value): ?string
    {
        if (! $value) {
            return null;
        }

        return str_repeat('•', max(0, strlen($value) - 4)).substr($value, -4);
    }

    private function bankingBehavior(Machrou3iApplication $application): array
    {
        $account = $application->bankAccount;
        $user = $application->user;

        $transactions = Schema::hasTable('account_transactions') && $account
            ? AccountTransaction::query()
                ->where('bank_account_id', $account->id)
                ->latest('performed_at')
                ->limit(6)
                ->get()
                ->map(fn (AccountTransaction $transaction) => [
                    'reference' => $transaction->reference,
                    'type' => $transaction->type,
                    'direction' => $transaction->direction,
                    'amount' => $transaction->amount,
                    'status' => $transaction->status,
                    'performed_at' => $transaction->performed_at,
                    'description' => $transaction->description,
                ])
                ->values()
            : collect();

        $autopayObligations = Schema::hasTable('customer_bills') && $user
            ? CustomerBill::query()
                ->where('user_id', $user->id)
                ->where('status', 'active')
                ->where('autopay_enabled', true)
                ->get()
                ->map(fn (CustomerBill $bill) => [
                    'label' => $bill->label,
                    'provider_name' => $bill->provider_name,
                    'category' => $bill->category,
                    'amount' => $bill->amount,
                    'frequency' => $bill->frequency,
                    'next_due_at' => $bill->next_due_at,
                ])
                ->values()
            : collect();

        $failedBillPayments = Schema::hasTable('bill_payments') && $user
            ? BillPayment::query()
                ->where('user_id', $user->id)
                ->whereIn('status', ['failed', 'skipped'])
                ->latest()
                ->limit(5)
                ->get()
                ->map(fn (BillPayment $payment) => [
                    'amount' => $payment->amount,
                    'status' => $payment->status,
                    'failure_reason' => $payment->failure_reason,
                    'created_at' => $payment->created_at,
                ])
                ->values()
            : collect();

        $transferSummary = Schema::hasTable('transfer_requests') && $account
            ? [
                'count' => TransferRequest::query()->where('from_account_id', $account->id)->count(),
                'completed_count' => TransferRequest::query()->where('from_account_id', $account->id)->where('status', 'completed')->count(),
                'total_completed' => TransferRequest::query()->where('from_account_id', $account->id)->where('status', 'completed')->sum('amount'),
            ]
            : ['count' => 0, 'completed_count' => 0, 'total_completed' => 0];

        $atmSummary = Schema::hasTable('atm_withdrawals') && $account
            ? [
                'count' => AtmWithdrawal::query()->where('bank_account_id', $account->id)->count(),
                'completed_count' => AtmWithdrawal::query()->where('bank_account_id', $account->id)->where('status', 'completed')->count(),
                'total_completed' => AtmWithdrawal::query()->where('bank_account_id', $account->id)->where('status', 'completed')->sum('amount'),
            ]
            : ['count' => 0, 'completed_count' => 0, 'total_completed' => 0];

        return [
            'latest_transactions' => $transactions,
            'autopay_obligations' => $autopayObligations,
            'failed_bill_payments' => $failedBillPayments,
            'transfer_summary' => $transferSummary,
            'atm_summary' => $atmSummary,
        ];
    }
}
