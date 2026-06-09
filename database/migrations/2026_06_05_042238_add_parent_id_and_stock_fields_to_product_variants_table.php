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
        Schema::table('product_variants', function (Blueprint $table) {
            $table->foreignId('parent_id')->nullable()->after('product_id')->constrained('product_variants')->cascadeOnDelete();
            $table->string('stock_type')->default('variant'); // 'variant' or 'parent'
            $table->string('unit')->nullable(); // e.g. 'ml', 'gr', 'kg'
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropColumn(['parent_id', 'stock_type', 'unit']);
        });
    }
};
