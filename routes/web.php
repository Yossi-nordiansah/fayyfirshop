<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\ProfileController;
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

    Route::get('/users', function () {
        return Inertia::render('backoffice/menu/Users');
    })->name('backoffice.users');

    Route::get('/reports', function () {
        return Inertia::render('backoffice/menu/Reports');
    })->name('backoffice.reports');
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
