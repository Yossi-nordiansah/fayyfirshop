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
        Schema::create('promo_tickers', function (Blueprint $table) {
            $table->id();
            
            // Key identifikasi opsional (misal: promo.list.1)
            $table->string('key', 100)->nullable();
            
            // Teks promo default (misal: bahasa Inggris atau fallback)
            $table->string('text', 255)->nullable();
            
            // Kolom terjemahan dinamis JSON (format: {"indonesia": "...", "english": "...", "arabic": "..."})
            $table->json('text_translations')->nullable();
            
            // File icon path di storage (diunggah ke storage/app/public/icons/campaign)
            $table->string('icon', 255)->nullable();
            
            // Tautan opsional ketika diklik
            $table->string('link', 255)->nullable();
            
            // Urutan tampilan ticker
            $table->integer('sort_order')->default(0);
            
            // Status aktif/visibilitas
            $table->boolean('is_active')->default(true);
            
            $table->timestamps();

            // Index untuk mempermudah kueri kustom
            $table->index(['is_active', 'sort_order'], 'idx_promo_ticker_display');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('promo_tickers');
    }
};
