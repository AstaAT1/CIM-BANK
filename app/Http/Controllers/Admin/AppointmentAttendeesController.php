<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\AccountApprovedMail;
use App\Mail\AccountRejectedMail;
use App\Models\AccountTransaction;
use App\Models\Appointment;
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

class AppointmentAttendeesController extends Controller
{
    /**
     * Display the customer monitoring dashboard.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['status', 'date', 'search']);

        $attendees = User::role('customer')
            ->with([
                'profile',
                'appointments' => fn ($query) => $query->with(['branch', 'accountOpeningRequest'])->latest('scheduled_at'),
                'accountOpeningRequests' => fn ($query) => $query->with(['branch', 'appointment'])->latest(),
                'bankAccounts' => fn ($query) => $query->latest(),
                'bankCards' => fn ($query) => $query->latest(),
            ])
            ->when($filters['status'] ?? null, function ($query, string $status): void {
                match ($status) {
                    'pending_verification' => $query->where(function ($query): void {
                        $query->whereDoesntHave('profile')
                            ->orWhereHas('profile', fn ($query) => $query->where('status', 'pending'));
                    }),
                    'verified_customers' => $query->whereHas('profile', fn ($query) => $query->where('status', 'verified')),
                    'rejected_customers' => $query->whereHas('profile', fn ($query) => $query->where('status', 'rejected')),
                    'appointment_booked' => $query->whereHas('appointments', fn ($query) => $query->whereIn('status', ['scheduled', 'rescheduled'])),
                    'appointment_finished' => $query->whereHas('appointments', fn ($query) => $query->whereIn('status', ['completed', 'missed'])),
                    'scheduled', 'rescheduled', 'completed', 'missed', 'cancelled' => $query->whereHas('appointments', fn ($query) => $query->where('status', $status)),
                    default => null,
                };
            })
            ->when($filters['date'] ?? null, fn ($query, string $date) => $query->whereHas('appointments', fn ($query) => $query->whereDate('scheduled_at', $date)))
            ->when($filters['search'] ?? null, function ($query, string $search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhereHas('profile', function ($query) use ($search): void {
                            $query->where('cin', 'like', "%{$search}%")
                                ->orWhere('phone', 'like', "%{$search}%");
                        });
                });
            })
            ->latest()
            ->paginate(20)
            ->withQueryString()
            ->through(function (User $user): array {
                $latestRequest = $user->accountOpeningRequests->first();
                $latestAppointment = $user->appointments->first();
                $latestAccount = $user->bankAccounts->first();
                $latestCard = $user->bankCards->first();
                $accountIds = $user->bankAccounts->pluck('id');

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone ?? $user->profile?->phone,
                    'created_at' => $user->created_at,
                    'profile' => $user->profile ? [
                        'cin' => $user->profile->cin,
                        'employment_status' => $user->profile->employment_status,
                        'status' => $user->profile->status,
                        'verified_at' => $user->profile->verified_at,
                        'phone' => $user->profile->phone,
                        'address' => $user->profile->address,
                        'city' => $user->profile->city,
                        'birth_date' => $user->profile->birth_date,
                        'monthly_income' => $user->profile->monthly_income,
                    ] : null,
                    'latest_appointment' => $latestAppointment ? [
                        'id' => $latestAppointment->id,
                        'scheduled_at' => $latestAppointment->scheduled_at,
                        'status' => $latestAppointment->status,
                        'notes' => $latestAppointment->notes,
                        'branch' => $latestAppointment->branch ? [
                            'name' => $latestAppointment->branch->name,
                            'city' => $latestAppointment->branch->city,
                        ] : null,
                    ] : null,
                    'latest_account_opening_request' => $latestRequest ? [
                        'id' => $latestRequest->id,
                        'request_number' => $latestRequest->request_number,
                        'account_type' => $latestRequest->account_type,
                        'status' => $latestRequest->status,
                        'submitted_at' => $latestRequest->submitted_at,
                        'reviewed_at' => $latestRequest->reviewed_at,
                        'branch' => $latestRequest->branch ? [
                            'name' => $latestRequest->branch->name,
                            'city' => $latestRequest->branch->city,
                        ] : null,
                    ] : null,
                    'bank_account_summary' => $latestAccount ? [
                        'id' => $latestAccount->id,
                        'account_type' => $latestAccount->account_type,
                        'status' => $latestAccount->status,
                        'currency' => $latestAccount->currency,
                        'balance' => $latestAccount->balance,
                        'opened_at' => $latestAccount->opened_at,
                        'account_number_last4' => substr((string) $latestAccount->account_number, -4),
                    ] : null,
                    'card_summary' => $latestCard ? [
                        'id' => $latestCard->id,
                        'masked_card_number' => $latestCard->masked_card_number,
                        'card_number_last4' => $latestCard->card_number_last4,
                        'expiry_month' => $latestCard->expiry_month,
                        'expiry_year' => $latestCard->expiry_year,
                        'status' => $latestCard->status,
                    ] : null,
                    'bank_accounts' => $user->bankAccounts->map(fn ($account): array => [
                        'id' => $account->id,
                        'account_type' => $account->account_type,
                        'status' => $account->status,
                        'currency' => $account->currency,
                        'balance' => $account->balance,
                        'opened_at' => $account->opened_at,
                        'account_number_last4' => substr((string) $account->account_number, -4),
                    ])->values(),
                    'bank_cards' => $user->bankCards->map(fn ($card): array => [
                        'id' => $card->id,
                        'masked_card_number' => $card->masked_card_number,
                        'card_number_last4' => $card->card_number_last4,
                        'expiry_month' => $card->expiry_month,
                        'expiry_year' => $card->expiry_year,
                        'status' => $card->status,
                    ])->values(),
                    'latest_transactions' => AccountTransaction::whereIn('bank_account_id', $accountIds)
                        ->latest('performed_at')
                        ->limit(5)
                        ->get(['id', 'bank_account_id', 'reference', 'type', 'direction', 'amount', 'status', 'performed_at']),
                    'latest_atm_withdrawals' => $user->atmWithdrawals()
                        ->with('atm:id,name,city')
                        ->latest()
                        ->limit(5)
                        ->get(['id', 'atm_id', 'bank_account_id', 'amount', 'status', 'created_at']),
                ];
            });

        return Inertia::render('admin/appointment-attendees', [
            'attendees' => $attendees,
            'filters' => $filters,
            'statuses' => [
                'all_customers',
                'pending_verification',
                'verified_customers',
                'rejected_customers',
                'appointment_booked',
                'appointment_finished',
            ],
        ]);
    }

    /**
     * Mark a client as verified — creates bank account + card.
     */
    public function markVerified(
        Request $request,
        Appointment $appointment,
        AuditLogService $auditLogService,
        CustomerApprovalService $customerApprovalService
    ): RedirectResponse {
        $appointment->load(['accountOpeningRequest', 'customer.profile', 'customer.roles']);
        $wasAlreadyApproved = $appointment->accountOpeningRequest
            && in_array($appointment->accountOpeningRequest->status, ['approved', 'account_created'], true);

        if ($appointment->accountOpeningRequest) {
            try {
                $customerApprovalService->approveAccountOpeningRequest($appointment->accountOpeningRequest, $request->user()->id);
            } catch (RuntimeException $exception) {
                return back()->with('error', $exception->getMessage());
            }
        }

        $appointment->update(['status' => 'completed']);

        $auditLogService->log($request, 'client_verified', $appointment, 'Client verified. Customer access, bank account, and card are active.');

        if ($appointment->accountOpeningRequest && ! $wasAlreadyApproved) {
            $this->sendApprovalEmail($appointment->customer, $appointment->accountOpeningRequest?->id, $appointment->id);
        }

        return back()->with('success', 'Client verified. Bank account and card have been created.');
    }

