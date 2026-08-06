<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Patient;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    use ApiResponses;
    public function register(Request $request)
    {
        \Log::info('Registration attempt', $request->all());

        $validationRules = [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => 'required|in:patient,doctor,staff,admin',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
        ];

        if ($request->role === 'patient') {
            $validationRules['date_of_birth'] = 'required|date|before:today';
            $validationRules['gender'] = 'required|in:male,female,other';
            $validationRules['blood_type'] = 'nullable|string|max:10';
            $validationRules['allergies'] = 'nullable|string';
            $validationRules['medical_history'] = 'nullable|string';
            $validationRules['emergency_contact_name'] = 'nullable|string|max:255';
            $validationRules['emergency_contact_phone'] = 'nullable|string|max:20';
        }

        if ($request->role === 'doctor') {
            $validationRules['specialization'] = 'required|string|max:255';
            $validationRules['license_number'] = 'required|string|max:100';
        }

        $request->validate($validationRules);

        try {
            $userData = [
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => $request->role,
                'phone' => $request->phone,
                'address' => $request->address,
            ];

            // Add doctor-specific fields only for doctors
            if ($request->role === 'doctor') {
                $userData['specialization'] = $request->specialization;
                $userData['license_number'] = $request->license_number;
            }

            // Create user
            $user = User::create($userData);

            // Create patient record if role is patient
            if ($request->role === 'patient') {
                Patient::create([
                    'user_id' => $user->id,
                    'date_of_birth' => $request->date_of_birth,
                    'gender' => $request->gender,
                    'blood_type' => $request->blood_type,
                    'allergies' => $request->allergies,
                    'medical_history' => $request->medical_history,
                    'emergency_contact_name' => $request->emergency_contact_name,
                    'emergency_contact_phone' => $request->emergency_contact_phone,
                ]);
            }

            // Load relationships
            if ($user->role === 'patient') {
                $user->load('patient');
            }

            // Create token for API authentication
            $token = $user->createToken('auth_token')->plainTextToken;
            
            return response()->json([
                'message' => 'User registered successfully',
                'user' => $user,
                'access_token' => $token,
                'token_type' => 'Bearer',
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Registration error: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Registration failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Login user and create token
     */
    public function login(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|email',
                'password' => 'required',
            ]);

            // Attempt to authenticate user
            if (!Auth::attempt($request->only('email', 'password'))) {
                throw ValidationException::withMessages([
                    'email' => ['The provided credentials are incorrect.'],
                ]);
            }

            $user = User::where('email', $request->email)->firstOrFail();
            
            // Load relationships based on role
            if ($user->isPatient()) {
                $user->load('patient');
            }

            // Create new token
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'message' => 'Login successful',
                'user' => $user,
                'access_token' => $token,
                'token_type' => 'Bearer',
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Invalid login credentials',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Login error: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Login failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Logout user (revoke token)
     */
    public function logout(Request $request)
    {
        try {
            $request->user()->currentAccessToken()->delete();
            
            return response()->json([
                'message' => 'Logged out successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('Logout error: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Logout failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get authenticated user details
     */
    public function me(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'message' => 'User not authenticated'
                ], 401);
            }

            // Load relationships based on role
            if ($user->isPatient()) {
                $user->load('patient');
            }

            return response()->json([
                'user' => $user
            ]);

        } catch (\Exception $e) {
            \Log::error('Get user error: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Failed to get user details: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Refresh token (optional - for future use)
     */
    public function refresh(Request $request)
    {
        try {
            $user = $request->user();
            $user->tokens()->delete(); // Delete all existing tokens
            
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'access_token' => $token,
                'token_type' => 'Bearer',
            ]);
        } catch (\Exception $e) {
            \Log::error('Token refresh error: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Token refresh failed'
            ], 500);
        }
    }
}