<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
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
    ];

    protected $casts = [
        'name_translations' => 'array',
        'description_translations' => 'array',
        'price' => 'integer',
        'stock' => 'integer',
        'rating' => 'decimal:1',
        'review_count' => 'integer',
        'sold' => 'integer',
        'weight' => 'integer',
        'is_new' => 'boolean',
        'is_best_seller' => 'boolean',
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
}

