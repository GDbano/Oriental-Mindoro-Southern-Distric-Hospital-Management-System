@extends('layouts.app')

@section('title', 'Patient Dashboard')

@section('content')
<div class="dashboard-header">
    <div class="row align-items-center">
        <div class="col-md-8">
            <h1 class="h3 mb-0">Welcome back, {{ auth()->user()->name }}!</h1>
            <p class="mb-0">Here's your health overview</p>
        </div>
        <div class="col-md-4 text-end">
            <a href="/appointments/create" class="btn btn-light btn-lg">
                <i class="fas fa-plus me-2"></i>Book Appointment
            </a>
        </div>
    </div>
</div>

<!-- Stats Cards -->
<div class="row mb-4">
    <div class="col-xl-3 col-md-6 mb-4">
        <div class="card stat-card border-start border-primary border-4">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col">
                        <div class="text-xs fw-bold text-primary text-uppercase mb-1">
                            Upcoming Appointments
                        </div>
                        <div class="h5 mb-0 fw-bold text-gray-800">{{ $stats['upcoming_appointments'] ?? 0 }}</div>
                    </div>
                    <div class="col-auto">
                        <i class="fas fa-calendar-check fa-2x text-primary"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="col-xl-3 col-md-6 mb-4">
        <div class="card stat-card border-start border-success border-4">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col">
                        <div class="text-xs fw-bold text-success text-uppercase mb-1">
                            Total Appointments
                        </div>
                        <div class="h5 mb-0 fw-bold text-gray-800">{{ $stats['total_appointments'] ?? 0 }}</div>
                    </div>
                    <div class="col-auto">
                        <i class="fas fa-calendar-alt fa-2x text-success"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="col-xl-3 col-md-6 mb-4">
        <div class="card stat-card border-start border-info border-4">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col">
                        <div class="text-xs fw-bold text-info text-uppercase mb-1">
                            Completed Visits
                        </div>
                        <div class="h5 mb-0 fw-bold text-gray-800">{{ $stats['completed_appointments'] ?? 0 }}</div>
                    </div>
                    <div class="col-auto">
                        <i class="fas fa-check-circle fa-2x text-info"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="col-xl-3 col-md-6 mb-4">
        <div class="card stat-card border-start border-warning border-4">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col">
                        <div class="text-xs fw-bold text-warning text-uppercase mb-1">
                            Medical Records
                        </div>
                        <div class="h5 mb-0 fw-bold text-gray-800">{{ $stats['medical_records'] ?? 0 }}</div>
                    </div>
                    <div class="col-auto">
                        <i class="fas fa-file-medical fa-2x text-warning"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="row">
    <!-- Upcoming Appointments -->
    <div class="col-lg-8 mb-4">
        <div class="card shadow">
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0"><i class="fas fa-clock me-2"></i>Upcoming Appointments</h5>
            </div>
            <div class="card-body">
                @if($recentAppointments->count() > 0)
                    @foreach($recentAppointments as $appointment)
                        <div class="card appointment-card status-{{ $appointment->status }} mb-3">
                            <div class="card-body">
                                <div class="row align-items-center">
                                    <div class="col-md-3">
                                        <strong>{{ $appointment->appointment_date->format('M d, Y h:i A') }}</strong>
                                    </div>
                                    <div class="col-md-3">
                                        <i class="fas fa-user-md me-2"></i>Dr. {{ $appointment->doctor->name }}
                                    </div>
                                    <div class="col-md-3">
                                        <span class="badge bg-{{ $appointment->status == 'scheduled' ? 'warning' : ($appointment->status == 'confirmed' ? 'primary' : ($appointment->status == 'completed' ? 'success' : 'danger')) }}">
                                            {{ ucfirst($appointment->status) }}
                                        </span>
                                    </div>
                                    <div class="col-md-3 text-end">
                                        <a href="/appointments/{{ $appointment->id }}" class="btn btn-sm btn-outline-primary">
                                            View Details
                                        </a>
                                    </div>
                                </div>
                                <div class="mt-2">
                                    <small class="text-muted">
                                        <i class="fas fa-stethoscope me-1"></i>Reason: {{ $appointment->reason }}
                                    </small>
                                </div>
                            </div>
                        </div>
                    @endforeach
                @else
                    <div class="text-center py-4">
                        <i class="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                        <p class="text-muted">No upcoming appointments</p>
                        <a href="/appointments/create" class="btn btn-primary">Book Your First Appointment</a>
                    </div>
                @endif
            </div>
        </div>
    </div>

    <!-- Quick Actions -->
    <div class="col-lg-4 mb-4">
        <div class="card shadow">
            <div class="card-header bg-success text-white">
                <h5 class="mb-0"><i class="fas fa-bolt me-2"></i>Quick Actions</h5>
            </div>
            <div class="card-body">
                <div class="d-grid gap-2">
                    <a href="/appointments/create" class="btn btn-primary btn-lg">
                        <i class="fas fa-plus me-2"></i>Book Appointment
                    </a>
                    <a href="/medical-records" class="btn btn-info btn-lg">
                        <i class="fas fa-file-medical me-2"></i>View Medical Records
                    </a>
                    <a href="/profile" class="btn btn-warning btn-lg">
                        <i class="fas fa-user-edit me-2"></i>Update Profile
                    </a>
                </div>
            </div>
        </div>

        <!-- Health Tips -->
        <div class="card shadow mt-4">
            <div class="card-header bg-info text-white">
                <h5 class="mb-0"><i class="fas fa-heartbeat me-2"></i>Health Tips</h5>
            </div>
            <div class="card-body">
                <div class="alert alert-success">
                    <small><i class="fas fa-lightbulb me-2"></i>Stay hydrated and drink plenty of water</small>
                </div>
                <div class="alert alert-info">
                    <small><i class="fas fa-lightbulb me-2"></i>Remember to take your prescribed medications</small>
                </div>
                <div class="alert alert-warning">
                    <small><i class="fas fa-lightbulb me-2"></i>Schedule regular check-ups for preventive care</small>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection