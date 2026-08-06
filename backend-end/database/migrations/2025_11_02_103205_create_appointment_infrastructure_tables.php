<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Create departments table
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique()->index();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->integer('max_appointments_per_day')->default(50);
            $table->time('opening_time')->default('08:00:00');
            $table->time('closing_time')->default('17:00:00');
            $table->integer('lunch_break_start')->nullable(); // in minutes from opening
            $table->integer('lunch_break_duration')->nullable(); // in minutes
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
            
            $table->index(['is_active', 'name']);
        });

        // Create appointment_types table
        Schema::create('appointment_types', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name'); // OPD, Follow-up, Referral, Emergency
            $table->text('description')->nullable();
            $table->integer('default_duration_minutes')->default(30);
            $table->boolean('requires_referral')->default(false);
            $table->boolean('allows_walk_in')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Create doctors_schedule table
        Schema::create('doctors_schedule', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('department_id')->constrained('departments')->onDelete('cascade');
            $table->enum('day_of_week', ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
            $table->time('start_time');
            $table->time('end_time');
            $table->integer('consultation_duration_minutes')->default(30);
            $table->integer('max_appointments_per_day')->default(20);
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
            
            $table->unique(['doctor_id', 'department_id', 'day_of_week']);
            $table->index(['doctor_id', 'day_of_week']);
            $table->index(['department_id', 'day_of_week']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('doctors_schedule');
        Schema::dropIfExists('appointment_types');
        Schema::dropIfExists('departments');
    }
};
