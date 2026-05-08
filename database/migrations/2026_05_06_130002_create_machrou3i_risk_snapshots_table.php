<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('machrou3i_risk_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('machrou3i_application_id')->constrained('machrou3i_applications')->cascadeOnDelete();
            $table->decimal('monthly_salary', 12, 2);
            $table->decimal('current_balance', 12, 2)->default(0);
            $table->decimal('monthly_obligations', 12, 2)->default(0);
            $table->decimal('safe_remaining_income', 12, 2)->default(0);
            $table->decimal('requested_amount', 12, 2);
            $table->decimal('expected_profit', 12, 2);
            $table->decimal('debt_to_income_ratio', 8, 4)->default(0);
            $table->unsignedInteger('risk_score');
            $table->string('risk_level')->index();
            $table->decimal('suggested_amount', 12, 2);
            $table->decimal('suggested_monthly_installment', 12, 2);
            $table->json('reasons')->nullable();
            $table->timestamps();

            $table->index(['machrou3i_application_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('machrou3i_risk_snapshots');
    }
};
