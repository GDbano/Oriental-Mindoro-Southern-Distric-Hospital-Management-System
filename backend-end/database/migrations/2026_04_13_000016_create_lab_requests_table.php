<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('lab_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->constrained()->onDelete('cascade');
            $table->foreignId('doctor_id')->constrained('users');

            $table->enum('urgency', ['routine', 'stat'])->default('routine');
            $table->enum('status', ['pending', 'completed', 'cancelled'])->default('pending');

            // Selected tests grouped by category.
            // Example shape: { "HEMATOLOGY": ["CBC with platelet"], "MICROBIOLOGY": ["Gram Stain", ...] }
            $table->json('tests')->nullable();

            // For Culture & Sensitivity when specimen must be specified.
            $table->string('specimen')->nullable();

            $table->text('others')->nullable();
            $table->text('clinical_notes')->nullable();

            $table->timestamp('requested_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'urgency']);
            $table->index(['appointment_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lab_requests');
    }
};
