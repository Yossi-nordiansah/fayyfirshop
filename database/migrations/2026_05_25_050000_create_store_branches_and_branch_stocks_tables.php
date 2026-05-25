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
        Schema::create('store_branches', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique(); // indonesia, malaysia, saudi-arabia
            $table->string('name');
            $table->string('country_code', 2); // ID, MY, SA
            $table->string('country_name');
            $table->string('currency_code', 3);
            $table->string('currency_symbol', 10);
            $table->string('timezone')->default('Asia/Jakarta');
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['country_code', 'is_active']);
        });

        Schema::create('product_branch_stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('store_branch_id')->constrained('store_branches')->cascadeOnDelete();
            $table->unsignedInteger('stock')->default(0);
            $table->unsignedInteger('reserved_stock')->default(0);
            $table->unsignedInteger('low_stock_threshold')->default(5);
            $table->boolean('is_available')->default(true);
            $table->timestamps();

            $table->unique(['product_id', 'store_branch_id'], 'product_branch_stocks_unique');
            $table->index(['store_branch_id', 'stock']);
        });

        Schema::create('product_variant_branch_stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_variant_id')->constrained('product_variants')->cascadeOnDelete();
            $table->foreignId('store_branch_id')->constrained('store_branches')->cascadeOnDelete();
            $table->unsignedInteger('stock')->default(0);
            $table->unsignedInteger('reserved_stock')->default(0);
            $table->unsignedInteger('low_stock_threshold')->default(5);
            $table->boolean('is_available')->default(true);
            $table->timestamps();

            $table->unique(['product_variant_id', 'store_branch_id'], 'variant_branch_stocks_unique');
            $table->index(['store_branch_id', 'stock']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_variant_branch_stocks');
        Schema::dropIfExists('product_branch_stocks');
        Schema::dropIfExists('store_branches');
    }
};
