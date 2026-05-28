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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            
            // Kode unik pesanan (misal: INV-20260528-XXXX)
            $table->string('invoice_number')->unique();
            
            // Relasi ke tabel users (siapa pembelinya)
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            
            // Relasi ke cabang toko pemroses (karena Fayyfir Shop menggunakan sistem multi-branch)
            $table->foreignId('store_branch_id')->nullable()->constrained('store_branches')->onDelete('set null');

            // Nominal Keuangan (Seluruhnya disimpan dalam IDR sesuai dengan arsitektur pusat)
            $table->decimal('subtotal', 12, 2); // Total harga produk sebelum diskon/ongkir
            $table->decimal('discount_amount', 12, 2)->default(0); // Potongan harga (jika ada kupon)
            $table->decimal('shipping_cost', 12, 2)->default(0); // Ongkos kirim
            $table->decimal('total_amount', 12, 2); // Total akhir yang harus dibayar (subtotal - diskon + ongkir)

            // Informasi Pengiriman & Resi
            $table->string('shipping_courier')->nullable(); // JNE, J&T, POS, dll
            $table->string('shipping_service')->nullable(); // REG, YES, OKE, dll
            $table->string('tracking_number')->nullable(); // Nomor Resi
            $table->text('shipping_address'); // Alamat lengkap pengiriman

            // Status Pesanan & Pembayaran
            // Menggunakan enum untuk membatasi status yang valid
            $table->enum('status', ['pending', 'processing', 'shipped', 'completed', 'cancelled'])->default('pending');
            $table->enum('payment_status', ['unpaid', 'paid', 'expired', 'refunded'])->default('unpaid');
            
            // ID Transaksi dari payment gateway (misal: Midtrans/Xendit) jika digunakan
            $table->string('payment_token')->nullable();

            $table->text('notes')->nullable(); // Catatan tambahan dari pembeli
            $table->timestamps();
            
            // Indexing untuk mempercepat pencarian data order berdasarkan user atau status
            $table->index(['user_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
