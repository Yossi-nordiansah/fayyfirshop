<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\ProductCategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\StoreBranchController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PromotionController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\ProductReviewController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ContentController;
use App\Http\Controllers\ReportController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    $newProducts = \App\Models\Product::with(['category', 'subCategory', 'variants.unit', 'images'])
        ->where('is_new', true)
        ->where('is_active', true)
        ->whereHas('category', function ($q) {
            $q->where('is_active', true);
        })
        ->get();

    $bestSellerProducts = \App\Models\Product::with(['category', 'subCategory', 'variants.unit', 'images'])
        ->where('is_best_seller', true)
        ->where('is_active', true)
        ->whereHas('category', function ($q) {
            $q->where('is_active', true);
        })
        ->get();

    $reviews = \App\Models\ProductReview::with(['user', 'product'])
        ->where('is_visible', true)
        ->latest('id')
        ->take(10)
        ->get();

    $heroSlides = [];
    if (\Illuminate\Support\Facades\Schema::hasTable('hero_slides')) {
        if (\App\Models\HeroSlide::count() === 0) {
            app(ContentController::class)->index();
        }
        $heroSlides = \App\Models\HeroSlide::where('is_active', true)->orderBy('sort_order', 'asc')->get();
    }

    $homeCategoryCards = [];
    if (\Illuminate\Support\Facades\Schema::hasTable('home_category_cards')) {
        if (\App\Models\HomeCategoryCard::count() === 0) {
            app(ContentController::class)->index();
        }
        $homeCategoryCards = \App\Models\HomeCategoryCard::where('is_active', true)->orderBy('sort_order', 'asc')->get();
    }

    $featuredProducts = [];
    if (\Illuminate\Support\Facades\Schema::hasTable('featured_products')) {
        if (\App\Models\FeaturedProductItem::count() === 0) {
            app(ContentController::class)->index();
        }
        $featuredProducts = \App\Models\FeaturedProductItem::where('is_active', true)->orderBy('sort_order', 'asc')->get();
    }

    $uspItems = [];
    if (\Illuminate\Support\Facades\Schema::hasTable('usp_items')) {
        if (\App\Models\UspItem::count() === 0) {
            app(ContentController::class)->index();
        }
        $uspItems = \App\Models\UspItem::where('is_active', true)->orderBy('sort_order', 'asc')->get();
    }

    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
        'newProducts' => $newProducts,
        'bestSellerProducts' => $bestSellerProducts,
        'reviews' => $reviews,
        'heroSlides' => $heroSlides,
        'homeCategoryCards' => $homeCategoryCards,
        'featuredProducts' => $featuredProducts,
        'uspItems' => $uspItems,
    ]);
});

Route::get('/about', function () {
    $aboutUsSettings = [];
    try {
        if (\Illuminate\Support\Facades\Schema::hasTable('about_us_settings')) {
            $aboutUsSettings = \App\Models\AboutUsSetting::all()->keyBy('key');
        }
    } catch (\Exception $e) {}
    return Inertia::render('about-us/AboutUs', [
        'aboutUsSettings' => $aboutUsSettings,
    ]);
})->name('about');

Route::get('/products/{category?}', function ($category = null) {
    if ($category) {
        $catModel = \App\Models\ProductCategory::where('slug', $category)->first();
        if (!$catModel || !$catModel->is_active) {
            abort(404);
        }
    }

    $products = \App\Models\Product::with(['category', 'subCategory', 'variants.unit', 'images'])
        ->where('is_active', true)
        ->whereHas('category', function ($q) {
            $q->where('is_active', true);
        })
        ->get();

    $heroSlides = [];
    if (\Illuminate\Support\Facades\Schema::hasTable('hero_slides')) {
        $heroSlides = \App\Models\HeroSlide::where('is_active', true)->orderBy('sort_order', 'asc')->get();
    }

    $homeCategoryCards = [];
    if (\Illuminate\Support\Facades\Schema::hasTable('home_category_cards')) {
        $homeCategoryCards = \App\Models\HomeCategoryCard::where('is_active', true)->orderBy('sort_order', 'asc')->get();
    }

    return Inertia::render('products/Products', [
        'category' => $category,
        'subCategory' => request('sub'),
        'products' => $products,
        'heroSlides' => $heroSlides,
        'homeCategoryCards' => $homeCategoryCards,
    ]);
});

