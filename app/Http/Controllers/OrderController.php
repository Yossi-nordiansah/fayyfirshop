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
        $order = Order::with(['user', 'storeBranch', 'items.product', 'items.variant'])->findOrFail($id);

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

            $biteshipItems[] = [
                'name' => $product->title ?: ($product->name_translations['indonesia'] ?? 'Product'),
                'description' => $variant ? ($variant->name_translations['indonesia'] ?? $variant->name) : 'Standard Product',
                'value' => (int) $item->price,
                'weight' => (int) $weight,
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

        preg_match('/(\d+(?:\.\d+)?)\s*(kg|g|gr|gram|kilogram|ml|l|pcs)?/i', $textToParse, $matches);

        if (!empty($matches)) {
            $value = (float) $matches[1];
            $unit = isset($matches[2]) ? strtolower($matches[2]) : '';

            if ($unit === 'kg' || $unit === 'kilogram' || $unitName === 'kilogram') {
                return (int) ($value * 1000);
            }

            if (in_array($unit, ['g', 'gr', 'gram', 'ml']) || $unitName === 'gram') {
                return (int) $value;
            }

            return (int) $value;
        }

        return 1000;
    }
}
