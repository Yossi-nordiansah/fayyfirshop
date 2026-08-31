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
        // Cancel any expired pending orders first
        Order::cancelExpiredOrders();

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

        \Illuminate\Support\Facades\DB::transaction(function () use ($order, $updateData) {
            $order->update($updateData);
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
            if ($order->payment_details && isset($order->payment_details['xendit_invoice_id'])) {
                try {
                    \Xendit\Configuration::setXenditKey(config('services.xendit.secret_key'));
                    $apiInstance = new \Xendit\Invoice\InvoiceApi();
                    $apiInstance->expireInvoice($order->payment_details['xendit_invoice_id']);
                } catch (\Exception $cancelEx) {
                    // Ignore
                }
            }

            \Illuminate\Support\Facades\DB::transaction(function () use ($order) {
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
        $order = Order::with(['user', 'storeBranch', 'items.product.category', 'items.variant.parent'])->findOrFail($id);

        if (!empty($order->tracking_number)) {
            return redirect()
                ->route('backoffice.orders')
                ->with('status', 'Order already has a shipment registered (Tracking: ' . $order->tracking_number . ').');
        }

        $branch = $order->storeBranch;
        $user = $order->user;
        $destAreaId = $order->destination_area_id ?: ($user ? $user->area_id : null);

        if (!$branch || !$branch->area_id) {
            return redirect()
                ->route('backoffice.orders')
                ->with('status', 'Error: Processing branch must have a valid Biteship Area ID.');
        }

        if (!$destAreaId) {
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

            // Determine valid Biteship item category
            $itemCategory = 'fashion';
            if ($product && $product->category) {
                $catName = strtolower($product->category->name ?? $product->category->name_translations['english'] ?? $product->category->name_translations['indonesia'] ?? '');
                if (str_contains($catName, 'parfum') || str_contains($catName, 'perfume') || str_contains($catName, 'beauty') || str_contains($catName, 'kosmetik') || str_contains($catName, 'minyak') || str_contains($catName, 'oil') || str_contains($catName, 'oud') || str_contains($catName, 'bakhoor')) {
                    $itemCategory = 'beauty';
                } elseif (str_contains($catName, 'sehat') || str_contains($catName, 'health') || str_contains($catName, 'nutrisi') || str_contains($catName, 'obat')) {
                    $itemCategory = 'healthcare';
                } elseif (str_contains($catName, 'makanan') || str_contains($catName, 'food') || str_contains($catName, 'minum') || str_contains($catName, 'drink')) {
                    $itemCategory = 'food_and_drink';
                } elseif (str_contains($catName, 'fashion') || str_contains($catName, 'baju') || str_contains($catName, 'pakaian') || str_contains($catName, 'abaya') || str_contains($catName, 'gamis') || str_contains($catName, 'hijab')) {
                    $itemCategory = 'fashion';
                } else {
                    $itemCategory = 'others';
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
                'category' => $itemCategory
            ];
        }

        $apiKey = env('BITESHIP_API_KEY');

        $rawCourier = strtolower(trim($order->shipping_courier ?? ''));
        $rawService = strtolower(trim($order->shipping_service ?? ''));

        // Normalize courier company name for Biteship
        $courier = $rawCourier;
        if (str_contains($rawCourier, 'ninja')) {
            $courier = 'ninja';
        } elseif (str_contains($rawCourier, 'j&t') || str_contains($rawCourier, 'jnt')) {
            $courier = 'jnt';
        } elseif (str_contains($rawCourier, 'pos')) {
            $courier = 'pos';
        } elseif (str_contains($rawCourier, 'sicepat')) {
            $courier = 'sicepat';
        } elseif (str_contains($rawCourier, 'anteraja')) {
            $courier = 'anteraja';
        } elseif (str_contains($rawCourier, 'lion')) {
            $courier = 'lion';
        } elseif (str_contains($rawCourier, 'tiki')) {
            $courier = 'tiki';
        } elseif (str_contains($rawCourier, 'wahana')) {
            $courier = 'wahana';
        } elseif (str_contains($rawCourier, 'jne')) {
            $courier = 'jne';
        } elseif (str_contains($rawCourier, 'gojek')) {
            $courier = 'gojek';
        } elseif (str_contains($rawCourier, 'grab')) {
            $courier = 'grab';
        }

        // Map service name to Biteship courier_type code per expedition
        $courierType = $rawService;
        if ($courier === 'ninja') {
            if (str_contains($rawService, 'fast') || str_contains($rawService, 'express')) {
                $courierType = 'fast';
            } elseif (str_contains($rawService, 'sameday') || str_contains($rawService, 'same day')) {
                $courierType = 'sameday';
            } else {
                $courierType = 'standard';
            }
        } elseif ($courier === 'jnt') {
            if (str_contains($rawService, 'cargo') || str_contains($rawService, 'jdr')) {
                $courierType = 'jdr';
            } else {
                $courierType = 'ez';
            }
        } elseif ($courier === 'jne') {
            if (str_contains($rawService, 'trucking') || str_contains($rawService, 'jtr')) {
                $courierType = 'jtr';
            } elseif (str_contains($rawService, 'yes')) {
                $courierType = 'yes';
            } elseif (str_contains($rawService, 'oke')) {
                $courierType = 'oke';
            } else {
                $courierType = 'reg';
            }
        } elseif ($courier === 'sicepat') {
            if (str_contains($rawService, 'gokil') || str_contains($rawService, 'cargo')) {
                $courierType = 'gokil';
            } elseif (str_contains($rawService, 'best') || str_contains($rawService, 'besok')) {
                $courierType = 'best';
            } elseif (str_contains($rawService, 'sds') || str_contains($rawService, 'same day') || str_contains($rawService, 'sameday')) {
                $courierType = 'sds';
            } elseif (str_contains($rawService, 'siunt') || str_contains($rawService, 'untung')) {
                $courierType = 'siunt';
            } else {
                $courierType = 'reg';
            }
        } elseif ($courier === 'pos') {
            if (str_contains($rawService, 'next') || str_contains($rawService, 'express') || str_contains($rawService, 'kilat')) {
                $courierType = 'next_day';
            } else {
                $courierType = 'reg';
            }
        } elseif ($courier === 'anteraja') {
            if (str_contains($rawService, 'next') || str_contains($rawService, 'nd')) {
                $courierType = 'next_day';
            } elseif (str_contains($rawService, 'same') || str_contains($rawService, 'sd')) {
                $courierType = 'same_day';
            } elseif (str_contains($rawService, 'cargo')) {
                $courierType = 'cargo';
            } elseif (str_contains($rawService, 'eco') || str_contains($rawService, 'hemat')) {
                $courierType = 'eco';
            } else {
                $courierType = 'reg';
            }
        } else {
            if (str_contains($rawService, 'reguler') || str_contains($rawService, 'regular')) {
                $courierType = 'reg';
            } elseif (str_contains($rawService, 'same day') || str_contains($rawService, 'sameday')) {
                $courierType = 'same_day';
            } elseif (str_contains($rawService, 'instant')) {
                $courierType = 'instant';
            }
        }

        // Clean and normalize phone numbers (digits only, 08... format for courier APIs)
        $cleanBranchPhone = preg_replace('/[^0-9]/', '', $branch->whatsapp_number ?: '081234567890');
        if (str_starts_with($cleanBranchPhone, '62')) {
            $cleanBranchPhone = '0' . substr($cleanBranchPhone, 2);
        }

        $rawReceiverPhone = $order->receiver_phone ?: ($user ? $user->phone : '08123456789');
        $cleanReceiverPhone = preg_replace('/[^0-9]/', '', $rawReceiverPhone);
        if (str_starts_with($cleanReceiverPhone, '62')) {
            $cleanReceiverPhone = '0' . substr($cleanReceiverPhone, 2);
        }

        $receiverName = $order->receiver_name ?: ($user ? ($user->receiver_name ?: $user->name) : 'Pelanggan');
        $destAreaId = $order->destination_area_id ?: ($user ? $user->area_id : null);

        // Ensure robust origin address (minimum character requirements for couriers like Anteraja)
        $originAddress = $branch->detail_address ?: trim(($branch->street ? $branch->street . ', ' : '') . ($branch->district ? $branch->district . ', ' : '') . ($branch->city ?: '') . ($branch->province ? ', ' . $branch->province : '') . ($branch->postal_code ? ' ' . $branch->postal_code : ''));
        if (empty($originAddress) || strlen($originAddress) < 10) {
            $originAddress = 'Gudang / Toko ' . $branch->name . ', ' . ($branch->city ?: 'Kediri') . ', ' . ($branch->province ?: 'Jawa Timur');
        }

        $payload = [
            'shipper_contact_name' => $branch->name,
            'shipper_contact_phone' => $cleanBranchPhone,
            'origin_contact_name' => $branch->name,
            'origin_contact_phone' => $cleanBranchPhone,
            'origin_address' => $originAddress,
            'origin_area_id' => $branch->area_id,
            'destination_contact_name' => $receiverName,
            'destination_contact_phone' => $cleanReceiverPhone,
            'destination_address' => $order->shipping_address,
            'destination_area_id' => $destAreaId,
            'courier_company' => $courier,
            'courier_type' => $courierType,
            'delivery_type' => 'now',
            'reference_id' => $order->invoice_number,
            'items' => $biteshipItems
        ];

        // Resolve Coordinates only for Instant and Same Day Couriers (Required by Gojek, Grab, etc.)
        $isInstantOrSameDay = in_array($courier, ['gojek', 'grab']) || str_contains($courierType, 'instant') || str_contains($courierType, 'same_day');

        if ($isInstantOrSameDay) {
            $originFallback = ($branch->city ?: 'Kediri') . ', ' . ($branch->province ?: 'Jawa Timur') . ', Indonesia';
            $destAddress = $order->shipping_address;
            $destFallback = $order->shipping_address;

            if (!empty($branch->latitude) && !empty($branch->longitude)) {
                $originCoord = [
                    'latitude' => (float)$branch->latitude,
                    'longitude' => (float)$branch->longitude,
                ];
            } else {
                $originCoord = $this->resolveCoordinates($originAddress, $originFallback);
                if ($originCoord) {
                    $branch->update([
                        'latitude' => $originCoord['latitude'],
                        'longitude' => $originCoord['longitude'],
                    ]);
                }
            }

            $destCoord = $this->resolveCoordinates($destAddress, $destFallback);

            if ($originCoord) {
                $payload['origin_coordinate'] = $originCoord;
            }
            if ($destCoord) {
                $payload['destination_coordinate'] = $destCoord;
            }
        }

        if ($branch->postal_code) {
            $payload['origin_postal_code'] = (int) $branch->postal_code;
        }
        // Extract 5-digit postal code from destination address if present (do not use fallback from $user->postal_code)
        if (preg_match('/\b(\d{5})\b/', $order->shipping_address, $postMatches)) {
            $payload['destination_postal_code'] = (int) $postMatches[1];
        }

        $payload['origin_note'] = $branch->detail_address ?: ('Gudang / Toko ' . $branch->name);
        $payload['destination_note'] = $order->notes ?: 'Tiba di alamat pengiriman';

        \Illuminate\Support\Facades\Log::info('Biteship Order Payload:', $payload);

        try {
            $response = Http::withHeaders([
                'authorization' => $apiKey,
            ])->post('https://api.biteship.com/v1/orders', $payload);

            $isDropOffUsed = false;
            if (!$response->successful()) {
                $resJson = $response->json();
                $errorCode = $resJson['code'] ?? null;
                $errorMsg = strtolower($resJson['error'] ?? '');

                // If courier cannot provide pickup service in origin location or rate/service issue, retry with drop_off collection method or alternative service code
                if ($errorCode === 40002031 || $errorCode === 40002007 || $errorCode === 40002021 || str_contains($errorMsg, 'pickup') || str_contains($errorMsg, 'scheduled') || str_contains($errorMsg, 'failed')) {
                    $dropOffPayload = $payload;
                    $dropOffPayload['origin_collection_method'] = 'drop_off';

                    if ($courier === 'anteraja') {
                        $dropOffPayload['courier_type'] = ($courierType === 'reg') ? 'regular' : 'reg';
                    }

                    $retryResponse = Http::withHeaders([
                        'authorization' => $apiKey,
                    ])->post('https://api.biteship.com/v1/orders', $dropOffPayload);

                    if ($retryResponse->successful()) {
                        $response = $retryResponse;
                        $isDropOffUsed = true;
                    }
                }
            }

            if ($response->successful()) {
                $data = $response->json();
                
                // Fetch the airwaybill / tracking number
                $waybillId = $data['courier']['waybill_id'] ?? null;
                $biteshipOrderId = $data['id'] ?? null;

                $noteSuffix = $isDropOffUsed ? " (Metode: Drop Off ke Gerai)" : "";

                if ($waybillId) {
                    $order->update([
                        'tracking_number' => $waybillId,
                        'status' => 'shipped', // Langsung masuk ke status dikirim
                        'notes' => trim($order->notes . "\n[Biteship Order ID: " . $biteshipOrderId . "]" . $noteSuffix),
                    ]);

                    return redirect()
                        ->route('backoffice.orders')
                        ->with('status', 'Pengiriman Biteship berhasil dipesan!' . $noteSuffix . ' Resi: ' . $waybillId);
                }

                // If shipment was scheduled/pending, it might not have waybill immediately
                if ($biteshipOrderId) {
                    $order->update([
                        'tracking_number' => 'PENDING_' . $biteshipOrderId,
                        'status' => 'shipped', // Langsung masuk ke status dikirim
                        'notes' => trim($order->notes . "\n[Biteship Order ID: " . $biteshipOrderId . "]" . $noteSuffix),
                    ]);

                    return redirect()
                        ->route('backoffice.orders')
                        ->with('status', 'Pengiriman Biteship terdaftar' . $noteSuffix . '. Status: Dikirim (Biteship ID: ' . $biteshipOrderId . ')');
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
        // Cancel any expired pending orders for this user first
        Order::cancelExpiredOrders(auth()->id());

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
        $biteshipStatus = null;
        $courierName = strtolower($order->shipping_courier ?? '');
        $apiKey = env('BITESHIP_API_KEY');

        // Extract Biteship Order ID if stored in notes or tracking_number
        $biteshipOrderId = null;
        if (preg_match('/\[Biteship Order ID:\s*([a-zA-Z0-9_-]+)\]/', $order->notes ?? '', $matches)) {
            $biteshipOrderId = $matches[1];
        } elseif (str_starts_with((string) $order->tracking_number, 'PENDING_')) {
            $biteshipOrderId = str_replace('PENDING_', '', $order->tracking_number);
        }

        // Normalize courier code for Biteship API
        if (str_contains($courierName, 'j&t') || str_contains($courierName, 'jnt')) {
            $courierCode = 'jnt';
        } elseif (str_contains($courierName, 'pos')) {
            $courierCode = 'pos';
        } elseif (str_contains($courierName, 'sicepat')) {
            $courierCode = 'sicepat';
        } elseif (str_contains($courierName, 'anteraja')) {
            $courierCode = 'anteraja';
        } elseif (str_contains($courierName, 'ninja')) {
            $courierCode = 'ninja';
        } elseif (str_contains($courierName, 'lion')) {
            $courierCode = 'lion';
        } elseif (str_contains($courierName, 'tiki')) {
            $courierCode = 'tiki';
        } elseif (str_contains($courierName, 'gojek')) {
            $courierCode = 'gojek';
        } elseif (str_contains($courierName, 'grab')) {
            $courierCode = 'grab';
        } else {
            $courierCode = 'jne';
        }

        // 1. If Biteship Order ID exists, fetch latest order info from Biteship
        if ($biteshipOrderId && $apiKey) {
            try {
                $orderRes = Http::withHeaders([
                    'authorization' => $apiKey,
                ])->timeout(5)->get("https://api.biteship.com/v1/orders/{$biteshipOrderId}");

                if ($orderRes->successful()) {
                    $orderData = $orderRes->json();
                    $biteshipStatus = strtolower($orderData['status'] ?? '');
                    $fetchedWaybill = $orderData['courier']['waybill_id'] ?? null;

                    // Update tracking number if waybill was pending
                    if ($fetchedWaybill && ($order->tracking_number !== $fetchedWaybill)) {
                        $order->update(['tracking_number' => $fetchedWaybill]);
                        $order->refresh();
                    }

                    // Extract history from courier object if present
                    if (isset($orderData['courier']['history']) && is_array($orderData['courier']['history']) && !empty($orderData['courier']['history'])) {
                        foreach ($orderData['courier']['history'] as $history) {
                            $trackingLogs[] = [
                                'date' => $history['updated_at'] ?? $history['date'] ?? '',
                                'note' => $history['note'] ?? $history['description'] ?? '',
                                'service_status' => $history['status'] ?? '',
                            ];
                        }
                    }
                }
            } catch (\Exception $e) {
                Log::warning("Error fetching Biteship order {$biteshipOrderId}: " . $e->getMessage());
            }
        }

        // 2. If waybill is available and trackingLogs is still empty, query Airwaybill tracking
        $waybill = $order->tracking_number;
        if (!empty($waybill) && !str_starts_with($waybill, 'PENDING_') && empty($trackingLogs) && $apiKey) {
            try {
                $trackRes = Http::withHeaders([
                    'authorization' => $apiKey,
                ])->timeout(5)->get("https://api.biteship.com/v1/trackings/airwaybill/{$waybill}", [
                    'courier' => $courierCode
                ]);

                if ($trackRes->successful()) {
                    $trackData = $trackRes->json();
                    $biteshipStatus = $biteshipStatus ?: strtolower($trackData['status'] ?? '');
                    if (isset($trackData['history']) && is_array($trackData['history'])) {
                        foreach ($trackData['history'] as $history) {
                            $trackingLogs[] = [
                                'date' => $history['updated_at'] ?? $history['date'] ?? '',
                                'note' => $history['note'] ?? $history['description'] ?? '',
                                'service_status' => $history['status'] ?? '',
                            ];
                        }
                    }
                }
            } catch (\Exception $e) {
                Log::warning("Error tracking airwaybill {$waybill}: " . $e->getMessage());
            }
        }

        // 3. Status mapping helper in Indonesian
        $statusDescriptions = [
            'confirmed' => [
                'title' => 'Pengiriman Terkonfirmasi',
                'desc' => 'Pesanan pengiriman telah berhasil didaftarkan dan dikonfirmasi di sistem kurir (' . strtoupper($order->shipping_courier ?? 'Kurir') . '). Menunggu penjemputan paket oleh kurir.',
            ],
            'allocated' => [
                'title' => 'Kurir Dialokasikan',
                'desc' => 'Kurir telah ditugaskan untuk melakukan penjemputan paket di lokasi toko / gudang pengirim.',
            ],
            'picking_up' => [
                'title' => 'Dalam Penjemputan',
                'desc' => 'Kurir sedang dalam perjalanan menuju lokasi toko / gudang untuk mengambil paket.',
            ],
            'picked' => [
                'title' => 'Paket Telah Dijemput',
                'desc' => 'Paket telah diserahkan kepada kurir dan dalam perjalanan menuju pusat sortir / drop point ekspedisi.',
            ],
            'dropping_off' => [
                'title' => 'Sedang Diantar ke Tujuan',
                'desc' => 'Paket sedang dibawa kurir pengantar menuju alamat pengiriman Anda.',
            ],
            'in_transit' => [
                'title' => 'Dalam Perjalanan',
                'desc' => 'Paket sedang transit antar hub ekspedisi menuju kota tujuan.',
            ],
            'on_hold' => [
                'title' => 'Paket Tertahan di Transit',
                'desc' => 'Paket sedang dalam penanganan atau menunggu jadwal pengantaran berikutnya di hub ekspedisi.',
            ],
            'delivered' => [
                'title' => 'Paket Terkirim',
                'desc' => 'Paket telah berhasil sampai di alamat tujuan dan diterima oleh pembeli.',
            ],
            'cancelled' => [
                'title' => 'Pengiriman Dibatalkan',
                'desc' => 'Pesanan pengiriman kurir telah dibatalkan.',
            ],
        ];

        // If trackingLogs is empty, but order is shipped or Biteship status is known, add the milestone
        if (empty($trackingLogs)) {
            $currentBiteshipStatus = $biteshipStatus ?: ($order->status === 'shipped' ? 'confirmed' : null);
            if ($currentBiteshipStatus && isset($statusDescriptions[$currentBiteshipStatus])) {
                $trackingLogs[] = [
                    'date' => $order->updated_at ? $order->updated_at->toIso8601String() : now()->toIso8601String(),
                    'note' => $statusDescriptions[$currentBiteshipStatus]['desc'],
                    'service_status' => $currentBiteshipStatus,
                    'title' => $statusDescriptions[$currentBiteshipStatus]['title'],
                ];
            }
        }

        return Inertia::render('orders/TrackOrderPage', [
            'order' => $order,
            'trackingLogs' => $trackingLogs,
            'biteshipStatus' => $biteshipStatus,
        ]);
    }

    public function printWaybill($id)
    {
        $order = Order::with([
            'user',
            'items.product.images',
            'items.variant',
            'storeBranch'
        ])->findOrFail($id);

        // Check permission: either the order belongs to the user or the user is admin
        if ($order->user_id !== auth()->id() && !in_array(auth()->user()->role, ['admin', 'super_admin'])) {
            abort(403);
        }

        // Calculate total order weight in grams
        $totalWeightGrams = 0;
        foreach ($order->items as $item) {
            $weightGram = $this->parseWeight($item->variant, $item->product);
            $totalWeightGrams += ($weightGram * $item->quantity);
        }
        if ($totalWeightGrams <= 0) {
            $totalWeightGrams = 1000;
        }

        return Inertia::render('backoffice/orders/PrintWaybillPage', [
            'order' => $order,
            'totalWeightGrams' => $totalWeightGrams,
        ]);
    }

    public function backofficeTrackOrder($id)
    {
        $order = Order::with(['user', 'items.product', 'items.variant', 'storeBranch'])->findOrFail($id);

        if (!in_array(auth()->user()->role, ['admin', 'super_admin'])) {
            abort(403);
        }

        $trackingLogs = [];
        $biteshipStatus = null;
        $courierName = strtolower($order->shipping_courier ?? '');
        $apiKey = env('BITESHIP_API_KEY');

        $biteshipOrderId = null;
        if (preg_match('/\[Biteship Order ID:\s*([a-zA-Z0-9_-]+)\]/', $order->notes ?? '', $matches)) {
            $biteshipOrderId = $matches[1];
        } elseif (str_starts_with((string) $order->tracking_number, 'PENDING_')) {
            $biteshipOrderId = str_replace('PENDING_', '', $order->tracking_number);
        }

        if (str_contains($courierName, 'j&t') || str_contains($courierName, 'jnt')) {
            $courierCode = 'jnt';
        } elseif (str_contains($courierName, 'pos')) {
            $courierCode = 'pos';
        } elseif (str_contains($courierName, 'sicepat')) {
            $courierCode = 'sicepat';
        } elseif (str_contains($courierName, 'anteraja')) {
            $courierCode = 'anteraja';
        } elseif (str_contains($courierName, 'ninja')) {
            $courierCode = 'ninja';
        } elseif (str_contains($courierName, 'lion')) {
            $courierCode = 'lion';
        } elseif (str_contains($courierName, 'tiki')) {
            $courierCode = 'tiki';
        } elseif (str_contains($courierName, 'gojek')) {
            $courierCode = 'gojek';
        } elseif (str_contains($courierName, 'grab')) {
            $courierCode = 'grab';
        } else {
            $courierCode = 'jne';
        }

        if ($biteshipOrderId && $apiKey) {
            try {
                $orderRes = Http::withHeaders(['authorization' => $apiKey])->timeout(5)->get("https://api.biteship.com/v1/orders/{$biteshipOrderId}");
                if ($orderRes->successful()) {
                    $orderData = $orderRes->json();
                    $biteshipStatus = strtolower($orderData['status'] ?? '');
                    $fetchedWaybill = $orderData['courier']['waybill_id'] ?? null;
                    if ($fetchedWaybill && ($order->tracking_number !== $fetchedWaybill)) {
                        $order->update(['tracking_number' => $fetchedWaybill]);
                        $order->refresh();
                    }
                    if (isset($orderData['courier']['history']) && !empty($orderData['courier']['history'])) {
                        foreach ($orderData['courier']['history'] as $history) {
                            $trackingLogs[] = [
                                'date' => $history['updated_at'] ?? $history['date'] ?? '',
                                'note' => $history['note'] ?? $history['description'] ?? '',
                                'service_status' => $history['status'] ?? '',
                            ];
                        }
                    }
                }
            } catch (\Exception $e) {
                Log::warning("Backoffice track: Biteship order error: " . $e->getMessage());
            }
        }

        $waybill = $order->tracking_number;
        if (!empty($waybill) && !str_starts_with($waybill, 'PENDING_') && empty($trackingLogs) && $apiKey) {
            try {
                $trackRes = Http::withHeaders(['authorization' => $apiKey])->timeout(5)->get("https://api.biteship.com/v1/trackings/airwaybill/{$waybill}", ['courier' => $courierCode]);
                if ($trackRes->successful()) {
                    $trackData = $trackRes->json();
                    $biteshipStatus = $biteshipStatus ?: strtolower($trackData['status'] ?? '');
                    foreach ($trackData['history'] ?? [] as $history) {
                        $trackingLogs[] = [
                            'date' => $history['updated_at'] ?? $history['date'] ?? '',
                            'note' => $history['note'] ?? $history['description'] ?? '',
                            'service_status' => $history['status'] ?? '',
                        ];
                    }
                }
            } catch (\Exception $e) {
                Log::warning("Backoffice track: Airwaybill error: " . $e->getMessage());
            }
        }

        if (empty($trackingLogs) && $order->status === 'shipped') {
            $trackingLogs[] = [
                'date' => $order->updated_at ? $order->updated_at->toIso8601String() : now()->toIso8601String(),
                'note' => 'Pesanan pengiriman telah berhasil didaftarkan dan dikonfirmasi di sistem kurir (' . strtoupper($order->shipping_courier ?? 'Kurir') . '). Menunggu penjemputan paket oleh kurir.',
                'service_status' => 'confirmed',
                'title' => 'Pengiriman Terkonfirmasi',
            ];
        }

        return response()->json([
            'success' => true,
            'order' => [
                'id' => $order->id,
                'invoice_number' => $order->invoice_number,
                'status' => $order->status,
                'tracking_number' => $order->tracking_number,
                'shipping_courier' => $order->shipping_courier,
                'shipping_service' => $order->shipping_service,
            ],
            'trackingLogs' => $trackingLogs,
            'biteshipStatus' => $biteshipStatus,
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

        $details = $order->payment_details ?: [];

        if (!empty($details['snap_token'])) {
            return response()->json([
                'success' => true,
                'snap_token' => $details['snap_token'],
                'redirect_url' => route('checkout.payment', $order->id),
            ]);
        }

        if (!empty($details['invoice_url']) || !empty($details['va_number']) || !empty($details['qr_string'])) {
            return response()->json([
                'success' => true,
                'invoice_url' => $details['invoice_url'] ?? null,
                'redirect_url' => route('checkout.payment', $order->id),
            ]);
        }

        try {
            $checkoutCtrl = new \App\Http\Controllers\CheckoutController();
            $details = $checkoutCtrl->chargePayment($order, $order->payment_method ?: 'qris');
            $order->update(['payment_details' => $details]);

            return response()->json([
                'success' => true,
                'snap_token' => $details['snap_token'] ?? null,
                'invoice_url' => $details['invoice_url'] ?? null,
                'redirect_url' => route('checkout.payment', $order->id),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mendapatkan data pembayaran: ' . $e->getMessage()
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

    /**
     * Resolve latitude and longitude from an address using Nominatim OpenStreetMap
     * with fallback to city / province.
     */
    private function resolveCoordinates($address, $fallbackQuery = null)
    {
        if (empty($address)) {
            $address = $fallbackQuery;
        }

        if (empty($address)) {
            return [
                'latitude' => -7.8480,
                'longitude' => 112.0178,
            ];
        }

        try {
            $cleanAddress = preg_replace('/(RT|RW|No\.?|Dsn\.?|Desa|Kel\.?|Kec\.?)\s*\w+/i', '', $address);
            $response = Http::withHeaders([
                'User-Agent' => 'FayyfirShop/1.0 (contact@fayyfirshop.com)'
            ])->timeout(4)->get('https://nominatim.openstreetmap.org/search', [
                'q' => trim($cleanAddress) ?: $address,
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

            // Fallback query (e.g. City/District)
            if ($fallbackQuery && $fallbackQuery !== $address) {
                $response = Http::withHeaders([
                    'User-Agent' => 'FayyfirShop/1.0 (contact@fayyfirshop.com)'
                ])->timeout(4)->get('https://nominatim.openstreetmap.org/search', [
                    'q' => $fallbackQuery,
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
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('Coordinate resolution warning: ' . $e->getMessage());
        }

        // Safe fallback default coordinates (East Java center / Kediri)
        return [
            'latitude' => -7.8480,
            'longitude' => 112.0178,
        ];
    }

    /**
     * Handle Biteship webhook callbacks for order status updates.
     * Called automatically by Biteship when shipment status changes.
     */
    public function biteshipWebhook(Request $request)
    {
        \Illuminate\Support\Facades\Log::info('Biteship Webhook Received:', [
            'headers' => $request->headers->all(),
            'payload' => $request->all(),
        ]);

        // Verify Biteship webhook token
        $receivedToken = $request->header('biteship-token') ?? $request->header('x-biteship-token') ?? $request->header('authorization');
        $configuredToken = env('BITESHIP_WEBHOOK_TOKEN');

        if ($configuredToken && $receivedToken && $receivedToken !== $configuredToken) {
            \Illuminate\Support\Facades\Log::warning('Biteship Webhook Token Mismatch', [
                'received' => $receivedToken,
            ]);
            return response()->json(['message' => 'Invalid webhook token'], 403);
        }

        // Extract order data from payload
        // Biteship sends: order_id (or id), status, waybill_id, reference_id, courier tracking, etc.
        $biteshipOrderId = $request->input('order_id') 
            ?? $request->input('data.order_id') 
            ?? $request->input('order.id') 
            ?? $request->input('id');

        $newStatus = strtolower(
            $request->input('status') 
            ?? $request->input('data.status') 
            ?? $request->input('courier.status') 
            ?? $request->input('event') 
            ?? ''
        );

        $waybillId = $request->input('courier_waybill_id') 
            ?? $request->input('courier_tracking_id') 
            ?? $request->input('waybill_id') 
            ?? $request->input('data.waybill_id') 
            ?? $request->input('courier.waybill_id')
            ?? $request->input('courier.tracking_id');

        $referenceId = $request->input('reference_id') 
            ?? $request->input('order.reference_id') 
            ?? $request->input('data.reference_id');

        if (!$biteshipOrderId && !$waybillId && !$referenceId) {
            return response()->json(['status' => 'ok', 'message' => 'No order identifier found'], 200);
        }

        // Find the order
        $order = null;

        // 1. By Invoice Number (reference_id)
        if ($referenceId) {
            $order = Order::where('invoice_number', $referenceId)->first();
        }

        // 2. By Biteship Order ID stored in notes
        if (!$order && $biteshipOrderId) {
            $order = Order::where('notes', 'like', '%[Biteship Order ID: ' . $biteshipOrderId . ']%')
                ->orWhere('tracking_number', 'PENDING_' . $biteshipOrderId)
                ->first();
        }

        // 3. By Waybill / Tracking Number
        if (!$order && $waybillId) {
            $order = Order::where('tracking_number', $waybillId)->first();
        }

        if (!$order) {
            \Illuminate\Support\Facades\Log::info('Biteship Webhook: Order not found in DB', [
                'biteship_order_id' => $biteshipOrderId,
                'waybill_id'        => $waybillId,
                'reference_id'      => $referenceId,
            ]);
            return response()->json(['message' => 'Webhook received (order not found)'], 200);
        }

        // Map Biteship status → Fayyfir order status
        // Biteship statuses:
        // - 'confirmed', 'allocated' -> Order confirmed & courier assigned
        // - 'picking_up' (Dalam Penjemputan) -> Kurir menuju lokasi penjemputan
        // - 'picked' (Sudah Dijemput) -> Kurir sudah mengambil paket dari penjual
        // - 'dropping_off', 'in_transit', 'on_hold' -> Paket sedang dikirim ke alamat tujuan
        // - 'delivered' -> Paket telah diterima pembeli (Selesai)
        // - 'cancelled', 'rejected', 'returned' -> Dibatalkan / ditolak / dikembalikan
        $updates = [];

        if ($waybillId && ($order->tracking_number !== $waybillId)) {
            $updates['tracking_number'] = $waybillId;
        }

        if (in_array($newStatus, ['picking_up', 'picked', 'dropping_off', 'in_transit', 'on_hold', 'courier_assigned', 'allocated'])) {
            // Courier is in action / picked up / in transit
            $updates['status'] = 'shipped';
        } elseif ($newStatus === 'delivered') {
            // Order has been successfully delivered
            $updates['status'] = 'completed';
        } elseif (in_array($newStatus, ['cancelled', 'rejected', 'returned'])) {
            // Revert status to processing and clear tracking if shipment cancelled
            $updates['status'] = 'processing';
            if (str_starts_with((string) $order->tracking_number, 'PENDING_')) {
                $updates['tracking_number'] = null;
            }
        }

        if (!empty($updates)) {
            $order->update($updates);
            \Illuminate\Support\Facades\Log::info('Biteship Webhook: Order updated successfully', [
                'order_id'        => $order->id,
                'invoice_number'  => $order->invoice_number,
                'new_status'      => $updates['status'] ?? $order->status,
                'waybill'         => $updates['tracking_number'] ?? $order->tracking_number,
                'biteship_status' => $newStatus,
            ]);
        }

        return response()->json(['message' => 'Webhook processed successfully'], 200);
    }
}

