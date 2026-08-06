<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\User;
use App\Models\Patient;
use App\Models\Inventory;
use App\Models\MedicalRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function stats()
    {
        try {
            $user = Auth::user();
            \Log::info('Dashboard stats request', ['user_id' => $user->id, 'user_role' => $user->role]);
            $stats = [];

            if ($user->isAdmin()) {
                try {
                    \Log::info('Fetching admin stats');
                    $stats = [
                        'total_patients' => Patient::count(),
                        'total_doctors' => User::where('role', 'doctor')->count(),
                        'total_staff' => User::where('role', 'staff')->count(),
                        'today_appointments' => Appointment::today()->count(),
                        'pending_appointments' => Appointment::where('status', 'scheduled')->count(),
                        'completed_appointments' => Appointment::where('status', 'completed')->count(),
                        'low_stock_items' => Inventory::lowStock()->count(),
                        'expired_items' => Inventory::expired()->count(),
                    ];
                    \Log::info('Admin stats fetched successfully', $stats);
                } catch (\Exception $e) {
                    \Log::error('Error fetching admin stats: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
                    throw $e;
                }
            } elseif ($user->isDoctor()) {
                $doctorId = $user->id;
                $stats = [
                    'today_appointments' => Appointment::where('doctor_id', $doctorId)->today()->count(),
                    'upcoming_appointments' => Appointment::where('doctor_id', $doctorId)->upcoming()->count(),
                    'completed_appointments' => Appointment::where('doctor_id', $doctorId)->completed()->count(),
                    'total_patients' => Patient::whereHas('appointments', function ($query) use ($doctorId) {
                        $query->where('doctor_id', $doctorId);
                    })->distinct()->count(),
                ];
            } elseif ($user->isPatient()) {
                $patientId = $user->patient->id;
                $stats = [
                    'upcoming_appointments' => Appointment::where('patient_id', $patientId)->upcoming()->count(),
                    'total_appointments' => Appointment::where('patient_id', $patientId)->count(),
                    'completed_appointments' => Appointment::where('patient_id', $patientId)->completed()->count(),
                    'medical_records' => MedicalRecord::whereHas('appointment', function ($query) use ($patientId) {
                        $query->where('patient_id', $patientId);
                    })->count(),
                ];
            } elseif ($user->isStaff()) {
                $todayAppointments = Appointment::whereDate('appointment_date', today());

                $appointmentsTodayCount = (clone $todayAppointments)->count();
                $waitingInQueueCount = (clone $todayAppointments)
                    ->whereIn('status', ['scheduled', 'confirmed', 'arrived'])
                    ->count();
                $noShowTodayCount = (clone $todayAppointments)
                    ->where('status', 'no_show')
                    ->count();

                $stats = [
                    // Receptionist "today only" summary
                    'patients_registered_today' => Patient::whereDate('created_at', today())->count(),
                    'appointments_today' => $appointmentsTodayCount,
                    'waiting_in_queue' => $waitingInQueueCount,
                    'no_show_today' => $noShowTodayCount,

                    // Keep existing keys used elsewhere
                    'today_appointments' => $appointmentsTodayCount,
                    'pending_appointments' => Appointment::where('status', 'scheduled')->count(),
                    'total_patients' => Patient::count(),
                    'low_stock_items' => Inventory::lowStock()->count(),
                ];
            }

            return response()->json($stats);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch dashboard stats: ' . $e->getMessage()
            ], 500);
        }
    }

    public function recentActivity()
    {
        try {
            $user = Auth::user();
            $query = Appointment::with(['patient.user', 'doctor']);

            if ($user->isDoctor()) {
                $query->where('doctor_id', $user->id);
            } elseif ($user->isPatient()) {
                $query->where('patient_id', $user->patient->id);
            }

            $activities = $query->orderBy('created_at', 'desc')
                ->limit(10)
                ->get();

            return response()->json($activities);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch recent activity: ' . $e->getMessage()
            ], 500);
        }
    }

    public function doctorTodayAppointments()
    {
        try {
            $user = Auth::user();

            if (!$user->isDoctor()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $appointments = Appointment::with(['patient.user', 'department'])
                ->where('doctor_id', $user->id)
                ->whereDate('appointment_date', today())
                ->whereIn('status', ['scheduled', 'confirmed', 'arrived', 'in_consultation', 'completed'])
                ->orderByRaw('COALESCE(queue_position, 999999)')
                ->orderBy('queue_number')
                ->orderBy('scheduled_time')
                ->orderBy('id')
                ->get();

            return response()->json($appointments);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch today\'s appointments: ' . $e->getMessage()
            ], 500);
        }
    }

    public function monthlyAppointments()
    {
        try {
            $user = Auth::user();
            $data = [];

            if ($user->isAdmin() || $user->isStaff()) {
                $data = Appointment::select(
                    DB::raw('MONTH(appointment_date) as month'),
                    DB::raw('YEAR(appointment_date) as year'),
                    DB::raw('COUNT(*) as count')
                )
                    ->whereYear('appointment_date', date('Y'))
                    ->groupBy('year', 'month')
                    ->orderBy('year', 'desc')
                    ->orderBy('month', 'desc')
                    ->get();
            } elseif ($user->isDoctor()) {
                $data = Appointment::select(
                    DB::raw('MONTH(appointment_date) as month'),
                    DB::raw('YEAR(appointment_date) as year'),
                    DB::raw('COUNT(*) as count')
                )
                    ->where('doctor_id', $user->id)
                    ->whereYear('appointment_date', date('Y'))
                    ->groupBy('year', 'month')
                    ->orderBy('year', 'desc')
                    ->orderBy('month', 'desc')
                    ->get();
            }

            return response()->json($data);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch monthly appointments: ' . $e->getMessage()
            ], 500);
        }
    }
}