<?php

namespace App\Services;

use App\Models\AccountOpeningRequest;
use App\Models\BankAccount;
use App\Models\BankCard;
use App\Models\CustomerProfile;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Spatie\Permission\Models\Role;

class CustomerApprovalService
{
    public function __construct(private readonly BankAccountService $bankAccountService) {}

    /**
     * Make an account-opening user fully eligible for customer dashboard access.
     *
     * @return array{user: User, profile: CustomerProfile, account: BankAccount, card: BankCard}
     */
    public function approveAccountOpeningRequest(AccountOpeningRequest $accountOpeningRequest, ?int $reviewerId = null): array
    {
        $approved = DB::transaction(function () use ($accountOpeningRequest, $reviewerId): array {
            $accountOpeningRequest->loadMissing(['user.roles', 'customerProfile', 'user.profile']);

            $user = $accountOpeningRequest->user;
            if (! $user) {
                throw new RuntimeException('Cannot approve an account opening request without a user.');
            }

            $this->assertUserCanBecomeCustomer($user);
            $this->ensureCustomerRole($user);

            if (! $user->email_verified_at) {
                $user->forceFill(['email_verified_at' => now()])->save();
            }

            $profile = $accountOpeningRequest->customerProfile ?: $user->profile;
            if (! $profile) {
                throw new RuntimeException('Cannot approve an account opening request without a customer profile.');
            }

            $profile->update([
                'status' => 'verified',
                'verified_at' => $profile->verified_at ?? now(),
            ]);

            $accountOpeningRequest->update([
                'status' => 'account_created',
                'reviewed_by' => $reviewerId,
                'reviewed_at' => now(),
                'rejection_reason' => null,
            ]);

            $banking = $this->bankAccountService->ensureActiveAccountAndCard($accountOpeningRequest);

            return [
                'user' => $user->refresh()->load('roles'),
                'profile' => $profile->refresh(),
                'account' => $banking['account'],
                'card' => $banking['card'],
            ];
        });

        $this->assertReadyForDashboard($approved['user'], $approved['profile'], $approved['account'], $approved['card']);

        return $approved;
    }

    /**
     * Repair verified normal users that predate the stricter dashboard guard.
     *
     * @return array{scanned: int, repaired: int, skipped_staff: int, missing_users: int}
     */
    public function repairVerifiedCustomerAccess(bool $dryRun = false): array
    {
        $stats = [
            'scanned' => 0,
            'repaired' => 0,
            'skipped_staff' => 0,
            'missing_users' => 0,
        ];

        CustomerProfile::query()
            ->where('status', 'verified')
            ->with(['user.roles'])
            ->orderBy('id')
            ->chunkById(100, function ($profiles) use (&$stats, $dryRun): void {
                foreach ($profiles as $profile) {
                    $stats['scanned']++;

                    $user = $profile->user;
                    if (! $user) {
                        $stats['missing_users']++;

                        continue;
                    }

                    if ($user->hasRole(['admin', 'employee'])) {
                        $stats['skipped_staff']++;

                        continue;
                    }

                    $needsRole = ! $user->hasRole('customer');
                    $needsEmailVerification = ! $user->email_verified_at;
                    $needsProfileTimestamp = ! $profile->verified_at;

                    if (! $needsRole && ! $needsEmailVerification && ! $needsProfileTimestamp) {
                        continue;
                    }

                    $stats['repaired']++;

                    if ($dryRun) {
                        continue;
                    }

                    DB::transaction(function () use ($user, $profile, $needsRole, $needsEmailVerification, $needsProfileTimestamp): void {
                        if ($needsRole) {
                            $this->ensureCustomerRole($user);
                        }

                        if ($needsEmailVerification) {
                            $user->forceFill(['email_verified_at' => now()])->save();
                        }

                        if ($needsProfileTimestamp) {
                            $profile->update(['verified_at' => now()]);
                        }
                    });
                }
            });

        return $stats;
    }

    private function ensureCustomerRole(User $user): void
    {
        Role::findOrCreate('customer', 'web');

        if (! $user->hasRole('customer')) {
            $user->assignRole('customer');
        }
    }

    private function assertUserCanBecomeCustomer(User $user): void
    {
        if ($user->hasRole(['admin', 'employee'])) {
            throw new RuntimeException('Bank staff users cannot be approved as customer banking users.');
        }
    }

    private function assertReadyForDashboard(User $user, CustomerProfile $profile, $account, $card): void
    {
        if (! $user->hasRole('customer')) {
            throw new RuntimeException('Approved customer is missing the customer role.');
        }

        if (! $user->email_verified_at) {
            throw new RuntimeException('Approved customer email is not verified.');
        }

        if ($profile->status !== 'verified' || ! $profile->verified_at) {
            throw new RuntimeException('Approved customer profile is not verified.');
        }

        if ($account->status !== 'active') {
            throw new RuntimeException('Approved customer bank account is not active.');
        }

        if ($card->status !== 'active') {
            throw new RuntimeException('Approved customer bank card is not active.');
        }
    }
}
