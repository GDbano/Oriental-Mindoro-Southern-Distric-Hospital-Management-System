@extends('layouts.app')

@section('title', 'My Profile')

@section('content')
<div class="row">
    <div class="col-md-4">
        <div class="card shadow">
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0"><i class="fas fa-user me-2"></i>Profile Information</h5>
            </div>
            <div class="card-body text-center">
                <div class="mb-3">
                    <i class="fas fa-user-circle fa-5x text-primary"></i>
                </div>
                <h4>{{ $user->name }}</h4>
                <p class="text-muted">{{ ucfirst($user->role) }}</p>
                <div class="badge bg-primary">{{ $user->email }}</div>
                
                @if($user->isPatient() && $user->patient)
                    <div class="mt-3">
                        <p><strong>Age:</strong> {{ $user->patient->age ?? 'N/A' }}</p>
                        <p><strong>Gender:</strong> {{ ucfirst($user->patient->gender) ?? 'N/A' }}</p>
                        <p><strong>Blood Type:</strong> {{ $user->patient->blood_type ?? 'N/A' }}</p>
                    </div>
                @endif

                @if($user->isDoctor())
                    <div class="mt-3">
                        <p><strong>Specialization:</strong> {{ $user->specialization }}</p>
                        <p><strong>License:</strong> {{ $user->license_number }}</p>
                    </div>
                @endif
            </div>
        </div>
    </div>

    <div class="col-md-8">
        <div class="card shadow">
            <div class="card-header bg-success text-white">
                <h5 class="mb-0"><i class="fas fa-edit me-2"></i>Edit Profile</h5>
            </div>
            <div class="card-body">
                <form action="/profile" method="POST">
                    @csrf
                    @method('PUT')
                    
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="name" class="form-label">Full Name</label>
                                <input type="text" class="form-control" id="name" name="name" value="{{ old('name', $user->name) }}" required>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="email" class="form-label">Email Address</label>
                                <input type="email" class="form-control" id="email" name="email" value="{{ old('email', $user->email) }}" required>
                            </div>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="phone" class="form-label">Phone Number</label>
                                <input type="tel" class="form-control" id="phone" name="phone" value="{{ old('phone', $user->phone) }}">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="address" class="form-label">Address</label>
                                <input type="text" class="form-control" id="address" name="address" value="{{ old('address', $user->address) }}">
                            </div>
                        </div>
                    </div>

                    @if($user->isPatient() && $user->patient)
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="date_of_birth" class="form-label">Date of Birth</label>
                                    <input type="date" class="form-control" id="date_of_birth" name="date_of_birth" 
                                           value="{{ old('date_of_birth', $user->patient->date_of_birth?->format('Y-m-d')) }}">
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="gender" class="form-label">Gender</label>
                                    <select class="form-select" id="gender" name="gender">
                                        <option value="">Select Gender</option>
                                        <option value="male" {{ old('gender', $user->patient->gender) == 'male' ? 'selected' : '' }}>Male</option>
                                        <option value="female" {{ old('gender', $user->patient->gender) == 'female' ? 'selected' : '' }}>Female</option>
                                        <option value="other" {{ old('gender', $user->patient->gender) == 'other' ? 'selected' : '' }}>Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="blood_type" class="form-label">Blood Type</label>
                                    <input type="text" class="form-control" id="blood_type" name="blood_type" 
                                           value="{{ old('blood_type', $user->patient->blood_type) }}">
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="emergency_contact_name" class="form-label">Emergency Contact Name</label>
                                    <input type="text" class="form-control" id="emergency_contact_name" name="emergency_contact_name" 
                                           value="{{ old('emergency_contact_name', $user->patient->emergency_contact_name) }}">
                                </div>
                            </div>
                        </div>

                        <div class="mb-3">
                            <label for="allergies" class="form-label">Allergies</label>
                            <textarea class="form-control" id="allergies" name="allergies" rows="2">{{ old('allergies', $user->patient->allergies) }}</textarea>
                        </div>

                        <div class="mb-3">
                            <label for="medical_history" class="form-label">Medical History</label>
                            <textarea class="form-control" id="medical_history" name="medical_history" rows="3">{{ old('medical_history', $user->patient->medical_history) }}</textarea>
                        </div>
                    @endif

                    @if($user->isDoctor())
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="specialization" class="form-label">Specialization</label>
                                    <input type="text" class="form-control" id="specialization" name="specialization" 
                                           value="{{ old('specialization', $user->specialization) }}" required>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="license_number" class="form-label">License Number</label>
                                    <input type="text" class="form-control" id="license_number" name="license_number" 
                                           value="{{ old('license_number', $user->license_number) }}" required>
                                </div>
                            </div>
                        </div>
                    @endif

                    <hr>

                    <h6>Change Password</h6>
                    <div class="row">
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label for="current_password" class="form-label">Current Password</label>
                                <input type="password" class="form-control" id="current_password" name="current_password">
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label for="new_password" class="form-label">New Password</label>
                                <input type="password" class="form-control" id="new_password" name="new_password">
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label for="new_password_confirmation" class="form-label">Confirm New Password</label>
                                <input type="password" class="form-control" id="new_password_confirmation" name="new_password_confirmation">
                            </div>
                        </div>
                    </div>

                    <div class="d-grid">
                        <button type="submit" class="btn btn-success btn-lg">
                            <i class="fas fa-save me-2"></i>Update Profile
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
@endsection