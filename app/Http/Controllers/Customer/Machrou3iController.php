<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Mail\Machrou3iApplicationSubmittedMail;
use App\Models\Machrou3iApplication;
use App\Services\Machrou3iRiskService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class Machrou3iController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('customer/machrou3i/index', [
            'customer' => [
                'name' => $user->name,
                'email' => $user->email,
                'cin' => $user->profile?->cin,
            ],
            'bankAccounts' => $user->bankAccounts()
                ->where('status', 'active')
                ->latest()
                ->get()
                ->map(fn ($account) => [
                    'id' => $account->id,
                    'label' => $account->account_type.' account ending '.substr($account->account_number, -4),
                    'currency' => $account->currency,
                    'balance' => $account->balance,
                    'status' => $account->status,
                ])
                ->values(),
            'applications' => $user
                ->machrou3iApplications()
                ->with('latestRiskSnapshot')
                ->latest()
                ->get()
                ->map(fn (Machrou3iApplication $application) => [
                    'id' => $application->id,
                    'project_name' => $application->project_name,
                    'project_type' => $application->project_type,
                    'requested_amount' => $application->requested_amount,
                    'expected_monthly_profit' => $application->expected_monthly_profit,
                    'repayment_months' => $application->repayment_months,
                    'status' => $application->status,
                    'risk_score' => $application->risk_score,
                    'risk_level' => $application->risk_level,
                    'suggested_amount' => $application->suggested_amount,
                    'suggested_monthly_installment' => $application->suggested_monthly_installment,
                    'offered_amount' => $application->offered_amount,
                    'offered_repayment_months' => $application->offered_repayment_months,
                    'offered_monthly_installment' => $application->offered_monthly_installment,
                    'decision_note' => $application->decision_note,
                    'required_documents_note' => $application->required_documents_note,
                    'submitted_at' => $application->submitted_at,
                    'customer_accepted_at' => $application->customer_accepted_at,
                    'latest_risk_snapshot' => $application->latestRiskSnapshot ? [
                        'risk_score' => $application->latestRiskSnapshot->risk_score,
                        'risk_level' => $application->latestRiskSnapshot->risk_level,
                        'suggested_amount' => $application->latestRiskSnapshot->suggested_amount,
                        'suggested_monthly_installment' => $application->latestRiskSnapshot->suggested_monthly_installment,
                        'reasons' => $application->latestRiskSnapshot->reasons ?? [],
                    ] : null,
                ])
                ->values(),
        ]);
    }

    public function store(Request $request, Machrou3iRiskService $riskService)
    {
        $validated = $this->validatedApplication($request, requireSalaryProof: true);
        $user = $request->user();
        $account = $user->bankAccounts()
            ->whereKey($validated['bank_account_id'])
            ->where('status', 'active')
            ->firstOrFail();
        $salaryProof = $validated['salary_proof'];
        $salaryProofPath = $salaryProof->store('machrou3i/salary-proofs', 'local');

        unset($validated['salary_proof']);

        $application = Machrou3iApplication::create(array_merge($validated, [
            'user_id' => $user->id,
            'bank_account_id' => $account->id,
            'salary_proof_path' => $salaryProofPath,
            'salary_proof_original_name' => $salaryProof->getClientOriginalName(),
            'salary_proof_mime_type' => $salaryProof->getClientMimeType(),
            'salary_proof_size' => $salaryProof->getSize(),
            'status' => 'submitted',
            'submitted_at' => now(),
        ]));

        $riskService->storeSnapshot($application);
        Mail::to($user->email)->send(new Machrou3iApplicationSubmittedMail($application->refresh()));

        return back()->with('success', 'Machrou3i application submitted.');
    }

    public function update(Request $request, Machrou3iApplication $application)
    {
        $this->authorizeOwner($request, $application);
        abort_if(in_array($application->status, ['pre_approved', 'offer_sent', 'customer_accepted_offer', 'rejected', 'cancelled'], true), 422);

        $validated = $this->validatedApplication($request, requireSalaryProof: false);

        if (isset($validated['bank_account_id'])) {
            $request->user()->bankAccounts()
                ->whereKey($validated['bank_account_id'])
                ->where('status', 'active')
                ->firstOrFail();
        }

        if (isset($validated['salary_proof'])) {
            $salaryProof = $validated['salary_proof'];
            $validated['salary_proof_path'] = $salaryProof->store('machrou3i/salary-proofs', 'local');
            $validated['salary_proof_original_name'] = $salaryProof->getClientOriginalName();
            $validated['salary_proof_mime_type'] = $salaryProof->getClientMimeType();
            $validated['salary_proof_size'] = $salaryProof->getSize();
            unset($validated['salary_proof']);
        }

        $application->update($validated);

        return back()->with('success', 'Machrou3i application updated.');
    }

    public function storeDocument(Request $request, Machrou3iApplication $application)
    {
        $this->authorizeOwner($request, $application);

        $validated = $request->validate([
            'document_type' => ['required', 'string', 'max:100'],
            'document' => ['required', 'file', 'max:5120'],
        ]);

        $file = $validated['document'];
        $application->documents()->create([
            'user_id' => $request->user()->id,
            'document_type' => $validated['document_type'],
            'file_path' => $file->store('machrou3i/documents', 'local'),
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getClientMimeType(),
            'size' => $file->getSize(),
            'status' => 'uploaded',
        ]);

        return back()->with('success', 'Document uploaded.');
    }

    public function acceptOffer(Request $request, Machrou3iApplication $application)
    {
        $this->authorizeOwner($request, $application);
        abort_unless(in_array($application->status, ['pre_approved', 'offer_sent'], true), 422);

        $application->update([
            'status' => 'customer_accepted_offer',
            'customer_accepted_at' => now(),
        ]);

        return back()->with('success', 'Offer accepted.');
    }

    public function declineOffer(Request $request, Machrou3iApplication $application)
    {
        $this->authorizeOwner($request, $application);
        abort_unless(in_array($application->status, ['pre_approved', 'offer_sent'], true), 422);

        $application->update(['status' => 'cancelled']);

        return back()->with('success', 'Offer declined.');
    }

    public function destroy(Request $request, Machrou3iApplication $application)
    {
        $this->authorizeOwner($request, $application);
        abort_if($application->status === 'customer_accepted_offer', 422);

        $application->update(['status' => 'cancelled']);

        return back()->with('success', 'Machrou3i application cancelled.');
    }

    private function validatedApplication(Request $request, bool $requireSalaryProof): array
    {
        return $request->validate([
            'bank_account_id' => ['required', 'integer', 'exists:bank_accounts,id'],
            'monthly_salary' => ['required', 'numeric', 'min:1', 'max:9999999999.99'],
            'company_name' => ['required', 'string', 'max:255'],
            'job_title' => ['required', 'string', 'max:255'],
            'employment_type' => ['required', Rule::in(Machrou3iApplication::EMPLOYMENT_TYPES)],
            'hiring_date' => ['nullable', 'date', 'before_or_equal:today'],
            'salary_proof' => [$requireSalaryProof ? 'required' : 'nullable', 'file', 'max:5120'],
            'project_name' => ['required', 'string', 'max:255'],
            'project_type' => ['required', Rule::in(Machrou3iApplication::PROJECT_TYPES)],
            'project_location' => ['nullable', 'string', 'max:255'],
            'has_experience_in_field' => ['sometimes', 'boolean'],
            'needs_equipment' => ['sometimes', 'boolean'],
            'project_description' => ['required', 'string', 'max:5000'],
            'why_this_project' => ['nullable', 'string', 'max:5000'],
            'requested_amount' => ['required', 'numeric', 'min:1', 'max:9999999999.99'],
            'expected_monthly_revenue' => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
            'expected_monthly_expenses' => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
            'expected_monthly_profit' => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
            'repayment_months' => ['required', 'integer', 'min:1', 'max:120'],
        ]);
    }

    private function authorizeOwner(Request $request, Machrou3iApplication $application): void
    {
        abort_unless($application->user_id === $request->user()->id, 403);
    }
}
