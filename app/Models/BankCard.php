<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BankCard extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'bank_account_id',
        'card_holder_name',
        'card_number_last4',
        'masked_card_number',
        'expiry_month',
        'expiry_year',
        'card_token',
        'status',
    ];

    protected $hidden = ['card_token'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class);
    }

    /**
     * Get formatted expiry as MM/YY.
     */
    public function getExpiryFormattedAttribute(): string
    {
        return str_pad($this->expiry_month, 2, '0', STR_PAD_LEFT) . '/' . substr($this->expiry_year, -2);
    }
}
