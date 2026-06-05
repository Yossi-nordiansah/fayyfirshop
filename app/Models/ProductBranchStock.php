<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductBranchStock extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'store_branch_id',
        'stock',
        'reserved_stock',
        'low_stock_threshold',
        'is_available',
    ];

    protected $casts = [
        'store_branch_id' => 'integer',
        'stock' => 'integer',
        'reserved_stock' => 'integer',
        'low_stock_threshold' => 'integer',
        'is_available' => 'boolean',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(StoreBranch::class, 'store_branch_id');
    }
}
