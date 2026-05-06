<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\AccountApprovedMail;
use App\Mail\AccountRejectedMail;
use App\Models\AccountOpeningRequest;
use App\Models\Branch;
use App\Models\User;
use App\Services\AuditLogService;
use App\Services\CustomerApprovalService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Throwable;

class AccountOpeningReviewController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['status', 'branch_id', 'search']);

        $requests = AccountOpeningRequest::with(['user', 'customerProfile', 'branch', 'appointment', 'reviewer'])
            ->withCount('documents')
            ->when($filters['status'] ?? null, fn ($query, string $status) => $query->where('status', $status))
            ->when($filters['branch_id'] ?? null, fn ($query, string $branchId) => $query->where('branch_id', $branchId))
            ->when($filters['search'] ?? null, function ($query, string $search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('request_number', 'like', "%{$search}%")
                        ->orWhereHas('user', fn ($query) => $query->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"))
                        ->orWhereHas('customerProfile', fn ($query) => $query->where('cin', 'like', "%{$search}%"));
                });
            })
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/account-opening-requests/index', [
            'requests' => $requests,
            'branches' => Branch::orderBy('city')->orderBy('name')->get(),
            'filters' => $filters,
            'statuses' => ['draft', 'submitted', 'appointment_scheduled', 'under_review', 'approved', 'rejected', 'account_created'],
        ]);
    }

    public function show(AccountOpeningRequest $accountOpeningRequest): Response
    {
        $accountOpeningRequest->load(['user', 'customerProfile', 'branch', 'appointment', 'documents', 'reviewer']);

        return Inertia::render('admin/account-opening-requests/show', [
            'request' => $accountOpeningRequest,
            'user' => $accountOpeningRequest->user,
            'profile' => $accountOpeningRequest->customerProfile,
            'branch' => $accountOpeningRequest->branch,
            'appointment' => $accountOpeningRequest->appointment,
            'documents' => $accountOpeningRequest->documents,
        ]);
    }

    public function markUnderReview(
        Request $request,
        AccountOpeningRequest $accountOpeningRequest,
        AuditLogService $auditLogService
    ): RedirectResponse {
        $accountOpeningRequest->update([
            'status' => 'under_review',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        $auditLogService->log($request, 'account_opening_marked_under_review', $accountOpeningRequest, 'Request marked under review.');

        return back()->with('success', 'Request marked as under review.');
    }

    /**
     * APPROVE — identical logic to AppointmentAttendeesController::markVerified().
     * 1. Marks customer_profile.status = verified
     * 2. Marks request.status = account_created
     * 3. Creates bank account + card (if not already done)
     */
    public function approve(
        Request $request,
        AccountOpeningRequest $accountOpeningRequest,
        CustomerApprovalService $customerApprovalService,
        AuditLogService $auditLogService
    ): RedirectResponse {
        $accountOpeningRequest->load(['customerProfile', 'user.roles']);
        $wasAlreadyApproved = in_array($accountOpeningRequest->status, ['approved', 'account_created'], true);

        try {
            $customerApprovalService->approveAccountOpeningRequest($accountOpeningRequest, $request->user()->id);
        } catch (RuntimeException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        $auditLogService->log(
            $request,
            'account_opening_approved',
            $accountOpeningRequest,
            'Account opening request approved. Profile, customer role, email verification, bank account, and card are active.'
        );

        if (! $wasAlreadyApproved) {
            $this->sendApprovalEmail($accountOpeningRequest->user, $accountOpeningRequest->id);
        }

        return back()->with('success', 'Client verified. Bank account and card have been created.');
    }

    /**
     * REJECT — marks profile + request as rejected, saves reason.
     */
    public function reject(
        Request $request,
        AccountOpeningRequest $accountOpeningRequest,
        AuditLogService $auditLogService
    ): RedirectResponse {
        $validated = $request->validate([
            'rejection_reason' => ['required', 'string', 'max:2000'],
        ]);

        $accountOpeningRequest->load(['customerProfile', 'user']);
        $wasAlreadyRejected = $accountOpeningRequest->status === 'rejected';

        // Reject the customer profile
        if ($accountOpeningRequest->customerProfile) {
            $accountOpeningRequest->customerProfile->update(['status' => 'rejected']);
        }

        // Reject the request
        $accountOpeningRequest->update([
            'status' => 'rejected',
            'rejection_reason' => $validated['rejection_reason'],
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        $auditLogService->log($request, 'account_opening_rejected', $accountOpeningRequest, 'Request rejected.', [
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        if (! $wasAlreadyRejected) {
            $this->sendRejectionEmail($accountOpeningRequest->user, $validated['rejection_reason'], $accountOpeningRequest->id);
        }

        return back()->with('success', 'Account opening request rejected.');
    }

    private function sendApprovalEmail(?User $user, int $requestId): void
    {
        if (! $user?->email) {
            Log::warning('Skipped CIM approval email because the user has no email address.', [
                'account_opening_request_id' => $requestId,
                'user_id' => $user?->id,
            ]);

            return;
        }

        try {
            Mail::to($user->email)->send(new AccountApprovedMail($user));
        } catch (Throwable $exception) {
            Log::error('Failed to send CIM account approval email.', [
                'account_opening_request_id' => $requestId,
                'user_id' => $user->id,
                'email' => $user->email,
                'error' => $exception->getMessage(),
            ]);
        }
    }

    private function sendRejectionEmail(?User $user, string $reason, int $requestId): void
    {
        if (! $user?->email) {
            Log::warning('Skipped CIM rejection email because the user has no email address.', [
                'account_opening_request_id' => $requestId,
                'user_id' => $user?->id,
            ]);

            return;
        }

        try {
            Mail::to($user->email)->send(new AccountRejectedMail($user, $reason));
        } catch (Throwable $exception) {
            Log::error('Failed to send CIM account rejection email.', [
                'account_opening_request_id' => $requestId,
                'user_id' => $user->id,
                'email' => $user->email,
                'error' => $exception->getMessage(),
            ]);
        }
    }
}
