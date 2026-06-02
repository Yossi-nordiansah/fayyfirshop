<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductVariant extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'type',
        'type_translations',
        'name',
        'name_translations',
        'sku',
        'price',
        'stock',
        'image',
        'unit_id',
    ];

    protected $casts = [
        'name_translations' => 'array',
        'type_translations' => 'array',
        'price' => 'integer',
        'stock' => 'integer',
        'unit_id' => 'integer',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function branchStocks(): HasMany
    {
        return $this->hasMany(ProductVariantBranchStock::class, 'product_variant_id');
    }
}
