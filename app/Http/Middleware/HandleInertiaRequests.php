<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * Handle the incoming request.
     */
    public function handle(Request $request, \Closure $next)
    {
        $locale = $request->cookies->get('locale') ?? 'indonesia';
        
        $map = [
            'english' => 'en',
            'arabic' => 'ar',
            'indonesia' => 'id',
        ];
        
        $laravelLocale = $map[$locale] ?? 'id';
        app()->setLocale($laravelLocale);
        
        return parent::handle($request, $next);
    }

    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $notifications = [];
        $user = $request->user();

        if ($user) {
            if (in_array($user->role, ['admin', 'super_admin'])) {
                // 1. Order status changes (last 5 updated orders)
                $recentOrders = \App\Models\Order::orderBy('updated_at', 'desc')
                    ->take(5)
                    ->get();

                foreach ($recentOrders as $order) {
                    $notifications[] = [
                        'id' => 'order_status_admin_' . $order->id . '_' . $order->status,
                        'type' => 'order_status',
                        'invoice_number' => $order->invoice_number,
                        'status' => $order->status,
                        'title' => 'Perubahan Status Pesanan',
                        'message' => "Pesanan \"{$order->invoice_number}\" berstatus: {$order->status}.",
                        'link' => route('backoffice.orders'),
                    ];
                }

                // Retrieve only required columns for maximum query performance
                $products = \App\Models\Product::select('id', 'title', 'name_translations', 'description_translations', 'stock', 'slug')->get();

                foreach ($products as $product) {
                    // 2. Stock < 10 notifications
                    if ($product->stock < 10) {
                        $name = $product->name_translations['indonesia'] ?? $product->title;
                        $notifications[] = [
                            'id' => 'stock_' . $product->id,
                            'type' => 'stock',
                            'title' => 'Stok Menipis (<10)',
                            'message' => "Stok produk \"{$name}\" menipis ({$product->stock} Pcs).",
                            'link' => route('backoffice.products.show', $product->slug),
                        ];
                    }

                    // 3. Missing language translation notifications
                    $missingLangs = [];
                    $names = $product->name_translations ?? [];
                    $descs = $product->description_translations ?? [];
                    foreach (['indonesia', 'english', 'arabic'] as $lang) {
                        $nameVal = trim($names[$lang] ?? '');
                        $descVal = trim($descs[$lang] ?? '');
                        if ($nameVal === '' || $descVal === '') {
                            $missingLangs[] = $lang;
                        }
                    }

                    if (!empty($missingLangs)) {
                        $name = $product->name_translations['indonesia'] ?? $product->title;
                        $langsStr = implode(', ', array_map('ucfirst', $missingLangs));
                        $notifications[] = [
                            'id' => 'translation_' . $product->id,
                            'type' => 'translation',
                            'title' => 'Translasi Belum Lengkap',
                            'message' => "Produk \"{$name}\" belum memiliki bahasa: {$langsStr}.",
                            'link' => route('backoffice.products.show', $product->slug),
                        ];
                    }
                }
            } else {
                // Customer notifications
                
                // 1. Profile incomplete notification
                $isProfileIncomplete = !$user->phone || !$user->address || !$user->city || !$user->postal_code || !$user->receiver_name;
                
                if ($isProfileIncomplete) {
                    $notifications[] = [
                        'id' => 'profile_incomplete',
                        'type' => 'profile',
                        'title' => 'Complete Your Profile',
                        'message' => 'Please complete your phone number and shipping address to ensure smooth delivery.',
                        'link' => '/register',
                    ];
                }

                // 2. Order status changes (last 5 orders)
                $orders = \App\Models\Order::where('user_id', $user->id)
                    ->orderBy('updated_at', 'desc')
                    ->take(5)
                    ->get();

                foreach ($orders as $order) {
                    $tab = 'all';
                    if ($order->payment_status === 'unpaid' && $order->status === 'pending') {
                        $tab = 'unpaid';
                    } elseif ($order->status === 'processing' || ($order->status === 'pending' && $order->payment_status === 'paid')) {
                        $tab = 'processing';
                    } elseif ($order->status === 'shipped') {
                        $tab = 'shipped';
                    } elseif ($order->status === 'completed') {
                        $tab = 'completed';
                    } elseif ($order->status === 'cancelled') {
                        $tab = 'cancelled';
                    }

                    $notifications[] = [
                        'id' => 'order_status_' . $order->id . '_' . $order->status,
                        'type' => 'order',
                        'invoice_number' => $order->invoice_number,
                        'status' => $order->status,
                        'title' => 'Order Status Updated',
                        'message' => "Your order {$order->invoice_number} is now {$order->status}.",
                        'link' => route('orders.index', ['tab' => $tab]),
                    ];
                }

                // 3. Vouchers (Manual and Event)
                if (\Illuminate\Support\Facades\Schema::hasTable('user_vouchers') && \Illuminate\Support\Facades\Schema::hasTable('vouchers')) {
                    // Manual Vouchers assigned to this specific user
                    $userVouchers = \Illuminate\Support\Facades\DB::table('user_vouchers')
                        ->join('vouchers', 'user_vouchers.voucher_id', '=', 'vouchers.id')
                        ->where('user_vouchers.user_id', $user->id)
                        ->where('user_vouchers.is_used', false)
                        ->where('vouchers.is_active', true)
                        ->where('vouchers.end_date', '>=', now())
                        ->select('user_vouchers.id as pivot_id', 'vouchers.code', 'vouchers.name')
                        ->orderBy('user_vouchers.created_at', 'desc')
                        ->take(5)
                        ->get();

                    foreach ($userVouchers as $uv) {
                        $notifications[] = [
                            'id' => 'voucher_manual_' . $uv->pivot_id,
                            'type' => 'voucher',
                            'code' => $uv->code,
                            'name' => $uv->name,
                            'title' => 'New Voucher Received!',
                            'message' => "Congratulations! You received a new voucher: {$uv->name} (Code: {$uv->code}).",
                            'link' => '/products',
                        ];
                    }

                    // Event Vouchers available for everyone
                    $eventVouchers = \Illuminate\Support\Facades\DB::table('vouchers')
                        ->where('distribution_type', 'event')
                        ->where('is_active', true)
                        ->where('start_date', '<=', now())
                        ->where('end_date', '>=', now())
                        ->orderBy('created_at', 'desc')
                        ->take(5)
                        ->get();

                    foreach ($eventVouchers as $ev) {
                        $usedCount = 0;
                        if (\Illuminate\Support\Facades\Schema::hasTable('voucher_usages')) {
                            $usedCount = \Illuminate\Support\Facades\DB::table('voucher_usages')
                                ->where('user_id', $user->id)
                                ->where('voucher_id', $ev->id)
                                ->count();
                        }

                        if ($usedCount < $ev->max_use_per_user) {
                            $notifications[] = [
                                'id' => 'voucher_event_' . $ev->id,
                                'type' => 'voucher',
                                'code' => $ev->code,
                                'name' => $ev->name,
                                'title' => 'New Event Voucher!',
                                'message' => "Congratulations! A new voucher is available: {$ev->name} (Code: {$ev->code}).",
                                'link' => '/products',
                            ];
                        }
                    }
                }

                // 4. Product Review Reminders (completed orders with no reviews in product_reviews)
                $completedOrders = \App\Models\Order::where('user_id', $user->id)
                    ->where('status', 'completed')
                    ->latest()
                    ->take(5)
                    ->get();

                if ($completedOrders->isNotEmpty()) {
                    $reviewedOrderIds = \App\Models\ProductReview::where('user_id', $user->id)
                        ->whereIn('order_id', $completedOrders->pluck('id'))
                        ->pluck('order_id')
                        ->toArray();

                    foreach ($completedOrders as $order) {
                        if (!in_array($order->id, $reviewedOrderIds)) {
                            $notifications[] = [
                                'id' => 'review_reminder_' . $order->id,
                                'type' => 'review_reminder',
                                'invoice_number' => $order->invoice_number,
                                'title' => 'Leave a Review',
                                'message' => "Your order {$order->invoice_number} is completed. Please write a review for the products.",
                                'link' => route('orders.index'),
                            ];
                        }
                    }
                }
            }
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
            ],
            'flash' => [
                'login_status' => $request->session()->get('login_status'),
                'logout_status' => $request->session()->get('logout_status'),
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
            'notifications' => $notifications,
            'activePromoTickers' => fn () => \Illuminate\Support\Facades\Schema::hasTable('promo_tickers')
                ? \App\Models\PromoTicker::where('is_active', true)->orderBy('sort_order')->get()
                : [],
            'activeEvents' => fn () => \Illuminate\Support\Facades\Schema::hasTable('events')
                ? \App\Models\Event::where('is_active', true)
                    ->where('start_date', '<=', now())
                    ->where('end_date', '>=', now())
                    ->orderBy('created_at', 'desc')
                    ->get()
                : [],
            'navCategories' => fn () => \App\Models\ProductCategory::with('subCategories')
                ->orderBy('name')
                ->get()
                ->map(fn ($cat) => [
                    'id'    => $cat->id,
                    'name'  => $cat->name,
                    'name_translations' => $cat->name_translations,
                    'slug'  => $cat->slug,
                    'href'  => '/products/' . $cat->slug,
                    'subCategories' => $cat->subCategories->map(fn ($sub) => [
                        'id'   => $sub->id,
                        'name' => $sub->name,
                        'name_translations' => $sub->name_translations,
                        'val'  => \Illuminate\Support\Str::slug($sub->name),
                    ]),
                ]),
        ];
    }
}
