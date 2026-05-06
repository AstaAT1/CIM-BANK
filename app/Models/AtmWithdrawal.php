<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AtmWithdrawal extends Model
{
    use HasFactory;

    protected $fillable = [
        'atm_id',
        'user_id',
        'bank_account_id',
        'amount',
        'status',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
        ];
    }

    // ── Relationships ─────────────────────────────────────────────────────

    /**
     * The ATM where the withdrawal was attempted.
     */
    public function atm(): BelongsTo
    {
        return $this->belongsTo(Atm::class);
    }

    /**
     * The customer who made the withdrawal.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The bank account that was debited.
     */
    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class);
    }
}
