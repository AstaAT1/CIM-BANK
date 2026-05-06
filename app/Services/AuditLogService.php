<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class AuditLogService
{
    public function log(Request $request, string $action, ?Model $model = null, ?string $description = null, array $metadata = []): AuditLog
    {
        return AuditLog::create([
            'user_id' => $request->user()?->id,
            'action' => $action,
            'model_type' => $model ? $model::class : null,
            'model_id' => $model?->getKey(),
            'description' => $description,
            'ip_address' => $request->ip(),
            'metadata' => $metadata ?: null,
        ]);
    }
}
