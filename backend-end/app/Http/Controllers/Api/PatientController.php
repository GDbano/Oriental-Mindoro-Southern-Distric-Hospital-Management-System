<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class PatientController extends Controller
{
    private function canEditDemographics($user): bool
    {
        return (bool) ($user && ($user->isAdmin() || $user->isStaff() || $user->isRecordsOfficer()));
    }

    public function nextHospitalNumber(Request $request)
    {
        $user = Auth::user();
        if (!$user || !($user->isStaff() || $user->isAdmin())) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $year = (int) now()->format('Y');

        $last = DB::table('hospital_number_counters')
            ->where('year', $year)
            ->value('last_sequence');

        $nextSeq = ((int) $last) + 1;
        $next = sprintf('OMSDH-%d-%05d', $year, $nextSeq);

        return response()->json([
            'hospital_number' => $next,
            'year' => $year,
        ]);
    }

    public function duplicates(Request $request)
    {
        $user = Auth::user();
        if (!$user || !($user->isStaff() || $user->isAdmin())) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'min:2'],
            'date_of_birth' => ['required', 'date'],
        ]);

        $name = trim($validated['name']);
        $tokens = array_values(array_filter(preg_split('/\s+/', $name) ?: []));

        $matches = Patient::with('user')
            ->whereDate('date_of_birth', $validated['date_of_birth'])
            ->whereHas('user', function ($q) use ($name, $tokens) {
                $q->where(function ($qq) use ($name, $tokens) {
                    $qq->where('name', 'like', '%' . $name . '%');
                    foreach ($tokens as $t) {
                        $qq->orWhere('name', 'like', '%' . $t . '%');
                    }
                });
            })
            ->orderBy('id', 'desc')
            ->limit(10)
            ->get([
                'id',
                'user_id',
                'hospital_number',
                'date_of_birth',
                'gender',
            ]);

        return response()->json([
            'matches' => $matches,
            'count' => $matches->count(),
        ]);
    }

    public function storeByStaff(Request $request)
    {
        $user = Auth::user();
        if (!$user || !($user->isStaff() || $user->isRecordsOfficer() || $user->isAdmin())) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:500'],

            'date_of_birth' => ['required', 'date', 'before:today'],
            'gender' => ['required', 'in:male,female,other'],
            'blood_type' => ['nullable', 'string', 'max:10'],
            'allergies' => ['nullable', 'string'],
            'medical_history' => ['nullable', 'string'],
            'emergency_contact_name' => ['nullable', 'string', 'max:255'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:20'],
            'insurance_info' => ['nullable', 'string', 'max:255'],

            'is_indigent' => ['sometimes', 'boolean'],
            'staff_remarks' => ['nullable', 'string', 'max:2000'],

            'barangay' => ['nullable', 'string', 'max:255'],
            'municipality' => ['nullable', 'string', 'max:255'],
            'province' => ['nullable', 'string', 'max:255'],
            'philhealth_number' => ['nullable', 'string', 'max:50'],
        ]);

        $created = DB::transaction(function () use ($validated) {
            $year = (int) now()->format('Y');
            $hospitalNumber = $this->generateHospitalNumber($year);

            $email = $validated['email'] ?? null;
            if (!$email) {
                // Patients may not have an email; generate a unique placeholder.
                $email = Str::lower($hospitalNumber) . '@noemail.local';
            }

            $user = User::create([
                'name' => $validated['name'],
                'email' => $email,
                'password' => Hash::make(Str::random(16)),
                'role' => 'patient',
                'phone' => $validated['phone'] ?? null,
                'address' => $validated['address'] ?? null,
                'is_active' => true,
            ]);

            $patient = Patient::create([
                'user_id' => $user->id,
                'hospital_number' => $hospitalNumber,
                'date_of_birth' => $validated['date_of_birth'],
                'gender' => $validated['gender'],
                'blood_type' => $validated['blood_type'] ?? null,
                'allergies' => $validated['allergies'] ?? null,
                'medical_history' => $validated['medical_history'] ?? null,
                'emergency_contact_name' => $validated['emergency_contact_name'] ?? null,
                'emergency_contact_phone' => $validated['emergency_contact_phone'] ?? null,
                'insurance_info' => $validated['insurance_info'] ?? null,
                'is_indigent' => (bool) ($validated['is_indigent'] ?? false),
                'staff_remarks' => $validated['staff_remarks'] ?? null,
                'barangay' => $validated['barangay'] ?? null,
                'municipality' => $validated['municipality'] ?? null,
                'province' => $validated['province'] ?? null,
                'philhealth_number' => $validated['philhealth_number'] ?? null,
            ]);

            $patient->load('user');
            return $patient;
        });

        return response()->json([
            'message' => 'Patient registered successfully',
            'patient' => $created,
        ], 201);
    }

    public function updateDemographics(Request $request, Patient $patient)
    {
        $actor = Auth::user();
        if (!$this->canEditDemographics($actor)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            // Personal
            'name' => ['required', 'string', 'max:255'],
            'date_of_birth' => ['required', 'date', 'before:today'],
            'gender' => ['required', 'in:male,female,other'],
            'civil_status' => ['nullable', 'string', 'max:50'],
            'blood_type' => ['nullable', 'string', 'max:10'],

            // Address
            'address' => ['nullable', 'string', 'max:500'],
            'barangay' => ['nullable', 'string', 'max:255'],
            'municipality' => ['nullable', 'string', 'max:255'],
            'province' => ['nullable', 'string', 'max:255'],

            // Contact
            'email' => ['required', 'email', 'max:255', 'unique:users,email,' . $patient->user_id],
            'phone' => ['nullable', 'string', 'max:20'],

            // Insurance / PhilHealth
            'philhealth_number' => ['nullable', 'string', 'max:50'],
            'philhealth_membership_type' => ['nullable', 'string', 'max:50'],

            // Government IDs
            'pwd_id_number' => ['nullable', 'string', 'max:50'],
            'senior_citizen_id_number' => ['nullable', 'string', 'max:50'],
        ]);

        $patient->load('user');

        $changes = [];

        $normalizeValue = function (string $key, $value) {
            if ($value === null)
                return null;
            if ($key === 'date_of_birth') {
                if ($value instanceof \DateTimeInterface) {
                    return $value->format('Y-m-d');
                }
                $s = trim((string) $value);
                return $s === '' ? null : substr($s, 0, 10);
            }
            if (is_string($value)) {
                $t = trim($value);
                return $t === '' ? null : $t;
            }
            return $value;
        };

        $fieldMeta = [
            // user fields
            'name' => ['model' => 'user', 'label' => 'Name'],
            'email' => ['model' => 'user', 'label' => 'Email'],
            'phone' => ['model' => 'user', 'label' => 'Phone'],
            'address' => ['model' => 'user', 'label' => 'Address'],

            // patient fields
            'date_of_birth' => ['model' => 'patient', 'label' => 'Date of birth'],
            'gender' => ['model' => 'patient', 'label' => 'Sex'],
            'civil_status' => ['model' => 'patient', 'label' => 'Civil status'],
            'blood_type' => ['model' => 'patient', 'label' => 'Blood type'],
            'barangay' => ['model' => 'patient', 'label' => 'Barangay'],
            'municipality' => ['model' => 'patient', 'label' => 'Municipality'],
            'province' => ['model' => 'patient', 'label' => 'Province'],
            'philhealth_number' => ['model' => 'patient', 'label' => 'PhilHealth number'],
            'philhealth_membership_type' => ['model' => 'patient', 'label' => 'PhilHealth membership type'],
            'pwd_id_number' => ['model' => 'patient', 'label' => 'PWD ID'],
            'senior_citizen_id_number' => ['model' => 'patient', 'label' => 'Senior Citizen ID'],
        ];

        foreach ($fieldMeta as $key => $meta) {
            $old = $meta['model'] === 'user'
                ? ($patient->user->{$key} ?? null)
                : ($patient->{$key} ?? null);
            $new = $validated[$key] ?? null;

            $oldNorm = $normalizeValue($key, $old);
            $newNorm = $normalizeValue($key, $new);

            if ((string) ($oldNorm ?? '') !== (string) ($newNorm ?? '')) {
                $changes[] = [
                    'field' => $key,
                    'label' => $meta['label'],
                    'from' => $oldNorm,
                    'to' => $newNorm,
                ];
            }
        }

        if (count($changes) === 0) {
            return response()->json([
                'message' => 'No changes detected',
                'changed' => [],
                'patient' => $patient,
            ]);
        }

        $updated = DB::transaction(function () use ($patient, $validated, $actor, $changes) {
            $patient->user->update([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'address' => $validated['address'] ?? null,
            ]);

            $patient->update([
                'date_of_birth' => $validated['date_of_birth'],
                'gender' => $validated['gender'],
                'civil_status' => $validated['civil_status'] ?? null,
                'blood_type' => $validated['blood_type'] ?? null,
                'barangay' => $validated['barangay'] ?? null,
                'municipality' => $validated['municipality'] ?? null,
                'province' => $validated['province'] ?? null,
                'philhealth_number' => $validated['philhealth_number'] ?? null,
                'philhealth_membership_type' => $validated['philhealth_membership_type'] ?? null,
                'pwd_id_number' => $validated['pwd_id_number'] ?? null,
                'senior_citizen_id_number' => $validated['senior_citizen_id_number'] ?? null,
            ]);

            foreach ($changes as $c) {
                $from = $c['from'] ?? '—';
                $to = $c['to'] ?? '—';

                AuditLog::logEntity(
                    $actor->id,
                    'PATIENT_DEMOGRAPHICS_UPDATE',
                    "{$c['label']} changed from {$from} to {$to}",
                    Patient::class,
                    $patient->id,
                    $c,
                    request()->ip(),
                    request()->userAgent()
                );
            }

            $patient->load('user');
            return $patient;
        });

        return response()->json([
            'message' => 'Patient information updated successfully',
            'changed' => $changes,
            'patient' => $updated,
        ]);
    }

    public function demographicsAuditLogs(Request $request, Patient $patient)
    {
        $actor = Auth::user();
        if (!$this->canEditDemographics($actor)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $logs = AuditLog::with('user')
            ->where('auditable_type', Patient::class)
            ->where('auditable_id', $patient->id)
            ->where('action', 'PATIENT_DEMOGRAPHICS_UPDATE')
            ->orderByDesc('performed_at')
            ->limit((int) ($request->get('limit', 50)))
            ->get();

        return response()->json([
            'logs' => $logs,
            'count' => $logs->count(),
        ]);
    }

    private function generateHospitalNumber(int $year)
    {
        // Atomic increment via row lock.
        $counter = DB::table('hospital_number_counters')
            ->where('year', $year)
            ->lockForUpdate()
            ->first();

        if (!$counter) {
            try {
                DB::table('hospital_number_counters')->insert([
                    'year' => $year,
                    'last_sequence' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } catch (QueryException $e) {
                // Concurrent insert; fall through.
            }

            $counter = DB::table('hospital_number_counters')
                ->where('year', $year)
                ->lockForUpdate()
                ->first();
        }

        $next = ((int) ($counter->last_sequence ?? 0)) + 1;
        DB::table('hospital_number_counters')
            ->where('year', $year)
            ->update([
                'last_sequence' => $next,
                'updated_at' => now(),
            ]);

        return sprintf('OMSDH-%d-%05d', $year, $next);
    }
}
