<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Machrou3iApplication extends Model
{
    use HasFactory;

    public const STATUSES = [
        'draft',
        'submitted',
        'under_review',
        'need_more_documents',
        'pre_approved',
        'offer_sent',
        'customer_accepted_offer',
        'rejected',
        'cancelled',
    ];

    public const EMPLOYMENT_TYPES = ['CDI', 'CDD', 'Freelance', 'Other'];

    public const PROJECT_TYPES = [
        'food',
        'ecommerce',
        'service',
        'transport',
        'agriculture',
        'education',
        'technology',
        'other',
    ];

    protected $fillable = [
        'user_id',
        'bank_account_id',
        'monthly_salary',
        'company_name',
        'job_title',
        'employment_type',
        'hiring_date',
        'salary_proof_path',
        'salary_proof_original_name',
        'salary_proof_mime_type',
        'salary_proof_size',
        'project_name',
        'project_type',
        'project_location',
        'has_experience_in_field',
        'needs_equipment',
        'project_description',
        'why_this_project',
        'requested_amount',
        'expected_monthly_revenue',
        'expected_monthly_expenses',
        'expected_monthly_profit',
        'repayment_months',
        'status',
        'risk_score',
        'risk_level',
        'suggested_amount',
        'suggested_monthly_installment',
        'offered_amount',
        'offered_repayment_months',
        'offered_monthly_installment',
        'reviewed_by',
        'reviewed_at',
        'decision_note',
        'required_documents_note',
        'submitted_at',
        'customer_accepted_at',
    ];

    protected function casts(): array
    {
        return [
            'monthly_salary' => 'decimal:2',
            'hiring_date' => 'date',
            'salary_proof_size' => 'integer',
            'has_experience_in_field' => 'boolean',
            'needs_equipment' => 'boolean',
            'requested_amount' => 'decimal:2',
            'expected_monthly_revenue' => 'decimal:2',
            'expected_monthly_expenses' => 'decimal:2',
            'expected_monthly_profit' => 'decimal:2',
            'repayment_months' => 'integer',
            'risk_score' => 'integer',
            'suggested_amount' => 'decimal:2',
            'suggested_monthly_installment' => 'decimal:2',
            'offered_amount' => 'decimal:2',
            'offered_repayment_months' => 'integer',
            'offered_monthly_installment' => 'decimal:2',
            'reviewed_at' => 'datetime',
            'submitted_at' => 'datetime',
            'customer_accepted_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Machrou3iDocument::class);
    }

    public function riskSnapshots(): HasMany
    {
        return $this->hasMany(Machrou3iRiskSnapshot::class);
    }

    public function latestRiskSnapshot(): HasOne
    {
        return $this->hasOne(Machrou3iRiskSnapshot::class)->latestOfMany();
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
