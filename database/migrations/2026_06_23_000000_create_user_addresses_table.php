<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('user_addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('receiver_name');
            $table->string('phone');
            $table->string('country');
            $table->string('province')->nullable();
            $table->string('city')->nullable();
            $table->string('district')->nullable();
            $table->string('postal_code');
            $table->text('address');
            $table->string('area_id')->nullable();
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });

        // Migrate existing user addresses
        $users = DB::table('users')->whereNotNull('address')->get();
        foreach ($users as $user) {
            DB::table('user_addresses')->insert([
                'user_id' => $user->id,
                'receiver_name' => $user->receiver_name ?: $user->name,
                'phone' => $user->phone ?: '',
                'country' => $user->country ?: 'ID',
                'province' => $user->province,
                'city' => $user->city,
                'district' => $user->district,
                'postal_code' => $user->postal_code ?: '',
                'address' => $user->address,
                'area_id' => $user->area_id,
                'is_default' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_addresses');
    }
};
