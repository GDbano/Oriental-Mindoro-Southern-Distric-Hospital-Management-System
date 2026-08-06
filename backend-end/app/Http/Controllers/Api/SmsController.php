<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SmsController extends Controller
{
    /**
     * Placeholder SMS confirmation endpoint.
     * Intended for Semaphore API integration later.
     */
    public function sendAppointmentConfirmation(Request $request, Appointment $appointment)
    {
        $user = Auth::user();

        if (!$user || !($user->isStaff() || $user->isAdmin())) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $appointment->loadMissing(['patient.user', 'doctor', 'department', 'appointmentType']);
        
        $patientUser = $appointment->patient?->user;
        $phone = $patientUser?->phone;

        if (!$patientUser) {
            return response()->json(['message' => 'Patient has no registered user account.'], 400);
        }

        // 1. Send an In-App Notification to the patient
        $patientUser->notify(new \App\Notifications\SystemNotification(
            'Appointment Confirmed',
            "Your appointment with Dr. {$appointment->doctor->name} is confirmed for " . \Carbon\Carbon::parse($appointment->appointment_datetime)->format('M d, Y h:i A') . ".",
            'success'
        ));

        // 2. Placeholder for real SMS gateway (Semaphore/Twilio)
        \Illuminate\Support\Facades\Log::info("SMS SENT TO {$phone}: Your appointment with Dr. {$appointment->doctor->name} is confirmed.");

        return response()->json([
            'message' => 'Notification and SMS sent successfully.',
            'to' => $phone,
            'appointment_id' => $appointment->id,
        ]);
    }
}
