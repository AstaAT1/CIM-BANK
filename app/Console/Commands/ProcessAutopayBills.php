<?php

namespace App\Console\Commands;

use App\Models\CustomerBill;
use App\Services\BillPaymentService;
use Illuminate\Console\Command;

class ProcessAutopayBills extends Command
{
    protected $signature = 'bills:process-autopay';

    protected $description = 'Send bill reminders and process due CIM AutoPay bills.';

    public function handle(BillPaymentService $billPayments): int
    {
        $bills = CustomerBill::query()
            ->with(['user.profile', 'bankAccount'])
            ->where('status', 'active')
            ->where('autopay_enabled', true)
            ->where('next_due_at', '<=', now())
            ->orderBy('next_due_at')
            ->get();

        $reminded = 0;
        $paid = 0;
        $failed = 0;

        foreach ($bills as $bill) {
            if ($billPayments->shouldSendReminder($bill)) {
                $billPayments->sendReminder($bill);
                $bill->refresh();
                $reminded++;
            }

            $result = $billPayments->pay($bill, 'autopay');

            if ($result['ok'] ?? false) {
                $paid++;
            } else {
                $failed++;
            }
        }

        $this->info("Processed {$bills->count()} due AutoPay bills. Reminders: {$reminded}. Paid: {$paid}. Failed/skipped: {$failed}.");

        return self::SUCCESS;
    }
}
