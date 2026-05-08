<?php

namespace Tests\Feature;

use App\Models\AccountOpeningRequest;
use App\Models\AccountTransaction;
use App\Models\BankAccount;
use App\Models\Beneficiary;
use App\Models\Branch;
use App\Models\CustomerProfile;
use App\Models\TransferRequest;
use App\Models\User;
use Database\Seeders\BranchSeeder;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BackendAuditTest extends TestCase
{
    use RefreshDatabase;

    public function test_backend_role_access_is_enforced(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $customer = User::factory()->create()->assignRole('customer');
        $employee = User::factory()->create()->assignRole('employee');
        $admin = User::factory()->create()->assignRole('admin');
        CustomerProfile::create([
            'user_id' => $customer->id,
            'cin' => 'ROLE123456',
            'first_name' => 'Role',
            'last_name' => 'Customer',
            'status' => 'verified',
            'verified_at' => now(),
        ]);

        $this->actingAs($customer)
            ->get(route('backend.customer.dashboard'))
            ->assertOk();

        $this->actingAs($customer)
            ->get(route('backend.admin.dashboard'))
            ->assertForbidden();

        $this->actingAs($employee)
            ->get(route('backend.admin.dashboard'))
            ->assertOk();

        $this->actingAs($employee)
            ->get(route('backend.admin.users.index'))
            ->assertForbidden();

        $this->actingAs($admin)
            ->get(route('backend.admin.users.index'))
            ->assertOk();
    }

    public function test_demo_seed_data_exists(): void
    {
        $this->seed(DatabaseSeeder::class);

        $this->assertTrue(User::where('email', 'admin@example.com')->firstOrFail()->hasRole('admin'));
        $this->assertTrue(User::where('email', 'employee@example.com')->firstOrFail()->hasRole('employee'));
        $this->assertTrue(User::where('email', 'customer@example.com')->firstOrFail()->hasRole('customer'));
        $this->assertTrue(User::where('email', 'test@example.com')->firstOrFail()->hasRole('admin'));

        $this->assertSame(5, Branch::count());
        $this->assertNotNull(CustomerProfile::whereRelation('user', 'email', 'customer@example.com')->first());
        $this->assertNotNull(AccountOpeningRequest::where('request_number', 'AOR-2026-0001')->first());
        $this->assertNotNull(BankAccount::whereRelation('user', 'email', 'customer@example.com')->first());
    }

    public function test_core_customer_and_admin_banking_flow_works(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $this->seed(BranchSeeder::class);

        $customer = User::factory()->create()->assignRole('customer');
        $employee = User::factory()->create()->assignRole('employee');
        $branch = Branch::where('code', 'CAS-MAA')->firstOrFail();

        $this->actingAs($customer)
            ->patch(route('backend.customer.profile.update'), [
                'cin' => 'BK123456',
                'first_name' => 'Nour',
                'last_name' => 'Tazi',
                'phone' => '+212660000001',
                'birth_date' => '1992-02-20',
                'address' => '15 Avenue Hassan II',
                'city' => 'Casablanca',
                'employment_status' => 'salaried',
                'monthly_income' => 11000,
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseHas('customer_profiles', [
            'user_id' => $customer->id,
            'cin' => 'BK123456',
            'city' => 'Casablanca',
        ]);

        $customer->profile()->update([
            'status' => 'verified',
            'verified_at' => now(),
        ]);

        $customer->refresh()->unsetRelation('profile');

        $this->actingAs($customer)
            ->post(route('backend.customer.account-opening.store'), [
                'branch_id' => $branch->id,
                'account_type' => 'current',
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $accountOpeningRequest = $customer->accountOpeningRequests()->firstOrFail();
        $this->assertSame('submitted', $accountOpeningRequest->status);

        $this->actingAs($customer)
            ->post(route('backend.customer.documents.store'), [
                'document_type' => 'cin_front',
                'file_path' => 'demo/cin-front.pdf',
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->actingAs($customer)
            ->post(route('backend.customer.appointments.store'), [
                'branch_id' => $branch->id,
                'scheduled_at' => now()->addDays(2)->format('Y-m-d H:i:s'),
                'notes' => 'Morning appointment preferred.',
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertSame('appointment_scheduled', $accountOpeningRequest->fresh()->status);

        $this->actingAs($employee)
            ->patch(route('backend.admin.account-opening-requests.under-review', $accountOpeningRequest))
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->actingAs($employee)
            ->patch(route('backend.admin.account-opening-requests.approve', $accountOpeningRequest))
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->actingAs($employee)
            ->post(route('backend.admin.account-opening-requests.bank-account', $accountOpeningRequest))
            ->assertRedirect()
            ->assertSessionHas('success');

        $accountOpeningRequest->refresh();
        $bankAccount = $customer->bankAccounts()->firstOrFail();

        $this->assertSame('account_created', $accountOpeningRequest->status);
        $this->assertSame('active', $bankAccount->status);
        $this->assertSame('1000.00', $bankAccount->balance);
        $this->assertDatabaseHas('audit_logs', ['action' => 'bank_account_created']);

        $bankAccount->update(['balance' => 1000]);

        $receiver = User::factory()->create()->assignRole('customer');
        CustomerProfile::create([
            'user_id' => $receiver->id,
            'cin' => 'BK654321',
            'first_name' => 'Omar',
            'last_name' => 'Radi',
            'status' => 'verified',
            'verified_at' => now(),
        ]);
        $receiverAccount = BankAccount::create([
            'user_id' => $receiver->id,
            'account_number' => 'MA-BACKEND-RECEIVER-001',
            'rib' => '011780000012340000000145',
            'balance' => 300,
            'status' => 'active',
        ]);

        $this->actingAs($customer)
            ->post(route('backend.customer.beneficiaries.store'), [
                'full_name' => 'Omar Radi',
                'bank_name' => 'CIM Bank',
                'identifier' => $receiverAccount->rib,
                'phone' => '+212660000002',
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $beneficiary = Beneficiary::where('user_id', $customer->id)->firstOrFail();
        $this->assertSame('active', $beneficiary->status);
        $this->assertNotNull($beneficiary->verified_at);

        $this->actingAs($customer)
            ->post(route('backend.customer.transfers.store'), [
                'from_account_id' => $bankAccount->id,
                'beneficiary_id' => $beneficiary->id,
                'amount' => 200,
                'note' => 'Family support',
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $transferRequest = TransferRequest::where('from_account_id', $bankAccount->id)->firstOrFail();

        $this->assertSame('completed', $transferRequest->fresh()->status);
        $this->assertSame('800.00', $bankAccount->fresh()->balance);
        $this->assertSame('500.00', $receiverAccount->fresh()->balance);
        $this->assertDatabaseHas('account_transactions', [
            'bank_account_id' => $bankAccount->id,
            'type' => 'transfer',
            'direction' => 'out',
            'amount' => 200,
            'balance_after' => 800,
        ]);
        $this->assertDatabaseHas('account_transactions', [
            'bank_account_id' => $receiverAccount->id,
            'type' => 'transfer',
            'direction' => 'in',
            'amount' => 200,
            'balance_after' => 500,
        ]);
        $this->assertDatabaseHas('audit_logs', ['action' => 'internal_transfer_completed']);
    }

    public function test_transfer_completion_requires_active_account_and_sufficient_balance(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $customer = User::factory()->create()->assignRole('customer');
        $employee = User::factory()->create()->assignRole('employee');

        $bankAccount = BankAccount::create([
            'user_id' => $customer->id,
            'account_number' => 'MA-AUDIT-001',
            'rib' => 'RIB-AUDIT-001',
            'balance' => 50,
            'status' => 'frozen',
        ]);

        $beneficiary = Beneficiary::create([
            'user_id' => $customer->id,
            'full_name' => 'Lina Saidi',
            'rib' => 'RIB-AUDIT-BENEFICIARY',
        ]);

        $frozenTransfer = TransferRequest::create([
            'from_account_id' => $bankAccount->id,
            'beneficiary_id' => $beneficiary->id,
            'reference' => 'TR-AUDIT-FROZEN',
            'amount' => 10,
            'fee' => 0,
            'status' => 'pending',
        ]);

        $this->actingAs($employee)
            ->patch(route('backend.admin.transfers.complete', $frozenTransfer))
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertSame('pending', $frozenTransfer->fresh()->status);
        $this->assertSame('50.00', $bankAccount->fresh()->balance);

        $bankAccount->update(['status' => 'active']);

        $largeTransfer = TransferRequest::create([
            'from_account_id' => $bankAccount->id,
            'beneficiary_id' => $beneficiary->id,
            'reference' => 'TR-AUDIT-LARGE',
            'amount' => 100,
            'fee' => 1,
            'status' => 'pending',
        ]);

        $this->actingAs($employee)
            ->patch(route('backend.admin.transfers.complete', $largeTransfer))
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertSame('pending', $largeTransfer->fresh()->status);
        $this->assertSame('50.00', $bankAccount->fresh()->balance);
        $this->assertSame(0, AccountTransaction::count());
    }
}
