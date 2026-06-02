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
        if (Schema::hasTable('product_reviews')) {
            Schema::table('product_reviews', function (Blueprint $table) {
                if (!Schema::hasColumn('product_reviews', 'product_variant_id')) {
                    $table->foreignId('product_variant_id')
                          ->nullable()
                          ->after('product_id')
                          ->constrained('product_variants')
                          ->onDelete('set null');
                          
                    $table->index(['product_id', 'rating']);
                }
                
                if (!Schema::hasColumn('product_reviews', 'is_visible')) {
                    $table->boolean('is_visible')
                          ->default(true)
                          ->after('comment');
                }
            });
        } else {
            Schema::create('product_reviews', function (Blueprint $table) {
                $table->id();
                
                $table->foreignId('user_id')
                      ->constrained('users')
                      ->onDelete('cascade');

                $table->foreignId('product_id')
                      ->constrained('products')
                      ->onDelete('cascade');

                $table->foreignId('product_variant_id')
                      ->nullable()
                      ->constrained('product_variants')
                      ->onDelete('set null');

                $table->unsignedTinyInteger('rating');
                $table->text('comment')->nullable();
                $table->boolean('is_visible')->default(true);
                $table->timestamps();
                
                $table->index(['product_id', 'rating']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('product_reviews')) {
            Schema::table('product_reviews', function (Blueprint $table) {
                if (Schema::hasColumn('product_reviews', 'product_variant_id')) {
                    $table->dropForeign(['product_variant_id']);
                    $table->dropColumn('product_variant_id');
                }
                if (Schema::hasColumn('product_reviews', 'is_visible')) {
                    $table->dropColumn('is_visible');
                }
            });
        }
    }
};
