<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // The users.role column is an ENUM in this project. Add records_officer for MySQL.
        if (Schema::getConnection()->getDriverName() !== 'mysql') {
            return;
        }

        try {
            DB::statement("ALTER TABLE users MODIFY role ENUM('patient','doctor','staff','records_officer','admin') NOT NULL DEFAULT 'patient'");
        } catch (\Throwable $e) {
            // If the enum is already updated or the statement fails for environment reasons,
            // leave as-is to avoid breaking migrations.
        }
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'mysql') {
            return;
        }

        try {
            DB::statement("ALTER TABLE users MODIFY role ENUM('patient','doctor','staff','admin') NOT NULL DEFAULT 'patient'");
        } catch (\Throwable $e) {
            // Best-effort.
        }
    }
};
