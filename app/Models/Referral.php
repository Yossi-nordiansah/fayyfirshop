<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Referral extends Model
{
    use HasFactory;

    protected $table = 'referrals';

    protected $fillable = [
        'name',
        'code',
        'type',
        'value',
        'countries',
        'commission_percentage',
        'min_spending',
        'total_quota',
        'used_quota',
        'start_date',
        'end_date',
        'is_active',
    ];

    protected $casts = [
        'value' => 'float',
        'countries' => 'array',
        'commission_percentage' => 'float',
        'min_spending' => 'float',
        'total_quota' => 'integer',
        'used_quota' => 'integer',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'is_active' => 'boolean',
    ];
}
