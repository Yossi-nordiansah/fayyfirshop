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
        'discount_type',
        'discount_percentage',
    ];

    protected $casts = [
        'countries' => 'array',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'is_active' => 'boolean',
        'discount_percentage' => 'float',
    ];

    /**
     * Relationship to vouchers
     */
    public function vouchers()
    {
        return $this->belongsToMany(Voucher::class, 'event_vouchers', 'event_id', 'voucher_id')->withTimestamps();
    }

    /**
     * Get the active global all-products discount event if currently running.
     */
    public static function getActiveGlobalDiscount($visitorCountryCode = null)
    {
        if (!\Illuminate\Support\Facades\Schema::hasTable('events')) {
            return null;
        }

        $now = now();
        $event = static::where('is_active', true)
            ->where('start_date', '<=', $now)
            ->where('end_date', '>=', $now)
            ->where('discount_type', 'all_products')
            ->whereNotNull('discount_percentage')
            ->where('discount_percentage', '>', 0)
            ->orderBy('created_at', 'desc')
            ->get()
            ->first(function ($e) use ($visitorCountryCode) {
                if (empty($e->countries)) {
                    return true;
                }
                if (in_array('Internasional', $e->countries)) {
                    return true;
                }
                if ($visitorCountryCode) {
                    $countryMap = [
                        'ID' => 'Indonesia',
                        'MY' => 'Malaysia',
                        'SA' => 'Arab',
                    ];
                    $mappedName = $countryMap[$visitorCountryCode] ?? $visitorCountryCode;
                    if (in_array($mappedName, $e->countries)) {
                        return true;
                    }
                } else {
                    if (in_array('Indonesia', $e->countries)) {
                        return true;
                    }
                }
                return false;
            });

        if ($event) {
            return [
                'id' => $event->id,
                'name' => $event->name,
                'percentage' => (float)$event->discount_percentage,
                'start_date' => $event->start_date ? $event->start_date->toIso8601String() : null,
                'end_date' => $event->end_date ? $event->end_date->toIso8601String() : null,
            ];
        }

        return null;
    }
}
