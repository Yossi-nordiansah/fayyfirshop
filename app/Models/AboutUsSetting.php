<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AboutUsSetting extends Model
{
    use HasFactory;

    protected $table = 'about_us_settings';

    protected $fillable = [
        'key',
        'value',
        'value_translations',
    ];

    protected $casts = [
        'value_translations' => 'array',
    ];
}
