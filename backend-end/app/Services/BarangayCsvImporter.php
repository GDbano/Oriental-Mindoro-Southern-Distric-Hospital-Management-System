<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class BarangayCsvImporter
{
    /**
     * Import barangays from a CSV.
     *
     * Expected columns (header or positional): name, municipality, province
     *
     * @return array{inserted:int, skipped:int}
     */
    public function import(string $path, bool $truncate = false): array
    {
        if (!is_file($path)) {
            throw new \RuntimeException("CSV file not found: {$path}");
        }

        if ($truncate) {
            DB::table('barangays')->truncate();
        }

        $handle = fopen($path, 'r');
        if ($handle === false) {
            throw new \RuntimeException("Unable to open CSV: {$path}");
        }

        $inserted = 0;
        $skipped = 0;

        $header = null;
        $first = fgetcsv($handle);
        if ($first === false) {
            fclose($handle);
            return ['inserted' => 0, 'skipped' => 0];
        }

        $firstLower = array_map(fn($v) => is_string($v) ? strtolower(trim($v)) : '', $first);
        $looksLikeHeader = in_array('name', $firstLower, true) || in_array('barangay', $firstLower, true);

        if ($looksLikeHeader) {
            $header = $firstLower;
        } else {
            $row = $this->mapRow($first, null);
            if ($row) {
                DB::table('barangays')->insert($row);
                $inserted++;
            } else {
                $skipped++;
            }
        }

        while (($data = fgetcsv($handle)) !== false) {
            if ($data === [null] || $data === false) {
                continue;
            }

            $row = $this->mapRow($data, $header);
            if (!$row) {
                $skipped++;
                continue;
            }

            DB::table('barangays')->insert($row);
            $inserted++;
        }

        fclose($handle);

        return ['inserted' => $inserted, 'skipped' => $skipped];
    }

    private function mapRow(array $data, ?array $header): ?array
    {
        $value = fn($idx) => isset($data[$idx]) ? trim((string) $data[$idx]) : '';

        $name = '';
        $municipality = '';
        $province = '';

        if ($header) {
            $find = function (array $keys) use ($header, $data) {
                foreach ($keys as $key) {
                    $pos = array_search($key, $header, true);
                    if ($pos !== false) {
                        return trim((string) ($data[$pos] ?? ''));
                    }
                }
                return '';
            };

            $name = $find(['name', 'barangay']);
            $municipality = $find(['municipality', 'city', 'town']);
            $province = $find(['province']);
        } else {
            $name = $value(0);
            $municipality = $value(1);
            $province = $value(2);
        }

        if ($name === '') {
            return null;
        }

        return [
            'name' => $name,
            'municipality' => $municipality,
            'province' => $province,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
