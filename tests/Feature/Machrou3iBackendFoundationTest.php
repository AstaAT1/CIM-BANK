<?php

namespace Tests\Feature;

use App\Mail\Machrou3iDecisionMail;
use App\Mail\Machrou3iApplicationSubmittedMail;
use App\Models\AccountTransaction;
use App\Models\BankAccount;
use App\Models\CustomerProfile;
use App\Models\Machrou3iApplication;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class Machrou3iBackendFoundationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'customer']);
        Role::firstOrCreate(['name' => 'employee']);
        Role::firstOrCreate(['name' => 'admin']);
    }

    public function test_verified_customer_can_create_and_submit_application_with_salary_proof(): void
    {
        Storage::fake('local');
        Mail::fake();
        [$customer, $account] = $this->verifiedCustomer();

        $this->actingAs($customer)
            ->post(route('backend.customer.machrou3i.store'), $this->validPayload($account))
            ->assertRedirect();

        $application = Machrou3iApplication::firstOrFail();
        $this->assertSame('submitted', $application->status);
        $this->assertNotNull($application->submitted_at);
        Storage::disk('local')->assertExists($application->salary_proof_path);
        Mail::assertSent(Machrou3iApplicationSubmittedMail::class, function (Machrou3iApplicationSubmittedMail $mail) use ($application): bool {
            return $mail->application->is($application);
        });
    }

    public function test_pending_or_rejected_customer_cannot_access_or_submit(): void
    {
        foreach (['pending', 'rejected'] as $status) {
            [$customer, $account] = $this->customerWithProfile($status);

            $this->actingAs($customer)
                ->get('/customer/machrou3i')
                ->assertRedirect(route('account.pending'));

            $this->actingAs($customer)
                ->post(route('backend.customer.machrou3i.store'), $this->validPayload($account))
                ->assertRedirect(route('account.pending'));
        }
    }

    public function test_salary_proof_is_stored_privately(): void
    {
        Storage::fake('local');
        [$customer, $account] = $this->verifiedCustomer();

        $this->actingAs($customer)
            ->post(route('backend.customer.machrou3i.store'), $this->validPayload($account));

        $application = Machrou3iApplication::firstOrFail();
        $this->assertStringStartsWith('machrou3i/salary-proofs/', $application->salary_proof_path);
        Storage::disk('local')->assertExists($application->salary_proof_path);
        $this->assertFalse(Storage::disk('public')->exists($application->salary_proof_path));
    }

    public function test_future_hiring_date_is_rejected(): void
    {
        Storage::fake('local');
        [$customer, $account] = $this->verifiedCustomer();

        $this->actingAs($customer)
            ->post(route('backend.customer.machrou3i.store'), $this->validPayload($account, [
                'hiring_date' => now()->addDay()->toDateString(),
            ]))
            ->assertSessionHasErrors('hiring_date');

        $this->assertDatabaseCount('machrou3i_applications', 0);
    }

    public function test_application_submission_creates_risk_snapshot(): void
    {
        Storage::fake('local');
        [$customer, $account] = $this->verifiedCustomer();

        $this->actingAs($customer)
            ->post(route('backend.customer.machrou3i.store'), $this->validPayload($account));

        $application = Machrou3iApplication::firstOrFail();
        $this->assertSame(1, $application->riskSnapshots()->count());
        $this->assertNotNull($application->risk_score);
        $this->assertNotNull($application->risk_level);
    }

    public function test_risk_score_and_reasons_are_calculated(): void
    {
        Storage::fake('local');
        [$customer, $account] = $this->verifiedCustomer(accountOverrides: ['balance' => 2500]);
        AccountTransaction::create([
            'bank_account_id' => $account->id,
            'reference' => 'TXN-MACHROU3I',
            'type' => 'deposit',
            'direction' => 'in',
            'amount' => 1000,
            'balance_after' => 2500,
            'status' => 'completed',
            'performed_at' => now(),
        ]);

        $this->actingAs($customer)
            ->post(route('backend.customer.machrou3i.store'), $this->validPayload($account));

        $snapshot = Machrou3iApplication::firstOrFail()->latestRiskSnapshot()->firstOrFail();
        $this->assertGreaterThanOrEqual(50, $snapshot->risk_score);
        $this->assertNotEmpty($snapshot->reasons);
    }

    public function test_customer_cannot_access_another_users_application(): void
    {
        [$owner, $ownerAccount] = $this->verifiedCustomer();
        [$other, $otherAccount] = $this->verifiedCustomer();
        $application = $this->applicationFor($owner, $ownerAccount);

        $this->actingAs($other)
            ->patch(route('backend.customer.machrou3i.update', $application), $this->validPayload($otherAccount))
            ->assertForbidden();
    }

    public function test_admin_or_employee_can_access_application(): void
    {
        [$customer, $account] = $this->verifiedCustomer();
        $application = $this->applicationFor($customer, $account);
        $employee = $this->staff('employee');

        $this->actingAs($employee)
            ->get(route('admin.machrou3i.show', $application))
            ->assertOk();
    }

    public function test_admin_or_employee_can_view_protected_salary_proof_route(): void
    {
        Storage::fake('local');
        [$customer, $account] = $this->verifiedCustomer();
        $application = $this->applicationFor($customer, $account);
        Storage::disk('local')->put($application->salary_proof_path, 'salary proof');
        $employee = $this->staff('employee');

        $this->actingAs($employee)
            ->get(route('admin.machrou3i.documents.view', [$application, 'salary-proof']))
            ->assertOk()
            ->assertHeader('x-content-type-options', 'nosniff');
    }

    public function test_admin_or_employee_can_pre_approve_full_amount(): void
    {
        Mail::fake();
        [$customer, $account] = $this->verifiedCustomer();
        $application = $this->applicationFor($customer, $account);
        $admin = $this->staff('admin');

        $this->actingAs($admin)
            ->patch(route('backend.admin.machrou3i.pre-approve', $application), [
                'decision_note' => 'Eligible for the full requested amount.',
            ])
            ->assertRedirect();

        $application->refresh();
        $this->assertSame('pre_approved', $application->status);
        $this->assertSame('40000.00', $application->offered_amount);
    }

    public function test_admin_or_employee_can_pre_approve_lower_amount(): void
    {
        Mail::fake();
        [$customer, $account] = $this->verifiedCustomer();
        $application = $this->applicationFor($customer, $account);
        $employee = $this->staff('employee');

        $this->actingAs($employee)
            ->patch(route('backend.admin.machrou3i.pre-approve-lower', $application), [
                'offered_amount' => 25000,
                'offered_repayment_months' => 20,
                'decision_note' => 'Lower first offer based on affordability.',
            ])
            ->assertRedirect();

        $application->refresh();
        $this->assertSame('offer_sent', $application->status);
        $this->assertSame('25000.00', $application->offered_amount);
        $this->assertSame('1250.00', $application->offered_monthly_installment);
    }

    public function test_admin_or_employee_can_reject_with_reason(): void
    {
        Mail::fake();
        [$customer, $account] = $this->verifiedCustomer();
        $application = $this->applicationFor($customer, $account);
        $admin = $this->staff('admin');

        $this->actingAs($admin)
            ->patch(route('backend.admin.machrou3i.reject', $application), [
                'decision_note' => 'Projected repayment is too risky.',
            ])
            ->assertRedirect();

        $this->assertSame('rejected', $application->fresh()->status);
        $this->assertSame('Projected repayment is too risky.', $application->fresh()->decision_note);
    }

    public function test_admin_or_employee_can_request_more_documents(): void
    {
        Mail::fake();
        [$customer, $account] = $this->verifiedCustomer();
        $application = $this->applicationFor($customer, $account);
        $employee = $this->staff('employee');

        $this->actingAs($employee)
            ->patch(route('backend.admin.machrou3i.request-documents', $application), [
                'required_documents_note' => 'Please upload supplier quotations.',
            ])
            ->assertRedirect();

        $this->assertSame('need_more_documents', $application->fresh()->status);
        $this->assertSame('Please upload supplier quotations.', $application->fresh()->required_documents_note);
    }

    public function test_decision_email_is_sent(): void
    {
        Mail::fake();
        [$customer, $account] = $this->verifiedCustomer();
        $application = $this->applicationFor($customer, $account);
        $admin = $this->staff('admin');

        $this->actingAs($admin)
            ->patch(route('backend.admin.machrou3i.pre-approve', $application));

        Mail::assertSent(Machrou3iDecisionMail::class, function (Machrou3iDecisionMail $mail) use ($application): bool {
            return $mail->application->is($application);
        });
    }

    public function test_customer_can_accept_offer(): void
    {
        [$customer, $account] = $this->verifiedCustomer();
        $application = $this->applicationFor($customer, $account, [
            'status' => 'offer_sent',
            'offered_amount' => 20000,
            'offered_repayment_months' => 20,
            'offered_monthly_installment' => 1000,
        ]);

        $this->actingAs($customer)
            ->patch(route('backend.customer.machrou3i.accept-offer', $application))
            ->assertRedirect();

        $this->assertSame('customer_accepted_offer', $application->fresh()->status);
        $this->assertNotNull($application->fresh()->customer_accepted_at);
    }

    public function test_no_money_is_disbursed_to_bank_account_balance(): void
    {
        Mail::fake();
        [$customer, $account] = $this->verifiedCustomer(accountOverrides: ['balance' => 1234]);
        $application = $this->applicationFor($customer, $account);
        $admin = $this->staff('admin');

        $this->actingAs($admin)
            ->patch(route('backend.admin.machrou3i.pre-approve', $application));

        $this->actingAs($customer)
            ->patch(route('backend.customer.machrou3i.accept-offer', $application->fresh()));

        $this->assertSame('1234.00', $account->fresh()->balance);
    }

    private function validPayload(BankAccount $account, array $overrides = []): array
    {
        return array_merge([
            'bank_account_id' => $account->id,
            'monthly_salary' => 7000,
            'company_name' => 'Atlas Services',
            'job_title' => 'Operations Coordinator',
            'employment_type' => 'CDI',
            'hiring_date' => '2024-01-10',
            'salary_proof' => UploadedFile::fake()->create('salary-proof.pdf', 128, 'application/pdf'),
            'project_name' => 'Neighborhood Delivery',
            'project_type' => 'service',
            'project_location' => 'Casablanca',
            'has_experience_in_field' => true,
            'needs_equipment' => true,
            'project_description' => 'A local delivery service for small merchants.',
            'why_this_project' => 'Existing neighborhood demand.',
            'requested_amount' => 40000,
            'expected_monthly_revenue' => 15000,
            'expected_monthly_expenses' => 9000,
            'expected_monthly_profit' => 6000,
            'repayment_months' => 24,
        ], $overrides);
    }

    private function verifiedCustomer(array $userOverrides = [], array $accountOverrides = []): array
    {
        return $this->customerWithProfile('verified', $userOverrides, $accountOverrides);
    }

    private function customerWithProfile(string $status, array $userOverrides = [], array $accountOverrides = []): array
    {
        $customer = User::factory()->create($userOverrides);
        $customer->assignRole('customer');

        CustomerProfile::create([
            'user_id' => $customer->id,
            'cin' => 'CIN'.fake()->unique()->numerify('######'),
            'first_name' => 'Machrou3i',
            'last_name' => 'Customer',
            'employment_status' => 'salaried',
            'monthly_income' => 7000,
            'status' => $status,
            'verified_at' => $status === 'verified' ? now() : null,
        ]);

        $account = BankAccount::create(array_merge([
            'user_id' => $customer->id,
            'account_number' => 'ACC'.fake()->unique()->numerify('########'),
            'rib' => 'RIB'.fake()->unique()->numerify('################'),
            'account_type' => 'current',
            'balance' => 1500,
            'currency' => 'MAD',
            'status' => 'active',
            'opened_at' => now(),
        ], $accountOverrides));

        return [$customer->load('profile'), $account];
    }

    private function staff(string $role): User
    {
        $user = User::factory()->create();
        $user->assignRole($role);

        return $user;
    }

    private function applicationFor(User $customer, BankAccount $account, array $overrides = []): Machrou3iApplication
    {
        return Machrou3iApplication::create(array_merge([
            'user_id' => $customer->id,
            'bank_account_id' => $account->id,
            'monthly_salary' => 7000,
            'company_name' => 'Atlas Services',
            'job_title' => 'Operations Coordinator',
            'employment_type' => 'CDI',
            'salary_proof_path' => 'machrou3i/salary-proofs/test-proof.pdf',
            'salary_proof_original_name' => 'test-proof.pdf',
            'salary_proof_mime_type' => 'application/pdf',
            'salary_proof_size' => 128,
            'project_name' => 'Neighborhood Delivery',
            'project_type' => 'service',
            'has_experience_in_field' => true,
            'needs_equipment' => true,
            'project_description' => 'A local delivery service for small merchants.',
            'requested_amount' => 40000,
            'expected_monthly_revenue' => 15000,
            'expected_monthly_expenses' => 9000,
            'expected_monthly_profit' => 6000,
            'repayment_months' => 24,
            'status' => 'submitted',
            'submitted_at' => now(),
        ], $overrides));
    }
}
