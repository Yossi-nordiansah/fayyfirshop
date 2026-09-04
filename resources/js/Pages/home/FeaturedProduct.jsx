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

    const getTranslatedText = (transObj, directVal) => {
        if (typeof transObj === 'object' && transObj !== null) {
            let val = '';
            if (locale === 'arabic' || locale === 'ar') val = transObj.ar || transObj.en || transObj.id;
            else if (locale === 'english' || locale === 'en') val = transObj.en || transObj.id;
            else val = transObj.id;
            if (val !== undefined && val !== null && String(val).trim() !== '') return String(val).trim();
        }
        return (directVal && String(directVal).trim()) ? String(directVal).trim() : '';
    };

    // Explicit definition checks: If primary Indonesian / direct content was deleted, the element is not defined
    const isBadgeDefined = Boolean(
        (activeItem?.badge && String(activeItem.badge).trim() !== '') ||
        (activeItem?.badge_translations?.id && String(activeItem.badge_translations.id).trim() !== '')
    );
    const isTitleDefined = Boolean(
        (activeItem?.title && String(activeItem.title).trim() !== '') ||
        (activeItem?.title_translations?.id && String(activeItem.title_translations.id).trim() !== '')
    );
    const isDescDefined = Boolean(
        (activeItem?.description && String(activeItem.description).trim() !== '') ||
        (activeItem?.description_translations?.id && String(activeItem.description_translations.id).trim() !== '')
    );

    // Values with 3-language resolution (purely optional)
    const badgeText = isBadgeDefined && activeItem ? getTranslatedText(activeItem.badge_translations, activeItem.badge) : '';
    const titleText = isTitleDefined && activeItem ? getTranslatedText(activeItem.title_translations, activeItem.title) : '';
    const descText = isDescDefined && activeItem ? getTranslatedText(activeItem.description_translations, activeItem.description) : '';

    const bgImage = activeItem?.background_image || '/images/featured-product/bg-featured-product.png';

    // Feature 1
    const isF1Defined = Boolean(
        (activeItem?.feature_1_title && String(activeItem.feature_1_title).trim() !== '') ||
        (activeItem?.feature_1_title_translations?.id && String(activeItem.feature_1_title_translations.id).trim() !== '') ||
        (activeItem?.feature_1_desc && String(activeItem.feature_1_desc).trim() !== '') ||
        (activeItem?.feature_1_desc_translations?.id && String(activeItem.feature_1_desc_translations.id).trim() !== '')
    );
    const f1IconName = activeItem?.feature_1_icon || 'ShieldCheck';
    const Feature1IconComp = ICON_MAP[f1IconName] || ShieldCheck;
    const f1TitleText = isF1Defined && activeItem ? getTranslatedText(activeItem.feature_1_title_translations, activeItem.feature_1_title) : '';
    const f1DescText = isF1Defined && activeItem ? getTranslatedText(activeItem.feature_1_desc_translations, activeItem.feature_1_desc) : '';

    // Feature 2
    const isF2Defined = Boolean(
        (activeItem?.feature_2_title && String(activeItem.feature_2_title).trim() !== '') ||
        (activeItem?.feature_2_title_translations?.id && String(activeItem.feature_2_title_translations.id).trim() !== '') ||
        (activeItem?.feature_2_desc && String(activeItem.feature_2_desc).trim() !== '') ||
        (activeItem?.feature_2_desc_translations?.id && String(activeItem.feature_2_desc_translations.id).trim() !== '')
    );
    const f2IconName = activeItem?.feature_2_icon || 'Award';
    const Feature2IconComp = ICON_MAP[f2IconName] || Award;
    const f2TitleText = isF2Defined && activeItem ? getTranslatedText(activeItem.feature_2_title_translations, activeItem.feature_2_title) : '';
    const f2DescText = isF2Defined && activeItem ? getTranslatedText(activeItem.feature_2_desc_translations, activeItem.feature_2_desc) : '';

    const hasFeature1 = isF1Defined && Boolean(f1TitleText || f1DescText);
    const hasFeature2 = isF2Defined && Boolean(f2TitleText || f2DescText);
    const hasAnyFeature = hasFeature1 || hasFeature2;

    // Button
    const isBtnDefined = Boolean(
        (activeItem?.button_text && String(activeItem.button_text).trim() !== '') ||
        (activeItem?.button_text_translations?.id && String(activeItem.button_text_translations.id).trim() !== '')
    );
    const btnText = isBtnDefined && activeItem ? getTranslatedText(activeItem.button_text_translations, activeItem.button_text) : '';

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
            {/* Premium Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent md:bg-gradient-to-r" />
            <div className="absolute inset-0 bg-black/30 md:hidden" />

            {/* Content Container */}
            <div className="relative z-10 max-w-8xl mx-auto px-6 md:px-14 py-16 md:py-24 w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Teks & Deskripsi Kiri */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="flex flex-col space-y-6 text-white max-w-xl"
                >
                    {/* Badge Atas (Opsional) */}
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

                    {/* Judul & Caption (Opsional) */}
                    {(titleText || descText) && (
                        <div className="space-y-3">
                            {titleText && (
                                <motion.h2
                                    variants={itemVariants}
                                    style={activeItem?.text_color ? { color: activeItem.text_color, WebkitTextFillColor: activeItem.text_color, backgroundImage: 'none' } : undefined}
                                    className="md:leading-[60px] text-3xl md:text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200"
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
                                    <div className="p-2 bg-blue-950/40 border border-amber-500/30 rounded-lg text-amber-400 backdrop-blur-sm shrink-0">
                                        <Feature1IconComp className="w-5 h-5" />
                                    </div>
                                    <div>
                                        {f1TitleText && (
                                            <h4 className="text-sm font-semibold text-amber-200">
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
                                    <div className="p-2 bg-blue-950/40 border border-amber-500/30 rounded-lg text-amber-400 backdrop-blur-sm shrink-0">
                                        <Feature2IconComp className="w-5 h-5" />
                                    </div>
                                    <div>
                                        {f2TitleText && (
                                            <h4 className="text-sm font-semibold text-amber-200">
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

                    {/* Tombol Buy Now / CTA (Opsional) */}
                    {btnText && (
                        <motion.div variants={itemVariants} className="pt-4">
                            {isFullExternal ? (
                                <a
                                    href={targetUrl}
                                    style={{
                                        ...(activeItem?.button_color ? { backgroundColor: activeItem.button_color, backgroundImage: 'none' } : {}),
                                        ...(activeItem?.button_text_color ? { color: activeItem.button_text_color } : {})
                                    }}
                                    className={`group relative inline-flex items-center justify-center px-8 py-3.5 font-medium tracking-wide transition-all duration-300 ease-in-out ${activeItem?.button_color ? '' : 'bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500'
                                        } ${activeItem?.button_text_color ? '' : 'text-blue-950'
                                        } rounded-xl shadow-[0_4px_20px_rgba(245,158,11,0.3)] hover:shadow-[0_4px_25px_rgba(245,158,11,0.5)] hover:scale-[1.02] active:scale-[0.98] overflow-hidden`}
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
                                    style={{
                                        ...(activeItem?.button_color ? { backgroundColor: activeItem.button_color, backgroundImage: 'none' } : {}),
                                        ...(activeItem?.button_text_color ? { color: activeItem.button_text_color } : {})
                                    }}
                                    className={`group relative inline-flex items-center justify-center px-8 py-3.5 font-medium tracking-wide transition-all duration-300 ease-in-out ${activeItem?.button_color ? '' : 'bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500'
                                        } ${activeItem?.button_text_color ? '' : 'text-blue-950'
                                        } rounded-xl shadow-[0_4px_20px_rgba(245,158,11,0.3)] hover:shadow-[0_4px_25px_rgba(245,158,11,0.5)] hover:scale-[1.02] active:scale-[0.98] overflow-hidden`}
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
                    )}
                </motion.div>

                {/* Kolom Kanan dikosongkan secara strategis agar botol madu di background kanan tidak tertutup teks */}
                <div className="hidden md:block" />
            </div>
        </section>
    );
}
