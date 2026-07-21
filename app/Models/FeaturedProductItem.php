<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FeaturedProductItem extends Model
{
    use HasFactory;

    protected $table = 'featured_products';

    protected $fillable = [
        'badge',
        'badge_translations',
        'title',
        'title_translations',
        'description',
        'description_translations',
        'background_image',
        'feature_1_icon',
        'feature_1_title',
        'feature_1_title_translations',
        'feature_1_desc',
        'feature_1_desc_translations',
        'feature_2_icon',
        'feature_2_title',
        'feature_2_title_translations',
        'feature_2_desc',
        'feature_2_desc_translations',
        'button_text',
        'button_text_translations',
        'button_url',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'badge_translations' => 'array',
        'title_translations' => 'array',
        'description_translations' => 'array',
        'feature_1_title_translations' => 'array',
        'feature_1_desc_translations' => 'array',
        'feature_2_title_translations' => 'array',
        'feature_2_desc_translations' => 'array',
        'button_text_translations' => 'array',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];
}
