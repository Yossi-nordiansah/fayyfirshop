import React, { useState, useEffect } from "react";
import { Head, Link } from "@inertiajs/react";
import {
    Star,
    ShoppingCart,
    ChevronRight,
    Check,
    Package,
    Flame,
    BadgeCheck,
    Minus,
    Plus,
    Tag,
    ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "@/Layouts/MainLayout";
import Navbar from "@/Components/Navbar";
import Footer from "@/Components/Footer";
import products from "../../data-source/data_products_30.json";
import { useLanguage } from "@/Contexts/LanguageContext"; // 1. Import LanguageContext Proyek

export default function DetailProduct({ product: initialProduct, slug }) {
    const { t, locale } = useLanguage(); // 2. Inisialisasi fungsi translasi t dan locale proyek

    const product =
        initialProduct ||
        (slug ? products.find((p) => p.slug === slug) : null) ||
        products[0];

    // Tentukan apakah produk ini berasal dari database Eloquent
    const isDbProduct = React.useMemo(() => {
        return (
            product.variants &&
            product.variants.length > 0 &&
            product.variants.some((v) => v.type || v.name_translations || v.unit_id || v.unit)
        );
    }, [product]);

    // Resolusi nama & deskripsi multi-bahasa dengan fallback yang aman
    const displayName = React.useMemo(() => {
        if (product.name_translations && typeof product.name_translations === 'object') {
            return product.name_translations[locale] || product.name_translations['indonesia'] || product.title || product.name;
        }
        return product.title || product.name;
    }, [product, locale]);

    const displayDescription = React.useMemo(() => {
        if (product.description_translations && typeof product.description_translations === 'object') {
            return product.description_translations[locale] || product.description_translations['indonesia'] || product.description;
        }
        return product.description;
    }, [product, locale]);

    const uniqueColors = React.useMemo(() => {
        if (isDbProduct) return [];
        return Array.from(
            new Set(product.variants?.map((v) => v.color).filter(Boolean)),
        );
    }, [product.variants, isDbProduct]);

    const uniqueSizes = React.useMemo(() => {
        if (isDbProduct) return [];
        return Array.from(
            new Set(product.variants?.map((v) => v.size).filter(Boolean)),
        );
    }, [product.variants, isDbProduct]);

    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedSize, setSelectedSize] = useState(null);
    const [selectedVariantId, setSelectedVariantId] = useState(null);

    // Resolusi combined gallery: gambar produk (Eloquent / static JSON) + gambar varian
    const productImages = React.useMemo(() => {
        if (product.images && product.images.length > 0) {
            return product.images.map((img) => img.image_path).filter(Boolean);
        }
        if (Array.isArray(product.image)) {
            return product.image;
        }
        if (product.image) {
            return [product.image];
        }
        if (product.image_path) {
            return [product.image_path];
        }
        return [];
    }, [product]);

    const variantImages = React.useMemo(() => {
        return product.variants?.map((v) => v.image).filter(Boolean) || [];
    }, [product.variants]);

    const allImages = React.useMemo(() => {
        const imgs = Array.from(new Set([...productImages, ...variantImages]));
        return imgs.length > 0 ? imgs : ["/images/placeholder.jpg"];
    }, [productImages, variantImages]);

    const variantImagesMap = React.useMemo(() => {
        const map = {}; // color -> image url
        if (!isDbProduct) {
            product.variants?.forEach((v) => {
                if (v.color && v.image && !map[v.color]) {
                    map[v.color] = v.image;
                }
            });
        }
        return map;
    }, [product.variants, isDbProduct]);

    const [activeImage, setActiveImage] = useState(allImages[0] || null);
    const [quantity, setQuantity] = useState(1);

    // Sinkronisasi state ketika produk / locale / image pool berubah
    useEffect(() => {
        if (isDbProduct) {
            setSelectedColor(null);
            setSelectedSize(null);
            if (product.variants && product.variants.length > 0) {
                setSelectedVariantId(product.variants[0].id);
                if (product.variants[0].image) {
                    setActiveImage(product.variants[0].image);
                } else {
                    setActiveImage(allImages[0] || null);
                }
            } else {
                setSelectedVariantId(null);
                setActiveImage(allImages[0] || null);
            }
        } else {
            setSelectedVariantId(null);
            const nextColors = Array.from(
                new Set(product.variants?.map((v) => v.color).filter(Boolean)),
            );
            const nextSizes = Array.from(
                new Set(product.variants?.map((v) => v.size).filter(Boolean)),
            );
            setSelectedColor(nextColors[0] || null);
            setSelectedSize(nextSizes[0] || null);
            setActiveImage(allImages[0] || null);
        }
        setQuantity(1);
    }, [product, isDbProduct, allImages]);

    // Ketika warna dirubah, ganti gambar aktif ke gambar varian jika tersedia
    const handleColorSelect = (color) => {
        setSelectedColor(color);
        if (variantImagesMap[color]) {
            setActiveImage(variantImagesMap[color]);
        }
    };

    const activeVariant = React.useMemo(() => {
        if (!product.variants || product.variants.length === 0) return null;
        if (isDbProduct) {
            return product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];
        } else {
            return (
                product.variants.find(
                    (v) =>
                        (selectedColor ? v.color === selectedColor : true) &&
                        (selectedSize ? v.size === selectedSize : true),
                ) || product.variants[0]
            );
        }
    }, [product.variants, isDbProduct, selectedVariantId, selectedColor, selectedSize]);

    const currentPrice = React.useMemo(() => {
        if (activeVariant) {
            return activeVariant.price;
        }
        return product.variants?.[0]?.price || product.price || 0;
    }, [activeVariant, product.variants, product.price]);

    const currentStock = React.useMemo(() => {
        if (activeVariant) {
            return activeVariant.stock;
        }
        return product.stock || 0;
    }, [activeVariant, product.stock]);

    const handleQuantityChange = (type) => {
        if (type === "minus" && quantity > 1) setQuantity(quantity - 1);
        else if (type === "plus" && quantity < currentStock)
            setQuantity(quantity + 1);
    };

    const formatPrice = (val) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(val);

    const renderStars = (rating) => {
        const parsedRating = parseFloat(rating) || 5.0;
        return [...Array(5)].map((_, i) => {
            const full = parsedRating >= i + 1;
            const half = !full && parsedRating >= i + 0.5;
            return (
                <div key={i} className="relative inline-block">
                    <Star size={14} className="text-zinc-200 fill-zinc-100" />
                    {(full || half) && (
                        <div
                            className="absolute inset-0 overflow-hidden"
                            style={{ width: full ? "100%" : "50%" }}
                        >
                            <Star
                                size={14}
                                className="text-amber-400 fill-amber-400"
                            />
                        </div>
                    )}
                </div>
            );
        });
    };

    const isOutOfStock = currentStock === 0;
    const canBuy = !isOutOfStock && currentPrice > 0;
    const [cartNotice, setCartNotice] = useState("");

    const handleAddToCart = () => {
        if (!canBuy) return;

        const cartKey = "fayyfir_cart";

        // Resolusi nama kategori & subkategori yang kompatibel
        const categoryName = typeof product.category === 'object' && product.category !== null
            ? product.category.name
            : product.category || 'Perfume';

        const subCategoryName = typeof product.subCategory === 'object' && product.subCategory !== null
            ? product.subCategory.name
            : typeof product.sub_category === 'object' && product.sub_category !== null
                ? product.sub_category.name
                : product.subCategory || '';

        const cartItem = {
            id: product.id,
            slug: product.slug,
            title: displayName,
            category: categoryName,
            subCategory: subCategoryName,
            image: activeImage || allImages[0] || "",
            variantId: activeVariant?.id || null,
            color: isDbProduct ? null : selectedColor,
            size: isDbProduct
                ? (activeVariant?.name_translations?.[locale] || activeVariant?.name)
                : (selectedSize || (product.size && Array.isArray(product.size) ? product.size[0] : product.size) || null),
            price: currentPrice,
            stock: currentStock,
            quantity,
            sku: activeVariant?.sku || product.sku || `SKU-${product.id}`,
        };

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
                quantity: Math.min(existingItem.quantity + quantity, currentStock),
                stock: currentStock,
                price: currentPrice,
                image: cartItem.image,
            };
        } else {
            currentCart.push(cartItem);
        }

        localStorage.setItem(cartKey, JSON.stringify(currentCart));
        window.dispatchEvent(new Event("fayyfir-cart-updated"));
        setCartNotice(t("cart.added", "Produk ditambahkan ke keranjang"));
        setTimeout(() => setCartNotice(""), 2200);
    };

    // Helper resolusi teks kategori & subkategori reaktif
    const categoryName = React.useMemo(() => {
        return typeof product.category === 'object' && product.category !== null
            ? product.category.name
            : product.category || 'Perfume';
    }, [product.category]);

    const categorySlug = React.useMemo(() => {
        return typeof product.category === 'object' && product.category !== null
            ? product.category.slug || product.category.name.toLowerCase().replace(/\s+/g, "-")
            : (product.category || 'perfume').toLowerCase().replace(/\s+/g, "-");
    }, [product.category]);

    const subCategoryName = React.useMemo(() => {
        return typeof product.subCategory === 'object' && product.subCategory !== null
            ? product.subCategory.name
            : typeof product.sub_category === 'object' && product.sub_category !== null
                ? product.sub_category.name
                : product.subCategory || '';
    }, [product.subCategory, product.sub_category]);

    // Dapatkan tipe varian (Ukuran, Rasa, Warna, dll.)
    const variantType = React.useMemo(() => {
        if (!product.variants || product.variants.length === 0) return 'Varian';
        const type = product.variants[0].type || 'Varian';
        return type.charAt(0).toUpperCase() + type.slice(1);
    }, [product.variants]);

    return (
        <MainLayout>
            <Head title={`${displayName} - Fayyfir Shop`} />
            <Navbar alwaysSolid={true} />

            <div className="min-h-screen pt-24 pb-20 font-sans bg-white">
                {/* Breadcrumbs */}
                <div className="border-b bg-zinc-50 border-zinc-100">
                    <div className="px-4 py-3 mx-auto max-w-7xl sm:px-6 lg:px-8">
                        <nav className="flex text-xs text-zinc-400 items-center gap-1.5">
                            <Link
                                href="/"
                                className="flex items-center gap-1 font-medium transition-colors hover:text-blue-600"
                            >
                                <ArrowLeft size={12} />
                                {t("product.detail.home", "Home")}
                            </Link>
                            <ChevronRight size={12} className="text-zinc-300" />
                            <Link
                                href={`/products/${categorySlug}`}
                                className="font-medium transition-colors hover:text-blue-600"
                            >
                                {categoryName}
                            </Link>
                            <ChevronRight size={12} className="text-zinc-300" />
                            <span className="text-zinc-600 truncate max-w-[180px] font-medium">
                                {displayName}
                            </span>
                        </nav>
                    </div>
                </div>

                {/* Main Content */}
                <div className="px-4 pt-10 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 xl:gap-16">
                        {/* ─── Left: Image Gallery ─── */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                                duration: 0.6,
                                ease: [0.25, 1, 0.5, 1],
                            }}
                            className="flex flex-col gap-4"
                        >
                            {/* Main Image */}
                            <div className="relative overflow-hidden border shadow-xl rounded-3xl bg-zinc-50 border-zinc-100 aspect-square">
                                <AnimatePresence mode="wait">
                                    <motion.img
                                        key={activeImage}
                                        src={activeImage}
                                        alt={displayName}
                                        className="object-cover w-full h-full"
                                        initial={{ opacity: 0, scale: 1.04 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.97 }}
                                        transition={{ duration: 0.35 }}
                                    />
                                </AnimatePresence>

                                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/10 via-transparent to-transparent" />

                                {/* Status Badge */}
                                <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
                                     {(product.is_best_seller || product.status === "best-seller") && (
                                         <span className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg shadow-amber-400/40">
                                             <Flame
                                                 size={11}
                                                 className="fill-current animate-pulse"
                                             />
                                             {t("product.detail.best_seller", "Best Seller")}
                                         </span>
                                     )}
                                     {(product.is_new || product.status === "new") && (
                                         <span className="flex items-center gap-1 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[11px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg shadow-blue-400/40">
                                             {t("product.detail.new_arrival", "New Arrival")}
                                         </span>
                                     )}
                                 </div>

                                {/* Image counter */}
                                {allImages.length > 1 && (
                                    <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
                                        {allImages.indexOf(activeImage) + 1} / {allImages.length}
                                    </div>
                                )}
                            </div>

                            {/* Thumbnails */}
                            {allImages.length > 1 && (
                                <div className="flex gap-3 py-1 overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-200 scrollbar-track-transparent">
                                    {allImages.map((img, idx) => {
                                        const isActive = activeImage === img;
                                        const variantColor = !isDbProduct && Object.keys(variantImagesMap).find(
                                            (c) => variantImagesMap[c] === img,
                                        );
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => setActiveImage(img)}
                                                className={`relative flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all duration-300 ${isActive
                                                    ? "border-blue-500 shadow-lg shadow-blue-200 scale-[1.03]"
                                                    : "border-zinc-200 hover:border-blue-300"
                                                    }`}
                                            >
                                                <img
                                                    src={img}
                                                    alt={variantColor ? `Varian ${variantColor}` : `Foto ${idx + 1}`}
                                                    className="object-cover w-full h-full"
                                                />
                                                {!isActive && (
                                                    <div className="absolute inset-0 transition-colors bg-white/40 hover:bg-white/10" />
                                                )}
                                                {variantColor && (
                                                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] font-bold text-center py-0.5 truncate px-1">
                                                        {variantColor}
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </motion.div>

                        {/* ─── Right: Product Details ─── */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                                duration: 0.6,
                                ease: [0.25, 1, 0.5, 1],
                                delay: 0.1,
                            }}
                            className="flex flex-col gap-4"
                        >
                            {/* Category + stock pills */}
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-700 border border-blue-200 bg-blue-50 px-3 py-1 rounded-full">
                                    {subCategoryName || categoryName}
                                </span>
                                {!isOutOfStock && (
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700 border border-emerald-200 bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-1">
                                        <BadgeCheck size={10} /> {t("product.detail.stock_available", "Stok Tersedia")}
                                    </span>
                                )}
                            </div>

                            {/* Title */}
                            <div>
                                <h1 className="text-3xl lg:text-4xl font-['Cinzel'] font-bold text-zinc-900 leading-tight tracking-wide mb-3">
                                    {displayName}
                                </h1>

                                {/* Rating row */}
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-0.5">
                                        {renderStars(product.rating)}
                                    </div>
                                    <span className="text-sm font-bold text-amber-500">
                                        {product.rating}
                                    </span>
                                    <span className="text-xs text-zinc-300">|</span>
                                    <span className="text-sm text-zinc-500">
                                        {product.reviewCount || product.sold || 0}{" "}
                                        {t("product.detail.reviews", "ulasan")}
                                    </span>
                                    <span className="text-xs text-zinc-300">|</span>
                                    <span className="flex items-center gap-1 text-sm text-zinc-500">
                                        <Package size={12} className="text-zinc-400" />
                                        {product.sold || 0} {t("product.detail.sold", "terjual")}
                                    </span>
                                </div>
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent" />

                            {/* Price block */}
                            <div className="px-5 py-2 border border-blue-100 bg-gradient-to-br from-blue-50 to-blue-100/60 rounded-2xl">
                                <p className="text-xs font-bold tracking-widest text-blue-500 uppercase">
                                    {t("product.detail.price_label", "Harga")}
                                </p>
                                <div className="flex items-end gap-3">
                                    <span className="text-2xl font-extrabold tracking-tight text-blue-900">
                                        {formatPrice(currentPrice)}
                                    </span>
                                </div>
                                {((!isDbProduct && uniqueSizes.length > 0) || (isDbProduct && product.variants && product.variants.length > 1)) && (
                                    <p className="text-xs text-zinc-400 mt-1.5">
                                        {t("product.detail.price_notice", "Harga dapat berubah sesuai varian yang dipilih")}
                                    </p>
                                )}
                            </div>

                            {/* Database Variant Selection */}
                            {isDbProduct && product.variants && product.variants.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-bold tracking-widest uppercase text-zinc-500">
                                            {t(`product.detail.select_${variantType.toLowerCase()}`, `Pilih ${variantType}`)}
                                        </h3>
                                        {activeVariant && (
                                            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                                                {activeVariant.name_translations?.[locale] || activeVariant.name}
                                                {activeVariant.unit && ` (${activeVariant.unit.name || activeVariant.unit})`}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2.5">
                                        {product.variants.map((variant) => {
                                            const isSelected = selectedVariantId === variant.id;
                                            const variantName = variant.name_translations?.[locale] || variant.name;
                                            const isVariantOutOfStock = variant.stock === 0;

                                            return (
                                                <button
                                                    key={variant.id}
                                                    onClick={() => {
                                                        setSelectedVariantId(variant.id);
                                                        if (variant.image) {
                                                            setActiveImage(variant.image);
                                                        }
                                                    }}
                                                    disabled={isVariantOutOfStock}
                                                    className={`flex items-center gap-2.5 pl-1.5 pr-4 py-2 rounded-2xl border text-sm font-semibold transition-all duration-300 ${
                                                        isSelected
                                                            ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-200 scale-[1.03]"
                                                            : "bg-white border-zinc-200 text-zinc-600 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50"
                                                    } ${isVariantOutOfStock ? "opacity-40 cursor-not-allowed" : ""}`}
                                                >
                                                    {variant.image ? (
                                                        <span className={`w-8 h-8 rounded-lg overflow-hidden border flex-shrink-0 ${
                                                            isSelected ? "border-white/40" : "border-zinc-200"
                                                        }`}>
                                                            <img
                                                                src={variant.image}
                                                                alt={variantName}
                                                                className="object-cover w-full h-full"
                                                            />
                                                        </span>
                                                    ) : (
                                                        isSelected && <Check size={12} className="ml-1" />
                                                    )}
                                                    <div className="text-left">
                                                        <span className="block leading-tight">{variantName}</span>
                                                        {variant.price && variant.price !== product.price ? (
                                                            <span className={`text-[10px] block ${
                                                                isSelected ? "text-blue-100" : "text-slate-400"
                                                            }`}>
                                                                {formatPrice(variant.price)}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Color / Variant Selection (Static JSON) */}
                            {!isDbProduct && uniqueColors.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-xs font-bold tracking-widest uppercase text-zinc-500">
                                            {t("product.detail.variant_label", "Warna / Varian")}
                                        </h3>
                                        {selectedColor && (
                                            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                                                {selectedColor}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2.5">
                                        {uniqueColors.map((color) => {
                                            const variantImg = variantImagesMap[color];
                                            const isSelected = selectedColor === color;
                                            return (
                                                <button
                                                    key={color}
                                                    onClick={() => handleColorSelect(color)}
                                                    className={`flex items-center gap-2 pl-1 pr-4 py-1.5 rounded-xl border text-sm font-semibold transition-all duration-300 ${isSelected
                                                        ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-200 scale-[1.03]"
                                                        : "bg-white border-zinc-200 text-zinc-600 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50"
                                                        }`}
                                                >
                                                    {variantImg ? (
                                                        <span className={`w-7 h-7 rounded-lg overflow-hidden border-2 flex-shrink-0 ${isSelected ? "border-white/40" : "border-zinc-200"}`}>
                                                            <img
                                                                src={variantImg}
                                                                alt={color}
                                                                className="object-cover w-full h-full"
                                                            />
                                                        </span>
                                                    ) : (
                                                        isSelected && <Check size={12} className="ml-1" />
                                                    )}
                                                    {color}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Sizes Selection (Static JSON) */}
                            {!isDbProduct && uniqueSizes.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                                            <Tag size={12} /> {t("product.detail.size_label", "Ukuran")}
                                        </h3>
                                        {selectedSize && (
                                            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                                                {selectedSize}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2.5">
                                        {uniqueSizes.map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => setSelectedSize(size)}
                                                className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-300 ${selectedSize === size
                                                    ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-200 scale-[1.03]"
                                                    : "bg-white border-zinc-200 text-zinc-600 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50"
                                                    }`}
                                            >
                                                {selectedSize === size && (
                                                    <Check size={12} className="inline mr-1.5" />
                                                )}
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Qty + Stock */}
                            <div className="flex items-center gap-5">
                                <div className="flex items-center overflow-hidden bg-white border shadow-sm rounded-xl border-zinc-200">
                                    <button
                                        onClick={() => handleQuantityChange("minus")}
                                        disabled={quantity <= 1 || !canBuy}
                                        className="flex items-center justify-center transition-colors w-11 h-11 text-zinc-500 hover:text-blue-700 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <div className="flex items-center justify-center w-12 text-base font-bold h-11 text-zinc-800 border-x border-zinc-200">
                                        {quantity}
                                    </div>
                                    <button
                                        onClick={() => handleQuantityChange("plus")}
                                        disabled={quantity >= currentStock || !canBuy}
                                        className="flex items-center justify-center transition-colors w-11 h-11 text-zinc-500 hover:text-blue-700 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>

                                <div>
                                    {isOutOfStock ? (
                                        <span className="text-red-500 text-sm font-semibold flex items-center gap-1.5">
                                            <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                            {t("product.detail.stock_out", "Stok habis")}
                                        </span>
                                    ) : (
                                        <span className="text-emerald-600 text-sm font-semibold flex items-center gap-1.5">
                                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                                            {t("product.detail.stock_qty_available", "Stok: {qty} tersedia").replace("{qty}", currentStock)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    disabled={!canBuy}
                                    onClick={handleAddToCart}
                                    className="flex-1 px-4 flex items-center justify-center gap-2.5 py-4 rounded-2xl border-2 border-blue-600 text-blue-700 font-bold text-sm hover:bg-blue-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-nowrap"
                                >
                                    <ShoppingCart size={18} />
                                    {t("product.detail.cart_btn", "Keranjang")}
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    disabled={!canBuy}
                                    className="flex-[2] flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white font-bold text-sm transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <Check size={18} />
                                    {t("product.detail.buy_btn", "Beli Sekarang")}
                                </motion.button>
                            </div>
                            {cartNotice && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border rounded-xl border-emerald-200 bg-emerald-50 text-emerald-700"
                                >
                                    <Check size={16} />
                                    {cartNotice}
                                    <Link href="/cart" className="ml-auto text-blue-700 hover:underline">
                                        {t("cart.view", "Lihat Cart")}
                                    </Link>
                                </motion.div>
                            )}

                            {/* Payment Method */}
                            <div className="flex flex-col items-center gap-2 px-4 py-2 border shadow-lg rounded-2xl bg-zinc-100 border-zinc-100">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                                    {t("product.detail.payment_method", "Metode Pembayaran")}
                                </p>
                                <img
                                    src="/images/payment/safecheckout.png"
                                    alt="Metode Pembayaran"
                                    className="object-contain h-16 transition-opacity"
                                />
                            </div>
                        </motion.div>
                    </div>

                    {/* Description Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="pt-10 mt-4 border-t border-zinc-100"
                    >
                        <h2 className="text-lg font-['Cinzel'] font-bold text-zinc-900 mb-4 flex items-center gap-3">
                            {t("product.detail.description_title", "Deskripsi Produk")}
                            <span className="flex-1 h-px bg-gradient-to-r from-zinc-200 to-transparent" />
                        </h2>
                        <div className="p-6 border bg-zinc-50 border-zinc-100 rounded-2xl lg:p-8">
                            <p className="text-sm leading-relaxed whitespace-pre-line text-zinc-600">
                                {displayDescription}
                            </p>
                        </div>
                    </motion.div>
                </div>

            </div>

            <Footer />
        </MainLayout>
    );
}
