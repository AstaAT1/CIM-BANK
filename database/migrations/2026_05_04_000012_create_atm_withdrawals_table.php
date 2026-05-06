<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('atm_withdrawals', function (Blueprint $table) {
            $table->id();

            $table->foreignId('atm_id')
                ->constrained('atms')
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('bank_account_id')
                ->constrained('bank_accounts')
                ->cascadeOnDelete();

            $table->decimal('amount', 12, 2);

            // completed | rejected | failed
            $table->string('status')->default('completed')->index();

            $table->text('note')->nullable(); // e.g. rejection reason

            $table->timestamps();

            $table->index(['atm_id', 'status']);
            $table->index(['user_id', 'status']);
            $table->index(['bank_account_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('atm_withdrawals');
    }
};
