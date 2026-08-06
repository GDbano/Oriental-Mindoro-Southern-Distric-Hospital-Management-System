<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

use App\Services\BarangayCsvImporter;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('barangays:import {--path= : Path to CSV (defaults to storage/app/seed/barangays.csv)} {--truncate : Truncate barangays table before import}', function () {
    if (!DB::getSchemaBuilder()->hasTable('barangays')) {
        $this->error('Table barangays does not exist. Run migrations first.');
        return 1;
    }

    $path = $this->option('path') ?: storage_path('app/seed/barangays.csv');
    $truncate = (bool) $this->option('truncate');

    try {
        $result = (new BarangayCsvImporter())->import($path, truncate: $truncate);
        $this->info("Imported barangays. Inserted: {$result['inserted']}, Skipped: {$result['skipped']}");
        return 0;
    } catch (\Throwable $e) {
        $this->error($e->getMessage());
        return 1;
    }
})->purpose('Import barangays from a CSV file');
