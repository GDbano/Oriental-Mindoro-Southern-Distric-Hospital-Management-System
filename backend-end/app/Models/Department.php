<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'head_id',
        'phone',
        'email',
        'location',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean'
    ];

    public function head()
    {
        return $this->belongsTo(User::class, 'head_id');
    }

    public function doctors()
    {
        return $this->hasManyThrough(User::class, Department::class);
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    public function appointmentTypes()
    {
        return $this->hasMany(AppointmentType::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function getTodayAppointmentsCountAttribute()
    {
        return $this->appointments()
            ->where('appointment_date', '>=', now()->startOfDay())
            ->where('appointment_date', '<', now()->addDay()->startOfDay())
            ->count();
    }

    public function getTodayQueueAttribute()
    {
        return $this->appointments()
            ->where('appointment_date', '>=', now()->startOfDay())
            ->where('appointment_date', '<', now()->addDay()->startOfDay())
            ->where('status', '!=', 'cancelled')
            ->orderBy('queue_position')
            ->get();
    }
}
