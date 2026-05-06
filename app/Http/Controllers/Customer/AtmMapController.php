<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Atm;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AtmMapController extends Controller
{
    /**
     * Show the Casablanca ATM map with all ATMs and the customer's active accounts.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $atms = Atm::orderBy('area')
            ->get([
                'id', 'code', 'name', 'area', 'address',
                'latitude', 'longitude', 'status', 'current_cash',
                'max_capacity', 'is_active',
            ]);

        $bankAccounts = $user->bankAccounts()
            ->where('status', 'active')
            ->get(['id', 'account_number', 'rib', 'account_type', 'balance', 'currency']);

        return Inertia::render('customer/atm-map/index', [
            'atms'         => $atms,
            'bankAccounts' => $bankAccounts,

            // Map centered on Casablanca city center
            'mapCenter' => [
                'lat' => 33.5731,
                'lng' => -7.5898,
            ],

            // Highlighted default focus: Ain Sebaa — near LionsGeek & Casablanca Zoo
            'defaultFocus' => [
                'lat'  => 33.6087,
                'lng'  => -7.5396,
                'area' => 'Ain Sebaa',
                'note' => 'Near LionsGeek & Casablanca Zoo',
                'code' => 'CIM-AIN-001',
            ],
        ]);
    }

    /**
     * Show details for a single ATM.
     */
    public function show(Atm $atm): Response
    {
        $atm->loadCount('withdrawals');

        // Recent completd withdrawals for this ATM (no personal data exposed)
        $recentWithdrawals = $atm->withdrawals()
            ->where('status', 'completed')
            ->latest()
            ->limit(10)
            ->get(['id', 'amount', 'status', 'created_at']);

        $availableForWithdrawal = $atm->is_active
            && ! in_array($atm->status, ['empty', 'out_of_service']);

        return Inertia::render('customer/atm-map/show', [
            'atm'                    => $atm,
            'cashLevel'              => $atm->fill_percentage,
            'availableForWithdrawal' => $availableForWithdrawal,
            'recentWithdrawals'      => $recentWithdrawals,
        ]);
    }
}
