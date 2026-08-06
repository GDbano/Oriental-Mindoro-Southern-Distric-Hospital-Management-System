<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AuditLog;
use App\Models\LabRequest;
use App\Models\Patient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class LabRequestController extends Controller
{
    public function saveForAppointment(Request $request, Appointment $appointment)
    {
        DB::beginTransaction();

        try {
            $user = Auth::user();
            if (!$user || !$user->isDoctor() || $appointment->doctor_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $request->validate([
                'urgency' => 'required|in:routine,stat',
                'tests' => 'nullable|array',
                'tests.*' => 'array',
                'tests.*.*' => 'string|max:255',
                'specimen' => 'nullable|string|max:255',
                'others' => 'nullable|string|max:1000',
                'clinical_notes' => 'nullable|string|max:2000',
            ]);

            $payload = [
                'doctor_id' => $user->id,
                'urgency' => $request->input('urgency'),
                'tests' => $request->input('tests'),
                'specimen' => $request->input('specimen'),
                'others' => $request->input('others'),
                'clinical_notes' => $request->input('clinical_notes'),
                'status' => 'pending',
                'requested_at' => now(),
            ];

            // Update existing pending request for this appointment if present; otherwise create.
            $existing = LabRequest::where('appointment_id', $appointment->id)
                ->where('status', 'pending')
                ->latest('id')
                ->first();

            if ($existing) {
                $existing->fill($payload);
                $existing->save();
                $labRequest = $existing;
            } else {
                $labRequest = LabRequest::create([
                    'appointment_id' => $appointment->id,
                    ...$payload,
                ]);
            }

            $labRequest->load(['appointment.patient.user', 'appointment.doctor']);

            AuditLog::log($user->id, 'LAB_REQUEST_SAVE', "Lab request saved for appointment #{$appointment->id}");

            DB::commit();

            return response()->json($labRequest);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to save lab request: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function latestForAppointment(Appointment $appointment)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Patient can see their own, doctor can see their own appointment, staff/admin/records officer can see.
            if ($user->isPatient()) {
                if (!$user->patient || $appointment->patient_id !== $user->patient->id) {
                    return response()->json(['message' => 'Unauthorized'], 403);
                }
            } elseif ($user->isDoctor()) {
                if ($appointment->doctor_id !== $user->id) {
                    return response()->json(['message' => 'Unauthorized'], 403);
                }
            } elseif (!($user->isStaff() || $user->isAdmin() || $user->isRecordsOfficer())) {
                // MedTech can view via pending queue endpoints.
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $labRequest = LabRequest::where('appointment_id', $appointment->id)
                ->orderByRaw("FIELD(status, 'pending', 'completed', 'cancelled')")
                ->latest('id')
                ->with(['appointment.patient.user', 'appointment.doctor'])
                ->first();

            if (!$labRequest) {
                return response()->json(['message' => 'Lab request not found'], 404);
            }

            return response()->json($labRequest);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to fetch lab request: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function pendingQueue(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user || !($user->isMedTech() || $user->isAdmin())) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $limit = (int) $request->query('limit', 50);
            $limit = max(1, min(200, $limit));

            $items = LabRequest::query()
                ->where('status', 'pending')
                ->with(['appointment.patient.user', 'appointment.doctor'])
                ->orderByRaw("CASE WHEN urgency = 'stat' THEN 0 ELSE 1 END")
                ->orderBy('requested_at', 'asc')
                ->limit($limit)
                ->get();

            return response()->json($items);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to fetch pending lab requests: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function pendingForPatient(Patient $patient)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            if ($user->isPatient()) {
                if (!$user->patient || $user->patient->id !== $patient->id) {
                    return response()->json(['message' => 'Unauthorized'], 403);
                }
            } elseif (!($user->isDoctor() || $user->isStaff() || $user->isAdmin() || $user->isRecordsOfficer() || $user->isMedTech())) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $items = LabRequest::query()
                ->where('status', 'pending')
                ->whereHas('appointment', function ($q) use ($patient) {
                    $q->where('patient_id', $patient->id);
                })
                ->with(['appointment.doctor'])
                ->orderByRaw("CASE WHEN urgency = 'stat' THEN 0 ELSE 1 END")
                ->orderBy('requested_at', 'asc')
                ->get();

            return response()->json($items);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to fetch pending lab requests: ' . $e->getMessage(),
            ], 500);
        }
    }
}
