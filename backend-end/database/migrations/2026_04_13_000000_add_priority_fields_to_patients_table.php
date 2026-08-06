<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        // Add priority fields to patients table if they don't exist
        Schema::table('patients', function (Blueprint $table) {
            if (!Schema::hasColumn('patients', 'is_pwd')) {
                $table->boolean('is_pwd')->default(false)->after('insurance_info');
            }
            if (!Schema::hasColumn('patients', 'is_pregnant')) {
                $table->boolean('is_pregnant')->default(false)->after('is_pwd');
            }
            if (!Schema::hasColumn('patients', 'is_senior')) {
                $table->boolean('is_senior')->default(false)->after('is_pregnant');
            }
        });
    }

    public function down()
    {
        Schema::table('patients', function (Blueprint $table) {
            if (Schema::hasColumn('patients', 'is_pwd')) {
                $table->dropColumn('is_pwd');
            }
            if (Schema::hasColumn('patients', 'is_pregnant')) {
                $table->dropColumn('is_pregnant');
            }
            if (Schema::hasColumn('patients', 'is_senior')) {
                $table->dropColumn('is_senior');
            }
        });
    }
};
