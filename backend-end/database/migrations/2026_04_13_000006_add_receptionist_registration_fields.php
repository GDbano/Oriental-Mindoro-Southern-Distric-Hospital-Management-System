<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('patients', function (Blueprint $table) {
            if (!Schema::hasColumn('patients', 'hospital_number')) {
                $table->string('hospital_number')->nullable()->unique()->after('user_id');
            }
            if (!Schema::hasColumn('patients', 'is_indigent')) {
                $table->boolean('is_indigent')->default(false)->after('insurance_info');
            }
            if (!Schema::hasColumn('patients', 'staff_remarks')) {
                $table->text('staff_remarks')->nullable()->after('insurance_info');
            }

            if (!Schema::hasColumn('patients', 'barangay')) {
                $table->string('barangay')->nullable()->after('insurance_info');
            }
            if (!Schema::hasColumn('patients', 'municipality')) {
                $table->string('municipality')->nullable()->after('barangay');
            }
            if (!Schema::hasColumn('patients', 'province')) {
                $table->string('province')->nullable()->after('municipality');
            }
        });

        if (!Schema::hasTable('hospital_number_counters')) {
            Schema::create('hospital_number_counters', function (Blueprint $table) {
                $table->id();
                $table->integer('year')->unique();
                $table->integer('last_sequence')->default(0);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('barangays')) {
            Schema::create('barangays', function (Blueprint $table) {
                $table->id();
                $table->string('name')->index();
                $table->string('municipality');
                $table->string('province');
                $table->timestamps();

                $table->index(['municipality', 'province']);
            });
        }
    }

    public function down()
    {
        if (Schema::hasTable('hospital_number_counters')) {
            Schema::drop('hospital_number_counters');
        }

        if (Schema::hasTable('barangays')) {
            Schema::drop('barangays');
        }

        Schema::table('patients', function (Blueprint $table) {
            $columns = [
                'hospital_number',
                'is_indigent',
                'staff_remarks',
                'barangay',
                'municipality',
                'province',
            ];
            foreach ($columns as $col) {
                if (Schema::hasColumn('patients', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
