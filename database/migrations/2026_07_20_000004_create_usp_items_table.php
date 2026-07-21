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
        Schema::create('usp_items', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->json('title_translations')->nullable();
            $table->text('description')->nullable();
            $table->json('description_translations')->nullable();
            $table->string('icon')->nullable()->default('Leaf');
            $table->string('background_image')->nullable();
            $table->string('color')->nullable()->default('from-teal-400 to-teal-600');
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
        Schema::dropIfExists('usp_items');
    }
};
