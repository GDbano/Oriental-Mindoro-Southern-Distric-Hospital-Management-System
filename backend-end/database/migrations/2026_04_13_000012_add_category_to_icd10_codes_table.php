<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('icd10_codes', function (Blueprint $table) {
            $table->string('category', 100)->nullable()->after('description');
            $table->index(['category']);
        });
    }

    public function down()
    {
        Schema::table('icd10_codes', function (Blueprint $table) {
            $table->dropIndex(['category']);
            $table->dropColumn('category');
        });
    }
};
