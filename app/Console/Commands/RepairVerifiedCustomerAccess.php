<?php

namespace App\Console\Commands;

use App\Services\CustomerApprovalService;
use Illuminate\Console\Command;

class RepairVerifiedCustomerAccess extends Command
{
    protected $signature = 'customers:repair-approved-access {--dry-run : Count repairs without writing changes}';

    protected $description = 'Assign dashboard access requirements to verified non-staff customers missing them.';

    public function handle(CustomerApprovalService $customerApprovalService): int
    {
        $stats = $customerApprovalService->repairVerifiedCustomerAccess((bool) $this->option('dry-run'));

        $this->info(sprintf(
            'Scanned %d verified profiles. Repaired %d. Skipped %d staff users. Missing users: %d.',
            $stats['scanned'],
            $stats['repaired'],
            $stats['skipped_staff'],
            $stats['missing_users'],
        ));

        if ($this->option('dry-run')) {
            $this->line('Dry run only; no users were changed.');
        }

        return self::SUCCESS;
    }
}
