import React from "react";
import { motion } from "framer-motion";
import { Link, usePage, router } from "@inertiajs/react";
import { useLanguage } from "@/Contexts/LanguageContext";
import { ShoppingBag, Flame, ShoppingCart, Star } from "lucide-react";

const resolveProductImage = (img) => {
    if (!img) return "/images/placeholder.jpg";
    if (typeof img !== 'string') return "/images/placeholder.jpg";
    if (
        img.startsWith("http://") ||
        img.startsWith("https://") ||
        img.startsWith("data:") ||
        img.startsWith("/images/") ||
        img.startsWith("images/") ||
        img.startsWith("/storage/") ||
        img.startsWith("storage/")
    ) {
        if (img.startsWith("images/")) return `/${img}`;
        if (img.startsWith("storage/")) return `/${img}`;
        return img;
    }
    return `/storage/${img}`;
};

const getUnitLabel = (unit, lang) => {
    if (!unit) return '';
    if (typeof unit === 'object') {
        return unit[lang] || unit.name_translations?.[lang] || unit.indonesia || unit.name || '';
    }
    try {
        const parsed = JSON.parse(unit);
        if (parsed && typeof parsed === 'object') {
            return parsed[lang] || parsed.indonesia || '';
        }
    } catch (e) { }
    return String(unit);
};

const formatFullVariantName = (v, lang, allVariants = []) => {
    if (!v) return '';
    let trans = v.name_translations;
    if (typeof trans === 'string') {
        try { trans = JSON.parse(trans); } catch (e) { trans = null; }
    }
    let name = trans?.[lang] || trans?.indonesia || v.name || '';

    // Check if it's actually of type "ukuran" (size)
    const isUkuranType = (typeStr, transObj) => {
        const t = String(typeStr || '').toLowerCase();
        if (t === 'ukuran' || t === 'size' || t.includes('| ukuran') || t.includes('| size')) return true;
        if (transObj) {
            let trans = transObj;
            if (typeof trans === 'string') {
                try { trans = JSON.parse(trans); } catch (e) { trans = null; }
            }
            if (trans && typeof trans === 'object') {
                const indo = String(trans.indonesia || '').toLowerCase();
                const eng = String(trans.english || '').toLowerCase();
                if (indo === 'ukuran' || indo === 'size' || indo.includes('| ukuran') || indo.includes('| size')) return true;
                if (eng === 'ukuran' || eng === 'size' || eng.includes('| ukuran') || eng.includes('| size')) return true;
            }
        }
        return false;
    };

    if (!isUkuranType(v.type, v.type_translations)) {
        return name;
    }

    const unitName = getUnitLabel(v.unit, lang);
    if (unitName && !name.toLowerCase().includes(unitName.toLowerCase())) {
        if (name.includes('(') && name.includes(')')) {
            return name.replace(')', ` ${unitName})`);
        }
        return `${name} ${unitName}`;
    }
    return name;
};

const parseCapacityJs = (variantName, parentUnit = null, activeVariant = null) => {
    if (!variantName) return 1;

    const pUnit = String(parentUnit ? (typeof parentUnit === 'object' ? (parentUnit.name || '') : parentUnit) : '').toLowerCase();

    if (['pcs', 'box', 'pack', 'piece', 'pieces', 'botol', 'butir', 'tablet'].includes(pUnit)) {
        return 1;
    }

    let textToParse = variantName;
    const parenMatches = textToParse.match(/\(([^)]+)\)/);
    if (parenMatches) {
        textToParse = parenMatches[1];
    }

    const match = textToParse.match(/(\d+(?:\.\d+)?)\s*(kilogram|kg|gram|gr|g|ml|liter|l|pcs|box|pack)?/i);
    if (!match) return 1;

    let valueStr = match[1];
    let capacityUnit = match[2] ? match[2].toLowerCase() : '';

    const isLargeUnit = ['kg', 'kilogram', 'l', 'liter'].includes(capacityUnit);
    if (!isLargeUnit && /\.\d{3}$/.test(valueStr)) {
        valueStr = valueStr.replace('.', '');
    }

    const capacityValue = parseFloat(valueStr);

    if (!capacityUnit && activeVariant && activeVariant.unit) {
        const uLabel = typeof activeVariant.unit === 'object'
            ? activeVariant.unit.name
            : activeVariant.unit;
        capacityUnit = String(uLabel || '').toLowerCase();
    }

    let parentMultiplier = 1;
    if (['kg', 'kilogram'].includes(pUnit)) {
        parentMultiplier = 1000;
    } else if (['l', 'liter'].includes(pUnit)) {
        parentMultiplier = 1000;
    }

    let capacityMultiplier = 1;
    if (['kg', 'kilogram'].includes(capacityUnit)) {
        capacityMultiplier = 1000;
    } else if (['l', 'liter'].includes(capacityUnit)) {
        capacityMultiplier = 1000;
    }

    const parentBase = parentMultiplier;
    const capacityBase = capacityValue * Math.max(1, capacityMultiplier);

    if (parentBase <= 0) return 1;

    return capacityBase / parentBase;
};

