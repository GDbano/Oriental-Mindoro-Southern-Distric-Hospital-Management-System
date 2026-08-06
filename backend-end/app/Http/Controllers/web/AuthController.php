<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Patient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class AuthController extends Controller
{
    public function showLogin()
    {
        if (Auth::check()) {
            return redirect('/dashboard');
        }
        return view('auth.login');
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $credentials = $request->only('email', 'password');
        $remember = $request->has('remember');

        if (Auth::attempt($credentials, $remember)) {
            $request->session()->regenerate();
            
            // Redirect based on role
            $user = Auth::user();
            switch ($user->role) {
                case 'admin':
                    return redirect()->intended('/dashboard');
                case 'doctor':
                    return redirect()->intended('/dashboard');
                case 'patient':
                    return redirect()->intended('/dashboard');
                default:
                    return redirect()->intended('/dashboard');
            }
        }

        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ])->withInput($request->except('password'));
    }

    public function showRegister()
    {
        if (Auth::check()) {
            return redirect('/dashboard');
        }
        return view('auth.register');
    }

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => 'required|in:patient,doctor',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            // Patient specific fields
            'date_of_birth' => 'required_if:role,patient|date|before:today',
            'gender' => 'required_if:role,patient|in:male,female,other',
            'blood_type' => 'nullable|string|max:10',
            // Doctor specific fields
            'specialization' => 'required_if:role,doctor|string|max:255',
            'license_number' => 'required_if:role,doctor|string|max:100',
        ]);

        // Create user
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'phone' => $request->phone,
            'address' => $request->address,
            'specialization' => $request->specialization,
            'license_number' => $request->license_number,
        ]);

        // Create patient record if role is patient
        if ($request->role === 'patient') {
            Patient::create([
                'user_id' => $user->id,
                'date_of_birth' => $request->date_of_birth,
                'gender' => $request->gender,
                'blood_type' => $request->blood_type,
                'allergies' => $request->allergies,
                'medical_history' => $request->medical_history,
            ]);
        }

        // Auto login after registration
        Auth::login($user);

        return redirect('/dashboard')->with('success', 'Account created successfully!');
    }

    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }
}