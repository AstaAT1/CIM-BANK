<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class BankAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'account_number',
        'rib',
        'account_type',
        'balance',
        'currency',
        'status',
        'opened_at',
        'closed_at',
    ];

    protected function casts(): array
    {
        return [
            'balance' => 'decimal:2',
            'opened_at' => 'datetime',
            'closed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(AccountTransaction::class);
    }

    public function customerBills(): HasMany
    {
        return $this->hasMany(CustomerBill::class);
    }

    public function transferRequests(): HasMany
    {
        return $this->hasMany(TransferRequest::class, 'from_account_id');
    }

    public function bankCards(): HasMany
    {
        return $this->hasMany(BankCard::class);
    }

    public function activeBankCard(): HasOne
    {
        return $this->hasOne(BankCard::class)->where('status', 'active')->latestOfMany();
    }

    /**
     * ATM withdrawals debited from this account.
     */
    public function atmWithdrawals(): HasMany
    {
        return $this->hasMany(AtmWithdrawal::class);
    }
}
