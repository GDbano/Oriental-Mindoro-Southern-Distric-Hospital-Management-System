<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user->isAdmin() && !$user->isStaff()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $query = Inventory::query();

            if ($request->has('category')) {
                $query->where('category', $request->category);
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }

            if ($request->has('stock_status')) {
                if ($request->stock_status === 'low') {
                    $query->lowStock();
                } elseif ($request->stock_status === 'out') {
                    $query->where('quantity', 0);
                }
            }

            $inventory = $query->orderBy('name')
                ->paginate($request->get('per_page', 15));

            return response()->json($inventory);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch inventory: ' . $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        DB::beginTransaction();
        
        try {
            $user = Auth::user();

            if (!$user->isAdmin() && !$user->isStaff()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'category' => 'required|string|max:100',
                'quantity' => 'required|integer|min:0',
                'min_stock' => 'required|integer|min:0',
                'price' => 'nullable|numeric|min:0',
                'expiry_date' => 'nullable|date|after:today',
                'supplier' => 'nullable|string|max:255',
            ]);

            $inventory = Inventory::create($request->all());

            AuditLog::log($user->id, 'INVENTORY_CREATE', "Inventory item {$inventory->name} created");

            DB::commit();

            return response()->json($inventory, 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create inventory item: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show(Inventory $inventory)
    {
        try {
            $user = Auth::user();

            if (!$user->isAdmin() && !$user->isStaff()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            return response()->json($inventory);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch inventory item: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, Inventory $inventory)
    {
        DB::beginTransaction();
        
        try {
            $user = Auth::user();

            if (!$user->isAdmin() && !$user->isStaff()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'category' => 'sometimes|required|string|max:100',
                'quantity' => 'sometimes|required|integer|min:0',
                'min_stock' => 'sometimes|required|integer|min:0',
                'price' => 'nullable|numeric|min:0',
                'expiry_date' => 'nullable|date',
                'supplier' => 'nullable|string|max:255',
                'is_active' => 'sometimes|boolean',
            ]);

            $inventory->update($request->all());

            AuditLog::log($user->id, 'INVENTORY_UPDATE', "Inventory item {$inventory->name} updated");

            DB::commit();

            return response()->json($inventory);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update inventory item: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Inventory $inventory)
    {
        DB::beginTransaction();
        
        try {
            $user = Auth::user();

            if (!$user->isAdmin()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            AuditLog::log($user->id, 'INVENTORY_DELETE', "Inventory item {$inventory->name} deleted");

            $inventory->delete();

            DB::commit();

            return response()->json(['message' => 'Inventory item deleted successfully']);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete inventory item: ' . $e->getMessage()
            ], 500);
        }
    }

    public function lowStock()
    {
        try {
            $user = Auth::user();

            if (!$user->isAdmin() && !$user->isStaff()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $lowStockItems = Inventory::lowStock()->get();

            return response()->json($lowStockItems);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch low stock items: ' . $e->getMessage()
            ], 500);
        }
    }

    public function expiringSoon(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user->isAdmin() && !$user->isStaff()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $days = $request->get('days', 30);
            $expiringItems = Inventory::expiringSoon($days)->get();

            return response()->json($expiringItems);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch expiring items: ' . $e->getMessage()
            ], 500);
        }
    }
}