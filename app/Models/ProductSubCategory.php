<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductSubCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_category_id',
        'name',
        'name_translations',
    ];

    protected $casts = [
        'name_translations' => 'array',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'product_category_id');
    }
}
