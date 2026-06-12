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
        Schema::create('voucher_usages', function (Blueprint $table) {
            $table->id();
            
            // Relasi ke tabel vouchers
            $table->foreignId('voucher_id')->constrained('vouchers')->onDelete('cascade');
            
            // Relasi ke tabel users
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            
            // Relasi ke tabel orders
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
            
            // Nominal diskon riil yang didapatkan pada transaksi tersebut
            $table->decimal('discount_obtained', 10, 2);
            
            // Waktu penggunaan voucher
            $table->timestamp('used_at')->useCurrent();

            // Index untuk optimasi kueri "apakah user telah melebihi batas penggunaan voucher"
            $table->index(['user_id', 'voucher_id'], 'idx_user_voucher_usage');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('voucher_usages');
    }
};
