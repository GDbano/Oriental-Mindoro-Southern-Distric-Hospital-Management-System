<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();

            // Patient & Doctor
            $table->foreignId('patient_id')->constrained('patients')->onDelete('cascade');
            $table->foreignId('doctor_id')->constrained('users')->onDelete('cascade');

            // Department & Type
            $table->foreignId('department_id')->constrained('departments')->onDelete('cascade');
            $table->foreignId('appointment_type_id')->constrained('appointment_types')->onDelete('cascade');

            // Appointment Scheduling
            $table->dateTime('appointment_date')->index();
            $table->time('scheduled_time')->nullable();
            $table->dateTime('consultation_start_time')->nullable();
            $table->dateTime('consultation_end_time')->nullable();

            // Queue & Priority
            $table->string('queue_number')->nullable()->unique();
            $table->enum('priority_level', ['Regular', 'Senior', 'PWD', 'Pregnant', 'Emergency'])->default('Regular')->index();
            $table->integer('queue_position')->nullable();

            // Status Tracking
            $table->enum('status', [
                'scheduled',
                'confirmed',
                'arrived',
                'in_consultation',
                'completed',
                'no_show',
                'cancelled',
                'rescheduled'
            ])->default('scheduled')->index();

            // Appointment Details
            $table->text('reason')->nullable();
            $table->text('symptoms')->nullable();
            $table->text('notes')->nullable();
            $table->text('cancellation_reason')->nullable();

            // Booking & Notifications
            $table->foreignId('booked_by')->nullable()->constrained('users')->onDelete('set null');
            $table->enum('booking_source', ['self_service', 'staff', 'walk_in'])->default('self_service');
            $table->boolean('sms_reminder_sent')->default(false);
            $table->dateTime('sms_sent_at')->nullable();
            $table->string('sms_phone')->nullable();
            $table->text('sms_response')->nullable();

            // Referral Information
            $table->string('referral_number')->nullable();
            $table->string('referring_doctor')->nullable();
            $table->string('referring_facility')->nullable();

            // Audit Trail
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            // Indexes for fast queries
            $table->index(['appointment_date', 'department_id']);
            $table->index(['appointment_date', 'doctor_id']);
            $table->index(['appointment_date', 'status']);
            $table->index(['patient_id', 'appointment_date']);
            $table->index(['queue_number', 'appointment_date']);
            $table->index(['status', 'appointment_date']);
        });

        Schema::create('queue_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->constrained('appointments')->onDelete('cascade');
            $table->foreignId('department_id')->constrained('departments')->onDelete('cascade');
            $table->date('queue_date')->index();
            $table->string('queue_number');
            $table->integer('queue_sequence');
            $table->enum('priority_level', ['Regular', 'Senior', 'PWD', 'Pregnant', 'Emergency'])->default('Regular');

            // Status Transitions
            $table->enum('current_status', [
                'waiting',
                'called',
                'in_consultation',
                'completed',
                'no_show',
                'cancelled'
            ])->default('waiting')->index();
            $table->dateTime('called_at')->nullable();
            $table->dateTime('completed_at')->nullable();
            $table->integer('wait_minutes')->nullable();
            $table->integer('consultation_minutes')->nullable();

            // Queue Management
            $table->dateTime('marked_in_consultation_at')->nullable();
            $table->dateTime('marked_completed_at')->nullable();
            $table->dateTime('marked_no_show_at')->nullable();
            $table->text('notes')->nullable();

            // Audit
            $table->timestamps();

            // Indexes
            $table->unique(['queue_date', 'queue_number', 'department_id']);
            $table->index(['queue_date', 'department_id']);
            $table->index(['queue_date', 'current_status']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('queue_logs');
        Schema::dropIfExists('appointments');
    }
};
