<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('atm_cash_movements', function (Blueprint $table) {
            $table->id();

            $table->foreignId('atm_id')
                ->constrained('atms')
                ->cascadeOnDelete();

            // Nullable: withdrawals are not triggered by an admin
            $table->foreignId('admin_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // load | withdrawal | adjustment
            $table->string('type')->index();

            $table->decimal('amount', 12, 2);          // Always positive
            $table->decimal('cash_before', 12, 2);     // ATM cash before this movement
            $table->decimal('cash_after', 12, 2);      // ATM cash after this movement

            $table->text('note')->nullable();

            $table->timestamps();

            $table->index(['atm_id', 'type']);
            $table->index(['atm_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('atm_cash_movements');
    }
};
