<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StoreBranch extends Model
{
    use HasFactory;

    protected $table = 'store_branches';

    protected $fillable = [
        'code',
        'name',
        'country_code',
        'country_name',
        'currency_code',
        'currency_symbol',
        'timezone',
        'latitude',
        'longitude',
        'city',
        'street',
        'district',
        'province',
        'postal_code',
        'detail_address',
        'is_default',
        'is_active',
        'area_id',
        'whatsapp_number',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'is_active' => 'boolean',
        'latitude' => 'float',
        'longitude' => 'float',
    ];
}
