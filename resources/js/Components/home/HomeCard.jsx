import React from 'react';
import {
    ShoppingBag,
    Flame,
    ShoppingCart,
    Star
} from 'lucide-react';

/**
 * ProductCard Component
 */

const ProductCard = ({
    title,
    sold,
    image,
    status,
    rating, // optional
}) => {

    const badgeConfig = {
        new: {
            label: 'NEW',
            className:
                'bg-blue-500 text-white',
        },

        'best-seller': {
            label: 'BEST SELLER',
            className:
                'bg-blue-800 text-white',
        },
    };

    const currentBadge = badgeConfig[status];

    return (
        <div className="group relative overflow-hidden rounded-2xl bg-zinc-100 border border-white/5 shadow-lg transition-all duration-500 hover:-translate-y-2 mx-2 my-4">

            {/* Badge */}
            {currentBadge && (
                <div className="absolute top-3 right-3 z-20">
                    <span
                        className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-lg ${currentBadge.className}`}
                    >
                        {status === 'best-seller' && (
                            <Flame
                                size={10}
                                className="fill-current"
                            />
                        )}

                        {currentBadge.label}
                    </span>
                </div>
            )}

            {/* Product Image */}
            <div className="relative overflow-hidden aspect-square bg-zinc-800">
                <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
            </div>

            {/* Content */}
            <div className="px-4 p-3 space-y-2">

                {/* Title */}
                <h3 className="text-base font-semibold text-white line-clamp-1 group-hover:text-amber-500 transition-colors duration-300 font-['Amiri'] tracking-wide">
                    {title}
                </h3>

{/* Rating */}
<div className="h-[10px] flex items-center">
    {rating > 0 && (
        <div className="flex items-center gap-1">
            {[...Array(5)].map((_, index) => (
                <Star
                    key={index}
                    size={14}
                    className={`${
                        index < rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-zinc-600'
                    }`}
                />
            ))}
        </div>
    )}
</div>

                {/* Bottom Row */}
                <div className="flex items-center justify-between">

                    {/* Sold */}
                    <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
                        <ShoppingBag
                            size={14}
                            className="text-white"
                        />

                        <span className="font-medium">
                            {sold} terjual
                        </span>
                    </div>

                    {/* Small Cart Icon */}
                    <button
                        className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-zinc-300 hover:bg-amber-500 hover:text-black transition-all duration-300"
                        aria-label="Add to cart"
                    >
                        <ShoppingCart size={15} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;