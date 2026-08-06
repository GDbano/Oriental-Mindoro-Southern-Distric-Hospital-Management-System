<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Medicine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MedicineController extends Controller
{
    private function toDto(Medicine $medicine): array
    {
        $inv = $medicine->inventory;
        $qty = $inv ? (int) $inv->quantity : null;
        $min = $inv ? (int) $inv->min_stock : null;

        $stockStatus = null;
        if ($inv) {
            if ($qty <= 0) {
                $stockStatus = 'out_of_stock';
            } elseif ($qty <= $min) {
                $stockStatus = 'low_stock';
            } else {
                $stockStatus = 'in_stock';
            }
        }

        return [
            'id' => $medicine->id,
            'generic_name' => $medicine->generic_name,
            'brand_name' => $medicine->brand_name,
            'default_dosage' => $medicine->default_dosage,
            'default_form' => $medicine->default_form,
            'inventory_id' => $medicine->inventory_id,
            'stock_quantity' => $qty,
            'min_stock' => $min,
            'stock_status' => $stockStatus,
        ];
    }

    public function search(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user || !($user->isDoctor() || $user->isStaff() || $user->isAdmin())) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $q = trim((string) $request->query('q', ''));
            if ($q === '') {
                return response()->json([]);
            }

            $limit = (int) $request->query('limit', 15);
            $limit = max(1, min(30, $limit));

            $meds = Medicine::query()
                ->with('inventory:id,quantity,min_stock,is_active')
                ->where('is_active', true)
                ->where(function ($qb) use ($q) {
                    $qb->where('generic_name', 'like', "%{$q}%")
                        ->orWhere('brand_name', 'like', "%{$q}%");
                })
                ->orderBy('generic_name')
                ->limit($limit)
                ->get();

            return response()->json($meds->map(fn (Medicine $m) => $this->toDto($m))->values());
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to search medicines: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function show(Medicine $medicine)
    {
        try {
            $user = Auth::user();
            if (!$user || !($user->isDoctor() || $user->isStaff() || $user->isAdmin())) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $medicine->load('inventory:id,quantity,min_stock,is_active');

            return response()->json($this->toDto($medicine));
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to fetch medicine: ' . $e->getMessage(),
            ], 500);
        }
    }
}
