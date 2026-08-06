<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\User;
use App\Models\MedicalRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AppointmentController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = Appointment::with(['patient.user', 'doctor']);

        if ($user->role === 'patient') {
            $query->where('patient_id', $user->patient->id);
        } elseif ($user->role === 'doctor') {
            $query->where('doctor_id', $user->id);
        }
        // Admin can see all appointments

        // Apply filters
        if ($request->has('status') && $request->status != '') {
            $query->where('status', $request->status);
        }

        if ($request->has('date') && $request->date != '') {
            $query->whereDate('appointment_date', $request->date);
        }

        if ($request->has('doctor_id') && $request->doctor_id != '' && $user->role !== 'doctor') {
            $query->where('doctor_id', $request->doctor_id);
        }

        $appointments = $query->orderBy('appointment_date', 'desc')->paginate(10);

        $data = [
            'appointments' => $appointments,
            'doctors' => User::where('role', 'doctor')->get(),
        ];

        return view('appointments.index', $data);
    }

    public function create()
    {
        $user = Auth::user();

        if ($user->role !== 'patient') {
            return redirect('/appointments')->with('error', 'Only patients can book appointments.');
        }

        $doctors = User::where('role', 'doctor')->get();

        return view('appointments.create', compact('doctors'));
    }

    public function store(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'patient') {
            return redirect('/appointments')->with('error', 'Only patients can book appointments.');
        }

        $request->validate([
            'doctor_id' => 'required|exists:users,id',
            'appointment_date' => 'required|date|after:now',
            'reason' => 'required|string|max:500',
            'symptoms' => 'nullable|string|max:1000',
        ]);

        $appointment = Appointment::create([
            'patient_id' => $user->patient->id,
            'doctor_id' => $request->doctor_id,
            'appointment_date' => $request->appointment_date,
            'reason' => $request->reason,
            'symptoms' => $request->symptoms,
            'status' => 'scheduled',
        ]);

        return redirect('/appointments')->with('success', 'Appointment booked successfully!');
    }

    public function show(Appointment $appointment)
    {
        $user = Auth::user();

        // Authorization check
        if ($user->role === 'patient' && $appointment->patient_id !== $user->patient->id) {
            return redirect('/appointments')->with('error', 'Unauthorized access.');
        }

        if ($user->role === 'doctor' && $appointment->doctor_id !== $user->id) {
            return redirect('/appointments')->with('error', 'Unauthorized access.');
        }

        $appointment->load(['patient.user', 'doctor', 'medicalRecord']);

        return view('appointments.show', compact('appointment'));
    }

    public function update(Request $request, Appointment $appointment)
    {
        $user = Auth::user();

        // Patients can only cancel their own appointments
        if ($user->role === 'patient') {
            if ($appointment->patient_id !== $user->patient->id) {
                return redirect('/appointments')->with('error', 'Unauthorized access.');
            }

            $request->validate([
                'status' => 'required|in:cancelled',
            ]);

            $appointment->update(['status' => 'cancelled']);

            return redirect('/appointments')->with('success', 'Appointment cancelled successfully.');
        }

        // Doctors and admins can update status
        $request->validate([
            'status' => 'required|in:confirmed,in_progress,completed,cancelled',
            'notes' => 'nullable|string',
        ]);

        $appointment->update($request->only(['status', 'notes']));

        return redirect('/appointments')->with('success', 'Appointment updated successfully.');
    }

    public function todayAppointments()
    {
        $user = Auth::user();

        if ($user->role !== 'doctor') {
            return redirect('/dashboard')->with('error', 'Access denied.');
        }

        $appointments = Appointment::with(['patient.user'])
            ->where('doctor_id', $user->id)
            ->whereDate('appointment_date', today())
            ->orderBy('appointment_date')
            ->get();

        return view('appointments.today', compact('appointments'));
    }

    public function showConsultation(Appointment $appointment)
    {
        $user = Auth::user();

        if ($user->role !== 'doctor' || $appointment->doctor_id !== $user->id) {
            return redirect('/appointments')->with('error', 'Unauthorized access.');
        }

        $appointment->load(['patient.user', 'medicalRecord']);

        return view('appointments.consultation', compact('appointment'));
    }

    public function medicalRecords()
    {
        $user = Auth::user();

        if ($user->role !== 'patient') {
            return redirect('/dashboard')->with('error', 'Access denied.');
        }

        $medicalRecords = MedicalRecord::whereHas('appointment', function($query) use ($user) {
            $query->where('patient_id', $user->patient->id);
        })
        ->with(['appointment.doctor'])
        ->orderBy('created_at', 'desc')
        ->get();

        return view('medical-records.index', compact('medicalRecords'));
    }
}