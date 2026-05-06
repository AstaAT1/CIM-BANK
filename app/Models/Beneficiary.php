<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Beneficiary extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'full_name',
        'bank_name',
        'rib',
        'account_number',
        'phone',
        'status',
        'linked_bank_account_id',
        'verified_at',
    ];

    protected function casts(): array
    {
        return [
            'verified_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function linkedBankAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class, 'linked_bank_account_id');
    }

    public function transferRequests(): HasMany
    {
        return $this->hasMany(TransferRequest::class);
    }
}
