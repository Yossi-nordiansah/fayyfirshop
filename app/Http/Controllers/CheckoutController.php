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
        $storeBranches = StoreBranch::where('is_active', true)->get();

        return Inertia::render('checkout/CheckoutPage', [
            'user' => $user,
            'storeBranches' => $storeBranches,
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

        return response()->json([
            'success' => true,
            'stocks' => $stockData
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
            $variant = $variantId ? ProductVariant::with('unit')->find($variantId) : null;

            if (!$product) continue;

            $price = $variant ? $variant->price : $product->price;
            $quantity = $item['quantity'];
            $weight = $this->parseWeight($variant, $product);

            $totalWeight += ($weight * $quantity);
            $totalValue += ($price * $quantity);

            $biteshipItems[] = [
                'name' => $product->title ?: ($product->name_translations['indonesia'] ?? 'Product'),
                'description' => $variant ? ($variant->name_translations['indonesia'] ?? $variant->name) : 'Standard Product',
                'value' => (int) $price,
                'weight' => (int) $weight,
                'quantity' => (int) $quantity
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
                    'couriers' => 'jne,jnt,sicepat,tiki,pos,anteraja',
                    'items' => $biteshipItems
                ]);

                if ($response->successful()) {
                    $data = $response->json();
                    if (isset($data['pricing']) && is_array($data['pricing'])) {
                        $rates = [];
                        foreach ($data['pricing'] as $pricing) {
                            $rates[] = [
                                'courier_name' => strtoupper($pricing['courier_company']),
                                'courier_service_name' => strtoupper($pricing['courier_service']),
                                'price' => $pricing['price'],
                                'duration' => $pricing['duration'],
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

                // Create Order
                $order = Order::create([
                    'invoice_number' => $invoiceNumber,
                    'user_id' => $user->id,
                    'store_branch_id' => $branchId,
                    'subtotal' => $subtotal,
                    'discount_amount' => 0,
                    'shipping_cost' => $request->shipping_cost,
                    'total_amount' => $subtotal + $request->shipping_cost,
                    'shipping_courier' => $request->shipping_courier,
                    'shipping_service' => $request->shipping_service,
                    'shipping_address' => $request->shipping_address,
                    'notes' => $request->notes,
                    'status' => 'pending',
                    'payment_status' => ($request->payment_method === 'cod') ? 'unpaid' : 'paid', // Bank Transfer is mock paid
                ]);

                // Create Order Items and Decrement Stocks
                foreach ($orderItemsData as $itemData) {
                    $order->items()->create($itemData);

                    $product = Product::find($itemData['product_id']);
                    $variant = $itemData['product_variant_id'] ? ProductVariant::find($itemData['product_variant_id']) : null;

                    if ($variant && $variant->parent_id) {
                        $parentVariant = ProductVariant::find($variant->parent_id);
                        if ($parentVariant && $parentVariant->stock_type === 'parent') {
                            $capacity = $this->parseCapacity($variant);
                            $deduction = $capacity * $itemData['quantity'];

                            ProductVariantBranchStock::where([
                                'product_variant_id' => $parentVariant->id,
                                'store_branch_id' => $branchId
                            ])->decrement('stock', $deduction);
                        } else {
                            ProductVariantBranchStock::where([
                                'product_variant_id' => $itemData['product_variant_id'],
                                'store_branch_id' => $branchId
                            ])->decrement('stock', $itemData['quantity']);
                        }
                    } else if ($product && $product->stock_type === 'parent') {
                        $variant = $itemData['product_variant_id'] ? ProductVariant::find($itemData['product_variant_id']) : null;
                        $capacity = $this->parseCapacity($variant);
                        $deduction = $capacity * $itemData['quantity'];

                        ProductBranchStock::where([
                            'product_id' => $itemData['product_id'],
                            'store_branch_id' => $branchId
                        ])->decrement('stock', $deduction);
                    } else {
                        // Decrement branch stock standard
                        if ($itemData['product_variant_id']) {
                            ProductVariantBranchStock::where([
                                'product_variant_id' => $itemData['product_variant_id'],
                                'store_branch_id' => $branchId
                            ])->decrement('stock', $itemData['quantity']);
                        } else {
                            ProductBranchStock::where([
                                'product_id' => $itemData['product_id'],
                                'store_branch_id' => $branchId
                            ])->decrement('stock', $itemData['quantity']);
                        }
                    }
                }

                return $order;
            });

            return response()->json([
                'success' => true,
                'order' => $order
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to place order: ' . $e->getMessage()
            ], 500);
        }
    }

    public function success($id)
    {
        $order = Order::with(['items.product', 'items.variant', 'storeBranch'])->findOrFail($id);

        if ($order->user_id !== auth()->id()) {
            abort(403);
        }

        return Inertia::render('checkout/SuccessPage', [
            'order' => $order
        ]);
    }

    private function parseWeight($variant, $product)
    {
        $textToParse = '';
        $unitName = '';

        if ($variant) {
            $textToParse = $variant->name;
            if ($variant->unit) {
                $unitName = strtolower($variant->unit->name);
            }
        } else if ($product) {
            $textToParse = $product->title;
        }

        // Look for numbers in the string
        preg_match('/(\d+(?:\.\d+)?)\s*(kg|g|gr|gram|kilogram|ml|l|pcs)?/i', $textToParse, $matches);

        if (!empty($matches)) {
            $value = (float) $matches[1];
            $unit = isset($matches[2]) ? strtolower($matches[2]) : '';

            // If unit is kg or kilogram
            if ($unit === 'kg' || $unit === 'kilogram' || $unitName === 'kilogram') {
                return (int) ($value * 1000);
            }

            // If unit is gram, g, gr, ml (assume 1ml = 1g for shipping)
            if (in_array($unit, ['g', 'gr', 'gram', 'ml']) || $unitName === 'gram') {
                return (int) $value;
            }

            return (int) $value;
        }

        return 1000; // Default to 1000g (1kg)
    }

    private function getDomesticIDFallbackRates($totalWeight)
    {
        // Simple fallback calculation: Rp 10.000 + Rp 5.000 per additional kg
        $weightInKg = ceil($totalWeight / 1000);
        $cost = 10000 + (($weightInKg - 1) * 5000);

        return response()->json([
            'success' => true,
            'rates' => [
                [
                    'courier_name' => 'JNE',
                    'courier_service_name' => 'REG',
                    'price' => $cost,
                    'duration' => '2-3 Days',
                ],
                [
                    'courier_name' => 'SICEPAT',
                    'courier_service_name' => 'REG',
                    'price' => max(0, $cost - 2000),
                    'duration' => '2-4 Days',
                ]
            ]
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
        preg_match('/(\d+(?:\.\d+)?)/', $textToParse, $matches);

        if (!empty($matches)) {
            return (float) $matches[1];
        }

        return 1; // Default fallback to 1 to avoid division by zero
    }
}
