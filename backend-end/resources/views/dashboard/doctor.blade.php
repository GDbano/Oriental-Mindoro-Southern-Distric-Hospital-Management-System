@extends('layouts.app')

@section('title', 'Doctor Dashboard')

@section('content')
<div class="dashboard-header">
    <div class="row align-items-center">
        <div class="col-md-8">
            <h1 class="h3 mb-0">Welcome, Dr. {{ auth()->user()->name }}!</h1>
            <p class="mb-0">Today's schedule and patient queue</p>
        </div>
        <div class="col-md-4 text-end">
            <a href="/today-appointments" class="btn btn-light btn-lg">
                <i class="fas fa-list me-2"></i>View Today's Queue
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
                            Today's Appointments
                        </div>
                        <div class="h5 mb-0 fw-bold text-gray-800">{{ $stats['today_appointments'] ?? 0 }}</div>
                    </div>
                    <div class="col-auto">
                        <i class="fas fa-calendar-day fa-2x text-primary"></i>
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
                            Upcoming Appointments
                        </div>
                        <div class="h5 mb-0 fw-bold text-gray-800">{{ $stats['upcoming_appointments'] ?? 0 }}</div>
                    </div>
                    <div class="col-auto">
                        <i class="fas fa-clock fa-2x text-warning"></i>
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
                            Completed This Month
                        </div>
                        <div class="h5 mb-0 fw-bold text-gray-800">{{ $stats['completed_appointments'] ?? 0 }}</div>
                    </div>
                    <div class="col-auto">
                        <i class="fas fa-check-circle fa-2x text-success"></i>
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
                            Total Patients
                        </div>
                        <div class="h5 mb-0 fw-bold text-gray-800">{{ $stats['total_patients'] ?? 0 }}</div>
                    </div>
                    <div class="col-auto">
                        <i class="fas fa-users fa-2x text-info"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="row">
    <!-- Today's Appointments -->
    <div class="col-lg-8 mb-4">
        <div class="card shadow">
            <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <h5 class="mb-0"><i class="fas fa-list me-2"></i>Today's Appointments</h5>
                <span class="badge bg-light text-primary">{{ $todayAppointments->count() }} Patients</span>
            </div>
            <div class="card-body">
                @if($todayAppointments->count() > 0)
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Patient</th>
                                    <th>Reason</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach($todayAppointments as $appointment)
                                    <tr>
                                        <td>{{ $appointment->appointment_date->format('h:i A') }}</td>
                                        <td>
                                            <strong>{{ $appointment->patient->user->name }}</strong>
                                            <br><small class="text-muted">Age: {{ $appointment->patient->age ?? 'N/A' }}</small>
                                        </td>
                                        <td>{{ Str::limit($appointment->reason, 50) }}</td>
                                        <td>
                                            <span class="badge bg-{{ $appointment->status == 'scheduled' ? 'warning' : ($appointment->status == 'confirmed' ? 'primary' : ($appointment->status == 'in_progress' ? 'info' : 'success')) }}">
                                                {{ ucfirst($appointment->status) }}
                                            </span>
                                        </td>
                                        <td>
                                            <div class="btn-group">
                                                <a href="/appointments/{{ $appointment->id }}" class="btn btn-sm btn-outline-primary">
                                                    <i class="fas fa-eye"></i>
                                                </a>
                                                <a href="/appointments/{{ $appointment->id }}/consult" class="btn btn-sm btn-success">
                                                    <i class="fas fa-stethoscope"></i>
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                @else
                    <div class="text-center py-4">
                        <i class="fas fa-calendar-check fa-3x text-muted mb-3"></i>
                        <p class="text-muted">No appointments scheduled for today</p>
                    </div>
                @endif
            </div>
        </div>
    </div>

    <!-- Quick Actions & Recent Activity -->
    <div class="col-lg-4 mb-4">
        <!-- Quick Actions -->
        <div class="card shadow">
            <div class="card-header bg-success text-white">
                <h5 class="mb-0"><i class="fas fa-bolt me-2"></i>Quick Actions</h5>
            </div>
            <div class="card-body">
                <div class="d-grid gap-2">
                    <a href="/today-appointments" class="btn btn-primary btn-lg">
                        <i class="fas fa-list me-2"></i>View Today's Queue
                    </a>
                    <a href="/patients" class="btn btn-info btn-lg">
                        <i class="fas fa-users me-2"></i>All Patients
                    </a>
                    <a href="/appointments" class="btn btn-warning btn-lg">
                        <i class="fas fa-calendar-alt me-2"></i>All Appointments
                    </a>
                </div>
            </div>
        </div>

        <!-- Recent Activity -->
        <div class="card shadow mt-4">
            <div class="card-header bg-info text-white">
                <h5 class="mb-0"><i class="fas fa-history me-2"></i>Recent Activity</h5>
            </div>
            <div class="card-body">
                @if($recentActivity->count() > 0)
                    @foreach($recentActivity as $activity)
                        <div class="d-flex mb-3">
                            <div class="flex-shrink-0">
                                <i class="fas fa-user-circle text-primary fa-lg"></i>
                            </div>
                            <div class="flex-grow-1 ms-3">
                                <h6 class="mb-0">{{ $activity->patient->user->name }}</h6>
                                <small class="text-muted">
                                    {{ $activity->appointment_date->format('M d, h:i A') }} - 
                                    <span class="badge bg-secondary">{{ $activity->status }}</span>
                                </small>
                            </div>
                        </div>
                    @endforeach
                @else
                    <p class="text-muted text-center">No recent activity</p>
                @endif
            </div>
        </div>
    </div>
</div>
@endsection