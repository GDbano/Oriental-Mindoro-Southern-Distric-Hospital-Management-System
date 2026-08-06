<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MedicalRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'appointment_id',
        'status',
        'finalized_at',
        'diagnosis',
        'diagnoses',
        'treatment_plan',
        'prescription',
        'prescriptions',
        'documents',
        'notes',
        'subjective_chief_complaint',
        'subjective_hpi',
        'objective_findings',
        'assessment_notes',
        'plan_management',
        'plan_follow_up',
        'height',
        'weight',
        'blood_pressure',
        'bp_systolic',
        'bp_diastolic',
        'temperature',
        'heart_rate',
        'respiratory_rate',
        'oxygen_saturation',
        'pain_scale',
        'lab_results'
    ];

    protected $casts = [
        'finalized_at' => 'datetime',
        'diagnoses' => 'array',
        'prescriptions' => 'array',
        'documents' => 'array',
    ];

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    public function patient()
    {
        return $this->hasOneThrough(Patient::class, Appointment::class);
    }

    public function doctor()
    {
        return $this->hasOneThrough(User::class, Appointment::class, 'id', 'id', 'appointment_id', 'doctor_id');
    }

    public function getBmiAttribute()
    {
        if (!$this->height || !$this->weight) {
            return null;
        }

        $heightInMeters = $this->height / 100;
        return round($this->weight / ($heightInMeters * $heightInMeters), 2);
    }

    public function getVitalsAttribute()
    {
        return [
            'height' => $this->height,
            'weight' => $this->weight,
            'bmi' => $this->bmi,
            'blood_pressure' => $this->blood_pressure,
            'temperature' => $this->temperature,
            'heart_rate' => $this->heart_rate,
        ];
    }
}