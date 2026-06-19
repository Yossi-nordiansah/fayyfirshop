import React from "react";
import { router } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, X, AlertTriangle } from "lucide-react";

export default function LogoutConfirmModal({ isOpen, onClose, t, isAdmin = false }) {
    if (!t) return null;

    const handleConfirm = () => {
        onClose();
        router.post(route("logout"));
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-zinc-950/40 backdrop-blur-md"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.92, opacity: 0, y: 16 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.92, opacity: 0, y: 16 }}
                        transition={{ type: "spring", duration: 0.35 }}
                        className={`relative w-full max-w-sm overflow-hidden rounded-2xl p-8 shadow-2xl ${
                            isAdmin
                                ? "bg-slate-900 border border-white/10 text-white"
                                : "bg-white border border-zinc-200/50 text-zinc-900"
                        }`}
                    >
                        {/* Ambient glow */}
                        <div className="absolute -top-20 -left-20 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className={`absolute top-4 right-4 transition-colors ${
                                isAdmin
                                    ? "text-zinc-400 hover:text-zinc-200"
                                    : "text-zinc-400 hover:text-zinc-600"
                            }`}
                        >
                            <X size={18} />
                        </button>

                        <div className="text-center">
                            {/* Icon */}
                            <motion.div
                                initial={{ scale: 0, rotate: -20 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", delay: 0.05, duration: 0.45 }}
                                className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full ${
                                    isAdmin
                                        ? "bg-rose-500/10 text-rose-400"
                                        : "bg-rose-50 text-rose-500"
                                }`}
                            >
                                <LogOut size={30} className="stroke-[1.5]" />
                            </motion.div>

                            {/* Warning badge */}
                            <div className={`inline-flex items-center gap-1.5 mb-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                isAdmin
                                    ? "bg-amber-500/10 text-amber-400"
                                    : "bg-amber-50 text-amber-600"
                            }`}>
                                <AlertTriangle size={10} />
                                {t("logout.confirm.badge", "Konfirmasi")}
                            </div>

                            <h3 className={`text-xl font-bold mb-2 ${
                                isAdmin
                                    ? "text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-300"
                                    : "text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-orange-500"
                            }`}>
                                {t("logout.confirm.title", "Keluar dari Akun?")}
                            </h3>

                            <p className={`text-sm leading-relaxed mb-7 ${
                                isAdmin ? "text-zinc-400" : "text-zinc-500"
                            }`}>
                                {isAdmin
                                    ? t("logout.confirm.message_admin", "Sesi administrator Anda akan diakhiri secara aman. Anda harus login kembali untuk mengakses panel.")
                                    : t("logout.confirm.message_customer", "Anda akan keluar dari akun Anda. Keranjang belanja Anda akan tetap tersimpan.")}
                            </p>

                            {/* Action buttons */}
                            <div className="flex gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onClose}
                                    className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                                        isAdmin
                                            ? "bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10"
                                            : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                                    }`}
                                >
                                    {t("logout.confirm.cancel", "Batal")}
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleConfirm}
                                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <LogOut size={14} />
                                    {t("logout.confirm.confirm", "Ya, Keluar")}
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
