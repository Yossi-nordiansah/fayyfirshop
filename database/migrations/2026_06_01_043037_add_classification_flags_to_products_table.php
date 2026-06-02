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
            $table->boolean('is_new')->default(false);
            $table->boolean('is_best_seller')->default(false);
        });

        // Migrate existing status data to the new columns
        try {
            \DB::table('products')->where('status', 'new')->update(['is_new' => true]);
            \DB::table('products')->where('status', 'best-seller')->update(['is_best_seller' => true]);
        } catch (\Exception $e) {
            // Keep going if DB is empty or table is not populated yet
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['is_new', 'is_best_seller']);
        });
    }
};
