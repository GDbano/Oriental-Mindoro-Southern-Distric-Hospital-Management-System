@extends('layouts.app')

@section('title', 'Admin Dashboard')

@section('content')
<div class="dashboard-header">
    <div class="row align-items-center">
        <div class="col-md-8">
            <h1 class="h3 mb-0">Admin Dashboard</h1>
            <p class="mb-0">System overview and management</p>
        </div>
        <div class="col-md-4 text-end">
            <a href="/reports" class="btn btn-light btn-lg">
                <i class="fas fa-chart-bar me-2"></i>View Reports
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
                            Total Patients
                        </div>
                        <div class="h5 mb-0 fw-bold text-gray-800">{{ $stats['total_patients'] ?? 0 }}</div>
                    </div>
                    <div class="col-auto">
                        <i class="fas fa-users fa-2x text-primary"></i>
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
                            Total Doctors
                        </div>
                        <div class="h5 mb-0 fw-bold text-gray-800">{{ $stats['total_doctors'] ?? 0 }}</div>
                    </div>
                    <div class="col-auto">
                        <i class="fas fa-user-md fa-2x text-success"></i>
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
                            Today's Appointments
                        </div>
                        <div class="h5 mb-0 fw-bold text-gray-800">{{ $stats['today_appointments'] ?? 0 }}</div>
                    </div>
                    <div class="col-auto">
                        <i class="fas fa-calendar-day fa-2x text-warning"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="col-xl-3 col-md-6 mb-4">
        <div class="card stat-card border-start border-danger border-4">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col">
                        <div class="text-xs fw-bold text-danger text-uppercase mb-1">
                            Pending Appointments
                        </div>
                        <div class="h5 mb-0 fw-bold text-gray-800">{{ $stats['pending_appointments'] ?? 0 }}</div>
                    </div>
                    <div class="col-auto">
                        <i class="fas fa-clock fa-2x text-danger"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="row">
    <!-- System Overview -->
    <div class="col-lg-8 mb-4">
        <div class="card shadow">
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0"><i class="fas fa-chart-line me-2"></i>System Overview</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <canvas id="appointmentsChart" width="400" height="200"></canvas>
                    </div>
                    <div class="col-md-6">
                        <canvas id="usersChart" width="400" height="200"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <!-- Recent Activity -->
        <div class="card shadow mt-4">
            <div class="card-header bg-info text-white">
                <h5 class="mb-0"><i class="fas fa-history me-2"></i>Recent Activity</h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Patient</th>
                                <th>Doctor</th>
                                <th>Date & Time</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($recentActivity as $activity)
                                <tr>
                                    <td>{{ $activity->patient->user->name }}</td>
                                    <td>Dr. {{ $activity->doctor->name }}</td>
                                    <td>{{ $activity->appointment_date->format('M d, Y h:i A') }}</td>
                                    <td>
                                        <span class="badge bg-{{ $activity->status == 'scheduled' ? 'warning' : ($activity->status == 'confirmed' ? 'primary' : ($activity->status == 'completed' ? 'success' : 'danger')) }}">
                                            {{ ucfirst($activity->status) }}
                                        </span>
                                    </td>
                                    <td>
                                        <a href="/appointments/{{ $activity->id }}" class="btn btn-sm btn-outline-primary">
                                            <i class="fas fa-eye"></i>
                                        </a>
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- Quick Management -->
    <div class="col-lg-4 mb-4">
        <!-- Quick Actions -->
        <div class="card shadow">
            <div class="card-header bg-success text-white">
                <h5 class="mb-0"><i class="fas fa-cogs me-2"></i>Quick Management</h5>
            </div>
            <div class="card-body">
                <div class="d-grid gap-2">
                    <a href="/users" class="btn btn-primary btn-lg">
                        <i class="fas fa-user-cog me-2"></i>Manage Users
                    </a>
                    <a href="/patients" class="btn btn-info btn-lg">
                        <i class="fas fa-users me-2"></i>View Patients
                    </a>
                    <a href="/appointments" class="btn btn-warning btn-lg">
                        <i class="fas fa-calendar-alt me-2"></i>All Appointments
                    </a>
                    <a href="/reports" class="btn btn-success btn-lg">
                        <i class="fas fa-chart-bar me-2"></i>Generate Reports
                    </a>
                </div>
            </div>
        </div>

        <!-- System Alerts -->
        <div class="card shadow mt-4">
            <div class="card-header bg-warning text-dark">
                <h5 class="mb-0"><i class="fas fa-exclamation-triangle me-2"></i>System Alerts</h5>
            </div>
            <div class="card-body">
                @if($stats['low_stock_items'] > 0)
                    <div class="alert alert-danger">
                        <i class="fas fa-box me-2"></i>
                        <strong>{{ $stats['low_stock_items'] }} items</strong> are running low on stock
                    </div>
                @endif

                @if($stats['pending_appointments'] > 10)
                    <div class="alert alert-warning">
                        <i class="fas fa-clock me-2"></i>
                        <strong>{{ $stats['pending_appointments'] }} appointments</strong> are pending confirmation
                    </div>
                @endif

                <div class="alert alert-success">
                    <i class="fas fa-check-circle me-2"></i>
                    System is running smoothly
                </div>
            </div>
        </div>
    </div>
</div>

@section('scripts')
<script>
    // Sample charts - you can replace with real data
    const appointmentsCtx = document.getElementById('appointmentsChart').getContext('2d');
    const appointmentsChart = new Chart(appointmentsCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Appointments',
                data: [12, 19, 3, 5, 2, 3],
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        }
    });

    const usersCtx = document.getElementById('usersChart').getContext('2d');
    const usersChart = new Chart(usersCtx, {
        type: 'doughnut',
        data: {
            labels: ['Patients', 'Doctors', 'Staff'],
            datasets: [{
                data: [{{ $stats['total_patients'] ?? 0 }}, {{ $stats['total_doctors'] ?? 0 }}, {{ $stats['total_staff'] ?? 0 }}],
                backgroundColor: [
                    'rgb(54, 162, 235)',
                    'rgb(75, 192, 192)',
                    'rgb(255, 205, 86)'
                ]
            }]
        }
    });
</script>
@endsection
@endsection