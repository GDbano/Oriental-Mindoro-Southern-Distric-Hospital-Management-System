<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MedicalRecord;
use App\Models\Appointment;
use App\Models\AuditLog;
use App\Models\Billing;
use App\Models\BillingItem;
use App\Notifications\SystemNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class MedicalRecordController extends Controller
{
    private function buildPrescriptionTextFromStructured(?array $prescriptions, ?string $fallback)
    {
        if ($fallback && trim($fallback) !== '') {
            return $fallback;
        }

        if (!$prescriptions || count($prescriptions) === 0) {
            return null;
        }

        $lines = [];
        foreach ($prescriptions as $p) {
            $generic = isset($p['generic_name']) ? trim((string) $p['generic_name']) : '';
            $brand = isset($p['brand_name']) ? trim((string) $p['brand_name']) : '';
            $dosage = isset($p['dosage']) ? trim((string) $p['dosage']) : '';
            $form = isset($p['form']) ? trim((string) $p['form']) : '';

            $frequencyCode = isset($p['frequency_code']) ? trim((string) $p['frequency_code']) : '';
            $frequencyText = isset($p['frequency_text']) ? trim((string) $p['frequency_text']) : '';
            $durationDays = isset($p['duration_days']) ? (int) $p['duration_days'] : null;
            $quantity = isset($p['quantity']) ? (int) $p['quantity'] : null;
            $instructions = isset($p['instructions']) ? trim((string) $p['instructions']) : '';

            if ($generic === '') {
                continue;
            }

            // RA 6675: generic name first. Brand name is optional secondary info.
            $label = $generic;
            if ($brand !== '') {
                $label .= ' (' . $brand . ')';
            }

            $parts = [];
            if ($dosage !== '') $parts[] = $dosage;
            if ($form !== '') $parts[] = $form;

            $freq = $frequencyText !== '' ? $frequencyText : $frequencyCode;
            if ($freq !== '') $parts[] = $freq;
            if ($durationDays !== null && $durationDays > 0) $parts[] = $durationDays . ' day(s)';
            if ($quantity !== null && $quantity > 0) $parts[] = 'Qty ' . $quantity;

            $line = $label;
            if (count($parts)) {
                $line .= ' - ' . implode(', ', $parts);
            }
            if ($instructions !== '') {
                $line .= ' - Sig: ' . $instructions;
            }

            $lines[] = $line;
        }

        return count($lines) ? implode("\n", $lines) : null;
    }

    private function buildDiagnosisText(?array $diagnoses, ?string $fallback)
    {
        if ($fallback && trim($fallback) !== '') {
            return $fallback;
        }

        if (!$diagnoses || count($diagnoses) === 0) {
            return null;
        }

        $parts = [];
        foreach ($diagnoses as $d) {
            $code = isset($d['code']) ? trim((string) $d['code']) : '';
            $desc = isset($d['description']) ? trim((string) $d['description']) : '';
            $label = trim(($code ? $code . ' - ' : '') . $desc);
            if ($label !== '') {
                $parts[] = $label;
            }
        }

        return count($parts) ? implode("\n", $parts) : null;
    }

    private function applyEncounterPayload(array $payload)
    {
        // Keep legacy fields in sync for existing views/reports.
        if (isset($payload['bp_systolic']) || isset($payload['bp_diastolic'])) {
            $sys = $payload['bp_systolic'] ?? null;
            $dia = $payload['bp_diastolic'] ?? null;
            if ($sys !== null && $dia !== null) {
                $payload['blood_pressure'] = $sys . '/' . $dia;
            }
        }

        if (!isset($payload['treatment_plan']) && isset($payload['plan_management'])) {
            $payload['treatment_plan'] = $payload['plan_management'];
        }

        return $payload;
    }

    public function store(Request $request, Appointment $appointment)
    {
        DB::beginTransaction();
        
        try {
            $user = Auth::user();

            if (!$user->isDoctor() || $appointment->doctor_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $request->validate([
                'diagnosis' => 'required|string',
                'diagnoses' => 'nullable|array|max:20',
                'diagnoses.*.code' => 'nullable|string|max:10',
                'diagnoses.*.description' => 'required_with:diagnoses|string|max:255',

                'treatment_plan' => 'nullable|string',
                'prescription' => 'nullable|string',
                'prescriptions' => 'nullable|array|max:20',
                'prescriptions.*.medicine_id' => 'nullable|integer|exists:medicines,id',
                'prescriptions.*.generic_name' => 'required_with:prescriptions|string|max:255',
                'prescriptions.*.brand_name' => 'nullable|string|max:255',
                'prescriptions.*.dosage' => 'nullable|string|max:50',
                'prescriptions.*.form' => 'nullable|string|max:30',
                'prescriptions.*.frequency_code' => 'nullable|string|max:20',
                'prescriptions.*.frequency_text' => 'nullable|string|max:50',
                'prescriptions.*.duration_days' => 'nullable|integer|min:1|max:365',
                'prescriptions.*.quantity' => 'nullable|integer|min:0|max:10000',
                'prescriptions.*.instructions' => 'nullable|string|max:500',
                'prescriptions.*.allergy_override_confirmed' => 'nullable|boolean',
                'notes' => 'nullable|string',

                'documents' => 'nullable|array',
                'documents.medical_certificate' => 'nullable|array',
                'documents.medical_certificate.diagnosis' => 'nullable|string|max:2000',
                'documents.medical_certificate.findings' => 'nullable|string|max:4000',
                'documents.medical_certificate.recommendation' => 'nullable|array',
                'documents.medical_certificate.recommendation.type' => 'nullable|in:fit,unfit',
                'documents.medical_certificate.recommendation.days_unfit' => 'nullable|integer|min:1|max:365',
                'documents.medical_certificate.generated_at' => 'nullable|date',

                'documents.referral_letter' => 'nullable|array',
                'documents.referral_letter.referred_to' => 'nullable|array',
                'documents.referral_letter.referred_to.doctor_name' => 'nullable|string|max:255',
                'documents.referral_letter.referred_to.hospital_clinic' => 'nullable|string|max:255',
                'documents.referral_letter.referred_to.specialty' => 'nullable|string|max:255',
                'documents.referral_letter.reason' => 'nullable|string|max:4000',
                'documents.referral_letter.summary' => 'nullable|string|max:8000',
                'documents.referral_letter.urgency' => 'nullable|in:routine,urgent',
                'documents.referral_letter.included_lab_results' => 'nullable|array',
                'documents.referral_letter.included_lab_results.*.test_name' => 'nullable|string|max:255',
                'documents.referral_letter.included_lab_results.*.value' => 'nullable|string|max:255',
                'documents.referral_letter.included_lab_results.*.unit' => 'nullable|string|max:50',
                'documents.referral_letter.included_lab_results.*.normal_range' => 'nullable|string|max:255',
                'documents.referral_letter.generated_at' => 'nullable|date',

                'subjective_chief_complaint' => 'nullable|string',
                'subjective_hpi' => 'nullable|string',
                'objective_findings' => 'nullable|string',
                'assessment_notes' => 'nullable|string',
                'plan_management' => 'nullable|string',
                'plan_follow_up' => 'nullable|string',

                'height' => 'nullable|numeric|min:0|max:300',
                'weight' => 'nullable|numeric|min:0|max:500',
                'blood_pressure' => 'nullable|string|max:20',
                'bp_systolic' => 'nullable|integer|min:0|max:400',
                'bp_diastolic' => 'nullable|integer|min:0|max:300',
                'temperature' => 'nullable|numeric|min:30|max:45',
                'heart_rate' => 'nullable|integer|min:30|max:250',
                'respiratory_rate' => 'nullable|integer|min:0|max:80',
                'oxygen_saturation' => 'nullable|integer|min:0|max:100',
                'pain_scale' => 'nullable|integer|min:0|max:10',

                'lab_results' => 'nullable|string',
            ]);

            $existing = MedicalRecord::where('appointment_id', $appointment->id)->first();
            if ($existing && $existing->status === 'finalized') {
                return response()->json(['message' => 'Encounter is finalized and read-only'], 422);
            }

            $payload = $this->applyEncounterPayload($request->all());

            if ($request->has('prescriptions')) {
                $payload['prescriptions'] = $request->input('prescriptions');
                $payload['prescription'] = $this->buildPrescriptionTextFromStructured(
                    $request->input('prescriptions'),
                    $request->input('prescription')
                );
            }

            $payload['status'] = 'finalized';
            $payload['finalized_at'] = now();

            $medicalRecord = MedicalRecord::updateOrCreate(
                ['appointment_id' => $appointment->id],
                $payload
            );

            $appointment->update(['status' => 'completed']);
            if ($appointment->consultation_end_time === null) {
                $appointment->update(['consultation_end_time' => now()]);
            }

            $medicalRecord->load(['appointment.patient.user', 'appointment.doctor']);

            AuditLog::log($user->id, 'MEDICAL_RECORD_CREATE', "Medical record created for appointment #{$appointment->id}");

            DB::commit();

            return response()->json($medicalRecord, 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create medical record: ' . $e->getMessage()
            ], 500);
        }
    }

    public function saveDraft(Request $request, Appointment $appointment)
    {
        DB::beginTransaction();

        try {
            $user = Auth::user();

            if (!$user->isDoctor() || $appointment->doctor_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $request->validate([
                'diagnosis' => 'nullable|string',
                'diagnoses' => 'nullable|array|max:20',
                'diagnoses.*.code' => 'nullable|string|max:10',
                'diagnoses.*.description' => 'required_with:diagnoses|string|max:255',

                'treatment_plan' => 'nullable|string',
                'prescription' => 'nullable|string',
                'prescriptions' => 'nullable|array|max:20',
                'prescriptions.*.medicine_id' => 'nullable|integer|exists:medicines,id',
                'prescriptions.*.generic_name' => 'required_with:prescriptions|string|max:255',
                'prescriptions.*.brand_name' => 'nullable|string|max:255',
                'prescriptions.*.dosage' => 'nullable|string|max:50',
                'prescriptions.*.form' => 'nullable|string|max:30',
                'prescriptions.*.frequency_code' => 'nullable|string|max:20',
                'prescriptions.*.frequency_text' => 'nullable|string|max:50',
                'prescriptions.*.duration_days' => 'nullable|integer|min:1|max:365',
                'prescriptions.*.quantity' => 'nullable|integer|min:0|max:10000',
                'prescriptions.*.instructions' => 'nullable|string|max:500',
                'prescriptions.*.allergy_override_confirmed' => 'nullable|boolean',
                'notes' => 'nullable|string',

                'documents' => 'nullable|array',
                'documents.medical_certificate' => 'nullable|array',
                'documents.medical_certificate.diagnosis' => 'nullable|string|max:2000',
                'documents.medical_certificate.findings' => 'nullable|string|max:4000',
                'documents.medical_certificate.recommendation' => 'nullable|array',
                'documents.medical_certificate.recommendation.type' => 'nullable|in:fit,unfit',
                'documents.medical_certificate.recommendation.days_unfit' => 'nullable|integer|min:1|max:365',
                'documents.medical_certificate.generated_at' => 'nullable|date',

                'documents.referral_letter' => 'nullable|array',
                'documents.referral_letter.referred_to' => 'nullable|array',
                'documents.referral_letter.referred_to.doctor_name' => 'nullable|string|max:255',
                'documents.referral_letter.referred_to.hospital_clinic' => 'nullable|string|max:255',
                'documents.referral_letter.referred_to.specialty' => 'nullable|string|max:255',
                'documents.referral_letter.reason' => 'nullable|string|max:4000',
                'documents.referral_letter.summary' => 'nullable|string|max:8000',
                'documents.referral_letter.urgency' => 'nullable|in:routine,urgent',
                'documents.referral_letter.included_lab_results' => 'nullable|array',
                'documents.referral_letter.included_lab_results.*.test_name' => 'nullable|string|max:255',
                'documents.referral_letter.included_lab_results.*.value' => 'nullable|string|max:255',
                'documents.referral_letter.included_lab_results.*.unit' => 'nullable|string|max:50',
                'documents.referral_letter.included_lab_results.*.normal_range' => 'nullable|string|max:255',
                'documents.referral_letter.generated_at' => 'nullable|date',

                'subjective_chief_complaint' => 'nullable|string',
                'subjective_hpi' => 'nullable|string',
                'objective_findings' => 'nullable|string',
                'assessment_notes' => 'nullable|string',
                'plan_management' => 'nullable|string',
                'plan_follow_up' => 'nullable|string',

                'height' => 'nullable|numeric|min:0|max:300',
                'weight' => 'nullable|numeric|min:0|max:500',
                'blood_pressure' => 'nullable|string|max:20',
                'bp_systolic' => 'nullable|integer|min:0|max:400',
                'bp_diastolic' => 'nullable|integer|min:0|max:300',
                'temperature' => 'nullable|numeric|min:30|max:45',
                'heart_rate' => 'nullable|integer|min:30|max:250',
                'respiratory_rate' => 'nullable|integer|min:0|max:80',
                'oxygen_saturation' => 'nullable|integer|min:0|max:100',
                'pain_scale' => 'nullable|integer|min:0|max:10',

                'lab_results' => 'nullable|string',
            ]);

            $existing = MedicalRecord::where('appointment_id', $appointment->id)->first();
            if ($existing && $existing->status === 'finalized') {
                return response()->json(['message' => 'Encounter is finalized and read-only'], 422);
            }

            $payload = $this->applyEncounterPayload($request->all());
            $payload['diagnosis'] = $this->buildDiagnosisText($request->input('diagnoses'), $request->input('diagnosis'));

            if ($request->has('prescriptions')) {
                $payload['prescriptions'] = $request->input('prescriptions');
                $payload['prescription'] = $this->buildPrescriptionTextFromStructured(
                    $request->input('prescriptions'),
                    $request->input('prescription')
                );
            }

            $payload['status'] = 'draft';
            $payload['finalized_at'] = null;

            $medicalRecord = MedicalRecord::updateOrCreate(
                ['appointment_id' => $appointment->id],
                $payload
            );

            $medicalRecord->load(['appointment.patient.user', 'appointment.doctor']);

            AuditLog::log($user->id, 'MEDICAL_RECORD_DRAFT_SAVE', "Encounter draft saved for appointment #{$appointment->id}");

            DB::commit();

            return response()->json($medicalRecord);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to save draft: ' . $e->getMessage()
            ], 500);
        }
    }

    public function finalize(Request $request, Appointment $appointment)
    {
        DB::beginTransaction();

        try {
            $user = Auth::user();

            if (!$user->isDoctor() || $appointment->doctor_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $request->validate([
                'diagnosis' => 'nullable|string',
                'diagnoses' => 'nullable|array|max:20',
                'diagnoses.*.code' => 'nullable|string|max:10',
                'diagnoses.*.description' => 'required_with:diagnoses|string|max:255',

                'treatment_plan' => 'nullable|string',
                'prescription' => 'nullable|string',
                'prescriptions' => 'nullable|array|max:20',
                'prescriptions.*.medicine_id' => 'nullable|integer|exists:medicines,id',
                'prescriptions.*.generic_name' => 'required_with:prescriptions|string|max:255',
                'prescriptions.*.brand_name' => 'nullable|string|max:255',
                'prescriptions.*.dosage' => 'nullable|string|max:50',
                'prescriptions.*.form' => 'nullable|string|max:30',
                'prescriptions.*.frequency_code' => 'nullable|string|max:20',
                'prescriptions.*.frequency_text' => 'nullable|string|max:50',
                'prescriptions.*.duration_days' => 'nullable|integer|min:1|max:365',
                'prescriptions.*.quantity' => 'nullable|integer|min:0|max:10000',
                'prescriptions.*.instructions' => 'nullable|string|max:500',
                'prescriptions.*.allergy_override_confirmed' => 'nullable|boolean',
                'notes' => 'nullable|string',

                'documents' => 'nullable|array',
                'documents.medical_certificate' => 'nullable|array',
                'documents.medical_certificate.diagnosis' => 'nullable|string|max:2000',
                'documents.medical_certificate.findings' => 'nullable|string|max:4000',
                'documents.medical_certificate.recommendation' => 'nullable|array',
                'documents.medical_certificate.recommendation.type' => 'nullable|in:fit,unfit',
                'documents.medical_certificate.recommendation.days_unfit' => 'nullable|integer|min:1|max:365',
                'documents.medical_certificate.generated_at' => 'nullable|date',

                'documents.referral_letter' => 'nullable|array',
                'documents.referral_letter.referred_to' => 'nullable|array',
                'documents.referral_letter.referred_to.doctor_name' => 'nullable|string|max:255',
                'documents.referral_letter.referred_to.hospital_clinic' => 'nullable|string|max:255',
                'documents.referral_letter.referred_to.specialty' => 'nullable|string|max:255',
                'documents.referral_letter.reason' => 'nullable|string|max:4000',
                'documents.referral_letter.summary' => 'nullable|string|max:8000',
                'documents.referral_letter.urgency' => 'nullable|in:routine,urgent',
                'documents.referral_letter.included_lab_results' => 'nullable|array',
                'documents.referral_letter.included_lab_results.*.test_name' => 'nullable|string|max:255',
                'documents.referral_letter.included_lab_results.*.value' => 'nullable|string|max:255',
                'documents.referral_letter.included_lab_results.*.unit' => 'nullable|string|max:50',
                'documents.referral_letter.included_lab_results.*.normal_range' => 'nullable|string|max:255',
                'documents.referral_letter.generated_at' => 'nullable|date',

                'subjective_chief_complaint' => 'nullable|string',
                'subjective_hpi' => 'nullable|string',
                'objective_findings' => 'nullable|string',
                'assessment_notes' => 'nullable|string',
                'plan_management' => 'nullable|string',
                'plan_follow_up' => 'nullable|string',

                'height' => 'nullable|numeric|min:0|max:300',
                'weight' => 'nullable|numeric|min:0|max:500',
                'blood_pressure' => 'nullable|string|max:20',
                'bp_systolic' => 'nullable|integer|min:0|max:400',
                'bp_diastolic' => 'nullable|integer|min:0|max:300',
                'temperature' => 'nullable|numeric|min:30|max:45',
                'heart_rate' => 'nullable|integer|min:30|max:250',
                'respiratory_rate' => 'nullable|integer|min:0|max:80',
                'oxygen_saturation' => 'nullable|integer|min:0|max:100',
                'pain_scale' => 'nullable|integer|min:0|max:10',

                'lab_results' => 'nullable|string',
            ]);

            $existing = MedicalRecord::where('appointment_id', $appointment->id)->first();
            if ($existing && $existing->status === 'finalized') {
                return response()->json(['message' => 'Encounter is finalized and read-only'], 422);
            }

            $payload = $this->applyEncounterPayload($request->all());
            $payload['diagnosis'] = $this->buildDiagnosisText($request->input('diagnoses'), $request->input('diagnosis'));

            if ($request->has('prescriptions')) {
                $payload['prescriptions'] = $request->input('prescriptions');
                $payload['prescription'] = $this->buildPrescriptionTextFromStructured(
                    $request->input('prescriptions'),
                    $request->input('prescription')
                );
            }

            $payload['status'] = 'finalized';
            $payload['finalized_at'] = now();

            $medicalRecord = MedicalRecord::updateOrCreate(
                ['appointment_id' => $appointment->id],
                $payload
            );

            $appointment->update(['status' => 'completed']);
            if ($appointment->consultation_end_time === null) {
                $appointment->update(['consultation_end_time' => now()]);
            }

            // Auto-generate Bill if it doesn't exist
            if (!$appointment->billing) {
                $totalAmount = 0;
                $items = [];

                // Consultation Fee
                $consultationFee = 500.00;
                $totalAmount += $consultationFee;
                $items[] = [
                    'description' => 'Standard Consultation Fee',
                    'type' => 'consultation',
                    'amount' => $consultationFee,
                    'quantity' => 1,
                    'total' => $consultationFee,
                ];

                // Add Lab Requests
                if ($appointment->labRequests) {
                    foreach ($appointment->labRequests as $lab) {
                        $labFee = 350.00; // Mock standard fee
                        $totalAmount += $labFee;
                        $items[] = [
                            'description' => 'Lab Test: ' . $lab->test_type,
                            'type' => 'lab_test',
                            'amount' => $labFee,
                            'quantity' => 1,
                            'total' => $labFee,
                        ];
                    }
                }

                // Calculate PhilHealth Discount
                $discount = 0;
                if ($appointment->patient && $appointment->patient->philhealth_number) {
                    $discount = $totalAmount * 0.20; // 20% discount
                }

                $netAmount = $totalAmount - $discount;

                $billing = Billing::create([
                    'patient_id' => $appointment->patient_id,
                    'appointment_id' => $appointment->id,
                    'total_amount' => $totalAmount,
                    'philhealth_discount' => $discount,
                    'net_amount' => $netAmount,
                    'status' => 'pending',
                ]);

                foreach ($items as $item) {
                    $billing->items()->create($item);
                }

                // Send notification to patient
                if ($appointment->patient && $appointment->patient->user) {
                    $appointment->patient->user->notify(new SystemNotification(
                        'New Bill Generated',
                        'A new bill of PHP ' . number_format($netAmount, 2) . ' has been generated for your recent visit.',
                        'info'
                    ));
                }
            }

            $medicalRecord->load(['appointment.patient.user', 'appointment.doctor']);

            AuditLog::log($user->id, 'MEDICAL_RECORD_FINALIZE', "Encounter finalized for appointment #{$appointment->id}");

            DB::commit();

            return response()->json($medicalRecord);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to finalize encounter: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show(Appointment $appointment)
    {
        try {
            $user = Auth::user();

            if (($user->isPatient() && $appointment->patient_id !== $user->patient->id) ||
                ($user->isDoctor() && $appointment->doctor_id !== $user->id)) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $medicalRecord = MedicalRecord::where('appointment_id', $appointment->id)
                ->with(['appointment.patient.user', 'appointment.doctor'])
                ->first();

            if (!$medicalRecord) {
                return response()->json(['message' => 'Medical record not found'], 404);
            }

            return response()->json($medicalRecord);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch medical record: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getPatientRecords($patientId)
    {
        try {
            $user = Auth::user();

            if ($user->isPatient() && $user->patient->id != $patientId) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $records = MedicalRecord::whereHas('appointment', function($query) use ($patientId) {
                $query->where('patient_id', $patientId);
            })
            ->with(['appointment.doctor'])
            ->orderBy('created_at', 'desc')
            ->get();

            return response()->json($records);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch patient records: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, MedicalRecord $medicalRecord)
    {
        DB::beginTransaction();
        
        try {
            $user = Auth::user();
            $appointment = $medicalRecord->appointment;

            if ($medicalRecord->status === 'finalized') {
                return response()->json(['message' => 'Encounter is finalized and read-only'], 422);
            }

            if (!$user->isDoctor() || $appointment->doctor_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $request->validate([
                'diagnosis' => 'sometimes|required|string',
                'diagnoses' => 'nullable|array|max:20',
                'diagnoses.*.code' => 'nullable|string|max:10',
                'diagnoses.*.description' => 'required_with:diagnoses|string|max:255',
                'treatment_plan' => 'nullable|string',
                'prescription' => 'nullable|string',
                'notes' => 'nullable|string',
                'subjective_chief_complaint' => 'nullable|string',
                'subjective_hpi' => 'nullable|string',
                'objective_findings' => 'nullable|string',
                'assessment_notes' => 'nullable|string',
                'plan_management' => 'nullable|string',
                'plan_follow_up' => 'nullable|string',
                'height' => 'nullable|numeric|min:0|max:300',
                'weight' => 'nullable|numeric|min:0|max:500',
                'blood_pressure' => 'nullable|string|max:20',
                'bp_systolic' => 'nullable|integer|min:0|max:400',
                'bp_diastolic' => 'nullable|integer|min:0|max:300',
                'temperature' => 'nullable|numeric|min:30|max:45',
                'heart_rate' => 'nullable|integer|min:30|max:250',
                'respiratory_rate' => 'nullable|integer|min:0|max:80',
                'oxygen_saturation' => 'nullable|integer|min:0|max:100',
                'pain_scale' => 'nullable|integer|min:0|max:10',
                'lab_results' => 'nullable|string',

                'documents' => 'nullable|array',
                'documents.medical_certificate' => 'nullable|array',
                'documents.medical_certificate.diagnosis' => 'nullable|string|max:2000',
                'documents.medical_certificate.findings' => 'nullable|string|max:4000',
                'documents.medical_certificate.recommendation' => 'nullable|array',
                'documents.medical_certificate.recommendation.type' => 'nullable|in:fit,unfit',
                'documents.medical_certificate.recommendation.days_unfit' => 'nullable|integer|min:1|max:365',
                'documents.medical_certificate.generated_at' => 'nullable|date',

                'documents.referral_letter' => 'nullable|array',
                'documents.referral_letter.referred_to' => 'nullable|array',
                'documents.referral_letter.referred_to.doctor_name' => 'nullable|string|max:255',
                'documents.referral_letter.referred_to.hospital_clinic' => 'nullable|string|max:255',
                'documents.referral_letter.referred_to.specialty' => 'nullable|string|max:255',
                'documents.referral_letter.reason' => 'nullable|string|max:4000',
                'documents.referral_letter.summary' => 'nullable|string|max:8000',
                'documents.referral_letter.urgency' => 'nullable|in:routine,urgent',
                'documents.referral_letter.included_lab_results' => 'nullable|array',
                'documents.referral_letter.included_lab_results.*.test_name' => 'nullable|string|max:255',
                'documents.referral_letter.included_lab_results.*.value' => 'nullable|string|max:255',
                'documents.referral_letter.included_lab_results.*.unit' => 'nullable|string|max:50',
                'documents.referral_letter.included_lab_results.*.normal_range' => 'nullable|string|max:255',
                'documents.referral_letter.generated_at' => 'nullable|date',
            ]);

            $payload = $this->applyEncounterPayload($request->all());
            if ($request->has('diagnoses') || $request->has('diagnosis')) {
                $payload['diagnosis'] = $this->buildDiagnosisText($request->input('diagnoses'), $request->input('diagnosis'));
            }

            $medicalRecord->update($payload);
            $medicalRecord->load(['appointment.patient.user', 'appointment.doctor']);

            AuditLog::log($user->id, 'MEDICAL_RECORD_UPDATE', "Medical record updated for appointment #{$appointment->id}");

            DB::commit();

            return response()->json($medicalRecord);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update medical record: ' . $e->getMessage()
            ], 500);
        }
    }
}