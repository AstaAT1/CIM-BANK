<?php

namespace Tests\Feature;

use App\Mail\BillPaymentFailedMail;
use App\Mail\BillPaymentReminderMail;
use App\Mail\BillPaymentSuccessMail;
use App\Models\AccountTransaction;
use App\Models\BankAccount;
use App\Models\BillPayment;
use App\Models\CustomerBill;
use App\Models\CustomerProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class BillsAutopayTest extends TestCase
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

    public function test_verified_customer_can_create_bill(): void
    {
        $customer = $this->customerWithProfile('verified');
        $account = $this->bankAccount($customer);

        $this->actingAs($customer)
            ->post('/backend/customer/bills', $this->billPayload($account))
            ->assertRedirect()
            ->assertSessionHas('success', 'Bill added.');

        $this->assertDatabaseHas('customer_bills', [
            'user_id' => $customer->id,
            'bank_account_id' => $account->id,
            'label' => 'Home WiFi',
            'provider_name' => 'Inwi',
            'autopay_enabled' => true,
        ]);
    }

    public function test_pending_and_rejected_customers_cannot_access_bills(): void
    {
        foreach (['pending', 'rejected'] as $status) {
            $customer = $this->customerWithProfile($status);

            $this->actingAs($customer)
                ->get('/customer/bills')
                ->assertRedirect(route('account.pending'));
        }
    }

    public function test_customer_cannot_access_another_users_bill(): void
    {
        $owner = $this->customerWithProfile('verified');
        $ownerAccount = $this->bankAccount($owner);
        $bill = $this->bill($owner, $ownerAccount);

        $other = $this->customerWithProfile('verified');
        $this->bankAccount($other);

        $this->actingAs($other)
            ->post("/backend/customer/bills/{$bill->id}/pay-now")
            ->assertNotFound();
    }

    public function test_manual_pay_now_decreases_balance_and_creates_records(): void
    {
        Mail::fake();

        $customer = $this->customerWithProfile('verified');
        $account = $this->bankAccount($customer, ['balance' => 1000]);
        $bill = $this->bill($customer, $account, ['amount' => 125.50]);

        $this->actingAs($customer)
            ->post("/backend/customer/bills/{$bill->id}/pay-now")
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertSame('874.50', $account->fresh()->balance);
        $this->assertSame(1, AccountTransaction::where('type', 'bill_payment')->count());
        $this->assertSame(1, BillPayment::where('status', 'completed')->count());
        $this->assertDatabaseHas('account_transactions', [
            'bank_account_id' => $account->id,
            'type' => 'bill_payment',
            'direction' => 'out',
            'amount' => 125.50,
            'balance_after' => 874.50,
            'status' => 'completed',
        ]);
        Mail::assertSent(BillPaymentSuccessMail::class);
    }

    public function test_autopay_sends_reminder_email_before_payment(): void
    {
        Mail::fake();
        Carbon::setTestNow(Carbon::parse('2026-05-06 10:00:00'));

        $customer = $this->customerWithProfile('verified');
        $account = $this->bankAccount($customer, ['balance' => 1000]);
        $bill = $this->bill($customer, $account, [
            'autopay_enabled' => true,
            'next_due_at' => now()->subMinute(),
        ]);

        $this->artisan('bills:process-autopay')->assertSuccessful();

        Mail::assertSent(BillPaymentReminderMail::class, fn (BillPaymentReminderMail $mail): bool => $mail->bill->is($bill));
        $this->assertNull($bill->fresh()->reminder_sent_at);

        Carbon::setTestNow();
    }

    public function test_monthly_autopay_resets_reminder_for_next_cycle_and_sends_fresh_reminder(): void
    {
        Mail::fake();
        Carbon::setTestNow(Carbon::parse('2026-05-06 10:00:00'));

        $customer = $this->customerWithProfile('verified');
        $account = $this->bankAccount($customer, ['balance' => 1000]);
        $bill = $this->bill($customer, $account, [
            'amount' => 100,
            'frequency' => 'monthly',
            'autopay_enabled' => true,
            'next_due_at' => Carbon::parse('2026-05-06 09:00:00'),
        ]);

        $this->artisan('bills:process-autopay')->assertSuccessful();

        $bill->refresh();
        $this->assertSame('2026-06-06 09:00:00', $bill->next_due_at->format('Y-m-d H:i:s'));
        $this->assertNull($bill->reminder_sent_at);
        $this->assertSame('900.00', $account->fresh()->balance);
        Mail::assertSent(BillPaymentReminderMail::class, 1);
        Mail::assertSent(BillPaymentSuccessMail::class, 1);

        Carbon::setTestNow(Carbon::parse('2026-06-06 10:00:00'));

        $this->artisan('bills:process-autopay')->assertSuccessful();

        $bill->refresh();
        $this->assertSame('2026-07-06 09:00:00', $bill->next_due_at->format('Y-m-d H:i:s'));
        $this->assertNull($bill->reminder_sent_at);
        $this->assertSame('800.00', $account->fresh()->balance);
        $this->assertSame(2, BillPayment::where('customer_bill_id', $bill->id)->where('status', 'completed')->count());
        Mail::assertSent(BillPaymentReminderMail::class, 2);
        Mail::assertSent(BillPaymentSuccessMail::class, 2);

        Carbon::setTestNow();
    }

    public function test_autopay_pays_due_bill_when_balance_is_enough(): void
    {
        Mail::fake();
        Carbon::setTestNow(Carbon::parse('2026-05-06 10:00:00'));

        $customer = $this->customerWithProfile('verified');
        $account = $this->bankAccount($customer, ['balance' => 1000]);
        $this->bill($customer, $account, [
            'amount' => 200,
            'autopay_enabled' => true,
            'next_due_at' => now()->subMinute(),
        ]);

        $this->artisan('bills:process-autopay')->assertSuccessful();

        $this->assertSame('800.00', $account->fresh()->balance);
        $this->assertSame(1, BillPayment::where('status', 'completed')->count());
        Mail::assertSent(BillPaymentReminderMail::class);
        Mail::assertSent(BillPaymentSuccessMail::class);

        Carbon::setTestNow();
    }

    public function test_autopay_fails_if_balance_is_not_enough(): void
    {
        Mail::fake();

        $customer = $this->customerWithProfile('verified');
        $account = $this->bankAccount($customer, ['balance' => 50]);
        $this->bill($customer, $account, [
            'amount' => 200,
            'autopay_enabled' => true,
            'next_due_at' => now()->subMinute(),
        ]);

        $this->artisan('bills:process-autopay')->assertSuccessful();

        $this->assertSame('50.00', $account->fresh()->balance);
        $this->assertDatabaseHas('bill_payments', [
            'status' => 'failed',
            'failure_reason' => 'Insufficient balance.',
        ]);
        Mail::assertSent(BillPaymentFailedMail::class);
    }

    public function test_autopay_respects_minimum_balance_after_payment(): void
    {
        Mail::fake();

        $customer = $this->customerWithProfile('verified');
        $account = $this->bankAccount($customer, ['balance' => 400]);
        $this->bill($customer, $account, [
            'amount' => 200,
            'minimum_balance_after_payment' => 300,
            'autopay_enabled' => true,
            'next_due_at' => now()->subMinute(),
        ]);

        $this->artisan('bills:process-autopay')->assertSuccessful();

        $this->assertSame('400.00', $account->fresh()->balance);
        $this->assertDatabaseHas('bill_payments', [
            'status' => 'skipped',
            'failure_reason' => 'Minimum balance protection would be breached.',
        ]);
        Mail::assertSent(BillPaymentFailedMail::class);
    }

    public function test_weekly_and_monthly_bills_update_next_due_at(): void
    {
        Mail::fake();
        Carbon::setTestNow(Carbon::parse('2026-05-06 10:00:00'));

        $customer = $this->customerWithProfile('verified');
        $account = $this->bankAccount($customer, ['balance' => 1000]);
        $weekly = $this->bill($customer, $account, [
            'frequency' => 'weekly',
            'next_due_at' => Carbon::parse('2026-05-06 09:00:00'),
            'autopay_enabled' => true,
        ]);
        $monthly = $this->bill($customer, $account, [
            'frequency' => 'monthly',
            'next_due_at' => Carbon::parse('2026-05-06 09:30:00'),
            'autopay_enabled' => true,
        ]);

        $this->artisan('bills:process-autopay')->assertSuccessful();

        $this->assertSame('2026-05-13 09:00:00', $weekly->fresh()->next_due_at->format('Y-m-d H:i:s'));
        $this->assertSame('2026-06-06 09:30:00', $monthly->fresh()->next_due_at->format('Y-m-d H:i:s'));

        Carbon::setTestNow();
    }

    public function test_one_time_bill_does_not_repeat_after_payment(): void
    {
        Mail::fake();

        $customer = $this->customerWithProfile('verified');
        $account = $this->bankAccount($customer, ['balance' => 1000]);
        $bill = $this->bill($customer, $account, [
            'frequency' => 'one_time',
            'autopay_enabled' => true,
            'next_due_at' => now()->subMinute(),
        ]);

        $this->artisan('bills:process-autopay')->assertSuccessful();

        $this->assertSame('cancelled', $bill->fresh()->status);
        $this->assertSame(1, BillPayment::where('customer_bill_id', $bill->id)->where('status', 'completed')->count());
    }

    public function test_bills_page_renders_for_verified_customer(): void
    {
        $customer = $this->customerWithProfile('verified');
        $account = $this->bankAccount($customer);
        $this->bill($customer, $account);

        $this->actingAs($customer)
            ->get('/customer/bills')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('customer/bills/index')
                ->has('accounts', 1)
                ->has('bills', 1)
                ->where('overview.total_bills', 1)
            );
    }

    public function test_mail_fake_captures_autopay_emails_safely(): void
    {
        Mail::fake();

        $customer = $this->customerWithProfile('verified');
        $account = $this->bankAccount($customer, ['balance' => 1000]);
        $this->bill($customer, $account, [
            'autopay_enabled' => true,
            'next_due_at' => now()->subMinute(),
        ]);

        $this->artisan('bills:process-autopay')->assertSuccessful();

        Mail::assertSent(BillPaymentReminderMail::class);
        Mail::assertSent(BillPaymentSuccessMail::class);
    }

    private function billPayload(BankAccount $account, array $overrides = []): array
    {
        return array_merge([
            'bank_account_id' => $account->id,
            'label' => 'Home WiFi',
            'category' => 'internet',
            'provider_name' => 'Inwi',
            'reference_number' => 'WIFI-2026-001',
            'amount' => 199.90,
            'frequency' => 'monthly',
            'next_due_at' => now()->addDay()->format('Y-m-d H:i:s'),
            'autopay_enabled' => true,
            'minimum_balance_after_payment' => 300,
        ], $overrides);
    }

    private function bill(User $customer, BankAccount $account, array $overrides = []): CustomerBill
    {
        return CustomerBill::create($this->billPayload($account, array_merge([
            'user_id' => $customer->id,
            'status' => 'active',
        ], $overrides)));
    }

    private function bankAccount(User $customer, array $overrides = []): BankAccount
    {
        return BankAccount::create(array_merge([
            'user_id' => $customer->id,
            'account_number' => fake()->unique()->numerify('100200######'),
            'rib' => fake()->unique()->numerify('RIB############'),
            'account_type' => 'current',
            'balance' => 1000,
            'currency' => 'MAD',
            'status' => 'active',
            'opened_at' => now(),
        ], $overrides));
    }

    private function customerWithProfile(string $status): User
    {
        $customer = User::factory()->create();
        $customer->assignRole('customer');

        CustomerProfile::create([
            'user_id' => $customer->id,
            'cin' => fake()->unique()->bothify('BILL######'),
            'first_name' => 'Bills',
            'last_name' => 'Customer',
            'status' => $status,
            'verified_at' => $status === 'verified' ? now() : null,
        ]);

        return $customer;
    }
}
