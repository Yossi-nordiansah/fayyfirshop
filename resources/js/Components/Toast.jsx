import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/Contexts/LanguageContext";

export default function Toast({ show, message, onClose, duration = 3000 }) {
    const { t, locale } = useLanguage();

    useEffect(() => {
        if (show && onClose) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [show, onClose, duration]);

    const getToastMessage = () => {
        if (message) return message;
        
        // Try translating using the system lang files
        const systemTranslated = t("payment.copied");
        if (systemTranslated !== "payment.copied") {
            return systemTranslated;
        }

        // Internal backup localization map
        const defaultMessages = {
            indonesia: "Berhasil disalin ke clipboard!",
            english: "Copied to clipboard!",
            arabic: "تم النسخ إلى الحافظة!",
        };

        return defaultMessages[locale] || defaultMessages["indonesia"];
    };

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center md:items-end md:pb-6"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        onClick={(e) => e.stopPropagation()}
                        className="pointer-events-auto flex items-center gap-2 px-4 py-3 bg-slate-900/95 text-white text-xs font-bold rounded-2xl shadow-xl backdrop-blur-md border border-white/10"
                    >
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                        <span className="whitespace-nowrap">{getToastMessage()}</span>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
