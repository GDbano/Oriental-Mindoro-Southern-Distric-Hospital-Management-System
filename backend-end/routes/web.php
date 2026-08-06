<?php

use App\Http\Controllers\Web\AuthController;
use App\Http\Controllers\Web\DashboardController;
use App\Http\Controllers\Web\AppointmentController;
use App\Http\Controllers\Web\UserController;
use Illuminate\Support\Facades\Route;

// Authentication Routes
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login']);
Route::get('/register', [AuthController::class, 'showRegister']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/logout', [AuthController::class, 'logout']);

// Public health check / landing route for the Render app URL
Route::get('/', function () {
    return response()->json(['message' => 'OMSDH backend is running']);
});

// Protected Routes
Route::middleware(['auth'])->group(function () {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Appointments
    Route::get('/appointments', [AppointmentController::class, 'index']);
    Route::get('/appointments/create', [AppointmentController::class, 'create']);
    Route::post('/appointments', [AppointmentController::class, 'store']);
    Route::get('/appointments/{appointment}', [AppointmentController::class, 'show']);
    Route::put('/appointments/{appointment}', [AppointmentController::class, 'update']);
    
    // Doctor specific
    Route::get('/today-appointments', [AppointmentController::class, 'todayAppointments']);
    Route::get('/appointments/{appointment}/consult', [AppointmentController::class, 'showConsultation']);

    // Users & Patients
    Route::get('/patients', [UserController::class, 'patients']);
    Route::get('/users', [UserController::class, 'index'])->middleware('admin');
    Route::get('/profile', [UserController::class, 'profile']);
    Route::put('/profile', [UserController::class, 'updateProfile']);

    // Medical Records
    Route::get('/medical-records', [AppointmentController::class, 'medicalRecords']);
});