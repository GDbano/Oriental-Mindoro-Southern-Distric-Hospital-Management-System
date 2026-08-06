<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Patient extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'hospital_number',
        'date_of_birth',
        'gender',
        'civil_status',
        'blood_type',
        'allergies',
        'medical_history',
        'emergency_contact_name',
        'emergency_contact_phone',
        'insurance_info',
        'philhealth_number',
        'philhealth_membership_type',
        'pwd_id_number',
        'senior_citizen_id_number',
        'is_indigent',
        'staff_remarks',
        'barangay',
        'municipality',
        'province',
        'is_pwd',
        'is_pregnant',
        'is_senior'
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'is_indigent' => 'boolean',
        'is_pwd' => 'boolean',
        'is_pregnant' => 'boolean',
        'is_senior' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function labRequests()
    {
        return $this->hasMany(LabRequest::class);
    }

    public function billings()
    {
        return $this->hasMany(Billing::class);
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    public function medicalRecords()
    {
        return $this->hasManyThrough(MedicalRecord::class, Appointment::class);
    }

    public function getAgeAttribute()
    {
        return $this->date_of_birth?->age;
    }

    public function getFullInfoAttribute()
    {
        return [
            'id' => $this->id,
            'name' => $this->user->name,
            'email' => $this->user->email,
            'phone' => $this->user->phone,
            'age' => $this->age,
            'gender' => $this->gender,
            'blood_type' => $this->blood_type,
        ];
    }
}