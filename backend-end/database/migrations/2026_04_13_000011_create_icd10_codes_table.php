<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('icd10_codes', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->unique();
            $table->string('description', 255);
            $table->timestamps();

            $table->index(['code']);
            $table->index(['description']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('icd10_codes');
    }
};
