<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AtmCashMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'atm_id',
        'admin_user_id',
        'type',
        'amount',
        'cash_before',
        'cash_after',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'amount'      => 'decimal:2',
            'cash_before' => 'decimal:2',
            'cash_after'  => 'decimal:2',
        ];
    }

    // ── Relationships ─────────────────────────────────────────────────────

    /**
     * The ATM this movement belongs to.
     */
    public function atm(): BelongsTo
    {
        return $this->belongsTo(Atm::class);
    }

    /**
     * The admin/employee who performed a load or adjustment (null for customer withdrawals).
     */
    public function adminUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_user_id');
    }
}
