<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('medical_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->constrained()->onDelete('cascade');
            $table->text('diagnosis')->nullable();
            $table->text('treatment_plan')->nullable();
            $table->text('prescription')->nullable();
            $table->text('notes')->nullable();
            $table->decimal('height', 5, 2)->nullable();
            $table->decimal('weight', 5, 2)->nullable();
            $table->string('blood_pressure', 20)->nullable();
            $table->decimal('temperature', 4, 2)->nullable();
            $table->integer('heart_rate')->nullable();
            $table->text('lab_results')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('medical_records');
    }
};
