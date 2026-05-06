<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CustomerBill extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'bank_account_id',
        'provider_id',
        'label',
        'category',
        'provider_name',
        'reference_number',
        'amount',
        'frequency',
        'next_due_at',
        'autopay_enabled',
        'minimum_balance_after_payment',
        'status',
        'reminder_sent_at',
        'last_paid_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'minimum_balance_after_payment' => 'decimal:2',
            'next_due_at' => 'datetime',
            'autopay_enabled' => 'boolean',
            'reminder_sent_at' => 'datetime',
            'last_paid_at' => 'datetime',
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

    public function provider(): BelongsTo
    {
        return $this->belongsTo(BillProvider::class, 'provider_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(BillPayment::class);
    }
}
