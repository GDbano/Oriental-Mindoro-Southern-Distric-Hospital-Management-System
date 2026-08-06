<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$migration = '2025_11_02_145119_create_personal_access_tokens_table';
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
?>
