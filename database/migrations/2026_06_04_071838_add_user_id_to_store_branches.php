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
        Schema::table('store_branches', function (Blueprint $table) {
            // Menambahkan kolom untuk menyimpan Area ID dari Biteship
            $table->string('area_id', 50)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('store_branches', function (Blueprint $table) {
            $table->dropColumn('area_id');
        });
    }
};
