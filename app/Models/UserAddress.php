<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserAddress extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'receiver_name',
        'phone',
        'country',
        'province',
        'city',
        'district',
        'postal_code',
        'address',
        'area_id',
        'is_default',
    ];

    protected $casts = [
        'is_default' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    protected static function booted()
    {
        static::creating(function ($address) {
            // If user has no addresses, make this one the default
            $count = static::where('user_id', $address->user_id)->count();
            if ($count === 0) {
                $address->is_default = true;
            }
        });

        static::saving(function ($address) {
            // If this is set as default, unset others for the same user
            if ($address->is_default) {
                static::where('user_id', $address->user_id)
                    ->where('id', '!=', $address->id)
                    ->update(['is_default' => false]);
            }
        });

        static::saved(function ($address) {
            if ($address->is_default) {
                $address->syncToUser();
            }
        });

        static::deleted(function ($address) {
            if ($address->is_default) {
                // Find another address to make default
                $nextDefault = static::where('user_id', $address->user_id)->first();
                if ($nextDefault) {
                    $nextDefault->update(['is_default' => true]);
                } else {
                    // No addresses left, clear user address columns
                    $address->user->update([
                        'receiver_name' => null,
                        'phone' => null,
                        'country' => 'ID',
                        'province' => null,
                        'city' => null,
                        'district' => null,
                        'postal_code' => null,
                        'address' => null,
                        'area_id' => null,
                    ]);
                }
            }
        });
    }

    public function syncToUser()
    {
        $this->user->update([
            'receiver_name' => $this->receiver_name,
            'phone' => $this->phone,
            'country' => $this->country,
            'province' => $this->province,
            'city' => $this->city,
            'district' => $this->district,
            'postal_code' => $this->postal_code,
            'address' => $this->address,
            'area_id' => $this->area_id,
        ]);
    }
}
