<?php
// Debug file to test appointment form data loading
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Models\Department;
use App\Models\AppointmentType;

try {
    echo "Starting debug...\n";

    // Test auth user
    $user = User::find(6);
    echo "User: " . ($user ? $user->name : "NOT FOUND") . "\n";
    echo "User role: " . ($user ? $user->role : "N/A") . "\n";

    if ($user && $user->isPatient()) {
        echo "Patient ID: " . $user->patient->id . "\n";
        echo "Patient check : OK\n";
    }

    // Test departments
    echo "\nTesting departments...\n";
    $depts = Department::all();
    echo "Total departments: " . $depts->count() . "\n";
    foreach ($depts as $d) {
        echo "- " . $d->code . ": " . $d->name . "\n";
    }

    // Test appointment types
    echo "\nTesting appointment types...\n";
    $types = AppointmentType::all();
    echo "Total types: " . $types->count() . "\n";
    foreach ($types as $t) {
        echo "- " . $t->code . ": " . $t->name . "\n";
    }

    echo "\nDone.\n";

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
