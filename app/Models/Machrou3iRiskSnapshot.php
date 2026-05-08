<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Machrou3iRiskSnapshot extends Model
{
    use HasFactory;

    protected $fillable = [
        'machrou3i_application_id',
        'monthly_salary',
        'current_balance',
        'monthly_obligations',
        'safe_remaining_income',
        'requested_amount',
        'expected_profit',
        'debt_to_income_ratio',
        'risk_score',
        'risk_level',
        'suggested_amount',
        'suggested_monthly_installment',
        'reasons',
    ];

    protected function casts(): array
    {
        return [
            'monthly_salary' => 'decimal:2',
            'current_balance' => 'decimal:2',
            'monthly_obligations' => 'decimal:2',
            'safe_remaining_income' => 'decimal:2',
            'requested_amount' => 'decimal:2',
            'expected_profit' => 'decimal:2',
            'debt_to_income_ratio' => 'decimal:4',
            'risk_score' => 'integer',
            'suggested_amount' => 'decimal:2',
            'suggested_monthly_installment' => 'decimal:2',
            'reasons' => 'array',
        ];
    }

    public function application(): BelongsTo
    {
        return $this->belongsTo(Machrou3iApplication::class, 'machrou3i_application_id');
    }
}
