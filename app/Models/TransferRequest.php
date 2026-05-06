<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransferRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'from_account_id',
        'beneficiary_id',
        'sender_user_id',
        'receiver_user_id',
        'sender_bank_account_id',
        'receiver_bank_account_id',
        'reference',
        'amount',
        'fee',
        'currency',
        'transfer_type',
        'status',
        'note',
        'reason',
        'processed_by',
        'processed_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'fee' => 'decimal:2',
            'processed_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function sourceAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class, 'from_account_id');
    }

    public function senderAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class, 'sender_bank_account_id');
    }

    public function receiverAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class, 'receiver_bank_account_id');
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_user_id');
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'receiver_user_id');
    }

    public function beneficiary(): BelongsTo
    {
        return $this->belongsTo(Beneficiary::class);
    }

    public function processor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
}
