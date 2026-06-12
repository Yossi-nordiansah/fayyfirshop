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
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->dateTime('start_date');
            $table->dateTime('end_date');
            $table->json('countries')->nullable(); // Menampung negara yang berlaku, misal ["Indonesia", "Malaysia"]
            $table->string('image_path', 255)->nullable(); // Pop up gambar event
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Index untuk optimasi pencarian validitas event
            $table->index(['start_date', 'end_date', 'is_active'], 'idx_event_validity');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
