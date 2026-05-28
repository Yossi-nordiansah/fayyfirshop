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
        Schema::create('order_items', function (Blueprint $table) {
           $table->id();
            
            // Relasi ke induk tabel pesanan (orders)
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
            
            // Relasi ke produk utama
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            
            // Relasi ke varian produk (nullable jika produk tersebut tidak memiliki varian)
            $table->foreignId('product_variant_id')->nullable()->constrained('product_variants')->onDelete('set null');

            // Detail kuantitas & harga saat transaksi dibeli
            $table->integer('quantity');
            
            // PENTING: Harga disimpan di sini karena harga produk asli di tabel 'products' bisa berubah sewaktu-waktu
            $table->decimal('price', 12, 2); 

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
