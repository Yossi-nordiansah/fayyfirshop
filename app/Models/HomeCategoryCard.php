<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HomeCategoryCard extends Model
{
    use HasFactory;

    protected $table = 'home_category_cards';

    protected $fillable = [
        'title',
        'title_translations',
        'image',
        'slug',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'title_translations' => 'array',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];
}
