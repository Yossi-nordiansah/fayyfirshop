import React, { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { useLanguage } from '@/Contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, KeyRound, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';

export default function ChangePasswordModal({ isOpen, onClose }) {
    const { t } = useLanguage();

    // Menggunakan Form Helper bawaan Inertia.js
    const { data, setData, put, errors, processing, reset, clearErrors } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    // State untuk toggle visibilitas password
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // State sukses — tampilkan pesan di dalam modal sebelum auto-close
    const [showSuccess, setShowSuccess] = useState(false);

    // Auto-close modal 1.8 detik setelah sukses
    useEffect(() => {
        if (!showSuccess) return;
        const timer = setTimeout(() => {
            setShowSuccess(false);
            reset();
            onClose();
        }, 1800);
        return () => clearTimeout(timer);
    }, [showSuccess]);

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => {
                setShowSuccess(true);
            },
            onError: () => {
                // Errors otomatis ditampilkan via `errors` dari useForm
            },
        });
    };

    const handleClose = () => {
        if (processing) return; // Jangan close saat sedang proses
        clearErrors();
        reset();
        setShowSuccess(false);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        key="change-pw-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    />

                    {/* Modal Card */}
                    <motion.div
                        key="change-pw-modal"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-2xl z-10"
                    >
                        {/* Aksen Garis Gold Atas */}
                        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-amber-500 to-transparent" />

                        {/* ── Tampilan Sukses ── */}
                        <AnimatePresence>
                            {showSuccess && (
                                <motion.div
                                    key="success-overlay"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white rounded-2xl p-8 text-center"
                                >
                                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
                                    >
                                        <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                                    </motion.div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-1">
                                        {t('auth.password.success_title', 'Kata Sandi Diperbarui!')}
                                    </h3>
                                    <p className="text-sm text-slate-500">
                                        {t('auth.password.success_desc', 'Kata sandi Anda telah berhasil diubah.')}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ── Header Modal ── */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <KeyRound className="h-5 w-5 text-blue-900" />
                                <h2 className="text-xl font-bold tracking-wide text-blue-950">
                                    {t('auth.password.modal_title', 'Ubah Kata Sandi')}
                                </h2>
                            </div>
                            <button
                                onClick={handleClose}
                                disabled={processing}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors disabled:opacity-40"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* ── Form Body ── */}
                        <form onSubmit={handleSubmit} className="space-y-4">

                            {/* 1. Kata Sandi Lama */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    {t('auth.password.current_label', 'Kata Sandi Lama')}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showCurrent ? 'text' : 'password'}
                                        value={data.current_password}
                                        onChange={e => setData('current_password', e.target.value)}
                                        placeholder={t('auth.password.current_placeholder', 'Masukkan kata sandi lama Anda')}
                                        className={`w-full rounded-xl border bg-slate-50 py-3 pl-4 pr-10 text-sm text-slate-800 outline-none focus:bg-white transition-all duration-200 ${
                                            errors.current_password
                                                ? 'border-red-400 focus:border-red-500'
                                                : 'border-slate-300 focus:border-amber-500'
                                        }`}
                                        required
                                        disabled={processing}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrent(!showCurrent)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        tabIndex={-1}
                                    >
                                        {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {errors.current_password && (
                                    <p className="text-xs text-red-600 font-medium mt-1">{errors.current_password}</p>
                                )}
                            </div>

                            {/* 2. Kata Sandi Baru */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    {t('auth.password.new_label', 'Kata Sandi Baru')}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showNew ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={e => setData('password', e.target.value)}
                                        placeholder={t('auth.password.new_placeholder', 'Minimal 8 karakter')}
                                        className={`w-full rounded-xl border bg-slate-50 py-3 pl-4 pr-10 text-sm text-slate-800 outline-none focus:bg-white transition-all duration-200 ${
                                            errors.password
                                                ? 'border-red-400 focus:border-red-500'
                                                : 'border-slate-300 focus:border-amber-500'
                                        }`}
                                        required
                                        disabled={processing}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNew(!showNew)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        tabIndex={-1}
                                    >
                                        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-xs text-red-600 font-medium mt-1">{errors.password}</p>
                                )}
                            </div>

                            {/* 3. Konfirmasi Kata Sandi Baru */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    {t('auth.password.confirm_label', 'Konfirmasi Kata Sandi Baru')}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        value={data.password_confirmation}
                                        onChange={e => setData('password_confirmation', e.target.value)}
                                        placeholder={t('auth.password.confirm_placeholder', 'Ulangi kata sandi baru Anda')}
                                        className={`w-full rounded-xl border bg-slate-50 py-3 pl-4 pr-10 text-sm text-slate-800 outline-none focus:bg-white transition-all duration-200 ${
                                            errors.password_confirmation
                                                ? 'border-red-400 focus:border-red-500'
                                                : 'border-slate-300 focus:border-amber-500'
                                        }`}
                                        required
                                        disabled={processing}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        tabIndex={-1}
                                    >
                                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {errors.password_confirmation && (
                                    <p className="text-xs text-red-600 font-medium mt-1">{errors.password_confirmation}</p>
                                )}
                            </div>

                            {/* ── Action Buttons ── */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    disabled={processing}
                                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors disabled:opacity-50"
                                >
                                    {t('auth.password.btn_cancel', 'Batal')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-900 to-indigo-950 hover:from-blue-800 hover:to-indigo-900 shadow-md shadow-blue-900/10 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    {processing && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {t('auth.password.btn_submit', 'Perbarui Kata Sandi')}
                                </button>
                            </div>

                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}