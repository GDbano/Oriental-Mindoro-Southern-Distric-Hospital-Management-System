<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LabRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'appointment_id',
        'doctor_id',
        'urgency',
        'status',
        'tests',
        'specimen',
        'others',
        'clinical_notes',
        'requested_at',
        'completed_at',
    ];

    protected $casts = [
        'tests' => 'array',
        'requested_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }
}