Route::get('/product/{slug}', function ($slug) {
    $product = \App\Models\Product::with([
        'category',
        'subCategory',
        'variants.unit',
        'variants.branchStocks.branch',
        'branchStocks.branch',
        'images',
        'reviews' => function ($query) {
            $query->where('is_visible', true)->with(['user', 'productVariant'])->latest('id');
        }
    ])
        ->where('slug', $slug)
        ->where('is_active', true)
        ->whereHas('category', function ($q) {
            $q->where('is_active', true);
        })
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
            'weight'           => $v->weight,
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

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('backoffice.dashboard');
    Route::get('/visitor-logs', [DashboardController::class, 'visitorLogs'])->name('backoffice.visitor-logs');

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
    Route::patch('/products/{product:slug}/toggle-active', [ProductController::class, 'toggleActive'])
        ->name('backoffice.products.toggle-active');
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
    Route::patch('/product-categories/{productCategory:slug}/toggle-active', [ProductCategoryController::class, 'toggleActive'])
        ->name('backoffice.product-categories.toggle-active');
    Route::delete('/product-categories/{productCategory:slug}', [ProductCategoryController::class, 'destroy'])
        ->name('backoffice.product-categories.destroy');

    Route::get('/orders', [OrderController::class, 'index'])->name('backoffice.orders');
    Route::patch('/orders/{order}/update-status', [OrderController::class, 'updateStatus'])->name('backoffice.orders.update-status');
    Route::post('/orders/{order}/biteship-shipment', [OrderController::class, 'createBiteshipShipment'])->name('backoffice.orders.biteship-shipment');
    Route::post('/orders/{order}/approve-cancellation', [OrderController::class, 'approveCancellation'])->name('backoffice.orders.approve-cancellation');
    Route::post('/orders/{order}/reject-cancellation', [OrderController::class, 'rejectCancellation'])->name('backoffice.orders.reject-cancellation');

    Route::get('/review', [ProductReviewController::class, 'index'])->name('backoffice.review');
    Route::patch('/review/{review}/toggle-visibility', [ProductReviewController::class, 'toggleVisibility'])->name('backoffice.review.toggle-visibility');
    Route::delete('/review/{review}', [ProductReviewController::class, 'destroy'])->name('backoffice.review.destroy');

    Route::get('/admin', [AdminController::class, 'index'])->name('backoffice.admin');
    Route::get('/admin/create', [AdminController::class, 'create'])->name('backoffice.admin.create');
    Route::post('/admin', [AdminController::class, 'store'])->name('backoffice.admin.store');
    Route::get('/admin/{admin}/edit', [AdminController::class, 'edit'])->name('backoffice.admin.edit');
    Route::patch('/admin/{admin}', [AdminController::class, 'update'])->name('backoffice.admin.update');
    Route::delete('/admin/{admin}', [AdminController::class, 'destroy'])->name('backoffice.admin.destroy');

    Route::get('/customer', [CustomerController::class, 'index'])->name('backoffice.customer');
    Route::delete('/customer/{customer}', [CustomerController::class, 'destroy'])->name('backoffice.customer.destroy');
    Route::get('/customer/{customer}/statistics', [CustomerController::class, 'statistics'])->name('backoffice.customer.statistics');
    Route::post('/customer/{customer}/voucher', [CustomerController::class, 'assignVoucher'])->name('backoffice.customer.assign-voucher');

    Route::get('/reports', [ReportController::class, 'index'])->name('backoffice.reports');

    Route::get('/promotion', [PromotionController::class, 'index'])->name('backoffice.promotion');
    Route::post('/promotion/ticker', [PromotionController::class, 'storeTicker'])->name('backoffice.promotion.ticker.store');
    // Laravel POST dengan _method PUT/PATCH untuk request berisi multipart file upload
    Route::post('/promotion/ticker/{id}', [PromotionController::class, 'updateTicker'])->name('backoffice.promotion.ticker.update');
    Route::delete('/promotion/ticker/{id}', [PromotionController::class, 'destroyTicker'])->name('backoffice.promotion.ticker.destroy');

    Route::post('/promotion/voucher', [PromotionController::class, 'storeVoucher'])->name('backoffice.promotion.voucher.store');
    Route::put('/promotion/voucher/{id}', [PromotionController::class, 'updateVoucher'])->name('backoffice.promotion.voucher.update');
    Route::delete('/promotion/voucher/{id}', [PromotionController::class, 'destroyVoucher'])->name('backoffice.promotion.voucher.destroy');

    Route::post('/promotion/event', [PromotionController::class, 'storeEvent'])->name('backoffice.promotion.event.store');
    Route::post('/promotion/event/{id}', [PromotionController::class, 'updateEvent'])->name('backoffice.promotion.event.update');
    Route::delete('/promotion/event/{id}', [PromotionController::class, 'destroyEvent'])->name('backoffice.promotion.event.destroy');

    Route::post('/promotion/referral', [PromotionController::class, 'storeReferral'])->name('backoffice.promotion.referral.store');
    Route::put('/promotion/referral/{id}', [PromotionController::class, 'updateReferral'])->name('backoffice.promotion.referral.update');
    Route::delete('/promotion/referral/{id}', [PromotionController::class, 'destroyReferral'])->name('backoffice.promotion.referral.destroy');
    Route::get('/promotion/referral/{id}/statistics', [PromotionController::class, 'referralStatistics'])->name('backoffice.promotion.referral.statistics');

    Route::get('/content', [ContentController::class, 'index'])->name('backoffice.content');
    Route::post('/content/hero', [ContentController::class, 'storeHero'])->name('backoffice.content.hero.store');
    Route::post('/content/hero/{id}', [ContentController::class, 'updateHero'])->name('backoffice.content.hero.update');
    Route::delete('/content/hero/{id}', [ContentController::class, 'destroyHero'])->name('backoffice.content.hero.destroy');
    Route::patch('/content/hero/{id}/toggle-active', [ContentController::class, 'toggleHeroActive'])->name('backoffice.content.hero.toggle-active');

    Route::post('/content/home-category', [ContentController::class, 'storeHomeCategory'])->name('backoffice.content.home-category.store');
    Route::post('/content/home-category/{id}', [ContentController::class, 'updateHomeCategory'])->name('backoffice.content.home-category.update');
    Route::delete('/content/home-category/{id}', [ContentController::class, 'destroyHomeCategory'])->name('backoffice.content.home-category.destroy');
    Route::patch('/content/home-category/{id}/toggle-active', [ContentController::class, 'toggleHomeCategoryActive'])->name('backoffice.content.home-category.toggle-active');

    Route::post('/content/featured-product', [ContentController::class, 'storeFeaturedProduct'])->name('backoffice.content.featured-product.store');
    Route::post('/content/featured-product/{id}', [ContentController::class, 'updateFeaturedProduct'])->name('backoffice.content.featured-product.update');
    Route::delete('/content/featured-product/{id}', [ContentController::class, 'destroyFeaturedProduct'])->name('backoffice.content.featured-product.destroy');
    Route::patch('/content/featured-product/{id}/toggle-active', [ContentController::class, 'toggleFeaturedProductActive'])->name('backoffice.content.featured-product.toggle-active');

    Route::post('/content/usp', [ContentController::class, 'storeUsp'])->name('backoffice.content.usp.store');
    Route::post('/content/usp/{id}', [ContentController::class, 'updateUsp'])->name('backoffice.content.usp.update');
    Route::delete('/content/usp/{id}', [ContentController::class, 'destroyUsp'])->name('backoffice.content.usp.destroy');
    Route::patch('/content/usp/{id}/toggle-active', [ContentController::class, 'toggleUspActive'])->name('backoffice.content.usp.toggle-active');

    Route::patch('/content/about-us', [ContentController::class, 'updateAboutUs'])->name('backoffice.content.about-us.update');

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

Route::post('/checkout/xendit-callback', [CheckoutController::class, 'xenditCallback'])->name('checkout.xendit-callback');
Route::post('/checkout/midtrans-callback', [CheckoutController::class, 'midtransCallback'])->name('checkout.midtrans-callback');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // User Address Routes
    Route::post('/addresses', [ProfileController::class, 'storeAddress'])->name('addresses.store');
    Route::patch('/addresses/{address}', [ProfileController::class, 'updateAddress'])->name('addresses.update');
    Route::delete('/addresses/{address}', [ProfileController::class, 'destroyAddress'])->name('addresses.destroy');
    Route::patch('/addresses/{address}/default', [ProfileController::class, 'setDefaultAddress'])->name('addresses.set-default');

    Route::get('/checkout', [CheckoutController::class, 'index'])->name('checkout');
    Route::get('/checkout/search-area', [StoreBranchController::class, 'searchArea'])->name('checkout.search-area');
    Route::post('/checkout/check-stock', [CheckoutController::class, 'checkStock'])->name('checkout.check-stock');
    Route::post('/checkout/rates', [CheckoutController::class, 'getRates'])->name('checkout.rates');
    Route::post('/checkout/apply-voucher', [CheckoutController::class, 'applyVoucher'])->name('checkout.apply-voucher');
    Route::post('/checkout/place-order', [CheckoutController::class, 'placeOrder'])->name('checkout.place-order');
    Route::get('/checkout/success/{id}', [CheckoutController::class, 'success'])->name('checkout.success');
    Route::get('/checkout/payment/{id}', [CheckoutController::class, 'payment'])->name('checkout.payment');
    Route::get('/checkout/payment/{id}/status', [CheckoutController::class, 'paymentStatus'])->name('checkout.payment.status');
    Route::post('/checkout/payment/{id}/change', [CheckoutController::class, 'changePaymentMethod'])->name('checkout.payment.change');
    Route::post('/checkout/payment/{id}/pay-card', [CheckoutController::class, 'payCreditCard'])->name('checkout.payment.pay-card');
    Route::post('/checkout/payment/{id}/cancel', [CheckoutController::class, 'cancelOrder'])->name('checkout.payment.cancel');
    Route::post('/checkout/payment/{id}/expire', [CheckoutController::class, 'expireOrder'])->name('checkout.payment.expire');
    Route::get('/orders', [OrderController::class, 'userOrders'])->name('orders.index');
    Route::post('/orders/{order}/payment-token', [OrderController::class, 'getPaymentToken'])->name('orders.payment-token');
    Route::get('/orders/{order}/track', [OrderController::class, 'trackOrder'])->name('orders.track');
    Route::post('/orders/{order}/cancel-request', [OrderController::class, 'requestCancellation'])->name('orders.cancel-request');
    Route::post('/orders/{order}/reviews', [ProductReviewController::class, 'store'])->name('orders.reviews.store');
    Route::get('/api/user-vouchers', function () {
        $user = auth()->user();
        if (!$user) {
            return response()->json([]);
        }
        
        // 1. Get manual vouchers
        $manualVouchers = \Illuminate\Support\Facades\DB::table('user_vouchers')
            ->join('vouchers', 'user_vouchers.voucher_id', '=', 'vouchers.id')
            ->where('user_vouchers.user_id', $user->id)
            ->where('user_vouchers.is_used', false)
            ->where('vouchers.is_active', true)
            ->where('vouchers.end_date', '>=', now())
            ->select(
                'vouchers.id',
                'vouchers.code',
                'vouchers.name',
                'vouchers.description',
                'vouchers.type',
                'vouchers.value',
                'vouchers.min_spending',
                'vouchers.max_discount',
                'vouchers.end_date',
                'vouchers.distribution_type'
            )
            ->get();

        // 2. Get event vouchers that are active, not expired, and not fully used by this user
        $eventVouchers = \Illuminate\Support\Facades\DB::table('vouchers')
            ->where('distribution_type', 'event')
            ->where('is_active', true)
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now())
            ->get()
            ->filter(function ($voucher) use ($user) {
                $usedCount = \Illuminate\Support\Facades\DB::table('voucher_usages')
                    ->where('user_id', $user->id)
                    ->where('voucher_id', $voucher->id)
                    ->count();
                return $usedCount < $voucher->max_use_per_user;
            })
            ->map(function ($voucher) {
                return (object)[
                    'id' => $voucher->id,
                    'code' => $voucher->code,
                    'name' => $voucher->name,
                    'description' => $voucher->description,
                    'type' => $voucher->type,
                    'value' => $voucher->value,
                    'min_spending' => $voucher->min_spending,
                    'max_discount' => $voucher->max_discount,
                    'end_date' => $voucher->end_date,
                    'distribution_type' => $voucher->distribution_type,
                ];
            })
            ->values();

        // Combine and sort
        $allVouchers = $manualVouchers->concat($eventVouchers)->sortByDesc('end_date')->values();
            
        return response()->json($allVouchers);
    })->name('api.user-vouchers');
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
