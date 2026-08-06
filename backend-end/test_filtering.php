<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Department;
use App\Models\User;

// First, get a doctor token for authentication
$doctor = User::where('role', 'doctor')->first();

// Create a personal access token for authentication
$token = $doctor->createToken('test-token')->plainTextToken;
echo "Testing department-based doctor filtering:\n";
echo "Using doctor: {$doctor->name} (Token: " . substr($token, 0, 20) . "...)\n\n";

// Get Cardiology department (CARDIO)
$cardio = Department::where('code', 'CARDIO')->first();
echo "Department: {$cardio->name} (ID: {$cardio->id})\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "http://localhost:8000/api/appointments/doctors/by-department?department_id=" . $cardio->id);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json',
    'Authorization: Bearer ' . $token
]);

$response = curl_exec($ch);
$statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "API Status Code: {$statusCode}\n";

$data = json_decode($response, true);

if (isset($data['data'])) {
    echo "Doctors in " . $cardio->name . ": " . count($data['data']) . "\n";
    foreach ($data['data'] as $doctor) {
        echo "  - " . $doctor['name'] . " (License: " . $doctor['license_number'] . ")\n";
    }
} else {
    echo "API Response:\n";
    print_r($data);
}
