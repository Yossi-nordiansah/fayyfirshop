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
            $table->foreignId('product_category_id')
                ->nullable()
                ->after('description')
                ->constrained('product_categories')
                ->nullOnDelete();

            $table->foreignId('product_sub_category_id')
                ->nullable()
                ->after('product_category_id')
                ->constrained('product_sub_categories')
                ->nullOnDelete();

            // Make old category and sub_category columns nullable so they don't block insertions
            $table->string('category')->nullable()->change();
            $table->string('sub_category')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['product_sub_category_id']);
            $table->dropForeign(['product_category_id']);
            $table->dropColumn(['product_category_id', 'product_sub_category_id']);
            
            $table->string('category')->nullable(false)->change();
            $table->string('sub_category')->nullable(false)->change();
        });
    }
};
