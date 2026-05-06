<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('account_transactions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('bank_account_id')->constrained()->cascadeOnDelete();

            $table->string('reference')->unique();
            $table->string('type')->index();
            $table->string('direction')->index();
            $table->decimal('amount', 12, 2);
            $table->decimal('balance_after', 12, 2);
            $table->text('description')->nullable();
            $table->string('status')->default('completed')->index();
            $table->timestamp('performed_at')->nullable()->index();

            $table->timestamps();

            $table->index(['bank_account_id', 'performed_at']);
            $table->index(['bank_account_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('account_transactions');
    }
};
