import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/Contexts/LanguageContext";
import { Link } from "@inertiajs/react";
import {
    ShoppingBag,
    ShieldCheck,
    Shield,
    ShieldAlert,
    Lock,
    Key,
    CheckCircle,
    CheckCircle2,
    BadgeCheck,
    Badge,
    Award,
    Crown,
    Star,
    Sparkles,
    Gem,
    Medal,
    Trophy,
    ThumbsUp,
    Heart,
    Smile,
    Leaf,
    Sun,
    Droplets,
    Flower,
    Flower2,
    Sprout,
    Apple,
    Truck,
    Package,
    PackageCheck,
    Send,
    MapPin,
    Globe,
    Compass,
    Box,
    Clock,
    Zap,
    Timer,
    Calendar,
    Hourglass,
    ShoppingCart,
    Tag,
    Percent,
    CreditCard,
    Gift,
    Store,
    Coffee,
    Flame,
    Feather,
    Info,
    Sparkle
} from "lucide-react";

const ICON_MAP = {
    ShieldCheck, Shield, ShieldAlert, Lock, Key, CheckCircle, CheckCircle2, BadgeCheck, Badge,
    Award, Crown, Star, Sparkles, Gem, Medal, Trophy, ThumbsUp, Heart, Smile,
    Leaf, Sun, Droplets, Flower, Flower2, Sprout, Apple, Feather,
    Truck, Package, PackageCheck, Send, MapPin, Globe, Compass, Box,
    Clock, Zap, Timer, Calendar, Hourglass,
    ShoppingBag, ShoppingCart, Tag, Percent, CreditCard, Gift, Store,
    Coffee, Flame, Info, Sparkle
};

