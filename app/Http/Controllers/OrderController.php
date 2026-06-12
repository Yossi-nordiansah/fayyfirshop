<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class OrderController extends Controller
{
    public function index()
    {
        // Admin view of all orders
        $orders = Order::with(['user', 'storeBranch', 'items.product', 'items.variant'])
            ->latest('id')
            ->get();

        return Inertia::render('backoffice/menu/Orders', [
            'orders' => $orders,
            'status' => session('status'),
        ]);
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending,processing,shipped,completed,cancelled',
            'payment_status' => 'required|in:unpaid,paid,expired,refunded',
        ]);

        $order = Order::findOrFail($id);
        $order->update([
            'status' => $request->status,
            'payment_status' => $request->payment_status,
        ]);

        return redirect()
            ->route('backoffice.orders')
            ->with('status', 'Order status updated successfully.');
    }

    public function createBiteshipShipment(Request $request, $id)
    {
        $order = Order::with(['user', 'storeBranch', 'items.product', 'items.variant.parent'])->findOrFail($id);

        if (!empty($order->tracking_number)) {
            return redirect()
                ->route('backoffice.orders')
                ->with('status', 'Order already has a shipment registered (Tracking: ' . $order->tracking_number . ').');
        }

        $branch = $order->storeBranch;
        $user = $order->user;

        if (!$branch || !$branch->area_id) {
            return redirect()
                ->route('backoffice.orders')
                ->with('status', 'Error: Processing branch must have a valid Biteship Area ID.');
        }

        if (!$user || !$user->area_id) {
            return redirect()
                ->route('backoffice.orders')
                ->with('status', 'Error: Customer must have a valid Biteship Area ID in their shipping address.');
        }

        // Build items payload
        $biteshipItems = [];
        foreach ($order->items as $item) {
            $product = $item->product;
            $variant = $item->variant;

            $weight = $this->parseWeight($variant, $product);

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
                'value' => (int) $item->price,
                'weight' => (int) ($weight * $item->quantity),
                'quantity' => (int) $item->quantity
            ];
        }

        $apiKey = env('BITESHIP_API_KEY');

        try {
            $response = Http::withHeaders([
                'authorization' => $apiKey,
            ])->post('https://api.biteship.com/v1/orders', [
                'shipper_contact_name' => $branch->name,
                'shipper_contact_phone' => '081234567890', // fallback store phone
                'origin_contact_name' => $branch->name,
                'origin_contact_phone' => '081234567890',
                'origin_address' => $branch->detail_address ?: ($branch->street . ', ' . $branch->city),
                'origin_area_id' => $branch->area_id,
                'destination_contact_name' => $user->receiver_name ?: $user->name,
                'destination_contact_phone' => $user->phone ?: '08123456789',
                'destination_address' => $order->shipping_address,
                'destination_area_id' => $user->area_id,
                'courier_company' => strtolower($order->shipping_courier),
                'courier_type' => strtolower($order->shipping_service),
                'delivery_type' => 'now',
                'items' => $biteshipItems
            ]);

            if ($response->successful()) {
                $data = $response->json();
                
                // Fetch the airwaybill / tracking number
                $waybillId = $data['courier']['waybill_id'] ?? null;
                $biteshipOrderId = $data['id'] ?? null;

                if ($waybillId) {
                    $order->update([
                        'tracking_number' => $waybillId,
                        'status' => 'shipped',
                        'notes' => trim($order->notes . "\n[Biteship Order ID: " . $biteshipOrderId . "]"),
                    ]);

                    return redirect()
                        ->route('backoffice.orders')
                        ->with('status', 'Biteship shipment created successfully! Waybill: ' . $waybillId);
                }

                // If shipment was scheduled, it might not have waybill immediately
                if ($biteshipOrderId) {
                    $order->update([
                        'tracking_number' => 'PENDING_' . $biteshipOrderId,
                        'status' => 'processing',
                        'notes' => trim($order->notes . "\n[Biteship Order ID: " . $biteshipOrderId . "]"),
                    ]);

                    return redirect()
                        ->route('backoffice.orders')
                        ->with('status', 'Biteship shipment registered. Waybill pending. Biteship ID: ' . $biteshipOrderId);
                }
            }

            return redirect()
                ->route('backoffice.orders')
                ->with('status', 'Biteship API Error: ' . $response->body());

        } catch (\Exception $e) {
            return redirect()
                ->route('backoffice.orders')
                ->with('status', 'Exception booking shipment: ' . $e->getMessage());
        }
    }

    public function userOrders()
    {
        $orders = Order::with([
            'items.product.images',
            'items.variant',
            'storeBranch'
        ])
        ->where('user_id', auth()->id())
        ->latest('id')
        ->get();

        // If no orders are found in DB, populate dummy orders for testing as requested by user.
        if ($orders->isEmpty()) {
            $orders = $this->getDummyOrders();
        }

        return Inertia::render('orders/OrderHistoryPage', [
            'orders' => $orders
        ]);
    }

    private function getDummyOrders()
    {
        $userId = auth()->id();

        return collect([
            // 1. Pending / Unpaid Order
            [
                'id' => 99991,
                'invoice_number' => 'INV-' . date('Ymd') . '-DUMMY1',
                'user_id' => $userId,
                'store_branch_id' => 1,
                'subtotal' => 155000.00,
                'discount_amount' => 0.00,
                'shipping_cost' => 12000.00,
                'total_amount' => 167000.00,
                'shipping_courier' => 'J&T',
                'shipping_service' => 'EZ',
                'tracking_number' => null,
                'shipping_address' => 'Jl. Merdeka No. 45, Gambir, Jakarta Pusat, DKI Jakarta 10110',
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'notes' => 'Tolong dikemas dengan bubble wrap tebal ya.',
                'created_at' => now()->subHours(2)->toIso8601String(),
                'store_branch' => [
                    'id' => 1,
                    'name' => 'Gudang Utama Jakarta',
                    'code' => 'ID',
                ],
                'items' => [
                    [
                        'id' => 101,
                        'order_id' => 99991,
                        'product_id' => 1,
                        'product_variant_id' => 10,
                        'quantity' => 1,
                        'price' => 155000.00,
                        'product' => [
                            'id' => 1,
                            'title' => 'Fayyfir Signature Perfume',
                            'name_translations' => [
                                'indonesia' => 'Fayyfir Parfum Khas',
                                'english' => 'Fayyfir Signature Perfume',
                                'arabic' => 'عطر فيفير المميز'
                            ],
                            'images' => [
                                ['id' => 1, 'image_path' => '/images/default-perfume.png']
                            ]
                        ],
                        'variant' => [
                            'id' => 10,
                            'name' => '50 ml',
                            'name_translations' => [
                                'indonesia' => '50 ml',
                                'english' => '50 ml',
                                'arabic' => '٥٠ مل'
                            ]
                        ]
                    ]
                ]
            ],
            // 2. Paid / Processing Order
            [
                'id' => 99992,
                'invoice_number' => 'INV-' . date('Ymd') . '-DUMMY2',
                'user_id' => $userId,
                'store_branch_id' => 1,
                'subtotal' => 380000.00,
                'discount_amount' => 0.00,
                'shipping_cost' => 22000.00,
                'total_amount' => 402000.00,
                'shipping_courier' => 'SICEPAT',
                'shipping_service' => 'REG',
                'tracking_number' => null,
                'shipping_address' => 'Jl. Diponegoro No. 12, Tegalsari, Surabaya, Jawa Timur 60264',
                'status' => 'processing',
                'payment_status' => 'paid',
                'notes' => null,
                'created_at' => now()->subDays(1)->toIso8601String(),
                'store_branch' => [
                    'id' => 1,
                    'name' => 'Gudang Utama Jakarta',
                    'code' => 'ID',
                ],
                'items' => [
                    [
                        'id' => 102,
                        'order_id' => 99992,
                        'product_id' => 2,
                        'product_variant_id' => 11,
                        'quantity' => 2,
                        'price' => 190000.00,
                        'product' => [
                            'id' => 2,
                            'title' => 'Arabic Oud Al-Majed',
                            'name_translations' => [
                                'indonesia' => 'Oud Arab Al-Majed',
                                'english' => 'Arabic Oud Al-Majed',
                                'arabic' => 'عود الماجد العربي'
                            ],
                            'images' => [
                                ['id' => 2, 'image_path' => '/images/default-oud.png']
                            ]
                        ],
                        'variant' => [
                            'id' => 11,
                            'name' => '100 ml',
                            'name_translations' => [
                                'indonesia' => '100 ml',
                                'english' => '100 ml',
                                'arabic' => '١٠٠ مل'
                            ]
                        ]
                    ]
                ]
            ],
            // 3. Shipped / In Delivery Order
            [
                'id' => 99993,
                'invoice_number' => 'INV-' . date('Ymd') . '-DUMMY3',
                'user_id' => $userId,
                'store_branch_id' => 1,
                'subtotal' => 290000.00,
                'discount_amount' => 0.00,
                'shipping_cost' => 15000.00,
                'total_amount' => 305000.00,
                'shipping_courier' => 'JNE',
                'shipping_service' => 'REG',
                'tracking_number' => 'JNETEST123456789',
                'shipping_address' => 'Komp. Pondok Indah Blok A-5, Kebayoran Lama, Jakarta Selatan, DKI Jakarta 12310',
                'status' => 'shipped',
                'payment_status' => 'paid',
                'notes' => 'Kirim sore hari ya kalau bisa.',
                'created_at' => now()->subDays(2)->toIso8601String(),
                'store_branch' => [
                    'id' => 1,
                    'name' => 'Gudang Utama Jakarta',
                    'code' => 'ID',
                ],
                'items' => [
                    [
                        'id' => 103,
                        'order_id' => 99993,
                        'product_id' => 3,
                        'product_variant_id' => null,
                        'quantity' => 1,
                        'price' => 290000.00,
                        'product' => [
                            'id' => 3,
                            'title' => 'Premium Bakhoor Burner',
                            'name_translations' => [
                                'indonesia' => 'Pembakar Bakhoor Premium',
                                'english' => 'Premium Bakhoor Burner',
                                'arabic' => 'مبخرة بخور فاخرة'
                            ],
                            'images' => [
                                ['id' => 3, 'image_path' => '/images/default-burner.png']
                            ]
                        ],
                        'variant' => null
                    ]
                ]
            ],
            // 4. Completed Order
            [
                'id' => 99994,
                'invoice_number' => 'INV-' . date('Ymd') . '-DUMMY4',
                'user_id' => $userId,
                'store_branch_id' => 1,
                'subtotal' => 85000.00,
                'discount_amount' => 0.00,
                'shipping_cost' => 9000.00,
                'total_amount' => 94000.00,
                'shipping_courier' => 'Anteraja',
                'shipping_service' => 'REG',
                'tracking_number' => 'ANTRJ1234567890',
                'shipping_address' => 'Jl. Kemang Raya No. 88, Mampang Prapatan, Jakarta Selatan, DKI Jakarta 12730',
                'status' => 'completed',
                'payment_status' => 'paid',
                'notes' => null,
                'created_at' => now()->subDays(5)->toIso8601String(),
                'store_branch' => [
                    'id' => 1,
                    'name' => 'Gudang Utama Jakarta',
                    'code' => 'ID',
                ],
                'items' => [
                    [
                        'id' => 104,
                        'order_id' => 99994,
                        'product_id' => 4,
                        'product_variant_id' => 12,
                        'quantity' => 1,
                        'price' => 85000.00,
                        'product' => [
                            'id' => 4,
                            'title' => 'Organic Jasmine Aromatic Oil',
                            'name_translations' => [
                                'indonesia' => 'Minyak Aromatik Melati Organik',
                                'english' => 'Organic Jasmine Aromatic Oil',
                                'arabic' => 'زيت الياسمين العضوي العطري'
                            ],
                            'images' => [
                                ['id' => 4, 'image_path' => '/images/default-jasmine.png']
                            ]
                        ],
                        'variant' => [
                            'id' => 12,
                            'name' => '10 ml',
                            'name_translations' => [
                                'indonesia' => '10 ml',
                                'english' => '10 ml',
                                'arabic' => '١٠ مل'
                            ]
                        ]
                    ]
                ]
            ],
            // 5. Cancelled Order
            [
                'id' => 99995,
                'invoice_number' => 'INV-' . date('Ymd') . '-DUMMY5',
                'user_id' => $userId,
                'store_branch_id' => 1,
                'subtotal' => 110000.00,
                'discount_amount' => 0.00,
                'shipping_cost' => 12000.00,
                'total_amount' => 122000.00,
                'shipping_courier' => 'TIKI',
                'shipping_service' => 'REG',
                'tracking_number' => null,
                'shipping_address' => 'Jl. Sudirman Kav. 21, Setiabudi, Jakarta Selatan, DKI Jakarta 12920',
                'status' => 'cancelled',
                'payment_status' => 'unpaid',
                'notes' => null,
                'created_at' => now()->subDays(10)->toIso8601String(),
                'store_branch' => [
                    'id' => 1,
                    'name' => 'Gudang Utama Jakarta',
                    'code' => 'ID',
                ],
                'items' => [
                    [
                        'id' => 105,
                        'order_id' => 99995,
                        'product_id' => 5,
                        'product_variant_id' => null,
                        'quantity' => 1,
                        'price' => 110000.00,
                        'product' => [
                            'id' => 5,
                            'title' => 'Pure Amber Incense',
                            'name_translations' => [
                                'indonesia' => 'Dupa Amber Murni',
                                'english' => 'Pure Amber Incense',
                                'arabic' => 'بخور العنبر النقي'
                            ],
                            'images' => [
                                ['id' => 5, 'image_path' => '/images/default-amber.png']
                            ]
                        ],
                        'variant' => null
                    ]
                ]
            ]
        ]);
    }

    public function trackOrder($id)
    {
        $order = Order::with(['items.product', 'items.variant', 'storeBranch'])->findOrFail($id);

        // Check permission: either the order belongs to the user or the user is admin
        if ($order->user_id !== auth()->id() && !in_array(auth()->user()->role, ['admin', 'super_admin'])) {
            abort(403);
        }

        $trackingLogs = [];
        $courierName = strtolower($order->shipping_courier);
        $waybill = $order->tracking_number;

        $hasBiteshipTracking = (!empty($waybill) && !str_starts_with($waybill, 'PENDING_') && $order->storeBranch->country_code === 'ID');

        if ($hasBiteshipTracking) {
            $apiKey = env('BITESHIP_API_KEY');

            try {
                // Request tracking logs from Biteship
                $response = Http::withHeaders([
                    'authorization' => $apiKey,
                ])->get("https://api.biteship.com/v1/trackings/airwaybill/{$waybill}", [
                    'courier' => $courierName
                ]);

                if ($response->successful()) {
                    $data = $response->json();
                    if (isset($data['history']) && is_array($data['history'])) {
                        foreach ($data['history'] as $history) {
                            $trackingLogs[] = [
                                'date' => $history['updated_at'] ?? $history['date'] ?? '',
                                'note' => $history['note'] ?? $history['description'] ?? '',
                                'service_status' => $history['status'] ?? '',
                            ];
                        }
                    }
                }
            } catch (\Exception $e) {
                // Fail silently, use default timeline
            }
        }

        return Inertia::render('orders/TrackOrderPage', [
            'order' => $order,
            'trackingLogs' => $trackingLogs,
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

                preg_match('/(\d+(?:\.\d+)?)\s*(kg|g|gr|gram|kilogram|ml|l|pcs)?/i', $textToParse, $matches);

                if (!empty($matches)) {
                    $value = (float) $matches[1];
                    $unit = isset($matches[2]) ? strtolower($matches[2]) : '';

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
            preg_match('/(\d+(?:\.\d+)?)\s*(kg|g|gr|gram|kilogram)?/i', $textToParse, $matches);
            if (!empty($matches)) {
                $value = (float) $matches[1];
                $unit = isset($matches[2]) ? strtolower($matches[2]) : '';
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
}
