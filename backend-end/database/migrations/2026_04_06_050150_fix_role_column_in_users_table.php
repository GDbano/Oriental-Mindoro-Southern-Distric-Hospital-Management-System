<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            Schema::table('users', function (Blueprint $table) {
                DB::statement("ALTER TABLE users MODIFY COLUMN role VARCHAR(255) NOT NULL DEFAULT 'patient'");
            });

            return;
        }

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
            DB::statement("ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(255) USING role::varchar(255)");
            DB::statement("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'patient'");
            DB::statement("ALTER TABLE users ALTER COLUMN role SET NOT NULL");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            Schema::table('users', function (Blueprint $table) {
                DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('patient', 'doctor', 'staff', 'admin') NOT NULL DEFAULT 'patient'");
            });

            return;
        }

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(255) USING role::varchar(255)");
            DB::statement("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'patient'");
            DB::statement("ALTER TABLE users ALTER COLUMN role SET NOT NULL");
        }
    }
};
