<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
        'notes',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'shipping_cost' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'user_id' => 'integer',
        'store_branch_id' => 'integer',
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
}
