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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('category');
            $table->string('sub_category');

            // Kolom Tambahan Baru
            $table->unsignedBigInteger('price')->default(0); // Harga dasar / harga mulai dari
            $table->integer('stock')->default(0); // Total stok gabungan semua varian
            $table->string('status')->default('normal'); // best-seller, normal, dll.
            $table->decimal('rating', 2, 1)->default(0.0); // Rangkuman rating (Cache untuk performa)
            $table->integer('review_count')->default(0); // Total review (Cache untuk performa)
            $table->integer('sold')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
