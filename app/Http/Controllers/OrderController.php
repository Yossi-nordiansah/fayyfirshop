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
            'cancellation_status' => 'nullable|in:pending,approved,rejected',
            'cancellation_reason' => 'nullable|string|max:1000',
        ]);

        $order = Order::with('items')->findOrFail($id);
        $oldStatus = $order->status;
        $newStatus = $request->status;

        $updateData = [
            'status' => $newStatus,
            'payment_status' => $request->payment_status,
        ];

        if ($newStatus === 'cancelled') {
            $updateData['cancellation_status'] = 'approved';
            if ($request->filled('cancellation_reason')) {
                $updateData['cancellation_reason'] = $request->cancellation_reason;
            }
        } else {
            if ($request->has('cancellation_status')) {
                $updateData['cancellation_status'] = $request->cancellation_status;
            }
            if ($request->has('cancellation_reason')) {
                $updateData['cancellation_reason'] = $request->cancellation_reason;
            }
        }

        \Illuminate\Support\Facades\DB::transaction(function () use ($order, $oldStatus, $newStatus, $updateData) {
            $order->update($updateData);

            if ($newStatus === 'cancelled' && $oldStatus !== 'cancelled') {
                $order->restoreStock();
            }
        });

        return redirect()
            ->route('backoffice.orders')
            ->with('status', 'Order status updated successfully.');
    }

    public function requestCancellation(Request $request, $id)
    {
        $request->validate([
            'reason' => 'required|string|max:1000',
        ]);

        $order = Order::with('items')->findOrFail($id);

        if ($order->user_id !== auth()->id()) {
            abort(403);
        }

        // Check if already cancelled, completed or shipped
        if ($order->status === 'cancelled' || $order->status === 'completed' || $order->status === 'shipped') {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan tidak dapat dibatalkan karena sudah dikirim, selesai, atau dibatalkan.'
            ], 422);
        }

        // Unpaid or paid orders now both queue for admin approval
        $order->update([
            'cancellation_status' => 'pending',
            'cancellation_reason' => $request->reason,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengajuan pembatalan berhasil dikirim dan sedang menunggu persetujuan admin.'
        ]);
    }

    public function approveCancellation($id)
    {
        // Check backoffice permission
        if (!auth()->check() || !in_array(auth()->user()->role, ['admin', 'super_admin'])) {
            abort(403);
        }

        $order = Order::with('items')->findOrFail($id);

        if ($order->cancellation_status !== 'pending') {
            return redirect()
                ->route('backoffice.orders')
                ->with('status', 'Error: Order does not have a pending cancellation request.');
        }

        try {
            if ($order->payment_details && isset($order->payment_details['midtrans_order_id'])) {
                try {
                    \Midtrans\Config::$serverKey = config('services.midtrans.server_key');
                    \Midtrans\Config::$isProduction = config('services.midtrans.is_production');
                    \Midtrans\Transaction::cancel($order->payment_details['midtrans_order_id']);
                } catch (\Exception $cancelEx) {
                    // Ignore
                }
            }

            \Illuminate\Support\Facades\DB::transaction(function () use ($order) {
                $order->restoreStock();
                $order->update([
                    'status' => 'cancelled',
                    'payment_status' => $order->payment_status === 'paid' ? 'refunded' : 'expired',
                    'cancellation_status' => 'approved',
                ]);
            });

            return redirect()
                ->route('backoffice.orders')
                ->with('status', 'Cancellation request approved. Order is cancelled and stock is restored.');
        } catch (\Exception $e) {
            return redirect()
                ->route('backoffice.orders')
                ->with('status', 'Error approving cancellation: ' . $e->getMessage());
        }
    }

    public function rejectCancellation($id)
    {
        // Check backoffice permission
        if (!auth()->check() || !in_array(auth()->user()->role, ['admin', 'super_admin'])) {
            abort(403);
        }

        $order = Order::findOrFail($id);

        if ($order->cancellation_status !== 'pending') {
            return redirect()
                ->route('backoffice.orders')
                ->with('status', 'Error: Order does not have a pending cancellation request.');
        }

        $order->update([
            'cancellation_status' => 'rejected'
        ]);

        return redirect()
            ->route('backoffice.orders')
            ->with('status', 'Cancellation request rejected.');
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
                'quantity' => (int) $item->quantity,
                'length' => 10,
                'width' => 10,
                'height' => 10,
                'category' => 'general'
            ];
        }

        $apiKey = env('BITESHIP_API_KEY');

        $courier = strtolower($order->shipping_courier);
        $service = strtolower($order->shipping_service);

        // Normalize courier company name for Biteship
        if ($courier === 'j&t') {
            $courier = 'jnt';
        } elseif ($courier === 'pos indonesia') {
            $courier = 'pos';
        }

        // Map service name to Biteship courier_type code
        $courierType = $service;
        if (str_contains($service, 'reguler') || str_contains($service, 'regular')) {
            if ($courier === 'jnt') {
                $courierType = 'ez'; // J&T regular is 'ez'
            } else {
                $courierType = 'reg';
            }
        } elseif (str_contains($service, 'jne trucking') || str_contains($service, 'trucking') || str_contains($service, 'jtr')) {
            $courierType = 'jtr';
        } elseif (str_contains($service, 'pos reguler')) {
            $courierType = 'reg';
        } elseif (str_contains($service, 'ez')) {
            $courierType = 'ez';
        } elseif (str_contains($service, 'yes')) {
            $courierType = 'yes';
        } elseif (str_contains($service, 'oke')) {
            $courierType = 'oke';
        } elseif (str_contains($service, 'gokil')) {
            $courierType = 'gokil';
        } elseif (str_contains($service, 'same day') || str_contains($service, 'sameday')) {
            $courierType = 'same_day';
        } elseif (str_contains($service, 'instant')) {
            $courierType = 'instant';
        }

        $payload = [
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
            'courier_company' => $courier,
            'courier_type' => $courierType,
            'delivery_type' => 'now',
            'items' => $biteshipItems
        ];

        // Fetch coordinates and additional details for Gojek/Grab instant shipping
        if (in_array($courier, ['gojek', 'grab'])) {
            $originAddress = $branch->detail_address ?: ($branch->street . ', ' . $branch->city);
            $destAddress = $order->shipping_address;

            $originCoord = $this->resolveCoordinates($originAddress);
            $destCoord = $this->resolveCoordinates($destAddress);

            if ($originCoord) {
                $payload['origin_coordinate'] = $originCoord;
            }
            if ($destCoord) {
                $payload['destination_coordinate'] = $destCoord;
            }

            if ($branch->postal_code) {
                $payload['origin_postal_code'] = (int) $branch->postal_code;
            }
            if ($user->postal_code) {
                $payload['destination_postal_code'] = (int) $user->postal_code;
            }

            $payload['origin_note'] = $branch->detail_address ?: 'Ambil di Toko';
            $payload['destination_note'] = $order->notes ?: 'Tiba di alamat pengiriman';
        }

        try {
            $response = Http::withHeaders([
                'authorization' => $apiKey,
            ])->post('https://api.biteship.com/v1/orders', $payload);

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
            'user',
            'items.product.images',
            'items.product.reviews' => function ($query) {
                $query->where('user_id', auth()->id());
            },
            'items.variant',
            'storeBranch'
        ])
        ->where('user_id', auth()->id())
        ->latest('id')
        ->get();

        return Inertia::render('orders/OrderHistoryPage', [
            'orders' => $orders,
            'midtransClientKey' => config('services.midtrans.client_key'),
            'isProduction' => config('services.midtrans.is_production'),
        ]);
    }

    public function trackOrder($id)
    {
        $order = Order::with(['user', 'items.product', 'items.variant', 'storeBranch'])->findOrFail($id);

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

    public function getPaymentToken($id)
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

        if (!empty($order->payment_token)) {
            return response()->json([
                'success' => true,
                'snap_token' => $order->payment_token
            ]);
        }

        try {
            \Midtrans\Config::$serverKey = config('services.midtrans.server_key');
            \Midtrans\Config::$isProduction = config('services.midtrans.is_production');
            \Midtrans\Config::$isSanitized = true;
            \Midtrans\Config::$is3ds = true;

            $user = auth()->user();
            $nameParts = explode(' ', trim($user->name));
            $firstName = $nameParts[0];
            $lastName = count($nameParts) > 1 ? implode(' ', array_slice($nameParts, 1)) : '';

            $params = [
                'transaction_details' => [
                    'order_id' => $order->invoice_number,
                    'gross_amount' => (int) $order->total_amount,
                ],
                'customer_details' => [
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'email' => $user->email,
                    'phone' => $user->phone ?: '08111222333',
                ],
                'notification_url' => url('/checkout/midtrans-callback'),
            ];

            $snapToken = \Midtrans\Snap::getSnapToken($params);
            $order->update(['payment_token' => $snapToken]);

            return response()->json([
                'success' => true,
                'snap_token' => $snapToken
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate payment token: ' . $e->getMessage()
            ], 500);
        }
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

    private function resolveCoordinates($address)
    {
        try {
            $response = Http::withHeaders([
                'User-Agent' => 'FayyfirShop/1.0 (contact@fayyfirshop.com)'
            ])->get('https://nominatim.openstreetmap.org/search', [
                'q' => $address,
                'format' => 'json',
                'limit' => 1,
            ]);

            if ($response->successful() && !empty($response->json())) {
                $data = $response->json()[0];
                return [
                    'latitude' => (float)$data['lat'],
                    'longitude' => (float)$data['lon'],
                ];
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Coordinate resolution failed: ' . $e->getMessage());
        }
        return null;
    }
}
