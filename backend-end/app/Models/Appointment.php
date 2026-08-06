<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Appointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'doctor_id',
        'department_id',
        'appointment_type_id',
        'appointment_date',
        'scheduled_time',
        'consultation_start_time',
        'consultation_end_time',
        'queue_number',
        'priority_level',
        'queue_position',
        'status',
        'reason',
        'symptoms',
        'notes',
        'cancellation_reason',
        'booked_by',
        'booking_source',
        'sms_reminder_sent',
        'sms_sent_at',
        'sms_phone',
        'sms_response',
        'referral_number',
        'referring_doctor',
        'referring_facility',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'appointment_date' => 'datetime',
        'scheduled_time' => 'string',
        'consultation_start_time' => 'datetime',
        'consultation_end_time' => 'datetime',
        'sms_reminder_sent' => 'boolean',
        'sms_sent_at' => 'datetime',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class)->with('user');
    }

    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function appointmentType()
    {
        return $this->belongsTo(AppointmentType::class);
    }

    public function medicalRecord()
    {
        return $this->hasOne(MedicalRecord::class);
    }

    public function labRequests()
    {
        return $this->hasMany(LabRequest::class);
    }

    public function billing()
    {
        return $this->hasOne(Billing::class);
    }

    public function queueLog()
    {
        return $this->hasOne(QueueLog::class);
    }

    public function bookedBy()
    {
        return $this->belongsTo(User::class, 'booked_by');
    }

    public function createdByUser()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedByUser()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function scopeToday($query)
    {
        return $query->whereDate('appointment_date', today());
    }

    public function scopeUpcoming($query)
    {
        return $query->where('appointment_date', '>=', now())
            ->whereIn('status', ['scheduled', 'confirmed']);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'scheduled');
    }

    public function scopeForDoctor($query, $doctorId)
    {
        return $query->where('doctor_id', $doctorId);
    }

    public function scopeForPatient($query, $patientId)
    {
        return $query->where('patient_id', $patientId);
    }

    public function canBeModified()
    {
        return in_array($this->status, ['scheduled', 'confirmed']);
    }

    public function isToday()
    {
        return $this->appointment_date->isToday();
    }

    /**
     * Generate unique queue number for appointment
     * Format: OPD-001, OPD-002 for regular, PR-001, PR-002 for priority
     */
    public function generateQueueNumber()
    {
        $date = $this->appointment_date->format('Y-m-d');
        $departmentId = $this->department_id;

        // Determine prefix based on priority
        $isPriority = in_array($this->priority_level, ['Senior', 'PWD', 'Pregnant']);
        $prefix = $isPriority ? 'PR' : 'OPD';

        // Try to generate a unique queue number with retry logic
        $maxAttempts = 10;
        $attempt = 0;

        while ($attempt < $maxAttempts) {
            // Get the next sequence number for this department on this date
            // Count by PREFIX (not priority_level) since multiple priority levels share the same prefix
            $sequenceQuery = Appointment::where('department_id', $departmentId)
                ->whereDate('appointment_date', $date)
                ->where('queue_number', 'LIKE', $prefix . '-%');

            if ($this->exists) {
                $sequenceQuery->where('id', '!=', $this->id);
            }

            $nextSequence = $sequenceQuery->count() + 1;
            $queueNumber = sprintf('%s-%03d', $prefix, $nextSequence);

            // Check if this queue number already exists
            $exists = Appointment::where('queue_number', $queueNumber)
                ->where('id', '!=', $this->id ?? 0)
                ->exists();

            if (!$exists) {
                return $queueNumber;
            }

            $attempt++;
            // If collision detected, try next number
        }

        // Fallback: use timestamp-based unique number
        return sprintf('%s-%s', $prefix, substr(time(), -6));
    }

    /**
     * Assign queue number and position
     */
    public function assignQueueNumber()
    {
        if (!$this->queue_number) {
            $this->queue_number = $this->generateQueueNumber();
        }

        // Calculate queue position based on priority
        $date = $this->appointment_date->format('Y-m-d');
        $position = Appointment::where('department_id', $this->department_id)
            ->whereDate('appointment_date', $date)
            ->where('status', '!=', 'cancelled')
            ->orderBy('priority_level', 'desc') // Priority appointments first
            ->orderBy('created_at', 'asc')
            ->get()
            ->search(fn($appt) => $appt->id === $this->id) + 1;

        $this->queue_position = $position;
    }

    /**
     * Check if patient qualifies for priority
     */
    public static function determinePriorityLevel(Patient $patient)
    {
        // Check if marked as pregnant
        if ($patient->is_pregnant) {
            return 'Pregnant';
        }

        // Check if marked as PWD (Person With Disability)
        if ($patient->is_pwd) {
            return 'PWD';
        }

        // Check if marked as senior or age 60+
        if ($patient->is_senior || $patient->age >= 60) {
            return 'Senior';
        }

        return 'Regular';
    }

    /**
     * Reset queue numbers for a department on a specific date
     * Call this daily or as per queue reset schedule
     */
    public static function resetDailyQueue($departmentId, $date)
    {
        $appointments = Appointment::where('department_id', $departmentId)
            ->whereDate('appointment_date', $date)
            ->where('status', '!=', 'cancelled')
            ->orderBy('priority_level', 'desc')
            ->orderBy('created_at', 'asc')
            ->get();

        $regularCount = 0;
        $priorityCount = 0;

        foreach ($appointments as $appointment) {
            if ($appointment->priority_level === 'Regular') {
                $regularCount++;
                $appointment->queue_number = sprintf('OPD-%03d', $regularCount);
            } else {
                $priorityCount++;
                $appointment->queue_number = sprintf('PR-%03d', $priorityCount);
            }
            $appointment->queue_position = $regularCount + $priorityCount;
            $appointment->save();
        }
    }
}