<?php

namespace Database\Seeders;

use App\Services\BarangayCsvImporter;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BarangaySeeder extends Seeder
{
    public function run(): void
    {
        if (!DB::getSchemaBuilder()->hasTable('barangays')) {
            return;
        }

        $csvPath = storage_path('app/seed/barangays.csv');
        if (is_file($csvPath)) {
            (new BarangayCsvImporter())->import($csvPath, truncate: true);
            return;
        }

        // Tiny demo dataset (non-authoritative) so autocomplete works in dev.
        DB::table('barangays')->truncate();

        $now = now();
        DB::table('barangays')->insert([
            ['name' => 'Barangay 1', 'municipality' => 'Sample City', 'province' => 'Sample Province', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Barangay 2', 'municipality' => 'Sample City', 'province' => 'Sample Province', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Poblacion', 'municipality' => 'Sample City', 'province' => 'Sample Province', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'San Isidro', 'municipality' => 'Sample City', 'province' => 'Sample Province', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'San Roque', 'municipality' => 'Sample City', 'province' => 'Sample Province', 'created_at' => $now, 'updated_at' => $now],
        ]);
    }
}