export default function FeaturedProduct({ featuredProducts = [] }) {
    const { t, locale } = useLanguage();

    if (!featuredProducts || featuredProducts.length === 0) {
        return null;
    }

    const activeItem = featuredProducts[0];

    const getTranslatedText = (transObj, fallbackStr) => {
        if (typeof transObj === 'object' && transObj !== null) {
            if (locale === 'arabic' || locale === 'ar') return transObj.ar || transObj.en || transObj.id || fallbackStr;
            if (locale === 'english' || locale === 'en') return transObj.en || transObj.id || fallbackStr;
            return transObj.id || fallbackStr;
        }
        return transObj || fallbackStr;
    };

    // Values with 3-language resolution
    const badgeText = activeItem
        ? getTranslatedText(activeItem.badge_translations, activeItem.badge || t("featured.badge", "Special Premium Product"))
        : t("featured.badge", "Special Premium Product");

    const titleText = activeItem
        ? getTranslatedText(activeItem.title_translations, activeItem.title || t("featured.title", "Alsharif Pure Honey Marai"))
        : t("featured.title", "Alsharif Pure Honey Marai");

    const descText = activeItem
        ? getTranslatedText(activeItem.description_translations, activeItem.description || t("featured.caption", "Rasakan kemurnian madu Marai otentik yang dipanen langsung dari nektar bunga pilihan di lembah subur Timur Tengah. Menghadirkan kualitas premium nan kaya manfaat untuk gaya hidup sehat keluarga Anda."))
        : t("featured.caption", "Rasakan kemurnian madu Marai otentik yang dipanen langsung dari nektar bunga pilihan di lembah subur Timur Tengah. Menghadirkan kualitas premium nan kaya manfaat untuk gaya hidup sehat keluarga Anda.");

    const bgImage = activeItem?.background_image || '/images/featured-product/bg-featured-product.png';

    // Feature 1 Icon
    const f1IconName = activeItem?.feature_1_icon || 'ShieldCheck';
    const Feature1IconComp = ICON_MAP[f1IconName] || ShieldCheck;
    const f1TitleText = activeItem
        ? getTranslatedText(activeItem.feature_1_title_translations, activeItem.feature_1_title || t("featured.feat1.title", "100% Organik & Murni"))
        : t("featured.feat1.title", "100% Organik & Murni");
    const f1DescText = activeItem
        ? getTranslatedText(activeItem.feature_1_desc_translations, activeItem.feature_1_desc || t("featured.feat1.desc", "Tanpa pemanis buatan maupun bahan pengawet."))
        : t("featured.feat1.desc", "Tanpa pemanis buatan maupun bahan pengawet.");

    // Feature 2 Icon
    const f2IconName = activeItem?.feature_2_icon || 'Award';
    const Feature2IconComp = ICON_MAP[f2IconName] || Award;
    const f2TitleText = activeItem
        ? getTranslatedText(activeItem.feature_2_title_translations, activeItem.feature_2_title || t("featured.feat2.title", "Kualitas Ekstra Premium"))
        : t("featured.feat2.title", "Kualitas Ekstra Premium");
    const f2DescText = activeItem
        ? getTranslatedText(activeItem.feature_2_desc_translations, activeItem.feature_2_desc || t("featured.feat2.desc", "Melalui proses kurasi ketat standar ekspor."))
        : t("featured.feat2.desc", "Melalui proses kurasi ketat standar ekspor.");

    // Button
    const btnText = activeItem
        ? getTranslatedText(activeItem.button_text_translations, activeItem.button_text || t("featured.btn.buy", "Beli Sekarang"))
        : t("featured.btn.buy", "Beli Sekarang");

    const rawButtonUrl = activeItem?.button_url || '/products/kesehatan-dan-nutrisi';
    const targetUrl = rawButtonUrl.startsWith('http://') || rawButtonUrl.startsWith('https://') || rawButtonUrl.startsWith('/')
        ? rawButtonUrl
        : `/products/${rawButtonUrl}`;
    const isFullExternal = targetUrl.startsWith('http://') || targetUrl.startsWith('https://');

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.2, delayChildren: 0.1 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: "spring", stiffness: 100, damping: 20 },
        },
    };

    return (
        <section className="relative w-full min-h-[80vh] md:max-h-[80vh] flex items-center justify-start overflow-hidden bg-amber-950/20">
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-[right_-170px_center] md:bg-[position:85%_center] lg:bg-[position:center_center] bg-no-repeat"
                style={{
                    backgroundImage: `url('${bgImage}')`,
                }}
            />
            {/* Premium Overlay (Gelap di kiri ke transparan di kanan untuk estetika sinematik) */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent md:bg-gradient-to-r" />
            <div className="absolute inset-0 bg-black/30 md:hidden" />{" "}
            {/* Extra dark overlay untuk mobile */}

            {/* Content Container */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-24 w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Teks & Deskripsi Kiri */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="flex flex-col space-y-6 text-white max-w-xl"
                >
                    {/* Badge Atas */}
                    {badgeText && (
                        <motion.div
                            variants={itemVariants}
                            className="inline-flex items-center space-x-2 bg-amber-500/20 border border-amber-500/40 backdrop-blur-md px-3 py-1 rounded-full w-fit"
                        >
                            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                            <span className="text-xs font-semibold tracking-wider uppercase text-amber-300">
                                {badgeText}
                            </span>
                        </motion.div>
                    )}

                    {/* Judul & Caption */}
                    <div className="space-y-3">
                        <motion.h2
                            variants={itemVariants}
                            className="text-3xl md:text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200"
                        >
                            {titleText}
                        </motion.h2>
                        <motion.p
                            variants={itemVariants}
                            className="text-sm md:text-base text-gray-300 leading-relaxed font-light"
                        >
                            {descText}
                        </motion.p>
                    </div>

                    {/* Fitur / Keunggulan Produk */}
                    <motion.div
                        variants={itemVariants}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2"
                    >
                        {/* Keunggulan 1 */}
                        <div className="flex items-start space-x-3">
                            <div className="p-2 bg-blue-950/40 border border-amber-500/30 rounded-lg text-amber-400 backdrop-blur-sm shrink-0">
                                <Feature1IconComp className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-amber-200">
                                    {f1TitleText}
                                </h4>
                                <p className="text-xs text-gray-400">
                                    {f1DescText}
                                </p>
                            </div>
                        </div>

                        {/* Keunggulan 2 */}
                        <div className="flex items-start space-x-3">
                            <div className="p-2 bg-blue-950/40 border border-amber-500/30 rounded-lg text-amber-400 backdrop-blur-sm shrink-0">
                                <Feature2IconComp className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-amber-200">
                                    {f2TitleText}
                                </h4>
                                <p className="text-xs text-gray-400">
                                    {f2DescText}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Tombol Buy Now / CTA */}
                    <motion.div variants={itemVariants} className="pt-4">
                        {isFullExternal ? (
                            <a
                                href={targetUrl}
                                className="group relative inline-flex items-center justify-center px-8 py-3.5 font-medium tracking-wide text-blue-950 transition-all duration-300 ease-in-out bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 rounded-xl shadow-[0_4px_20px_rgba(245,158,11,0.3)] hover:shadow-[0_4px_25px_rgba(245,158,11,0.5)] hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
                            >
                                <span
                                    className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-shimmer"
                                    style={{ animationDuration: "1.5s" }}
                                />
                                <ShoppingBag className="w-5 h-5 mr-2 transition-transform group-hover:-translate-y-0.5 group-hover:scale-110 shrink-0" />
                                <span className="font-bold text-sm md:text-base">
                                    {btnText}
                                </span>
                            </a>
                        ) : (
                            <Link
                                href={targetUrl}
                                className="group relative inline-flex items-center justify-center px-8 py-3.5 font-medium tracking-wide text-blue-950 transition-all duration-300 ease-in-out bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 rounded-xl shadow-[0_4px_20px_rgba(245,158,11,0.3)] hover:shadow-[0_4px_25px_rgba(245,158,11,0.5)] hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
                            >
                                <span
                                    className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-shimmer"
                                    style={{ animationDuration: "1.5s" }}
                                />
                                <ShoppingBag className="w-5 h-5 mr-2 transition-transform group-hover:-translate-y-0.5 group-hover:scale-110 shrink-0" />
                                <span className="font-bold text-sm md:text-base">
                                    {btnText}
                                </span>
                            </Link>
                        )}
                    </motion.div>
                </motion.div>

                {/* Kolom Kanan dikosongkan secara strategis agar botol madu di background kanan tidak tertutup teks */}
                <div className="hidden md:block" />
            </div>
        </section>
    );
}
