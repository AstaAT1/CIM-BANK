<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TransferRequest;
use App\Services\AuditLogService;
use App\Services\TransferService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class TransferReviewController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/transfers', [
            'transferRequests' => TransferRequest::with(['sourceAccount.user', 'beneficiary', 'processor'])
                ->latest()
                ->paginate(20),
            'statuses' => ['pending', 'processing', 'completed', 'failed', 'cancelled', 'rejected'],
        ]);
    }

    public function markProcessing(Request $request, TransferRequest $transferRequest, AuditLogService $auditLogService): RedirectResponse
    {
        $transferRequest->update([
            'status' => 'processing',
            'processed_by' => $request->user()->id,
            'processed_at' => now(),
        ]);

        $auditLogService->log($request, 'transfer_processing', $transferRequest, 'Transfer request marked processing.');

        return back()->with('success', 'Transfer request marked processing.');
    }

    public function complete(
        Request $request,
        TransferRequest $transferRequest,
        TransferService $transferService,
        AuditLogService $auditLogService
    ): RedirectResponse {
        try {
            $completedTransfer = $transferService->complete($transferRequest);
        } catch (RuntimeException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        $completedTransfer->update([
            'processed_by' => $request->user()->id,
        ]);

        $auditLogService->log($request, 'transfer_completed', $completedTransfer, 'Transfer request completed.');

        return back()->with('success', 'Transfer completed successfully.');
    }

    public function reject(Request $request, TransferRequest $transferRequest, AuditLogService $auditLogService): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:2000'],
        ]);

        $transferRequest->update([
            'status' => 'rejected',
            'reason' => $validated['reason'],
            'processed_by' => $request->user()->id,
            'processed_at' => now(),
        ]);

        $auditLogService->log($request, 'transfer_rejected', $transferRequest, 'Transfer request rejected.', [
            'reason' => $validated['reason'],
        ]);

        return back()->with('success', 'Transfer request rejected.');
    }

    public function cancel(Request $request, TransferRequest $transferRequest, AuditLogService $auditLogService): RedirectResponse
    {
        $transferRequest->update([
            'status' => 'cancelled',
            'processed_by' => $request->user()->id,
            'processed_at' => now(),
        ]);

        $auditLogService->log($request, 'transfer_cancelled', $transferRequest, 'Transfer request cancelled.');

        return back()->with('success', 'Transfer request cancelled.');
    }
}
