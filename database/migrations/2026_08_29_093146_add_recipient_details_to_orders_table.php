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
        Schema::table('orders', function (Blueprint $table) {
            $table->string('receiver_name')->nullable()->after('user_id');
            $table->string('receiver_phone')->nullable()->after('receiver_name');
            $table->string('destination_area_id')->nullable()->after('shipping_address');
        });

        // Backfill existing orders with receiver name & phone from users table
        try {
            $users = \Illuminate\Support\Facades\DB::table('users')->get()->keyBy('id');
            $orders = \Illuminate\Support\Facades\DB::table('orders')->whereNull('receiver_name')->get();
            foreach ($orders as $order) {
                if (isset($users[$order->user_id])) {
                    $u = $users[$order->user_id];
                    \Illuminate\Support\Facades\DB::table('orders')
                        ->where('id', $order->id)
                        ->update([
                            'receiver_name' => $u->receiver_name ?: $u->name,
                            'receiver_phone' => $u->phone,
                            'destination_area_id' => $u->area_id,
                        ]);
                }
            }
        } catch (\Exception $e) {
            // Ignore backfill errors
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['receiver_name', 'receiver_phone', 'destination_area_id']);
        });
    }
};
