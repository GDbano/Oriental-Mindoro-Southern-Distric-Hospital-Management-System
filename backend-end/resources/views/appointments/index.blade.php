@extends('layouts.app')

@section('title', 'Appointments')

@section('content')
<div class="d-flex justify-content-between align-items-center mb-4">
    <h2>
        <i class="fas fa-calendar-alt me-2"></i>Appointments
        @if(auth()->user()->role === 'patient')
            - My Appointments
        @endif
    </h2>
    @if(auth()->user()->role === 'patient')
        <a href="/appointments/create" class="btn btn-primary">
            <i class="fas fa-plus me-2"></i>Book New Appointment
        </a>
    @endif
</div>

<!-- Filters -->
<div class="card mb-4">
    <div class="card-body">
        <form action="/appointments" method="GET" class="row g-3">
            <div class="col-md-3">
                <label for="status" class="form-label">Status</label>
                <select name="status" id="status" class="form-select">
                    <option value="">All Status</option>
                    <option value="scheduled" {{ request('status') == 'scheduled' ? 'selected' : '' }}>Scheduled</option>
                    <option value="confirmed" {{ request('status') == 'confirmed' ? 'selected' : '' }}>Confirmed</option>
                    <option value="in_progress" {{ request('status') == 'in_progress' ? 'selected' : '' }}>In Progress</option>
                    <option value="completed" {{ request('status') == 'completed' ? 'selected' : '' }}>Completed</option>
                    <option value="cancelled" {{ request('status') == 'cancelled' ? 'selected' : '' }}>Cancelled</option>
                </select>
            </div>
            <div class="col-md-3">
                <label for="date" class="form-label">Date</label>
                <input type="date" name="date" id="date" class="form-control" value="{{ request('date') }}">
            </div>
            <div class="col-md-3">
                <label for="doctor" class="form-label">Doctor</label>
                <select name="doctor_id" id="doctor" class="form-select">
                    <option value="">All Doctors</option>
                    @foreach($doctors as $doctor)
                        <option value="{{ $doctor->id }}" {{ request('doctor_id') == $doctor->id ? 'selected' : '' }}>
                            Dr. {{ $doctor->name }}
                        </option>
                    @endforeach
                </select>
            </div>
            <div class="col-md-3 d-flex align-items-end">
                <button type="submit" class="btn btn-outline-primary me-2">
                    <i class="fas fa-filter me-2"></i>Filter
                </button>
                <a href="/appointments" class="btn btn-outline-secondary">
                    <i class="fas fa-redo me-2"></i>Reset
                </a>
            </div>
        </form>
    </div>
</div>

<!-- Appointments List -->
<div class="card">
    <div class="card-body">
        @if($appointments->count() > 0)
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            @if(in_array(auth()->user()->role, ['doctor', 'admin']))
                                <th>Patient</th>
                            @endif
                            @if(auth()->user()->role === 'patient')
                                <th>Doctor</th>
                            @endif
                            <th>Date & Time</th>
                            <th>Reason</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($appointments as $appointment)
                            <tr>
                                @if(in_array(auth()->user()->role, ['doctor', 'admin']))
                                    <td>
                                        <strong>{{ $appointment->patient->user->name }}</strong>
                                        <br>
                                        <small class="text-muted">{{ $appointment->patient->user->phone }}</small>
                                    </td>
                                @endif
                                @if(auth()->user()->role === 'patient')
                                    <td>
                                        <strong>Dr. {{ $appointment->doctor->name }}</strong>
                                        <br>
                                        <small class="text-muted">{{ $appointment->doctor->specialization }}</small>
                                    </td>
                                @endif
                                <td>
                                    {{ $appointment->appointment_date->format('M d, Y h:i A') }}
                                    <br>
                                    <small class="text-muted">{{ $appointment->appointment_date->diffForHumans() }}</small>
                                </td>
                                <td>{{ Str::limit($appointment->reason, 50) }}</td>
                                <td>
                                    <span class="badge bg-{{ $appointment->status == 'scheduled' ? 'warning' : ($appointment->status == 'confirmed' ? 'primary' : ($appointment->status == 'in_progress' ? 'info' : ($appointment->status == 'completed' ? 'success' : 'danger'))) }}">
                                        {{ ucfirst($appointment->status) }}
                                    </span>
                                </td>
                                <td>
                                    <div class="btn-group">
                                        <a href="/appointments/{{ $appointment->id }}" class="btn btn-sm btn-outline-primary">
                                            <i class="fas fa-eye"></i>
                                        </a>
                                        @if(auth()->user()->role === 'patient' && $appointment->status === 'scheduled')
                                            <form action="/appointments/{{ $appointment->id }}" method="POST" class="d-inline">
                                                @csrf
                                                @method('PUT')
                                                <input type="hidden" name="status" value="cancelled">
                                                <button type="submit" class="btn btn-sm btn-outline-danger" onclick="return confirm('Are you sure you want to cancel this appointment?')">
                                                    <i class="fas fa-times"></i>
                                                </button>
                                            </form>
                                        @endif
                                        @if(auth()->user()->role === 'doctor' && in_array($appointment->status, ['scheduled', 'confirmed']))
                                            <a href="/appointments/{{ $appointment->id }}/consult" class="btn btn-sm btn-success">
                                                <i class="fas fa-stethoscope"></i>
                                            </a>
                                        @endif
                                    </div>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div class="d-flex justify-content-center mt-4">
                {{ $appointments->links() }}
            </div>
        @else
            <div class="text-center py-5">
                <i class="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">No appointments found</h5>
                @if(auth()->user()->role === 'patient')
                    <a href="/appointments/create" class="btn btn-primary mt-2">Book Your First Appointment</a>
                @endif
            </div>
        @endif
    </div>
</div>
@endsection