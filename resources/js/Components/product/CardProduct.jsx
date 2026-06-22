import React from "react";
import { motion } from "framer-motion";
import { Link } from "@inertiajs/react";
import { useLanguage } from "@/Contexts/LanguageContext";
import { ShoppingBag, Flame, ShoppingCart, Star } from "lucide-react";
/**
 * ProductCard Component - Fayyfir Shop Premium Edition
 */
const ProductCard = ({
    id,
    product,
    slug,
    title,
    price = 0, // Prop baru untuk nominal harga (angka murni, misal: 150000)
    variants = [], // Variant products array
    sold = 0,
    image,
    status,
    is_new,
    is_best_seller,
    rating = 0,
}) => {
    const { t, locale } = useLanguage();

    // Determine lowest price if variants exist, otherwise use base price
    const displayPrice = React.useMemo(() => {
        if (variants && variants.length > 0) {
            const hasChildren = variants.some(v => v.parent_id !== null && v.parent_id !== undefined);
            const targetVariants = hasChildren
                ? variants.filter(v => v.parent_id !== null && v.parent_id !== undefined)
                : variants;

            const prices = targetVariants
                .map(v => v.price)
                .filter(p => typeof p === 'number' && p > 0);

            if (prices.length > 0) {
                return Math.min(...prices);
            }
        }
        return price;
    }, [price, variants]);
    const showNew = is_new || status === "new";
    const showBestSeller = is_best_seller || status === "best-seller";

    // Helper formatting Rupiah IDN / Internasional sesuai Locale aktif
    const formatPrice = (value) => {
        const currencySymbol = locale === "indonesia" ? "Rp" : "IDR";

        // Memformat angka menjadi ribuan (150000 -> 150.000)
        const formattedNumber = new Intl.NumberFormat(
            "id-ID",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            },
        ).format(value);

        return `${currencySymbol} ${formattedNumber}`;
    };

    const renderSoldCount = (count) => {
        const template = t("product.sold_count", "{count} terjual");
        return template.replace("{count}", count);
    };

    return (
        <Link href={`/product/${slug}`} className="block">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                className="group relative overflow-hidden rounded-2xl bg-white border border-zinc-100 shadow-sm shadow-xl transition-shadow duration-500 mx-2 mt-4 my-7"
            >
                {/* Badges */}
                {(showNew || showBestSeller) && (
                    <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-1.5">
                        {showBestSeller && (
                            <span
                                className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-md backdrop-blur-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                            >
                                <Flame
                                    size={10}
                                    className="fill-current animate-pulse text-white"
                                />
                                {t("product.badge.best_seller", "BEST SELLER")}
                            </span>
                        )}
                        {showNew && (
                            <span
                                className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-md backdrop-blur-sm bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
                            >
                                {t("product.badge.new", "NEW")}
                            </span>
                        )}
                    </div>
                )}

                {/* Product Image */}
                <div className="relative overflow-hidden aspect-square bg-white">
                    <img
                        src={Array.isArray(image) ? image[0] : image}
                        alt={title}
                        className="w-full h-full object-contain transition-transform duration-500 ease-out group-hover:scale-102"
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                {/* Content */}
                <div className="md:px-4 px-2 py-2 space-y-1.5 bg-slate-100">
                    {/* Title */}
                    <h3 className="text-sm font-semibold text-zinc-800 truncate group-hover:text-amber-600 transition-colors duration-300 tracking-wide">
                        {title}
                    </h3>

                    {/* Price Tag (Premium Component) */}
                    <div className="">
                        <span className="text-base font-bold text-zinc-900 tracking-tight font-sans">
                            {formatPrice(displayPrice)}
                        </span>
                    </div>

                    <div className="h-[14px] flex items-center">
                        {(() => {
                            const displayRating = rating > 0 ? rating : 5.0;
                            return (
                                <div
                                    className="flex items-center gap-0.5"
                                    title={`Rating: ${displayRating}`}
                                >
                                    {[...Array(5)].map((_, index) => {
                                        const starValue = index + 1;
                                        const isFull = displayRating >= starValue;
                                        const isHalf =
                                            !isFull && displayRating >= starValue - 0.5;

                                        return (
                                            <div
                                                key={index}
                                                className="relative inline-block"
                                            >
                                                <Star
                                                    size={13}
                                                    className="text-zinc-200 fill-zinc-100"
                                                />
                                                {(isFull || isHalf) && (
                                                    <div
                                                        className="absolute top-0 left-0 overflow-hidden"
                                                        style={{
                                                            width: isFull
                                                                ? "100%"
                                                                : "50%",
                                                        }}
                                                    >
                                                        <Star
                                                            size={13}
                                                            className="text-amber-400 fill-amber-400 max-w-none"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    <span className="text-[10px] font-bold text-zinc-400 ml-1 mt-0.5">
                                        {displayRating}
                                    </span>
                                </div>
                            );
                        })()}
                    </div>

                    {/* Bottom Row */}
                    <div className="flex items-center justify-between">
                        {/* Sold Count */}
                        <div className="flex items-center gap-1 text-zinc-500 text-xs">
                            <ShoppingBag size={13} className="text-zinc-400" />
                            <span className="text-zinc-600 font-medium text-[11px]">
                                {renderSoldCount(sold)}
                            </span>
                        </div>

                        {/* Premium Cart Button - Bubbles up to parent Product details Link */}
                        <motion.div
                            whileTap={{ scale: 0.95 }}
                            className="w-8 h-8 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-700 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-colors duration-300 shadow-sm cursor-pointer"
                            aria-label="Add to cart"
                        >
                            <ShoppingCart size={14} />
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
};

export default ProductCard;
