<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    use HasFactory;

    protected $table = 'events';

    protected $fillable = [
        'name',
        'start_date',
        'end_date',
        'countries',
        'image_path',
        'is_active',
    ];

    protected $casts = [
        'countries' => 'array',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'is_active' => 'boolean',
    ];

    /**
     * Relationship to vouchers
     */
    public function vouchers()
    {
        return $this->belongsToMany(Voucher::class, 'event_vouchers', 'event_id', 'voucher_id')->withTimestamps();
    }
}
