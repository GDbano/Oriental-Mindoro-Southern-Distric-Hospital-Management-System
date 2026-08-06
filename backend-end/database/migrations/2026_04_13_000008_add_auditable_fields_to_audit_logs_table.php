<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            if (!Schema::hasColumn('audit_logs', 'auditable_type')) {
                $table->string('auditable_type', 100)->nullable()->after('user_id');
            }
            if (!Schema::hasColumn('audit_logs', 'auditable_id')) {
                $table->unsignedBigInteger('auditable_id')->nullable()->after('auditable_type');
                $table->index(['auditable_type', 'auditable_id', 'performed_at'], 'audit_logs_auditable_idx');
            }
            if (!Schema::hasColumn('audit_logs', 'changes')) {
                $table->json('changes')->nullable()->after('description');
            }
        });
    }

    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            if (Schema::hasColumn('audit_logs', 'changes')) {
                $table->dropColumn('changes');
            }
            if (Schema::hasColumn('audit_logs', 'auditable_id')) {
                $table->dropIndex('audit_logs_auditable_idx');
                $table->dropColumn('auditable_id');
            }
            if (Schema::hasColumn('audit_logs', 'auditable_type')) {
                $table->dropColumn('auditable_type');
            }
        });
    }
};
