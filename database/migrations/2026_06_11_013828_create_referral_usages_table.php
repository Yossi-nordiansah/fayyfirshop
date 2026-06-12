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
        Schema::create('referral_usages', function (Blueprint $table) {
            $table->id();
            
            $table->foreignId('referral_id')->constrained('referrals')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
            
            $table->decimal('discount_obtained', 10, 2);
            $table->decimal('commission_earned', 10, 2)->default(0.00);
            
            $table->timestamp('used_at')->useCurrent();
            $table->timestamps();

            // Index for performance
            $table->index(['user_id', 'referral_id'], 'idx_user_referral_usage');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('referral_usages');
    }
};
