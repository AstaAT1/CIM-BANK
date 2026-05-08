<?php

namespace Tests\Feature;

use App\Models\AccountOpeningRequest;
use App\Models\AccountTransaction;
use App\Models\Atm;
use App\Models\AtmCashMovement;
use App\Models\AtmWithdrawal;
use App\Models\BankAccount;
use App\Models\BankCard;
use App\Models\Branch;
use App\Models\CustomerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class CimBankingFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'employee']);
        Role::firstOrCreate(['name' => 'customer']);
    }

    public function test_pending_customer_is_redirected_away_from_dashboard_and_atm_routes(): void
    {
        $customer = $this->customerWithProfile('pending');
        $rejectedCustomer = $this->customerWithProfile('rejected');

        $this->actingAs($customer)
            ->get('/dashboard')
            ->assertRedirect(route('account.pending'));

        $this->actingAs($customer)
            ->get('/backend/customer/dashboard')
            ->assertRedirect(route('account.pending'));

        $this->actingAs($customer)
            ->get('/backend/customer/atm-map')
            ->assertRedirect(route('account.pending'));

        $this->actingAs($customer)
            ->post('/backend/customer/atm-withdrawals', [
                'atm_id' => 1,
                'bank_account_id' => 1,
                'amount' => 100,
            ])
            ->assertRedirect(route('account.pending'));

        $atm = $this->atm();

        $this->actingAs($customer)
            ->post("/backend/customer/atms/{$atm->id}/deposit", [
                'bank_account_id' => 1,
                'amount' => 100,
            ])
            ->assertRedirect(route('account.pending'));

        $this->actingAs($rejectedCustomer)
            ->get('/dashboard')
            ->assertRedirect(route('account.pending'));

        $this->actingAs($rejectedCustomer)
            ->get('/backend/customer/atm-map')
            ->assertRedirect(route('account.pending'));
    }

    public function test_approval_creates_active_local_test_account_with_1000_mad(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $customer = $this->customerWithProfile('pending');
        $branch = $this->branch();
        $request = AccountOpeningRequest::create([
            'user_id' => $customer->id,
            'customer_profile_id' => $customer->profile->id,
            'branch_id' => $branch->id,
            'request_number' => 'AOR-TEST-1000',
            'account_type' => 'current',
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        $this->actingAs($admin)
            ->post(route('admin.account-opening-requests.approve', $request))
            ->assertRedirect();

        $account = BankAccount::where('user_id', $customer->id)->first();

        $this->assertSame('verified', $customer->profile()->first()->status);
        $this->assertNotNull($account);
        $this->assertSame('active', $account->status);
        $this->assertSame(1000.00, (float) $account->balance);
    }

    public function test_verified_customer_dashboard_uses_real_account_card_and_activity_data(): void
    {
        $customer = $this->customerWithProfile('verified');
        $account = $this->bankAccount($customer, ['balance' => 1000]);
        $atm = $this->atm(['current_cash' => 5000, 'status' => 'active', 'is_active' => true]);

        BankCard::create([
            'user_id' => $customer->id,
            'bank_account_id' => $account->id,
            'card_holder_name' => 'Test Customer',
            'card_number_last4' => '4242',
            'masked_card_number' => '**** **** **** 4242',
            'expiry_month' => 12,
            'expiry_year' => now()->addYears(3)->year,
            'card_token' => 'test-card-token-dashboard',
            'status' => 'active',
        ]);

        AccountTransaction::create([
            'bank_account_id' => $account->id,
            'reference' => 'DASHBOARD-DEPOSIT-001',
            'type' => 'deposit',
            'direction' => 'in',
            'amount' => 1000,
            'balance_after' => 1000,
            'description' => 'Initial demo balance',
            'status' => 'completed',
            'performed_at' => now()->subMinutes(10),
        ]);

        AtmWithdrawal::create([
            'atm_id' => $atm->id,
            'user_id' => $customer->id,
            'bank_account_id' => $account->id,
            'amount' => 100,
            'status' => 'completed',
            'note' => 'Dashboard test withdrawal',
        ]);

        AccountTransaction::create([
            'bank_account_id' => $account->id,
            'reference' => 'DASHBOARD-ATM-DEPOSIT-001',
            'type' => 'atm_deposit',
            'direction' => 'in',
            'amount' => 250,
            'balance_after' => 1250,
            'description' => 'ATM cash deposit at CIM Test ATM',
            'status' => 'completed',
            'performed_at' => now(),
        ]);

        $this->actingAs($customer)
            ->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('dashboard')
                ->where('account.account_number_last4', substr($account->account_number, -4))
                ->where('account.rib_last4', substr($account->rib, -4))
                ->where('account.balance', 1000)
                ->where('card.masked_card_number', '**** **** **** 4242')
                ->where('card.card_holder_name', 'Test Customer')
                ->has('transactions', 2)
                ->where('transactions.0.type', 'atm_deposit')
                ->where('transactions.0.label', 'ATM Deposit')
                ->where('transactions.0.direction', 'in')
            );
    }

    public function test_admin_can_update_and_load_atm_while_employee_is_read_only(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $employee = User::factory()->create();
        $employee->assignRole('employee');

        $atm = $this->atm(['current_cash' => 1000, 'max_capacity' => 10000, 'status' => 'low_cash']);

        $this->actingAs($employee)
            ->get('/backend/admin/atms')
            ->assertOk();

        $this->actingAs($employee)
            ->patch("/backend/admin/atms/{$atm->id}", $this->atmPayload($atm))
            ->assertForbidden();

        $this->actingAs($employee)
            ->post("/backend/admin/atms/{$atm->id}/load-cash", ['amount' => 500])
            ->assertForbidden();

        $this->actingAs($admin)
            ->patch("/backend/admin/atms/{$atm->id}", [
                ...$this->atmPayload($atm),
                'status' => 'out_of_service',
                'is_active' => false,
            ])
            ->assertRedirect();

        $atm->refresh();
        $this->assertFalse($atm->is_active);
        $this->assertSame('out_of_service', $atm->status);

        $this->actingAs($admin)
            ->post("/backend/admin/atms/{$atm->id}/load-cash", [
                'amount' => 2500,
                'note' => 'Test replenishment',
            ])
            ->assertRedirect();

        $atm->refresh();
        $this->assertSame(3500.00, (float) $atm->current_cash);
        $this->assertSame('active', $atm->status);
        $this->assertFalse($atm->is_active);
        $this->assertDatabaseHas('atm_cash_movements', [
            'atm_id' => $atm->id,
            'admin_user_id' => $admin->id,
            'type' => 'load',
        ]);

        $this->actingAs($admin)
            ->patch("/backend/admin/atms/{$atm->id}", [
                ...$this->atmPayload($atm),
                'status' => 'active',
                'is_active' => true,
            ])
            ->assertRedirect();

        $this->assertTrue($atm->refresh()->is_active);
        $this->assertSame('active', $atm->status);
    }

    public function test_verified_customer_atm_withdrawal_updates_balances_and_records_activity(): void
    {
        $customer = $this->customerWithProfile('verified');
        $account = $this->bankAccount($customer, ['balance' => 10000]);
        $atm = $this->atm(['current_cash' => 5000, 'max_capacity' => 10000, 'status' => 'active', 'is_active' => true]);

        $this->actingAs($customer)
            ->post('/backend/customer/atm-withdrawals', [
                'atm_id' => $atm->id,
                'bank_account_id' => $account->id,
                'amount' => 1200,
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertSame(8800.00, (float) $account->refresh()->balance);
        $this->assertSame(3800.00, (float) $atm->refresh()->current_cash);
        $this->assertSame(1, AtmWithdrawal::where('atm_id', $atm->id)->where('status', 'completed')->count());
        $this->assertSame(1, AtmCashMovement::where('atm_id', $atm->id)->where('type', 'withdrawal')->count());
        $this->assertSame(1, AccountTransaction::where('bank_account_id', $account->id)->where('type', 'withdrawal')->count());
    }

    public function test_verified_customer_can_deposit_cash_at_active_atm(): void
    {
        $customer = $this->customerWithProfile('verified');
        $account = $this->bankAccount($customer, ['balance' => 1000]);
        $atm = $this->atm(['current_cash' => 500, 'max_capacity' => 10000, 'status' => 'empty', 'is_active' => true]);

        $this->actingAs($customer)
            ->post("/backend/customer/atms/{$atm->id}/deposit", [
                'bank_account_id' => $account->id,
                'amount' => 1500,
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertSame(2500.00, (float) $account->refresh()->balance);
        $this->assertSame(2000.00, (float) $atm->refresh()->current_cash);
        $this->assertSame('active', $atm->status);

        $this->assertDatabaseHas('account_transactions', [
            'bank_account_id' => $account->id,
            'type' => 'atm_deposit',
            'direction' => 'in',
            'amount' => 1500,
            'balance_after' => 2500,
            'status' => 'completed',
        ]);

        $this->assertDatabaseHas('atm_cash_movements', [
            'atm_id' => $atm->id,
            'type' => 'deposit',
            'amount' => 1500,
            'cash_before' => 500,
            'cash_after' => 2000,
        ]);
    }

    public function test_atm_deposit_blocks_invalid_customer_account_amount_and_service_states(): void
    {
        $customer = $this->customerWithProfile('verified');
        $otherCustomer = $this->customerWithProfile('verified');
        $account = $this->bankAccount($customer, ['balance' => 1000]);
        $otherAccount = $this->bankAccount($otherCustomer, ['balance' => 1000]);
        $atm = $this->atm(['current_cash' => 500, 'status' => 'active', 'is_active' => true]);

        $this->actingAs($customer)
            ->post("/backend/customer/atms/{$atm->id}/deposit", [
                'bank_account_id' => $account->id,
                'amount' => 0,
            ])
            ->assertSessionHasErrors('amount');

        $this->actingAs($customer)
            ->post("/backend/customer/atms/{$atm->id}/deposit", [
                'bank_account_id' => $account->id,
                'amount' => 20000.01,
            ])
            ->assertSessionHasErrors('amount');

        $this->actingAs($customer)
            ->post("/backend/customer/atms/{$atm->id}/deposit", [
                'bank_account_id' => $otherAccount->id,
                'amount' => 100,
            ])
            ->assertSessionHasErrors('bank_account_id');

        $account->update(['status' => 'closed']);

        $this->actingAs($customer)
            ->post("/backend/customer/atms/{$atm->id}/deposit", [
                'bank_account_id' => $account->id,
                'amount' => 100,
            ])
            ->assertSessionHasErrors('bank_account_id');

        $account->update(['status' => 'active']);
        $atm->update(['is_active' => false, 'status' => 'out_of_service']);

        $this->actingAs($customer)
            ->post("/backend/customer/atms/{$atm->id}/deposit", [
                'bank_account_id' => $account->id,
                'amount' => 100,
            ])
            ->assertSessionHasErrors('atm_id');

        $this->actingAs($customer)
            ->post('/backend/customer/atm-withdrawals', [
                'atm_id' => $atm->id,
                'bank_account_id' => $account->id,
                'amount' => 100,
            ])
            ->assertSessionHasErrors('atm_id');

        $this->assertSame(1000.00, (float) $account->refresh()->balance);
        $this->assertSame(500.00, (float) $atm->refresh()->current_cash);
        $this->assertSame(0, AtmCashMovement::where('type', 'deposit')->count());
        $this->assertSame(0, AccountTransaction::where('type', 'atm_deposit')->count());
    }

    public function test_atm_withdrawal_blocks_invalid_cash_balance_and_service_states(): void
    {
        $customer = $this->customerWithProfile('verified');
        $account = $this->bankAccount($customer, ['balance' => 500]);
        $atm = $this->atm(['current_cash' => 200, 'status' => 'active', 'is_active' => true]);

        $this->actingAs($customer)
            ->post('/backend/customer/atm-withdrawals', [
                'atm_id' => $atm->id,
                'bank_account_id' => $account->id,
                'amount' => 600,
            ])
            ->assertSessionHasErrors('amount');

        $account->update(['balance' => 1000]);

        $this->actingAs($customer)
            ->post('/backend/customer/atm-withdrawals', [
                'atm_id' => $atm->id,
                'bank_account_id' => $account->id,
                'amount' => 300,
            ])
            ->assertSessionHasErrors('amount');

        $atm->update(['is_active' => false]);

        $this->actingAs($customer)
            ->post('/backend/customer/atm-withdrawals', [
                'atm_id' => $atm->id,
                'bank_account_id' => $account->id,
                'amount' => 100,
            ])
            ->assertSessionHasErrors('atm_id');

        $atm->update(['is_active' => true, 'status' => 'out_of_service', 'current_cash' => 1000]);

        $this->actingAs($customer)
            ->post('/backend/customer/atm-withdrawals', [
                'atm_id' => $atm->id,
                'bank_account_id' => $account->id,
                'amount' => 100,
            ])
            ->assertSessionHasErrors('atm_id');

        $this->assertSame(0, AtmWithdrawal::count());
        $this->assertSame(0, AtmCashMovement::count());
        $this->assertSame(0, AccountTransaction::count());
    }

    private function customerWithProfile(string $status): User
    {
        $customer = User::factory()->create();
        $customer->assignRole('customer');

        CustomerProfile::create([
            'user_id' => $customer->id,
            'cin' => fake()->unique()->bothify('??######'),
            'first_name' => 'Test',
            'last_name' => 'Customer',
            'status' => $status,
            'verified_at' => $status === 'verified' ? now() : null,
        ]);

        return $customer->load('profile');
    }

    private function branch(): Branch
    {
        return Branch::create([
            'name' => 'Casablanca Test',
            'code' => fake()->unique()->bothify('CASA-###'),
            'city' => 'Casablanca',
            'address' => 'Test branch address',
        ]);
    }

    private function bankAccount(User $customer, array $overrides = []): BankAccount
    {
        return BankAccount::create([
            'user_id' => $customer->id,
            'account_number' => fake()->unique()->numerify('MA########################'),
            'rib' => fake()->unique()->numerify('01178##################'),
            'account_type' => 'current',
            'balance' => 10000,
            'currency' => 'MAD',
            'status' => 'active',
            'opened_at' => now(),
            ...$overrides,
        ]);
    }

    private function atm(array $overrides = []): Atm
    {
        return Atm::create([
            'code' => fake()->unique()->bothify('CIM-TEST-###'),
            'name' => 'CIM Test ATM',
            'city' => 'Casablanca',
            'area' => 'Maarif',
            'address' => 'Test ATM address',
            'latitude' => 33.5731,
            'longitude' => -7.5898,
            'current_cash' => 5000,
            'max_capacity' => 20000,
            'status' => 'active',
            'is_active' => true,
            'notes' => null,
            ...$overrides,
        ]);
    }

    private function atmPayload(Atm $atm): array
    {
        return [
            'name' => $atm->name,
            'area' => $atm->area,
            'address' => $atm->address,
            'latitude' => $atm->latitude,
            'longitude' => $atm->longitude,
            'max_capacity' => $atm->max_capacity,
            'status' => $atm->status,
            'is_active' => $atm->is_active,
            'notes' => $atm->notes,
        ];
    }
}
