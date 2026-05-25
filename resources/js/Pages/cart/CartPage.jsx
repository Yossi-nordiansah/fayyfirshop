import React, { useEffect, useMemo, useState } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
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
import MainLayout from "@/Layouts/MainLayout";
import Navbar from "@/Components/Navbar";
import Footer from "@/Components/Footer";
import { useLanguage } from "@/Contexts/LanguageContext";

const CART_KEY = "fayyfir_cart";

export default function CartPage() {
    const { t, locale } = useLanguage(); // Ambil t dan locale aktif
    const { auth } = usePage().props;
    const user = auth?.user;
    const [cartItems, setCartItems] = useState([]);

    useEffect(() => {
        setCartItems(JSON.parse(localStorage.getItem(CART_KEY) || "[]"));
    }, []);

    const saveCart = (nextCart) => {
        setCartItems(nextCart);
        localStorage.setItem(CART_KEY, JSON.stringify(nextCart));
        window.dispatchEvent(new Event("fayyfir-cart-updated"));
    };

    // Format mata uang dinamis sesuai aturan Multi-Negara & Bahasa Fayyfir Shop
    const formatPrice = (value) => {
        const currencyCode = locale === "indonesia" ? "IDR" : "SAR";
        const formatterLocale = locale === "indonesia" ? "id-ID-u-nu-latn" : locale === "arabic" ? "ar-SA-u-nu-latn" : "en-US-u-nu-latn";

        return new Intl.NumberFormat(formatterLocale, {
            style: "currency",
            currency: currencyCode,
            minimumFractionDigits: 0,
        }).format(value || 0);
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
        saveCart(cartItems.filter((_, itemIndex) => itemIndex !== index));
    };

    const clearCart = () => {
        saveCart([]);
    };

    const subtotal = useMemo(
        () =>
            cartItems.reduce(
                (total, item) => total + (item.price || 0) * (item.quantity || 0),
                0,
            ),
        [cartItems],
    );

    const itemCount = useMemo(
        () => cartItems.reduce((total, item) => total + (item.quantity || 0), 0),
        [cartItems],
    );

    return (
        <MainLayout>
            <Head title={`${t("cart.title", "Keranjang Belanja")} - Fayyfir Shop`} />
            <Navbar alwaysSolid={true} />

            <div className="min-h-screen pb-16 font-sans bg-white pt-28">
                <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {!user ? (
                        <div className="flex min-h-[520px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 text-center">
                            <div className="flex items-center justify-center w-20 h-20 mb-5 text-blue-700 bg-white rounded-full shadow-sm">
                                <ShoppingBag size={34} />
                            </div>
                            <h1 className="font-['Cinzel'] text-2xl font-bold tracking-wide text-zinc-900 md:text-3xl">
                                {t("cart.login_required_title", "Login terlebih dahulu")}
                            </h1>
                            <p className="max-w-md mt-3 text-sm leading-relaxed text-zinc-500">
                                {t("cart.login_required_desc", "Silakan login untuk mengakses halaman cart dan melanjutkan pesanan Anda.")}
                            </p>
                            <div className="flex flex-col gap-3 mt-6 sm:flex-row">
                                <Link
                                    href="/login"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white transition-colors bg-blue-700 shadow-lg rounded-xl shadow-blue-900/20 hover:bg-blue-800"
                                >
                                    <Check size={17} />
                                    {t("nav.account.login", "Masuk Akun")}
                                </Link>
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
                                    <h1 className="font-['Cinzel'] text-3xl font-bold tracking-wide text-zinc-900 md:text-4xl">
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
                                        <AnimatePresence initial={false}>
                                            {cartItems.map((item, index) => (
                                                <motion.div
                                                    key={`${item.id}-${item.variantId || "base"}-${item.color || "none"}-${item.size || "none"}`}
                                                    initial={{ opacity: 0, y: 12 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    className="grid grid-cols-[88px_1fr] gap-4 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm sm:grid-cols-[112px_1fr_auto]"
                                                >
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
                                                            {item.title}
                                                        </Link>

                                                        <div className="flex flex-wrap mt-1 text-xs gap-x-3 gap-y-1 text-zinc-500">
                                                            {item.color && <span>{t("cart.color_label", "Warna")}: <strong>{item.color}</strong></span>}
                                                            {item.size && <span>{t("cart.size_label", "Ukuran")}: <strong>{item.size}</strong></span>}
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

                                                    <div className="flex items-center justify-between col-span-2 pt-4 border-t border-zinc-100 sm:col-span-1 sm:block sm:border-t-0 sm:pt-0 sm:text-right">
                                                        <p className="text-sm font-semibold text-zinc-500 sm:hidden">
                                                            {t("cart.subtotal", "Subtotal")}
                                                        </p>
                                                        <p className="text-base font-extrabold text-blue-900">
                                                            {formatPrice(item.price * item.quantity)}
                                                        </p>
                                                        <p className="mt-1 text-xs text-zinc-400">
                                                            {t("cart.price_per_item", "{price} / item").replace("{price}", formatPrice(item.price))}
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>

                                    <aside className="p-5 border shadow-sm h-fit rounded-2xl border-zinc-100 bg-zinc-50 lg:sticky lg:top-28">
                                        <h2 className="font-['Cinzel'] text-lg font-bold text-zinc-900">
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
                                        <button className="flex items-center justify-center w-full gap-2 px-5 py-4 mt-6 text-sm font-bold text-white transition-colors shadow-lg rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 shadow-blue-900/20 hover:from-blue-800 hover:to-blue-700">
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

            <Footer />
        </MainLayout>
    );
}
