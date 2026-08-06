<?php

namespace Database\Seeders;

use App\Models\Inventory;
use App\Models\Medicine;
use Illuminate\Database\Seeder;

class MedicineSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            [
                'generic_name' => 'Paracetamol',
                'brand_name' => 'Biogesic',
                'default_dosage' => '500mg',
                'default_form' => 'tablet',
                'inventory' => [
                    'name' => 'Paracetamol 500mg tablet',
                    'category' => 'MEDICINE',
                    'quantity' => 120,
                    'min_stock' => 30,
                    'is_active' => true,
                ],
            ],
            [
                'generic_name' => 'Amoxicillin',
                'brand_name' => 'Amoxil',
                'default_dosage' => '500mg',
                'default_form' => 'capsule',
                'inventory' => [
                    'name' => 'Amoxicillin 500mg capsule',
                    'category' => 'MEDICINE',
                    'quantity' => 18,
                    'min_stock' => 20,
                    'is_active' => true,
                ],
            ],
            [
                'generic_name' => 'Cetirizine',
                'brand_name' => 'Zyrtec',
                'default_dosage' => '10mg',
                'default_form' => 'tablet',
                'inventory' => [
                    'name' => 'Cetirizine 10mg tablet',
                    'category' => 'MEDICINE',
                    'quantity' => 0,
                    'min_stock' => 20,
                    'is_active' => true,
                ],
            ],
            [
                'generic_name' => 'Metformin',
                'brand_name' => 'Glucophage',
                'default_dosage' => '500mg',
                'default_form' => 'tablet',
                'inventory' => [
                    'name' => 'Metformin 500mg tablet',
                    'category' => 'MEDICINE',
                    'quantity' => 85,
                    'min_stock' => 25,
                    'is_active' => true,
                ],
            ],
            [
                'generic_name' => 'Losartan',
                'brand_name' => 'Cozaar',
                'default_dosage' => '50mg',
                'default_form' => 'tablet',
                'inventory' => [
                    'name' => 'Losartan 50mg tablet',
                    'category' => 'MEDICINE',
                    'quantity' => 40,
                    'min_stock' => 15,
                    'is_active' => true,
                ],
            ],
        ];

        foreach ($items as $i) {
            $inv = Inventory::updateOrCreate(
                ['name' => $i['inventory']['name']],
                [
                    'description' => null,
                    'category' => $i['inventory']['category'],
                    'quantity' => $i['inventory']['quantity'],
                    'min_stock' => $i['inventory']['min_stock'],
                    'price' => null,
                    'expiry_date' => null,
                    'supplier' => null,
                    'is_active' => $i['inventory']['is_active'],
                ]
            );

            Medicine::updateOrCreate(
                ['generic_name' => $i['generic_name'], 'brand_name' => $i['brand_name']],
                [
                    'inventory_id' => $inv->id,
                    'default_dosage' => $i['default_dosage'],
                    'default_form' => $i['default_form'],
                    'is_active' => true,
                ]
            );
        }

        $this->command?->info('Medicines seeded');
    }
}
