<?php
 
namespace App\Models;
 
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
 
class ProductReview extends Model
{
    protected $fillable = [
        'user_id',
        'order_id',
        'product_id',
        'product_variant_id',
        'rating',
        'comment',
        'is_visible',
    ];
 
    protected $casts = [
        'is_visible' => 'boolean',
        'rating' => 'integer',
        'order_id' => 'integer',
    ];

    protected static function booted()
    {
        static::saved(function ($review) {
            self::updateProductRatingAndReviewCount($review->product_id);
        });

        static::deleted(function ($review) {
            self::updateProductRatingAndReviewCount($review->product_id);
        });
    }

    public static function updateProductRatingAndReviewCount($productId)
    {
        $product = Product::find($productId);
        if ($product) {
            $stats = self::where('product_id', $productId)
                ->where('is_visible', true)
                ->selectRaw('COALESCE(AVG(rating), 0) as average_rating, COUNT(*) as review_count')
                ->first();

            $product->update([
                'rating' => round($stats->average_rating, 1),
                'review_count' => $stats->review_count,
            ]);
        }
    }
 
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
 
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
 
    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
