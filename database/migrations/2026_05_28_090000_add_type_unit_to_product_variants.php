<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_variants', function (Blueprint $table) {
            $table->string('type', 50)->nullable()->after('product_id');
            $table->foreignId('unit_id')->nullable()->constrained('units')->nullOnDelete()->after('image');
        });
    }

    public function down(): void
    {
        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropForeign(['unit_id']);
            $table->dropColumn(['type', 'unit_id']);
        });
    }
};
