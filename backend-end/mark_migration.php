<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

// List of migrations that should be marked as completed
$migrations = [
    '0001_01_01_000000_create_users_table',
    '2025_11_02_035516_create_personal_access_tokens_table',
    '2025_11_02_103145_create_patients_table',
    '2025_11_02_103211_create_appointments_table',
    '2025_11_02_105439_create_medical_records_table'
];

foreach ($migrations as $migration) {
    $exists = DB::table('migrations')->where('migration', $migration)->exists();
    if (!$exists) {
        DB::table('migrations')->insert([
            'migration' => $migration,
            'batch' => 1
        ]);
        echo "Marked: $migration\n";
    } else {
        echo "Already marked: $migration\n";
    }
}
?>
