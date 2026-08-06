<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Patient;
use App\Models\Department;
use App\Models\AppointmentType;
use App\Models\Appointment;
use App\Models\DoctorSchedule;
use Carbon\Carbon;

class SampleDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::beginTransaction();

        try {
            // Create Departments
            $departments = $this->createDepartments();
            
            // Create Appointment Types
            $appointmentTypes = $this->createAppointmentTypes();
            
            // Create Admin User
            $admin = $this->createAdmin();
            
            // Create Doctors
            $doctors = $this->createDoctors($departments);
            
            // Create Doctor Schedules
            $this->createDoctorSchedules($doctors, $departments);
            
            // Create Staff
            $staff = $this->createStaff();
            
            // Create Sample Patients with your provided names
            $patients = $this->createPatients();
            
            // Create Sample Appointments
            $this->createAppointments($patients, $doctors, $departments, $appointmentTypes);
            
            DB::commit();
            
            $this->command->info('✅ Sample data seeded successfully!');
            $this->command->info('');
            $this->command->info('📋 Login Credentials:');
            $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            $this->command->info('👨‍💼 Admin:');
            $this->command->info('   Email: admin@omsdh.gov.ph');
            $this->command->info('   Password: password123');
            $this->command->info('');
            $this->command->info('👨‍⚕️ Doctors:');
            $this->command->info('   Email: dr.santos@omsdh.gov.ph (Maria Santos)');
            $this->command->info('   Email: dr.reyes@omsdh.gov.ph (Juan Reyes)');
            $this->command->info('   Email: dr.cruz@omsdh.gov.ph (Ana Cruz)');
            $this->command->info('   Email: dr.marcelo@omsdh.gov.ph (Alvin Marcelo)');
            $this->command->info('   Password: password123');
            $this->command->info('');
            $this->command->info('👥 Staff & Support:');
            $this->command->info('   Email: staff@omsdh.gov.ph (Maria Clara Reyes - Staff)');
            $this->command->info('   Email: records@omsdh.gov.ph (Jose Rizal Santos - Records Officer)');
            $this->command->info('   Email: cashier@omsdh.gov.ph (Anna Marie Cruz - Cashier)');
            $this->command->info('   Email: john.fajutagana@omsdh.gov.ph (John Christian Fajutagana - Staff)');
            $this->command->info('   Password: password123');
            $this->command->info('');
            $this->command->info('🔬 Medical Technologists:');
            $this->command->info('   Email: demver.minon@omsdh.gov.ph (Demver Minon)');
            $this->command->info('   Email: allaiza.manimtim@omsdh.gov.ph (Allaiza Manimtim)');
            $this->command->info('   Password: password123');
            $this->command->info('');
            $this->command->info('🏥 Patients:');
            $this->command->info('   Email: gerald.depalubos@email.com (Gerald De Palubos)');
            $this->command->info('   Email: aaron.agbas@email.com (Aaron Jasper Agbas)');
            $this->command->info('   Email: john.cuasay@email.com (John Aizer Cuasay)');
            $this->command->info('   Email: nepthalie.fabic@email.com (Nepthalie Fabic)');
            $this->command->info('   Email: flordric.magayon@email.com (Flord Ric Magayon)');
            $this->command->info('   Email: reshalyn.mortel@email.com (Reshalyn Mortel)');
            $this->command->info('   Email: cecille.delapena@email.com (Cecille Ariane Dela Pena)');
            $this->command->info('   Email: jesserene.espinosa@email.com (Jesserene Espinosa)');
            $this->command->info('   Password: password123');
            $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('❌ Error seeding data: ' . $e->getMessage());
            throw $e;
        }
    }

    private function createDepartments()
    {
        $departments = [
            [
                'code' => 'OPD',
                'name' => 'Out-Patient Department',
                'description' => 'General consultation and primary care',
                'max_appointments_per_day' => 50,
                'opening_time' => '08:00:00',
                'closing_time' => '17:00:00',
                'is_active' => true,
            ],
            [
                'code' => 'PEDIA',
                'name' => 'Pediatrics',
                'description' => 'Child and adolescent healthcare',
                'max_appointments_per_day' => 40,
                'opening_time' => '08:00:00',
                'closing_time' => '17:00:00',
                'is_active' => true,
            ],
            [
                'code' => 'OBGYN',
                'name' => 'Obstetrics and Gynecology',
                'description' => 'Women\'s health and maternity care',
                'max_appointments_per_day' => 30,
                'opening_time' => '08:00:00',
                'closing_time' => '17:00:00',
                'is_active' => true,
            ],
            [
                'code' => 'DENTAL',
                'name' => 'Dental Services',
                'description' => 'Oral health and dental care',
                'max_appointments_per_day' => 35,
                'opening_time' => '08:00:00',
                'closing_time' => '17:00:00',
                'is_active' => true,
            ],
        ];

        $created = [];
        foreach ($departments as $dept) {
            // Try to find by code OR name (since both are unique)
            $existing = Department::where('code', $dept['code'])
                ->orWhere('name', $dept['name'])
                ->first();
            
            if ($existing) {
                // Update existing
                $existing->update($dept);
                $created[] = $existing;
            } else {
                // Create new
                $created[] = Department::create($dept);
            }
        }

        return $created;
    }

    private function createAppointmentTypes()
    {
        $types = [
            [
                'code' => 'OPD',
                'name' => 'General Consultation',
                'description' => 'Regular outpatient consultation',
                'default_duration_minutes' => 30,
                'requires_referral' => false,
                'allows_walk_in' => true,
                'is_active' => true,
            ],
            [
                'code' => 'FOLLOWUP',
                'name' => 'Follow-up Consultation',
                'description' => 'Follow-up visit for existing condition',
                'default_duration_minutes' => 20,
                'requires_referral' => false,
                'allows_walk_in' => true,
                'is_active' => true,
            ],
            [
                'code' => 'REFERRAL',
                'name' => 'Referral',
                'description' => 'Referred from another facility',
                'default_duration_minutes' => 45,
                'requires_referral' => true,
                'allows_walk_in' => false,
                'is_active' => true,
            ],
            [
                'code' => 'EMERGENCY',
                'name' => 'Emergency',
                'description' => 'Urgent medical attention required',
                'default_duration_minutes' => 60,
                'requires_referral' => false,
                'allows_walk_in' => true,
                'is_active' => true,
            ],
        ];

        $created = [];
        foreach ($types as $type) {
            $created[] = AppointmentType::updateOrCreate(
                ['code' => $type['code']], // Find by code
                $type // Update or create with these values
            );
        }

        return $created;
    }

    private function createAdmin()
    {
        return User::updateOrCreate(
            ['email' => 'admin@omsdh.gov.ph'],
            [
                'name' => 'System Administrator',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'phone' => '0917-123-4567',
                'address' => 'OMSDH Administrative Office',
                'is_active' => true,
            ]
        );
    }

    private function createDoctors($departments)
    {
        $doctors = [
            [
                'name' => 'Dr. Maria Santos',
                'email' => 'dr.santos@omsdh.gov.ph',
                'password' => Hash::make('password123'),
                'role' => 'doctor',
                'phone' => '0917-234-5678',
                'address' => 'Calapan City, Oriental Mindoro',
                'specialization' => 'General Practice',
                'license_number' => 'PRC-123456',
                'ptr_number' => 'PTR-2026-001',
                'is_active' => true,
            ],
            [
                'name' => 'Dr. Juan Reyes',
                'email' => 'dr.reyes@omsdh.gov.ph',
                'password' => Hash::make('password123'),
                'role' => 'doctor',
                'phone' => '0917-345-6789',
                'address' => 'Calapan City, Oriental Mindoro',
                'specialization' => 'Pediatrics',
                'license_number' => 'PRC-234567',
                'ptr_number' => 'PTR-2026-002',
                'is_active' => true,
            ],
            [
                'name' => 'Dr. Ana Cruz',
                'email' => 'dr.cruz@omsdh.gov.ph',
                'password' => Hash::make('password123'),
                'role' => 'doctor',
                'phone' => '0917-456-7890',
                'address' => 'Calapan City, Oriental Mindoro',
                'specialization' => 'Obstetrics and Gynecology',
                'license_number' => 'PRC-345678',
                'ptr_number' => 'PTR-2026-003',
                'is_active' => true,
            ],
            [
                'name' => 'Dr. Alvin Marcelo',
                'email' => 'dr.marcelo@omsdh.gov.ph',
                'password' => Hash::make('password123'),
                'role' => 'doctor',
                'phone' => '0917-567-8901',
                'address' => 'Calapan City, Oriental Mindoro',
                'specialization' => 'Internal Medicine',
                'license_number' => 'PRC-456789',
                'ptr_number' => 'PTR-2026-004',
                'is_active' => true,
            ],
        ];

        $created = [];
        foreach ($doctors as $doctor) {
            $email = $doctor['email'];
            $created[] = User::updateOrCreate(
                ['email' => $email],
                $doctor
            );
        }

        return $created;
    }

    private function createDoctorSchedules($doctors, $departments)
    {
        // Clear existing schedules for these doctors to avoid conflicts
        foreach ($doctors as $doctor) {
            DoctorSchedule::where('doctor_id', $doctor->id)->delete();
        }

        // Dr. Santos - General Practice (OPD)
        $this->createScheduleForDoctor($doctors[0], $departments[0], [
            ['Monday', '08:00', '12:00'],
            ['Monday', '13:00', '17:00'],
            ['Wednesday', '08:00', '12:00'],
            ['Wednesday', '13:00', '17:00'],
            ['Friday', '08:00', '12:00'],
            ['Friday', '13:00', '17:00'],
        ]);

        // Dr. Reyes - Pediatrics
        $this->createScheduleForDoctor($doctors[1], $departments[1], [
            ['Tuesday', '08:00', '12:00'],
            ['Tuesday', '13:00', '17:00'],
            ['Thursday', '08:00', '12:00'],
            ['Thursday', '13:00', '17:00'],
            ['Saturday', '08:00', '12:00'],
        ]);

        // Dr. Cruz - OB-GYN
        $this->createScheduleForDoctor($doctors[2], $departments[2], [
            ['Monday', '08:00', '12:00'],
            ['Tuesday', '13:00', '17:00'],
            ['Wednesday', '08:00', '12:00'],
            ['Thursday', '13:00', '17:00'],
            ['Friday', '08:00', '12:00'],
        ]);
    }

    private function createScheduleForDoctor($doctor, $department, $schedules)
    {
        foreach ($schedules as $schedule) {
            DoctorSchedule::updateOrCreate(
                [
                    'doctor_id' => $doctor->id,
                    'department_id' => $department->id,
                    'day_of_week' => $schedule[0],
                ],
                [
                    'start_time' => $schedule[1],
                    'end_time' => $schedule[2],
                    'consultation_duration_minutes' => 30,
                    'is_active' => true,
                ]
            );
        }
    }

    private function createStaff()
    {
        $staff = [
            [
                'name' => 'Maria Clara Reyes',
                'email' => 'staff@omsdh.gov.ph',
                'password' => Hash::make('password123'),
                'role' => 'staff',
                'phone' => '0917-567-8901',
                'address' => 'Calapan City, Oriental Mindoro',
                'is_active' => true,
            ],
            [
                'name' => 'Jose Rizal Santos',
                'email' => 'records@omsdh.gov.ph',
                'password' => Hash::make('password123'),
                'role' => 'records_officer',
                'phone' => '0917-678-9012',
                'address' => 'Calapan City, Oriental Mindoro',
                'is_active' => true,
            ],
            [
                'name' => 'Anna Marie Cruz',
                'email' => 'cashier@omsdh.gov.ph',
                'password' => Hash::make('password123'),
                'role' => 'cashier',
                'phone' => '0917-789-0123',
                'address' => 'Calapan City, Oriental Mindoro',
                'is_active' => true,
            ],
            [
                'name' => 'Demver Minon',
                'email' => 'demver.minon@omsdh.gov.ph',
                'password' => Hash::make('password123'),
                'role' => 'medtech',
                'phone' => '0917-890-1234',
                'address' => 'Calapan City, Oriental Mindoro',
                'is_active' => true,
            ],
            [
                'name' => 'Allaiza Manimtim',
                'email' => 'allaiza.manimtim@omsdh.gov.ph',
                'password' => Hash::make('password123'),
                'role' => 'medtech',
                'phone' => '0917-901-2345',
                'address' => 'Calapan City, Oriental Mindoro',
                'is_active' => true,
            ],
            [
                'name' => 'John Christian Fajutagana',
                'email' => 'john.fajutagana@omsdh.gov.ph',
                'password' => Hash::make('password123'),
                'role' => 'staff',
                'phone' => '0917-012-3456',
                'address' => 'Calapan City, Oriental Mindoro',
                'is_active' => true,
            ],
        ];

        $created = [];
        foreach ($staff as $s) {
            $email = $s['email'];
            $created[] = User::updateOrCreate(
                ['email' => $email],
                $s
            );
        }

        return $created;
    }

    private function createPatients()
    {
        $patientsData = [
            [
                'name' => 'Gerald De Palubos',
                'email' => 'gerald.depalubos@email.com',
                'phone' => '0917-111-2222',
                'address' => 'Barangay Lumang Bayan, Calapan City',
                'date_of_birth' => '1995-03-15',
                'gender' => 'male',
                'blood_type' => 'O+',
                'civil_status' => 'Single',
                'barangay' => 'Lumang Bayan',
                'municipality' => 'Calapan City',
                'province' => 'Oriental Mindoro',
                'allergies' => 'None',
                'medical_history' => 'Hypertension (controlled)',
                'emergency_contact_name' => 'Maria De Palubos',
                'emergency_contact_phone' => '0917-111-3333',
                'philhealth_number' => '12-345678901-2',
                'philhealth_membership_type' => 'Employed',
                'is_pwd' => false,
                'is_pregnant' => false,
                'is_senior' => false,
            ],
            [
                'name' => 'Aaron Jasper Agbas',
                'email' => 'aaron.agbas@email.com',
                'phone' => '0917-222-3333',
                'address' => 'Barangay Masipit, Calapan City',
                'date_of_birth' => '1998-07-22',
                'gender' => 'male',
                'blood_type' => 'A+',
                'civil_status' => 'Single',
                'barangay' => 'Masipit',
                'municipality' => 'Calapan City',
                'province' => 'Oriental Mindoro',
                'allergies' => 'Penicillin',
                'medical_history' => 'Asthma',
                'emergency_contact_name' => 'Rosa Agbas',
                'emergency_contact_phone' => '0917-222-4444',
                'philhealth_number' => '12-345678902-3',
                'philhealth_membership_type' => 'Employed',
                'is_pwd' => false,
                'is_pregnant' => false,
                'is_senior' => false,
            ],
            [
                'name' => 'Nepthalie Fabic',
                'email' => 'nepthalie.fabic@email.com',
                'phone' => '0917-333-4444',
                'address' => 'Barangay Salong, Calapan City',
                'date_of_birth' => '1992-11-08',
                'gender' => 'female',
                'blood_type' => 'B+',
                'civil_status' => 'Married',
                'barangay' => 'Salong',
                'municipality' => 'Calapan City',
                'province' => 'Oriental Mindoro',
                'allergies' => 'Shellfish',
                'medical_history' => 'None',
                'emergency_contact_name' => 'John Fabic',
                'emergency_contact_phone' => '0917-333-5555',
                'philhealth_number' => '12-345678903-4',
                'philhealth_membership_type' => 'Employed',
                'is_pwd' => false,
                'is_pregnant' => true,
                'is_senior' => false,
            ],
            [
                'name' => 'Flord Ric Magayon',
                'email' => 'flordric.magayon@email.com',
                'phone' => '0917-444-5555',
                'address' => 'Barangay Canubing I, Calapan City',
                'date_of_birth' => '1955-05-20',
                'gender' => 'male',
                'blood_type' => 'AB+',
                'civil_status' => 'Married',
                'barangay' => 'Canubing I',
                'municipality' => 'Calapan City',
                'province' => 'Oriental Mindoro',
                'allergies' => 'None',
                'medical_history' => 'Diabetes Type 2, Hypertension',
                'emergency_contact_name' => 'Elena Magayon',
                'emergency_contact_phone' => '0917-444-6666',
                'philhealth_number' => '12-345678904-5',
                'philhealth_membership_type' => 'Senior Citizen',
                'senior_citizen_id_number' => 'SC-2020-001234',
                'is_pwd' => false,
                'is_pregnant' => false,
                'is_senior' => true,
            ],
            [
                'name' => 'Reshalyn Mortel',
                'email' => 'reshalyn.mortel@email.com',
                'phone' => '0917-555-6666',
                'address' => 'Barangay Pachoca, Calapan City',
                'date_of_birth' => '1997-09-14',
                'gender' => 'female',
                'blood_type' => 'O-',
                'civil_status' => 'Single',
                'barangay' => 'Pachoca',
                'municipality' => 'Calapan City',
                'province' => 'Oriental Mindoro',
                'allergies' => 'Pollen',
                'medical_history' => 'Allergic Rhinitis',
                'emergency_contact_name' => 'Carmen Mortel',
                'emergency_contact_phone' => '0917-555-7777',
                'philhealth_number' => '12-345678905-6',
                'philhealth_membership_type' => 'Employed',
                'is_pwd' => false,
                'is_pregnant' => false,
                'is_senior' => false,
            ],
            [
                'name' => 'Cecille Ariane Dela Pena',
                'email' => 'cecille.delapena@email.com',
                'phone' => '0917-666-7777',
                'address' => 'Barangay Ibaba East, Calapan City',
                'date_of_birth' => '1990-12-25',
                'gender' => 'female',
                'blood_type' => 'A-',
                'civil_status' => 'Married',
                'barangay' => 'Ibaba East',
                'municipality' => 'Calapan City',
                'province' => 'Oriental Mindoro',
                'allergies' => 'None',
                'medical_history' => 'Previous C-Section (2018)',
                'emergency_contact_name' => 'Roberto Dela Pena',
                'emergency_contact_phone' => '0917-666-8888',
                'philhealth_number' => '12-345678906-7',
                'philhealth_membership_type' => 'Employed',
                'pwd_id_number' => 'PWD-2021-005678',
                'is_pwd' => true,
                'is_pregnant' => false,
                'is_senior' => false,
            ],
            [
                'name' => 'Jesserene Espinosa',
                'email' => 'jesserene.espinosa@email.com',
                'phone' => '0917-777-8888',
                'address' => 'Barangay San Vicente Central, Calapan City',
                'date_of_birth' => '1999-04-30',
                'gender' => 'female',
                'blood_type' => 'B-',
                'civil_status' => 'Single',
                'barangay' => 'San Vicente Central',
                'municipality' => 'Calapan City',
                'province' => 'Oriental Mindoro',
                'allergies' => 'Latex',
                'medical_history' => 'None',
                'emergency_contact_name' => 'Linda Espinosa',
                'emergency_contact_phone' => '0917-777-9999',
                'philhealth_number' => '12-345678907-8',
                'philhealth_membership_type' => 'Employed',
                'is_pwd' => false,
                'is_pregnant' => false,
                'is_senior' => false,
            ],
            [
                'name' => 'John Aizer Cuasay',
                'email' => 'john.cuasay@email.com',
                'phone' => '0917-888-9999',
                'address' => 'Barangay Anao, Calapan City',
                'date_of_birth' => '1996-08-19',
                'gender' => 'male',
                'blood_type' => 'O+',
                'civil_status' => 'Single',
                'barangay' => 'Anao',
                'municipality' => 'Calapan City',
                'province' => 'Oriental Mindoro',
                'allergies' => 'None',
                'medical_history' => 'None',
                'emergency_contact_name' => 'Maria Cuasay',
                'emergency_contact_phone' => '0917-888-0000',
                'philhealth_number' => '12-345678908-9',
                'philhealth_membership_type' => 'Employed',
                'is_pwd' => false,
                'is_pregnant' => false,
                'is_senior' => false,
            ],
        ];

        $created = [];
        
        // Clear existing patients to avoid duplicate hospital numbers
        Patient::query()->delete();
        
        $year = now()->year;
        $sequence = 1;

        foreach ($patientsData as $patientData) {
            // Create or update user account
            $user = User::updateOrCreate(
                ['email' => $patientData['email']],
                [
                    'name' => $patientData['name'],
                    'password' => Hash::make('password123'),
                    'role' => 'patient',
                    'phone' => $patientData['phone'],
                    'address' => $patientData['address'],
                    'is_active' => true,
                ]
            );

            // Check if patient already exists
            $existingPatient = Patient::where('user_id', $user->id)->first();
            
            if ($existingPatient) {
                // Update existing patient
                $existingPatient->update([
                    'date_of_birth' => $patientData['date_of_birth'],
                    'gender' => $patientData['gender'],
                    'blood_type' => $patientData['blood_type'],
                    'civil_status' => $patientData['civil_status'],
                    'barangay' => $patientData['barangay'],
                    'municipality' => $patientData['municipality'],
                    'province' => $patientData['province'],
                    'allergies' => $patientData['allergies'],
                    'medical_history' => $patientData['medical_history'],
                    'emergency_contact_name' => $patientData['emergency_contact_name'],
                    'emergency_contact_phone' => $patientData['emergency_contact_phone'],
                    'philhealth_number' => $patientData['philhealth_number'],
                    'philhealth_membership_type' => $patientData['philhealth_membership_type'],
                    'senior_citizen_id_number' => $patientData['senior_citizen_id_number'] ?? null,
                    'pwd_id_number' => $patientData['pwd_id_number'] ?? null,
                    'is_pwd' => $patientData['is_pwd'],
                    'is_pregnant' => $patientData['is_pregnant'],
                    'is_senior' => $patientData['is_senior'],
                ]);
                $patient = $existingPatient;
            } else {
                // Generate hospital number
                $hospitalNumber = sprintf('OMSDH-%d-%05d', $year, $sequence++);

                // Create new patient record
                $patient = Patient::create([
                    'user_id' => $user->id,
                    'hospital_number' => $hospitalNumber,
                    'date_of_birth' => $patientData['date_of_birth'],
                    'gender' => $patientData['gender'],
                    'blood_type' => $patientData['blood_type'],
                    'civil_status' => $patientData['civil_status'],
                    'barangay' => $patientData['barangay'],
                    'municipality' => $patientData['municipality'],
                    'province' => $patientData['province'],
                    'allergies' => $patientData['allergies'],
                    'medical_history' => $patientData['medical_history'],
                    'emergency_contact_name' => $patientData['emergency_contact_name'],
                    'emergency_contact_phone' => $patientData['emergency_contact_phone'],
                    'philhealth_number' => $patientData['philhealth_number'],
                    'philhealth_membership_type' => $patientData['philhealth_membership_type'],
                    'senior_citizen_id_number' => $patientData['senior_citizen_id_number'] ?? null,
                    'pwd_id_number' => $patientData['pwd_id_number'] ?? null,
                    'is_pwd' => $patientData['is_pwd'],
                    'is_pregnant' => $patientData['is_pregnant'],
                    'is_senior' => $patientData['is_senior'],
                ]);
            }

            $created[] = $patient;
        }

        return $created;
    }

    private function createAppointments($patients, $doctors, $departments, $appointmentTypes)
    {
        // Clear ALL existing appointments to avoid queue number conflicts
        // Queue numbers must be unique across the entire table
        // First delete related records, then appointments
        DB::table('queue_logs')->delete();
        DB::table('medical_records')->delete();
        DB::table('lab_requests')->delete();
        DB::table('billing_items')->delete();
        DB::table('billings')->delete();
        Appointment::query()->delete();

        $today = Carbon::today();
        $tomorrow = Carbon::tomorrow();
        $nextWeek = Carbon::today()->addWeek();

        $appointments = [
            // Today's appointments
            [
                'patient' => $patients[0], // Gerald
                'doctor' => $doctors[0], // Dr. Santos
                'department' => $departments[0], // OPD
                'type' => $appointmentTypes[0], // General Consultation
                'date' => $today,
                'time' => '09:00',
                'status' => 'scheduled',
                'reason' => 'Annual check-up',
                'symptoms' => 'None, routine examination',
                'priority' => 'Regular',
            ],
            [
                'patient' => $patients[3], // Flord Ric (Senior)
                'doctor' => $doctors[0], // Dr. Santos
                'department' => $departments[0], // OPD
                'type' => $appointmentTypes[1], // Follow-up
                'date' => $today,
                'time' => '09:30',
                'status' => 'confirmed',
                'reason' => 'Diabetes follow-up',
                'symptoms' => 'Blood sugar monitoring',
                'priority' => 'Senior',
            ],
            [
                'patient' => $patients[2], // Nepthalie (Pregnant)
                'doctor' => $doctors[2], // Dr. Cruz
                'department' => $departments[2], // OB-GYN
                'type' => $appointmentTypes[0], // General Consultation
                'date' => $today,
                'time' => '10:00',
                'status' => 'arrived',
                'reason' => 'Prenatal check-up',
                'symptoms' => 'Regular prenatal visit, 24 weeks',
                'priority' => 'Pregnant',
            ],
            [
                'patient' => $patients[5], // Cecille (PWD)
                'doctor' => $doctors[0], // Dr. Santos
                'department' => $departments[0], // OPD
                'type' => $appointmentTypes[0], // General Consultation
                'date' => $today,
                'time' => '10:30',
                'status' => 'scheduled',
                'reason' => 'General consultation',
                'symptoms' => 'Mild headache, fatigue',
                'priority' => 'PWD',
            ],
            [
                'patient' => $patients[1], // Aaron
                'doctor' => $doctors[0], // Dr. Santos
                'department' => $departments[0], // OPD
                'type' => $appointmentTypes[0], // General Consultation
                'date' => $today,
                'time' => '11:00',
                'status' => 'scheduled',
                'reason' => 'Asthma check-up',
                'symptoms' => 'Shortness of breath, wheezing',
                'priority' => 'Regular',
            ],

            // Tomorrow's appointments
            [
                'patient' => $patients[4], // Reshalyn
                'doctor' => $doctors[0], // Dr. Santos
                'department' => $departments[0], // OPD
                'type' => $appointmentTypes[0], // General Consultation
                'date' => $tomorrow,
                'time' => '09:00',
                'status' => 'scheduled',
                'reason' => 'Allergic rhinitis',
                'symptoms' => 'Sneezing, runny nose',
                'priority' => 'Regular',
            ],
            [
                'patient' => $patients[6], // Jesserene
                'doctor' => $doctors[0], // Dr. Santos
                'department' => $departments[0], // OPD
                'type' => $appointmentTypes[0], // General Consultation
                'date' => $tomorrow,
                'time' => '09:30',
                'status' => 'scheduled',
                'reason' => 'General check-up',
                'symptoms' => 'Fever, body aches',
                'priority' => 'Regular',
            ],

            // Next week appointments
            [
                'patient' => $patients[0], // Gerald
                'doctor' => $doctors[0], // Dr. Santos
                'department' => $departments[0], // OPD
                'type' => $appointmentTypes[1], // Follow-up
                'date' => $nextWeek,
                'time' => '14:00',
                'status' => 'scheduled',
                'reason' => 'Follow-up for hypertension',
                'symptoms' => 'Blood pressure monitoring',
                'priority' => 'Regular',
            ],
            [
                'patient' => $patients[2], // Nepthalie
                'doctor' => $doctors[2], // Dr. Cruz
                'department' => $departments[2], // OB-GYN
                'type' => $appointmentTypes[1], // Follow-up
                'date' => $nextWeek,
                'time' => '10:00',
                'status' => 'scheduled',
                'reason' => 'Prenatal follow-up',
                'symptoms' => 'Regular prenatal monitoring',
                'priority' => 'Pregnant',
            ],
        ];

        foreach ($appointments as $index => $apptData) {
            $appointment = Appointment::create([
                'patient_id' => $apptData['patient']->id,
                'doctor_id' => $apptData['doctor']->id,
                'department_id' => $apptData['department']->id,
                'appointment_type_id' => $apptData['type']->id,
                'appointment_date' => $apptData['date'],
                'scheduled_time' => $apptData['time'],
                'status' => $apptData['status'],
                'reason' => $apptData['reason'],
                'symptoms' => $apptData['symptoms'],
                'priority_level' => $apptData['priority'],
                'booking_source' => 'self_service',
                'booked_by' => $apptData['patient']->user_id,
                'created_by' => $apptData['patient']->user_id,
            ]);

            // Manually assign queue number to avoid conflicts
            // Queue numbers must be unique across entire table, not just per date
            $isPriority = in_array($apptData['priority'], ['Senior', 'PWD', 'Pregnant']);
            $prefix = $isPriority ? 'PR' : 'OPD';
            
            // Count ALL appointments with same prefix (across all dates)
            $count = Appointment::where('queue_number', 'LIKE', $prefix . '-%')->count();
            
            $appointment->queue_number = sprintf('%s-%03d', $prefix, $count + 1);
            $appointment->queue_position = $index + 1;
            $appointment->save();
        }
    }
}
