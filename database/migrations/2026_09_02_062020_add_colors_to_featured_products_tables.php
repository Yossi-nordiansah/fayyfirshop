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
        $tables = ['featured_products', 'featured_products2', 'featured_products3'];

        foreach ($tables as $tableName) {
            if (Schema::hasTable($tableName)) {
                Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                    if (!Schema::hasColumn($tableName, 'text_color')) {
                        $table->string('text_color')->nullable()->after('background_image');
                    }
                    if (!Schema::hasColumn($tableName, 'button_color')) {
                        $table->string('button_color')->nullable()->after('button_url');
                    }
                    if (!Schema::hasColumn($tableName, 'button_text_color')) {
                        $table->string('button_text_color')->nullable()->after('button_color');
                    }
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = ['featured_products', 'featured_products2', 'featured_products3'];

        foreach ($tables as $tableName) {
            if (Schema::hasTable($tableName)) {
                Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                    $cols = [];
                    if (Schema::hasColumn($tableName, 'text_color')) $cols[] = 'text_color';
                    if (Schema::hasColumn($tableName, 'button_color')) $cols[] = 'button_color';
                    if (Schema::hasColumn($tableName, 'button_text_color')) $cols[] = 'button_text_color';
                    if (!empty($cols)) {
                        $table->dropColumn($cols);
                    }
                });
            }
        }
    }
};
