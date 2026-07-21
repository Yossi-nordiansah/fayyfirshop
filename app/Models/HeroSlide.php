<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HeroSlide extends Model
{
    use HasFactory;

    protected $fillable = [
        'category',
        'category_translations',
        'title',
        'title_translations',
        'subtitle',
        'subtitle_translations',
        'description',
        'description_translations',
        'product_image',
        'background_image',
        'icon',
        'theme',
        'slug',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'category_translations' => 'array',
        'title_translations' => 'array',
        'subtitle_translations' => 'array',
        'description_translations' => 'array',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];
}
