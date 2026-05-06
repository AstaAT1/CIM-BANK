<?php

namespace Database\Seeders;

use App\Models\AccountOpeningRequest;
use App\Models\AccountTransaction;
use App\Models\Appointment;
use App\Models\AuditLog;
use App\Models\BankAccount;
use App\Models\Beneficiary;
use App\Models\Branch;
use App\Models\CustomerProfile;
use App\Models\Document;
use App\Models\TransferRequest;
use App\Models\User;
use App\Services\BankCardService;
use Illuminate\Database\Seeder;

class DemoBankDataSeeder extends Seeder
{
    public function run(): void
    {
        $customer = User::where('email', 'customer@example.com')->firstOrFail();
        $employee = User::where('email', 'employee@example.com')->firstOrFail();
        $admin = User::where('email', 'admin@example.com')->firstOrFail();
        $branch = Branch::where('name', 'Casablanca Maarif')->firstOrFail();

        $profile = CustomerProfile::updateOrCreate([
            'user_id' => $customer->id,
        ], [
            'cin' => 'BE123456',
            'first_name' => 'Sara',
            'last_name' => 'Bennani',
            'phone' => '+212661234567',
            'birth_date' => '1993-05-14',
            'address' => '12 Rue Ibnou Sina, Maarif',
            'city' => 'Casablanca',
            'employment_status' => 'salaried',
            'monthly_income' => 12500,
            'status' => 'verified',
            'verified_at' => now()->subDays(10),
        ]);

        $openingRequest = AccountOpeningRequest::updateOrCreate([
            'request_number' => 'AOR-2026-0001',
        ], [
            'user_id' => $customer->id,
            'customer_profile_id' => $profile->id,
            'branch_id' => $branch->id,
            'account_type' => 'current',
            'status' => 'submitted',
            'rejection_reason' => null,
            'reviewed_by' => $employee->id,
            'submitted_at' => now()->subDays(5),
            'reviewed_at' => null,
        ]);

        Appointment::updateOrCreate([
            'account_opening_request_id' => $openingRequest->id,
        ], [
            'branch_id' => $branch->id,
            'customer_id' => $customer->id,
            'scheduled_at' => now()->addDays(3)->setTime(10, 30),
            'status' => 'scheduled',
            'notes' => 'Bring original CIN and proof of address for final verification.',
        ]);

        $documents = [
            ['cin_front', 'CIN front', 'approved', 'cin-front.pdf', $employee->id, now()->subDays(3)],
            ['cin_back', 'CIN back', 'approved', 'cin-back.pdf', $employee->id, now()->subDays(3)],
            ['proof_of_address', 'Proof of address', 'pending', 'proof-of-address.pdf', null, null],
            ['salary_certificate', 'Salary certificate', 'pending', 'salary-certificate.pdf', null, null],
        ];

        foreach ($documents as [$type, $label, $status, $fileName, $reviewedBy, $reviewedAt]) {
            Document::updateOrCreate([
                'user_id' => $customer->id,
                'account_opening_request_id' => $openingRequest->id,
                'document_type' => $type,
            ], [
                'file_path' => 'demo-documents/'.$fileName,
                'original_name' => $label.'.pdf',
                'mime_type' => 'application/pdf',
                'size' => 420000,
                'status' => $status,
                'rejection_reason' => null,
                'reviewed_by' => $reviewedBy,
                'reviewed_at' => $reviewedAt,
            ]);
        }

        $account = BankAccount::updateOrCreate([
            'account_number' => 'MA640011223344556677889900',
        ], [
            'user_id' => $customer->id,
            'rib' => '011780000012345678900174',
            'account_type' => 'current',
            'balance' => 1000.00,
            'currency' => 'MAD',
            'status' => 'active',
            'opened_at' => now()->subMonths(2),
            'closed_at' => null,
        ]);

        $transactions = [
            ['TX-2026-0001', 'salary',       'in',  12500,   12500.00, 'Salary received from Atlas Digital Services',    now()->subDays(12)],
            ['TX-2026-0002', 'card_payment', 'out',   460.75, 12039.25, 'Card payment at Marjane Californie',             now()->subDays(10)],
            ['TX-2026-0003', 'transfer',     'out',  1200,   10839.25, 'Transfer sent to Hamza El Idrissi',              now()->subDays(8)],
            ['TX-2026-0004', 'bill_payment', 'out',   389.25, 10450.00, 'ONEE electricity bill payment',                  now()->subDays(6)],
            ['TX-2026-0005', 'deposit',      'in',   3700,   14150.00, 'Cash deposit at Casablanca Maarif branch',       now()->subDays(2)],
            ['TX-2026-0006', 'atm',          'out', 13150,    1000.00, 'ATM cash adjustment for testing (balance reset)', now()->subDays(1)],
        ];

        foreach ($transactions as [$reference, $type, $direction, $amount, $balanceAfter, $description, $performedAt]) {
            AccountTransaction::updateOrCreate([
                'reference' => $reference,
            ], [
                'bank_account_id' => $account->id,
                'type' => $type,
                'direction' => $direction,
                'amount' => $amount,
                'balance_after' => $balanceAfter,
                'description' => $description,
                'status' => 'completed',
                'performed_at' => $performedAt,
            ]);
        }

        if (! $customer->bankCards()->where('bank_account_id', $account->id)->exists()) {
            $account->load('user');
            (new BankCardService)->createForAccount($account);
        }

        $hamza = Beneficiary::updateOrCreate([
            'user_id' => $customer->id,
            'rib' => '011780000098765432100149',
        ], [
            'full_name' => 'Hamza El Idrissi',
            'bank_name' => 'Mizan Bank',
            'phone' => '+212662345678',
            'status' => 'active',
            'verified_at' => now()->subDays(14),
        ]);

        $nadia = Beneficiary::updateOrCreate([
            'user_id' => $customer->id,
            'rib' => '007780000011112222330088',
        ], [
            'full_name' => 'Nadia Alaoui',
            'bank_name' => 'Attijariwafa Bank',
            'phone' => '+212663456789',
            'status' => 'pending',
            'verified_at' => null,
        ]);

        TransferRequest::updateOrCreate([
            'reference' => 'TR-2026-0001',
        ], [
            'from_account_id' => $account->id,
            'beneficiary_id' => $hamza->id,
            'amount' => 1200,
            'fee' => 0,
            'transfer_type' => 'internal',
            'status' => 'completed',
            'reason' => 'Family support',
            'processed_by' => $employee->id,
            'processed_at' => now()->subDays(8),
            'completed_at' => now()->subDays(8)->addMinutes(3),
        ]);

        TransferRequest::updateOrCreate([
            'reference' => 'TR-2026-0002',
        ], [
            'from_account_id' => $account->id,
            'beneficiary_id' => $nadia->id,
            'amount' => 2500,
            'fee' => 15,
            'transfer_type' => 'external',
            'status' => 'processing',
            'reason' => 'Rent contribution',
            'processed_by' => $employee->id,
            'processed_at' => now()->subDay(),
            'completed_at' => null,
        ]);

        $this->seedAuditLogs($admin, $employee, $customer, $profile, $openingRequest, $account);
    }

