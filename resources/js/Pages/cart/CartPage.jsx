import React, { useEffect, useMemo, useState } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import {
    ArrowLeft,
    Check,
    Minus,
    Package,
    Plus,
    ShoppingBag,
    Trash2,
    X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import MainLayout from "@/Layouts/MainLayout";
import { useLanguage } from "@/Contexts/LanguageContext";

export default function CartPage() {
    const { t, locale } = useLanguage(); // Ambil t dan locale aktif
    const { auth } = usePage().props;
    const user = auth?.user;

    const cartKey = user ? `fayyfir_cart_${user.id}` : "fayyfir_cart";
    const checkoutKey = user ? `fayyfir_checkout_${user.id}` : "fayyfir_checkout";

    const [cartItems, setCartItems] = useState([]);
    const [checkedKeys, setCheckedKeys] = useState([]);

    const getItemKey = (item) =>
        `${item.id}-${item.variantId || "base"}-${item.color || "none"}-${item.size || "none"}`;

    useEffect(() => {
        const items = JSON.parse(localStorage.getItem(cartKey) || "[]");
        setCartItems(items);
        setCheckedKeys([]);

        if (items.length > 0) {
            axios.post(route('checkout.check-stock'), {
                items: items.map(item => ({ id: item.id, variantId: item.variantId }))
            }).then(res => {
                if (res.data?.prices) {
                    const freshItems = items.map(item => {
                        const key = `${item.id}-${item.variantId ?? 'null'}`;
                        const pInfo = res.data.prices[key];
                        if (pInfo) {
                            return {
                                ...item,
                                price: Number(pInfo.price),
                                original_price: Number(pInfo.original_price),
                                discount_price: pInfo.discount_price ? Number(pInfo.discount_price) : null,
                            };
                        }
                        return item;
                    });
                    setCartItems(freshItems);
                    localStorage.setItem(cartKey, JSON.stringify(freshItems));
                }
            }).catch(() => {});
        }
    }, [user]);

    const saveCart = (nextCart) => {
        setCartItems(nextCart);
        localStorage.setItem(cartKey, JSON.stringify(nextCart));
        window.dispatchEvent(new Event("fayyfir-cart-updated"));
    };

    // Format mata uang dinamis sesuai aturan Multi-Negara & Bahasa Fayyfir Shop
    const formatPrice = (value) => {
        const currencySymbol = locale === "indonesia" ? "Rp" : "IDR";
        const formattedNumber = new Intl.NumberFormat("id-ID", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value || 0);

        return `${currencySymbol} ${formattedNumber}`;
    };

    const formatNumber = (value) =>
        new Intl.NumberFormat("en-US-u-nu-latn", {
            maximumFractionDigits: 0,
        }).format(value || 0);

    const updateQuantity = (index, nextQuantity) => {
        const nextCart = cartItems.map((item, itemIndex) => {
            if (itemIndex !== index) return item;
            const quantity = Math.max(1, Math.min(nextQuantity, item.stock || 999));
            return { ...item, quantity };
        });
        saveCart(nextCart);
    };

    const removeItem = (index) => {
        const itemToRemove = cartItems[index];
        const nextCart = cartItems.filter((_, itemIndex) => itemIndex !== index);
        saveCart(nextCart);
        setCheckedKeys(checkedKeys.filter(k => k !== getItemKey(itemToRemove)));
    };

    const clearCart = () => {
        saveCart([]);
        setCheckedKeys([]);
    };

    const toggleCheckItem = (item) => {
        const key = getItemKey(item);
        if (checkedKeys.includes(key)) {
            setCheckedKeys(checkedKeys.filter(k => k !== key));
        } else {
            setCheckedKeys([...checkedKeys, key]);
        }
    };

    const toggleSelectAll = () => {
        if (checkedKeys.length === cartItems.length) {
            setCheckedKeys([]);
        } else {
            setCheckedKeys(cartItems.map(getItemKey));
        }
    };

    const removeSelectedItems = () => {
        const nextCart = cartItems.filter(item => !checkedKeys.includes(getItemKey(item)));
        saveCart(nextCart);
        setCheckedKeys([]);
    };

    const handleCheckout = () => {
        const checkoutItems = cartItems.filter(item => checkedKeys.includes(getItemKey(item)));
        if (checkoutItems.length === 0) return;

        const sourceKey = user ? `fayyfir_checkout_source_${user.id}` : "fayyfir_checkout_source";
        localStorage.setItem(checkoutKey, JSON.stringify(checkoutItems));
        localStorage.setItem(sourceKey, 'cart');
        router.visit('/checkout');
    };

    const subtotal = useMemo(
        () =>
            cartItems
                .filter(item => checkedKeys.includes(getItemKey(item)))
                .reduce(
                    (total, item) => total + (item.price || 0) * (item.quantity || 0),
                    0,
                ),
        [cartItems, checkedKeys],
    );

    const itemCount = useMemo(
        () =>
            cartItems
                .filter(item => checkedKeys.includes(getItemKey(item)))
                .reduce((total, item) => total + (item.quantity || 0), 0),
        [cartItems, checkedKeys],
    );

    return (
        <MainLayout>
            <Head title={`Fayyfir - ${t("cart.title", "Keranjang Belanja")}`} />

            <div className="min-h-screen pb-16 font-sans bg-white pt-28">
                <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {!user ? (
                        <div className="flex min-h-[520px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 text-center">
                            <div className="flex items-center justify-center w-20 h-20 mb-5 text-blue-700 bg-white rounded-full shadow-sm">
                                <ShoppingBag size={34} />
                            </div>
                            <h1 className="text-2xl font-bold tracking-wide text-zinc-900 md:text-3xl">
                                {t("cart.login_required_title", "Login terlebih dahulu")}
                            </h1>
                            <p className="max-w-md mt-3 text-sm leading-relaxed text-zinc-500">
                                {t("cart.login_required_desc", "Silakan login untuk mengakses halaman cart dan melanjutkan pesanan Anda.")}
                            </p>
                            <div className="flex flex-col gap-3 mt-6 sm:flex-row">
                                <button
                                     onClick={() => window.dispatchEvent(new Event("fayyfir-open-login"))}
                                     className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white transition-colors bg-blue-700 shadow-lg rounded-xl shadow-blue-900/20 hover:bg-blue-800"
                                >
                                    <Check size={17} />
                                    {t("nav.account.login", "Masuk Akun")}
                                </button>
                                <Link
                                    href="/products"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold transition-colors bg-white border rounded-xl border-zinc-200 text-zinc-700 hover:border-blue-200 hover:text-blue-700"
                                >
                                    <ArrowLeft size={17} />
                                    {t("cart.continue_shopping", "Lanjut Belanja")}
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col gap-4 pb-6 mb-8 border-b border-zinc-100 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <Link
                                        href="/products"
                                        className="inline-flex items-center gap-2 mb-4 text-sm font-semibold transition-colors text-zinc-500 hover:text-blue-700"
                                    >
                                        <ArrowLeft size={16} />
                                        {t("cart.continue_shopping", "Lanjut Belanja")}
                                    </Link>
                                    <h1 className="text-3xl font-bold tracking-wide text-zinc-900 md:text-4xl">
                                        {t("cart.title", "Keranjang Belanja")}
                                    </h1>
                                    <p className="mt-2 text-sm text-zinc-500">
                                        {itemCount > 0
                                            ? t("cart.item_count", "{count} item di keranjang").replace("{count}", formatNumber(itemCount))
                                            : t("cart.empty_hint", "Belum ada produk di keranjang")}
                                    </p>
                                </div>

                                {cartItems.length > 0 && (
                                    <button
                                        onClick={clearCart}
                                        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-red-600 transition-colors border border-red-100 rounded-xl hover:bg-red-50"
                                    >
                                        <X size={16} />
                                        {t("cart.clear", "Kosongkan Cart")}
                                    </button>
                                )}
                            </div>

                            {cartItems.length === 0 ? (
                                <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 text-center">
                                    <div className="flex items-center justify-center w-20 h-20 mb-5 text-blue-700 bg-white rounded-full shadow-sm">
                                        <ShoppingBag size={34} />
                                    </div>
                                    <h2 className="text-xl font-bold text-zinc-900">
                                        {t("cart.empty_title", "Keranjang masih kosong")}
                                    </h2>
                                    <p className="max-w-md mt-2 text-sm leading-relaxed text-zinc-500">
                                        {t("cart.empty_desc", "Tambahkan produk dari halaman detail produk, lalu item pilihan Anda akan muncul di sini.")}
                                    </p>
                                    <Link
                                        href="/products"
                                        className="inline-flex items-center gap-2 px-6 py-3 mt-6 text-sm font-bold text-white transition-colors bg-blue-700 shadow-lg rounded-xl shadow-blue-900/20 hover:bg-blue-800"
                                    >
                                        <ShoppingBag size={17} />
                                        {t("cart.shop_now", "Belanja Sekarang")}
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
                                    <div className="space-y-4">
                                        {/* Select All & Actions */}
                                        <div className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-100 rounded-2xl">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={toggleSelectAll}
                                                    className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${checkedKeys.length === cartItems.length && cartItems.length > 0
                                                        ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200"
                                                        : "border-zinc-300 hover:border-blue-400 bg-white"
                                                        }`}
                                                >
                                                    {checkedKeys.length === cartItems.length && cartItems.length > 0 && (
                                                        <Check size={14} strokeWidth={3} />
                                                    )}
                                                </button>
                                                <span className="text-sm font-bold text-zinc-700">
                                                    {t("cart.select_all", "Pilih Semua")} ({checkedKeys.length}/{cartItems.length})
                                                </span>
                                            </div>

                                            {checkedKeys.length > 0 && (
                                                <button
                                                    onClick={removeSelectedItems}
                                                    className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
                                                >
                                                    {t("cart.remove_selected", "Hapus Terpilih")}
                                                </button>
                                            )}
                                        </div>

                                        <AnimatePresence initial={false}>
                                            {cartItems.map((item, index) => (
                                                <motion.div
                                                    key={getItemKey(item)}
                                                    initial={{ opacity: 0, y: 12 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    className="grid grid-cols-[auto_88px_1fr] gap-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm sm:grid-cols-[auto_112px_1fr_auto] sm:gap-4 items-center"
                                                >
                                                    {/* Checkbox */}
                                                    <div className="flex items-center justify-center pr-1 sm:pr-2">
                                                        <button
                                                            onClick={() => toggleCheckItem(item)}
                                                            className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${checkedKeys.includes(getItemKey(item))
                                                                ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200"
                                                                : "border-zinc-300 hover:border-blue-400 bg-white"
                                                                }`}
                                                        >
                                                            {checkedKeys.includes(getItemKey(item)) && <Check size={14} strokeWidth={3} />}
                                                        </button>
                                                    </div>

                                                    <Link href={`/product/${item.slug}`} className="block overflow-hidden rounded-xl bg-zinc-100">
                                                        <img
                                                            src={item.image || "/images/default-product.png"}
                                                            alt={item.title}
                                                            className="object-cover w-full h-24 sm:h-28"
                                                        />
                                                    </Link>

                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-700">
                                                                {item.subCategory || item.category}
                                                            </span>
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                                                                <Package size={10} />
                                                                {formatNumber(item.stock)} {t("cart.stock_label", "stok")}
                                                            </span>
                                                        </div>

                                                        <Link
                                                            href={`/product/${item.slug}`}
                                                            className="block mt-2 text-base font-bold truncate transition-colors text-zinc-900 hover:text-blue-700"
                                                        >
                                                            {item.title_translations?.[locale] || item.title}
                                                        </Link>

                                                        <div className="flex flex-wrap mt-1 text-xs gap-x-3 gap-y-1 text-zinc-500">
                                                            {item.variantNameTranslations?.[locale] || item.variantName ? (
                                                                <span>{t("cart.variant_label", "Varian")}: <strong>{item.variantNameTranslations?.[locale] || item.variantName}</strong></span>
                                                            ) : (
                                                                item.color && <span>{t("cart.color_label", "Warna")}: <strong>{item.color}</strong></span>
                                                            )}
                                                            {item.subVariantNameTranslations?.[locale] || item.subVariantName ? (
                                                                <span>{t("cart.sub_variant_label", "Sub Varian")}: <strong>{item.subVariantNameTranslations?.[locale] || item.subVariantName}</strong></span>
                                                            ) : (
                                                                item.size && <span>{t("cart.size_label", "Ukuran")}: <strong>{item.size}</strong></span>
                                                            )}
                                                            {item.sku && <span>SKU: {item.sku}</span>}
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-4 mt-4">
                                                            <div className="flex overflow-hidden border rounded-xl border-zinc-200">
                                                                <button
                                                                    onClick={() => updateQuantity(index, item.quantity - 1)}
                                                                    className="flex items-center justify-center w-10 h-10 transition-colors text-zinc-500 hover:bg-blue-50 hover:text-blue-700"
                                                                >
                                                                    <Minus size={14} />
                                                                </button>
                                                                <div className="flex items-center justify-center w-12 h-10 text-sm font-bold border-x border-zinc-200 text-zinc-900">
                                                                    {formatNumber(item.quantity)}
                                                                </div>
                                                                <button
                                                                    onClick={() => updateQuantity(index, item.quantity + 1)}
                                                                    className="flex items-center justify-center w-10 h-10 transition-colors text-zinc-500 hover:bg-blue-50 hover:text-blue-700"
                                                                >
                                                                    <Plus size={14} />
                                                                </button>
                                                            </div>

                                                            <button
                                                                onClick={() => removeItem(index)}
                                                                className="inline-flex items-center gap-1.5 text-xs font-bold text-red-500 transition-colors hover:text-red-700"
                                                            >
                                                                <Trash2 size={14} />
                                                                {t("cart.remove", "Hapus")}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between col-span-3 pt-4 border-t border-zinc-100 sm:col-span-1 sm:block sm:border-t-0 sm:pt-0 sm:text-right">
                                                        <p className="text-sm font-semibold text-zinc-500 sm:hidden">
                                                            {t("cart.subtotal", "Subtotal")}
                                                        </p>
                                                        <div className="flex flex-col sm:items-end">
                                                            <p className={`text-base font-extrabold ${item.original_price && Number(item.original_price) > Number(item.price) ? "text-rose-600" : "text-blue-900"}`}>
                                                                {formatPrice(item.price * item.quantity)}
                                                            </p>
                                                            {item.original_price && Number(item.original_price) > Number(item.price) && (
                                                                <p className="text-xs text-zinc-400 line-through">
                                                                    {formatPrice(item.original_price * item.quantity)}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <p className="mt-1 text-xs text-zinc-400">
                                                            {t("cart.price_per_item", "{price} / item").replace("{price}", formatPrice(item.price))}
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>

                                    <aside className="p-5 border shadow-sm h-fit rounded-2xl border-zinc-100 bg-zinc-50 lg:sticky lg:top-28">
                                        <h2 className="text-lg font-bold text-zinc-900">
                                            {t("cart.summary", "Ringkasan Pesanan")}
                                        </h2>
                                        <div className="pb-5 mt-5 space-y-3 text-sm border-b border-zinc-200">
                                            <div className="flex justify-between text-zinc-600">
                                                <span>{t("cart.items", "Total Item")}</span>
                                                <span className="font-bold text-zinc-900">{formatNumber(itemCount)}</span>
                                            </div>
                                            <div className="flex justify-between text-zinc-600">
                                                <span>{t("cart.subtotal", "Subtotal")}</span>
                                                <span className="font-bold text-zinc-900">{formatPrice(subtotal)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-5">
                                            <span className="text-base font-bold text-zinc-900">
                                                {t("cart.total", "Total")}
                                            </span>
                                            <span className="text-xl font-extrabold text-blue-900">
                                                {formatPrice(subtotal)}
                                            </span>
                                        </div>
                                        <button
                                            onClick={handleCheckout}
                                            disabled={checkedKeys.length === 0}
                                            className="flex items-center justify-center w-full gap-2 px-5 py-4 mt-6 text-sm font-bold text-white transition-colors shadow-lg rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 shadow-blue-900/20 hover:from-blue-800 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Check size={17} />
                                            {t("cart.checkout", "Checkout")}
                                        </button>
                                        <p className="mt-3 text-xs text-center text-zinc-400">
                                            {t("cart.checkout_note", "Checkout akan memakai item yang ada di keranjang ini.")}
                                        </p>
                                    </aside>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
