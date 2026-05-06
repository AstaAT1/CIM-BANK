<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AccountOpeningRequest;
use App\Models\Appointment;
use App\Models\AuditLog;
use App\Models\BankAccount;
use App\Models\CustomerProfile;
use App\Models\Document;
use App\Models\TransferRequest;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        return $this->__invoke();
    }

    public function __invoke(): Response
    {
        return Inertia::render('admin/dashboard', [
            'stats' => [
                'totalCustomers' => CustomerProfile::count(),
                'pendingAccountOpeningRequests' => AccountOpeningRequest::whereIn('status', ['submitted', 'appointment_scheduled', 'under_review'])->count(),
                'scheduledAppointmentsToday' => Appointment::whereDate('scheduled_at', today())->where('status', 'scheduled')->count(),
                'pendingDocuments' => Document::where('status', 'pending')->count(),
                'activeBankAccounts' => BankAccount::where('status', 'active')->count(),
                'pendingTransfers' => TransferRequest::whereIn('status', ['pending', 'processing'])->count(),
            ],
            'recentAuditLogs' => AuditLog::with('user')->latest()->limit(10)->get(),
            'recentAccountOpeningRequests' => AccountOpeningRequest::with(['user', 'customerProfile', 'branch'])->latest()->limit(10)->get(),
            'recentTransferRequests' => TransferRequest::with(['sourceAccount.user', 'beneficiary'])->latest()->limit(10)->get(),
        ]);
    }
}
