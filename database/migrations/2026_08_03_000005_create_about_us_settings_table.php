<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('about_us_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();           // e.g. 'hero_badge_label', 'story_title'
            $table->text('value')->nullable();          // default / bahasa Indonesia
            $table->json('value_translations')->nullable(); // {id, en, ar}
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('about_us_settings');
    }
};
