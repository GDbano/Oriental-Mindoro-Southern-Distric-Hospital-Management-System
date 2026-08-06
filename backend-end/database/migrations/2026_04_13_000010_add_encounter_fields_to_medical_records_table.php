<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        Schema::table('medical_records', function (Blueprint $table) {
            $table->enum('status', ['draft', 'finalized'])->default('draft')->index()->after('appointment_id');
            $table->dateTime('finalized_at')->nullable()->after('status');

            // Expanded vital signs
            $table->integer('bp_systolic')->nullable()->after('blood_pressure');
            $table->integer('bp_diastolic')->nullable()->after('bp_systolic');
            $table->integer('respiratory_rate')->nullable()->after('heart_rate');
            $table->integer('oxygen_saturation')->nullable()->after('respiratory_rate');
            $table->unsignedTinyInteger('pain_scale')->nullable()->after('oxygen_saturation');

            // SOAP
            $table->text('subjective_chief_complaint')->nullable()->after('notes');
            $table->text('subjective_hpi')->nullable()->after('subjective_chief_complaint');
            $table->text('objective_findings')->nullable()->after('subjective_hpi');
            $table->text('assessment_notes')->nullable()->after('objective_findings');
            $table->json('diagnoses')->nullable()->after('assessment_notes');
            $table->text('plan_management')->nullable()->after('diagnoses');
            $table->text('plan_follow_up')->nullable()->after('plan_management');
        });

        // Existing medical records represent completed encounters historically.
        DB::table('medical_records')->update([
            'status' => 'finalized',
            'finalized_at' => DB::raw('created_at'),
        ]);
    }

    public function down()
    {
        Schema::table('medical_records', function (Blueprint $table) {
            $table->dropColumn([
                'status',
                'finalized_at',
                'bp_systolic',
                'bp_diastolic',
                'respiratory_rate',
                'oxygen_saturation',
                'pain_scale',
                'subjective_chief_complaint',
                'subjective_hpi',
                'objective_findings',
                'assessment_notes',
                'diagnoses',
                'plan_management',
                'plan_follow_up',
            ]);
        });
    }
};
