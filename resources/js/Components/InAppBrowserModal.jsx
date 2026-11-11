import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, ExternalLink, Copy, Check, Compass, Smartphone } from 'lucide-react';
import { useLanguage } from '@/Contexts/LanguageContext';
import { isAndroid, openAndroidChromeIntent } from '@/Utils/browserHelper';

export default function InAppBrowserModal({
    isOpen,
    onClose,
    onProceedAnyway,
}) {
    const { t, locale } = useLanguage();
    const isRtl = locale === 'arabic';
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (typeof window === 'undefined') return;
        try {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch {
            // fallback
            const input = document.createElement('input');
            input.value = window.location.href;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    const handleOpenChrome = () => {
        openAndroidChromeIntent(window.location.href);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm"
                    style={{ direction: isRtl ? 'rtl' : 'ltr' }}
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0"
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', duration: 0.4 }}
                        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-amber-200/50 bg-white p-6 md:p-8 text-zinc-900 shadow-2xl"
                    >
                        {/* Ambient glow */}
                        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} text-zinc-400 hover:text-zinc-600 transition-colors p-1 rounded-full hover:bg-zinc-100`}
                        >
                            <X size={20} className="text-zinc-500" />
                        </button>

                        <div className="text-center">
                            {/* Icon */}
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 shadow-sm">
                                <AlertTriangle size={28} className="stroke-[2]" />
                            </div>

                            <span className="inline-block px-3 py-1 rounded-full bg-amber-100/80 text-amber-800 text-[11px] font-semibold tracking-wide uppercase mb-2">
                                {t('auth.in_app.badge', 'Browser Aplikasi Terdeteksi')}
                            </span>

                            <h3 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight mb-2">
                                {t('auth.in_app.title', 'Buka di Browser Utama (Chrome/Safari)')}
                            </h3>

                            <p className="text-xs text-slate-600 leading-relaxed mb-5">
                                {t(
                                    'auth.in_app.desc',
                                    'Google secara ketat membatasi login di dalam browser aplikasi (Instagram, TikTok, WhatsApp) demi keamanan akun Anda.'
                                )}
                            </p>

                            {/* Step-by-step guidance card */}
                            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-left mb-5 space-y-2.5 text-xs text-slate-700">
                                <div className="font-semibold text-slate-900 flex items-center gap-1.5 pb-1 border-b border-slate-200">
                                    <Smartphone size={14} className="text-amber-600" />
                                    <span>{t('auth.in_app.steps_title', 'Cara Mudah Melanjutkan:')}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">1</span>
                                    <span>{t('auth.in_app.step_1', 'Ketuk ikon titik tiga (⋮ atau ···) atau ikon Bagikan di pojok layar aplikasi Anda.')}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">2</span>
                                    <span>{t('auth.in_app.step_2', 'Pilih menu "Buka di Browser" / "Open in Chrome / Safari".')}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">3</span>
                                    <span>{t('auth.in_app.step_3', 'Lanjutkan proses login dengan Google seperti biasa.')}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="space-y-2.5">
                                {isAndroid() && (
                                    <button
                                        type="button"
                                        onClick={handleOpenChrome}
                                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold uppercase tracking-wider py-3 rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-98"
                                    >
                                        <Compass size={16} />
                                        <span>{t('auth.in_app.btn_chrome', 'Buka Langsung di Chrome')}</span>
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-semibold py-2.5 rounded-xl transition-all active:scale-98"
                                >
                                    {copied ? (
                                        <>
                                            <Check size={16} className="text-emerald-600" />
                                            <span className="text-emerald-700 font-bold">{t('auth.in_app.copied', 'Tautan Berhasil Disalin! Buka di Browser')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={16} />
                                            <span>{t('auth.in_app.btn_copy', 'Salin Tautan Website')}</span>
                                        </>
                                    )}
                                </button>

                                <div className="pt-2 flex items-center justify-between text-xs">
                                    <button
                                        type="button"
                                        onClick={onProceedAnyway}
                                        className="text-slate-400 hover:text-slate-600 underline text-[11px] transition-colors"
                                    >
                                        {t('auth.in_app.btn_proceed_anyway', 'Tetap Coba Login Google')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="text-slate-600 hover:text-slate-900 font-medium text-[11px] transition-colors"
                                    >
                                        {t('common.close', 'Tutup')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
