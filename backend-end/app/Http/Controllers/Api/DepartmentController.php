<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function index(Request $request)
    {
        $departments = Department::active()
            ->orderBy('name')
            ->get(['id', 'code', 'name']);

        return response()->json($departments);
    }
}
