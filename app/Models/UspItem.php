<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UspItem extends Model
{
    use HasFactory;

    protected $table = 'usp_items';

    protected $fillable = [
        'title',
        'title_translations',
        'description',
        'description_translations',
        'icon',
        'background_image',
        'color',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'title_translations' => 'array',
        'description_translations' => 'array',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];
}
