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
        Schema::create('featured_products2', function (Blueprint $table) {
            $table->id();
            $table->string('badge')->nullable();
            $table->json('badge_translations')->nullable();
            $table->string('title');
            $table->json('title_translations')->nullable();
            $table->text('description')->nullable();
            $table->json('description_translations')->nullable();
            $table->string('background_image')->nullable();
            $table->string('feature_1_icon')->default('ShieldCheck');
            $table->string('feature_1_title')->nullable();
            $table->json('feature_1_title_translations')->nullable();
            $table->text('feature_1_desc')->nullable();
            $table->json('feature_1_desc_translations')->nullable();
            $table->string('feature_2_icon')->default('Award');
            $table->string('feature_2_title')->nullable();
            $table->json('feature_2_title_translations')->nullable();
            $table->text('feature_2_desc')->nullable();
            $table->json('feature_2_desc_translations')->nullable();
            $table->string('button_text')->nullable();
            $table->json('button_text_translations')->nullable();
            $table->string('button_url')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('featured_products2');
    }
};
