<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('model:prune')->daily();
Schedule::command('orders:cancel-expired')->everyFiveMinutes();

Artisan::command('orders:cancel-expired', function () {
    $count = \App\Models\Order::cancelExpiredOrders();
    $this->info("Successfully cancelled {$count} expired orders.");
})->purpose('Cancel orders whose payment time limit has expired');

Artisan::command('inventory:setup-branch-stocks {--copy-existing-to=ID : Branch country code that receives current products.stock and product_variants.stock values} {--reset : Delete existing branch stock rows before recreating them}', function () {
    if (
        ! Schema::hasTable('store_branches') ||
        ! Schema::hasTable('product_branch_stocks') ||
        ! Schema::hasTable('product_variant_branch_stocks')
    ) {
        $this->error('Branch stock tables are missing. Run php artisan migrate first.');

        return 1;
    }

    $branches = [
        [
            'code' => 'indonesia',
            'name' => 'Fayyfir Shop Indonesia',
            'country_code' => 'ID',
            'country_name' => 'Indonesia',
            'currency_code' => 'IDR',
            'currency_symbol' => 'Rp',
            'timezone' => 'Asia/Jakarta',
            'latitude' => -7.4726,
            'longitude' => 112.4381,
            'postal_code' => '00000',
            'is_default' => true,
            'is_active' => true,
        ],
        [
            'code' => 'malaysia',
            'name' => 'Fayyfir Shop Malaysia',
            'country_code' => 'MY',
            'country_name' => 'Malaysia',
            'currency_code' => 'MYR',
            'currency_symbol' => 'RM',
            'timezone' => 'Asia/Kuala_Lumpur',
            'latitude' => 3.0738,
            'longitude' => 101.5183,
            'postal_code' => '00000',
            'is_default' => false,
            'is_active' => true,
        ],
        [
            'code' => 'saudi-arabia',
            'name' => 'Fayyfir Shop Saudi Arabia',
            'country_code' => 'SA',
            'country_name' => 'Saudi Arabia',
            'currency_code' => 'SAR',
            'currency_symbol' => 'SAR',
            'timezone' => 'Asia/Riyadh',
            'latitude' => 24.7136,
            'longitude' => 46.6753,
            'postal_code' => '00000',
            'is_default' => false,
            'is_active' => true,
        ],
    ];

    $copyExistingTo = strtoupper((string) $this->option('copy-existing-to'));
    $now = now();

    DB::transaction(function () use ($branches, $copyExistingTo, $now) {
        foreach ($branches as $branch) {
            DB::table('store_branches')->updateOrInsert(
                ['code' => $branch['code']],
                array_merge($branch, ['updated_at' => $now, 'created_at' => $now]),
            );
        }

        $branchRows = DB::table('store_branches')
            ->whereIn('code', collect($branches)->pluck('code'))
            ->get(['id', 'country_code']);

        if ($this->option('reset')) {
            DB::table('product_variant_branch_stocks')->delete();
            DB::table('product_branch_stocks')->delete();
        }

        DB::table('products')
            ->select(['id', 'stock'])
            ->orderBy('id')
            ->chunkById(200, function ($products) use ($branchRows, $copyExistingTo, $now) {
                foreach ($products as $product) {
                    foreach ($branchRows as $branch) {
                        DB::table('product_branch_stocks')->updateOrInsert(
                            [
                                'product_id' => $product->id,
                                'store_branch_id' => $branch->id,
                            ],
                            [
                                'stock' => $branch->country_code === $copyExistingTo ? (int) $product->stock : 0,
                                'reserved_stock' => 0,
                                'low_stock_threshold' => 5,
                                'is_available' => true,
                                'created_at' => $now,
                                'updated_at' => $now,
                            ],
                        );
                    }
                }
            });

        DB::table('product_variants')
            ->select(['id', 'stock'])
            ->orderBy('id')
            ->chunkById(200, function ($variants) use ($branchRows, $copyExistingTo, $now) {
                foreach ($variants as $variant) {
                    foreach ($branchRows as $branch) {
                        DB::table('product_variant_branch_stocks')->updateOrInsert(
                            [
                                'product_variant_id' => $variant->id,
                                'store_branch_id' => $branch->id,
                            ],
                            [
                                'stock' => $branch->country_code === $copyExistingTo ? (int) $variant->stock : 0,
                                'reserved_stock' => 0,
                                'low_stock_threshold' => 5,
                                'is_available' => true,
                                'created_at' => $now,
                                'updated_at' => $now,
                            ],
                        );
                    }
                }
            });
    });

    $this->info('Store branches and branch stock rows are ready.');
    $this->line('Branches: indonesia (ID), malaysia (MY), saudi-arabia (SA).');
    $this->line("Existing legacy stock copied to: {$copyExistingTo}.");

    return 0;
})->purpose('Create the three country branches and initialize product/variant stock rows per branch');
