<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Voucher extends Model
{
    use HasFactory;

    protected $table = 'vouchers';

    protected $fillable = [
        'code',
        'name',
        'description',
        'type',
        'value',
        'max_discount',
        'min_spending',
        'total_quota',
        'used_quota',
        'max_use_per_user',
        'start_date',
        'end_date',
        'is_active',
        'distribution_type',
    ];

    protected $casts = [
        'value' => 'float',
        'max_discount' => 'float',
        'min_spending' => 'float',
        'total_quota' => 'integer',
        'used_quota' => 'integer',
        'max_use_per_user' => 'integer',
        'start_date' => 'datetime:Y-m-d H:i:s',
        'end_date' => 'datetime:Y-m-d H:i:s',
        'is_active' => 'boolean',
    ];

    /**
     * Relationship to events
     */
    public function events()
    {
        return $this->belongsToMany(Event::class, 'event_vouchers', 'voucher_id', 'event_id')->withTimestamps();
    }
}
