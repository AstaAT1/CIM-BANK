<?php

namespace Database\Seeders;

use App\Models\AccountOpeningRequest;
use App\Models\AccountTransaction;
use App\Models\Atm;
use App\Models\AtmCashMovement;
use App\Models\BankAccount;
use App\Models\BankCard;
use App\Models\Branch;
use App\Models\CustomerProfile;
use App\Models\Document;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\PermissionRegistrar;

class ProductionDemoSeeder extends Seeder
{
    private const DEMO_PASSWORD = 'Password123!';

    public function run(): void
    {
        $this->call(RolesAndPermissionsSeeder::class);

        DB::transaction(function (): void {
            $branches = $this->seedBranches();
            [, $employee, $customer] = $this->seedUsers();

            $profile = $this->seedCustomerProfile($customer);
            $openingRequest = $this->seedAccountOpeningRequest($customer, $profile, $branches['casablanca'], $employee);
            $this->seedDocuments($customer, $openingRequest, $employee);

            $account = $this->seedBankAccount($customer);
            $this->seedBankCard($customer, $account);
            $this->seedTransactions($account);

            $this->seedAtms();
        });

        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }

    /**
     * @return array{casablanca: Branch, rabat: Branch, marrakech: Branch}
     */
    private function seedBranches(): array
    {
        $branches = [
            'casablanca' => [
                'name' => 'CIM Casablanca Central',
                'code' => 'CIM-CAS-CEN',
                'city' => 'Casablanca',
                'address' => '24 Boulevard Mohammed V, Casablanca',
                'phone' => '+212522000101',
            ],
            'rabat' => [
                'name' => 'CIM Rabat Agdal',
                'code' => 'CIM-RBA-AGD',
                'city' => 'Rabat',
                'address' => '12 Avenue Fal Ould Oumeir, Agdal, Rabat',
                'phone' => '+212537000202',
            ],
            'marrakech' => [
                'name' => 'CIM Marrakech Gueliz',
                'code' => 'CIM-RAK-GUE',
                'city' => 'Marrakech',
                'address' => '30 Avenue Mohammed V, Gueliz, Marrakech',
                'phone' => '+212524000303',
            ],
        ];

        return collect($branches)
            ->map(fn (array $branch): Branch => Branch::updateOrCreate(
                ['code' => $branch['code']],
                [
                    ...$branch,
                    'opening_time' => '08:30',
                    'closing_time' => '16:30',
                    'is_active' => true,
                ],
            ))
            ->all();
    }

    /**
     * @return array{0: User, 1: User, 2: User}
     */
    private function seedUsers(): array
    {
        $users = [
            [
                'name' => 'CIM Demo Admin',
                'email' => 'admin@cim.test',
                'phone' => '+212600000001',
                'role' => 'admin',
            ],
            [
                'name' => 'CIM Demo Employee',
                'email' => 'employee@cim.test',
                'phone' => '+212600000002',
                'role' => 'employee',
            ],
            [
                'name' => 'CIM Demo Customer',
                'email' => 'customer@cim.test',
                'phone' => '+212600000003',
                'role' => 'customer',
            ],
        ];

        return collect($users)
            ->map(function (array $demoUser): User {
                $user = User::updateOrCreate(
                    ['email' => $demoUser['email']],
                    [
                        'name' => $demoUser['name'],
                        'phone' => $demoUser['phone'],
                        'password' => Hash::make(self::DEMO_PASSWORD),
                        'email_verified_at' => now(),
                    ],
                );

                $user->syncRoles([$demoUser['role']]);

                return $user->refresh();
            })
            ->values()
            ->all();
    }

