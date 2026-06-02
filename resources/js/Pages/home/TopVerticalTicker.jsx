import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/Contexts/LanguageContext'; // Pastikan path ini sesuai dengan project Anda
import promoItems from '@/data-source/promo_items'; // Pastikan path ini sesuai dengan project Anda

export default function TopVerticalTicker() {
    const { t } = useLanguage();
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % promoItems.length);
        }, 4000);
        return () => clearInterval(timer);
    }, [promoItems.length]);

    const CurrentIcon = promoItems[currentIndex].icon;

    return (
        <div className="relative w-full bg-[#03153d] text-slate-100 md:h-9 h-11 py-2 overflow-hidden border-b border-amber-500/20 shadow-sm z-[110]">
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
                        {/* Icon Dinamis Mewah Berwarna Emas */}
                        <CurrentIcon className="w-4 h-4 text-amber-400 shrink-0" />

                        {/* Teks Promo Multi-bahasa */}
                        <span className="text-slate-200">
                            {t(promoItems[currentIndex].key, promoItems[currentIndex].defaultText)}
                        </span>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
