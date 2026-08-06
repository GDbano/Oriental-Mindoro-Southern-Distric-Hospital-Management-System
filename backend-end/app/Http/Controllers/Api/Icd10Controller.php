<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Icd10Code;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class Icd10Controller extends Controller
{
    private function getDoctorUsageCounts(int $doctorId): array
    {
        // Lightweight boosting: look at the most recent finalized encounters.
        // This avoids DB-specific JSON querying and works across MySQL/MariaDB.
        $rows = DB::table('medical_records')
            ->join('appointments', 'appointments.id', '=', 'medical_records.appointment_id')
            ->where('appointments.doctor_id', $doctorId)
            ->where('medical_records.status', 'finalized')
            ->whereNotNull('medical_records.diagnoses')
            ->orderByDesc('medical_records.finalized_at')
            ->limit(200)
            ->get(['medical_records.diagnoses']);

        $counts = [];

        foreach ($rows as $row) {
            $decoded = json_decode($row->diagnoses, true);
            if (!is_array($decoded)) {
                continue;
            }

            foreach ($decoded as $dx) {
                if (!is_array($dx)) {
                    continue;
                }

                $code = isset($dx['code']) ? trim((string) $dx['code']) : '';
                if ($code === '') {
                    continue;
                }

                $counts[$code] = ($counts[$code] ?? 0) + 1;
            }
        }

        return $counts;
    }

    public function search(Request $request)
    {
        $request->validate([
            'q' => 'nullable|string|max:100',
        ]);

        $q = trim((string) $request->query('q', ''));

        if ($q === '') {
            return response()->json([]);
        }

        $user = Auth::user();
        $usageCounts = $user && method_exists($user, 'isDoctor') && $user->isDoctor()
            ? $this->getDoctorUsageCounts((int) $user->id)
            : [];

        // Get a candidate set from the DB, then rank in PHP with doctor-specific usage counts.
        $candidates = Icd10Code::query()
            ->where('code', 'like', $q . '%')
            ->orWhere('description', 'like', '%' . $q . '%')
            ->limit(60)
            ->get(['code', 'description', 'category']);

        $qLower = mb_strtolower($q);

        $ranked = $candidates->map(function ($row) use ($usageCounts, $qLower) {
            $code = (string) $row->code;
            $desc = (string) $row->description;

            $count = $usageCounts[$code] ?? 0;

            $codeStarts = str_starts_with(mb_strtolower($code), $qLower) ? 1 : 0;
            $descContains = str_contains(mb_strtolower($desc), $qLower) ? 1 : 0;

            // Higher is better.
            $score = ($count * 100) + ($codeStarts * 10) + ($descContains * 5);

            return [
                'code' => $row->code,
                'description' => $row->description,
                'category' => $row->category,
                '_score' => $score,
                '_count' => $count,
            ];
        })->sort(function ($a, $b) {
            // score desc, then code asc
            if ($a['_score'] === $b['_score']) {
                return strcmp((string) $a['code'], (string) $b['code']);
            }
            return $a['_score'] < $b['_score'] ? 1 : -1;
        })->values()->take(15)->map(function ($row) {
            unset($row['_score'], $row['_count']);
            return $row;
        });

        return response()->json($ranked);
    }
}
