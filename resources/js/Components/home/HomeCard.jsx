import React from 'react';
import { ShoppingBag } from 'lucide-react';

/**
 * ProductCard Component
 * Displays individual product information in a compact, premium card.
 * Aspect ratio is square for better vertical space management.
 */
const ProductCard = ({
    title,
    sold,
    image,
    isNew = false,
}) => {
    return (
        <div className="group relative overflow-hidden rounded-2xl bg-zinc-900 border border-white/5 shadow-lg transition-all duration-500 hover:-translate-y-2 mx-2">
            
            {/* NEW Badge */}
            {isNew && (
                <div className="absolute top-3 right-3 z-20">
                    <span className="bg-amber-500 text-black text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shadow-lg">
                        New
                    </span>
                </div>
            )}

            {/* Product Image - Square aspect ratio for a more compact look */}
            <div className="relative overflow-hidden aspect-square bg-zinc-800">
                <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                />
                
                {/* Subtle bottom gradient for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
            </div>

            {/* Content Area */}
            <div className="p-4 space-y-1">
                <h3 className="text-base font-semibold text-white line-clamp-1 group-hover:text-amber-500 transition-colors duration-300 font-['Amiri'] tracking-wide">
                    {title}
                </h3>
                
                <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
                    <ShoppingBag size={14} className="text-amber-500/70" />
                    <span className="font-medium">{sold} terjual</span>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;