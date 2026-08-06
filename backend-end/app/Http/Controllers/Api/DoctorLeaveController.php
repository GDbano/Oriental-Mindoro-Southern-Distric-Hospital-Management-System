<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DoctorLeave;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\AuditLog;

class DoctorLeaveController extends Controller
{
    /**
     * Display a listing of doctor leaves.
     * Admin/Staff can see all, doctors can see their own.
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            $query = DoctorLeave::with(['doctor', 'reviewer'])->orderBy('created_at', 'desc');

            if ($user->isDoctor()) {
                $query->where('doctor_id', $user->id);
            }

            // Optional filters
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            if ($request->has('doctor_id') && ($user->isAdmin() || $user->isStaff())) {
                $query->where('doctor_id', $request->doctor_id);
            }

            $leaves = $query->get();
            return response()->json($leaves);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch doctor leaves: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created doctor leave request.
     */
    public function store(Request $request)
    {
        DB::beginTransaction();
        try {
            $user = Auth::user();

            // Typically doctors request their own leave
            // Admin might do it on their behalf, so let's allow specifying doctor_id if admin
            $doctorId = $user->id;
            
            if ($user->isAdmin() || $user->isStaff()) {
                $request->validate([
                    'doctor_id' => 'required|exists:users,id',
                ]);
                $doctorId = $request->doctor_id;
            } else if (!$user->isDoctor()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $request->validate([
                'start_date' => 'required|date|after_or_equal:today',
                'end_date' => 'required|date|after_or_equal:start_date',
                'reason' => 'required|string|max:500',
            ]);

            // Check if there's already an exact overlapping leave
            $exists = DoctorLeave::where('doctor_id', $doctorId)
                ->where('start_date', $request->start_date)
                ->where('end_date', $request->end_date)
                ->exists();

            if ($exists) {
                return response()->json(['message' => 'A leave request for these exact dates already exists.'], 422);
            }

            // If Admin creates it, it can be auto-approved
            $status = ($user->isAdmin() || $user->isStaff()) ? 'approved' : 'pending';
            $reviewedBy = ($status === 'approved') ? $user->id : null;

            $leave = DoctorLeave::create([
                'doctor_id' => $doctorId,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'reason' => $request->reason,
                'status' => $status,
                'reviewed_by' => $reviewedBy,
            ]);

            AuditLog::log(
                $user->id,
                'DOCTOR_LEAVE_CREATE',
                "Leave request #{$leave->id} created for doctor #{$doctorId}"
            );

            DB::commit();

            return response()->json([
                'message' => 'Leave request submitted successfully!',
                'leave' => $leave
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create leave request: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified leave request status (Approve/Reject).
     */
    public function updateStatus(Request $request, DoctorLeave $leave)
    {
        DB::beginTransaction();
        try {
            $user = Auth::user();

            if (!$user->isAdmin() && !$user->isStaff()) {
                return response()->json(['message' => 'Unauthorized. Only admins/staff can review leaves.'], 403);
            }

            $request->validate([
                'status' => 'required|in:approved,rejected',
                'admin_notes' => 'nullable|string|max:500',
            ]);

            $leave->update([
                'status' => $request->status,
                'admin_notes' => $request->admin_notes,
                'reviewed_by' => $user->id,
            ]);

            AuditLog::log(
                $user->id,
                'DOCTOR_LEAVE_UPDATE',
                "Leave request #{$leave->id} status updated to {$request->status}"
            );

            DB::commit();

            return response()->json([
                'message' => 'Leave request status updated successfully!',
                'leave' => $leave->load(['doctor', 'reviewer'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update leave request status: ' . $e->getMessage()
            ], 500);
        }
    }
}
