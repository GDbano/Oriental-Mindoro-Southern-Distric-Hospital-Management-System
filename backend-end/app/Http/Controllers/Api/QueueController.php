<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\QueueCounter;
use App\Models\QueueTicket;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class QueueController extends Controller
{
    public function generate(Request $request)
    {
        $user = Auth::user();

        if (!$user || !($user->isStaff() || $user->isAdmin())) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'department_id' => ['required', 'exists:departments,id'],
            'patient_type' => ['required', 'in:Regular,Senior Citizen,PWD,Pregnant'],
        ]);

        $department = Department::findOrFail($validated['department_id']);

        $patientType = $validated['patient_type'];
        $isPriority = in_array($patientType, ['Senior Citizen', 'PWD', 'Pregnant'], true);
        $prefix = $isPriority ? 'PR' : (string) $department->code;
        $prefix = Str::upper(trim($prefix));
        $queueDate = today()->toDateString();
        $avgServiceMinutes = 10;

        $ticket = DB::transaction(function () use ($queueDate, $department, $prefix, $patientType, $isPriority, $user) {
            $counter = QueueCounter::where('queue_date', $queueDate)
                ->where('department_id', $department->id)
                ->where('prefix', $prefix)
                ->lockForUpdate()
                ->first();

            if (!$counter) {
                try {
                    $counter = QueueCounter::create([
                        'queue_date' => $queueDate,
                        'department_id' => $department->id,
                        'prefix' => $prefix,
                        'last_sequence' => 0,
                    ]);
                } catch (QueryException $e) {
                    // Another request created it concurrently; re-select with lock.
                    $counter = QueueCounter::where('queue_date', $queueDate)
                        ->where('department_id', $department->id)
                        ->where('prefix', $prefix)
                        ->lockForUpdate()
                        ->firstOrFail();
                }
            }

            $nextSequence = (int) $counter->last_sequence + 1;
            $counter->last_sequence = $nextSequence;
            $counter->save();

            $queueNumber = sprintf('%s-%03d', $prefix, $nextSequence);

            return QueueTicket::create([
                'queue_date' => $queueDate,
                'department_id' => $department->id,
                'patient_type' => $patientType,
                'is_priority' => $isPriority,
                'prefix' => $prefix,
                'sequence' => $nextSequence,
                'queue_number' => $queueNumber,
                'status' => 'waiting',
                'created_by' => $user->id,
            ]);
        });

        // Estimated wait: priority served first.
        $priorityAhead = QueueTicket::where('queue_date', $queueDate)
            ->where('department_id', $department->id)
            ->where('is_priority', true)
            ->where('status', 'waiting')
            ->where(function ($q) use ($ticket) {
                // If this ticket is priority, only count earlier priority sequences.
                if ($ticket->is_priority) {
                    $q->where('sequence', '<', $ticket->sequence);
                }
            })
            ->count();

        $regularAhead = 0;
        if (!$ticket->is_priority) {
            $regularAhead = QueueTicket::where('queue_date', $queueDate)
                ->where('department_id', $department->id)
                ->where('is_priority', false)
                ->where('status', 'waiting')
                ->where('sequence', '<', $ticket->sequence)
                ->count();
        }

        $aheadCount = $ticket->is_priority ? $priorityAhead : ($priorityAhead + $regularAhead);
        $estimatedWaitMinutes = $aheadCount * $avgServiceMinutes;

        return response()->json([
            'queue_number' => $ticket->queue_number,
            'department' => [
                'id' => $department->id,
                'code' => $department->code,
                'name' => $department->name,
            ],
            'date' => $queueDate,
            'time' => now()->format('H:i'),
            'estimated_wait_minutes' => $estimatedWaitMinutes,
            'message' => 'Queue number generated successfully',
        ], 201);
    }
}
