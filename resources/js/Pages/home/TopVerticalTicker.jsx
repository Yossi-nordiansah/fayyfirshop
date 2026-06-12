import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/Contexts/LanguageContext';
import { usePage } from '@inertiajs/react';
import promoItems from '@/data-source/promo_items';
import { Plane, Sparkles, ShieldCheck, Gem, Gift } from 'lucide-react';

const LucideIcons = {
    Plane,
    Sparkles,
    ShieldCheck,
    Gem,
    Gift
};

export default function TopVerticalTicker() {
    const { t, locale } = useLanguage();
    const { activePromoTickers = [] } = usePage().props;
    const [currentIndex, setCurrentIndex] = useState(0);

    const itemsToShow = activePromoTickers || [];

    useEffect(() => {
        if (itemsToShow.length === 0) return;
        const timer = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % itemsToShow.length);
        }, 4000);
        return () => clearInterval(timer);
    }, [itemsToShow.length]);

    if (itemsToShow.length === 0) return null;

    const currentPromo = itemsToShow[currentIndex];

    // Resolve icon rendering
    const renderIcon = () => {
        if (!currentPromo || !currentPromo.icon) {
            return <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />;
        }

        // If the icon is a React component/function (from fallback dummy data-source)
        if (typeof currentPromo.icon === 'function' || (typeof currentPromo.icon === 'object' && currentPromo.icon.$$typeof)) {
            const IconComponent = currentPromo.icon;
            return <IconComponent className="w-4 h-4 text-amber-400 shrink-0" />;
        }

        // If the icon is a string path to uploaded file (from database)
        if (typeof currentPromo.icon === 'string' && currentPromo.icon.includes('/')) {
            return (
                <img
                    src={`/storage/${currentPromo.icon}`}
                    className="w-4 h-4 object-contain shrink-0"
                    alt="Promo Icon"
                />
            );
        }

        // If the icon is a string name of Lucide icon (from database seeded default values)
        if (typeof currentPromo.icon === 'string') {
            const IconComponent = LucideIcons[currentPromo.icon] || Sparkles;
            return <IconComponent className="w-4 h-4 text-amber-400 shrink-0" />;
        }

        return <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />;
    };

    // Resolve text translations
    const getPromoText = () => {
        if (!currentPromo) return '';
        if (currentPromo.text_translations) {
            if (locale === 'indonesia') return currentPromo.text_translations.id || currentPromo.text;
            if (locale === 'english') return currentPromo.text_translations.en || currentPromo.text;
            if (locale === 'arabic') return currentPromo.text_translations.ar || currentPromo.text;
            return currentPromo.text;
        }
        return t(currentPromo.key, currentPromo.defaultText);
    };

    return (
        <>
            <style dangerouslySetInnerHTML={{
                __html: `
                    :root {
                        --ticker-height: 44px;
                    }
                    body {
                        padding-top: 44px;
                    }
                    @media (min-width: 768px) {
                        :root {
                            --ticker-height: 36px;
                        }
                        body {
                            padding-top: 36px;
                        }
                    }
                `
            }} />
            <div className="fixed top-0 left-0 right-0 w-full bg-[#03153d] text-slate-100 md:h-9 h-11 py-2 overflow-hidden border-b border-amber-500/20 shadow-sm z-[110]">
                <div className="flex items-center justify-center h-full px-4 mx-auto max-w-7xl">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            // Animasi masuk dari bawah dan keluar ke atas (Vertikal)
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                            className="flex items-center justify-center gap-2 text-xs font-medium tracking-wide text-center select-none md:text-sm"
                        >
                            {/* Render Icon */}
                            {renderIcon()}

                            {/* Teks Promo Multi-bahasa */}
                            <span className="text-slate-200">
                                {getPromoText()}
                            </span>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </>
    );
}
