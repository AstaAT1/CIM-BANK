<?php

namespace Database\Seeders;

use App\Models\Atm;
use App\Models\AtmCashMovement;
use Illuminate\Database\Seeder;

class AtmSeeder extends Seeder
{
    public function run(): void
    {
        $atms = [
            // ── Chatbot MVP ATM records ──────────────────────────────────────────
            [
                'code' => 'CIM-MVP-MAA-001',
                'name' => 'Maarif ATM',
                'city' => 'Casablanca',
                'area' => 'Maarif',
                'address' => 'Maarif, Casablanca',
                'latitude' => 33.5842000,
                'longitude' => -7.6289000,
                'current_cash' => 10000.00,
                'max_capacity' => 200000.00,
                'status' => 'active',
                'is_active' => true,
                'notes' => 'Chatbot MVP seed ATM.',
            ],
            [
                'code' => 'CIM-MVP-TWN-001',
                'name' => 'Twin Center ATM',
                'city' => 'Casablanca',
                'area' => 'Maarif/Casa',
                'address' => 'Twin Center, Casablanca',
                'latitude' => 33.5869000,
                'longitude' => -7.6329000,
                'current_cash' => 7000.00,
                'max_capacity' => 200000.00,
                'status' => 'active',
                'is_active' => true,
                'notes' => 'Chatbot MVP seed ATM.',
            ],
            [
                'code' => 'CIM-MVP-CFC-001',
                'name' => 'Casa Finance City ATM',
                'city' => 'Casablanca',
                'area' => 'Casa Finance City',
                'address' => 'Casa Finance City, Casablanca',
                'latitude' => 33.5339000,
                'longitude' => -7.6483000,
                'current_cash' => 12000.00,
                'max_capacity' => 200000.00,
                'status' => 'active',
                'is_active' => true,
                'notes' => 'Chatbot MVP seed ATM.',
            ],
            [
                'code' => 'CIM-MVP-HAY-001',
                'name' => 'Hay Hassani ATM',
                'city' => 'Casablanca',
                'area' => 'Hay Hassani',
                'address' => 'Hay Hassani, Casablanca',
                'latitude' => 33.5532000,
                'longitude' => -7.6746000,
                'current_cash' => 0.00,
                'max_capacity' => 150000.00,
                'status' => 'out_of_service',
                'is_active' => false,
                'notes' => 'Maintenance. Chatbot MVP seed ATM.',
            ],

            // ── 1. Ain Sebaa (near LionsGeek / Zoo) — HIGHLIGHTED ──────────────
            [
                'code' => 'CIM-AIN-001',
                'name' => 'CIM ATM Ain Sebaa — LionsGeek',
                'city' => 'Casablanca',
                'area' => 'Ain Sebaa',
                'address' => 'Bd Bir Anzarane, près du Zoo de Casablanca, Ain Sebaa',
                'latitude' => 33.6087000,
                'longitude' => -7.5396000,
                'current_cash' => 85000.00,
                'max_capacity' => 200000.00,
                'status' => 'active',
                'is_active' => true,
                'notes' => 'Highlighted ATM near LionsGeek tech hub and Ain Sebaa Zoo area.',
            ],

            // ── 2. Maarif ────────────────────────────────────────────────────────
            [
                'code' => 'CIM-MAA-001',
                'name' => 'CIM ATM Maarif Centre',
                'city' => 'Casablanca',
                'area' => 'Maarif',
                'address' => 'Rue Ibnou Sina, Maarif, Casablanca',
                'latitude' => 33.5832000,
                'longitude' => -7.6287000,
                'current_cash' => 120000.00,
                'max_capacity' => 200000.00,
                'status' => 'active',
                'is_active' => true,
                'notes' => null,
            ],

            // ── 3. Sidi Maarouf ──────────────────────────────────────────────────
            [
                'code' => 'CIM-SID-001',
                'name' => 'CIM ATM Sidi Maarouf Technopark',
                'city' => 'Casablanca',
                'area' => 'Sidi Maarouf',
                'address' => 'Technopark Casablanca, Route de Nouasseur, Sidi Maarouf',
                'latitude' => 33.5419000,
                'longitude' => -7.6547000,
                'current_cash' => 95000.00,
                'max_capacity' => 200000.00,
                'status' => 'active',
                'is_active' => true,
                'notes' => null,
            ],

            // ── 4. Hay Hassani ────────────────────────────────────────────────────
            [
                'code' => 'CIM-HAY-001',
                'name' => 'CIM ATM Hay Hassani',
                'city' => 'Casablanca',
                'area' => 'Hay Hassani',
                'address' => 'Bd Ahl Loghlam, Hay Hassani, Casablanca',
                'latitude' => 33.5532000,
                'longitude' => -7.6746000,
                'current_cash' => 75000.00,
                'max_capacity' => 150000.00,
                'status' => 'active',
                'is_active' => true,
                'notes' => null,
            ],

            // ── 5. Anfa ────────────────────────────────────────────────────────────
            [
                'code' => 'CIM-ANF-001',
                'name' => 'CIM ATM Anfa Place',
                'city' => 'Casablanca',
                'area' => 'Anfa',
                'address' => 'Anfa Place Shopping Center, Bd de la Corniche, Anfa',
                'latitude' => 33.5895000,
                'longitude' => -7.6497000,
                'current_cash' => 160000.00,
                'max_capacity' => 200000.00,
                'status' => 'active',
                'is_active' => true,
                'notes' => null,
            ],

            // ── 6. Bourgogne ───────────────────────────────────────────────────────
            [
                'code' => 'CIM-BOU-001',
                'name' => 'CIM ATM Bourgogne',
                'city' => 'Casablanca',
                'area' => 'Bourgogne',
                'address' => 'Rue Bourgogne, Quartier Bourgogne, Casablanca',
                'latitude' => 33.5931000,
                'longitude' => -7.6247000,
                'current_cash' => 50000.00,
                'max_capacity' => 150000.00,
                'status' => 'active',
                'is_active' => true,
                'notes' => null,
            ],

            // ── 7. Derb Sultan — LOW CASH ─────────────────────────────────────────
            [
                'code' => 'CIM-DER-001',
                'name' => 'CIM ATM Derb Sultan',
                'city' => 'Casablanca',
                'area' => 'Derb Sultan',
                'address' => 'Bd Moulay Rachid, Derb Sultan, Casablanca',
                'latitude' => 33.5747000,
                'longitude' => -7.5983000,
                'current_cash' => 8500.00,
                'max_capacity' => 150000.00,
                'status' => 'low_cash',
                'is_active' => true,
                'notes' => 'Cash running low — restock scheduled.',
            ],

            // ── 8. Roches Noires — EMPTY ──────────────────────────────────────────
            [
                'code' => 'CIM-ROC-001',
                'name' => 'CIM ATM Roches Noires',
                'city' => 'Casablanca',
                'area' => 'Roches Noires',
                'address' => 'Bd des FAR, Roches Noires, Casablanca',
                'latitude' => 33.6047000,
                'longitude' => -7.5667000,
                'current_cash' => 0.00,
                'max_capacity' => 150000.00,
                'status' => 'empty',
                'is_active' => true,
                'notes' => 'Empty — cash replenishment in progress.',
            ],

            // ── 9. Casa Finance City — OUT OF SERVICE ─────────────────────────────
            [
                'code' => 'CIM-CFC-001',
                'name' => 'CIM ATM Casa Finance City',
                'city' => 'Casablanca',
                'area' => 'Casa Finance City',
                'address' => 'Boulevard Roudani, Casa Finance City, Casablanca',
                'latitude' => 33.5339000,
                'longitude' => -7.6483000,
                'current_cash' => 0.00,
                'max_capacity' => 200000.00,
                'status' => 'out_of_service',
                'is_active' => false,
                'notes' => 'Maintenance in progress. Expected back online within 48h.',
            ],

            // ── 10. Centre Ville ──────────────────────────────────────────────────
            [
                'code' => 'CIM-CVL-001',
                'name' => 'CIM ATM Centre Ville',
                'city' => 'Casablanca',
                'area' => 'Centre Ville',
                'address' => 'Bd Mohammed V, Centre Ville, Casablanca',
                'latitude' => 33.5973000,
                'longitude' => -7.6197000,
                'current_cash' => 110000.00,
                'max_capacity' => 200000.00,
                'status' => 'active',
                'is_active' => true,
                'notes' => null,
            ],
        ];

        foreach ($atms as $data) {
            $atm = Atm::updateOrCreate(['code' => $data['code']], $data);

            // Seed an initial "load" cash movement for ATMs that have cash
            if ($atm->current_cash > 0) {
                AtmCashMovement::updateOrCreate(
                    ['atm_id' => $atm->id, 'type' => 'load', 'note' => 'Initial cash load — system seed'],
                    [
                        'admin_user_id' => null,
                        'amount' => $atm->current_cash,
                        'cash_before' => 0.00,
                        'cash_after' => $atm->current_cash,
                    ]
                );
            }
        }
    }
}
