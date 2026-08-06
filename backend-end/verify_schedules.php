<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\DoctorSchedule;

$schedules = DoctorSchedule::with(['doctor', 'department'])->get();

echo "Total doctor schedules created: " . count($schedules) . "\n\n";

$groupedByDoctor = $schedules->groupBy('doctor_id');

foreach ($groupedByDoctor as $doctorId => $doctorSchedules) {
    $firstSchedule = $doctorSchedules->first();
    echo $firstSchedule->doctor->name . " (" . $firstSchedule->department->code . "):\n";
    echo "  - Days: " . implode(', ', $doctorSchedules->pluck('day_of_week')->unique()->toArray()) . "\n";
    echo "  - Start time: " . $firstSchedule->start_time . " | End time: " . $firstSchedule->end_time . "\n";
    echo "  - Duration: " . $firstSchedule->consultation_duration_minutes . " mins | Max per day: " . $firstSchedule->max_appointments_per_day . "\n\n";
}
