<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\ProductCategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\StoreBranchController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\OrderController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    $newProducts = \App\Models\Product::with(['category', 'subCategory', 'variants.unit', 'images'])
        ->where('is_new', true)
        ->get();

    $bestSellerProducts = \App\Models\Product::with(['category', 'subCategory', 'variants.unit', 'images'])
        ->where('is_best_seller', true)
        ->get();

    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
        'newProducts' => $newProducts,
        'bestSellerProducts' => $bestSellerProducts,
    ]);
});

Route::get('/products/{category?}', function ($category = null) {
    $products = \App\Models\Product::with(['category', 'subCategory', 'variants.unit', 'images'])
        ->get();

    return Inertia::render('products/Products', [
        'category' => $category,
        'subCategory' => request('sub'),
        'products' => $products
    ]);
});

Route::get('/product/{slug}', function ($slug) {
    $product = \App\Models\Product::with(['category', 'subCategory', 'variants.unit', 'variants.branchStocks', 'images'])
        ->where('slug', $slug)
        ->first();

    if (!$product) {
        abort(404);
    }

    // Mapping variant eksplisit agar unit selalu konsisten (tidak konflik antara kolom unit teks dan relasi unit)
    $mappedVariants = $product->variants->map(function ($v) {
        // Resolusi unit: prioritaskan kolom teks unit (misal "ml"), lalu relasi Unit object
        $unitResolved = null;
        if (!empty($v->getAttributes()['unit'])) {
            // Kolom teks unit ada (misal "ml" dari stok induk terpusat)
            $unitResolved = $v->getAttributes()['unit'];
        } elseif ($v->unit_id && $v->relationLoaded('unit') && $v->getRelation('unit')) {
            // Relasi Unit object ada (dari unit_id)
            $unitResolved = $v->getRelation('unit');
        }

        return [
            'id'               => $v->id,
            'parent_id'        => $v->parent_id,
            'type'             => $v->type,
            'type_translations'=> $v->type_translations,
            'name'             => $v->name,
            'name_translations'=> $v->name_translations,
            'sku'              => $v->sku,
            'price'            => $v->price,
            'stock'            => $v->stock,
            'stock_type'       => $v->stock_type,
            'unit_id'          => $v->unit_id,
            'unit'             => $unitResolved,
            'image'            => $v->image,
            'branch_stocks'    => $v->branchStocks ?? [],
        ];
    });

    $productData = $product->toArray();
    $productData['variants'] = $mappedVariants;

    return Inertia::render('detail-product/DetailProduct', [
        'product' => $productData,
        'slug' => $slug
    ]);
});


