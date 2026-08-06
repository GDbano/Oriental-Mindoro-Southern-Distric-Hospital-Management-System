<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        if (!Auth::check()) {
            return redirect('/login')->with('error', 'Please login first.');
        }

        if (!Auth::user()->isAdmin()) {
            return redirect('/dashboard')->with('error', 'Access denied. Admin only.');
        }

        return $next($request);
    }
}