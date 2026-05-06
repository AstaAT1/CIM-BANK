<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BillProvider extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'category',
        'status',
    ];

    public function bills(): HasMany
    {
        return $this->hasMany(CustomerBill::class, 'provider_id');
    }
}
