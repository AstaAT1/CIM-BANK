<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Atm extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'city',
        'area',
        'address',
        'latitude',
        'longitude',
        'current_cash',
        'max_capacity',
        'status',
        'is_active',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'latitude'     => 'decimal:7',
            'longitude'    => 'decimal:7',
            'current_cash' => 'decimal:2',
            'max_capacity' => 'decimal:2',
            'is_active'    => 'boolean',
        ];
    }

    // ── Relationships ─────────────────────────────────────────────────────

    /**
     * All cash load / adjustment / withdrawal movements for this ATM.
     */
    public function cashMovements(): HasMany
    {
        return $this->hasMany(AtmCashMovement::class);
    }

    /**
     * All withdrawal attempts recorded at this ATM.
     */
    public function withdrawals(): HasMany
    {
        return $this->hasMany(AtmWithdrawal::class);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    /**
     * Cash fill percentage (0–100).
     */
    public function getFillPercentageAttribute(): float
    {
        if ($this->max_capacity <= 0) {
            return 0;
        }

        return round(($this->current_cash / $this->max_capacity) * 100, 1);
    }

    /**
     * Re-compute and persist the correct status based on current cash.
     */
    public function refreshStatus(): void
    {
        if (! $this->is_active) {
            $this->update(['status' => 'out_of_service']);
            return;
        }

        $fill = $this->fill_percentage;

        $status = match (true) {
            $fill === 0.0         => 'empty',
            $fill < 20.0          => 'low_cash',
            default               => 'active',
        };

        $this->update(['status' => $status]);
    }
}