    private function seedCustomerProfile(User $customer): CustomerProfile
    {
        return CustomerProfile::updateOrCreate(
            ['user_id' => $customer->id],
            [
                'cin' => 'CIMDEMO01',
                'first_name' => 'CIM',
                'last_name' => 'Customer',
                'phone' => '+212600000003',
                'birth_date' => '1992-04-15',
                'address' => '18 Rue Ibn Khaldoun, Casablanca',
                'city' => 'Casablanca',
                'employment_status' => 'salaried',
                'monthly_income' => 18000,
                'status' => 'verified',
                'verified_at' => now()->subDays(12),
            ],
        );
    }

    private function seedAccountOpeningRequest(
        User $customer,
        CustomerProfile $profile,
        Branch $branch,
        User $employee,
    ): AccountOpeningRequest {
        return AccountOpeningRequest::updateOrCreate(
            ['request_number' => 'CIM-DEMO-CUSTOMER-0001'],
            [
                'user_id' => $customer->id,
                'customer_profile_id' => $profile->id,
                'branch_id' => $branch->id,
                'account_type' => 'current',
                'status' => 'account_created',
                'rejection_reason' => null,
                'reviewed_by' => $employee->id,
                'submitted_at' => now()->subDays(14),
                'reviewed_at' => now()->subDays(12),
            ],
        );
    }

    private function seedDocuments(User $customer, AccountOpeningRequest $openingRequest, User $employee): void
    {
        $documents = [
            'cin_front' => 'CIN front',
            'cin_back' => 'CIN back',
            'proof_of_address' => 'Proof of address',
        ];

        foreach ($documents as $type => $label) {
            Document::updateOrCreate(
                [
                    'user_id' => $customer->id,
                    'account_opening_request_id' => $openingRequest->id,
                    'document_type' => $type,
                ],
                [
                    'file_path' => 'demo-documents/production/'.$type.'.pdf',
                    'original_name' => $label.'.pdf',
                    'mime_type' => 'application/pdf',
                    'size' => 256000,
                    'status' => 'approved',
                    'rejection_reason' => null,
                    'reviewed_by' => $employee->id,
                    'reviewed_at' => now()->subDays(12),
                ],
            );
        }
    }

    private function seedBankAccount(User $customer): BankAccount
    {
        return BankAccount::updateOrCreate(
            ['account_number' => 'MA64011780000000000000123456'],
            [
                'user_id' => $customer->id,
                'rib' => '011780000000000001234561',
                'account_type' => 'current',
                'balance' => 10000.00,
                'currency' => 'MAD',
                'status' => 'active',
                'opened_at' => now()->subDays(12),
                'closed_at' => null,
            ],
        );
    }

    private function seedBankCard(User $customer, BankAccount $account): BankCard
    {
        return BankCard::updateOrCreate(
            ['card_token' => 'cim-demo-customer-card-2026'],
            [
                'user_id' => $customer->id,
                'bank_account_id' => $account->id,
                'card_holder_name' => $customer->name,
                'card_number_last4' => '4242',
                'masked_card_number' => '4567  ****  ****  4242',
                'expiry_month' => 12,
                'expiry_year' => now()->addYears(4)->year,
                'status' => 'active',
            ],
        );
    }

    private function seedTransactions(BankAccount $account): void
    {
        $transactions = [
            [
                'reference' => 'CIM-DEMO-TX-0001',
                'type' => 'deposit',
                'direction' => 'in',
                'amount' => 10000.00,
                'balance_after' => 10000.00,
                'description' => 'Opening balance funded for the production demo account',
                'performed_at' => now()->subDays(9),
            ],
            [
                'reference' => 'CIM-DEMO-TX-0002',
                'type' => 'card_payment',
                'direction' => 'out',
                'amount' => 275.50,
                'balance_after' => 9724.50,
                'description' => 'Card payment at Morocco Mall',
                'performed_at' => now()->subDays(5),
            ],
            [
                'reference' => 'CIM-DEMO-TX-0003',
                'type' => 'transfer_in',
                'direction' => 'in',
                'amount' => 800.00,
                'balance_after' => 10524.50,
                'description' => 'Incoming transfer from Atlas Consulting',
                'performed_at' => now()->subDays(3),
            ],
            [
                'reference' => 'CIM-DEMO-TX-0004',
                'type' => 'bill_payment',
                'direction' => 'out',
                'amount' => 524.50,
                'balance_after' => 10000.00,
                'description' => 'ONEE utility bill payment',
                'performed_at' => now()->subDay(),
            ],
        ];

        foreach ($transactions as $transaction) {
            AccountTransaction::updateOrCreate(
                ['reference' => $transaction['reference']],
                [
                    'bank_account_id' => $account->id,
                    'type' => $transaction['type'],
                    'direction' => $transaction['direction'],
                    'amount' => $transaction['amount'],
                    'balance_after' => $transaction['balance_after'],
                    'description' => $transaction['description'],
                    'status' => 'completed',
                    'performed_at' => $transaction['performed_at'],
                ],
            );
        }
    }

