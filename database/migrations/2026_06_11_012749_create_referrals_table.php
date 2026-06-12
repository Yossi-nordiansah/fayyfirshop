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
        Schema::create('referrals', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('code', 50)->unique();
            $table->enum('type', ['percentage', 'fixed'])->default('fixed');
            $table->decimal('value', 10, 2);
            $table->json('countries')->nullable();
            $table->decimal('commission_percentage', 5, 2)->default(0.00);
            $table->decimal('min_spending', 10, 2)->default(0.00);
            $table->integer('total_quota')->default(0);
            $table->integer('used_quota')->default(0);
            $table->dateTime('start_date');
            $table->dateTime('end_date');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Index for performance
            $table->index('code', 'idx_referral_code');
            $table->index(['start_date', 'end_date', 'is_active'], 'idx_referral_validity');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('referrals');
    }
};
