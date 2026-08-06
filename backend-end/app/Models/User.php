<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'address',
        'specialization',
        'license_number',
        'ptr_number',
        'is_active'
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function patient()
    {
        return $this->hasOne(Patient::class);
    }

    public function doctorAppointments()
    {
        return $this->hasMany(Appointment::class, 'doctor_id');
    }

    public function patientAppointments()
    {
        return $this->hasManyThrough(Appointment::class, Patient::class);
    }

    public function medicalRecords()
    {
        return $this->hasManyThrough(MedicalRecord::class, Appointment::class, 'doctor_id');
    }

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class);
    }

    public function doctorSchedules()
    {
        return $this->hasMany(\App\Models\DoctorSchedule::class, 'doctor_id');
    }

    public function isAdmin()
    {
        return $this->role === 'admin';
    }

    public function isDoctor()
    {
        return $this->role === 'doctor';
    }

    public function isPatient()
    {
        return $this->role === 'patient';
    }

    public function isStaff()
    {
        return $this->role === 'staff';
    }

    public function isCashier()
    {
        return $this->role === 'cashier';
    }

    public function isRecordsOfficer()
    {
        return $this->role === 'records_officer';
    }

    public function isMedTech()
    {
        return $this->role === 'medtech';
    }

    public function scopeDoctors($query)
    {
        return $query->where('role', 'doctor')->where('is_active', true);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}