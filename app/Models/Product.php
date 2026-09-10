<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'sku',
        'description',
        'price',
        'discount_price',
        'stock',
        'status',
        'is_new',
        'is_best_seller',
        'rating',
        'review_count',
        'sold',
        'weight',
        'product_category_id',
        'product_sub_category_id',
        'name_translations',
        'description_translations',
        'stock_type',
        'unit',
        'capacity',
        'is_active',
    ];

    protected $casts = [
        'name_translations' => 'array',
        'description_translations' => 'array',
        'price' => 'integer',
        'discount_price' => 'integer',
        'stock' => 'integer',
        'rating' => 'decimal:1',
        'review_count' => 'integer',
        'sold' => 'integer',
        'weight' => 'integer',
        'capacity' => 'integer',
        'is_new' => 'boolean',
        'is_best_seller' => 'boolean',
        'is_active' => 'boolean',
    ];

    protected $appends = [
        'status',
    ];

    protected static function booted(): void
    {
        static::creating(function (Product $product) {
            if (empty($product->slug)) {
                $product->slug = static::generateUniqueSlug($product->title ?: ($product->name_translations['indonesia'] ?? 'product'));
            }
        });

        static::updating(function (Product $product) {
            if ($product->isDirty('title')) {
                $product->slug = static::generateUniqueSlug($product->title, $product->id);
            }
        });
    }

    /**
     * Compatibility accessor for Name (since migration defines 'title')
     */
    public function getNameAttribute()
    {
        return $this->title ?: ($this->name_translations['indonesia'] ?? '');
    }

    /**
     * Compatibility accessor for Status
     */
    public function getStatusAttribute()
    {
        if ($this->is_best_seller) {
            return 'best-seller';
        }
        if ($this->is_new) {
            return 'new';
        }
        return 'normal';
    }

    /**
     * Compatibility mutator for Name
     */
    public function setNameAttribute($value)
    {
        $this->attributes['title'] = $value;
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'product_category_id');
    }

    public function subCategory(): BelongsTo
    {
        return $this->belongsTo(ProductSubCategory::class, 'product_sub_category_id');
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function branchStocks(): HasMany
    {
        return $this->hasMany(ProductBranchStock::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(ProductReview::class);
    }

    protected static function generateUniqueSlug(string $title, ?int $ignoreId = null): string
    {
        $baseSlug = Str::slug($title);
        $slug = $baseSlug ?: 'product';
        $counter = 1;

        while (
            static::query()
                ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
                ->where('slug', $slug)
                ->exists()
        ) {
            $slug = $baseSlug.'-'.$counter;
            $counter++;
        }

        return $slug;
    }

    /**
     * Recalculate and persist the 'sold' count for specified products or all products.
     *
     * Criteria for counting as sold:
     * - Order is NOT cancelled
     * - Order is either paid (payment_status = 'paid') OR in a fulfilled/in-progress status (processing, shipped, completed)
     */
    public static function recalculateSold(int|array|null $productIds = null): void
    {
        $query = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.status', '!=', 'cancelled')
            ->where(function ($q) {
                $q->where('orders.payment_status', 'paid')
                  ->orWhereIn('orders.status', ['processing', 'shipped', 'completed']);
            });

        if ($productIds !== null) {
            $ids = is_array($productIds) ? $productIds : [$productIds];
            $ids = array_values(array_filter(array_unique($ids)));
            if (empty($ids)) {
                return;
            }
            $query->whereIn('order_items.product_id', $ids);
        }

        $soldMap = $query->groupBy('order_items.product_id')
            ->select('order_items.product_id', DB::raw('SUM(order_items.quantity) as total_sold'))
            ->pluck('total_sold', 'product_id');

        if ($productIds !== null) {
            $ids = is_array($productIds) ? $productIds : [$productIds];
            foreach ($ids as $id) {
                $total = (int) ($soldMap[$id] ?? 0);
                static::where('id', $id)->update(['sold' => $total]);
            }
        } else {
            static::query()->update(['sold' => 0]);
            foreach ($soldMap as $productId => $total) {
                static::where('id', $productId)->update(['sold' => (int) $total]);
            }
        }
    }
}

