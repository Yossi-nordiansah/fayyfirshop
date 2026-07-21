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
        Schema::table('hero_slides', function (Blueprint $table) {
            $table->json('category_translations')->nullable()->after('category');
            $table->json('title_translations')->nullable()->after('title');
            $table->json('subtitle_translations')->nullable()->after('subtitle');
            $table->json('description_translations')->nullable()->after('description');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('hero_slides', function (Blueprint $table) {
            $table->dropColumn([
                'category_translations',
                'title_translations',
                'subtitle_translations',
                'description_translations',
            ]);
        });
    }
};
