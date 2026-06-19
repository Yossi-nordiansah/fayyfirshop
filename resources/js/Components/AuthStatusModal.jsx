import React, { useState, useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, X } from 'lucide-react';
import { useLanguage } from '@/Contexts/LanguageContext';

export default function AuthStatusModal({
    isOpen: manualIsOpen,
    onClose: manualOnClose,
    type: manualType,
    title: manualTitle,
    message: manualMessage,
    isAdmin: manualIsAdmin = false,
}) {
    const { flash } = usePage().props;
    const { t, locale } = useLanguage();

    const [isOpen, setIsOpen] = useState(false);
    const [modalType, setModalType] = useState('success');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [isAdminMode, setIsAdminMode] = useState(false);

    // Prevent re-opening after user dismisses the flash modal
    const flashShownRef = useRef(false);
    const isManualMode = manualIsOpen !== undefined;

    // Manual control mode (driven by parent props)
    useEffect(() => {
        if (!isManualMode) return;
        setIsOpen(manualIsOpen);
        if (manualType) setModalType(manualType);
        if (manualTitle) setTitle(manualTitle);
        if (manualMessage) setMessage(manualMessage);
        setIsAdminMode(manualIsAdmin);
    }, [manualIsOpen, manualType, manualTitle, manualMessage, manualIsAdmin, isManualMode]);

    // Auto flash-message mode — fire when login_status or logout_status value changes
    const loginStatus = flash?.login_status ?? null;
    const logoutStatus = flash?.logout_status ?? null;

    useEffect(() => {
        if (isManualMode) return;

        if (loginStatus) {
            // Always reset ref when a new flash value arrives
            flashShownRef.current = false;
        }
        if (logoutStatus) {
            flashShownRef.current = false;
        }

        if (flashShownRef.current) return;

        if (loginStatus) {
            flashShownRef.current = true;
            const isAdmin = loginStatus.includes('admin');
            setIsAdminMode(isAdmin);
            setModalType('success');
            setTitle(t('auth.status.login_success_title', 'Login Berhasil'));
            setMessage(
                isAdmin
                    ? t('auth.status.login_success_admin', 'Akses Diberikan. Selamat datang di Panel Administrasi.')
                    : t('auth.status.login_success_customer', 'Selamat datang kembali! Anda telah berhasil login ke akun Anda.')
            );
            setIsOpen(true);
        } else if (logoutStatus) {
            flashShownRef.current = true;
            const isAdmin = logoutStatus.includes('admin');
            setIsAdminMode(isAdmin);
            setModalType('success');
            setTitle(t('auth.status.logout_success_title', 'Logout Berhasil'));
            setMessage(
                isAdmin
                    ? t('auth.status.logout_success_admin', 'Sesi administrator telah diakhiri secara aman.')
                    : t('auth.status.logout_success_customer', 'Anda telah berhasil keluar dari akun Anda. Sampai jumpa lagi!')
            );
            setIsOpen(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loginStatus, logoutStatus, isManualMode]);

    const handleClose = () => {
        setIsOpen(false);
        if (manualOnClose) manualOnClose();
    };

    // Auto-close success modals after 5 seconds
    useEffect(() => {
        if (!isOpen || modalType !== 'success') return;
        const timer = setTimeout(handleClose, 5000);
        return () => clearTimeout(timer);
    }, [isOpen, modalType]);

    /* ── Styles ── */
    const backdropClass = 'fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md';

    const modalBgClass = isAdminMode
        ? 'relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-slate-900 p-8 text-white shadow-2xl shadow-blue-950/50'
        : 'relative w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200/50 bg-white p-8 text-zinc-900 shadow-2xl shadow-zinc-950/15';

    const titleClass =
        modalType === 'success'
            ? isAdminMode
                ? 'text-2xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200'
                : 'text-2xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500'
            : isAdminMode
                ? 'text-2xl font-bold tracking-wide text-rose-400'
                : 'text-2xl font-bold tracking-wide text-red-600';

    const messageClass = isAdminMode ? 'text-sm text-zinc-300' : 'text-sm text-zinc-600';

    const buttonClass =
        modalType === 'success'
            ? isAdminMode
                ? 'w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-sm font-bold uppercase tracking-widest py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-amber-500/25'
                : 'w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold uppercase tracking-widest py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-blue-600/20'
            : 'w-full bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold uppercase tracking-widest py-3.5 rounded-xl transition-all duration-300';

    const iconWrapperClass =
        modalType === 'success'
            ? isAdminMode
                ? 'mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-400'
                : 'mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500'
            : isAdminMode
                ? 'mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 text-rose-400'
                : 'mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500';

    const isRtl = locale === 'arabic';

    return (
        <AnimatePresence>
            {isOpen && (
                <div className={backdropClass} style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0"
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', duration: 0.4 }}
                        className={modalBgClass}
                    >
                        {/* Ambient glow */}
                        {isAdminMode ? (
                            <>
                                <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
                                <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
                            </>
                        ) : (
                            <>
                                <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
                                <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                            </>
                        )}

                        {/* Close button */}
                        <button
                            onClick={handleClose}
                            className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} text-zinc-400 hover:text-zinc-600 transition-colors`}
                        >
                            <X
                                size={20}
                                className={modalType === 'success' ? 'text-zinc-400' : 'text-red-500'}
                            />
                        </button>

                        <div className="text-center">
                            {/* Animated icon */}
                            <motion.div
                                initial={{ scale: 0, rotate: -45 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', delay: 0.1, duration: 0.5 }}
                                className={iconWrapperClass}
                            >
                                {modalType === 'success' ? (
                                    <CheckCircle2 size={40} className="stroke-[1.5]" />
                                ) : (
                                    <XCircle size={40} className="stroke-[1.5]" />
                                )}
                            </motion.div>

                            <h3 className={titleClass}>{title}</h3>

                            <p className={`${messageClass} mt-3 mb-6 leading-relaxed`}>{message}</p>

                            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                                <button onClick={handleClose} className={buttonClass}>
                                    {t('auth.status.btn_close', 'Ok')}
                                </button>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

