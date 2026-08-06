@extends('layouts.app')

@section('title', 'Login')

@section('content')
<div class="row justify-content-center">
    <div class="col-md-6">
        <div class="card shadow">
            <div class="card-header bg-primary text-white">
                <h4 class="mb-0"><i class="fas fa-sign-in-alt me-2"></i>Login to OMSDH</h4>
            </div>
            <div class="card-body p-4">
                @if($errors->any())
                    <div class="alert alert-danger">
                        @foreach($errors->all() as $error)
                            <p class="mb-0">{{ $error }}</p>
                        @endforeach
                    </div>
                @endif

                <form action="/login" method="POST">
                    @csrf
                    <div class="mb-3">
                        <label for="email" class="form-label">Email Address</label>
                        <div class="input-group">
                            <span class="input-group-text"><i class="fas fa-envelope"></i></span>
                            <input type="email" class="form-control" id="email" name="email" value="{{ old('email') }}" required>
                        </div>
                    </div>

                    <div class="mb-3">
                        <label for="password" class="form-label">Password</label>
                        <div class="input-group">
                            <span class="input-group-text"><i class="fas fa-lock"></i></span>
                            <input type="password" class="form-control" id="password" name="password" required>
                        </div>
                    </div>

                    <div class="mb-3 form-check">
                        <input type="checkbox" class="form-check-input" id="remember" name="remember">
                        <label class="form-check-label" for="remember">Remember me</label>
                    </div>

                    <div class="d-grid">
                        <button type="submit" class="btn btn-primary btn-lg">
                            <i class="fas fa-sign-in-alt me-2"></i>Login
                        </button>
                    </div>
                </form>

                <div class="text-center mt-3">
                    <p class="mb-0">Don't have an account? 
                        <a href="/register" class="text-decoration-none">Register here</a>
                    </p>
                </div>

                <div class="row mt-4">
                    <div class="col-md-6">
                        <div class="card text-bg-info mb-3">
                            <div class="card-body text-center">
                                <i class="fas fa-user-injured fa-2x mb-2"></i>
                                <h6>Patient</h6>
                                <small>Book appointments and view medical records</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card text-bg-warning mb-3">
                            <div class="card-body text-center">
                                <i class="fas fa-user-md fa-2x mb-2"></i>
                                <h6>Doctor/Staff</h6>
                                <small>Manage appointments and patient care</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection