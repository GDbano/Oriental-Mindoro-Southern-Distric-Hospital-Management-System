<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // The users.role column is an ENUM in this project. Add medtech for MySQL.
        if (Schema::getConnection()->getDriverName() !== 'mysql') {
            return;
        }

        try {
            DB::statement("ALTER TABLE users MODIFY role ENUM('patient','doctor','staff','records_officer','medtech','admin') NOT NULL DEFAULT 'patient'");
        } catch (\Throwable $e) {
            // Best-effort: if enum already updated, do nothing.
        }
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'mysql') {
            return;
        }

        try {
            DB::statement("ALTER TABLE users MODIFY role ENUM('patient','doctor','staff','records_officer','admin') NOT NULL DEFAULT 'patient'");
        } catch (\Throwable $e) {
            // Best-effort.
        }
    }
};
