<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
        DB::statement("ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(255) USING role::varchar(255)");
        DB::statement("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'patient'");
        DB::statement("ALTER TABLE users ALTER COLUMN role SET NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'pgsql') {
            return;
        }

        // No safe downgrade: keep role as varchar and preserve existing values.
    }
};