    private function seedAuditLogs(
        User $admin,
        User $employee,
        User $customer,
        CustomerProfile $profile,
        AccountOpeningRequest $openingRequest,
        BankAccount $account
    ): void {
        $logs = [
            [
                'user_id' => $admin->id,
                'action' => 'roles_seeded',
                'model_type' => User::class,
                'model_id' => $admin->id,
                'description' => 'Admin verified demo roles and permissions.',
                'metadata' => ['role' => 'admin'],
            ],
            [
                'user_id' => $employee->id,
                'action' => 'customer_profile_verified',
                'model_type' => CustomerProfile::class,
                'model_id' => $profile->id,
                'description' => 'Employee verified customer profile information.',
                'metadata' => ['status' => 'verified'],
            ],
            [
                'user_id' => $customer->id,
                'action' => 'account_opening_submitted',
                'model_type' => AccountOpeningRequest::class,
                'model_id' => $openingRequest->id,
                'description' => 'Customer submitted a current account opening request.',
                'metadata' => ['status' => 'submitted'],
            ],
            [
                'user_id' => $employee->id,
                'action' => 'documents_reviewed',
                'model_type' => AccountOpeningRequest::class,
                'model_id' => $openingRequest->id,
                'description' => 'Employee approved CIN documents and left remaining documents pending.',
                'metadata' => ['approved' => ['cin_front', 'cin_back']],
            ],
            [
                'user_id' => $employee->id,
                'action' => 'bank_account_activated',
                'model_type' => BankAccount::class,
                'model_id' => $account->id,
                'description' => 'Employee activated the customer current account.',
                'metadata' => ['status' => 'active', 'currency' => 'MAD'],
            ],
        ];

        foreach ($logs as $log) {
            AuditLog::updateOrCreate([
                'user_id' => $log['user_id'],
                'action' => $log['action'],
                'model_type' => $log['model_type'],
                'model_id' => $log['model_id'],
            ], [
                'description' => $log['description'],
                'ip_address' => '127.0.0.1',
                'metadata' => $log['metadata'],
            ]);
        }
    }
}
