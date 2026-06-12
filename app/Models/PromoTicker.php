<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PromoTicker extends Model
{
    use HasFactory;

    protected $table = 'promo_tickers';

    protected $fillable = [
        'key',
        'text',
        'text_translations',
        'icon',
        'link',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'text_translations' => 'array',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];
}
