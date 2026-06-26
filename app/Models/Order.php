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
        'store_branch_id',
        'subtotal',
        'discount_amount',
        'shipping_cost',
        'total_amount',
        'shipping_courier',
        'shipping_service',
        'tracking_number',
        'shipping_address',
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

            $capacity = 1;
            if ($variant) {
                preg_match('/(\d+(?:\.\d+)?)/', $variant->name, $matches);
                if (!empty($matches)) {
                    $capacity = (float) $matches[1];
                }
            }

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

            $capacity = 1;
            if ($variant) {
                preg_match('/(\d+(?:\.\d+)?)/', $variant->name, $matches);
                if (!empty($matches)) {
                    $capacity = (float) $matches[1];
                }
            }

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
}