    private function seedAtms(): void
    {
        if (! Schema::hasTable('atms')) {
            return;
        }

        $atms = [
            [
                'code' => 'CIM-DEMO-CAS-CEN-ATM1',
                'name' => 'CIM Casablanca Central ATM',
                'city' => 'Casablanca',
                'area' => 'Centre Ville',
                'address' => '24 Boulevard Mohammed V, Casablanca',
                'latitude' => 33.5942200,
                'longitude' => -7.6149700,
                'current_cash' => 175000.00,
                'max_capacity' => 200000.00,
                'status' => 'active',
                'is_active' => true,
                'notes' => 'Production demo ATM with healthy cash level.',
            ],
            [
                'code' => 'CIM-DEMO-RBA-AGD-ATM1',
                'name' => 'CIM Rabat Agdal ATM',
                'city' => 'Rabat',
                'area' => 'Agdal',
                'address' => '12 Avenue Fal Ould Oumeir, Agdal, Rabat',
                'latitude' => 34.0008900,
                'longitude' => -6.8477700,
                'current_cash' => 126500.00,
                'max_capacity' => 180000.00,
                'status' => 'active',
                'is_active' => true,
                'notes' => 'Production demo ATM with healthy cash level.',
            ],
            [
                'code' => 'CIM-DEMO-RAK-GUE-ATM1',
                'name' => 'CIM Marrakech Gueliz ATM',
                'city' => 'Marrakech',
                'area' => 'Gueliz',
                'address' => '30 Avenue Mohammed V, Gueliz, Marrakech',
                'latitude' => 31.6341600,
                'longitude' => -8.0133900,
                'current_cash' => 12500.00,
                'max_capacity' => 120000.00,
                'status' => 'low_cash',
                'is_active' => true,
                'notes' => 'Production demo ATM showing the low cash state.',
            ],
            [
                'code' => 'CIM-DEMO-CAS-MNT-ATM1',
                'name' => 'CIM Casablanca Maintenance ATM',
                'city' => 'Casablanca',
                'area' => 'Anfa',
                'address' => 'Boulevard de la Corniche, Anfa, Casablanca',
                'latitude' => 33.5961700,
                'longitude' => -7.6697200,
                'current_cash' => 0.00,
                'max_capacity' => 150000.00,
                'status' => 'out_of_service',
                'is_active' => false,
                'notes' => 'Production demo ATM intentionally out of service.',
            ],
        ];

        foreach ($atms as $data) {
            $atm = Atm::updateOrCreate(['code' => $data['code']], $data);

            if (Schema::hasTable('atm_cash_movements') && (float) $atm->current_cash > 0) {
                AtmCashMovement::updateOrCreate(
                    [
                        'atm_id' => $atm->id,
                        'type' => 'load',
                        'note' => 'Production demo cash load',
                    ],
                    [
                        'admin_user_id' => null,
                        'amount' => $atm->current_cash,
                        'cash_before' => 0.00,
                        'cash_after' => $atm->current_cash,
                    ],
                );
            }
        }
    }
}
