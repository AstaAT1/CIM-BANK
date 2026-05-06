<?php

namespace Tests\Feature;

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
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BankingDatabaseLayerTest extends TestCase
{
    use RefreshDatabase;

    public function test_core_banking_relationships_work(): void
    {
        $customer = User::factory()->create();
        $employee = User::factory()->create();

        $profile = CustomerProfile::create([
            'user_id' => $customer->id,
            'cin' => 'AB123456',
            'first_name' => 'Amine',
            'last_name' => 'Bennani',
            'monthly_income' => 8500,
            'status' => 'verified',
        ]);

        $branch = Branch::create([
            'name' => 'Casablanca Centre',
            'code' => 'CASA-001',
            'city' => 'Casablanca',
            'address' => 'Boulevard Mohammed V',
        ]);

        $openingRequest = AccountOpeningRequest::create([
            'user_id' => $customer->id,
            'customer_profile_id' => $profile->id,
            'branch_id' => $branch->id,
            'request_number' => 'AOR-000001',
            'account_type' => 'current',
            'status' => 'submitted',
            'reviewed_by' => $employee->id,
        ]);

        $appointment = Appointment::create([
            'account_opening_request_id' => $openingRequest->id,
            'branch_id' => $branch->id,
            'customer_id' => $customer->id,
            'scheduled_at' => now()->addDay(),
        ]);

        $document = Document::create([
            'user_id' => $customer->id,
            'account_opening_request_id' => $openingRequest->id,
            'document_type' => 'cin_front',
            'file_path' => 'documents/cin-front.pdf',
        ]);

        $account = BankAccount::create([
            'user_id' => $customer->id,
            'account_number' => '001234567890',
            'rib' => 'RIB001234567890',
            'balance' => 1500,
        ]);

        $transaction = AccountTransaction::create([
            'bank_account_id' => $account->id,
            'reference' => 'TX-000001',
            'type' => 'deposit',
            'direction' => 'in',
            'amount' => 1500,
            'balance_after' => 1500,
        ]);

        $beneficiary = Beneficiary::create([
            'user_id' => $customer->id,
            'full_name' => 'Sara Alaoui',
            'rib' => 'RIB009876543210',
            'status' => 'active',
        ]);

        $transfer = TransferRequest::create([
            'from_account_id' => $account->id,
            'beneficiary_id' => $beneficiary->id,
            'reference' => 'TR-000001',
            'amount' => 250,
            'fee' => 5,
        ]);

        $auditLog = AuditLog::create([
            'user_id' => $employee->id,
            'action' => 'account_opening_reviewed',
            'model_type' => AccountOpeningRequest::class,
            'model_id' => $openingRequest->id,
            'metadata' => ['status' => 'submitted'],
        ]);

        $this->assertTrue($customer->profile->is($profile));
        $this->assertTrue($customer->bankAccounts->first()->is($account));
        $this->assertTrue($customer->beneficiaries->first()->is($beneficiary));
        $this->assertTrue($customer->accountOpeningRequests->first()->is($openingRequest));
        $this->assertTrue($customer->documents->first()->is($document));
        $this->assertTrue($customer->appointments->first()->is($appointment));

        $this->assertTrue($openingRequest->branch->is($branch));
        $this->assertTrue($openingRequest->appointment->is($appointment));
        $this->assertTrue($openingRequest->documents->first()->is($document));
        $this->assertTrue($account->transactions->first()->is($transaction));
        $this->assertTrue($transfer->sourceAccount->is($account));
        $this->assertTrue($transfer->beneficiary->is($beneficiary));
        $this->assertTrue($auditLog->user->is($employee));
    }

    public function test_audit_log_user_is_nullable(): void
    {
        $auditLog = AuditLog::create([
            'action' => 'system_event',
            'description' => 'Created by the system without an authenticated user.',
        ]);

        $this->assertNull($auditLog->user);
    }
}
