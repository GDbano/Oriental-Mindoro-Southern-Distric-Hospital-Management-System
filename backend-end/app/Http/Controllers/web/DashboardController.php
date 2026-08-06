<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\User;
use App\Models\Patient;
use App\Models\MedicalRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $data = [];

        // Common data for all roles
        $data['recentActivity'] = $this->getRecentActivity($user);

        if ($user->role === 'patient') {
            return $this->patientDashboard($user, $data);
        }

        if ($user->role === 'doctor') {
            return $this->doctorDashboard($user, $data);
        }

        if ($user->role === 'admin') {
            return $this->adminDashboard($user, $data);
        }

        return redirect('/login');
    }

    private function patientDashboard($user, $data)
    {
        $data['stats'] = [
            'upcoming_appointments' => Appointment::where('patient_id', $user->patient->id)
                ->whereIn('status', ['scheduled', 'confirmed'])
                ->count(),
            'total_appointments' => Appointment::where('patient_id', $user->patient->id)->count(),
            'completed_appointments' => Appointment::where('patient_id', $user->patient->id)
                ->where('status', 'completed')
                ->count(),
            'medical_records' => MedicalRecord::whereHas('appointment', function($query) use ($user) {
                $query->where('patient_id', $user->patient->id);
            })->count(),
        ];

        $data['recentAppointments'] = Appointment::with(['doctor'])
            ->where('patient_id', $user->patient->id)
            ->whereIn('status', ['scheduled', 'confirmed'])
            ->orderBy('appointment_date')
            ->limit(5)
            ->get();

        return view('dashboard.patient', $data);
    }

    private function doctorDashboard($user, $data)
    {
        $data['stats'] = [
            'today_appointments' => Appointment::where('doctor_id', $user->id)
                ->whereDate('appointment_date', today())
                ->count(),
            'upcoming_appointments' => Appointment::where('doctor_id', $user->id)
                ->whereIn('status', ['scheduled', 'confirmed'])
                ->count(),
            'completed_appointments' => Appointment::where('doctor_id', $user->id)
                ->where('status', 'completed')
                ->count(),
            'total_patients' => Patient::count(),
        ];

        $data['todayAppointments'] = Appointment::with(['patient.user'])
            ->where('doctor_id', $user->id)
            ->whereDate('appointment_date', today())
            ->orderBy('appointment_date')
            ->get();

        return view('dashboard.doctor', $data);
    }

    private function adminDashboard($user, $data)
    {
        $data['stats'] = [
            'total_patients' => Patient::count(),
            'total_doctors' => User::where('role', 'doctor')->count(),
            'total_staff' => User::where('role', 'staff')->count(),
            'today_appointments' => Appointment::whereDate('appointment_date', today())->count(),
            'pending_appointments' => Appointment::where('status', 'scheduled')->count(),
            'low_stock_items' => 0, // You can implement inventory later
        ];

        return view('dashboard.admin', $data);
    }

    private function getRecentActivity($user)
    {
        $query = Appointment::with(['patient.user', 'doctor']);

        if ($user->role === 'patient') {
            $query->where('patient_id', $user->patient->id);
        } elseif ($user->role === 'doctor') {
            $query->where('doctor_id', $user->id);
        }
        // Admin can see all activities

        return $query->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();
    }
}