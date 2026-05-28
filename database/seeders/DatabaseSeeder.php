<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        $units = ['ml', 'gr', 'kg', 'pcs', 'liter', 'box', 'pack'];
        foreach ($units as $unit) {
            \App\Models\Unit::firstOrCreate(['name' => $unit]);
        }
    }
}

