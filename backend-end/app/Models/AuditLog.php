<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'auditable_type',
        'auditable_id',
        'action',
        'description',
        'changes',
        'ip_address',
        'user_agent',
        'performed_at'
    ];

    protected $casts = [
        'performed_at' => 'datetime',
        'changes' => 'array',
    ];

    public function auditable()
    {
        return $this->morphTo();
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public static function log($userId, $action, $description, $ipAddress = null, $userAgent = null)
    {
        return self::create([
            'user_id' => $userId,
            'action' => $action,
            'description' => $description,
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'performed_at' => now(),
        ]);
    }

    public static function logEntity(
        int $userId,
        string $action,
        string $description,
        string $auditableType,
        int $auditableId,
        array $changes = [],
        ?string $ipAddress = null,
        ?string $userAgent = null
    ) {
        return self::create([
            'user_id' => $userId,
            'auditable_type' => $auditableType,
            'auditable_id' => $auditableId,
            'action' => $action,
            'description' => $description,
            'changes' => $changes,
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'performed_at' => now(),
        ]);
    }
}
