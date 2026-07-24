<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductBranchStock;
use App\Models\ProductVariant;
use App\Models\ProductVariantBranchStock;
use App\Models\StoreBranch;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CheckoutController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        // Retrieve user's default address or first address
        $defaultAddress = $user ? ($user->addresses()->where('is_default', true)->first() ?? $user->addresses()->first()) : null;

        // Cek apakah user telah melengkapi data profil (untuk pengiriman)
        if ($user && (!$user->phone || !$defaultAddress || !$defaultAddress->address || !$defaultAddress->city || !$defaultAddress->postal_code || !$defaultAddress->receiver_name)) {
            return redirect()->guest(route('register'))->with('error', 'checkout.complete_profile_warning');
        }

        $storeBranches = StoreBranch::where('is_active', true)->get();

        $userVouchers = [];
        if ($user && Schema::hasTable('user_vouchers') && Schema::hasTable('vouchers')) {
            $userVouchers = DB::table('user_vouchers')
                ->join('vouchers', 'user_vouchers.voucher_id', '=', 'vouchers.id')
                ->where('user_vouchers.user_id', $user->id)
                ->where('user_vouchers.is_used', false)
                ->where('vouchers.is_active', true)
                ->where('vouchers.end_date', '>=', now())
                ->where('vouchers.distribution_type', 'manual')
                ->select('vouchers.id', 'vouchers.code', 'vouchers.name', 'vouchers.type', 'vouchers.value', 'vouchers.min_spending', 'vouchers.max_discount')
                ->get();
        }

        return Inertia::render('checkout/CheckoutPage', [
            'user' => $user,
            'storeBranches' => $storeBranches,
            'userVouchers' => $userVouchers,
            'addresses' => $user ? $user->addresses()->orderBy('is_default', 'desc')->get() : [],
        ]);
    }

    public function checkStock(Request $request)
    {
        $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|integer',
            'items.*.variantId' => 'nullable|integer',
        ]);

        $branches = StoreBranch::where('is_active', true)->get();
        $stockData = [];

        foreach ($branches as $branch) {
            $branchStocks = [];
            foreach ($request->items as $item) {
                $productId = $item['id'];
                $variantId = $item['variantId'];
                $stock = 0;

                if ($variantId) {
                    $variant = ProductVariant::find($variantId);
                    $product = Product::find($productId);

                    if ($variant && $variant->parent_id) {
                        $parentVariant = ProductVariant::find($variant->parent_id);
                        if ($parentVariant && $parentVariant->stock_type === 'parent') {
                            $stockRecord = ProductVariantBranchStock::where([
                                'product_variant_id' => $parentVariant->id,
                                'store_branch_id' => $branch->id
                            ])->first();
                            $parentStock = $stockRecord ? $stockRecord->stock : 0;
                            $capacity = $this->parseCapacity($variant);
                            $stock = $capacity > 0 ? (int) floor($parentStock / $capacity) : 0;
                        } else {
                            $stockRecord = ProductVariantBranchStock::where([
                                'product_variant_id' => $variantId,
                                'store_branch_id' => $branch->id
                            ])->first();
                            $stock = $stockRecord ? $stockRecord->stock : 0;
                        }
                    } else if ($product && $product->stock_type === 'parent') {
                        $stockRecord = ProductBranchStock::where([
                            'product_id' => $productId,
                            'store_branch_id' => $branch->id
                        ])->first();
                        $parentStock = $stockRecord ? $stockRecord->stock : 0;
                        $capacity = $this->parseCapacity($variant);
                        $stock = $capacity > 0 ? (int) floor($parentStock / $capacity) : 0;
                    } else {
                        $stockRecord = ProductVariantBranchStock::where([
                            'product_variant_id' => $variantId,
                            'store_branch_id' => $branch->id
                        ])->first();
                        $stock = $stockRecord ? $stockRecord->stock : 0;
                    }
                } else {
                    $stockRecord = ProductBranchStock::where([
                        'product_id' => $productId,
                        'store_branch_id' => $branch->id
                    ])->first();
                    $stock = $stockRecord ? $stockRecord->stock : 0;
                }

                $branchStocks[] = [
                    'id' => $productId,
                    'variantId' => $variantId,
                    'stock' => $stock
                ];
            }
            $stockData[$branch->id] = $branchStocks;
        }

        $weights = [];
        foreach ($request->items as $item) {
            $productId = $item['id'];
            $variantId = $item['variantId'] ?? null;
            $key = $productId . '-' . ($variantId ?? 'null');

            $product = Product::find($productId);
            $variant = $variantId ? ProductVariant::with(['unit', 'parent'])->find($variantId) : null;

            if ($product) {
                $weights[$key] = $this->parseWeight($variant, $product);
            }
        }

        return response()->json([
            'success' => true,
            'stocks' => $stockData,
            'weights' => $weights
        ]);
    }

    public function getRates(Request $request)
    {
        $request->validate([
            'origin_branch_id' => 'required|exists:store_branches,id',
            'destination_area_id' => 'required|string',
            'items' => 'required|array',
            'items.*.id' => 'required|integer',
            'items.*.variantId' => 'nullable|integer',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $originBranch = StoreBranch::findOrFail($request->origin_branch_id);
        $destinationAreaId = $request->destination_area_id;

        // Calculate weights and items payload
        $totalWeight = 0;
        $totalValue = 0;
        $biteshipItems = [];

        foreach ($request->items as $item) {
            $product = Product::find($item['id']);
            $variantId = $item['variantId'] ?? null;
            $variant = $variantId ? ProductVariant::with(['unit', 'parent'])->find($variantId) : null;

            if (!$product) continue;

            $price = $variant ? $variant->price : $product->price;
            $quantity = $item['quantity'];
            $weight = $this->parseWeight($variant, $product);

            $totalWeight += ($weight * $quantity);
            $totalValue += ($price * $quantity);

            $desc = 'Standard Product';
            if ($variant) {
                if ($variant->parent) {
                    $parentName = $variant->parent->name_translations['indonesia'] ?? $variant->parent->name;
                    $childName = $variant->name_translations['indonesia'] ?? $variant->name;
                    $desc = "{$parentName} ({$childName})";
                } else {
                    $desc = $variant->name_translations['indonesia'] ?? $variant->name;
                }
            }

            $biteshipItems[] = [
                'name' => $product->title ?: ($product->name_translations['indonesia'] ?? 'Product'),
                'description' => $desc,
                'value' => (int) $price,
                'weight' => (int) ($weight * $quantity),
                'quantity' => 1
            ];
        }

        // Determine if Biteship is appropriate (origin and destination are Indonesia)
        // Biteship destination area IDs usually start with "ID" (e.g. IDNP6IDNC...)
        $isDomesticID = ($originBranch->country_code === 'ID' && str_starts_with($destinationAreaId, 'ID'));

        if ($isDomesticID) {
            $apiKey = env('BITESHIP_API_KEY');

            try {
                $response = Http::withHeaders([
                    'authorization' => $apiKey,
                ])->post('https://api.biteship.com/v1/rates/couriers', [
                    'origin_area_id' => $originBranch->area_id ?: 'IDNP6IDNC148IDND843IDZ12270', // fallback to Pesanggrahan if empty
                    'destination_area_id' => $destinationAreaId,
                    'couriers' => 'jne,jnt,sicepat,tiki,pos,anteraja,ninja,gojek,grab,wahana',
                    'items' => $biteshipItems
                ]);

                if ($response->successful()) {
                    $data = $response->json();
                    if (isset($data['pricing']) && is_array($data['pricing'])) {
                        $rates = [];
                        foreach ($data['pricing'] as $pricing) {
                            $rates[] = [
                                'courier_name' => strtoupper($pricing['courier_name'] ?? $pricing['courier_company'] ?? $pricing['company'] ?? 'UNKNOWN'),
                                'courier_service_name' => strtoupper($pricing['courier_service_name'] ?? $pricing['courier_service'] ?? $pricing['courier_service_code'] ?? 'STANDARD'),
                                'price' => $pricing['price'] ?? $pricing['shipping_fee'] ?? 0,
                                'duration' => $pricing['duration'] ?? '2-3 days',
                            ];
                        }
                        return response()->json([
                            'success' => true,
                            'rates' => $rates
                        ]);
                    }
                }

                // If API failed, fallback to local default
                return $this->getDomesticIDFallbackRates($totalWeight);
            } catch (\Exception $e) {
                return $this->getDomesticIDFallbackRates($totalWeight);
            }
        }

        // Handle International and other branch domestic shipping
        return $this->getInternationalOrFallbackRates($originBranch, $destinationAreaId, $totalWeight);
    }

    public function applyVoucher(Request $request)
    {
        $request->validate([
            'subtotal' => 'required|numeric|min:0',
            'other_discount' => 'nullable|numeric|min:0',
            'voucher_id' => 'nullable|integer',
            'code' => 'nullable|string',
        ]);

        $subtotal = (float)$request->subtotal;
        $otherDiscount = (float)($request->other_discount ?? 0);
        $remainingSubtotal = max(0.0, $subtotal - $otherDiscount);
        $userId = auth()->id();

        // Case 1: Manual Voucher selected from dropdown
        if ($request->voucher_id) {
            $voucher = Voucher::where('id', $request->voucher_id)->where('distribution_type', 'manual')->first();
            if (!$voucher) {
                return response()->json(['success' => false, 'message' => 'Voucher tidak ditemukan.'], 422);
            }

            if (!$voucher->is_active) {
                return response()->json(['success' => false, 'message' => 'Voucher sudah tidak aktif.'], 422);
            }

            $now = now();
            if ($voucher->start_date && $voucher->start_date->gt($now)) {
                return response()->json(['success' => false, 'message' => 'Masa berlaku voucher belum dimulai.'], 422);
            }

            if ($voucher->end_date && $voucher->end_date->lt($now)) {
                return response()->json(['success' => false, 'message' => 'Voucher sudah kedaluwarsa.'], 422);
            }

            if ($voucher->total_quota > 0 && $voucher->used_quota >= $voucher->total_quota) {
                return response()->json(['success' => false, 'message' => 'Kuota voucher telah habis.'], 422);
            }

            if (Schema::hasTable('voucher_usages')) {
                $userUsage = DB::table('voucher_usages')
                    ->where('voucher_id', $voucher->id)
                    ->where('user_id', $userId)
                    ->count();

                if ($userUsage >= $voucher->max_use_per_user) {
                    return response()->json(['success' => false, 'message' => 'Anda telah melebihi batas maksimal penggunaan voucher ini.'], 422);
                }
            }

            if (Schema::hasTable('user_vouchers')) {
                $assignment = DB::table('user_vouchers')
                    ->where('voucher_id', $voucher->id)
                    ->where('user_id', $userId)
                    ->first();

                if (!$assignment) {
                    return response()->json(['success' => false, 'message' => 'Voucher ini tidak ditargetkan untuk akun Anda.'], 422);
                }

                if ($assignment->is_used) {
                    return response()->json(['success' => false, 'message' => 'Voucher ini sudah pernah Anda gunakan.'], 422);
                }
            } else {
                return response()->json(['success' => false, 'message' => 'Sistem voucher manual tidak tersedia.'], 422);
            }

            if ($subtotal < $voucher->min_spending) {
                $diff = $voucher->min_spending - $subtotal;
                return response()->json([
                    'success' => false,
                    'message' => 'Minimal belanja untuk voucher ini adalah Rp ' . number_format($voucher->min_spending, 0, ',', '.') . '. Kurang Rp ' . number_format($diff, 0, ',', '.') . ' lagi.'
                ], 422);
            }

            $discountAmount = 0;
            if ($voucher->type === 'fixed') {
                $discountAmount = (float)$voucher->value;
            } elseif ($voucher->type === 'percentage') {
                $discountAmount = $remainingSubtotal * ($voucher->value / 100);
                if ($voucher->max_discount > 0 && $discountAmount > $voucher->max_discount) {
                    $discountAmount = (float)$voucher->max_discount;
                }
            }

            if ($discountAmount > $remainingSubtotal) {
                $discountAmount = $remainingSubtotal;
            }

            return response()->json([
                'success' => true,
                'message' => 'Voucher berhasil diterapkan.',
                'applied_type' => 'manual_voucher',
                'voucher' => [
                    'id' => $voucher->id,
                    'code' => $voucher->code,
                    'name' => $voucher->name,
                    'type' => $voucher->type,
                    'value' => $voucher->value,
                    'min_spending' => $voucher->min_spending,
                    'max_discount' => $voucher->max_discount,
                    'discount_amount' => $discountAmount,
                ]
            ]);
        }

        // Case 2: Code applied via input field (scans Event Vouchers AND Referrals)
        if ($request->code) {
            $code = strtoupper(trim($request->code));

            // A. Check Event Voucher first
            $voucher = Voucher::where('code', $code)->where('distribution_type', 'event')->first();
            if ($voucher) {
                if (!$voucher->is_active) {
                    return response()->json(['success' => false, 'message' => 'Voucher sudah tidak aktif.'], 422);
                }

                $now = now();
                if ($voucher->start_date && $voucher->start_date->gt($now)) {
                    return response()->json(['success' => false, 'message' => 'Masa berlaku voucher belum dimulai.'], 422);
                }

                if ($voucher->end_date && $voucher->end_date->lt($now)) {
                    return response()->json(['success' => false, 'message' => 'Voucher sudah kedaluwarsa.'], 422);
                }

                if ($voucher->total_quota > 0 && $voucher->used_quota >= $voucher->total_quota) {
                    return response()->json(['success' => false, 'message' => 'Kuota voucher telah habis.'], 422);
                }

                if (Schema::hasTable('voucher_usages')) {
                    $userUsage = DB::table('voucher_usages')
                        ->where('voucher_id', $voucher->id)
                        ->where('user_id', $userId)
                        ->count();

                    if ($userUsage >= $voucher->max_use_per_user) {
                        return response()->json(['success' => false, 'message' => 'Anda telah melebihi batas maksimal penggunaan voucher ini.'], 422);
                    }
                }

                if ($subtotal < $voucher->min_spending) {
                    $diff = $voucher->min_spending - $subtotal;
                    return response()->json([
                        'success' => false,
                        'message' => 'Minimal belanja untuk voucher ini adalah Rp ' . number_format($voucher->min_spending, 0, ',', '.') . '. Kurang Rp ' . number_format($diff, 0, ',', '.') . ' lagi.'
                    ], 422);
                }

                $discountAmount = 0;
                if ($voucher->type === 'fixed') {
                    $discountAmount = (float)$voucher->value;
                } elseif ($voucher->type === 'percentage') {
                    $discountAmount = $remainingSubtotal * ($voucher->value / 100);
                    if ($voucher->max_discount > 0 && $discountAmount > $voucher->max_discount) {
                        $discountAmount = (float)$voucher->max_discount;
                    }
                }

                if ($discountAmount > $remainingSubtotal) {
                    $discountAmount = $remainingSubtotal;
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Voucher event berhasil diterapkan.',
                    'applied_type' => 'event_voucher',
                    'voucher' => [
                        'id' => $voucher->id,
                        'code' => $voucher->code,
                        'name' => $voucher->name,
                        'type' => $voucher->type,
                        'value' => $voucher->value,
                        'min_spending' => $voucher->min_spending,
                        'max_discount' => $voucher->max_discount,
                        'discount_amount' => $discountAmount,
                    ]
                ]);
            }

            // B. Check Referral Code next
            if (Schema::hasTable('referrals')) {
                $referral = \App\Models\Referral::where('code', $code)->first();
                if ($referral) {
                    if (!$referral->is_active) {
                        return response()->json(['success' => false, 'message' => 'Kode referral sudah tidak aktif.'], 422);
                    }

                    $now = now();
                    if ($referral->start_date && $referral->start_date->gt($now)) {
                        return response()->json(['success' => false, 'message' => 'Masa berlaku kode referral belum dimulai.'], 422);
                    }

                    if ($referral->end_date && $referral->end_date->lt($now)) {
                        return response()->json(['success' => false, 'message' => 'Kode referral sudah kedaluwarsa.'], 422);
                    }

                    if ($referral->total_quota > 0 && $referral->used_quota >= $referral->total_quota) {
                        return response()->json(['success' => false, 'message' => 'Kuota penggunaan kode referral telah habis.'], 422);
                    }

                    if ($subtotal < $referral->min_spending) {
                        $diff = $referral->min_spending - $subtotal;
                        return response()->json([
                            'success' => false,
                            'message' => 'Minimal belanja untuk kode referral ini adalah Rp ' . number_format($referral->min_spending, 0, ',', '.') . '. Kurang Rp ' . number_format($diff, 0, ',', '.') . ' lagi.'
                        ], 422);
                    }

                    $discountAmount = 0;
                    if ($referral->type === 'fixed') {
                        $discountAmount = (float)$referral->value;
                    } elseif ($referral->type === 'percentage') {
                        $discountAmount = $remainingSubtotal * ($referral->value / 100);
                    }

                    if ($discountAmount > $remainingSubtotal) {
                        $discountAmount = $remainingSubtotal;
                    }

                    return response()->json([
                        'success' => true,
                        'message' => 'Kode referral berhasil diterapkan.',
                        'applied_type' => 'referral',
                        'referral' => [
                            'id' => $referral->id,
                            'code' => $referral->code,
                            'name' => $referral->name,
                            'type' => $referral->type,
                            'value' => $referral->value,
                            'min_spending' => $referral->min_spending,
                            'discount_amount' => $discountAmount,
                        ]
                    ]);
                }
            }

            return response()->json(['success' => false, 'message' => 'Kode voucher atau referral tidak valid.'], 422);
        }

        return response()->json(['success' => false, 'message' => 'Kode atau ID voucher harus diisi.'], 422);
    }

    public function placeOrder(Request $request)
    {
        $request->validate([
            'store_branch_id' => 'required|exists:store_branches,id',
            'shipping_courier' => 'required|string',
            'shipping_service' => 'required|string',
            'shipping_cost' => 'required|numeric|min:0',
            'shipping_address' => 'required|string',
            'notes' => 'nullable|string',
            'payment_method' => 'required|string',
            'area_id' => 'required|string',
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|integer',
            'items.*.variantId' => 'nullable|integer',
            'items.*.quantity' => 'required|integer|min:1',
            'voucher_id' => 'nullable|integer',
            'voucher_code' => 'nullable|string',
            'event_voucher_id' => 'nullable|integer',
            'event_voucher_code' => 'nullable|string',
            'referral_id' => 'nullable|integer',
            'referral_code' => 'nullable|string',
        ]);

        $user = auth()->user();
        $branchId = $request->store_branch_id;
        $items = $request->items;

        // 1. Stock Validation
        // Aggregate capacity requirements for 'parent' stock products to prevent race/mixture issues
        $parentStockRequired = [];
        $parentVariantStockRequired = [];
        foreach ($items as $item) {
            $productId = $item['id'];
            $variantId = $item['variantId'] ?? null;
            $qty = $item['quantity'];

            $product = Product::find($productId);
            $variant = $variantId ? ProductVariant::find($variantId) : null;

            if ($variant && $variant->parent_id) {
                $parentVariant = ProductVariant::find($variant->parent_id);
                if ($parentVariant && $parentVariant->stock_type === 'parent') {
                    $capacity = $this->parseCapacity($variant);
                    if (!isset($parentVariantStockRequired[$parentVariant->id])) {
                        $parentVariantStockRequired[$parentVariant->id] = 0;
                    }
                    $parentVariantStockRequired[$parentVariant->id] += ($capacity * $qty);
                }
            } else if ($product && $product->stock_type === 'parent') {
                $capacity = $this->parseCapacity($variant);

                if (!isset($parentStockRequired[$productId])) {
                    $parentStockRequired[$productId] = 0;
                }
                $parentStockRequired[$productId] += ($capacity * $qty);
            }
        }

        // Validate aggregated parent stocks
        foreach ($parentStockRequired as $productId => $totalRequired) {
            $stockRecord = ProductBranchStock::where([
                'product_id' => $productId,
                'store_branch_id' => $branchId
            ])->first();

            $availableStock = $stockRecord ? $stockRecord->stock : 0;
            if ($availableStock < $totalRequired) {
                $product = Product::find($productId);
                return response()->json([
                    'success' => false,
                    'message' => 'Stock for parent product "' . ($product ? $product->title : $productId) . '" is insufficient.'
                ], 422);
            }
        }

        // Validate aggregated parent variant stocks
        foreach ($parentVariantStockRequired as $parentVariantId => $totalRequired) {
            $stockRecord = ProductVariantBranchStock::where([
                'product_variant_id' => $parentVariantId,
                'store_branch_id' => $branchId
            ])->first();

            $availableStock = $stockRecord ? $stockRecord->stock : 0;
            if ($availableStock < $totalRequired) {
                $parentVariant = ProductVariant::find($parentVariantId);
                return response()->json([
                    'success' => false,
                    'message' => 'Stock for parent variant "' . ($parentVariant ? $parentVariant->name : $parentVariantId) . '" is insufficient.'
                ], 422);
            }
        }

        // Validate standard product stocks
        foreach ($items as $item) {
            $productId = $item['id'];
            $variantId = $item['variantId'] ?? null;
            $qty = $item['quantity'];

            $product = Product::find($productId);
            $variant = $variantId ? ProductVariant::find($variantId) : null;

            if ($variant && $variant->parent_id) {
                $parentVariant = ProductVariant::find($variant->parent_id);
                if ($parentVariant && $parentVariant->stock_type === 'parent') {
                    continue; // already validated in parent variant check
                }
            } else if ($product && $product->stock_type === 'parent') {
                continue; // already validated in parent check
            }

            if ($variantId) {
                $stockRecord = ProductVariantBranchStock::where([
                    'product_variant_id' => $variantId,
                    'store_branch_id' => $branchId
                ])->first();

                if (!$stockRecord || $stockRecord->stock < $qty) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Stock for variant "' . ($variant ? $variant->name : $variantId) . '" is insufficient.'
                    ], 422);
                }
            } else {
                $stockRecord = ProductBranchStock::where([
                    'product_id' => $productId,
                    'store_branch_id' => $branchId
                ])->first();

                if (!$stockRecord || $stockRecord->stock < $qty) {
                    $product = Product::find($productId);
                    return response()->json([
                        'success' => false,
                        'message' => 'Stock for product "' . ($product ? $product->title : $productId) . '" is insufficient.'
                    ], 422);
                }
            }
        }

        // 2. Perform Transaction
        try {
            $order = DB::transaction(function () use ($request, $user, $branchId, $items) {
                // Calculate subtotal
                $subtotal = 0;
                $orderItemsData = [];

                foreach ($items as $item) {
                    $product = Product::findOrFail($item['id']);
                    $price = $product->price;
                    $variantId = $item['variantId'] ?? null;

                    if ($variantId) {
                        $variant = ProductVariant::findOrFail($variantId);
                        $price = $variant->price;
                    }

                    $subtotal += ($price * $item['quantity']);

                    $orderItemsData[] = [
                        'product_id' => $item['id'],
                        'product_variant_id' => $variantId,
                        'quantity' => $item['quantity'],
                        'price' => $price
                    ];
                }

                // Update User destination Area ID safely if the column exists in the database
                if ($user && Schema::hasColumn('users', 'area_id')) {
                    $user->update(['area_id' => $request->area_id]);
                }

                $invoiceNumber = 'INV-' . date('Ymd') . '-' . strtoupper(Str::random(6));

                // Resolve manual voucher and calculate manual discount
                $manualVoucherId = $request->voucher_id;
                $manualVoucher = null;
                $manualDiscount = 0;

                if ($manualVoucherId) {
                    $manualVoucher = Voucher::find($manualVoucherId);
                    if ($manualVoucher && $manualVoucher->distribution_type === 'manual') {
                        if (
                            $manualVoucher->is_active &&
                            (!$manualVoucher->start_date || $manualVoucher->start_date->lte(now())) &&
                            (!$manualVoucher->end_date || $manualVoucher->end_date->gte(now())) &&
                            ($manualVoucher->total_quota == 0 || $manualVoucher->used_quota < $manualVoucher->total_quota) &&
                            ($subtotal >= $manualVoucher->min_spending)
                        ) {
                            $userUsage = DB::table('voucher_usages')->where('voucher_id', $manualVoucher->id)->where('user_id', $user->id)->count();
                            if ($userUsage < $manualVoucher->max_use_per_user) {
                                $canUse = false;
                                if (Schema::hasTable('user_vouchers')) {
                                    $assignment = DB::table('user_vouchers')
                                        ->where('voucher_id', $manualVoucher->id)
                                        ->where('user_id', $user->id)
                                        ->where('is_used', false)
                                        ->first();
                                    if ($assignment) {
                                        $canUse = true;
                                    }
                                }

                                if ($canUse) {
                                    if ($manualVoucher->type === 'fixed') {
                                        $manualDiscount = (float)$manualVoucher->value;
                                    } elseif ($manualVoucher->type === 'percentage') {
                                        $manualDiscount = $subtotal * ($manualVoucher->value / 100);
                                        if ($manualVoucher->max_discount > 0 && $manualDiscount > $manualVoucher->max_discount) {
                                            $manualDiscount = (float)$manualVoucher->max_discount;
                                        }
                                    }

                                    if ($manualDiscount > $subtotal) {
                                        $manualDiscount = $subtotal;
                                    }
                                }
                            }
                        }
                    }
                }

                // Resolve event voucher and calculate event discount
                $eventVoucherId = $request->event_voucher_id;
                $eventVoucherCode = $request->event_voucher_code;
                $eventVoucher = null;
                $eventDiscount = 0;

                if ($eventVoucherId) {
                    $eventVoucher = Voucher::find($eventVoucherId);
                } elseif ($eventVoucherCode) {
                    $eventVoucher = Voucher::where('code', strtoupper(trim($eventVoucherCode)))->first();
                }

                if ($eventVoucher && $eventVoucher->distribution_type === 'event') {
                    if (
                        $eventVoucher->is_active &&
                        (!$eventVoucher->start_date || $eventVoucher->start_date->lte(now())) &&
                        (!$eventVoucher->end_date || $eventVoucher->end_date->gte(now())) &&
                        ($eventVoucher->total_quota == 0 || $eventVoucher->used_quota < $eventVoucher->total_quota) &&
                        ($subtotal >= $eventVoucher->min_spending)
                    ) {
                        $userUsage = DB::table('voucher_usages')->where('voucher_id', $eventVoucher->id)->where('user_id', $user->id)->count();
                        if ($userUsage < $eventVoucher->max_use_per_user) {
                            $remainingSubtotal = max(0, $subtotal - $manualDiscount);
                            if ($remainingSubtotal > 0) {
                                if ($eventVoucher->type === 'fixed') {
                                    $eventDiscount = (float)$eventVoucher->value;
                                } elseif ($eventVoucher->type === 'percentage') {
                                    $eventDiscount = $remainingSubtotal * ($eventVoucher->value / 100);
                                    if ($eventVoucher->max_discount > 0 && $eventDiscount > $eventVoucher->max_discount) {
                                        $eventDiscount = (float)$eventVoucher->max_discount;
                                    }
                                }

                                if ($eventDiscount > $remainingSubtotal) {
                                    $eventDiscount = $remainingSubtotal;
                                }
                            }
                        }
                    }
                }

                // Resolve referral code and calculate referral discount
                $referralId = $request->referral_id;
                $referralCode = $request->referral_code;
                $referral = null;
                $referralDiscount = 0;

                if ($referralId) {
                    $referral = \App\Models\Referral::find($referralId);
                } elseif ($referralCode) {
                    $referral = \App\Models\Referral::where('code', strtoupper(trim($referralCode)))->first();
                }

                if ($referral) {
                    if (
                        $referral->is_active &&
                        (!$referral->start_date || $referral->start_date->lte(now())) &&
                        (!$referral->end_date || $referral->end_date->gte(now())) &&
                        ($referral->total_quota == 0 || $referral->used_quota < $referral->total_quota) &&
                        ($subtotal >= $referral->min_spending)
                    ) {
                        $remainingSubtotal = max(0.0, $subtotal - $manualDiscount - $eventDiscount);
                        if ($remainingSubtotal > 0) {
                            if ($referral->type === 'fixed') {
                                $referralDiscount = (float)$referral->value;
                            } elseif ($referral->type === 'percentage') {
                                $referralDiscount = $remainingSubtotal * ($referral->value / 100);
                            }

                            if ($referralDiscount > $remainingSubtotal) {
                                $referralDiscount = $remainingSubtotal;
                            }
                        }
                    }
                }

                $discountAmount = $manualDiscount + $eventDiscount + $referralDiscount;

                // Create Order
                $order = Order::create([
                    'invoice_number' => $invoiceNumber,
                    'user_id' => $user->id,
                    'store_branch_id' => $branchId,
                    'subtotal' => $subtotal,
                    'discount_amount' => $discountAmount,
                    'shipping_cost' => $request->shipping_cost,
                    'total_amount' => $subtotal + $request->shipping_cost - $discountAmount,
                    'shipping_courier' => $request->shipping_courier,
                    'shipping_service' => $request->shipping_service,
                    'shipping_address' => $request->shipping_address,
                    'notes' => $request->notes,
                    'status' => 'pending',
                    'payment_status' => 'unpaid',
                    'payment_method' => $request->payment_method,
                ]);

                // Track and apply manual voucher usage
                if ($manualVoucher && $manualDiscount > 0) {
                    $manualVoucher->increment('used_quota');

                    if (Schema::hasTable('voucher_usages')) {
                        DB::table('voucher_usages')->insert([
                            'voucher_id' => $manualVoucher->id,
                            'user_id' => $user->id,
                            'order_id' => $order->id,
                            'discount_obtained' => $manualDiscount,
                            'used_at' => now(),
                        ]);
                    }

                    if (Schema::hasTable('user_vouchers')) {
                        DB::table('user_vouchers')
                            ->where('voucher_id', $manualVoucher->id)
                            ->where('user_id', $user->id)
                            ->update([
                                'is_used' => true,
                                'used_at' => now(),
                                'updated_at' => now()
                            ]);
                    }
                }

                // Track and apply event voucher usage
                if ($eventVoucher && $eventDiscount > 0) {
                    $eventVoucher->increment('used_quota');

                    if (Schema::hasTable('voucher_usages')) {
                        DB::table('voucher_usages')->insert([
                            'voucher_id' => $eventVoucher->id,
                            'user_id' => $user->id,
                            'order_id' => $order->id,
                            'discount_obtained' => $eventDiscount,
                            'used_at' => now(),
                        ]);
                    }
                }

                // Track and apply referral usage
                if ($referral && $referralDiscount > 0) {
                    $referral->increment('used_quota');

                    $commissionEarned = $subtotal * ($referral->commission_percentage / 100);

                    if (Schema::hasTable('referral_usages')) {
                        DB::table('referral_usages')->insert([
                            'referral_id' => $referral->id,
                            'user_id' => $user->id,
                            'order_id' => $order->id,
                            'discount_obtained' => $referralDiscount,
                            'commission_earned' => $commissionEarned,
                            'used_at' => now(),
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }

                // Create Order Items
                foreach ($orderItemsData as $itemData) {
                    $order->items()->create($itemData);
                }

                if ($request->payment_method !== 'cod') {
                    try {
                        $details = $this->chargePayment($order, $request->payment_method);
                        $order->payment_details = $details;
                        $order->save();
                    } catch (\Throwable $gatewayEx) {
                        throw new \Exception("Payment Gateway Error: " . $gatewayEx->getMessage());
                    }
                }

                return $order;
            });

            return response()->json([
                'success' => true,
                'order' => $order,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to place order: ' . $e->getMessage()
            ], 500);
        }
    }

    public function success($id)
    {
        $order = Order::with(['user', 'items.product', 'items.variant', 'storeBranch'])->findOrFail($id);

        if ($order->user_id !== auth()->id()) {
            abort(403);
        }

        return Inertia::render('checkout/SuccessPage', [
            'order' => $order
        ]);
    }

    private function parseWeight($variant, $product)
    {
        // 1. If variant is present, try to check its direct weight field first, then try to parse weight from name/unit
        if ($variant) {
            if (isset($variant->weight) && $variant->weight > 0) {
                return (int) $variant->weight;
            }

            if ($variant->parent && isset($variant->parent->weight) && $variant->parent->weight > 0) {
                return (int) $variant->parent->weight;
            }

            $namesToTry = [];
            $namesToTry[] = [
                'text' => $variant->name,
                'unit' => $variant->unit
            ];

            if ($variant->parent) {
                $namesToTry[] = [
                    'text' => $variant->parent->name,
                    'unit' => $variant->parent->unit
                ];
            }

            foreach ($namesToTry as $itemToTry) {
                $textToParse = $itemToTry['text'];
                $unitName = '';

                if ($itemToTry['unit']) {
                    if (is_object($itemToTry['unit'])) {
                        $unitName = strtolower($itemToTry['unit']->name ?? '');
                    } else {
                        $unitName = strtolower((string)$itemToTry['unit']);
                    }
                } elseif ($product && !empty($product->unit)) {
                    if (is_object($product->unit)) {
                        $unitName = strtolower($product->unit->name ?? '');
                    } else {
                        $unitName = strtolower((string)$product->unit);
                    }
                }

                preg_match('/(\d+(?:\.\d+)?)\s*(kilogram|kg|gram|gr|g|ml|l|pcs)?/i', $textToParse, $matches);

                if (!empty($matches)) {
                    $value_str = $matches[1];
                    $unit = isset($matches[2]) ? strtolower($matches[2]) : '';

                    $isKgOrL = in_array($unit, ['kg', 'kilogram', 'l']) || in_array($unitName, ['kg', 'kilogram', 'l']);
                    if (!$isKgOrL && preg_match('/\.\d{3}$/', $value_str)) {
                        $value_str = str_replace('.', '', $value_str);
                    }

                    $value = (float) $value_str;

                    if ($unit === 'kg' || $unit === 'kilogram' || $unitName === 'kilogram' || $unitName === 'kg') {
                        return (int) ($value * 1000);
                    }

                    if (in_array($unit, ['g', 'gr', 'gram']) || $unitName === 'gram' || $unitName === 'gr' || $unitName === 'g') {
                        return (int) $value;
                    }
                }
            }
        }

        // 2. If it's a single product or the variant didn't yield a weight, use the product's weight field
        if ($product && isset($product->weight) && $product->weight > 0) {
            return (int) $product->weight;
        }

        // 3. Fallback to product title parsing
        if ($product) {
            $textToParse = $product->title;
            preg_match('/(\d+(?:\.\d+)?)\s*(kilogram|kg|gram|gr|g)?/i', $textToParse, $matches);
            if (!empty($matches)) {
                $value_str = $matches[1];
                $unit = isset($matches[2]) ? strtolower($matches[2]) : '';
                
                $isKg = in_array($unit, ['kg', 'kilogram']);
                if (!$isKg && preg_match('/\.\d{3}$/', $value_str)) {
                    $value_str = str_replace('.', '', $value_str);
                }
                
                $value = (float) $value_str;
                
                if ($unit === 'kg' || $unit === 'kilogram') {
                    return (int) ($value * 1000);
                }
                if (in_array($unit, ['g', 'gr', 'gram'])) {
                    return (int) $value;
                }
            }
        }

        return 1000; // Default to 1000g (1kg)
    }

    private function getDomesticIDFallbackRates($totalWeight)
    {
        $weightInKg = (int) ceil($totalWeight / 1000);
        if ($weightInKg < 1) {
            $weightInKg = 1;
        }

        $rates = [
            [
                'courier_name' => 'JNE',
                'courier_service_name' => 'REGULER',
                'price' => $weightInKg * 23000,
                'duration' => '1 - 2 days',
            ],
            [
                'courier_name' => 'SICEPAT',
                'courier_service_name' => 'REGULER',
                'price' => $weightInKg * 21000,
                'duration' => '2 - 3 days',
            ],
            [
                'courier_name' => 'J&T',
                'courier_service_name' => 'EZ',
                'price' => $weightInKg * 21000,
                'duration' => '2 - 3 days',
            ],
            [
                'courier_name' => 'ANTERAJA',
                'courier_service_name' => 'REGULER',
                'price' => $weightInKg * 24800,
                'duration' => '2 - 4 days',
            ],
            [
                'courier_name' => 'TIKI',
                'courier_service_name' => 'REGULER',
                'price' => $weightInKg * 21000,
                'duration' => '3 days',
            ],
            [
                'courier_name' => 'POS INDONESIA',
                'courier_service_name' => 'POS REGULER',
                'price' => $weightInKg * 21000,
                'duration' => '2 days',
            ]
        ];

        // JNE Trucking has a minimum weight of 10 kg
        if ($weightInKg >= 10) {
            $rates[] = [
                'courier_name' => 'JNE',
                'courier_service_name' => 'JNE TRUCKING',
                'price' => 60000 + (($weightInKg - 10) * 6000),
                'duration' => '4 - 5 days',
            ];
        } else {
            $rates[] = [
                'courier_name' => 'JNE',
                'courier_service_name' => 'JNE TRUCKING',
                'price' => 60000,
                'duration' => '4 - 5 days',
            ];
        }

        // Sort rates by price ascending
        usort($rates, function ($a, $b) {
            return $a['price'] <=> $b['price'];
        });

        return response()->json([
            'success' => true,
            'rates' => $rates
        ]);
    }

    private function getInternationalOrFallbackRates($originBranch, $destinationAreaId, $totalWeight)
    {
        $weightInKg = ceil($totalWeight / 1000);

        // Case 1: International Shipment (origin country != destination country or destination area doesn't match ID)
        // Since we determine destination by area_id or country code:
        // If destination area ID is not starting with "ID", or destination country isn't Indonesia
        $isDestinationIndonesia = str_starts_with($destinationAreaId, 'ID');
        $isOriginIndonesia = ($originBranch->country_code === 'ID');

        if ($isOriginIndonesia && !$isDestinationIndonesia) {
            // ID to MY/SA (International)
            $cost = $weightInKg * 150000; // Rp 150.000 per kg
            return response()->json([
                'success' => true,
                'rates' => [
                    [
                        'courier_name' => 'Fayyfir Express',
                        'courier_service_name' => 'International Standard',
                        'price' => $cost,
                        'duration' => '5-7 Days',
                    ]
                ]
            ]);
        }

        // Case 2: Malaysia domestic (origin MY, destination MY or international to MY)
        if ($originBranch->country_code === 'MY') {
            $cost = $weightInKg * 35000; // approx RM 10 per kg = Rp 35.000
            return response()->json([
                'success' => true,
                'rates' => [
                    [
                        'courier_name' => 'Fayyfir Courier MY',
                        'courier_service_name' => 'Local Malaysia Delivery',
                        'price' => $cost,
                        'duration' => '2-3 Days',
                    ]
                ]
            ]);
        }

        // Case 3: Saudi Arabia domestic (origin SA, destination SA or international to SA)
        if ($originBranch->country_code === 'SA') {
            $cost = $weightInKg * 85000; // approx SAR 20 per kg = Rp 85.000
            return response()->json([
                'success' => true,
                'rates' => [
                    [
                        'courier_name' => 'Fayyfir Courier SA',
                        'courier_service_name' => 'Riyadh Express Delivery',
                        'price' => $cost,
                        'duration' => '1-2 Days',
                    ]
                ]
            ]);
        }

        // Default global fallback
        $cost = $weightInKg * 100000;
        return response()->json([
            'success' => true,
            'rates' => [
                [
                    'courier_name' => 'Standard Shipping',
                    'courier_service_name' => 'Fayyfir Standard',
                    'price' => $cost,
                    'duration' => '3-5 Days',
                ]
            ]
        ]);
    }

    private function parseCapacity($variant)
    {
        if (!$variant) {
            return 1;
        }

        $textToParse = $variant->name; // e.g., "50 ml" or "Merah (50 ml)"

        // Match a number in the string (possibly in parentheses, e.g. "Merah (50 ml)")
        preg_match('/(\d+(?:\.\d+)?)\s*(kilogram|kg|gram|gr|g|ml|l|liter|pcs)?/i', $textToParse, $matches);

        if (!empty($matches)) {
            $value_str = $matches[1];
            $unit = isset($matches[2]) ? strtolower($matches[2]) : '';
            
            $isLargeUnit = in_array($unit, ['kg', 'kilogram', 'l', 'liter']);
            if (!$isLargeUnit && preg_match('/\.\d{3}$/', $value_str)) {
                $value_str = str_replace('.', '', $value_str);
            }
            return (float) $value_str;
        }

        return 1; // Default fallback to 1 to avoid division by zero
    }

    public function xenditCallback(Request $request)
    {
        $token = $request->header('x-callback-token') ?? $request->header('X-CALLBACK-TOKEN');
        $configuredToken = config('services.xendit.webhook_token');
        
        if ($configuredToken && $token !== $configuredToken) {
            return response()->json(['message' => 'Invalid webhook token'], 403);
        }

        $externalId = $request->input('external_id') ?? $request->input('externalId') ?? $request->input('reference_id') ?? $request->input('data.reference_id');
        $invoiceId = $request->input('id') ?? $request->input('invoice_id') ?? $request->input('data.id');
        $status = strtoupper($request->input('status') ?? $request->input('event') ?? $request->input('data.status') ?? '');

        if (!$externalId && !$invoiceId) {
            return response()->json(['message' => 'Missing transaction identifier'], 400);
        }

        $order = null;
        if ($externalId) {
            $parts = explode('-', $externalId);
            if (count($parts) >= 3) {
                $invoiceNumber = implode('-', array_slice($parts, 0, 3));
                $order = Order::with('items')->where('invoice_number', $invoiceNumber)->first();
            }
            if (!$order) {
                $order = Order::with('items')->where('invoice_number', $externalId)->first();
            }
        }

        if (!$order && $invoiceId) {
            $order = Order::with('items')
                ->where('payment_details->xendit_invoice_id', $invoiceId)
                ->orWhere('payment_details->xendit_va_id', $invoiceId)
                ->orWhere('payment_details->xendit_qr_id', $invoiceId)
                ->orWhere('payment_details->xendit_retail_id', $invoiceId)
                ->orWhere('payment_details->xendit_ewallet_id', $invoiceId)
                ->first();
        }

        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        $paymentStatus = 'unpaid';
        $orderStatus = $order->status;

        if (in_array($status, ['PAID', 'SETTLED', 'SUCCEEDED', 'COMPLETED', 'QR_CODE.PAYMENT'])) {
            $paymentStatus = 'paid';
            $orderStatus = 'processing';
        } elseif (in_array($status, ['EXPIRED', 'EXPIRE', 'CANCELLED', 'FAILED'])) {
            $paymentStatus = 'expired';
            $orderStatus = 'cancelled';
        } elseif ($status === 'PENDING' || $status === 'ACTIVE') {
            $paymentStatus = 'unpaid';
            $orderStatus = 'pending';
        }

        $details = $order->payment_details ?: [];
        if (is_array($details)) {
            $details['transaction_status'] = strtolower($status);
            $order->payment_details = $details;
        }

        $order->update([
            'payment_status' => $paymentStatus,
            'status' => $orderStatus,
        ]);

        return response()->json(['message' => 'Xendit callback handled successfully']);
    }

    public function payment($id)
    {
        $order = Order::with(['items.product', 'items.variant', 'storeBranch'])->findOrFail($id);

        if ($order->user_id !== auth()->id()) {
            abort(403);
        }

        return Inertia::render('checkout/PaymentPage', [
            'order' => $order,
            'activeGateway' => config('services.payment_gateway', 'xendit'),
            'xenditPublicKey' => config('services.xendit.public_key'),
            'midtransClientKey' => config('services.midtrans.client_key'),
            'isProduction' => app()->environment('production'),
        ]);
    }

    public function paymentStatus($id)
    {
        $order = Order::select('id', 'user_id', 'status', 'payment_status')->findOrFail($id);

        if ($order->user_id !== auth()->id()) {
            abort(403);
        }

        return response()->json([
            'status' => $order->status,
            'payment_status' => $order->payment_status,
        ]);
    }

    public function changePaymentMethod(Request $request, $id)
    {
        $request->validate([
            'payment_method' => 'required|string',
            'phone_number' => 'nullable|string',
        ]);

        $order = Order::findOrFail($id);

        if ($order->user_id !== auth()->id()) {
            abort(403);
        }

        if ($order->payment_status === 'paid' || $order->status === 'cancelled') {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan ini sudah dibayar atau dibatalkan.'
            ], 422);
        }

        try {
            if ($order->payment_details) {
                if (isset($order->payment_details['xendit_invoice_id'])) {
                    try {
                        \Xendit\Configuration::setXenditKey(config('services.xendit.secret_key'));
                        $apiInstance = new \Xendit\Invoice\InvoiceApi();
                        $apiInstance->expireInvoice($order->payment_details['xendit_invoice_id']);
                    } catch (\Throwable $cancelEx) {}
                }
                if (isset($order->payment_details['midtrans_order_id'])) {
                    try {
                        \Midtrans\Config::$serverKey = config('services.midtrans.server_key');
                        \Midtrans\Config::$isProduction = config('services.midtrans.is_production');
                        \Midtrans\Transaction::cancel($order->payment_details['midtrans_order_id']);
                    } catch (\Throwable $cancelEx) {}
                }
            }

            $details = $this->chargePayment($order, $request->payment_method, $request->phone_number);
            $order->update([
                'payment_method' => $request->payment_method,
                'payment_details' => $details,
            ]);

            return response()->json([
                'success' => true,
                'order' => $order->load(['items.product', 'items.variant', 'storeBranch']),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengubah metode pembayaran: ' . $e->getMessage()
            ], 500);
        }
    }

    public function payCreditCard(Request $request, $id)
    {
        $order = Order::findOrFail($id);

        if ($order->user_id !== auth()->id()) {
            abort(403);
        }

        if ($order->payment_status === 'paid' || $order->status === 'cancelled') {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan ini sudah dibayar atau dibatalkan.'
            ], 422);
        }

        try {
            $details = $this->chargePayment($order, 'credit_card');
            $order->update([
                'payment_details' => $details,
            ]);

            return response()->json([
                'success' => true,
                'order' => $order->load(['items.product', 'items.variant', 'storeBranch']),
                'redirect_url' => $details['invoice_url'] ?? null,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Pembayaran kartu gagal: ' . $e->getMessage()
            ], 500);
        }
    }

    public function cancelOrder($id)
    {
        $order = Order::with('items')->findOrFail($id);

        if ($order->user_id !== auth()->id()) {
            abort(403);
        }

        if ($order->payment_status === 'paid' || $order->status === 'cancelled') {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan ini sudah dibayar atau dibatalkan.'
            ], 422);
        }

        try {
            if ($order->payment_details) {
                if (isset($order->payment_details['xendit_invoice_id'])) {
                    try {
                        \Xendit\Configuration::setXenditKey(config('services.xendit.secret_key'));
                        $apiInstance = new \Xendit\Invoice\InvoiceApi();
                        $apiInstance->expireInvoice($order->payment_details['xendit_invoice_id']);
                    } catch (\Throwable $cancelEx) {}
                }
                if (isset($order->payment_details['midtrans_order_id'])) {
                    try {
                        \Midtrans\Config::$serverKey = config('services.midtrans.server_key');
                        \Midtrans\Config::$isProduction = config('services.midtrans.is_production');
                        \Midtrans\Transaction::cancel($order->payment_details['midtrans_order_id']);
                    } catch (\Throwable $cancelEx) {}
                }
            }

            $order->update([
                'cancellation_status' => 'pending',
                'cancellation_reason' => 'Dibatalkan oleh customer dari halaman pembayaran.'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Pengajuan pembatalan berhasil dikirim dan sedang menunggu persetujuan admin.'
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengajukan pembatalan pesanan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function expireOrder($id)
    {
        $order = Order::with('items')->findOrFail($id);

        if ($order->user_id !== auth()->id()) {
            abort(403);
        }

        if ($order->payment_status === 'paid' || $order->status === 'cancelled' || $order->payment_status === 'expired') {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan ini sudah dibayar, kedaluwarsa, atau dibatalkan.'
            ], 422);
        }

        try {
            DB::transaction(function () use ($order) {
                if ($order->payment_details) {
                    if (isset($order->payment_details['xendit_invoice_id'])) {
                        try {
                            \Xendit\Configuration::setXenditKey(config('services.xendit.secret_key'));
                            $apiInstance = new \Xendit\Invoice\InvoiceApi();
                            $apiInstance->expireInvoice($order->payment_details['xendit_invoice_id']);
                        } catch (\Throwable $cancelEx) {}
                    }
                    if (isset($order->payment_details['midtrans_order_id'])) {
                        try {
                            \Midtrans\Config::$serverKey = config('services.midtrans.server_key');
                            \Midtrans\Config::$isProduction = config('services.midtrans.is_production');
                            \Midtrans\Transaction::cancel($order->payment_details['midtrans_order_id']);
                        } catch (\Throwable $cancelEx) {}
                    }
                }

                $order->update([
                    'status' => 'cancelled',
                    'payment_status' => 'expired',
                    'cancellation_reason' => 'Batas waktu pembayaran telah habis.'
                ]);
            });

            return response()->json([
                'success' => true,
                'message' => 'Pesanan telah dibatalkan karena batas waktu pembayaran habis.'
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal membatalkan pesanan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Unified Charge Gateway Dispatcher
     */
    public function chargePayment($order, $paymentMethod, $customPhone = null)
    {
        $gateway = config('services.payment_gateway', 'xendit');
        if ($gateway === 'midtrans') {
            return $this->chargeMidtrans($order, $paymentMethod, $customPhone);
        }
        return $this->chargeXendit($order, $paymentMethod, $customPhone);
    }

    /**
     * Midtrans Charge Generator
     */
    public function chargeMidtrans($order, $paymentMethod, $customPhone = null)
    {
        \Midtrans\Config::$serverKey = config('services.midtrans.server_key');
        \Midtrans\Config::$isProduction = config('services.midtrans.is_production');
        \Midtrans\Config::$isSanitized = true;
        \Midtrans\Config::$is3ds = true;

        $user = $order->user;
        $nameParts = explode(' ', trim($user->name));
        $firstName = $nameParts[0];
        $lastName = count($nameParts) > 1 ? implode(' ', array_slice($nameParts, 1)) : '';
        $phone = $customPhone ?: ($user->phone ?: '08111222333');
        $orderId = $order->invoice_number . '-' . time();

        $params = [
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => (int) $order->total_amount,
            ],
            'customer_details' => [
                'first_name' => $firstName,
                'last_name' => $lastName,
                'email' => $user->email,
                'phone' => $phone,
            ],
            'notification_url' => url('/checkout/midtrans-callback'),
        ];

        $snapToken = \Midtrans\Snap::getSnapToken($params);
        return [
            'midtrans_order_id' => $orderId,
            'snap_token' => $snapToken,
            'transaction_status' => 'pending',
            'expiry_time' => date('Y-m-d H:i:s', time() + 86400),
        ];
    }

    /**
     * Midtrans Callback Handler
     */
    public function midtransCallback(Request $request)
    {
        \Midtrans\Config::$serverKey = config('services.midtrans.server_key');
        \Midtrans\Config::$isProduction = config('services.midtrans.is_production');
        \Midtrans\Config::$isSanitized = true;
        \Midtrans\Config::$is3ds = true;

        try {
            $notif = new \Midtrans\Notification();
        } catch (\Exception $e) {
            return response()->json(['message' => 'Invalid Midtrans Notification Payload'], 400);
        }

        $transaction = $notif->transaction_status;
        $type = $notif->payment_type;
        $orderId = $notif->order_id;
        $fraud = $notif->fraud_status;

        $parts = explode('-', $orderId);
        $invoiceNumber = implode('-', array_slice($parts, 0, 3));
        $order = Order::with('items')->where('invoice_number', $invoiceNumber)->first();

        if (!$order) {
            $order = Order::with('items')->where('invoice_number', $orderId)->first();
        }

        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        $paymentStatus = 'unpaid';
        $orderStatus = $order->status;

        if ($transaction == 'capture') {
            if ($type == 'credit_card') {
                if ($fraud == 'challenge') {
                    $paymentStatus = 'unpaid';
                } else {
                    $paymentStatus = 'paid';
                    $orderStatus = 'processing';
                }
            }
        } else if ($transaction == 'settlement') {
            $paymentStatus = 'paid';
            $orderStatus = 'processing';
        } else if ($transaction == 'pending') {
            $paymentStatus = 'unpaid';
            $orderStatus = 'pending';
        } else if ($transaction == 'deny' || $transaction == 'expire' || $transaction == 'cancel') {
            $paymentStatus = 'expired';
            $orderStatus = 'cancelled';
        }

        $details = $order->payment_details ?: [];
        if (is_array($details)) {
            $details['transaction_status'] = $transaction;
            $order->payment_details = $details;
        }

        $order->update([
            'payment_status' => $paymentStatus,
            'status' => $orderStatus,
        ]);

        return response()->json(['message' => 'Midtrans callback handled successfully']);
    }

    /**
     * Xendit Charge Generator
     */
    public function chargeXendit($order, $paymentMethod, $customPhone = null)
    {
        $secretKey = config('services.xendit.secret_key');
        if (!$secretKey) {
            throw new \Exception("Xendit secret key is missing in .env.");
        }

        $user = $order->user;
        $nameParts = explode(' ', trim($user->name));
        $firstName = $nameParts[0];
        $lastName = count($nameParts) > 1 ? implode(' ', array_slice($nameParts, 1)) : '';
        $phone = $customPhone ?: ($user->phone ?: '08111222333');
        $amount = (float) $order->total_amount;
        $externalId = $order->invoice_number . '-' . time();

        // 1. VIRTUAL ACCOUNTS (DIRECT VA API)
        if (str_contains($paymentMethod, '_va')) {
            $bankMap = [
                'bca_va' => 'BCA',
                'bri_va' => 'BRI',
                'bni_va' => 'BNI',
                'mandiri_va' => 'MANDIRI',
                'permata_va' => 'PERMATA',
                'cimb_va' => 'CIMB',
                'bsi_va' => 'BSI',
                'seabank_va' => 'PERMATA',
                'danamon_va' => 'PERMATA',
                'saqu_va' => 'PERMATA',
            ];

            $bankCode = $bankMap[$paymentMethod] ?? 'BCA';

            $response = Http::withBasicAuth($secretKey, '')
                ->asForm()
                ->post('https://api.xendit.co/callback_virtual_accounts', [
                    'external_id' => $externalId,
                    'bank_code' => $bankCode,
                    'name' => trim($user->name),
                    'expected_amount' => (int) $amount,
                    'is_closed' => 'true',
                    'is_single_use' => 'true',
                    'expiration_date' => date('Y-m-d\TH:i:s.000\Z', time() + 86400),
                ]);

            if ($response->failed()) {
                $errorMsg = $response->json('message') ?? $response->body();
                throw new \Exception("Gagal membuat Nomor Virtual Account (" . $bankCode . "): " . $errorMsg);
            }

            $resData = $response->json();
            return [
                'xendit_va_id' => $resData['id'] ?? null,
                'va_number' => $resData['account_number'] ?? null,
                'bank' => strtolower($resData['bank_code'] ?? str_replace('_va', '', $paymentMethod)),
                'transaction_status' => 'pending',
                'expiry_time' => isset($resData['expiration_date']) ? date('Y-m-d H:i:s', strtotime($resData['expiration_date'])) : date('Y-m-d H:i:s', time() + 86400),
            ];
        }

        // 2. QRIS (DIRECT QRIS API)
        if ($paymentMethod === 'qris') {
            $response = Http::withHeaders(['api-version' => '2022-07-31'])
                ->withBasicAuth($secretKey, '')
                ->post('https://api.xendit.co/qr_codes', [
                    'reference_id' => $externalId,
                    'type' => 'DYNAMIC',
                    'currency' => 'IDR',
                    'amount' => (int) $amount,
                    'expires_at' => date('Y-m-d\TH:i:s.000\Z', time() + 86400),
                ]);

            if ($response->failed()) {
                $errorMsg = $response->json('message') ?? $response->body();
                throw new \Exception("Gagal membuat QRIS: " . $errorMsg);
            }

            $resData = $response->json();
            return [
                'xendit_qr_id' => $resData['id'] ?? null,
                'qr_string' => $resData['qr_string'] ?? null,
                'transaction_status' => 'pending',
                'expiry_time' => isset($resData['expires_at']) ? date('Y-m-d H:i:s', strtotime($resData['expires_at'])) : date('Y-m-d H:i:s', time() + 86400),
            ];
        }

        // 3. RETAIL OUTLETS (DIRECT RETAIL API - Alfamart / Indomaret)
        if (in_array($paymentMethod, ['alfamart', 'indomaret'])) {
            $outletName = strtoupper($paymentMethod);

            $response = Http::withBasicAuth($secretKey, '')
                ->asForm()
                ->post('https://api.xendit.co/fixed_payment_code', [
                    'external_id' => $externalId,
                    'retail_outlet_name' => $outletName,
                    'name' => trim($user->name),
                    'expected_amount' => (int) $amount,
                    'is_single_use' => 'true',
                    'expiration_date' => date('Y-m-d\TH:i:s.000\Z', time() + 86400),
                ]);

            if ($response->failed()) {
                $errorMsg = $response->json('message') ?? $response->body();
                throw new \Exception("Gagal membuat Kode Pembayaran Kasir: " . $errorMsg);
            }

            $resData = $response->json();
            return [
                'xendit_retail_id' => $resData['id'] ?? null,
                'payment_code' => $resData['payment_code'] ?? null,
                'store' => strtolower($resData['retail_outlet_name'] ?? $paymentMethod),
                'transaction_status' => 'pending',
                'expiry_time' => isset($resData['expiration_date']) ? date('Y-m-d H:i:s', strtotime($resData['expiration_date'])) : date('Y-m-d H:i:s', time() + 86400),
            ];
        }

        // 4. E-WALLETS (DIRECT EWALLET API - GoPay, ShopeePay, DANA, OVO)
        if (in_array($paymentMethod, ['gopay', 'shopeepay', 'dana', 'ovo'])) {
            $channelMap = [
                'gopay' => 'ID_GOPAY',
                'shopeepay' => 'ID_SHOPEEPAY',
                'dana' => 'ID_DANA',
                'ovo' => 'ID_OVO',
            ];

            $channelCode = $channelMap[$paymentMethod];
            $payload = [
                'reference_id' => $externalId,
                'currency' => 'IDR',
                'amount' => (int) $amount,
                'checkout_method' => 'ONE_TIME_PAYMENT',
                'channel_code' => $channelCode,
                'channel_properties' => [
                    'success_redirect_url' => url('/checkout/success/' . $order->id),
                ]
            ];

            if ($paymentMethod === 'ovo') {
                $cleanPhone = preg_replace('/[^0-9+]/', '', $phone);
                if (str_starts_with($cleanPhone, '+62')) {
                    $cleanPhone = '0' . substr($cleanPhone, 3);
                } elseif (str_starts_with($cleanPhone, '62')) {
                    $cleanPhone = '0' . substr($cleanPhone, 2);
                }
                $payload['channel_properties']['mobile_number'] = $cleanPhone;
            }

            $response = Http::withBasicAuth($secretKey, '')
                ->post('https://api.xendit.co/ewallets/charges', $payload);

            if ($response->failed()) {
                $errorMsg = $response->json('message') ?? $response->body();
                throw new \Exception("Gagal memproses E-Wallet (" . $paymentMethod . "): " . $errorMsg);
            }

            $resData = $response->json();
            $details = [
                'xendit_ewallet_id' => $resData['id'] ?? null,
                'transaction_status' => strtolower($resData['status'] ?? 'pending'),
                'expiry_time' => date('Y-m-d H:i:s', time() + 86400),
            ];

            if ($paymentMethod === 'ovo') {
                $details['ovo_phone'] = $cleanPhone ?? $phone;
            }

            if (isset($resData['actions']) && is_array($resData['actions'])) {
                foreach ($resData['actions'] as $action) {
                    $urlType = $action['url_type'] ?? '';
                    if (in_array($urlType, ['DEEPLINK', 'MOBILE_DEEPLINK'])) {
                        $details['deeplink'] = $action['url'] ?? null;
                    } elseif (in_array($urlType, ['WEB', 'DESKTOP_WEB', 'MOBILE_WEB'])) {
                        $details['qr_url'] = $action['url'] ?? null;
                    } elseif ($urlType === 'QR_CODE') {
                        $details['qr_string'] = $action['qr_code'] ?? $action['url'] ?? null;
                    }
                }
            }

            return $details;
        }

        // 5. FALLBACK TO INVOICE FOR CREDIT CARD
        \Xendit\Configuration::setXenditKey($secretKey);
        $apiInstance = new \Xendit\Invoice\InvoiceApi();
        $createInvoiceRequest = new \Xendit\Invoice\CreateInvoiceRequest([
            'external_id' => $externalId,
            'amount' => (float) $amount,
            'description' => 'Pembayaran Fayyfir Shop #' . $order->invoice_number,
            'invoice_duration' => 86400,
            'currency' => 'IDR',
            'customer' => [
                'given_names' => $firstName,
                'surname' => $lastName,
                'email' => $user->email,
                'mobile_number' => $phone,
            ],
            'success_redirect_url' => url('/checkout/success/' . $order->id),
            'failure_redirect_url' => url('/checkout/payment/' . $order->id),
        ]);

        $invoice = $apiInstance->createInvoice($createInvoiceRequest);

        return [
            'xendit_invoice_id' => $invoice->getId(),
            'invoice_url' => $invoice->getInvoiceUrl(),
            'external_id' => $invoice->getExternalId(),
            'transaction_status' => strtolower((string)$invoice->getStatus()),
            'expiry_time' => date('Y-m-d H:i:s', time() + 86400),
        ];
    }
}
