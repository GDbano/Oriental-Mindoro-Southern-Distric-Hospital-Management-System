<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class BarangayController extends Controller
{
    public function search(Request $request)
    {
        $user = Auth::user();
        if (!$user || !($user->isStaff() || $user->isRecordsOfficer() || $user->isAdmin())) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'q' => ['required', 'string', 'min:2', 'max:255'],
        ]);

        $q = trim($validated['q']);

        $results = DB::table('barangays')
            ->where('name', 'like', '%' . $q . '%')
            ->orderBy('name')
            ->limit(10)
            ->get(['id', 'name', 'municipality', 'province']);

        return response()->json([
            'results' => $results,
            'count' => $results->count(),
        ]);
    }
}
