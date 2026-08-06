<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DoctorMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        if (!Auth::check()) {
            return redirect('/login')->with('error', 'Please login first.');
        }

        if (!Auth::user()->isDoctor()) {
            return redirect('/dashboard')->with('error', 'Access denied. Doctors only.');
        }

        return $next($request);
    }
}