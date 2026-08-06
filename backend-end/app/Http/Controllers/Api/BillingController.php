<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Billing;
use App\Models\BillingItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Notifications\SystemNotification;

class BillingController extends Controller
{
    /**
     * Get all bills (for Admin/Staff Cashier Dashboard)
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        if (!($user->isAdmin() || $user->isStaff())) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $status = $request->query('status', 'all');

        $query = Billing::with(['patient.user', 'appointment.doctor']);

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        return response()->json($query->latest()->get());
    }

    /**
     * Get bills for a specific patient
     */
    public function getPatientBills(Request $request, $patientId)
    {
        $user = Auth::user();

        // Allow if staff/admin, or if it's the patient themselves
        if (!($user->isAdmin() || $user->isStaff()) && $user->patient?->id != $patientId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $bills = Billing::with(['items', 'appointment.department'])
            ->where('patient_id', $patientId)
            ->latest()
            ->get();

        return response()->json($bills);
    }

    /**
     * Generate a bill for an appointment
     */
    public function generateForAppointment(Request $request, $appointmentId)
    {
        $user = Auth::user();

        if (!($user->isAdmin() || $user->isStaff() || $user->isDoctor())) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $appointment = Appointment::with(['patient', 'medicalRecord.prescriptions', 'labRequests'])->findOrFail($appointmentId);

        // Check if a bill already exists
        if ($appointment->billing) {
            return response()->json(['message' => 'Bill already exists for this appointment', 'billing' => $appointment->billing], 400);
        }

        try {
            DB::beginTransaction();

            $totalAmount = 0;
            $items = [];

            // 1. Consultation Fee (Standard 500)
            $consultationFee = 500.00;
            $totalAmount += $consultationFee;
            $items[] = [
                'description' => 'Standard Consultation Fee',
                'type' => 'consultation',
                'amount' => $consultationFee,
                'quantity' => 1,
                'total' => $consultationFee,
            ];

            // 2. Add Lab Requests
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
                // Flat 20% discount if PhilHealth exists
                $discount = $totalAmount * 0.20;
            }

            $netAmount = $totalAmount - $discount;

            // Create Billing Record
            $billing = Billing::create([
                'patient_id' => $appointment->patient_id,
                'appointment_id' => $appointment->id,
                'total_amount' => $totalAmount,
                'philhealth_discount' => $discount,
                'net_amount' => $netAmount,
                'status' => 'pending',
            ]);

            // Create Billing Items
            foreach ($items as $item) {
                $billing->items()->create($item);
            }

            DB::commit();

            // Send notification to patient
            if ($appointment->patient && $appointment->patient->user) {
                $appointment->patient->user->notify(new SystemNotification(
                    'New Bill Generated',
                    'A new bill of PHP ' . number_format($netAmount, 2) . ' has been generated for your recent visit.',
                    'info'
                ));
            }

            return response()->json(['message' => 'Bill generated successfully', 'billing' => $billing->load('items')]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to generate bill', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Mark a bill as paid
     */
    public function markAsPaid(Request $request, $id)
    {
        $user = Auth::user();

        if (!($user->isAdmin() || $user->isStaff())) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'payment_method' => 'required|string|in:cash,card,gcash'
        ]);

        $billing = Billing::with('patient.user')->findOrFail($id);

        if ($billing->status === 'paid') {
            return response()->json(['message' => 'Bill is already paid'], 400);
        }

        $billing->update([
            'status' => 'paid',
            'payment_method' => $request->payment_method,
            'paid_at' => now(),
        ]);

        // Notify patient
        if ($billing->patient && $billing->patient->user) {
            $billing->patient->user->notify(new SystemNotification(
                'Payment Received',
                'Your payment of PHP ' . number_format($billing->net_amount, 2) . ' has been received. Thank you!',
                'success'
            ));
        }

        return response()->json(['message' => 'Bill marked as paid', 'billing' => $billing]);
    }
}
