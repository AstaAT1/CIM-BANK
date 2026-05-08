<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Machrou3iDocument extends Model
{
    use HasFactory;

    public const STATUSES = ['uploaded', 'reviewed', 'rejected'];

    protected $fillable = [
        'machrou3i_application_id',
        'user_id',
        'document_type',
        'file_path',
        'original_name',
        'mime_type',
        'size',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'size' => 'integer',
        ];
    }

    public function application(): BelongsTo
    {
        return $this->belongsTo(Machrou3iApplication::class, 'machrou3i_application_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
