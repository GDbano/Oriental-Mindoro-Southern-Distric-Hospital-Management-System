<?php

namespace App\Http\Controllers\Web;

use Illuminate\Routing\Controller as BaseController;
use App\Models\User;
use App\Models\Patient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class UserController extends BaseController
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    public function index()
    {
        $user = Auth::user();

        if (!$user->isAdmin()) {
            return redirect('/dashboard')->with('error', 'Access denied. Admin only.');
        }

        $users = User::with('patient')
            ->orderBy('name')
            ->paginate(15);

        return view('users.index', compact('users'));
    }

    public function patients()
    {
        $user = Auth::user();

        if (!$user->isAdmin() && !$user->isDoctor()) {
            return redirect('/dashboard')->with('error', 'Access denied.');
        }

        $patients = Patient::with('user')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return view('patients.index', compact('patients'));
    }

    public function profile()
    {
        $user = Auth::user();
        
        if ($user->isPatient()) {
            $user->load('patient');
        }

        return view('profile.show', compact('user'));
    }

    public function updateProfile(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'current_password' => 'nullable|required_with:new_password',
            'new_password' => 'nullable|min:8|confirmed',
            // Patient specific fields
            'date_of_birth' => 'nullable|date|before:today',
            'gender' => 'nullable|in:male,female,other',
            'blood_type' => 'nullable|string|max:10',
            'allergies' => 'nullable|string|max:1000',
            'medical_history' => 'nullable|string|max:2000',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
        ]);

        // Update basic user info
        $user->update($request->only(['name', 'email', 'phone', 'address']));

        // Update password if provided
        if ($request->filled('current_password')) {
            if (!Hash::check($request->current_password, $user->password)) {
                return back()->withErrors(['current_password' => 'Current password is incorrect.']);
            }

            $user->update([
                'password' => Hash::make($request->new_password)
            ]);
        }

        // Update patient details if exists
        if ($user->isPatient() && $user->patient) {
            $patientData = $request->only([
                'date_of_birth', 'gender', 'blood_type', 'allergies', 
                'medical_history', 'emergency_contact_name', 'emergency_contact_phone'
            ]);
            
            $user->patient->update($patientData);
        }

        // Update doctor details if exists
        if ($user->isDoctor()) {
            $user->update($request->only(['specialization', 'license_number']));
        }

        return redirect('/profile')->with('success', 'Profile updated successfully!');
    }

    public function show(User $user)
    {
        $currentUser = Auth::user();

        // Users can view their own profile, admins can view any
        if ($currentUser->id !== $user->id && !$currentUser->isAdmin()) {
            return redirect('/dashboard')->with('error', 'Access denied.');
        }

        if ($user->isPatient()) {
            $user->load('patient');
        }

        return view('users.show', compact('user'));
    }

    public function destroy(User $user)
    {
        $currentUser = Auth::user();

        if (!$currentUser->isAdmin()) {
            return redirect('/dashboard')->with('error', 'Access denied. Admin only.');
        }

        // Prevent self-deletion
        if ($currentUser->id === $user->id) {
            return redirect('/users')->with('error', 'You cannot delete your own account.');
        }

        $user->delete();

        return redirect('/users')->with('success', 'User deleted successfully.');
    }
}