    /**
     * Mark a client as rejected — accepts an optional custom reason.
     */
    public function markRejected(Request $request, Appointment $appointment, AuditLogService $auditLogService): RedirectResponse
    {
        $validated = $request->validate([
            'rejection_reason' => ['nullable', 'string', 'max:2000'],
        ]);

        $reason = $validated['rejection_reason'] ?? 'Identity verification failed at appointment.';

        $appointment->load(['accountOpeningRequest', 'customer.profile']);
        $wasAlreadyRejected = $appointment->accountOpeningRequest?->status === 'rejected';

        // Reject profile
        if ($appointment->customer && $appointment->customer->profile) {
            $appointment->customer->profile->update(['status' => 'rejected']);
        }

        // Reject request
        if ($appointment->accountOpeningRequest) {
            $appointment->accountOpeningRequest->update([
                'status' => 'rejected',
                'rejection_reason' => $reason,
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
            ]);
        }

        $appointment->update(['status' => 'completed']);

        $auditLogService->log($request, 'client_rejected', $appointment, 'Client identity verification rejected.', [
            'rejection_reason' => $reason,
        ]);

        if ($appointment->accountOpeningRequest && ! $wasAlreadyRejected) {
            $this->sendRejectionEmail($appointment->customer, $reason, $appointment->accountOpeningRequest?->id, $appointment->id);
        }

        return back()->with('success', 'Client marked as rejected.');
    }

    private function sendApprovalEmail(?User $user, ?int $requestId, int $appointmentId): void
    {
        if (! $user?->email) {
            Log::warning('Skipped CIM approval email because the user has no email address.', [
                'account_opening_request_id' => $requestId,
                'appointment_id' => $appointmentId,
                'user_id' => $user?->id,
            ]);

            return;
        }

        try {
            Mail::to($user->email)->send(new AccountApprovedMail($user));
        } catch (Throwable $exception) {
            Log::error('Failed to send CIM account approval email.', [
                'account_opening_request_id' => $requestId,
                'appointment_id' => $appointmentId,
                'user_id' => $user->id,
                'email' => $user->email,
                'error' => $exception->getMessage(),
            ]);
        }
    }

    private function sendRejectionEmail(?User $user, string $reason, ?int $requestId, int $appointmentId): void
    {
        if (! $user?->email) {
            Log::warning('Skipped CIM rejection email because the user has no email address.', [
                'account_opening_request_id' => $requestId,
                'appointment_id' => $appointmentId,
                'user_id' => $user?->id,
            ]);

            return;
        }

        try {
            Mail::to($user->email)->send(new AccountRejectedMail($user, $reason));
        } catch (Throwable $exception) {
            Log::error('Failed to send CIM account rejection email.', [
                'account_opening_request_id' => $requestId,
                'appointment_id' => $appointmentId,
                'user_id' => $user->id,
                'email' => $user->email,
                'error' => $exception->getMessage(),
            ]);
        }
    }

    /**
     * Mark appointment as completed (without verification decision).
     */
    public function markCompleted(Request $request, Appointment $appointment, AuditLogService $auditLogService): RedirectResponse
    {
        $appointment->update(['status' => 'completed']);
        $auditLogService->log($request, 'appointment_completed', $appointment, 'Appointment marked as completed.');

        return back()->with('success', 'Appointment marked as completed.');
    }

    /**
     * Mark appointment as missed.
     */
    public function markMissed(Request $request, Appointment $appointment, AuditLogService $auditLogService): RedirectResponse
    {
        $appointment->update(['status' => 'missed']);
        $auditLogService->log($request, 'appointment_missed', $appointment, 'Appointment marked as missed.');

        return back()->with('success', 'Appointment marked as missed.');
    }
}
