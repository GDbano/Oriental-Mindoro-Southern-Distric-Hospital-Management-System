<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AppointmentType extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'description',
        'default_duration_minutes',
        'requires_referral',
        'allows_walk_in',
        'is_active'
    ];

    protected $casts = [
        'default_duration_minutes' => 'integer',
        'requires_referral' => 'boolean',
        'allows_walk_in' => 'boolean',
        'is_active' => 'boolean'
    ];

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
