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
use Illuminate\Support\Facades\Log;
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

                    // Cek apakah user sudah pernah menggunakan referral ini (sekali pakai)
                    if ($userId && Schema::hasTable('referral_usages')) {
                        $userReferralUsage = DB::table('referral_usages')
                            ->where('referral_id', $referral->id)
                            ->where('user_id', $userId)
                            ->count();
                        if ($userReferralUsage >= 1) {
                            return response()->json(['success' => false, 'message' => 'Anda sudah pernah menggunakan kode referral ini. Kode referral hanya bisa digunakan satu kali.'], 422);
                        }
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
            'receiver_name' => 'nullable|string',
            'receiver_phone' => 'nullable|string',
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
                        // Cek apakah user sudah pernah menggunakan referral ini (sekali pakai per user)
                        $userReferralUsage = Schema::hasTable('referral_usages')
                            ? DB::table('referral_usages')->where('referral_id', $referral->id)->where('user_id', $user->id)->count()
                            : 0;

                        if ($userReferralUsage < 1) {
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
                }

                $discountAmount = $manualDiscount + $eventDiscount + $referralDiscount;

                // Create Order
                $order = Order::create([
                    'invoice_number' => $invoiceNumber,
                    'user_id' => $user->id,
                    'receiver_name' => $request->receiver_name ?: ($user->receiver_name ?: $user->name),
                    'receiver_phone' => $request->receiver_phone ?: ($user->phone ?: null),
                    'store_branch_id' => $branchId,
                    'subtotal' => $subtotal,
                    'discount_amount' => $discountAmount,
                    'shipping_cost' => $request->shipping_cost,
                    'total_amount' => $subtotal + $request->shipping_cost - $discountAmount,
                    'shipping_courier' => $request->shipping_courier,
                    'shipping_service' => $request->shipping_service,
                    'shipping_address' => $request->shipping_address,
                    'destination_area_id' => $request->area_id ?: ($user->area_id ?: null),
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
        Log::info('Xendit Webhook Received:', [
            'headers' => $request->headers->all(),
            'payload' => $request->all(),
        ]);

        $token = $request->header('x-callback-token') ?? $request->header('X-CALLBACK-TOKEN') ?? $request->input('callback_token');
        $configuredToken = config('services.xendit.webhook_token');
        
        if ($configuredToken && $token && $token !== $configuredToken) {
            Log::warning('Xendit Webhook Token Mismatch:', [
                'received_token' => $token,
                'configured_token' => $configuredToken,
            ]);
            return response()->json(['message' => 'Invalid webhook token'], 403);
        }

        $externalId = $request->input('reference_id') 
            ?? $request->input('data.reference_id') 
            ?? $request->input('external_id') 
            ?? $request->input('externalId') 
            ?? $request->input('data.external_id')
            ?? $request->input('qr_code.external_id')
            ?? $request->input('data.qr_code.external_id');

        $invoiceId = $request->input('data.id') 
            ?? $request->input('id') 
            ?? $request->input('invoice_id')
            ?? $request->input('data.payment_request_id')
            ?? $request->input('payment_request_id')
            ?? $request->input('data.qr_id')
            ?? $request->input('qr_id')
            ?? $request->input('data.payment_id')
            ?? $request->input('payment_id');
        
        $rawStatus = strtoupper($request->input('data.status') ?? $request->input('status') ?? $request->input('payment_status') ?? '');
        $rawEvent = strtoupper($request->input('event') ?? '');

        if (!$externalId && !$invoiceId) {
            return response()->json(['message' => 'Missing transaction identifier'], 400);
        }

        $order = null;
        if ($externalId) {
            $lastHyphenPos = strrpos($externalId, '-');
            if ($lastHyphenPos !== false) {
                $possibleInvoiceNumber = substr($externalId, 0, $lastHyphenPos);
                $order = Order::with('items')->where('invoice_number', $possibleInvoiceNumber)->first();
            }
            if (!$order) {
                $order = Order::with('items')->where('invoice_number', $externalId)->first();
            }
            if (!$order) {
                $order = Order::with('items')
                    ->where('payment_details->external_id', $externalId)
                    ->orWhere('payment_details->reference_id', $externalId)
                    ->orWhere('payment_details->xendit_pr_id', $externalId)
                    ->orWhere('payment_details->xendit_qr_id', $externalId)
                    ->first();
            }
        }

        if (!$order && $invoiceId) {
            $order = Order::with('items')
                ->where('payment_details->xendit_pr_id', $invoiceId)
                ->orWhere('payment_details->xendit_qr_id', $invoiceId)
                ->orWhere('payment_details->xendit_invoice_id', $invoiceId)
                ->orWhere('payment_details->xendit_va_id', $invoiceId)
                ->orWhere('payment_details->xendit_retail_id', $invoiceId)
                ->orWhere('payment_details->xendit_ewallet_id', $invoiceId)
                ->first();
        }

        // Fallback: periksa semua candidate ID dari payload
        if (!$order) {
            $allCandidateIds = array_filter([
                $request->input('id'),
                $request->input('data.id'),
                $request->input('qr_id'),
                $request->input('data.qr_id'),
                $request->input('payment_request_id'),
                $request->input('data.payment_request_id'),
                $request->input('payment_id'),
                $request->input('data.payment_id'),
                $request->input('external_id'),
                $request->input('data.external_id'),
                $request->input('reference_id'),
                $request->input('data.reference_id'),
            ]);

            foreach ($allCandidateIds as $val) {
                if (!$val || !is_string($val)) continue;
                $order = Order::with('items')
                    ->where('invoice_number', $val)
                    ->orWhere('payment_details->xendit_pr_id', $val)
                    ->orWhere('payment_details->xendit_qr_id', $val)
                    ->orWhere('payment_details->xendit_invoice_id', $val)
                    ->orWhere('payment_details->xendit_va_id', $val)
                    ->first();
                if ($order) break;
            }
        }

        if (!$order) {
            Log::info('Xendit Webhook: Order not found in DB:', [
                'external_id' => $externalId,
                'invoice_id' => $invoiceId,
                'payload' => $request->all(),
            ]);
            return response()->json(['message' => 'Webhook received successfully (Order not found in DB)'], 200);
        }

        $paymentStatus = 'unpaid';
        $orderStatus = $order->status;

        $isPaid = in_array($rawStatus, ['PAID', 'SETTLED', 'SUCCEEDED', 'COMPLETED', 'SUCCESS', 'CAPTURED', 'SETTLEMENT']) ||
                  in_array($rawEvent, ['PAYMENT_REQUEST.SUCCEEDED', 'PAYMENT.SUCCEEDED', 'QR_CODE.PAYMENT', 'QR.PAYMENT', 'INVOICE.PAID', 'FVA.PAID', 'VA_PAID', 'PAYMENT_REQUEST.CAPTURES.SUCCEEDED', 'QR_CODE.PAID']) ||
                  str_contains($rawEvent, 'SUCCEEDED') ||
                  str_contains($rawEvent, 'PAID') ||
                  str_contains($rawEvent, 'SUCCESS') ||
                  $request->has('payment_id') ||
                  $request->has('callback_virtual_account_id') ||
                  $request->has('qr_id') ||
                  $request->has('data.qr_id');

        $isExpiredOrFailed = in_array($rawStatus, ['EXPIRED', 'EXPIRE', 'CANCELLED', 'FAILED']) ||
                             str_contains($rawEvent, 'EXPIRED') ||
                             str_contains($rawEvent, 'FAILED');

        if ($isPaid) {
            $paymentStatus = 'paid';
            $orderStatus = 'processing';
        } elseif ($isExpiredOrFailed) {
            $paymentStatus = 'expired';
            $orderStatus = 'cancelled';
        } elseif ($rawStatus === 'PENDING' || $rawStatus === 'ACTIVE') {
            $paymentStatus = 'unpaid';
            $orderStatus = 'pending';
        }

        $details = $order->payment_details ?: [];
        if (is_array($details)) {
            $details['transaction_status'] = strtolower($rawStatus ?: $rawEvent);
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

        // Cek sinkronisasi status gateway jika belum paid
        if ($order->payment_status === 'unpaid' && !empty($order->payment_details)) {
            $this->syncPaymentStatusWithGateway($order);
            $order->refresh();
        }

        // Jika pesanan sudah lunas, langsung redirect ke halaman sukses
        if ($order->payment_status === 'paid') {
            return redirect()->route('checkout.success', $order->id);
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
        $order = Order::findOrFail($id);

        if ($order->user_id !== auth()->id()) {
            abort(403);
        }

        // Jika status masih unpaid, sinkronkan langsung dengan Payment Gateway
        if ($order->payment_status === 'unpaid' && !empty($order->payment_details)) {
            $this->syncPaymentStatusWithGateway($order);
            $order->refresh();
        }

        return response()->json([
            'status' => $order->status,
            'payment_status' => $order->payment_status,
        ]);
    }

    public function simulatePayment(Request $request, $id)
    {
        $order = Order::findOrFail($id);

        if ($order->user_id !== auth()->id()) {
            abort(403);
        }

        $details = $order->payment_details;
        $secretKey = config('services.xendit.secret_key');

        // Jika ada Payment Request ID di Xendit Sandbox, coba panggil simulate API Xendit
        if (!empty($details['xendit_pr_id']) && $secretKey && str_contains($secretKey, 'development')) {
            try {
                $prId = $details['xendit_pr_id'];
                $response = Http::withHeaders(['api-version' => '2023-03-01'])
                    ->withBasicAuth($secretKey, '')
                    ->timeout(5)
                    ->post("https://api.xendit.co/payment_requests/{$prId}/payments/simulate", new \stdClass());

                if ($response->successful()) {
                    $order->update([
                        'payment_status' => 'paid',
                        'status' => 'processing',
                    ]);
                    return response()->json([
                        'success' => true,
                        'message' => 'Simulasi pembayaran via Xendit Sandbox berhasil!'
                    ]);
                }
            } catch (\Throwable $e) {
                Log::warning("Xendit API simulate error: " . $e->getMessage());
            }
        }

        // Update status ke paid
        $order->update([
            'payment_status' => 'paid',
            'status' => 'processing',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pembayaran berhasil disimulasikan!'
        ]);
    }

    protected function syncPaymentStatusWithGateway(Order $order)
    {
        try {
            $details = $order->payment_details;
            if (!$details || !is_array($details)) {
                return;
            }

            $secretKey = config('services.xendit.secret_key');

            // 1. Xendit Payment Requests (QRIS, VA, E-Wallet, Retail Outlet)
            if (!empty($details['xendit_pr_id']) && $secretKey) {
                $prId = $details['xendit_pr_id'];
                $response = Http::withHeaders(['api-version' => '2023-03-01'])
                    ->withBasicAuth($secretKey, '')
                    ->timeout(4)
                    ->get("https://api.xendit.co/payment_requests/{$prId}");

                if ($response->successful()) {
                    $prData = $response->json();
                    $status = strtoupper($prData['status'] ?? '');

                    if (in_array($status, ['SUCCEEDED', 'PAID', 'COMPLETED', 'SETTLED', 'SUCCESS', 'CAPTURED'])) {
                        $order->update([
                            'payment_status' => 'paid',
                            'status' => 'processing',
                        ]);
                        return;
                    } elseif (in_array($status, ['EXPIRED', 'FAILED', 'CANCELLED'])) {
                        $order->update([
                            'payment_status' => 'expired',
                            'status' => 'cancelled',
                        ]);
                        return;
                    }
                }
            }

            // 2. Xendit Invoice (Credit Card / Invoice fallback)
            if (!empty($details['xendit_invoice_id']) && $secretKey) {
                $invId = $details['xendit_invoice_id'];
                $response = Http::withBasicAuth($secretKey, '')
                    ->timeout(4)
                    ->get("https://api.xendit.co/v2/invoices/{$invId}");

                if ($response->successful()) {
                    $invData = $response->json();
                    $status = strtoupper($invData['status'] ?? '');

                    if (in_array($status, ['PAID', 'SETTLED', 'SUCCESS', 'COMPLETED'])) {
                        $order->update([
                            'payment_status' => 'paid',
                            'status' => 'processing',
                        ]);
                        return;
                    } elseif (in_array($status, ['EXPIRED'])) {
                        $order->update([
                            'payment_status' => 'expired',
                            'status' => 'cancelled',
                        ]);
                        return;
                    }
                }
            }

            // 3. Midtrans Fallback
            if (!empty($details['midtrans_order_id'])) {
                \Midtrans\Config::$serverKey = config('services.midtrans.server_key');
                \Midtrans\Config::$isProduction = config('services.midtrans.is_production');
                $midtransStatus = \Midtrans\Transaction::status($details['midtrans_order_id']);

                if ($midtransStatus) {
                    $trxStatus = $midtransStatus->transaction_status ?? '';
                    $fraudStatus = $midtransStatus->fraud_status ?? '';

                    if (($trxStatus == 'capture' && $fraudStatus == 'accept') || $trxStatus == 'settlement' || $trxStatus == 'success') {
                        $order->update([
                            'payment_status' => 'paid',
                            'status' => 'processing',
                        ]);
                        return;
                    } elseif (in_array($trxStatus, ['cancel', 'deny', 'expire'])) {
                        $order->update([
                            'payment_status' => 'expired',
                            'status' => 'cancelled',
                        ]);
                        return;
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::warning("Failed to sync payment status with gateway for order #{$order->id}: " . $e->getMessage());
        }
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

        $success = $order->markAsExpired();

        if ($success) {
            return response()->json([
                'success' => true,
                'message' => 'Pesanan telah dibatalkan karena batas waktu pembayaran habis.'
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Gagal membatalkan pesanan kedaluwarsa.'
        ], 500);
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

        // 1. VIRTUAL ACCOUNTS (API V3 - PAYMENT REQUESTS)
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

            $payload = [
                'reference_id' => $externalId,
                'currency' => 'IDR',
                'amount' => (int) $amount,
                'country' => 'ID',
                'payment_method' => [
                    'type' => 'VIRTUAL_ACCOUNT',
                    'reusability' => 'ONE_TIME_USE',
                    'virtual_account' => [
                        'channel_code' => $bankCode,
                        'channel_properties' => [
                            'customer_name' => trim($user->name) ?: 'Pelanggan Fayyfir',
                            'expires_at' => date('Y-m-d\TH:i:s.000\Z', time() + 86400),
                        ]
                    ]
                ]
            ];

            $response = Http::withHeaders(['api-version' => '2023-03-01'])
                ->withBasicAuth($secretKey, '')
                ->post('https://api.xendit.co/payment_requests', $payload);

            if ($response->failed()) {
                $errorMsg = $response->json('message') ?? $response->body();
                throw new \Exception("Gagal membuat Nomor Virtual Account (" . $bankCode . "): " . $errorMsg);
            }

            $resData = $response->json();
            $vaData = $resData['payment_method']['virtual_account']['channel_properties'] ?? [];
            $vaNumber = $vaData['virtual_account_number'] ?? null;
            $expiresAt = $vaData['expires_at'] ?? null;

            return [
                'xendit_pr_id' => $resData['id'] ?? null,
                'xendit_va_id' => $resData['id'] ?? null,
                'va_number' => $vaNumber,
                'bank' => strtolower($resData['payment_method']['virtual_account']['channel_code'] ?? str_replace('_va', '', $paymentMethod)),
                'transaction_status' => strtolower($resData['status'] ?? 'pending'),
                'expiry_time' => $expiresAt ? date('Y-m-d H:i:s', strtotime($expiresAt)) : date('Y-m-d H:i:s', time() + 86400),
            ];
        }

        // 2. QRIS (API V3 - PAYMENT REQUESTS)
        if ($paymentMethod === 'qris') {
            $payload = [
                'reference_id' => $externalId,
                'currency' => 'IDR',
                'amount' => (int) $amount,
                'country' => 'ID',
                'payment_method' => [
                    'type' => 'QR_CODE',
                    'reusability' => 'ONE_TIME_USE',
                    'qr_code' => [
                        'channel_code' => 'QRIS',
                    ]
                ]
            ];

            $response = Http::withHeaders(['api-version' => '2023-03-01'])
                ->withBasicAuth($secretKey, '')
                ->post('https://api.xendit.co/payment_requests', $payload);

            if ($response->failed()) {
                $errorMsg = $response->json('message') ?? $response->body();
                throw new \Exception("Gagal membuat QRIS: " . $errorMsg);
            }

            $resData = $response->json();
            $qrData = $resData['payment_method']['qr_code']['channel_properties'] ?? [];
            $qrString = $qrData['qr_string'] ?? null;
            $expiresAt = $qrData['expires_at'] ?? null;

            $qrUrl = null;
            if (isset($resData['actions']) && is_array($resData['actions'])) {
                foreach ($resData['actions'] as $action) {
                    if (($action['action'] ?? '') === 'PRESENT_TO_CUSTOMER') {
                        $qrUrl = $action['url'] ?? null;
                    }
                    if (!$qrString && isset($action['qr_code'])) {
                        $qrString = $action['qr_code'];
                    }
                }
            }

            return [
                'xendit_pr_id' => $resData['id'] ?? null,
                'xendit_qr_id' => $resData['id'] ?? null,
                'qr_string' => $qrString,
                'qr_url' => $qrUrl,
                'transaction_status' => strtolower($resData['status'] ?? 'pending'),
                'expiry_time' => $expiresAt ? date('Y-m-d H:i:s', strtotime($expiresAt)) : date('Y-m-d H:i:s', time() + 86400),
            ];
        }

        // 3. RETAIL OUTLETS (API V3 - PAYMENT REQUESTS - Alfamart / Indomaret)
        if (in_array($paymentMethod, ['alfamart', 'indomaret'])) {
            $outletName = strtoupper($paymentMethod);

            $payload = [
                'reference_id' => $externalId,
                'currency' => 'IDR',
                'amount' => (int) $amount,
                'country' => 'ID',
                'payment_method' => [
                    'type' => 'OVER_THE_COUNTER',
                    'reusability' => 'ONE_TIME_USE',
                    'over_the_counter' => [
                        'channel_code' => $outletName,
                        'channel_properties' => [
                            'customer_name' => trim($user->name) ?: 'Pelanggan Fayyfir',
                            'expires_at' => date('Y-m-d\TH:i:s.000\Z', time() + 86400),
                        ]
                    ]
                ]
            ];

            $response = Http::withHeaders(['api-version' => '2023-03-01'])
                ->withBasicAuth($secretKey, '')
                ->post('https://api.xendit.co/payment_requests', $payload);

            if ($response->failed()) {
                $errorMsg = $response->json('message') ?? $response->body();
                throw new \Exception("Gagal membuat Kode Pembayaran Kasir: " . $errorMsg);
            }

            $resData = $response->json();
            $retailData = $resData['payment_method']['over_the_counter']['channel_properties'] ?? [];
            $paymentCode = $retailData['payment_code'] ?? null;
            $expiresAt = $retailData['expires_at'] ?? null;

            return [
                'xendit_pr_id'      => $resData['id'] ?? null,
                'xendit_retail_id'  => $resData['id'] ?? null,
                'payment_code'      => $paymentCode,
                'store'             => strtolower($resData['payment_method']['over_the_counter']['channel_code'] ?? $paymentMethod),
                'transaction_status' => strtolower($resData['status'] ?? 'pending'),
                'expiry_time'       => $expiresAt ? date('Y-m-d H:i:s', strtotime($expiresAt)) : date('Y-m-d H:i:s', time() + 86400),
            ];
        }

        // 4. E-WALLETS (API V3 - PAYMENT REQUESTS - GoPay, ShopeePay, DANA, OVO, LinkAja)
        if (in_array($paymentMethod, ['gopay', 'shopeepay', 'dana', 'ovo', 'linkaja'])) {
            $channelMap = [
                'gopay' => 'GOPAY',
                'shopeepay' => 'SHOPEEPAY',
                'dana' => 'DANA',
                'ovo' => 'OVO',
                'linkaja' => 'LINKAJA',
            ];

            $channelCode = $channelMap[$paymentMethod];

            // OVO uses push notification — only mobile_number is allowed in channel_properties.
            // GoPay, ShopeePay, DANA, LinkAja use redirect URLs.
            if ($paymentMethod === 'ovo') {
                // Xendit Payment Requests API v3 requires +62 international format for OVO
                $cleanPhone = preg_replace('/[^0-9+]/', '', $phone);
                // Normalize to +62 format
                if (str_starts_with($cleanPhone, '+62')) {
                    // Already correct
                } elseif (str_starts_with($cleanPhone, '62')) {
                    $cleanPhone = '+' . $cleanPhone;
                } elseif (str_starts_with($cleanPhone, '08') || str_starts_with($cleanPhone, '8')) {
                    $cleanPhone = '+62' . ltrim($cleanPhone, '0');
                } else {
                    $cleanPhone = '+62' . $cleanPhone;
                }
                $channelProps = [
                    'mobile_number' => $cleanPhone,
                ];
            } else {
                $channelProps = [
                    'success_return_url' => url('/checkout/success/' . $order->id),
                    'failure_return_url' => url('/checkout/payment/' . $order->id),
                    'cancel_return_url'  => url('/checkout/payment/' . $order->id),
                ];
            }

            $payload = [
                'reference_id' => $externalId,
                'currency' => 'IDR',
                'amount' => (int) $amount,
                'country' => 'ID',
                'payment_method' => [
                    'type' => 'EWALLET',
                    'reusability' => 'ONE_TIME_USE',
                    'ewallet' => [
                        'channel_code' => $channelCode,
                        'channel_properties' => $channelProps,
                    ]
                ]
            ];

            $response = Http::withHeaders(['api-version' => '2023-03-01'])
                ->withBasicAuth($secretKey, '')
                ->post('https://api.xendit.co/payment_requests', $payload);

            if ($response->failed()) {
                $errBody = $response->body();
                $errJson = $response->json();
                $errorMsg = $errJson['message'] ?? $errJson['error_code'] ?? $errBody;
                $errDetails = isset($errJson['errors']) ? json_encode($errJson['errors']) : '';
                Log::error('Xendit E-Wallet Error', [
                    'method' => $paymentMethod,
                    'status' => $response->status(),
                    'body' => $errBody,
                ]);
                throw new \Exception("Gagal memproses E-Wallet (" . $paymentMethod . "): " . $errorMsg . ($errDetails ? ' | ' . $errDetails : ''));
            }

            $resData = $response->json();
            $details = [
                'xendit_pr_id' => $resData['id'] ?? null,
                'xendit_ewallet_id' => $resData['id'] ?? null,
                'transaction_status' => strtolower($resData['status'] ?? 'pending'),
                'expiry_time' => date('Y-m-d H:i:s', time() + 86400),
            ];

            if ($paymentMethod === 'ovo') {
                $details['ovo_phone'] = $cleanPhone ?? $phone;
            }

            if (isset($resData['actions']) && is_array($resData['actions'])) {
                foreach ($resData['actions'] as $action) {
                    $actionType = $action['action'] ?? '';
                    $urlType = $action['url_type'] ?? '';
                    $url = $action['url'] ?? null;

                    if (in_array($actionType, ['DEEPLINK', 'MOBILE_DEEPLINK']) || in_array($urlType, ['DEEPLINK', 'MOBILE_DEEPLINK'])) {
                        $details['deeplink'] = $url;
                    } elseif (in_array($actionType, ['AUTH_REDIRECT', 'DESKTOP_WEB_CHECKOUT', 'MOBILE_WEB_CHECKOUT', 'PRESENT_TO_CUSTOMER']) || in_array($urlType, ['WEB', 'DESKTOP_WEB', 'MOBILE_WEB'])) {
                        $details['qr_url'] = $url;
                    } elseif ($actionType === 'QR_CODE' || $urlType === 'QR_CODE') {
                        $details['qr_string'] = $action['qr_code'] ?? $url;
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
