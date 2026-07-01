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
            $table->string('whatsapp_number')->nullable()->after('area_id');
        });

        // Seed default WhatsApp number for existing branches
        DB::table('store_branches')->update([
            'whatsapp_number' => '6285655230897',
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('store_branches', function (Blueprint $table) {
            $table->dropColumn(['whatsapp_number']);
        });
    }
};
