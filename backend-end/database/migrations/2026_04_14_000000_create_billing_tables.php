<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {

        // Create billings table
        Schema::create('billings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->foreignId('appointment_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('total_amount', 10, 2)->default(0);
            $table->decimal('philhealth_discount', 10, 2)->default(0);
            $table->decimal('net_amount', 10, 2)->default(0);
            $table->string('status')->default('pending'); // pending, paid, cancelled
            $table->string('payment_method')->nullable(); // cash, card, gcash
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });

        // Create billing_items table
        Schema::create('billing_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('billing_id')->constrained()->cascadeOnDelete();
            $table->string('description');
            $table->string('type'); // consultation, lab_test, medicine, other
            $table->decimal('amount', 10, 2)->default(0);
            $table->integer('quantity')->default(1);
            $table->decimal('total', 10, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('billing_items');
        Schema::dropIfExists('billings');


    }
};
