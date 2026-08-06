<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('queue_counters', function (Blueprint $table) {
            $table->id();
            $table->date('queue_date')->index();
            $table->foreignId('department_id')->constrained('departments')->onDelete('cascade');
            $table->string('prefix', 10);
            $table->unsignedInteger('last_sequence')->default(0);
            $table->timestamps();

            $table->unique(['queue_date', 'department_id', 'prefix'], 'queue_counters_unique_day_dept_prefix');
        });

        Schema::create('queue_tickets', function (Blueprint $table) {
            $table->id();
            $table->date('queue_date')->index();
            $table->foreignId('department_id')->constrained('departments')->onDelete('cascade');
            $table->enum('patient_type', ['Regular', 'Senior Citizen', 'PWD', 'Pregnant']);
            $table->boolean('is_priority')->default(false)->index();
            $table->string('prefix', 10);
            $table->unsignedInteger('sequence');
            $table->string('queue_number', 20);
            $table->enum('status', ['waiting', 'called', 'served', 'cancelled', 'no_show'])->default('waiting')->index();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['queue_date', 'department_id', 'queue_number'], 'queue_tickets_unique_number_day_dept');
            $table->index(['queue_date', 'department_id', 'is_priority', 'sequence'], 'queue_tickets_day_dept_priority_seq');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('queue_tickets');
        Schema::dropIfExists('queue_counters');
    }
};
