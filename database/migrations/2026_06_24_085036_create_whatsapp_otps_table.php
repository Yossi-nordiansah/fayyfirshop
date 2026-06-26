<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('whatsapp_otps', function (Blueprint $table) {
            $table->id();
            $table->string('phone', 20)->index();
            $table->string('otp', 10);
            $table->timestamp('expires_at');
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_otps');
    }
};
