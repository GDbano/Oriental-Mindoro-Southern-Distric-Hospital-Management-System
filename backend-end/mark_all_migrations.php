<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

// Get all migration files
$migrationFiles = glob(__DIR__ . '/database/migrations/*.php');
$migratedBatch = DB::table('migrations')->max('batch') ?? 0;

foreach ($migrationFiles as $file) {
    $filename = basename($file, '.php');
    
    // Skip if it's the test or fixture files
    if ($filename === 'index' || strpos($filename, 'test') !== false) {
        continue;
    }
    
    $exists = DB::table('migrations')->where('migration', $filename)->exists();
    if (!$exists) {
        DB::table('migrations')->insert([
            'migration' => $filename,
            'batch' => $migratedBatch + 1
        ]);
        echo "✓ Marked: $filename\n";
    }
}

echo "\nAll migration files have been marked as completed.\n";
?>
