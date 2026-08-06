<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QueueTicket extends Model
{
    use HasFactory;

    protected $fillable = [
        'queue_date',
        'department_id',
        'patient_type',
        'is_priority',
        'prefix',
        'sequence',
        'queue_number',
        'status',
        'created_by',
    ];

    protected $casts = [
        'queue_date' => 'date',
        'is_priority' => 'boolean',
        'sequence' => 'integer',
    ];

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
