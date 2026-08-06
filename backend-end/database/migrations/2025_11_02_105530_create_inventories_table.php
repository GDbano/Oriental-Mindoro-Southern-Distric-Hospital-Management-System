<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('inventory', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('category');
            $table->integer('quantity');
            $table->integer('min_stock');
            $table->decimal('price', 8, 2)->nullable();
            $table->date('expiry_date')->nullable();
            $table->string('supplier')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index(['category', 'is_active']);
            $table->index('expiry_date');
        });
    }

    public function down()
    {
        Schema::dropIfExists('inventory');
    }
};
