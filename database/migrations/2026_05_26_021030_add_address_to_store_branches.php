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
        Schema::table('store_branches', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('city')->nullable();
            $table->string('street')->nullable();
            $table->string('district')->nullable();
            $table->string('province')->nullable();
            $table->string('postal_code')->NotNull();
            $table->text('detail_address')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('store_branches', function (Blueprint $table) {
            $table->dropColumn(['city', 'street', 'postal_code', 'detail_address', 'district', 'province']);
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');
        });
    }
};
