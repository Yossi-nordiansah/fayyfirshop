<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\StoreBranchController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/products/{category?}', function ($category = null) {
    return Inertia::render('products/Products', [
        'category' => $category,
        'subCategory' => request('sub')
    ]);
});

Route::get('/product/{slug}', function ($slug) {
    return Inertia::render('detail-product/DetailProduct', [
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
    Route::get('/dashboard', function () {
        return Inertia::render('backoffice/dashboard');
    })->name('backoffice.dashboard');

    Route::get('/product-management', function () {
        return Inertia::render('backoffice/menu/ProductManagement');
    })->name('backoffice.product-management');

    Route::get('/orders', function () {
        return Inertia::render('backoffice/menu/Orders');
    })->name('backoffice.orders');

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
