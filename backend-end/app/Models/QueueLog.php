<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QueueLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'appointment_id',
        'department_id',
        'queue_date',
        'queue_number',
        'queue_sequence',
        'priority_level',
        'current_status',
        'called_at',
        'completed_at',
        'wait_minutes',
        'consultation_minutes',
        'marked_in_consultation_at',
        'marked_completed_at',
        'marked_no_show_at',
        'notes'
    ];

    protected $casts = [
        'queue_date' => 'date',
        'called_at' => 'datetime',
        'completed_at' => 'datetime',
        'marked_in_consultation_at' => 'datetime',
        'marked_completed_at' => 'datetime',
        'marked_no_show_at' => 'datetime',
    ];

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Create queue log entry from appointment
     */
    public static function createFromAppointment(Appointment $appointment)
    {
        return self::create([
            'appointment_id' => $appointment->id,
            'department_id' => $appointment->department_id,
            'queue_date' => $appointment->appointment_date->toDateString(),
            'queue_number' => $appointment->queue_number,
            'queue_sequence' => $appointment->queue_position,
            'priority_level' => $appointment->priority_level,
            'current_status' => 'waiting'
        ]);
    }

    /**
     * Update queue status
     */
    public function updateStatus($newStatus, $notes = null)
    {
        $statusMap = [
            'called' => ['current_status' => 'called', 'called_at' => now()],
            'in_consultation' => ['current_status' => 'in_consultation', 'marked_in_consultation_at' => now()],
            'completed' => ['current_status' => 'completed', 'marked_completed_at' => now()],
            'no_show' => ['current_status' => 'no_show', 'marked_no_show_at' => now()],
            'cancelled' => ['current_status' => 'cancelled'],
        ];

        if (isset($statusMap[$newStatus])) {
            $updates = $statusMap[$newStatus];
            if ($notes) {
                $updates['notes'] = $notes;
            }
            $this->update($updates);
        }
    }

    /**
     * Calculate wait time
     */
    public function getWaitTimeAttribute()
    {
        if ($this->called_at) {
            return $this->called_at->diffInMinutes(now());
        }
        return null;
    }

    /**
     * Calculate consultation time
     */
    public function getConsultationTimeAttribute()
    {
        if ($this->marked_in_consultation_at && $this->marked_completed_at) {
            return $this->marked_completed_at->diffInMinutes($this->marked_in_consultation_at);
        }
        return null;
    }
}
