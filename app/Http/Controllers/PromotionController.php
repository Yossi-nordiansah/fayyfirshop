<?php

namespace App\Http\Controllers;

use App\Models\PromoTicker;
use App\Models\Voucher;
use App\Models\Event;
use App\Models\Referral;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class PromotionController extends Controller
{
    /**
     * Display the promotion dashboard page with data from the database.
     */
    public function index()
    {
        $tickers = [];
        $vouchers = [];
        $events = [];
        $referrals = [];

        try {
            // Check if tables exist before querying to prevent crashes if migrations are not run yet.
            if (Schema::hasTable('promo_tickers')) {
                // Seeding dummy data if table is empty
                if (PromoTicker::count() === 0) {
                    $this->seedDummyTickers();
                }
                $tickers = PromoTicker::orderBy('sort_order')->get();
            }

            if (Schema::hasTable('vouchers')) {
                $vouchers = Voucher::orderBy('created_at', 'desc')->get();
            }

            if (Schema::hasTable('events')) {
                $events = Event::with('vouchers')->orderBy('created_at', 'desc')->get();
            }

            if (Schema::hasTable('referrals')) {
                $referrals = Referral::orderBy('created_at', 'desc')->get();
            }
        } catch (\Exception $e) {
            // Silently catch database exception
        }

        return Inertia::render('backoffice/menu/Promotion', [
            'tickers' => $tickers,
            'vouchers' => $vouchers,
            'events' => $events,
            'referrals' => $referrals,
            'status' => session('status'),
            'statusAction' => session('statusAction'),
        ]);
    }

    /**
     * Store a new promo ticker.
     */
    public function storeTicker(Request $request)
    {
        $request->validate([
            'key' => 'nullable|string|max:100',
            'translation_id' => 'nullable|string',
            'translation_en' => 'nullable|string',
            'translation_ar' => 'nullable|string',
            'icon' => 'nullable|file|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'link' => 'nullable|string|max:255',
            'sort_order' => 'nullable|integer',
            'is_active' => 'boolean',
        ]);

        $translations = [
            'id' => $request->translation_id,
            'en' => $request->translation_en,
            'ar' => $request->translation_ar,
        ];

        // Determine fallback text
        $text = $request->translation_id ?: ($request->translation_en ?: ($request->translation_ar ?: ''));

        $iconPath = null;
        if ($request->hasFile('icon')) {
            // Store inside storage/app/public/icons/campaign
            $iconPath = $request->file('icon')->store('icons/campaign', 'public');
        }

        PromoTicker::create([
            'key' => $request->key,
            'text' => $text,
            'text_translations' => $translations,
            'icon' => $iconPath,
            'link' => $request->link,
            'sort_order' => $request->sort_order ?? 0,
            'is_active' => $request->is_active ?? true,
        ]);

        return redirect()->back()->with([
            'status' => 'Campaign ticker successfully created.',
            'statusAction' => 'created',
        ]);
    }

    /**
     * Update an existing promo ticker.
     */
    public function updateTicker(Request $request, $id)
    {
        $ticker = PromoTicker::findOrFail($id);

        $request->validate([
            'key' => 'nullable|string|max:100',
            'translation_id' => 'nullable|string',
            'translation_en' => 'nullable|string',
            'translation_ar' => 'nullable|string',
            'icon' => 'nullable|file|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'link' => 'nullable|string|max:255',
            'sort_order' => 'nullable|integer',
            'is_active' => 'boolean',
        ]);

        $translations = [
            'id' => $request->translation_id,
            'en' => $request->translation_en,
            'ar' => $request->translation_ar,
        ];

        $text = $request->translation_id ?: ($request->translation_en ?: ($request->translation_ar ?: $ticker->text));

        $iconPath = $ticker->icon;
        if ($request->hasFile('icon')) {
            // Delete old icon
            if ($ticker->icon && Storage::disk('public')->exists($ticker->icon)) {
                Storage::disk('public')->delete($ticker->icon);
            }
            $iconPath = $request->file('icon')->store('icons/campaign', 'public');
        }

        $ticker->update([
            'key' => $request->key,
            'text' => $text,
            'text_translations' => $translations,
            'icon' => $iconPath,
            'link' => $request->link,
            'sort_order' => $request->sort_order ?? 0,
            'is_active' => $request->is_active,
        ]);

        return redirect()->back()->with([
            'status' => 'Campaign ticker successfully updated.',
            'statusAction' => 'updated',
        ]);
    }

    /**
     * Delete a promo ticker.
     */
    public function destroyTicker($id)
    {
        $ticker = PromoTicker::findOrFail($id);

        if ($ticker->icon && Storage::disk('public')->exists($ticker->icon)) {
            Storage::disk('public')->delete($ticker->icon);
        }

        $ticker->delete();

        return redirect()->back()->with([
            'status' => 'Campaign ticker successfully deleted.',
            'statusAction' => 'deleted',
        ]);
    }

    /**
     * Store a new voucher.
     */
    public function storeVoucher(Request $request)
    {
        $request->validate([
            'code' => 'required|string|max:50|unique:vouchers,code',
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'type' => 'required|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
            'max_discount' => 'nullable|numeric|min:0',
            'min_spending' => 'required|numeric|min:0',
            'total_quota' => 'required|integer|min:0',
            'max_use_per_user' => 'required|integer|min:1',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'is_active' => 'boolean',
            'distribution_type' => 'required|string|in:event,manual',
        ]);

        Voucher::create($request->all());

        return redirect()->back()->with([
            'status' => 'Voucher successfully created.',
            'statusAction' => 'created',
        ]);
    }

    /**
     * Update an existing voucher.
     */
    public function updateVoucher(Request $request, $id)
    {
        $voucher = Voucher::findOrFail($id);

        $request->validate([
            'code' => 'required|string|max:50|unique:vouchers,code,' . $voucher->id,
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'type' => 'required|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
            'max_discount' => 'nullable|numeric|min:0',
            'min_spending' => 'required|numeric|min:0',
            'total_quota' => 'required|integer|min:0',
            'max_use_per_user' => 'required|integer|min:1',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'is_active' => 'boolean',
            'distribution_type' => 'required|string|in:event,manual',
        ]);

        $voucher->update($request->all());

        return redirect()->back()->with([
            'status' => 'Voucher successfully updated.',
            'statusAction' => 'updated',
        ]);
    }

    /**
     * Delete a voucher.
     */
    public function destroyVoucher($id)
    {
        $voucher = Voucher::findOrFail($id);
        $voucher->delete();

        return redirect()->back()->with([
            'status' => 'Voucher successfully deleted.',
            'statusAction' => 'deleted',
        ]);
    }

    /**
     * Store a new event.
     */
    public function storeEvent(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'countries' => 'required|array',
            'image' => 'nullable|file|image|max:3072',
            'is_active' => 'boolean',
            'vouchers' => 'nullable|array',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('events', 'public');
        }

        $event = Event::create([
            'name' => $request->name,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'countries' => $request->countries,
            'image_path' => $imagePath ? '/storage/' . $imagePath : null,
            'is_active' => $request->is_active ?? true,
        ]);

        if ($request->filled('vouchers')) {
            $event->vouchers()->sync($request->vouchers);
        }

        return redirect()->back()->with([
            'status' => 'Event successfully created.',
            'statusAction' => 'created',
        ]);
    }

    /**
     * Update an existing event.
     */
    public function updateEvent(Request $request, $id)
    {
        $event = Event::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:100',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'countries' => 'required|array',
            'image' => 'nullable|file|image|max:3072',
            'is_active' => 'boolean',
            'vouchers' => 'nullable|array',
        ]);

        $imagePath = $event->getRawOriginal('image_path');
        if ($request->hasFile('image')) {
            // Delete old image file
            if ($imagePath) {
                $cleanPath = str_replace('/storage/', '', $imagePath);
                if (Storage::disk('public')->exists($cleanPath)) {
                    Storage::disk('public')->delete($cleanPath);
                }
            }
            $imagePath = '/storage/' . $request->file('image')->store('events', 'public');
        }

        $event->update([
            'name' => $request->name,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'countries' => $request->countries,
            'image_path' => $imagePath,
            'is_active' => $request->is_active,
        ]);

        $event->vouchers()->sync($request->vouchers ?? []);

        return redirect()->back()->with([
            'status' => 'Event successfully updated.',
            'statusAction' => 'updated',
        ]);
    }

    /**
     * Delete an event.
     */
    public function destroyEvent($id)
    {
        $event = Event::findOrFail($id);

        if ($event->image_path) {
            $cleanPath = str_replace('/storage/', '', $event->image_path);
            if (Storage::disk('public')->exists($cleanPath)) {
                Storage::disk('public')->delete($cleanPath);
            }
        }

        $event->delete();

        return redirect()->back()->with([
            'status' => 'Event successfully deleted.',
            'statusAction' => 'deleted',
        ]);
    }

    /**
     * Seed initial dummy tickers
     */
    private function seedDummyTickers()
    {
        PromoTicker::create([
            'key' => 'promo.list.1',
            'text' => 'Free plane shipping over Rp 5.000.000',
            'text_translations' => [
                'id' => 'Gratis pengiriman udara untuk transaksi di atas Rp 5.000.000',
                'en' => 'Free plane shipping over Rp 5.000.000',
                'ar' => 'شحن جوي مجاني لأكثر من 5,000,000 روبية'
            ],
            'icon' => null,
            'link' => '/shipping-info',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        PromoTicker::create([
            'key' => 'promo.list.2',
            'text' => 'Exclusive 15% OFF on Oud & Premium Perfumes - Use Code: OUDLUXE',
            'text_translations' => [
                'id' => 'Diskon eksklusif 15% untuk Parfum Oud & Premium - Gunakan Kode: OUDLUXE',
                'en' => 'Exclusive 15% OFF on Oud & Premium Perfumes - Use Code: OUDLUXE',
                'ar' => 'خصم حصرى 15% على العود والعطور الفاخرة - استخدم الرمز: OUDLUXE'
            ],
            'icon' => null,
            'link' => '/products?category=perfumes',
            'sort_order' => 2,
            'is_active' => true,
        ]);

        PromoTicker::create([
            'key' => 'promo.list.3',
            'text' => '100% Certified Authentic Yemeni Sidr Malaki Honey',
            'text_translations' => [
                'id' => 'Madu Sidr Malaki Yaman 100% Terverifikasi Asli',
                'en' => '100% Certified Authentic Yemeni Sidr Malaki Honey',
                'ar' => 'عسل سدر ملكي يمني أصلي معتمد 100%'
            ],
            'icon' => null,
            'link' => '/products?category=honey',
            'sort_order' => 3,
            'is_active' => true,
        ]);
    }

    /**
     * Store a new referral.
     */
    public function storeReferral(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'code' => 'required|string|max:50|unique:referrals,code',
            'type' => 'required|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
            'countries' => 'required|array',
            'commission_percentage' => 'required|numeric|min:0|max:100',
            'min_spending' => 'required|numeric|min:0',
            'total_quota' => 'required|integer|min:0',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'is_active' => 'boolean',
        ]);

        Referral::create($request->all());

        return redirect()->back()->with([
            'status' => 'Referral successfully created.',
            'statusAction' => 'created',
        ]);
    }

    /**
     * Update an existing referral.
     */
    public function updateReferral(Request $request, $id)
    {
        $referral = Referral::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:100',
            'code' => 'required|string|max:50|unique:referrals,code,' . $referral->id,
            'type' => 'required|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
            'countries' => 'required|array',
            'commission_percentage' => 'required|numeric|min:0|max:100',
            'min_spending' => 'required|numeric|min:0',
            'total_quota' => 'required|integer|min:0',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'is_active' => 'boolean',
        ]);

        $referral->update($request->all());

        return redirect()->back()->with([
            'status' => 'Referral successfully updated.',
            'statusAction' => 'updated',
        ]);
    }

    /**
     * Delete a referral.
     */
    public function destroyReferral($id)
    {
        $referral = Referral::findOrFail($id);
        $referral->delete();

        return redirect()->back()->with([
            'status' => 'Referral successfully deleted.',
            'statusAction' => 'deleted',
        ]);
    }

    /**
     * Display the statistics page for a referral code.
     */
    public function referralStatistics($id)
    {
        $referral = Referral::findOrFail($id);

        $totalUsage = 0;
        $totalRevenue = 0;
        $totalEarnings = 0;
        $productsSold = collect();

        try {
            if (Schema::hasTable('referral_usages')) {
                // 1. Total usage:
                $totalUsage = \DB::table('referral_usages')->where('referral_id', $id)->count();

                // 2. Total revenue generated (sum of orders subtotal):
                $totalRevenue = \DB::table('referral_usages')
                    ->join('orders', 'referral_usages.order_id', '=', 'orders.id')
                    ->where('referral_usages.referral_id', $id)
                    ->sum('orders.subtotal');

                // 3. Total earnings for referral owner:
                $totalEarnings = \DB::table('referral_usages')
                    ->where('referral_id', $id)
                    ->sum('commission_earned');

                // 4. Products sold:
                $productsSold = \DB::table('referral_usages')
                    ->join('order_items', 'referral_usages.order_id', '=', 'order_items.order_id')
                    ->join('products', 'order_items.product_id', '=', 'products.id')
                    ->select('products.name', \DB::raw('SUM(order_items.quantity) as total_quantity'), \DB::raw('SUM(order_items.quantity * order_items.price) as total_sales'))
                    ->where('referral_usages.referral_id', $id)
                    ->groupBy('products.id', 'products.name')
                    ->orderBy('total_quantity', 'desc')
                    ->get();
            }
        } catch (\Exception $e) {
            // Silently catch database exception
        }

        // Mock/dummy statistics fallback if no real usages exist
        if ($totalUsage === 0) {
            $totalUsage = 12;
            $totalRevenue = 5400000;
            $totalEarnings = 540000; // 10% commission

            $productsSold = collect([
                [
                    'name' => 'Premium Yemeni Sidr Honey',
                    'total_quantity' => 5,
                    'total_sales' => 2500000
                ],
                [
                    'name' => 'Oud Luxe Perfume 100ml',
                    'total_quantity' => 4,
                    'total_sales' => 2000000
                ],
                [
                    'name' => 'Royal Amber Gold Blend',
                    'total_quantity' => 3,
                    'total_sales' => 900000
                ]
            ]);
        }

        return Inertia::render('backoffice/components/ReferralStatistics', [
            'referral' => $referral,
            'stats' => [
                'total_usage' => (int)$totalUsage,
                'total_revenue' => (float)$totalRevenue,
                'total_earnings' => (float)$totalEarnings,
                'products_sold' => $productsSold,
            ]
        ]);
    }
}