const parseWeightJs = (variant, product) => {
    if (variant) {
        if (variant.weight && parseInt(variant.weight, 10) > 0) {
            return parseInt(variant.weight, 10);
        }

        if (variant.parent_id && product && product.variants) {
            const parentVar = product.variants.find(v => v.id === variant.parent_id);
            if (parentVar && parentVar.weight && parseInt(parentVar.weight, 10) > 0) {
                return parseInt(parentVar.weight, 10);
            }
        }

        const variantsToTry = [variant];
        if (variant.parent_id && product && product.variants) {
            const parentVar = product.variants.find(v => v.id === variant.parent_id);
            if (parentVar) {
                variantsToTry.push(parentVar);
            }
        }

        for (const v of variantsToTry) {
            const textToParse = v.name || '';
            let unitName = '';
            if (v.unit) {
                unitName = typeof v.unit === 'object' ? (v.unit.name || '') : String(v.unit);
            } else if (product && product.unit) {
                unitName = typeof product.unit === 'object' ? (product.unit.name || '') : String(product.unit);
            }
            unitName = unitName.toLowerCase();

            const matches = textToParse.match(/(\d+(?:\.\d+)?)\s*(kilogram|kg|gram|gr|g|ml|l|pcs)?/i);
            if (matches) {
                let valueStr = matches[1];
                const unit = matches[2] ? matches[2].toLowerCase() : '';

                const isKgOrL = ['kg', 'kilogram', 'l'].includes(unit) || ['kg', 'kilogram', 'l'].includes(unitName);
                if (!isKgOrL && /\.\d{3}$/.test(valueStr)) {
                    valueStr = valueStr.replace('.', '');
                }

                const value = parseFloat(valueStr);

                if (unit === 'kg' || unit === 'kilogram' || unitName === 'kilogram') {
                    return Math.round(value * 1000);
                }
                if (['g', 'gr', 'gram'].includes(unit) || unitName === 'gram' || unitName === 'gr') {
                    return Math.round(value);
                }
                if (unitName === 'kg' || unitName === 'kilogram') {
                    return Math.round(value * 1000);
                }
                if (['g', 'gr', 'gram'].includes(unitName)) {
                    return Math.round(value);
                }
            }
        }
    }

    if (product && product.weight > 0) {
        return parseInt(product.weight, 10);
    }

    if (product && product.title) {
        const matches = product.title.match(/(\d+(?:\.\d+)?)\s*(kilogram|kg|gram|gr|g)?/i);
        if (matches) {
            let valueStr = matches[1];
            const unit = matches[2] ? matches[2].toLowerCase() : '';

            const isKg = ['kg', 'kilogram'].includes(unit);
            if (!isKg && /\.\d{3}$/.test(valueStr)) {
                valueStr = valueStr.replace('.', '');
            }

            const value = parseFloat(valueStr);
            if (unit === 'kg' || unit === 'kilogram') {
                return Math.round(value * 1000);
            }
            if (['g', 'gr', 'gram'].includes(unit)) {
                return Math.round(value);
            }
        }
    }

    return 1000;
};
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
    const { auth, visitorCountryCode = 'ID' } = usePage().props;

    const handleAddToCartClick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!auth?.user) {
            window.dispatchEvent(new Event("fayyfir-open-login"));
            return;
        }

        const isDbProduct = !!(variants && variants.length > 0);
        let activeVariant = null;

        if (isDbProduct) {
            const hasChildren = variants.some(v => v.parent_id !== null && v.parent_id !== undefined);
            const targetVariants = hasChildren
                ? variants.filter(v => v.parent_id !== null && v.parent_id !== undefined)
                : variants;
            activeVariant = targetVariants[0] || variants[0] || null;
        }

        const categoryName = typeof product?.category === 'object' && product?.category !== null
            ? (product.category.name_translations?.[locale] || product.category.name)
            : product?.category || 'Perfume';

        const subCategoryName = typeof product?.subCategory === 'object' && product?.subCategory !== null
            ? (product.subCategory.name_translations?.[locale] || product.subCategory.name)
            : typeof product?.sub_category === 'object' && product?.sub_category !== null
                ? (product.sub_category.name_translations?.[locale] || product.sub_category.name)
                : product?.subCategory || '';

        let variantName = null;
        let subVariantName = null;
        const variantNameTranslations = { indonesia: null, english: null, arabic: null };
        const subVariantNameTranslations = { indonesia: null, english: null, arabic: null };

        if (isDbProduct && activeVariant) {
            ['indonesia', 'english', 'arabic'].forEach((l) => {
                const fullVariantName = formatFullVariantName(activeVariant, l);
                const regex = /\(([^)]+)\)/;
                const match = fullVariantName.match(regex);
                if (match) {
                    variantNameTranslations[l] = fullVariantName.replace(/\s*\([^)]+\)/g, '').trim();
                    subVariantNameTranslations[l] = match[1].trim();
                } else {
                    variantNameTranslations[l] = fullVariantName;
                    subVariantNameTranslations[l] = null;
                }
            });
            variantName = variantNameTranslations[locale];
            subVariantName = subVariantNameTranslations[locale];
        } else {
            variantName = null;
            subVariantName = (product?.size && Array.isArray(product.size) ? product.size[0] : product?.size) || null;
            ['indonesia', 'english', 'arabic'].forEach((l) => {
                variantNameTranslations[l] = variantName;
                subVariantNameTranslations[l] = subVariantName;
            });
        }

        let productTrans = product?.name_translations;
        if (typeof productTrans === 'string') {
            try { productTrans = JSON.parse(productTrans); } catch (err) { productTrans = null; }
        }
        const titleTranslations = productTrans || {
            indonesia: title || '',
            english: title || '',
            arabic: title || ''
        };

        const resolvedTitle = titleTranslations[locale] || title || '';

        const currentPrice = activeVariant ? activeVariant.price : displayPrice;

        const getBranchStock = (item) => {
            if (!item) return 0;
            const branchStocksList = item.branch_stocks || item.branchStocks || [];
            if (branchStocksList.length === 0) {
                return item.stock || 0;
            }
            if (visitorCountryCode) {
                const match = branchStocksList.find(bs => bs.branch?.country_code === visitorCountryCode);
                if (match) return match.stock || 0;
            }
            const defaultMatch = branchStocksList.find(bs => bs.branch?.is_default);
            if (defaultMatch) return defaultMatch.stock || 0;
            return branchStocksList[0]?.stock || 0;
        };

        const currentStock = isDbProduct && activeVariant
            ? (activeVariant.parent_id
                ? (() => {
                    const parentVar = variants.find(v => v.id === activeVariant.parent_id);
                    if (parentVar && parentVar.stock_type === 'parent') {
                        const parentStock = getBranchStock(parentVar);
                        const variantName = activeVariant.name_translations?.[locale] || activeVariant.name_translations?.indonesia || activeVariant.name || '';
                        const capacity = parseCapacityJs(variantName, parentVar.unit, activeVariant);
                        return Math.floor(parentStock / capacity);
                    }
                    return getBranchStock(activeVariant);
                })()
                : getBranchStock(activeVariant))
            : (product?.stock_type === 'parent' ? getBranchStock(product) : getBranchStock(product));

        const cartItem = {
            id: id,
            slug: slug,
            title: resolvedTitle,
            title_translations: titleTranslations,
            category: categoryName,
            subCategory: subCategoryName,
            image: resolveProductImage(activeVariant?.image || (Array.isArray(image) ? image[0] : image) || product?.image || ""),
            variantId: activeVariant?.id || null,
            color: null,
            size: isDbProduct
                ? formatFullVariantName(activeVariant, locale)
                : ((product?.size && Array.isArray(product.size) ? product.size[0] : product?.size) || null),
            variantName,
            subVariantName,
            variantNameTranslations,
            subVariantNameTranslations,
            price: currentPrice,
            stock: currentStock,
            quantity: 1,
            sku: activeVariant?.sku || product?.sku || `SKU-${id}`,
            weight: parseWeightJs(activeVariant, product),
        };

        const cartKey = `fayyfir_cart_${auth.user.id}`;
        const currentCart = JSON.parse(localStorage.getItem(cartKey) || "[]");
        const existingIndex = currentCart.findIndex(
            (item) =>
                item.id === cartItem.id &&
                item.variantId === cartItem.variantId &&
                item.color === cartItem.color &&
                item.size === cartItem.size,
        );

        if (existingIndex >= 0) {
            const existingItem = currentCart[existingIndex];
            currentCart[existingIndex] = {
                ...existingItem,
                quantity: Math.min(existingItem.quantity + 1, currentStock),
                stock: currentStock,
                price: currentPrice,
                image: cartItem.image,
                variantName,
                subVariantName,
                variantNameTranslations,
                subVariantNameTranslations,
                title_translations: cartItem.title_translations,
            };
        } else {
            currentCart.push(cartItem);
        }

        localStorage.setItem(cartKey, JSON.stringify(currentCart));
        window.dispatchEvent(new Event("fayyfir-cart-updated"));

        window.dispatchEvent(
            new CustomEvent("fayyfir-show-toast", {
                detail: {
                    message: t("cart.added", "Produk ditambahkan ke keranjang"),
                    actionLabel: t("cart.view", "Lihat Cart"),
                    actionUrl: "/cart",
                },
            })
        );
    };

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
                        {rating > 0 && (
                            <div
                                className="flex items-center gap-0.5"
                                title={`Rating: ${rating}`}
                            >
                                {[...Array(5)].map((_, index) => {
                                    const starValue = index + 1;
                                    const isFull = rating >= starValue;
                                    const isHalf =
                                        !isFull && rating >= starValue - 0.5;

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
                                    {rating}
                                </span>
                            </div>
                        )}
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
                            onClick={handleAddToCartClick}
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
