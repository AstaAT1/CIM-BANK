<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Atm;
use App\Models\AtmCashMovement;
use App\Services\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AtmController extends Controller
{
    // ── Index ─────────────────────────────────────────────────────────────

    /**
     * List all ATMs with optional filters.
     * Accessible to admin and employee.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['area', 'status', 'search']);

        $atms = Atm::withCount(['withdrawals', 'cashMovements'])
            ->when(
                $filters['area'] ?? null,
                fn ($q, $area) => $q->where('area', $area)
            )
            ->when(
                $filters['status'] ?? null,
                fn ($q, $status) => $q->where('status', $status)
            )
            ->when($filters['search'] ?? null, function ($q, $search) {
                $q->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%")
                        ->orWhere('address', 'like', "%{$search}%")
                        ->orWhere('area', 'like', "%{$search}%");
                });
            })
            ->orderBy('area')
            ->orderBy('name')
            ->get([
                'id', 'code', 'name', 'city', 'area', 'address',
                'latitude', 'longitude', 'current_cash', 'max_capacity',
                'status', 'is_active', 'notes',
            ]);

        // Append computed fill percentage per ATM
        $atms->each(fn ($atm) => $atm->append('fill_percentage'));

        return Inertia::render('admin/atms/index', [
            'atms'     => $atms,
            'filters'  => $filters,
            'areas'    => Atm::distinct()->orderBy('area')->pluck('area'),
            'statuses' => ['active', 'low_cash', 'empty', 'out_of_service'],
            'summary'  => [
                'total'          => $atms->count(),
                'active'         => $atms->where('status', 'active')->count(),
                'low_cash'       => $atms->where('status', 'low_cash')->count(),
                'empty'          => $atms->where('status', 'empty')->count(),
                'out_of_service' => $atms->where('status', 'out_of_service')->count(),
                'total_cash'     => $atms->sum('current_cash'),
            ],
            'isAdmin'  => $request->user()->hasRole('admin'),
        ]);
    }

    // ── Show ──────────────────────────────────────────────────────────────

    /**
     * Full ATM detail with stats, recent cash movements and withdrawals.
     * Accessible to admin and employee.
     */
    public function show(Atm $atm): Response
    {
        $atm->append('fill_percentage');

        $stats = [
            'total_withdrawals'     => $atm->withdrawals()->count(),
            'completed_withdrawals' => $atm->withdrawals()->where('status', 'completed')->count(),
            'total_cash_loaded'     => $atm->cashMovements()->where('type', 'load')->sum('amount'),
            'total_cash_withdrawn'  => $atm->cashMovements()->where('type', 'withdrawal')->sum('amount'),
            'total_cash_deposited'  => $atm->cashMovements()->where('type', 'deposit')->sum('amount'),
            'fill_percentage'       => $atm->fill_percentage,
        ];

        $recentCashMovements = $atm->cashMovements()
            ->with('adminUser:id,name,email')
            ->latest()
            ->limit(20)
            ->get();

        $recentWithdrawals = $atm->withdrawals()
            ->with([
                'user:id,name,email',
                'bankAccount:id,account_number,account_type',
            ])
            ->latest()
            ->limit(20)
            ->get();

        return Inertia::render('admin/atms/show', [
            'atm'                    => $atm,
            'stats'                  => $stats,
            'recentCashMovements'    => $recentCashMovements,
            'recentWithdrawals'      => $recentWithdrawals,
            'availableForWithdrawal' => $atm->is_active
                && ! in_array($atm->status, ['empty', 'out_of_service']),
            'isAdmin'                => request()->user()->hasRole('admin'),
        ]);
    }

    // ── Update ────────────────────────────────────────────────────────────

    /**
     * Update ATM metadata. Admin only.
     */
    public function update(Request $request, Atm $atm, AuditLogService $auditLogService): RedirectResponse
    {
        $validated = $request->validate([
            'name'         => ['required', 'string', 'max:200'],
            'area'         => ['required', 'string', 'max:100'],
            'address'      => ['required', 'string', 'max:500'],
            'latitude'     => ['required', 'numeric', 'between:-90,90'],
            'longitude'    => ['required', 'numeric', 'between:-180,180'],
            'max_capacity' => ['required', 'numeric', 'min:0'],
            'status'       => ['required', 'in:active,low_cash,empty,out_of_service'],
            'is_active'    => ['required', 'boolean'],
            'notes'        => ['nullable', 'string', 'max:1000'],
        ]);

        $atm->update($validated);

        $auditLogService->log(
            $request,
            'atm_updated',
            $atm,
            "ATM {$atm->code} details updated by admin.",
            ['changes' => $validated]
        );

        return back()->with('success', "ATM {$atm->name} updated successfully.");
    }

    // ── Load Cash ─────────────────────────────────────────────────────────

    /**
     * Load cash into an ATM. Admin only.
     */
    public function loadCash(Request $request, Atm $atm, AuditLogService $auditLogService): RedirectResponse
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'note'   => ['nullable', 'string', 'max:500'],
        ]);

        $loadAmount = (float) $validated['amount'];
        $cashBefore = (float) $atm->current_cash;

        // Cap at max_capacity
        $rawCashAfter = $cashBefore + $loadAmount;
        $cashAfter    = min($rawCashAfter, (float) $atm->max_capacity);
        $actualLoaded = $cashAfter - $cashBefore; // may be less if capped

        // Determine new status
        $newStatus = match (true) {
            $cashAfter <= 0                                          => 'empty',
            $cashAfter < ((float) $atm->max_capacity * 0.20)        => 'low_cash',
            default                                                   => 'active',
        };

        $noteText = $validated['note'] ?? "Cash load by admin #{$request->user()->id}";
        if ($rawCashAfter > $atm->max_capacity) {
            $noteText .= " (capped at max capacity: {$atm->max_capacity} MAD)";
        }

        // Persist changes
        $atm->update([
            'current_cash' => $cashAfter,
            'status'       => $newStatus,
        ]);

        AtmCashMovement::create([
            'atm_id'        => $atm->id,
            'admin_user_id' => $request->user()->id,
            'type'          => 'load',
            'amount'        => $actualLoaded,
            'cash_before'   => $cashBefore,
            'cash_after'    => $cashAfter,
            'note'          => $noteText,
        ]);

        $auditLogService->log(
            $request,
            'atm_cash_loaded',
            $atm,
            "Admin loaded {$actualLoaded} MAD into ATM {$atm->code}.",
            [
                'amount_requested' => $loadAmount,
                'amount_loaded'    => $actualLoaded,
                'cash_before'      => $cashBefore,
                'cash_after'       => $cashAfter,
                'new_status'       => $newStatus,
            ]
        );

        return back()->with('success', sprintf(
            '%.2f MAD loaded into %s. New balance: %.2f MAD.',
            $actualLoaded,
            $atm->name,
            $cashAfter
        ));
    }

    // ── Cash Movements ────────────────────────────────────────────────────

    /**
     * Full paginated cash movement history for one ATM.
     * Accessible to admin and employee.
     */
    public function cashMovements(Request $request, Atm $atm): Response
    {
        $movements = $atm->cashMovements()
            ->with('adminUser:id,name,email')
            ->latest()
            ->paginate(30)
            ->withQueryString();

        return Inertia::render('admin/atms/show', [
            'atm'       => $atm->append('fill_percentage'),
            'movements' => $movements,
            'view'      => 'cash_movements',
        ]);
    }

    // ── Withdrawals ───────────────────────────────────────────────────────

    /**
     * Full paginated withdrawal history for one ATM.
     * Accessible to admin and employee.
     */
    public function withdrawals(Request $request, Atm $atm): Response
    {
        $withdrawals = $atm->withdrawals()
            ->with([
                'user:id,name,email',
                'bankAccount:id,account_number,account_type',
            ])
            ->latest()
            ->paginate(30)
            ->withQueryString();

        return Inertia::render('admin/atms/show', [
            'atm'         => $atm->append('fill_percentage'),
            'withdrawals' => $withdrawals,
            'view'        => 'withdrawals',
        ]);
    }
}
