<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AppointmentType;
use App\Models\Patient;
use App\Models\User;
use App\Models\Department;
use App\Models\DoctorSchedule;
use App\Models\QueueLog;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AppointmentController extends Controller
{
    private const SLOT_INTERVAL_MINUTES = 30;

    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            $query = Appointment::with(['patient.user', 'doctor', 'department', 'medicalRecord']);

            // Filter by user type
            if ($user->isPatient()) {
                $query->where('patient_id', $user->patient->id);
            } elseif ($user->isDoctor()) {
                // If requesting today's appointments with queue
                if ($request->get('today') === 'true') {
                    $query->whereDate('appointment_date', today());
                } else {
                    $query->where('doctor_id', $user->id);
                }
            } elseif ($request->has('department_id')) {
                $query->where('department_id', $request->department_id);
            }

            // Apply filters
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            if ($request->has('date')) {
                $query->whereDate('appointment_date', $request->date);
            }

            if ($request->has('doctor_id') && ($user->isAdmin() || $user->isStaff())) {
                $query->where('doctor_id', $request->doctor_id);
            }

            // Get today's appointments with queue status
            if ($request->get('with_queue') === 'true') {
                $query->orderBy('queue_position', 'asc');
            } else {
                $query->orderBy('appointment_date', $request->get('sort', 'desc'));
            }

            $appointments = $query->get();

            return response()->json($appointments);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch appointments: ' . $e->getMessage()
            ], 500);
        }
    }

    public function create()
    {
        try {
            $user = Auth::user();
            \Log::info('Create appointment form - Auth user: ' . ($user ? $user->email : 'null'));

            if (!$user->isPatient()) {
                return response()->json(['message' => 'Only patients can book appointments'], 403);
            }

            // Get departments
            $departments = Department::active()->get(['id', 'name', 'description']);
            \Log::info('Departments count: ' . $departments->count());

            // Get doctors with their departments
            $doctors = User::doctors()
                ->select('id', 'name', 'specialization', 'license_number', 'phone')
                ->orderBy('name')
                ->get();
            \Log::info('Doctors count: ' . $doctors->count());

            // Get available appointment types
            $appointmentTypes = \App\Models\AppointmentType::active()->get(['id', 'name', 'code', 'default_duration_minutes']);
            \Log::info('Appointment types count: ' . $appointmentTypes->count());

            return response()->json([
                'departments' => $departments,
                'doctors' => $doctors,
                'appointmentTypes' => $appointmentTypes,
                'patient' => $user->patient->getFullInfoAttribute(),
                'timeSlots' => $this->getDefaultTimeSlots()
            ]);

        } catch (\Exception $e) {
            \Log::error('Appointment create error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'message' => 'Failed to load booking form data: ' . $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        DB::beginTransaction();

        try {
            $request->validate([
                'doctor_id' => 'required|exists:users,id',
                'department_id' => 'required|exists:departments,id',
                'appointment_type_id' => 'required|exists:appointment_types,id',
                'appointment_date' => 'required|date|after_or_equal:today',
                'scheduled_time' => 'nullable|date_format:H:i',
                'reason' => 'required|string|max:500',
                'symptoms' => 'nullable|string|max:1000',
                'priority_level' => 'nullable|in:Regular,Senior,PWD,Pregnant,Emergency',
                'referral_number' => 'nullable|string',
                'referring_doctor' => 'nullable|string',
                'referring_facility' => 'nullable|string',
            ]);

            $user = Auth::user();

            if (!$user->isPatient()) {
                return response()->json(['message' => 'Only patients can book appointments'], 403);
            }

            // Check if doctor is on approved leave
            $hasLeave = \App\Models\DoctorLeave::approved()
                ->where('doctor_id', $request->doctor_id)
                ->where('start_date', '<=', $request->appointment_date)
                ->where('end_date', '>=', $request->appointment_date)
                ->exists();

            if ($hasLeave) {
                return response()->json([
                    'message' => 'Doctor is on leave on the selected date. Please choose another date.'
                ], 422);
            }

            // Check if doctor is available
            $scheduledTime = $this->normalizeTime($request->scheduled_time);

            $conflictingAppointment = Appointment::where('doctor_id', $request->doctor_id)
                ->whereDate('appointment_date', $request->appointment_date)
                ->when($scheduledTime, function ($q) use ($scheduledTime) {
                    $q->where('scheduled_time', $scheduledTime);
                })
                ->whereIn('status', ['scheduled', 'confirmed', 'arrived', 'in_consultation'])
                ->exists();

            if ($conflictingAppointment) {
                return response()->json([
                    'message' => 'Doctor is not available at the selected time. Please choose another time.'
                ], 422);
            }

            // Determine priority level
            $priorityLevel = $request->priority_level ?? Appointment::determinePriorityLevel($user->patient);

            // Create appointment
            $appointment = Appointment::create([
                'patient_id' => $user->patient->id,
                'doctor_id' => $request->doctor_id,
                'department_id' => $request->department_id,
                'appointment_type_id' => $request->appointment_type_id,
                'appointment_date' => $request->appointment_date,
                'scheduled_time' => $scheduledTime,
                'reason' => $request->reason,
                'symptoms' => $request->symptoms,
                'priority_level' => $priorityLevel,
                'status' => 'scheduled',
                'booking_source' => 'self_service',
                'booked_by' => $user->id,
                'created_by' => $user->id,
                'referral_number' => $request->referral_number,
                'referring_doctor' => $request->referring_doctor,
                'referring_facility' => $request->referring_facility,
            ]);

            // Assign queue number and position with retry logic
            $maxRetries = 3;
            $retryCount = 0;
            $queueAssigned = false;

            while (!$queueAssigned && $retryCount < $maxRetries) {
                try {
                    $appointment->assignQueueNumber();
                    $appointment->save();
                    $queueAssigned = true;
                } catch (\Illuminate\Database\QueryException $e) {
                    // If duplicate queue number, retry
                    if ($e->getCode() == 23000 && strpos($e->getMessage(), 'queue_number') !== false) {
                        $retryCount++;
                        if ($retryCount >= $maxRetries) {
                            throw new \Exception('Failed to assign unique queue number after multiple attempts');
                        }
                        // Clear the queue_number to force regeneration
                        $appointment->queue_number = null;
                        usleep(100000); // Wait 100ms before retry
                    } else {
                        throw $e;
                    }
                }
            }

            // Create queue log entry
            QueueLog::createFromAppointment($appointment);

            $appointment->load(['patient.user', 'doctor', 'department']);

            AuditLog::log(
                $user->id,
                'APPOINTMENT_CREATE',
                "Appointment #{$appointment->id} created with queue number {$appointment->queue_number} for patient {$appointment->patient->user->name}"
            );

            DB::commit();

            return response()->json([
                'message' => 'Appointment booked successfully!',
                'appointment' => $appointment
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create appointment: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Booking form data for staff/receptionist booking flow.
     */
    public function bookingForm(Request $request)
    {
        $user = Auth::user();
        if (!$user || !($user->isStaff() || $user->isAdmin())) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $departments = Department::active()->orderBy('name')->get(['id', 'code', 'name']);

        $appointmentTypes = AppointmentType::active()
            ->whereIn('code', ['OPD', 'FOLLOWUP', 'REFERRAL'])
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'default_duration_minutes']);

        return response()->json([
            'departments' => $departments,
            'appointmentTypes' => $appointmentTypes,
            'slot_interval_minutes' => self::SLOT_INTERVAL_MINUTES,
        ]);
    }

    /**
     * Staff/receptionist booking endpoint.
     */
    public function storeByStaff(Request $request)
    {
        $user = Auth::user();
        if (!$user || !($user->isStaff() || $user->isAdmin())) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        DB::beginTransaction();

        try {
            $request->validate([
                'patient_id' => 'required|exists:patients,id',
                'doctor_id' => 'required|exists:users,id',
                'department_id' => 'required|exists:departments,id',
                'appointment_type_id' => 'required|exists:appointment_types,id',
                'appointment_date' => 'required|date|after_or_equal:today',
                'scheduled_time' => 'required|date_format:H:i',
                'reason' => 'required|string|max:500',
            ]);

            $patient = Patient::with('user')->findOrFail($request->patient_id);

            $appointmentDate = Carbon::parse($request->appointment_date)->toDateString();
            $scheduledTime = $this->normalizeTime($request->scheduled_time);

            // Check if doctor is on approved leave
            $hasLeave = \App\Models\DoctorLeave::approved()
                ->where('doctor_id', $request->doctor_id)
                ->where('start_date', '<=', $appointmentDate)
                ->where('end_date', '>=', $appointmentDate)
                ->exists();

            if ($hasLeave) {
                return response()->json([
                    'message' => 'Doctor is on leave on the selected date. Please choose another date.'
                ], 422);
            }

            if ($appointmentDate === today()->toDateString()) {
                $nowTime = now()->format('H:i');
                if ($request->scheduled_time <= $nowTime) {
                    return response()->json(['message' => 'Cannot book a past time slot'], 422);
                }
            }

            // Ensure slot is within doctor's schedule for the department.
            $slotTimes = $this->getTimeSlotsForDoctorOnDate(
                (int) $request->doctor_id,
                (int) $request->department_id,
                Carbon::parse($appointmentDate)
            );

            if (!in_array($request->scheduled_time, $slotTimes, true)) {
                return response()->json(['message' => 'Selected time is outside doctor schedule'], 422);
            }

            // Conflict check: same doctor + same date + same time.
            $conflict = Appointment::where('doctor_id', $request->doctor_id)
                ->whereDate('appointment_date', $appointmentDate)
                ->where('scheduled_time', $scheduledTime)
                ->whereIn('status', ['scheduled', 'confirmed', 'arrived', 'in_consultation'])
                ->exists();

            if ($conflict) {
                return response()->json([
                    'message' => 'Doctor already has an appointment at the selected time'
                ], 422);
            }

            $sameDayExists = Appointment::where('patient_id', $patient->id)
                ->whereDate('appointment_date', $appointmentDate)
                ->whereIn('status', ['scheduled', 'confirmed', 'arrived', 'in_consultation', 'completed', 'no_show', 'rescheduled'])
                ->exists();

            $priorityLevel = Appointment::determinePriorityLevel($patient);

            $appointment = Appointment::create([
                'patient_id' => $patient->id,
                'doctor_id' => $request->doctor_id,
                'department_id' => $request->department_id,
                'appointment_type_id' => $request->appointment_type_id,
                'appointment_date' => $appointmentDate,
                'scheduled_time' => $scheduledTime,
                'reason' => $request->reason,
                'priority_level' => $priorityLevel,
                'status' => 'scheduled',
                'booking_source' => 'staff',
                'booked_by' => $user->id,
                'created_by' => $user->id,
            ]);

            $appointment->assignQueueNumber();
            $appointment->save();

            QueueLog::createFromAppointment($appointment);

            $appointment->load(['patient.user', 'doctor', 'department', 'appointmentType']);

            AuditLog::log(
                $user->id,
                'APPOINTMENT_CREATE',
                "Appointment #{$appointment->id} created by staff for patient {$patient->user->name}"
            );

            DB::commit();

            $warnings = [];
            if ($sameDayExists) {
                $warnings[] = 'Patient already has an appointment on the selected day';
            }

            return response()->json([
                'message' => 'Appointment booked successfully',
                'appointment' => $appointment,
                'warnings' => $warnings,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create appointment: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Warn-only check for same-day appointments.
     */
    public function checkPatientSameDay(Request $request)
    {
        $user = Auth::user();
        if (!$user || !($user->isStaff() || $user->isAdmin())) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'date' => 'required|date|after_or_equal:today',
        ]);

        $count = Appointment::where('patient_id', $request->patient_id)
            ->whereDate('appointment_date', $request->date)
            ->whereIn('status', ['scheduled', 'confirmed', 'arrived', 'in_consultation', 'completed', 'no_show', 'rescheduled'])
            ->count();

        return response()->json([
            'has_appointment' => $count > 0,
            'count' => $count,
        ]);
    }

    /**
     * Get doctor's schedule for a department (display-only).
     */
    public function getDoctorSchedule(Request $request)
    {
        $user = Auth::user();
        if (!$user || !($user->isStaff() || $user->isAdmin())) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'doctor_id' => 'required|exists:users,id',
            'department_id' => 'required|exists:departments,id',
        ]);

        $schedules = DoctorSchedule::active()
            ->where('doctor_id', $request->doctor_id)
            ->where('department_id', $request->department_id)
            ->orderByRaw("FIELD(day_of_week, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')")
            ->get(['day_of_week', 'start_time', 'end_time', 'consultation_duration_minutes']);

        return response()->json([
            'schedules' => $schedules,
        ]);
    }

    /**
     * Month availability for date picker (fully booked days).
     */
    public function getMonthlyAvailability(Request $request)
    {
        $user = Auth::user();
        if (!$user || !($user->isStaff() || $user->isAdmin())) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'doctor_id' => 'required|exists:users,id',
            'department_id' => 'required|exists:departments,id',
            'year' => 'required|integer|min:2000|max:2100',
            'month' => 'required|integer|min:1|max:12',
        ]);

        $doctorId = (int) $request->doctor_id;
        $departmentId = (int) $request->department_id;
        $year = (int) $request->year;
        $month = (int) $request->month;

        $start = Carbon::createFromDate($year, $month, 1)->startOfDay();
        $end = $start->copy()->endOfMonth();

        $fullyBooked = [];
        $unavailable = [];

        $cursor = $start->copy();
        while ($cursor <= $end) {
            $dateStr = $cursor->toDateString();

            // Past dates are unavailable.
            if ($cursor->isBefore(today())) {
                $unavailable[] = $dateStr;
                $cursor->addDay();
                continue;
            }

            $hasLeave = \App\Models\DoctorLeave::approved()
                ->where('doctor_id', $doctorId)
                ->where('start_date', '<=', $dateStr)
                ->where('end_date', '>=', $dateStr)
                ->exists();

            if ($hasLeave) {
                $unavailable[] = $dateStr;
                $cursor->addDay();
                continue;
            }

            $slots = $this->getTimeSlotsForDoctorOnDate($doctorId, $departmentId, $cursor);
            if (count($slots) === 0) {
                $unavailable[] = $dateStr;
                $cursor->addDay();
                continue;
            }

            $bookedCount = Appointment::where('doctor_id', $doctorId)
                ->where('department_id', $departmentId)
                ->whereDate('appointment_date', $dateStr)
                ->whereIn('status', ['scheduled', 'confirmed', 'arrived', 'in_consultation'])
                ->count();

            if ($bookedCount >= count($slots)) {
                $fullyBooked[] = $dateStr;
            }

            $cursor->addDay();
        }

        return response()->json([
            'month' => sprintf('%04d-%02d', $year, $month),
            'fully_booked_dates' => $fullyBooked,
            'unavailable_dates' => $unavailable,
        ]);
    }

    public function show(Appointment $appointment)
    {
        try {
            $user = Auth::user();

            if ($user->isPatient() && $appointment->patient_id !== $user->patient->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            if ($user->isDoctor() && $appointment->doctor_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $appointment->load(['patient.user', 'doctor', 'medicalRecord']);

            return response()->json($appointment);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch appointment: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, Appointment $appointment)
    {
        DB::beginTransaction();

        try {
            $user = Auth::user();

            if ($user->isPatient()) {
                if ($appointment->patient_id !== $user->patient->id) {
                    return response()->json(['message' => 'Unauthorized'], 403);
                }

                $request->validate([
                    'status' => 'required|in:cancelled',
                ]);
            } else {
                $request->validate([
                    'status' => 'required|in:confirmed,in_progress,completed,cancelled',
                    'notes' => 'nullable|string',
                ]);
            }

            $oldStatus = $appointment->status;
            $appointment->update($request->only(['status', 'notes']));

            $appointment->load(['patient.user', 'doctor', 'medicalRecord']);

            AuditLog::log($user->id, 'APPOINTMENT_UPDATE', "Appointment #{$appointment->id} status changed from {$oldStatus} to {$appointment->status}");

            DB::commit();

            return response()->json($appointment);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update appointment: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Appointment $appointment)
    {
        DB::beginTransaction();

        try {
            $user = Auth::user();

            if ($user->isPatient() && $appointment->patient_id !== $user->patient->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            if (!$appointment->canBeModified()) {
                return response()->json([
                    'message' => 'Cannot delete appointment with current status'
                ], 422);
            }

            AuditLog::log($user->id, 'APPOINTMENT_DELETE', "Appointment #{$appointment->id} deleted");

            $appointment->delete();

            DB::commit();

            return response()->json(['message' => 'Appointment deleted successfully']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete appointment: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getDoctors()
    {
        try {
            $doctors = User::doctors()
                ->select('id', 'name', 'specialization', 'license_number', 'phone')
                ->orderBy('name')
                ->get();

            return response()->json($doctors);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch doctors: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get doctors assigned to a specific department
     */
    public function getDoctorsByDepartment(Request $request)
    {
        try {
            $request->validate([
                'department_id' => 'required|exists:departments,id'
            ]);

            // Get doctors assigned to this department through doctors_schedule
            $doctors = User::doctors()
                ->whereHas('doctorSchedules', function ($query) {
                    $query->where('department_id', request('department_id'))
                        ->where('is_active', true);
                })
                ->select('id', 'name', 'specialization', 'license_number', 'phone')
                ->distinct()
                ->orderBy('name')
                ->get();

            return response()->json([
                'doctors' => $doctors,
                'total' => $doctors->count()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch department doctors: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update appointment status with queue tracking
     * Statuses: arrived, in_consultation, completed, no_show, cancelled
     */
    public function updateStatus(Request $request, Appointment $appointment)
    {
        DB::beginTransaction();

        try {
            $user = Auth::user();

            // Authorization check
            if ($user->isPatient() && $appointment->patient_id !== $user->patient->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            if ($user->isDoctor() && $appointment->doctor_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $request->validate([
                'status' => 'required|in:arrived,in_consultation,completed,no_show,cancelled',
                'notes' => 'nullable|string|max:1000',
            ]);

            $oldStatus = $appointment->status;
            $newStatus = $request->status;

            $now = now();

            $consultationStartTime = $appointment->consultation_start_time;
            $consultationEndTime = $appointment->consultation_end_time;

            if ($newStatus === 'in_consultation' && $consultationStartTime === null) {
                $consultationStartTime = $now;
            }

            if ($newStatus === 'completed' && $consultationEndTime === null) {
                $consultationEndTime = $now;
            }

            // Update appointment
            $appointment->update([
                'status' => $newStatus,
                'notes' => $request->notes,
                'consultation_start_time' => $consultationStartTime,
                'consultation_end_time' => $consultationEndTime,
                'updated_by' => $user->id,
            ]);

            // Update queue log if applicable
            if ($appointment->queueLog) {
                $statusMap = [
                    'arrived' => 'called',
                    'in_consultation' => 'in_consultation',
                    'completed' => 'completed',
                    'no_show' => 'no_show',
                    'cancelled' => 'cancelled'
                ];

                $appointment->queueLog->updateStatus($statusMap[$newStatus] ?? $newStatus, $request->notes);
            }

            $appointment->load(['patient.user', 'doctor', 'department']);

            AuditLog::log(
                $user->id,
                'APPOINTMENT_STATUS_UPDATE',
                "Appointment #{$appointment->id} status changed from {$oldStatus} to {$newStatus}"
            );

            DB::commit();

            return response()->json([
                'message' => 'Appointment status updated successfully',
                'appointment' => $appointment
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update appointment status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel appointment with reason
     */
    public function cancel(Request $request, Appointment $appointment)
    {
        DB::beginTransaction();

        try {
            $user = Auth::user();

            // Authorization check
            if ($user->isPatient() && $appointment->patient_id !== $user->patient->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            if (!$appointment->canBeModified()) {
                return response()->json([
                    'message' => 'Cannot cancel appointment with current status'
                ], 422);
            }

            $request->validate([
                'cancellation_reason' => 'required|string|max:500'
            ]);

            $appointment->update([
                'status' => 'cancelled',
                'cancellation_reason' => $request->cancellation_reason,
                'updated_by' => $user->id
            ]);

            // Update queue log
            if ($appointment->queueLog) {
                $appointment->queueLog->updateStatus('cancelled', $request->cancellation_reason);
            }

            $appointment->load(['patient.user', 'doctor']);

            AuditLog::log(
                $user->id,
                'APPOINTMENT_CANCEL',
                "Appointment #{$appointment->id} cancelled. Reason: {$request->cancellation_reason}"
            );

            DB::commit();

            return response()->json([
                'message' => 'Appointment cancelled successfully',
                'appointment' => $appointment
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to cancel appointment: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reschedule appointment to new date/time
     */
    public function reschedule(Request $request, Appointment $appointment)
    {
        DB::beginTransaction();

        try {
            $user = Auth::user();

            // Authorization check
            if ($user->isPatient() && $appointment->patient_id !== $user->patient->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            if (!$appointment->canBeModified()) {
                return response()->json([
                    'message' => 'Cannot reschedule appointment with current status'
                ], 422);
            }

            $request->validate([
                'appointment_date' => 'required|date|after:now',
                'scheduled_time' => 'nullable|date_format:H:i',
                'reason' => 'nullable|string|max:500'
            ]);

            // Check if doctor is on approved leave
            $hasLeave = \App\Models\DoctorLeave::approved()
                ->where('doctor_id', $appointment->doctor_id)
                ->where('start_date', '<=', $request->appointment_date)
                ->where('end_date', '>=', $request->appointment_date)
                ->exists();

            if ($hasLeave) {
                return response()->json([
                    'message' => 'Doctor is on leave on the selected new date. Please choose another date.'
                ], 422);
            }

            // Check if doctor is available at new time
            $conflict = Appointment::where('id', '!=', $appointment->id)
                ->where('doctor_id', $appointment->doctor_id)
                ->where('appointment_date', $request->appointment_date)
                ->whereIn('status', ['scheduled', 'confirmed', 'arrived', 'in_consultation'])
                ->exists();

            if ($conflict) {
                return response()->json([
                    'message' => 'Doctor is not available at the selected new time'
                ], 422);
            }

            $oldDate = $appointment->appointment_date;
            $appointment->update([
                'appointment_date' => $request->appointment_date,
                'scheduled_time' => $request->scheduled_time,
                'status' => 'rescheduled',
                'updated_by' => $user->id
            ]);

            // Reassign queue number for new date
            $appointment->assignQueueNumber();
            $appointment->save();

            $appointment->load(['patient.user', 'doctor']);

            AuditLog::log(
                $user->id,
                'APPOINTMENT_RESCHEDULE',
                "Appointment #{$appointment->id} rescheduled from {$oldDate} to {$appointment->appointment_date}"
            );

            DB::commit();

            return response()->json([
                'message' => 'Appointment rescheduled successfully',
                'appointment' => $appointment
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to reschedule appointment: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get real-time queue display for a department
     * Used for waiting area screens
     */
    public function dailyQueue($departmentId)
    {
        try {
            $department = Department::findOrFail($departmentId);

            // Get today's queue sorted by position
            $queue = Appointment::where('department_id', $departmentId)
                ->whereDate('appointment_date', today())
                ->where('status', '!=', 'cancelled')
                ->with(['patient.user', 'doctor', 'queueLog'])
                ->orderBy('queue_position', 'asc')
                ->get()
                ->map(function ($appointment) {
                    return [
                        'id' => $appointment->id,
                        'queue_number' => $appointment->queue_number,
                        'position' => $appointment->queue_position,
                        'patient_name' => $appointment->patient->user->name,
                        'doctor_name' => $appointment->doctor->name,
                        'priority_level' => $appointment->priority_level,
                        'status' => $appointment->status,
                        'appointment_time' => $appointment->appointment_date->format('H:i'),
                        'reason' => $appointment->reason,
                        'queue_status' => $appointment->queueLog?->current_status ?? 'waiting',
                        'wait_time' => $appointment->queueLog?->wait_time ?? 0,
                    ];
                });

            // Get statistics
            $stats = [
                'total_queue' => $queue->count(),
                'completed_count' => $queue->where('status', 'completed')->count(),
                'in_consultation_count' => $queue->where('status', 'in_consultation')->count(),
                'waiting_count' => $queue->where('status', 'arrived')->count() + $queue->where('status', 'scheduled')->count(),
                'no_show_count' => $queue->where('status', 'no_show')->count(),
            ];

            return response()->json([
                'department' => $department,
                'queue' => $queue,
                'statistics' => $stats,
                'timestamp' => now()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch queue: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get available appointment slots for a doctor on a given date (AJAX)
     */
    public function getAvailableSlots(Request $request)
    {
        try {
            $request->validate([
                'doctor_id' => 'required|exists:users,id',
                'date' => 'required|date|after_or_equal:today',
                'department_id' => 'nullable|exists:departments,id'
            ]);

            $doctorId = $request->doctor_id;
            $date = Carbon::parse($request->date)->startOfDay();

            // Check if doctor is on approved leave
            $hasLeave = \App\Models\DoctorLeave::approved()
                ->where('doctor_id', $doctorId)
                ->where('start_date', '<=', $date->toDateString())
                ->where('end_date', '>=', $date->toDateString())
                ->exists();

            if ($hasLeave) {
                return response()->json([
                    'all_slots' => [],
                    'available_slots' => [],
                    'booked_slots' => [],
                    'total_available' => 0,
                    'date' => $date->format('Y-m-d')
                ]);
            }

            $allSlots = $request->department_id
                ? $this->getTimeSlotsForDoctorOnDate((int) $doctorId, (int) $request->department_id, $date)
                : $this->getDefaultTimeSlots();

            // Get booked slots for the doctor on this date
            $bookedSlots = Appointment::where('doctor_id', $doctorId)
                ->whereDate('appointment_date', $date)
                ->whereIn('status', ['scheduled', 'confirmed', 'arrived', 'in_consultation'])
                ->pluck('scheduled_time')
                ->filter()
                ->map(fn($time) => $time->format('H:i'))
                ->toArray();

            // Remove booked slots from available slots
            $availableSlots = array_filter($allSlots, function ($slot) use ($bookedSlots) {
                return !in_array($slot, $bookedSlots);
            });

            return response()->json([
                'all_slots' => $allSlots,
                'available_slots' => array_values($availableSlots),
                'booked_slots' => $bookedSlots,
                'total_available' => count($availableSlots),
                'date' => $date->format('Y-m-d')
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch available slots: ' . $e->getMessage()
            ], 500);
        }
    }

    private function normalizeTime($time)
    {
        if (!$time) {
            return null;
        }

        // Store as H:i:s to match MySQL TIME column.
        try {
            return Carbon::createFromFormat('H:i', $time)->format('H:i:s');
        } catch (\Exception $e) {
            return null;
        }
    }

    private function getTimeSlotsForDoctorOnDate(int $doctorId, int $departmentId, Carbon $date)
    {
        $dayOfWeek = $date->format('l');

        $schedule = DoctorSchedule::active()
            ->where('doctor_id', $doctorId)
            ->where('department_id', $departmentId)
            ->where('day_of_week', $dayOfWeek)
            ->first();

        if (!$schedule) {
            return [];
        }

        $start = Carbon::parse($schedule->start_time);
        $end = Carbon::parse($schedule->end_time);

        $slots = [];
        $cursor = $start->copy();

        while ($cursor->copy()->addMinutes(self::SLOT_INTERVAL_MINUTES) <= $end) {
            $slots[] = $cursor->format('H:i');
            $cursor->addMinutes(self::SLOT_INTERVAL_MINUTES);
        }

        return $slots;
    }

    /**
     * Helper: Get default time slots
     * Can be customized based on clinic operating hours
     */
    /**
     * Get weekly calendar view for a doctor
     * Returns appointments for given week (Mon-Sat, 7am-5pm)
     */
    public function getWeeklyCalendar(Request $request)
    {
        try {
            $user = Auth::user();

            $request->validate([
                'doctor_id' => 'required|exists:users,id',
                'week_start' => 'required|date_format:Y-m-d'
            ]);

            $doctorId = $request->doctor_id;
            $weekStart = Carbon::parse($request->week_start)->startOfDay();

            // If the provided day is not a Monday, find the Monday of that week
            if ($weekStart->dayOfWeek !== 1) { // Monday = 1
                $weekStart->startOfWeek();
            }

            // doctor_id must be a doctor
            $doctor = User::doctors()->findOrFail($doctorId);

            // Generate week days (Monday to Saturday)
            $weekDays = [];
            $dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

            for ($i = 0; $i < 6; $i++) {
                $date = $weekStart->copy()->addDays($i);
                $weekDays[] = [
                    'date' => $date->format('Y-m-d'),
                    'day_name' => $dayNames[$i],
                    'formatted_date' => $date->format('M d'),
                    'full_date' => $date->format('l, F j, Y')
                ];
            }

            // Get appointments for this week for the doctor
            $appointments = Appointment::where('doctor_id', $doctorId)
                ->whereBetween('appointment_date', [
                    $weekStart->copy()->startOfDay(),
                    $weekStart->copy()->addDays(5)->endOfDay()
                ])
                ->with(['patient.user', 'appointmentType', 'department'])
                ->orderBy('appointment_date')
                ->orderBy('scheduled_time')
                ->get()
                ->map(function ($appointment) {
                    return [
                        'id' => $appointment->id,
                        'patient_name' => $appointment->patient->user->name,
                        'appointment_type' => $appointment->appointmentType->name,
                        'appointment_date' => $appointment->appointment_date->format('Y-m-d'),
                        'scheduled_time' => $appointment->scheduled_time->format('H:i'),
                        'status' => $appointment->status,
                        'priority_level' => $appointment->priority_level,
                        'queue_number' => $appointment->queue_number,
                        'reason' => $appointment->reason,
                        'duration_minutes' => 30,
                        'is_conflict' => false
                    ];
                });

            // Generate time slots (7am to 5pm, 30-minute intervals)
            $timeSlots = [];
            for ($hour = 7; $hour < 17; $hour++) {
                for ($minute = 0; $minute < 60; $minute += 30) {
                    $timeSlots[] = sprintf('%02d:%02d', $hour, $minute);
                }
            }

            // Create calendar grid structure
            $calendarGrid = [];
            foreach ($weekDays as $day) {
                $daySlots = [];
                foreach ($timeSlots as $timeSlot) {
                    // Check if any appointment exists at this slot
                    $appointmentAtSlot = $appointments->filter(function ($apt) use ($day, $timeSlot) {
                        return $apt['appointment_date'] === $day['date'] &&
                            $apt['scheduled_time'] === $timeSlot;
                    })->first();

                    $daySlots[] = [
                        'time' => $timeSlot,
                        'appointment' => $appointmentAtSlot,
                        'is_available' => $appointmentAtSlot === null
                    ];
                }

                $calendarGrid[] = [
                    'date' => $day['date'],
                    'day_name' => $day['day_name'],
                    'formatted_date' => $day['formatted_date'],
                    'full_date' => $day['full_date'],
                    'time_slots' => $daySlots,
                    'appointment_count' => $appointments->filter(fn($apt) => $apt['appointment_date'] === $day['date'])->count()
                ];
            }

            return response()->json([
                'doctor' => [
                    'id' => $doctor->id,
                    'name' => $doctor->name,
                    'specialization' => $doctor->specialization,
                    'license_number' => $doctor->license_number
                ],
                'week_start' => $weekStart->format('Y-m-d'),
                'week_end' => $weekStart->copy()->addDays(5)->format('Y-m-d'),
                'time_slots' => $timeSlots,
                'calendar_grid' => $calendarGrid,
                'appointments' => $appointments,
                'total_appointments' => $appointments->count(),
                'total_available_slots' => count(array_filter(
                    array_merge(...array_map(fn($day) => $day['time_slots'], $calendarGrid)),
                    fn($slot) => $slot['is_available']
                ))
            ]);

        } catch (\Exception $e) {
            \Log::error('Weekly calendar error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to fetch weekly calendar: ' . $e->getMessage()
            ], 500);
        }
    }

    private function getDefaultTimeSlots()
    {
        $slots = [];
        $start = 9 * 60;   // 09:00 AM
        $end = 17 * 60;    // 05:00 PM
        $interval = 30;    // 30-minute slots

        for ($time = $start; $time <= $end; $time += $interval) {
            $slots[] = sprintf('%02d:%02d', intval($time / 60), $time % 60);
        }

        return $slots;
    }

    public function reassign(Request $request, Appointment $appointment)
    {
        DB::beginTransaction();

        try {
            $user = Auth::user();

            if (!$user->isAdmin() && !$user->isStaff()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            if (!$appointment->canBeModified()) {
                return response()->json([
                    'message' => 'Cannot reassign appointment with current status'
                ], 422);
            }

            $request->validate([
                'doctor_id' => 'required|exists:users,id',
                'appointment_date' => 'required|date|after_or_equal:today',
                'scheduled_time' => 'required|date_format:H:i',
            ]);

            $newDoctorId = $request->doctor_id;
            $newDate = Carbon::parse($request->appointment_date)->toDateString();
            $newTime = $this->normalizeTime($request->scheduled_time);

            // Check if new doctor has approved leave
            $hasLeave = \App\Models\DoctorLeave::approved()
                ->where('doctor_id', $newDoctorId)
                ->where('start_date', '<=', $newDate)
                ->where('end_date', '>=', $newDate)
                ->exists();

            if ($hasLeave) {
                return response()->json([
                    'message' => 'The selected doctor is on leave on this date.'
                ], 422);
            }

            // Conflict check
            $conflict = Appointment::where('id', '!=', $appointment->id)
                ->where('doctor_id', $newDoctorId)
                ->whereDate('appointment_date', $newDate)
                ->where('scheduled_time', $newTime)
                ->whereIn('status', ['scheduled', 'confirmed', 'arrived', 'in_consultation'])
                ->exists();

            if ($conflict) {
                return response()->json([
                    'message' => 'The selected doctor already has an appointment at this time.'
                ], 422);
            }

            $oldDoctor = $appointment->doctor->name;
            $oldDate = $appointment->appointment_date->toDateString();

            $appointment->update([
                'doctor_id' => $newDoctorId,
                'appointment_date' => $newDate,
                'scheduled_time' => $newTime,
                'updated_by' => $user->id
            ]);

            $appointment->load(['patient.user', 'doctor']);

            AuditLog::log(
                $user->id,
                'APPOINTMENT_REASSIGN',
                "Appointment #{$appointment->id} reassigned from Dr. {$oldDoctor} ({$oldDate}) to Dr. {$appointment->doctor->name} ({$newDate})"
            );

            DB::commit();

            return response()->json([
                'message' => 'Appointment reassigned successfully',
                'appointment' => $appointment
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to reassign appointment: ' . $e->getMessage()
            ], 500);
        }
    }
}