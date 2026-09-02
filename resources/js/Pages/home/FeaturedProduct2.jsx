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

export default function FeaturedProduct2({ featuredProduct2 = [] }) {
    const { t, locale } = useLanguage();

    if (!featuredProduct2 || featuredProduct2.length === 0) {
        return null;
    }

    const activeItem = featuredProduct2[0];

    const getTranslatedText = (transObj, directVal) => {
        if (typeof transObj === 'object' && transObj !== null) {
            let val = '';
            if (locale === 'arabic' || locale === 'ar') val = transObj.ar || transObj.en || transObj.id;
            else if (locale === 'english' || locale === 'en') val = transObj.en || transObj.id;
            else val = transObj.id;
            if (val !== undefined && val !== null && val !== '') return val;
        }
        return directVal || '';
    };

    // Values with 3-language resolution (purely optional)
    const badgeText = activeItem ? getTranslatedText(activeItem.badge_translations, activeItem.badge) : '';
    const titleText = activeItem ? getTranslatedText(activeItem.title_translations, activeItem.title) : '';
    const descText = activeItem ? getTranslatedText(activeItem.description_translations, activeItem.description) : '';

    const bgImage = activeItem?.background_image || '/images/featured-product/bg-featured-product.png';

    // Feature 1
    const f1IconName = activeItem?.feature_1_icon || 'Gem';
    const Feature1IconComp = ICON_MAP[f1IconName] || Gem;
    const f1TitleText = activeItem ? getTranslatedText(activeItem.feature_1_title_translations, activeItem.feature_1_title) : '';
    const f1DescText = activeItem ? getTranslatedText(activeItem.feature_1_desc_translations, activeItem.feature_1_desc) : '';

    // Feature 2
    const f2IconName = activeItem?.feature_2_icon || 'Crown';
    const Feature2IconComp = ICON_MAP[f2IconName] || Crown;
    const f2TitleText = activeItem ? getTranslatedText(activeItem.feature_2_title_translations, activeItem.feature_2_title) : '';
    const f2DescText = activeItem ? getTranslatedText(activeItem.feature_2_desc_translations, activeItem.feature_2_desc) : '';

    const hasFeature1 = Boolean(f1TitleText || f1DescText);
    const hasFeature2 = Boolean(f2TitleText || f2DescText);
    const hasAnyFeature = hasFeature1 || hasFeature2;

    // Button
    const btnText = activeItem ? getTranslatedText(activeItem.button_text_translations, activeItem.button_text) : '';

    const rawButtonUrl = activeItem?.button_url || '/products/parfum';
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
        <section className="relative w-full min-h-[80vh] md:max-h-[80vh] flex items-center justify-end overflow-hidden bg-blue-950/20">
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-[left_-170px_center] md:bg-[position:15%_center] lg:bg-[position:center_center] bg-no-repeat"
                style={{
                    backgroundImage: `url('${bgImage}')`,
                }}
            />
            {/* Premium Overlay — gelap dari KANAN ke transparan ke kiri (kebalikan FeaturedProduct) */}
            <div className="absolute inset-0 bg-gradient-to-l from-black/80 via-black/50 to-transparent md:bg-gradient-to-l" />
            <div className="absolute inset-0 bg-black/30 md:hidden" />

            {/* Content Container */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-24 w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Kolom Kiri dikosongkan — area gambar produk di background */}
                <div className="hidden md:block" />

                {/* Konten di KANAN */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="flex flex-col space-y-6 text-white max-w-xl md:ml-auto"
                >
                    {/* Badge Atas (Opsional) */}
                    {badgeText && (
                        <motion.div
                            variants={itemVariants}
                            className="inline-flex items-center space-x-2 bg-blue-500/20 border border-blue-400/40 backdrop-blur-md px-3 py-1 rounded-full w-fit"
                        >
                            <Sparkles className="w-4 h-4 text-blue-300 shrink-0" />
                            <span className="text-xs font-semibold tracking-wider uppercase text-blue-200">
                                {badgeText}
                            </span>
                        </motion.div>
                    )}

                    {/* Judul & Caption (Opsional) */}
                    {(titleText || descText) && (
                        <div className="space-y-3">
                            {titleText && (
                                <motion.h2
                                    variants={itemVariants}
                                    style={activeItem?.text_color ? { color: activeItem.text_color, WebkitTextFillColor: activeItem.text_color, backgroundImage: 'none' } : undefined}
                                    className="text-3xl md:text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-cyan-300 to-blue-200"
                                >
                                    {titleText}
                                </motion.h2>
                            )}
                            {descText && (
                                <motion.p
                                    variants={itemVariants}
                                    className="text-sm md:text-base text-gray-300 leading-relaxed font-light"
                                >
                                    {descText}
                                </motion.p>
                            )}
                        </div>
                    )}

                    {/* Fitur / Keunggulan Produk (Opsional) */}
                    {hasAnyFeature && (
                        <motion.div
                            variants={itemVariants}
                            className={`grid grid-cols-1 ${hasFeature1 && hasFeature2 ? 'sm:grid-cols-2' : ''} gap-4 pt-2`}
                        >
                            {/* Keunggulan 1 */}
                            {hasFeature1 && (
                                <div className="flex items-start space-x-3">
                                    <div className="p-2 bg-blue-950/40 border border-blue-400/30 rounded-lg text-blue-300 backdrop-blur-sm shrink-0">
                                        <Feature1IconComp className="w-5 h-5" />
                                    </div>
                                    <div>
                                        {f1TitleText && (
                                            <h4 className="text-sm font-semibold text-blue-100">
                                                {f1TitleText}
                                            </h4>
                                        )}
                                        {f1DescText && (
                                            <p className="text-xs text-gray-400">
                                                {f1DescText}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Keunggulan 2 */}
                            {hasFeature2 && (
                                <div className="flex items-start space-x-3">
                                    <div className="p-2 bg-blue-950/40 border border-blue-400/30 rounded-lg text-blue-300 backdrop-blur-sm shrink-0">
                                        <Feature2IconComp className="w-5 h-5" />
                                    </div>
                                    <div>
                                        {f2TitleText && (
                                            <h4 className="text-sm font-semibold text-blue-100">
                                                {f2TitleText}
                                            </h4>
                                        )}
                                        {f2DescText && (
                                            <p className="text-xs text-gray-400">
                                                {f2DescText}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Tombol CTA (Opsional) */}
                    {btnText && (
                        <motion.div variants={itemVariants} className="pt-4">
                            {isFullExternal ? (
                                <a
                                    href={targetUrl}
                                    style={{
                                        ...(activeItem?.button_color ? { backgroundColor: activeItem.button_color, backgroundImage: 'none' } : {}),
                                        ...(activeItem?.button_text_color ? { color: activeItem.button_text_color } : {})
                                    }}
                                    className={`group relative inline-flex items-center justify-center px-8 py-3.5 font-medium tracking-wide transition-all duration-300 ease-in-out ${activeItem?.button_color ? '' : 'bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500'
                                        } ${activeItem?.button_text_color ? '' : 'text-white'
                                        } rounded-xl shadow-[0_4px_20px_rgba(59,130,246,0.35)] hover:shadow-[0_4px_25px_rgba(59,130,246,0.55)] hover:scale-[1.02] active:scale-[0.98] overflow-hidden`}
                                >
                                    <span
                                        className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"
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
                                    style={{
                                        ...(activeItem?.button_color ? { backgroundColor: activeItem.button_color, backgroundImage: 'none' } : {}),
                                        ...(activeItem?.button_text_color ? { color: activeItem.button_text_color } : {})
                                    }}
                                    className={`group relative inline-flex items-center justify-center px-8 py-3.5 font-medium tracking-wide transition-all duration-300 ease-in-out ${activeItem?.button_color ? '' : 'bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500'
                                        } ${activeItem?.button_text_color ? '' : 'text-white'
                                        } rounded-xl shadow-[0_4px_20px_rgba(59,130,246,0.35)] hover:shadow-[0_4px_25px_rgba(59,130,246,0.55)] hover:scale-[1.02] active:scale-[0.98] overflow-hidden`}
                                >
                                    <span
                                        className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"
                                        style={{ animationDuration: "1.5s" }}
                                    />
                                    <ShoppingBag className="w-5 h-5 mr-2 transition-transform group-hover:-translate-y-0.5 group-hover:scale-110 shrink-0" />
                                    <span className="font-bold text-sm md:text-base">
                                        {btnText}
                                    </span>
                                </Link>
                            )}
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </section>
    );
}
