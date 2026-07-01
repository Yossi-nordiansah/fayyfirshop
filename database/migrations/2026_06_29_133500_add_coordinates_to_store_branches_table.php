<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('store_branches', function (Blueprint $table) {
            $table->decimal('latitude', 10, 8)->nullable()->after('timezone');
            $table->decimal('longitude', 11, 8)->nullable()->after('latitude');
        });

        // Seed default coordinates for existing branches
        DB::table('store_branches')->where('code', 'indonesia')->update([
            'latitude' => -7.4726,
            'longitude' => 112.4381,
        ]);

        DB::table('store_branches')->where('code', 'malaysia')->update([
            'latitude' => 3.0738,
            'longitude' => 101.5183,
        ]);

        DB::table('store_branches')->where('code', 'saudi-arabia')->update([
            'latitude' => 24.7136,
            'longitude' => 46.6753,
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('store_branches', function (Blueprint $table) {
            $table->dropColumn(['latitude', 'longitude']);
        });
    }
};
