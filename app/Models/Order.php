<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ProductBranchStock;
use App\Models\ProductVariantBranchStock;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_number',
        'user_id',
        'receiver_name',
        'receiver_phone',
        'store_branch_id',
        'subtotal',
        'discount_amount',
        'shipping_cost',
        'total_amount',
        'shipping_courier',
        'shipping_service',
        'tracking_number',
        'shipping_address',
        'destination_area_id',
        'status',
        'payment_status',
        'payment_token',
        'payment_method',
        'payment_details',
        'notes',
        'cancellation_status',
        'cancellation_reason',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'shipping_cost' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'user_id' => 'integer',
        'store_branch_id' => 'integer',
        'payment_details' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function storeBranch(): BelongsTo
    {
        return $this->belongsTo(StoreBranch::class, 'store_branch_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function restoreStock(): void
    {
        foreach ($this->items as $item) {
            $product = Product::find($item->product_id);
            $variant = $item->product_variant_id ? ProductVariant::find($item->product_variant_id) : null;
            $branchId = $this->store_branch_id;

            $capacity = $this->parseCapacity($variant);

            if ($product && $product->stock_type === 'parent') {
                $deduction = $capacity * $item->quantity;
                ProductBranchStock::where([
                    'product_id' => $item->product_id,
                    'store_branch_id' => $branchId
                ])->increment('stock', $deduction);
                
                $product->update(['stock' => $product->branchStocks()->sum('stock')]);
            } else if ($variant && $variant->parent_id) {
                $parentVariant = ProductVariant::find($variant->parent_id);
                if ($parentVariant && $parentVariant->stock_type === 'parent') {
                    $deduction = $capacity * $item->quantity;
                    ProductVariantBranchStock::where([
                        'product_variant_id' => $parentVariant->id,
                        'store_branch_id' => $branchId
                    ])->increment('stock', $deduction);
                    
                    $parentVariant->update(['stock' => $parentVariant->branchStocks()->sum('stock')]);
                } else {
                    ProductVariantBranchStock::where([
                        'product_variant_id' => $item->product_variant_id,
                        'store_branch_id' => $branchId
                    ])->increment('stock', $item->quantity);
                    
                    if ($variant) {
                        $variant->update(['stock' => $variant->branchStocks()->sum('stock')]);
                    }
                }
                
                if ($product) {
                    $product->update(['stock' => $product->variants()->sum('stock')]);
                }
            } else {
                if ($item->product_variant_id) {
                    ProductVariantBranchStock::where([
                        'product_variant_id' => $item->product_variant_id,
                        'store_branch_id' => $branchId
                    ])->increment('stock', $item->quantity);
                    
                    if ($variant) {
                        $variant->update(['stock' => $variant->branchStocks()->sum('stock')]);
                    }
                    if ($product) {
                        $product->update(['stock' => $product->variants()->sum('stock')]);
                    }
                } else {
                    $deduction = $item->quantity;
                    if ($product && !in_array(strtolower($product->unit), ['pcs', 'pack', 'box'])) {
                        $deduction = $item->quantity * ($product->capacity ?? 1);
                    }
                    ProductBranchStock::where([
                        'product_id' => $item->product_id,
                        'store_branch_id' => $branchId
                    ])->increment('stock', $deduction);
                    
                    if ($product) {
                        $product->update(['stock' => $product->branchStocks()->sum('stock')]);
                    }
                }
            }
        }
    }

    protected static function boot()
    {
        parent::boot();

        static::created(function ($order) {
            $reduced = ['shipped', 'completed'];
            if (in_array($order->status, $reduced)) {
                $order->reduceStock();
            }
        });

        static::updating(function ($order) {
            if ($order->isDirty('status')) {
                $oldStatus = $order->getOriginal('status');
                $newStatus = $order->status;

                $reduced = ['shipped', 'completed'];
                $wasReduced = in_array($oldStatus, $reduced);
                $isReduced = in_array($newStatus, $reduced);

                if (!$wasReduced && $isReduced) {
                    $order->reduceStock();
                } elseif ($wasReduced && !$isReduced) {
                    $order->restoreStock();
                }
            }
        });
    }

    public function reduceStock(): void
    {
        foreach ($this->items as $item) {
            $product = Product::find($item->product_id);
            $variant = $item->product_variant_id ? ProductVariant::find($item->product_variant_id) : null;
            $branchId = $this->store_branch_id;

            $capacity = $this->parseCapacity($variant);

            if ($product && $product->stock_type === 'parent') {
                $deduction = $capacity * $item->quantity;
                ProductBranchStock::where([
                    'product_id' => $item->product_id,
                    'store_branch_id' => $branchId
                ])->decrement('stock', $deduction);
                
                $product->update(['stock' => $product->branchStocks()->sum('stock')]);
            } else if ($variant && $variant->parent_id) {
                $parentVariant = ProductVariant::find($variant->parent_id);
                if ($parentVariant && $parentVariant->stock_type === 'parent') {
                    $deduction = $capacity * $item->quantity;
                    ProductVariantBranchStock::where([
                        'product_variant_id' => $parentVariant->id,
                        'store_branch_id' => $branchId
                    ])->decrement('stock', $deduction);
                    
                    $parentVariant->update(['stock' => $parentVariant->branchStocks()->sum('stock')]);
                } else {
                    ProductVariantBranchStock::where([
                        'product_variant_id' => $item->product_variant_id,
                        'store_branch_id' => $branchId
                    ])->decrement('stock', $item->quantity);
                    
                    if ($variant) {
                        $variant->update(['stock' => $variant->branchStocks()->sum('stock')]);
                    }
                }
                
                if ($product) {
                    $product->update(['stock' => $product->variants()->sum('stock')]);
                }
            } else {
                if ($item->product_variant_id) {
                    ProductVariantBranchStock::where([
                        'product_variant_id' => $item->product_variant_id,
                        'store_branch_id' => $branchId
                    ])->decrement('stock', $item->quantity);
                    
                    if ($variant) {
                        $variant->update(['stock' => $variant->branchStocks()->sum('stock')]);
                    }
                    if ($product) {
                        $product->update(['stock' => $product->variants()->sum('stock')]);
                    }
                } else {
                    $deduction = $item->quantity;
                    if ($product && !in_array(strtolower($product->unit), ['pcs', 'pack', 'box'])) {
                        $deduction = $item->quantity * ($product->capacity ?? 1);
                    }
                    ProductBranchStock::where([
                        'product_id' => $item->product_id,
                        'store_branch_id' => $branchId
                    ])->decrement('stock', $deduction);
                    
                    if ($product) {
                        $product->update(['stock' => $product->branchStocks()->sum('stock')]);
                    }
                }
            }
        }
    }

    /**
     * Parse the capacity from a variant name.
     */
    private function parseCapacity(?ProductVariant $variant): float
    {
        if (!$variant) {
            return 1.0;
        }

        $textToParse = $variant->name;

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

        return 1.0;
    }

    /**
     * Check if the unpaid order has exceeded its payment expiry time.
     */
    public function isExpired(): bool
    {
        if ($this->payment_status === 'paid' || $this->status === 'cancelled' || $this->payment_status === 'expired') {
            return false;
        }

        if ($this->status !== 'pending' || $this->payment_status !== 'unpaid') {
            return false;
        }

        $expiryTime = $this->payment_details['expiry_time'] ?? null;
        if ($expiryTime) {
            try {
                return now()->gt(\Carbon\Carbon::parse($expiryTime));
            } catch (\Throwable $e) {
                // If parse fails, fallback to created_at + 24 hours
            }
        }

        return $this->created_at ? now()->gt($this->created_at->copy()->addDay()) : false;
    }

    /**
     * Cancel the order and mark payment as expired.
     */
    public function markAsExpired(): bool
    {
        if ($this->payment_status === 'paid' || $this->status === 'cancelled' || $this->payment_status === 'expired') {
            return false;
        }

        try {
            if (is_array($this->payment_details)) {
                if (isset($this->payment_details['xendit_invoice_id']) && config('services.xendit.secret_key')) {
                    try {
                        \Xendit\Configuration::setXenditKey(config('services.xendit.secret_key'));
                        $apiInstance = new \Xendit\Invoice\InvoiceApi();
                        $apiInstance->expireInvoice($this->payment_details['xendit_invoice_id']);
                    } catch (\Throwable $e) {}
                }
                if (isset($this->payment_details['midtrans_order_id']) && config('services.midtrans.server_key')) {
                    try {
                        \Midtrans\Config::$serverKey = config('services.midtrans.server_key');
                        \Midtrans\Config::$isProduction = (bool) config('services.midtrans.is_production');
                        \Midtrans\Transaction::cancel($this->payment_details['midtrans_order_id']);
                    } catch (\Throwable $e) {}
                }
            }

            $this->update([
                'status' => 'cancelled',
                'payment_status' => 'expired',
                'cancellation_reason' => 'Batas waktu pembayaran telah habis.'
            ]);

            return true;
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("Failed to mark order #{$this->id} as expired: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Check and cancel all expired orders.
     */
    public static function cancelExpiredOrders(?int $userId = null): int
    {
        $query = static::where('status', 'pending')
            ->where('payment_status', 'unpaid');

        if ($userId) {
            $query->where('user_id', $userId);
        }

        $orders = $query->get();
        $cancelledCount = 0;

        foreach ($orders as $order) {
            if ($order->isExpired()) {
                if ($order->markAsExpired()) {
                    $cancelledCount++;
                }
            }
        }

        return $cancelledCount;
    }
}

