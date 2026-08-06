<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PatientMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        if (!Auth::check()) {
            return redirect('/login')->with('error', 'Please login first.');
        }

        if (!Auth::user()->isPatient()) {
            return redirect('/dashboard')->with('error', 'Access denied. Patients only.');
        }

        return $next($request);
    }
}