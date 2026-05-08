<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('machrou3i_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('bank_account_id')->constrained('bank_accounts')->cascadeOnDelete();

            $table->decimal('monthly_salary', 12, 2);
            $table->string('company_name');
            $table->string('job_title');
            $table->string('employment_type')->index();
            $table->date('hiring_date')->nullable();
            $table->string('salary_proof_path')->nullable();
            $table->string('salary_proof_original_name')->nullable();
            $table->string('salary_proof_mime_type')->nullable();
            $table->unsignedBigInteger('salary_proof_size')->nullable();

            $table->string('project_name');
            $table->string('project_type')->index();
            $table->string('project_location')->nullable();
            $table->boolean('has_experience_in_field')->default(false);
            $table->boolean('needs_equipment')->default(false);
            $table->text('project_description');
            $table->text('why_this_project')->nullable();
            $table->decimal('requested_amount', 12, 2);
            $table->decimal('expected_monthly_revenue', 12, 2);
            $table->decimal('expected_monthly_expenses', 12, 2);
            $table->decimal('expected_monthly_profit', 12, 2);
            $table->unsignedInteger('repayment_months');

            $table->string('status')->default('draft')->index();
            $table->unsignedInteger('risk_score')->nullable();
            $table->string('risk_level')->nullable()->index();
            $table->decimal('suggested_amount', 12, 2)->nullable();
            $table->decimal('suggested_monthly_installment', 12, 2)->nullable();
            $table->decimal('offered_amount', 12, 2)->nullable();
            $table->unsignedInteger('offered_repayment_months')->nullable();
            $table->decimal('offered_monthly_installment', 12, 2)->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('decision_note')->nullable();
            $table->text('required_documents_note')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('customer_accepted_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['bank_account_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('machrou3i_applications');
    }
};
