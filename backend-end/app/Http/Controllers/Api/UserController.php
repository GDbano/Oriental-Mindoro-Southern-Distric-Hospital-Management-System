<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Patient;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    public function index(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user->isAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $query = User::with('patient');

            if ($request->has('role')) {
                $query->where('role', $request->role);
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            }

            $users = $query->orderBy('name')
                ->paginate($request->get('per_page', 15));

            return response()->json($users);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch users: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show(User $user)
    {
        try {
            $currentUser = Auth::user();

            if ($currentUser->id !== $user->id && !$currentUser->isAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            if ($user->isPatient()) {
                $user->load('patient');
            }

            return response()->json($user);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch user: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, User $user)
    {
        DB::beginTransaction();

        try {
            $currentUser = Auth::user();

            if ($currentUser->id !== $user->id && !$currentUser->isAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $rules = [
                'name' => 'sometimes|string|max:255',
                'email' => 'sometimes|string|email|max:255|unique:users,email,' . $user->id,
                'phone' => 'nullable|string|max:20',
                'address' => 'nullable|string|max:500',
                'is_active' => 'sometimes|boolean',
            ];

            if ($currentUser->isAdmin()) {
                $rules['role'] = 'sometimes|in:patient,doctor,staff,records_officer,admin';
                $rules['specialization'] = 'nullable|string|max:255';
                $rules['license_number'] = 'nullable|string|max:100';
            }

            $request->validate($rules);

            $user->update($request->all());

            if ($user->isPatient() && $user->patient) {
                $patientData = $request->only([
                    'date_of_birth',
                    'gender',
                    'blood_type',
                    'allergies',
                    'medical_history',
                    'emergency_contact_name',
                    'emergency_contact_phone',
                    'insurance_info'
                ]);

                $user->patient->update(array_filter($patientData));
            }

            $user->load('patient');

            AuditLog::log($currentUser->id, 'USER_UPDATE', "User {$user->name} profile updated");

            DB::commit();

            return response()->json($user);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update user: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy(User $user)
    {
        DB::beginTransaction();

        try {
            $currentUser = Auth::user();

            if (!$currentUser->isAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            if ($currentUser->id === $user->id) {
                return response()->json(['message' => 'Cannot delete your own account'], 422);
            }

            AuditLog::log($currentUser->id, 'USER_DELETE', "User {$user->name} deleted");

            $user->delete();

            DB::commit();

            return response()->json(['message' => 'User deleted successfully']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete user: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getPatients(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user->isAdmin() && !$user->isDoctor() && !$user->isStaff() && !$user->isRecordsOfficer()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $query = Patient::with('user');

            // Doctors: only their own patients (patients they have appointments with)
            if ($user->isDoctor()) {
                $query->whereHas('appointments', function ($q) use ($user) {
                    $q->where('doctor_id', $user->id);
                });
            }

            if ($request->has('patient_id')) {
                $query->where('id', $request->patient_id);
            }

            if ($request->has('search') && $request->search) {
                $search = $request->search;

                // Admins/staff can search all patients, including those not yet assigned to a doctor
                // Doctors can search within their own patient scope
                $query->where(function ($q) use ($search) {
                    $q->whereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    })->orWhere('hospital_number', 'like', "%{$search}%");
                });
            }

            $patients = $query->orderBy('created_at', 'desc')
                ->paginate($request->get('per_page', 15));

            return response()->json($patients);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch patients: ' . $e->getMessage()
            ], 500);
        }
    }

    public function changePassword(Request $request, User $user)
    {
        DB::beginTransaction();

        try {
            $currentUser = Auth::user();

            if ($currentUser->id !== $user->id && !$currentUser->isAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $request->validate([
                'current_password' => $currentUser->isAdmin() ? 'nullable' : 'required',
                'password' => ['required', 'confirmed', Rules\Password::defaults()],
            ]);

            if (!$currentUser->isAdmin() && !Hash::check($request->current_password, $user->password)) {
                return response()->json(['message' => 'Current password is incorrect'], 422);
            }

            $user->update([
                'password' => Hash::make($request->password)
            ]);

            AuditLog::log($currentUser->id, 'PASSWORD_CHANGE', "Password changed for user {$user->name}");

            DB::commit();

            return response()->json(['message' => 'Password updated successfully']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to change password: ' . $e->getMessage()
            ], 500);
        }
    }
}