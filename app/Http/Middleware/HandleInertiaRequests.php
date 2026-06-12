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
            // Retrieve only required columns for maximum query performance
            $products = \App\Models\Product::select('id', 'title', 'name_translations', 'description_translations', 'stock', 'slug')->get();

            foreach ($products as $product) {
                // 1. Stock < 10 notifications
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

                // 2. Missing language translation notifications
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
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
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
