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
        if (Schema::hasTable('featured_products2')) {
            Schema::table('featured_products2', function (Blueprint $table) {
                if (!Schema::hasColumn('featured_products2', 'countdown_start')) {
                    $table->dateTime('countdown_start')->nullable()->before('countdown_end');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('featured_products2')) {
            Schema::table('featured_products2', function (Blueprint $table) {
                if (Schema::hasColumn('featured_products2', 'countdown_start')) {
                    $table->dropColumn('countdown_start');
                }
            });
        }
    }
};
