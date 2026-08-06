<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\MedicalRecordController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\QueueController;
use App\Http\Controllers\Api\SmsController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\BarangayController;
use App\Http\Controllers\Api\Icd10Controller;
use App\Http\Controllers\Api\MedicineController;
use App\Http\Controllers\Api\LabRequestController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\BillingController;
use Illuminate\Support\Facades\Route;

Route::get('/test', function () {
    return response()->json(['message' => 'API is working!']);
});

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);

    // Billing & Payment
    Route::get('/billing', [BillingController::class, 'index']);
    Route::get('/patients/{id}/billing', [BillingController::class, 'getPatientBills']);
    Route::post('/appointments/{id}/generate-bill', [BillingController::class, 'generateForAppointment']);
    Route::patch('/billing/{id}/pay', [BillingController::class, 'markAsPaid']);

    // Dashboard
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('/dashboard/recent-activity', [DashboardController::class, 'recentActivity']);
    Route::get('/dashboard/doctor-today-appointments', [DashboardController::class, 'doctorTodayAppointments']);
    Route::get('/dashboard/monthly-appointments', [DashboardController::class, 'monthlyAppointments']);

    // Departments
    Route::get('/departments', [DepartmentController::class, 'index']);

    // Receptionist patient registration helpers
    Route::get('/patients/next-hospital-number', [PatientController::class, 'nextHospitalNumber']);
    Route::get('/patients/duplicates', [PatientController::class, 'duplicates']);
    Route::post('/patients/staff-register', [PatientController::class, 'storeByStaff']);
    Route::put('/patients/{patient}/demographics', [PatientController::class, 'updateDemographics']);
    Route::get('/patients/{patient}/demographics/audit-logs', [PatientController::class, 'demographicsAuditLogs']);
    Route::get('/barangays/search', [BarangayController::class, 'search']);

    // Walk-in Queue
    Route::post('/queue/generate', [QueueController::class, 'generate']);

    // Appointments
    // Specific routes MUST come before generic {id} routes
    // Receptionist booking flow
    Route::get('/appointments/booking/form', [AppointmentController::class, 'bookingForm']);
    Route::get('/appointments/doctors/schedule', [AppointmentController::class, 'getDoctorSchedule']);
    Route::get('/appointments/slots/monthly-availability', [AppointmentController::class, 'getMonthlyAvailability']);
    Route::get('/appointments/patient/same-day-check', [AppointmentController::class, 'checkPatientSameDay']);
    Route::post('/appointments/book', [AppointmentController::class, 'storeByStaff']);

    Route::get('/appointments/create', [AppointmentController::class, 'create']);
    Route::get('/appointments/queue/daily/{departmentId}', [AppointmentController::class, 'dailyQueue']);
    Route::get('/appointments/calendar/weekly', [AppointmentController::class, 'getWeeklyCalendar']);
    Route::get('/appointments/slots/available', [AppointmentController::class, 'getAvailableSlots']);
    Route::get('/appointments/doctors/by-department', [AppointmentController::class, 'getDoctorsByDepartment']);
    Route::get('/doctors', [AppointmentController::class, 'getDoctors']);

    // Generic appointment routes
    Route::get('/appointments', [AppointmentController::class, 'index']);
    Route::post('/appointments', [AppointmentController::class, 'store']);
    Route::get('/appointments/{appointment}', [AppointmentController::class, 'show']);
    Route::patch('/appointments/{appointment}/status', [AppointmentController::class, 'updateStatus']);
    Route::post('/appointments/{appointment}/cancel', [AppointmentController::class, 'cancel']);
    Route::post('/appointments/{appointment}/reschedule', [AppointmentController::class, 'reschedule']);
    Route::post('/appointments/{appointment}/reassign', [AppointmentController::class, 'reassign']);
    Route::post('/appointments/{appointment}/sms', [SmsController::class, 'sendAppointmentConfirmation']);
    Route::put('/appointments/{appointment}', [AppointmentController::class, 'update']);
    Route::delete('/appointments/{appointment}', [AppointmentController::class, 'destroy']);

    // Doctor Leaves
    Route::get('/doctor-leaves', [\App\Http\Controllers\Api\DoctorLeaveController::class, 'index']);
    Route::post('/doctor-leaves', [\App\Http\Controllers\Api\DoctorLeaveController::class, 'store']);
    Route::patch('/doctor-leaves/{leave}/status', [\App\Http\Controllers\Api\DoctorLeaveController::class, 'updateStatus']);

    // Medical Records
    Route::post('/appointments/{appointment}/medical-record', [MedicalRecordController::class, 'store']);
    Route::get('/appointments/{appointment}/medical-record', [MedicalRecordController::class, 'show']);
    Route::put('/appointments/{appointment}/medical-record/draft', [MedicalRecordController::class, 'saveDraft']);
    Route::post('/appointments/{appointment}/medical-record/finalize', [MedicalRecordController::class, 'finalize']);
    Route::put('/medical-records/{medicalRecord}', [MedicalRecordController::class, 'update']);
    Route::get('/patients/{patientId}/medical-records', [MedicalRecordController::class, 'getPatientRecords']);

    // Lab Requests
    Route::post('/appointments/{appointment}/lab-requests', [LabRequestController::class, 'saveForAppointment']);
    Route::get('/appointments/{appointment}/lab-requests/latest', [LabRequestController::class, 'latestForAppointment']);
    Route::get('/lab-requests/pending', [LabRequestController::class, 'pendingQueue']);
    Route::get('/patients/{patient}/lab-requests/pending', [LabRequestController::class, 'pendingForPatient']);

    // ICD-10
    Route::get('/icd10/search', [Icd10Controller::class, 'search']);

    // Medicines (for prescription writing)
    Route::get('/medicines/search', [MedicineController::class, 'search']);
    Route::get('/medicines/{medicine}', [MedicineController::class, 'show']);

    // Users
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{user}', [UserController::class, 'show']);
    Route::put('/users/{user}', [UserController::class, 'update']);
    Route::delete('/users/{user}', [UserController::class, 'destroy']);
    Route::get('/patients', [UserController::class, 'getPatients']);
    Route::post('/users/{user}/change-password', [UserController::class, 'changePassword']);

    // Inventory
    Route::get('/inventory', [InventoryController::class, 'index']);
    Route::post('/inventory', [InventoryController::class, 'store']);
    Route::get('/inventory/{inventory}', [InventoryController::class, 'show']);
    Route::put('/inventory/{inventory}', [InventoryController::class, 'update']);
    Route::delete('/inventory/{inventory}', [InventoryController::class, 'destroy']);
    Route::get('/inventory/alerts/low-stock', [InventoryController::class, 'lowStock']);
    Route::get('/inventory/alerts/expiring', [InventoryController::class, 'expiringSoon']);
});