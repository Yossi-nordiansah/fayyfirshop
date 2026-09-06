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
                if (!Schema::hasColumn('featured_products2', 'countdown_end')) {
                    $table->dateTime('countdown_end')->nullable()->after('description_translations');
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
                if (Schema::hasColumn('featured_products2', 'countdown_end')) {
                    $table->dropColumn('countdown_end');
                }
            });
        }
    }
};
