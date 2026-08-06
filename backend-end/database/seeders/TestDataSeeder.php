<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Department;
use App\Models\AppointmentType;
use App\Models\Patient;
use App\Models\DoctorSchedule;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class TestDataSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (DB::getSchemaBuilder()->hasTable('barangays')) {
            $this->call(BarangaySeeder::class);
        }

        if (DB::getSchemaBuilder()->hasTable('icd10_codes')) {
            $this->call(Icd10Seeder::class);
        }

        if (DB::getSchemaBuilder()->hasTable('medicines')) {
            $this->call(MedicineSeeder::class);
        }

        // Create departments
        $departments = [
            [
                'code' => 'CARDIO',
                'name' => 'Cardiology',
                'description' => 'Heart and cardiovascular diseases',
                'is_active' => true,
            ],
            [
                'code' => 'NEURO',
                'name' => 'Neurology',
                'description' => 'Brain and nervous system disorders',
                'is_active' => true,
            ],
            [
                'code' => 'PEDS',
                'name' => 'Pediatrics',
                'description' => 'Children and infant care',
                'is_active' => true,
            ],
            [
                'code' => 'GEN',
                'name' => 'General Medicine',
                'description' => 'General health consultations',
                'is_active' => true,
            ],
            [
                'code' => 'ENT',
                'name' => 'Ear, Nose & Throat',
                'description' => 'Otolaryngology services',
                'is_active' => true,
            ],
            [
                'code' => 'ORTHO',
                'name' => 'Orthopedics',
                'description' => 'Bone and joint disorders',
                'is_active' => true,
            ],
            [
                'code' => 'DERM',
                'name' => 'Dermatology',
                'description' => 'Skin and hair disorders',
                'is_active' => true,
            ],
            [
                'code' => 'OB-GYN',
                'name' => 'Obstetrics & Gynecology',
                'description' => 'Womens health and obstetrics',
                'is_active' => true,
            ],
        ];

        foreach ($departments as $dept) {
            Department::firstOrCreate($dept);
        }

        // Create appointment types
        $types = [
            [
                'code' => 'OPD',
                'name' => 'Out-Patient Department',
                'description' => 'Regular consultation',
                'default_duration_minutes' => 30,
                'requires_referral' => false,
                'allows_walk_in' => true,
                'is_active' => true,
            ],
            [
                'code' => 'FOLLOWUP',
                'name' => 'Follow-up',
                'description' => 'Follow-up consultation',
                'default_duration_minutes' => 15,
                'requires_referral' => false,
                'allows_walk_in' => false,
                'is_active' => true,
            ],
            [
                'code' => 'REFERRAL',
                'name' => 'Referral',
                'description' => 'Referral consultation',
                'default_duration_minutes' => 45,
                'requires_referral' => true,
                'allows_walk_in' => false,
                'is_active' => true,
            ],
        ];

        foreach ($types as $type) {
            AppointmentType::firstOrCreate(['code' => $type['code']], $type);
        }

        // Create admin user
        User::firstOrCreate(
            ['email' => 'admin@hospital.com'],
            [
                'name' => 'Admin User',
                'email' => 'admin@hospital.com',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'phone' => '555-0000',
                'is_active' => true,
            ]
        );

        // Create receptionist (staff) user
        User::firstOrCreate(
            ['email' => 'receptionist@hospital.com'],
            [
                'name' => 'Receptionist',
                'email' => 'receptionist@hospital.com',
                'password' => Hash::make('receptionist123'),
                'role' => 'staff',
                'phone' => '555-0001',
                'is_active' => true,
            ]
        );

        // Create cashier user
        User::firstOrCreate(
            ['email' => 'cashier@hospital.com'],
            [
                'name' => 'Cashier',
                'email' => 'cashier@hospital.com',
                'password' => Hash::make('cashier123'),
                'role' => 'cashier',
                'phone' => '555-0011',
                'is_active' => true,
            ]
        );

        // Create records officer user
        User::firstOrCreate(
            ['email' => 'records@hospital.com'],
            [
                'name' => 'Records Officer',
                'email' => 'records@hospital.com',
                'password' => Hash::make('records123'),
                'role' => 'records_officer',
                'phone' => '555-0002',
                'is_active' => true,
            ]
        );

        // Create medtech user
        User::firstOrCreate(
            ['email' => 'medtech@hospital.com'],
            [
                'name' => 'MedTech',
                'email' => 'medtech@hospital.com',
                'password' => Hash::make('medtech123'),
                'role' => 'medtech',
                'phone' => '555-0003',
                'is_active' => true,
            ]
        );

        // Create test doctors
        $doctors = [
            [
                'name' => 'Dr. Juan Santos',
                'email' => 'dr.santos@hospital.com',
                'password' => Hash::make('password'),
                'role' => 'doctor',
                'phone' => '555-0101',
                'specialization' => 'Cardiology',
                'license_number' => 'MED-2020-001',
                'ptr_number' => 'PTR-2020-001',
                'is_active' => true,
            ],
            [
                'name' => 'Dr. Maria Garcia',
                'email' => 'dr.garcia@hospital.com',
                'password' => Hash::make('password'),
                'role' => 'doctor',
                'phone' => '555-0102',
                'specialization' => 'Neurology',
                'license_number' => 'MED-2020-002',
                'ptr_number' => 'PTR-2020-002',
                'is_active' => true,
            ],
            [
                'name' => 'Dr. Pedro Reyes',
                'email' => 'dr.reyes@hospital.com',
                'password' => Hash::make('password'),
                'role' => 'doctor',
                'phone' => '555-0103',
                'specialization' => 'Pediatrics',
                'license_number' => 'MED-2020-003',
                'ptr_number' => 'PTR-2020-003',
                'is_active' => true,
            ],
            [
                'name' => 'Dr. Ana Cruz',
                'email' => 'dr.cruz@hospital.com',
                'password' => Hash::make('password'),
                'role' => 'doctor',
                'phone' => '555-0104',
                'specialization' => 'General Medicine',
                'license_number' => 'MED-2020-004',
                'ptr_number' => 'PTR-2020-004',
                'is_active' => true,
            ],
            [
                'name' => 'Dr. Carlos Lopez',
                'email' => 'dr.lopez@hospital.com',
                'password' => Hash::make('password'),
                'role' => 'doctor',
                'phone' => '555-0105',
                'specialization' => 'Ear, Nose & Throat',
                'license_number' => 'MED-2020-005',
                'ptr_number' => 'PTR-2020-005',
                'is_active' => true,
            ],
            [
                'name' => 'Dr. Rosa Mendez',
                'email' => 'dr.mendez@hospital.com',
                'password' => Hash::make('password'),
                'role' => 'doctor',
                'phone' => '555-0106',
                'specialization' => 'Orthopedics',
                'license_number' => 'MED-2020-006',
                'ptr_number' => 'PTR-2020-006',
                'is_active' => true,
            ],
            [
                'name' => 'Dr. Miguel Torres',
                'email' => 'dr.torres@hospital.com',
                'password' => Hash::make('password'),
                'role' => 'doctor',
                'phone' => '555-0107',
                'specialization' => 'Dermatology',
                'license_number' => 'MED-2020-007',
                'ptr_number' => 'PTR-2020-007',
                'is_active' => true,
            ],
            [
                'name' => 'Dr. Sofia Ramirez',
                'email' => 'dr.ramirez@hospital.com',
                'password' => Hash::make('password'),
                'role' => 'doctor',
                'phone' => '555-0108',
                'specialization' => 'Obstetrics & Gynecology',
                'license_number' => 'MED-2020-008',
                'ptr_number' => 'PTR-2020-008',
                'is_active' => true,
            ],
            [
                'name' => 'Dr. Luis Fernandez',
                'email' => 'dr.fernandez@hospital.com',
                'password' => Hash::make('password'),
                'role' => 'doctor',
                'phone' => '555-0109',
                'specialization' => 'Cardiology',
                'license_number' => 'MED-2020-009',
                'ptr_number' => 'PTR-2020-009',
                'is_active' => true,
            ],
            [
                'name' => 'Dr. Elena Morales',
                'email' => 'dr.morales@hospital.com',
                'password' => Hash::make('password'),
                'role' => 'doctor',
                'phone' => '555-0110',
                'specialization' => 'General Medicine',
                'license_number' => 'MED-2020-010',
                'ptr_number' => 'PTR-2020-010',
                'is_active' => true,
            ],
        ];

        foreach ($doctors as $doctor) {
            User::firstOrCreate(['email' => $doctor['email']], $doctor);
        }

        // Map doctors to departments with schedule information
        $doctorSchedules = [
            'dr.santos@hospital.com' => 'CARDIO',      // Dr. Juan Santos - Cardiology
            'dr.garcia@hospital.com' => 'NEURO',       // Dr. Maria Garcia - Neurology
            'dr.reyes@hospital.com' => 'PEDS',         // Dr. Pedro Reyes - Pediatrics
            'dr.cruz@hospital.com' => 'GEN',           // Dr. Ana Cruz - General Medicine
            'dr.lopez@hospital.com' => 'ENT',          // Dr. Carlos Lopez - ENT
            'dr.mendez@hospital.com' => 'ORTHO',       // Dr. Rosa Mendez - Orthopedics
            'dr.torres@hospital.com' => 'DERM',        // Dr. Miguel Torres - Dermatology
            'dr.ramirez@hospital.com' => 'OB-GYN',     // Dr. Sofia Ramirez - OB-GYN
            'dr.fernandez@hospital.com' => 'CARDIO',   // Dr. Luis Fernandez - Cardiology
            'dr.morales@hospital.com' => 'GEN',        // Dr. Elena Morales - General Medicine
        ];

        // Create doctor schedules for each doctor in their respective department
        $daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

        foreach ($doctorSchedules as $email => $departmentCode) {
            $doctor = User::where('email', $email)->first();
            $department = Department::where('code', $departmentCode)->first();

            if ($doctor && $department) {
                foreach ($daysOfWeek as $day) {
                    DoctorSchedule::firstOrCreate(
                        [
                            'doctor_id' => $doctor->id,
                            'department_id' => $department->id,
                            'day_of_week' => $day,
                        ],
                        [
                            'start_time' => '08:00:00',
                            'end_time' => '17:00:00',
                            'consultation_duration_minutes' => 30,
                            'max_appointments_per_day' => 20,
                            'is_active' => true,
                        ]
                    );
                }
            }
        }


        // Create test patient user
        $patientUser = User::firstOrCreate(
            ['email' => 'patient@example.com'],
            [
                'name' => 'John Doe',
                'email' => 'patient@example.com',
                'password' => Hash::make('password'),
                'role' => 'patient',
                'phone' => '555-1234',
                'is_active' => true,
            ]
        );

        // Create patient profile for the test user
        if (!$patientUser->patient) {
            Patient::create([
                'user_id' => $patientUser->id,
                'date_of_birth' => '1990-01-15',
                'gender' => 'male',
                'blood_type' => 'O+',
                'allergies' => 'None',
                'medical_history' => 'Hypertension',
                'emergency_contact_name' => 'Jane Doe',
                'emergency_contact_phone' => '555-1235',
                'insurance_info' => 'Insurance Plan XYZ',
                'is_pwd' => false,
                'is_pregnant' => false,
                'is_senior' => false,
            ]);
        }

        // Create additional test patients with different priorities
        $additionalPatients = [
            [
                'user' => [
                    'name' => 'Maria Santos',
                    'email' => 'maria.santos@example.com',
                    'password' => Hash::make('password'),
                    'role' => 'patient',
                    'phone' => '555-2001',
                    'is_active' => true,
                ],
                'patient' => [
                    'date_of_birth' => '1945-06-20',
                    'gender' => 'female',
                    'blood_type' => 'A+',
                    'allergies' => 'Penicillin',
                    'medical_history' => 'Diabetes, Hypertension',
                    'emergency_contact_name' => 'Roberto Santos',
                    'emergency_contact_phone' => '555-2002',
                    'insurance_info' => 'Senior Care Plan',
                    'is_pwd' => false,
                    'is_pregnant' => false,
                    'is_senior' => true,  // Senior citizen
                ]
            ],
            [
                'user' => [
                    'name' => 'Angela Reyes',
                    'email' => 'angela.reyes@example.com',
                    'password' => Hash::make('password'),
                    'role' => 'patient',
                    'phone' => '555-3001',
                    'is_active' => true,
                ],
                'patient' => [
                    'date_of_birth' => '1992-03-10',
                    'gender' => 'female',
                    'blood_type' => 'B+',
                    'allergies' => 'Aspirin',
                    'medical_history' => 'None',
                    'emergency_contact_name' => 'Jose Reyes',
                    'emergency_contact_phone' => '555-3002',
                    'insurance_info' => 'Maternity Coverage',
                    'is_pwd' => false,
                    'is_pregnant' => true,  // Pregnant
                    'is_senior' => false,
                ]
            ],
            [
                'user' => [
                    'name' => 'Robert Garcia',
                    'email' => 'robert.garcia@example.com',
                    'password' => Hash::make('password'),
                    'role' => 'patient',
                    'phone' => '555-4001',
                    'is_active' => true,
                ],
                'patient' => [
                    'date_of_birth' => '1988-11-25',
                    'gender' => 'male',
                    'blood_type' => 'AB-',
                    'allergies' => 'Sulfa drugs',
                    'medical_history' => 'Hearing impairment',
                    'emergency_contact_name' => 'Laura Garcia',
                    'emergency_contact_phone' => '555-4002',
                    'insurance_info' => 'PWD Benefits Plan',
                    'is_pwd' => true,  // PWD
                    'is_pregnant' => false,
                    'is_senior' => false,
                ]
            ],
            [
                'user' => [
                    'name' => 'Christine Lopez',
                    'email' => 'christine.lopez@example.com',
                    'password' => Hash::make('password'),
                    'role' => 'patient',
                    'phone' => '555-5001',
                    'is_active' => true,
                ],
                'patient' => [
                    'date_of_birth' => '2015-07-08',
                    'gender' => 'female',
                    'blood_type' => 'O-',
                    'allergies' => 'Eggs, Peanuts',
                    'medical_history' => 'Asthma',
                    'emergency_contact_name' => 'David Lopez',
                    'emergency_contact_phone' => '555-5002',
                    'insurance_info' => 'Family Plan',
                    'is_pwd' => false,
                    'is_pregnant' => false,
                    'is_senior' => false,
                ]
            ],
        ];

        foreach ($additionalPatients as $patientData) {
            $user = User::firstOrCreate(
                ['email' => $patientData['user']['email']],
                $patientData['user']
            );

            if (!$user->patient) {
                Patient::create([
                    'user_id' => $user->id,
                    ...$patientData['patient'],
                ]);
            }
        }
    }
}
