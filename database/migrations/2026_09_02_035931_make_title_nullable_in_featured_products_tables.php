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
        if (Schema::hasTable('featured_products') && Schema::hasColumn('featured_products', 'title')) {
            Schema::table('featured_products', function (Blueprint $table) {
                $table->string('title')->nullable()->change();
            });
        }

        if (Schema::hasTable('featured_products2') && Schema::hasColumn('featured_products2', 'title')) {
            Schema::table('featured_products2', function (Blueprint $table) {
                $table->string('title')->nullable()->change();
            });
        }

        if (Schema::hasTable('featured_products3') && Schema::hasColumn('featured_products3', 'title')) {
            Schema::table('featured_products3', function (Blueprint $table) {
                $table->string('title')->nullable()->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
