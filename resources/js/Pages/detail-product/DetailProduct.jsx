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
    const { t } = useLanguage(); // 2. Inisialisasi fungsi translasi t

    const product =
        initialProduct ||
        (slug ? products.find((p) => p.slug === slug) : null) ||
        products[0];

    const uniqueColors = Array.from(
        new Set(product.variants?.map((v) => v.color).filter(Boolean)),
    );
    const uniqueSizes = Array.from(
        new Set(product.variants?.map((v) => v.size).filter(Boolean)),
    );

    const [selectedColor, setSelectedColor] = useState(uniqueColors[0] || null);
    const [selectedSize, setSelectedSize] = useState(uniqueSizes[0] || null);

    // Build combined gallery: all product images + all variant images
    const productImages =
        Array.isArray(product.image) && product.image.length > 0
            ? product.image
            : [product.image].filter(Boolean);

    const variantImages =
        product.variants?.map((v) => v.image).filter(Boolean) || [];

    const allImages = Array.from(new Set([...productImages, ...variantImages]));

    const variantImagesMap = {}; // color -> image url
    product.variants?.forEach((v) => {
        if (v.color && v.image && !variantImagesMap[v.color]) {
            variantImagesMap[v.color] = v.image;
        }
    });

    const [activeImage, setActiveImage] = useState(allImages[0] || null);
    const [quantity, setQuantity] = useState(1);

    // Reset states when the product changes (e.g. navigation via Link)
    useEffect(() => {
        const nextColors = Array.from(
            new Set(product.variants?.map((v) => v.color).filter(Boolean)),
        );
        const nextSizes = Array.from(
            new Set(product.variants?.map((v) => v.size).filter(Boolean)),
        );
        setSelectedColor(nextColors[0] || null);
        setSelectedSize(nextSizes[0] || null);

        const nextProductImages =
            Array.isArray(product.image) && product.image.length > 0
                ? product.image
                : [product.image].filter(Boolean);
        const nextVariantImages =
            product.variants?.map((v) => v.image).filter(Boolean) || [];
        const nextAllImages = Array.from(
            new Set([...nextProductImages, ...nextVariantImages]),
        );

        setActiveImage(nextAllImages[0] || null);
        setQuantity(1);
    }, [product]);

    // When color changes, auto-switch to variant's image if it exists
    const handleColorSelect = (color) => {
        setSelectedColor(color);
        if (variantImagesMap[color]) {
            setActiveImage(variantImagesMap[color]);
        }
    };

    const activeVariant =
        product.variants?.find(
            (v) =>
                (selectedColor ? v.color === selectedColor : true) &&
                (selectedSize ? v.size === selectedSize : true),
        ) || product.variants?.[0];

    const currentPrice = activeVariant
        ? activeVariant.price
        : product.variants?.[0]?.price || 0;
    const currentStock = activeVariant
        ? activeVariant.stock
        : product.stock || 0;

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

    const renderStars = (rating) =>
        [...Array(5)].map((_, i) => {
            const full = rating >= i + 1;
            const half = !full && rating >= i + 0.5;
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

    const isOutOfStock = currentStock === 0;
    const canBuy = activeVariant && !isOutOfStock;

    return (
        <MainLayout>
            <Head title={`${product.title} - Fayyfir Shop`} />
            <Navbar alwaysSolid={true} />

            <div className="min-h-screen bg-white pt-24 pb-20 font-sans">
                {/* Breadcrumbs */}
                <div className="bg-zinc-50 border-b border-zinc-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                        <nav className="flex text-xs text-zinc-400 items-center gap-1.5">
                            <Link
                                href="/"
                                className="flex items-center gap-1 hover:text-blue-600 transition-colors font-medium"
                            >
                                <ArrowLeft size={12} />
                                {t("product.detail.home", "Home")}
                            </Link>
                            <ChevronRight size={12} className="text-zinc-300" />
                            <Link
                                href={`/products/${product.category.toLowerCase().replace(/\s+/g, "-")}`}
                                className="hover:text-blue-600 transition-colors font-medium"
                            >
                                {product.category}
                            </Link>
                            <ChevronRight size={12} className="text-zinc-300" />
                            <span className="text-zinc-600 truncate max-w-[180px] font-medium">
                                {product.title}
                            </span>
                        </nav>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16">
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
                            <div className="relative rounded-3xl overflow-hidden bg-zinc-50 border border-zinc-100 shadow-xl aspect-square">
                                <AnimatePresence mode="wait">
                                    <motion.img
                                        key={activeImage}
                                        src={activeImage}
                                        alt={product.title}
                                        className="w-full h-full object-cover"
                                        initial={{ opacity: 0, scale: 1.04 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.97 }}
                                        transition={{ duration: 0.35 }}
                                    />
                                </AnimatePresence>

                                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none" />

                                {/* Status Badge */}
                                <div className="absolute top-4 left-4">
                                    {product.status === "best-seller" && (
                                        <span className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg shadow-amber-400/40">
                                            <Flame
                                                size={11}
                                                className="fill-current animate-pulse"
                                            />
                                            {t("product.detail.best_seller", "Best Seller")}
                                        </span>
                                    )}
                                    {product.status === "new" && (
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
                            {allImages.length > 0 && (
                                <div className="flex gap-3 overflow-x-auto py-1 scrollbar-thin scrollbar-thumb-zinc-200 scrollbar-track-transparent">
                                    {allImages.map((img, idx) => {
                                        const isActive = activeImage === img;
                                        const variantColor = Object.keys(variantImagesMap).find(
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
                                                    className="w-full h-full object-cover"
                                                />
                                                {!isActive && (
                                                    <div className="absolute inset-0 bg-white/40 hover:bg-white/10 transition-colors" />
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
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-700 border border-blue-200 bg-blue-50 px-3 py-1 rounded-full">
                                    {product.subCategory || product.category}
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
                                    {product.title}
                                </h1>

                                {/* Rating row */}
                                <div className="flex items-center gap-3 flex-wrap">
                                    <div className="flex items-center gap-0.5">
                                        {renderStars(product.rating)}
                                    </div>
                                    <span className="text-sm font-bold text-amber-500">
                                        {product.rating}
                                    </span>
                                    <span className="text-zinc-300 text-xs">|</span>
                                    <span className="text-zinc-500 text-sm">
                                        {product.reviewCount || product.sold}{" "}
                                        {t("product.detail.reviews", "ulasan")}
                                    </span>
                                    <span className="text-zinc-300 text-xs">|</span>
                                    <span className="text-zinc-500 text-sm flex items-center gap-1">
                                        <Package size={12} className="text-zinc-400" />
                                        {product.sold} {t("product.detail.sold", "terjual")}
                                    </span>
                                </div>
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent" />

                            {/* Price block */}
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100/60 border border-blue-100 rounded-2xl px-5 py-2">
                                <p className="text-xs font-bold uppercase tracking-widest text-blue-500">
                                    {t("product.detail.price_label", "Harga")}
                                </p>
                                <div className="flex items-end gap-3">
                                    <span className="text-2xl font-extrabold text-blue-900 tracking-tight">
                                        {formatPrice(currentPrice)}
                                    </span>
                                </div>
                                {uniqueSizes.length > 0 && (
                                    <p className="text-xs text-zinc-400 mt-1.5">
                                        {t("product.detail.price_notice", "Harga dapat berubah sesuai varian yang dipilih")}
                                    </p>
                                )}
                            </div>

                            {/* Color / Variant Selection */}
                            {uniqueColors.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
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
                                                                className="w-full h-full object-cover"
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

                            {/* Sizes Selection */}
                            {uniqueSizes.length > 0 && (
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
                                <div className="flex items-center rounded-xl overflow-hidden border border-zinc-200 bg-white shadow-sm">
                                    <button
                                        onClick={() => handleQuantityChange("minus")}
                                        disabled={quantity <= 1 || !canBuy}
                                        className="w-11 h-11 flex items-center justify-center text-zinc-500 hover:text-blue-700 hover:bg-blue-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <div className="w-12 h-11 flex items-center justify-center font-bold text-zinc-800 text-base border-x border-zinc-200">
                                        {quantity}
                                    </div>
                                    <button
                                        onClick={() => handleQuantityChange("plus")}
                                        disabled={quantity >= currentStock || !canBuy}
                                        className="w-11 h-11 flex items-center justify-center text-zinc-500 hover:text-blue-700 hover:bg-blue-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>

                                <div>
                                    {isOutOfStock ? (
                                        <span className="text-red-500 text-sm font-semibold flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
                                            {t("product.detail.stock_out", "Stok habis")}
                                        </span>
                                    ) : (
                                        <span className="text-emerald-600 text-sm font-semibold flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                                            {/* Mengganti dinamika teks {qty} secara aman */}
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
                                    className="flex-1 flex items-center justify-center gap-2.5 py-4 rounded-2xl border-2 border-blue-600 text-blue-700 font-bold text-sm hover:bg-blue-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
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

                            {/* Payment Method */}
                            <div className="rounded-2xl bg-zinc-100 shadow-lg border border-zinc-100 px-4 py-2 flex flex-col items-center gap-2">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                                    {t("product.detail.payment_method", "Metode Pembayaran")}
                                </p>
                                <img
                                    src="/images/payment/safecheckout.png"
                                    alt="Metode Pembayaran"
                                    className="h-16 object-contain transition-opacity"
                                />
                            </div>
                        </motion.div>
                    </div>

                    {/* Description Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="mt-4 border-t border-zinc-100 pt-10"
                    >
                        <h2 className="text-lg font-['Cinzel'] font-bold text-zinc-900 mb-4 flex items-center gap-3">
                            {t("product.detail.description_title", "Deskripsi Produk")}
                            <span className="flex-1 h-px bg-gradient-to-r from-zinc-200 to-transparent" />
                        </h2>
                        <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-6 lg:p-8">
                            <p className="text-zinc-600 leading-relaxed text-sm whitespace-pre-line">
                                {product.description}
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>

            <Footer />
        </MainLayout>
    );
}