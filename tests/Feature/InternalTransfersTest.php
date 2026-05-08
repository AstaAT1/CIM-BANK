<?php

namespace Tests\Feature;

use App\Models\AccountTransaction;
use App\Models\BankAccount;
use App\Models\Beneficiary;
use App\Models\CustomerProfile;
use App\Models\TransferRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class InternalTransfersTest extends TestCase
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

    public function test_customer_can_add_valid_cim_beneficiary_and_it_becomes_active_immediately(): void
    {
        $sender = $this->customerWithProfile('verified');
        $receiver = $this->customerWithProfile('verified', 'Receiver', 'Customer');
        $receiverAccount = $this->bankAccount($receiver);

        $this->actingAs($sender)
            ->post(route('backend.customer.beneficiaries.store'), [
                'full_name' => 'Receiver Customer',
                'identifier' => $receiverAccount->rib,
                'bank_name' => 'CIM Bank',
                'phone' => '+212660000001',
            ])
            ->assertRedirect()
            ->assertSessionHas('success', 'Beneficiary added and ready for transfers.');

        $beneficiary = Beneficiary::where('user_id', $sender->id)->firstOrFail();

        $this->assertSame('active', $beneficiary->status);
        $this->assertSame($receiverAccount->id, $beneficiary->linked_bank_account_id);
        $this->assertSame($receiverAccount->rib, $beneficiary->rib);
        $this->assertSame($receiverAccount->account_number, $beneficiary->account_number);
        $this->assertSame('Receiver Customer', $beneficiary->full_name);
        $this->assertNotNull($beneficiary->verified_at);
    }

    public function test_valid_beneficiary_appears_in_transfers_immediately(): void
    {
        $sender = $this->customerWithProfile('verified');
        $this->bankAccount($sender, ['balance' => 1000]);
        $receiver = $this->customerWithProfile('verified', 'Receiver', 'Customer');
        $receiverAccount = $this->bankAccount($receiver);

        $this->actingAs($sender)
            ->post(route('backend.customer.beneficiaries.store'), [
                'full_name' => 'Receiver Customer',
                'identifier' => $receiverAccount->account_number,
                'bank_name' => 'CIM Bank',
            ])
            ->assertRedirect()
            ->assertSessionHas('success', 'Beneficiary added and ready for transfers.');

        $beneficiary = Beneficiary::where('user_id', $sender->id)->firstOrFail();

        $this->actingAs($sender)
            ->get('/customer/transfers')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('customer/transfers/index')
                ->has('beneficiaries', 1)
                ->where('beneficiaries.0.id', $beneficiary->id)
                ->where('beneficiaries.0.status', 'active')
                ->where('beneficiaries.0.linked_bank_account_id', $receiverAccount->id)
                ->where('beneficiaries.0.transfers_available', true)
            );
    }

    public function test_invalid_rib_or_account_number_is_rejected(): void
    {
        $sender = $this->customerWithProfile('verified');
        $receiver = $this->customerWithProfile('verified', 'Inactive', 'Receiver');
        $inactiveReceiverAccount = $this->bankAccount($receiver, ['status' => 'frozen']);

        $this->actingAs($sender)
            ->post(route('backend.customer.beneficiaries.store'), [
                'full_name' => 'Missing Receiver',
                'identifier' => 'NO-SUCH-CIM-ACCOUNT',
                'bank_name' => 'CIM Bank',
            ])
            ->assertRedirect()
            ->assertSessionHasErrors('identifier');

        $this->assertSame(0, Beneficiary::where('user_id', $sender->id)->count());

        $this->actingAs($sender)
            ->post(route('backend.customer.beneficiaries.store'), [
                'full_name' => 'Inactive Receiver',
                'identifier' => $inactiveReceiverAccount->rib,
                'bank_name' => 'CIM Bank',
            ])
            ->assertRedirect()
            ->assertSessionHasErrors('identifier');

        $this->assertSame(0, Beneficiary::where('user_id', $sender->id)->count());
    }

    public function test_customer_cannot_add_own_account_as_beneficiary(): void
    {
        $sender = $this->customerWithProfile('verified');
        $senderAccount = $this->bankAccount($sender);

        $this->actingAs($sender)
            ->post(route('backend.customer.beneficiaries.store'), [
                'full_name' => 'Own Account',
                'identifier' => $senderAccount->rib,
                'bank_name' => 'CIM Bank',
            ])
            ->assertRedirect()
            ->assertSessionHasErrors('identifier');

        $this->assertSame(0, Beneficiary::where('user_id', $sender->id)->count());
    }

    public function test_customer_cannot_duplicate_same_beneficiary(): void
    {
        $sender = $this->customerWithProfile('verified');
        $receiver = $this->customerWithProfile('verified', 'Receiver', 'Customer');
        $receiverAccount = $this->bankAccount($receiver);

        $this->actingAs($sender)
            ->post(route('backend.customer.beneficiaries.store'), [
                'full_name' => 'Receiver Customer',
                'identifier' => $receiverAccount->rib,
                'bank_name' => 'CIM Bank',
            ])
            ->assertRedirect()
            ->assertSessionHas('success', 'Beneficiary added and ready for transfers.');

        $this->actingAs($sender)
            ->post(route('backend.customer.beneficiaries.store'), [
                'full_name' => 'Receiver Customer',
                'identifier' => $receiverAccount->account_number,
                'bank_name' => 'CIM Bank',
            ])
            ->assertRedirect()
            ->assertSessionHasErrors('identifier');

        $this->assertSame(1, Beneficiary::where('user_id', $sender->id)->count());
    }

    public function test_transfer_to_newly_added_active_beneficiary_succeeds_and_updates_balances(): void
    {
        $sender = $this->customerWithProfile('verified');
        $receiver = $this->customerWithProfile('verified', 'Receiver', 'Customer');
        $senderAccount = $this->bankAccount($sender, ['balance' => 1000]);
        $receiverAccount = $this->bankAccount($receiver, ['balance' => 250]);

        $this->actingAs($sender)
            ->post(route('backend.customer.beneficiaries.store'), [
                'full_name' => 'Receiver Customer',
                'identifier' => $receiverAccount->rib,
                'bank_name' => 'CIM Bank',
            ])
            ->assertRedirect()
            ->assertSessionHas('success', 'Beneficiary added and ready for transfers.');

        $beneficiary = Beneficiary::where('user_id', $sender->id)->firstOrFail();

        $this->actingAs($sender)
            ->post(route('backend.customer.transfers.store'), [
                'from_account_id' => $senderAccount->id,
                'beneficiary_id' => $beneficiary->id,
                'amount' => 125.50,
                'note' => 'New beneficiary transfer',
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertSame('874.50', $senderAccount->fresh()->balance);
        $this->assertSame('375.50', $receiverAccount->fresh()->balance);
        $this->assertDatabaseHas('account_transactions', [
            'bank_account_id' => $senderAccount->id,
            'type' => 'transfer',
            'direction' => 'out',
            'amount' => 125.50,
            'balance_after' => 874.50,
            'status' => 'completed',
        ]);
        $this->assertDatabaseHas('account_transactions', [
            'bank_account_id' => $receiverAccount->id,
            'type' => 'transfer',
            'direction' => 'in',
            'amount' => 125.50,
            'balance_after' => 375.50,
            'status' => 'completed',
        ]);
    }

    public function test_pending_beneficiary_cannot_be_used_for_transfer(): void
    {
        [$sender, $senderAccount, $receiverAccount, $beneficiary] = $this->transferFixture('pending');

        $this->actingAs($sender)
            ->post(route('backend.customer.transfers.store'), [
                'from_account_id' => $senderAccount->id,
                'beneficiary_id' => $beneficiary->id,
                'amount' => 100,
            ])
            ->assertSessionHasErrors('beneficiary_id');

        $this->assertSame('1000.00', $senderAccount->fresh()->balance);
        $this->assertSame('250.00', $receiverAccount->fresh()->balance);
        $this->assertSame(0, TransferRequest::count());
    }

    public function test_admin_beneficiary_activation_endpoint_is_retired(): void
    {
        $employee = User::factory()->create();
        $employee->assignRole('employee');

        [$sender, , , $beneficiary] = $this->transferFixture('pending');

        $this->actingAs($employee)
            ->patch("/backend/admin/beneficiaries/{$beneficiary->id}/activate")
            ->assertNotFound();

        $beneficiary->refresh();

        $this->assertSame('pending', $beneficiary->status);
        $this->assertNull($beneficiary->verified_at);
        $this->assertSame($sender->id, $beneficiary->user_id);
    }

    public function test_verified_customer_can_transfer_to_active_beneficiary_atomically(): void
    {
        [$sender, $senderAccount, $receiverAccount, $beneficiary] = $this->transferFixture('active');

        $this->actingAs($sender)
            ->post(route('backend.customer.transfers.store'), [
                'from_account_id' => $senderAccount->id,
                'beneficiary_id' => $beneficiary->id,
                'amount' => 300.75,
                'note' => 'Invoice settlement',
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $senderAccount->refresh();
        $receiverAccount->refresh();
        $transfer = TransferRequest::firstOrFail();

        $this->assertSame('699.25', $senderAccount->balance);
        $this->assertSame('550.75', $receiverAccount->balance);

        $this->assertDatabaseHas('account_transactions', [
            'bank_account_id' => $senderAccount->id,
            'type' => 'transfer',
            'direction' => 'out',
            'amount' => 300.75,
            'balance_after' => 699.25,
            'status' => 'completed',
        ]);

        $this->assertDatabaseHas('account_transactions', [
            'bank_account_id' => $receiverAccount->id,
            'type' => 'transfer',
            'direction' => 'in',
            'amount' => 300.75,
            'balance_after' => 550.75,
            'status' => 'completed',
        ]);

        $this->assertSame('completed', $transfer->status);
        $this->assertSame($sender->id, $transfer->sender_user_id);
        $this->assertSame($receiverAccount->user_id, $transfer->receiver_user_id);
        $this->assertSame($senderAccount->id, $transfer->sender_bank_account_id);
        $this->assertSame($receiverAccount->id, $transfer->receiver_bank_account_id);
        $this->assertSame($beneficiary->id, $transfer->beneficiary_id);
        $this->assertSame('MAD', $transfer->currency);
        $this->assertNotNull($transfer->completed_at);
    }

    public function test_insufficient_balance_blocks_transfer_without_partial_updates(): void
    {
        [$sender, $senderAccount, $receiverAccount, $beneficiary] = $this->transferFixture('active');
        $senderAccount->update(['balance' => 50]);

        $this->actingAs($sender)
            ->post(route('backend.customer.transfers.store'), [
                'from_account_id' => $senderAccount->id,
                'beneficiary_id' => $beneficiary->id,
                'amount' => 60,
            ])
            ->assertSessionHasErrors('amount');

        $this->assertSame('50.00', $senderAccount->fresh()->balance);
        $this->assertSame('250.00', $receiverAccount->fresh()->balance);
        $this->assertSame(0, AccountTransaction::count());
        $this->assertSame(0, TransferRequest::count());
    }

    public function test_pending_and_rejected_customers_cannot_access_transfer_routes(): void
    {
        $pending = $this->customerWithProfile('pending');
        $rejected = $this->customerWithProfile('rejected');

        $this->actingAs($pending)
            ->get('/customer/transfers')
            ->assertRedirect(route('account.pending'));

        $this->actingAs($pending)
            ->get('/customer/beneficiaries')
            ->assertRedirect(route('account.pending'));

        $this->actingAs($rejected)
            ->post(route('backend.customer.transfers.store'), [
                'from_account_id' => 1,
                'beneficiary_id' => 1,
                'amount' => 10,
            ])
            ->assertRedirect(route('account.pending'));
    }

    public function test_customer_cannot_transfer_to_themselves(): void
    {
        $sender = $this->customerWithProfile('verified');
        $senderAccount = $this->bankAccount($sender, ['balance' => 1000]);

        $beneficiary = Beneficiary::create([
            'user_id' => $sender->id,
            'full_name' => 'Own Account',
            'bank_name' => 'CIM Bank',
            'rib' => $senderAccount->rib,
            'account_number' => $senderAccount->account_number,
            'status' => 'active',
            'linked_bank_account_id' => $senderAccount->id,
            'verified_at' => now(),
        ]);

        $this->actingAs($sender)
            ->post(route('backend.customer.transfers.store'), [
                'from_account_id' => $senderAccount->id,
                'beneficiary_id' => $beneficiary->id,
                'amount' => 25,
            ])
            ->assertSessionHasErrors('beneficiary_id');

        $this->assertSame('1000.00', $senderAccount->fresh()->balance);
        $this->assertSame(0, AccountTransaction::count());
    }

    public function test_customer_cannot_use_another_users_beneficiary(): void
    {
        [$sender, $senderAccount] = $this->transferFixture('active');

        $otherSender = $this->customerWithProfile('verified');
        $otherReceiver = $this->customerWithProfile('verified');
        $otherReceiverAccount = $this->bankAccount($otherReceiver);
        $otherBeneficiary = Beneficiary::create([
            'user_id' => $otherSender->id,
            'full_name' => 'Other Beneficiary',
            'bank_name' => 'CIM Bank',
            'rib' => $otherReceiverAccount->rib,
            'account_number' => $otherReceiverAccount->account_number,
            'status' => 'active',
            'linked_bank_account_id' => $otherReceiverAccount->id,
            'verified_at' => now(),
        ]);

        $this->actingAs($sender)
            ->post(route('backend.customer.transfers.store'), [
                'from_account_id' => $senderAccount->id,
                'beneficiary_id' => $otherBeneficiary->id,
                'amount' => 25,
            ])
            ->assertSessionHasErrors('beneficiary_id');

        $this->assertSame('1000.00', $senderAccount->fresh()->balance);
        $this->assertSame(0, AccountTransaction::count());
    }

    /**
     * @return array{0: User, 1: BankAccount, 2: BankAccount, 3: Beneficiary}
     */
    private function transferFixture(string $beneficiaryStatus): array
    {
        $sender = $this->customerWithProfile('verified');
        $receiver = $this->customerWithProfile('verified');
        $senderAccount = $this->bankAccount($sender, ['balance' => 1000]);
        $receiverAccount = $this->bankAccount($receiver, ['balance' => 250]);

        $beneficiary = Beneficiary::create([
            'user_id' => $sender->id,
            'full_name' => 'Receiver Customer',
            'bank_name' => 'CIM Bank',
            'rib' => $receiverAccount->rib,
            'account_number' => $receiverAccount->account_number,
            'status' => $beneficiaryStatus,
            'linked_bank_account_id' => $receiverAccount->id,
            'verified_at' => $beneficiaryStatus === 'active' ? now() : null,
        ]);

        return [$sender, $senderAccount, $receiverAccount, $beneficiary];
    }

    private function customerWithProfile(
        string $status,
        string $firstName = 'Test',
        string $lastName = 'Customer',
    ): User
    {
        $customer = User::factory()->create();
        $customer->assignRole('customer');

        CustomerProfile::create([
            'user_id' => $customer->id,
            'cin' => fake()->unique()->bothify('??######'),
            'first_name' => $firstName,
            'last_name' => $lastName,
            'status' => $status,
            'verified_at' => $status === 'verified' ? now() : null,
        ]);

        return $customer->load('profile');
    }

    private function bankAccount(User $customer, array $overrides = []): BankAccount
    {
        return BankAccount::create([
            'user_id' => $customer->id,
            'account_number' => fake()->unique()->numerify('MA########################'),
            'rib' => fake()->unique()->numerify('01178##################'),
            'account_type' => 'current',
            'balance' => 1000,
            'currency' => 'MAD',
            'status' => 'active',
            'opened_at' => now(),
            ...$overrides,
        ]);
    }
}
