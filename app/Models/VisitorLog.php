<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Prunable;

class VisitorLog extends Model
{
    use Prunable;

    protected $fillable = [
        'ip_address',
        'city',
        'region',
        'country',
        'country_code',
    ];

    /**
     * Get the prunable model query.
     */
    public function prunable()
    {
        return static::where('created_at', '<=', now()->subDays(30));
    }
}
