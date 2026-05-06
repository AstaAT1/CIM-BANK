<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CustomerProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'cin',
        'first_name',
        'last_name',
        'phone',
        'birth_date',
        'address',
        'city',
        'employment_status',
        'monthly_income',
        'status',
        'verified_at',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'monthly_income' => 'decimal:2',
            'verified_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function accountOpeningRequests(): HasMany
    {
        return $this->hasMany(AccountOpeningRequest::class);
    }
}
