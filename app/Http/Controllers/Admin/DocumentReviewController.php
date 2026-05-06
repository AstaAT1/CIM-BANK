<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Services\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DocumentReviewController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/documents', [
            'documents' => Document::with(['user', 'accountOpeningRequest', 'reviewer'])
                ->latest()
                ->paginate(20),
            'statuses' => ['pending', 'approved', 'rejected'],
        ]);
    }

    public function approve(Request $request, Document $document, AuditLogService $auditLogService): RedirectResponse
    {
        $document->update([
            'status' => 'approved',
            'rejection_reason' => null,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        $auditLogService->log($request, 'document_approved', $document, 'Document approved by bank staff.');

        return back()->with('success', 'Document approved successfully.');
    }

    public function reject(Request $request, Document $document, AuditLogService $auditLogService): RedirectResponse
    {
        $validated = $request->validate([
            'rejection_reason' => ['required', 'string', 'max:2000'],
        ]);

        $document->update([
            'status' => 'rejected',
            'rejection_reason' => $validated['rejection_reason'],
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        $auditLogService->log($request, 'document_rejected', $document, 'Document rejected by bank staff.', [
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        return back()->with('success', 'Document rejected successfully.');
    }
}
