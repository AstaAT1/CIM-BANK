<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Services\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AppointmentController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/appointments', [
            'appointments' => Appointment::with(['customer', 'branch', 'accountOpeningRequest'])
                ->latest('scheduled_at')
                ->paginate(20),
            'statuses' => ['scheduled', 'completed', 'cancelled', 'missed', 'rescheduled'],
        ]);
    }

    public function markCompleted(Request $request, Appointment $appointment, AuditLogService $auditLogService): RedirectResponse
    {
        $appointment->update(['status' => 'completed']);
        $auditLogService->log($request, 'appointment_completed', $appointment, 'Appointment marked completed.');

        return back()->with('success', 'Appointment marked completed.');
    }

    public function markMissed(Request $request, Appointment $appointment, AuditLogService $auditLogService): RedirectResponse
    {
        $appointment->update(['status' => 'missed']);
        $auditLogService->log($request, 'appointment_missed', $appointment, 'Appointment marked missed.');

        return back()->with('success', 'Appointment marked missed.');
    }

    public function cancel(Request $request, Appointment $appointment, AuditLogService $auditLogService): RedirectResponse
    {
        $appointment->update(['status' => 'cancelled']);
        $auditLogService->log($request, 'appointment_cancelled', $appointment, 'Appointment cancelled.');

        return back()->with('success', 'Appointment cancelled.');
    }

    public function reschedule(Request $request, Appointment $appointment, AuditLogService $auditLogService): RedirectResponse
    {
        $validated = $request->validate([
            'scheduled_at' => ['required', 'date', 'after:now'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $appointment->update([
            'scheduled_at' => $validated['scheduled_at'],
            'notes' => $validated['notes'] ?? $appointment->notes,
            'status' => 'rescheduled',
        ]);

        $auditLogService->log($request, 'appointment_rescheduled', $appointment, 'Appointment rescheduled.');

        return back()->with('success', 'Appointment rescheduled.');
    }
}