Route::get('/cart', function () {
    return Inertia::render('cart/CartPage');
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::prefix('backoffice')->group(function () {
    Route::middleware('guest')->group(function () {
        Route::get('/login', function () {
            return Inertia::render('backoffice/Login', [
                'status' => session('status'),
            ]);
        })->name('backoffice.login');

        Route::post('/login', [AuthenticatedSessionController::class, 'store'])
            ->name('backoffice.login.store');
    });
});

Route::middleware('backoffice.auth')->prefix('backoffice')->group(function () {
    Route::get('/biteship/search-area', [StoreBranchController::class, 'searchArea'])
        ->name('backoffice.biteship.search-area');

    Route::get('/dashboard', function () {
        return Inertia::render('backoffice/dashboard');
    })->name('backoffice.dashboard');

    Route::get('/product-management', [ProductController::class, 'index'])
        ->name('backoffice.product-management');

    // Alias agar Ziggy bisa me-resolve 'backoffice.products.index'
    Route::get('/products', [ProductController::class, 'index'])
        ->name('backoffice.products.index');

    Route::get('/products/create', [ProductController::class, 'create'])
        ->name('backoffice.products.create');
    Route::post('/products/check-sku', [ProductController::class, 'checkSku'])
        ->name('backoffice.products.check-sku');
    Route::post('/products', [ProductController::class, 'store'])
        ->name('backoffice.products.store');
    Route::get('/products/{product:slug}', [ProductController::class, 'show'])
        ->name('backoffice.products.show');
    Route::get('/products/{product:slug}/edit', [ProductController::class, 'edit'])
        ->name('backoffice.products.edit');
    Route::patch('/products/{product:slug}', [ProductController::class, 'update'])
        ->name('backoffice.products.update');
    Route::delete('/products/{product:slug}', [ProductController::class, 'destroy'])
        ->name('backoffice.products.destroy');

    Route::get('/product-categories', [ProductCategoryController::class, 'index'])
        ->name('backoffice.product-categories.index');
    Route::get('/product-categories/create', [ProductCategoryController::class, 'create'])
        ->name('backoffice.product-categories.create');
    Route::post('/product-categories', [ProductCategoryController::class, 'store'])
        ->name('backoffice.product-categories.store');
    Route::get('/product-categories/{productCategory:slug}', [ProductCategoryController::class, 'show'])
        ->name('backoffice.product-categories.show');
    Route::get('/product-categories/{productCategory:slug}/edit', [ProductCategoryController::class, 'edit'])
        ->name('backoffice.product-categories.edit');
    Route::patch('/product-categories/{productCategory:slug}', [ProductCategoryController::class, 'update'])
        ->name('backoffice.product-categories.update');
    Route::delete('/product-categories/{productCategory:slug}', [ProductCategoryController::class, 'destroy'])
        ->name('backoffice.product-categories.destroy');

    Route::get('/orders', [OrderController::class, 'index'])->name('backoffice.orders');
    Route::patch('/orders/{order}/update-status', [OrderController::class, 'updateStatus'])->name('backoffice.orders.update-status');
    Route::post('/orders/{order}/biteship-shipment', [OrderController::class, 'createBiteshipShipment'])->name('backoffice.orders.biteship-shipment');

    Route::get('/review', function () {
        return Inertia::render('backoffice/menu/Reviews');
    })->name('backoffice.review');

    Route::get('/admin', [AdminController::class, 'index'])->name('backoffice.admin');
    Route::get('/admin/create', [AdminController::class, 'create'])->name('backoffice.admin.create');
    Route::post('/admin', [AdminController::class, 'store'])->name('backoffice.admin.store');
    Route::get('/admin/{admin}/edit', [AdminController::class, 'edit'])->name('backoffice.admin.edit');
    Route::patch('/admin/{admin}', [AdminController::class, 'update'])->name('backoffice.admin.update');
    Route::delete('/admin/{admin}', [AdminController::class, 'destroy'])->name('backoffice.admin.destroy');

    Route::get('/customer', function () {
        return Inertia::render('backoffice/menu/Customer');
    })->name('backoffice.customer');

    Route::get('/reports', function () {
        return Inertia::render('backoffice/menu/Reports');
    })->name('backoffice.reports');

    Route::get('/store-branches', [StoreBranchController::class, 'index'])
        ->name('backoffice.store-branches.index');
    Route::get('/store-branches/create', [StoreBranchController::class, 'create'])
        ->name('backoffice.store-branches.create');
    Route::post('/store-branches', [StoreBranchController::class, 'store'])
        ->name('backoffice.store-branches.store');
    Route::get('/store-branches/{storeBranch}/edit', [StoreBranchController::class, 'edit'])
        ->name('backoffice.store-branches.edit');
    Route::patch('/store-branches/{storeBranch}', [StoreBranchController::class, 'update'])
        ->name('backoffice.store-branches.update');
    Route::delete('/store-branches/{storeBranch}', [StoreBranchController::class, 'destroy'])
        ->name('backoffice.store-branches.destroy');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('/checkout', [CheckoutController::class, 'index'])->name('checkout');
    Route::get('/checkout/search-area', [StoreBranchController::class, 'searchArea'])->name('checkout.search-area');
    Route::post('/checkout/check-stock', [CheckoutController::class, 'checkStock'])->name('checkout.check-stock');
    Route::post('/checkout/rates', [CheckoutController::class, 'getRates'])->name('checkout.rates');
    Route::post('/checkout/place-order', [CheckoutController::class, 'placeOrder'])->name('checkout.place-order');
    Route::get('/checkout/success/{id}', [CheckoutController::class, 'success'])->name('checkout.success');
    Route::get('/orders/{order}/track', [OrderController::class, 'trackOrder'])->name('orders.track');
});

require __DIR__ . '/auth.php';

Route::get('/api/provinces', function () {
    return response()->json(\Laravolt\Indonesia\Models\Province::orderBy('name')->get());
})->name('api.provinces');

Route::get('/api/cities/{province_code}', function ($province_code) {
    return response()->json(\Laravolt\Indonesia\Models\City::where('province_code', $province_code)->orderBy('name')->get());
})->name('api.cities');

Route::get('/api/districts/{city_code}', function ($city_code) {
    return response()->json(\Laravolt\Indonesia\Models\District::where('city_code', $city_code)->orderBy('name')->get());
})->name('api.districts');
