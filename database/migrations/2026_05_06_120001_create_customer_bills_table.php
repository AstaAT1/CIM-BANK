<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_bills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('bank_account_id')->constrained('bank_accounts')->cascadeOnDelete();
            $table->foreignId('provider_id')->nullable()->constrained('bill_providers')->nullOnDelete();
            $table->string('label');
            $table->string('category')->index();
            $table->string('provider_name');
            $table->string('reference_number');
            $table->decimal('amount', 12, 2);
            $table->string('frequency')->default('monthly')->index();
            $table->timestamp('next_due_at')->index();
            $table->boolean('autopay_enabled')->default(false)->index();
            $table->decimal('minimum_balance_after_payment', 12, 2)->default(0);
            $table->string('status')->default('active')->index();
            $table->timestamp('reminder_sent_at')->nullable();
            $table->timestamp('last_paid_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['autopay_enabled', 'status', 'next_due_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_bills');
    }
};
