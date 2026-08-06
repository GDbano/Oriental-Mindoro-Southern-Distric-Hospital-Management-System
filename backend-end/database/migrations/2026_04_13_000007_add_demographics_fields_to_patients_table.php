<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            if (!Schema::hasColumn('patients', 'civil_status')) {
                $table->string('civil_status', 50)->nullable()->after('gender');
            }
            if (!Schema::hasColumn('patients', 'philhealth_number')) {
                $table->string('philhealth_number', 50)->nullable()->after('insurance_info');
                $table->index('philhealth_number');
            }
            if (!Schema::hasColumn('patients', 'philhealth_membership_type')) {
                $table->string('philhealth_membership_type', 50)->nullable()->after('philhealth_number');
            }
            if (!Schema::hasColumn('patients', 'pwd_id_number')) {
                $table->string('pwd_id_number', 50)->nullable()->after('philhealth_membership_type');
            }
            if (!Schema::hasColumn('patients', 'senior_citizen_id_number')) {
                $table->string('senior_citizen_id_number', 50)->nullable()->after('pwd_id_number');
            }
        });
    }

    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $cols = [
                'civil_status',
                'philhealth_number',
                'philhealth_membership_type',
                'pwd_id_number',
                'senior_citizen_id_number',
            ];

            foreach ($cols as $col) {
                if (Schema::hasColumn('patients', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
