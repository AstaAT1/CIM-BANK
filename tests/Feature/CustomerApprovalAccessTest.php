<?php

namespace Tests\Feature;

use App\Mail\AccountApprovedMail;
use App\Models\AccountOpeningRequest;
use App\Models\Appointment;
use App\Models\BankAccount;
use App\Models\BankCard;
use App\Models\Branch;
use App\Models\CustomerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class CustomerApprovalAccessTest extends TestCase
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

    public function test_new_onboarded_customer_gets_customer_role_but_starts_pending_without_dashboard_access(): void
    {
        Storage::fake('local');
        $branch = $this->branch();

        $this->post(route('onboarding.register'), [
            'name' => 'Pending Customer',
            'email' => 'pending-register@example.com',
            'phone' => '+212660000100',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'date_of_birth' => now()->subYears(25)->format('Y-m-d'),
            'address' => '123 Test Street',
            'cin' => 'ONB123456',
            'cin_front' => UploadedFile::fake()->image('cin-front.jpg'),
            'cin_back' => UploadedFile::fake()->image('cin-back.jpg'),
            'profession' => 'salaried',
            'branch_id' => $branch->id,
        ])->assertRedirect();

        $customer = User::where('email', 'pending-register@example.com')->firstOrFail();

        $this->assertTrue($customer->hasRole('customer'));
        $this->assertNull($customer->email_verified_at);
        $this->assertSame('pending', $customer->profile()->firstOrFail()->status);

        $this->actingAs($customer)
            ->get('/dashboard')
            ->assertRedirect();
    }

    public function test_account_opening_approval_makes_customer_dashboard_ready_before_sending_email(): void
    {
        Mail::fake();

        [$customer, $accountOpeningRequest] = $this->pendingAccountOpeningRequest();
        $admin = $this->staffUser('admin');

        $this->actingAs($admin)
            ->post(route('admin.account-opening-requests.approve', $accountOpeningRequest))
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertApprovedCustomerCanAccessBanking($customer);

        Mail::assertSent(AccountApprovedMail::class, function (AccountApprovedMail $mail) use ($customer): bool {
            $freshCustomer = $customer->fresh(['profile', 'bankAccounts', 'bankCards']);

            return $mail->user->is($customer)
                && $freshCustomer->hasRole('customer')
                && $freshCustomer->email_verified_at !== null
                && $freshCustomer->profile->status === 'verified'
                && $freshCustomer->profile->verified_at !== null
                && $freshCustomer->bankAccounts->contains(fn (BankAccount $account): bool => $account->status === 'active')
                && $freshCustomer->bankCards->contains(fn (BankCard $card): bool => $card->status === 'active');
        });
    }

    public function test_appointment_attendee_approval_uses_same_customer_access_contract(): void
    {
        Mail::fake();

        [$customer, $accountOpeningRequest] = $this->pendingAccountOpeningRequest();
        $employee = $this->staffUser('employee');
        $appointment = Appointment::create([
            'account_opening_request_id' => $accountOpeningRequest->id,
            'branch_id' => $accountOpeningRequest->branch_id,
            'customer_id' => $customer->id,
            'scheduled_at' => now()->addDay(),
            'status' => 'scheduled',
        ]);

        $this->actingAs($employee)
            ->post(route('admin.appointment-attendees.verify', $appointment))
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertSame('completed', $appointment->fresh()->status);
        $this->assertApprovedCustomerCanAccessBanking($customer);
        Mail::assertSent(AccountApprovedMail::class);
    }

    public function test_pending_and_rejected_customers_cannot_access_customer_routes_by_direct_url(): void
    {
        foreach (['pending', 'rejected'] as $status) {
            $customer = $this->customerWithProfile($status);

            $this->actingAs($customer)->get('/dashboard')->assertRedirect(route('account.pending'));
            $this->actingAs($customer)->get('/customer/atm-map')->assertRedirect(route('account.pending'));
            $this->actingAs($customer)->get('/customer/exchange-rates')->assertRedirect(route('account.pending'));
            $this->actingAs($customer)->get('/customer/beneficiaries')->assertRedirect(route('account.pending'));
            $this->actingAs($customer)->get('/customer/transfers')->assertRedirect(route('account.pending'));
        }
    }

    public function test_bank_staff_keep_admin_access_and_cannot_enter_customer_pages(): void
    {
        $admin = $this->staffUser('admin');
        $employee = $this->staffUser('employee');

        foreach ([$admin, $employee] as $staff) {
            $this->assertFalse($staff->hasRole('customer'));

            $this->actingAs($staff)->get(route('admin.dashboard'))->assertRedirect(route('admin.customers-dashboard.index'));
            $this->actingAs($staff)->get('/admin/beneficiaries')->assertRedirect(route('admin.customers-dashboard.index'));
            $this->actingAs($staff)->get(route('backend.admin.dashboard'))->assertOk();
            $this->actingAs($staff)->get('/dashboard')->assertForbidden();
            $this->actingAs($staff)->get('/customer/atm-map')->assertForbidden();
            $this->actingAs($staff)->get('/customer/exchange-rates')->assertForbidden();
        }
    }

    public function test_repair_command_backfills_verified_normal_customers_without_converting_staff(): void
    {
        $customer = User::factory()->unverified()->create();
        $admin = $this->staffUser('admin');
        $employee = $this->staffUser('employee');

        CustomerProfile::create([
            'user_id' => $customer->id,
            'cin' => 'FIX123456',
            'first_name' => 'Fix',
            'last_name' => 'Customer',
            'status' => 'verified',
            'verified_at' => null,
        ]);
        CustomerProfile::create([
            'user_id' => $admin->id,
            'cin' => 'ADM123456',
            'first_name' => 'Admin',
            'last_name' => 'Staff',
            'status' => 'verified',
            'verified_at' => null,
        ]);
        CustomerProfile::create([
            'user_id' => $employee->id,
            'cin' => 'EMP123456',
            'first_name' => 'Employee',
            'last_name' => 'Staff',
            'status' => 'verified',
            'verified_at' => null,
        ]);

        $this->artisan('customers:repair-approved-access')
            ->expectsOutput('Scanned 3 verified profiles. Repaired 1. Skipped 2 staff users. Missing users: 0.')
            ->assertSuccessful();

        $this->assertTrue($customer->fresh()->hasRole('customer'));
        $this->assertNotNull($customer->fresh()->email_verified_at);
        $this->assertNotNull($customer->profile()->first()->verified_at);
        $this->assertFalse($admin->fresh()->hasRole('customer'));
        $this->assertFalse($employee->fresh()->hasRole('customer'));
    }

    private function assertApprovedCustomerCanAccessBanking(User $customer): void
    {
        $customer->refresh()->load(['profile', 'bankAccounts', 'bankCards']);

        $this->assertTrue($customer->hasRole('customer'));
        $this->assertNotNull($customer->email_verified_at);
        $this->assertSame('verified', $customer->profile->status);
        $this->assertNotNull($customer->profile->verified_at);
        $this->assertSame('account_created', $customer->accountOpeningRequests()->latest()->firstOrFail()->status);
        $this->assertTrue($customer->bankAccounts->contains(fn (BankAccount $account): bool => $account->status === 'active'));
        $this->assertTrue($customer->bankCards->contains(fn (BankCard $card): bool => $card->status === 'active'));

        $this->actingAs($customer)->get('/dashboard')->assertOk();
        $this->actingAs($customer)->get('/customer/atm-map')->assertOk();
        $this->actingAs($customer)->get('/customer/exchange-rates')->assertOk();
        $this->actingAs($customer)->get('/customer/beneficiaries')->assertOk();
        $this->actingAs($customer)->get('/customer/transfers')->assertOk();
    }

    /**
     * @return array{0: User, 1: AccountOpeningRequest}
     */
    private function pendingAccountOpeningRequest(): array
    {
        $customer = User::factory()->unverified()->create();
        $profile = CustomerProfile::create([
            'user_id' => $customer->id,
            'cin' => fake()->unique()->bothify('APR######'),
            'first_name' => 'Approval',
            'last_name' => 'Customer',
            'status' => 'pending',
            'verified_at' => null,
        ]);

        $accountOpeningRequest = AccountOpeningRequest::create([
            'user_id' => $customer->id,
            'customer_profile_id' => $profile->id,
            'branch_id' => $this->branch()->id,
            'request_number' => fake()->unique()->bothify('AOR-APP-####'),
            'account_type' => 'current',
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        return [$customer, $accountOpeningRequest];
    }

    private function customerWithProfile(string $status): User
    {
        $customer = User::factory()->create();
        $customer->assignRole('customer');

        CustomerProfile::create([
            'user_id' => $customer->id,
            'cin' => fake()->unique()->bothify('CUS######'),
            'first_name' => 'Route',
            'last_name' => 'Customer',
            'status' => $status,
            'verified_at' => $status === 'verified' ? now() : null,
        ]);

        return $customer->load('profile');
    }

    private function staffUser(string $role): User
    {
        $user = User::factory()->create();
        $user->assignRole($role);

        return $user;
    }

    private function branch(): Branch
    {
        return Branch::create([
            'name' => fake()->unique()->company().' Branch',
            'code' => fake()->unique()->bothify('BR-###'),
            'city' => 'Casablanca',
            'address' => 'Test branch address',
            'is_active' => true,
        ]);
    }
}
