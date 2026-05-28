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
        Schema::table('products', function (Blueprint $table) {
            $table->json('name_translations')->nullable()->after('title');
            $table->json('description_translations')->nullable()->after('description');
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->string('name')->nullable()->after('product_id');
            $table->json('name_translations')->nullable()->after('name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropColumn(['name', 'name_translations']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['name_translations', 'description_translations']);
        });
    }
};
