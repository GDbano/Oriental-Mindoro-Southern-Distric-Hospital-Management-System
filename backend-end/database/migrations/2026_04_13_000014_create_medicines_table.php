<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('medicines', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('inventory_id')->nullable();

            // RA 6675: generic name must be written first and prominently.
            $table->string('generic_name');
            $table->string('brand_name')->nullable();

            // Optional defaults for convenience; the prescription form can override.
            $table->string('default_dosage')->nullable(); // e.g. 500mg
            $table->string('default_form')->nullable();   // e.g. tablet

            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['generic_name', 'is_active']);

            $table->foreign('inventory_id')->references('id')->on('inventory')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medicines');
    }
};
