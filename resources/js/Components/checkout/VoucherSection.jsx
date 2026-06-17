import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ticket, AlertCircle, Check } from "lucide-react";

export default function VoucherSection({
    userVouchers = [],
    voucherCode = "",
    setVoucherCode,
    appliedManualVoucher = null,
    appliedEventVoucher = null,
    manualDiscount = 0,
    eventDiscount = 0,
    applyManualVoucher,
    applyEventVoucher,
    removeManualVoucher,
    removeEventVoucher,
    voucherError = "",
    voucherSuccess = "",
    isApplyingVoucher = false,
    appliedReferral = null,
    referralDiscount = 0,
    removeReferral,
    formatPrice,
    t,
}) {
    return (
        <div className="py-4 border-b border-slate-100 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5 text-amber-500" />
                {t("checkout.voucher.title", "Kupon / Voucher Belanja")}
            </h3>

            {/* 1. Manual Voucher Slot */}
            <AnimatePresence mode="wait">
                {appliedManualVoucher ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-800"
                    >
                        <div className="flex gap-2.5 items-start min-w-0">
                            <Ticket className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                            <div className="min-w-0">
                                <span className="font-extrabold uppercase bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[9px] tracking-wide block w-fit mb-1 border border-emerald-200">
                                    {t("checkout.voucher.badge_owned", "Voucher Saya")}
                                </span>
                                <span className="font-bold block truncate text-slate-800">{appliedManualVoucher.name}</span>
                                <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                                    {t("checkout.voucher.discount_text", "Diskon")} {formatPrice(manualDiscount)}
                                </span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={removeManualVoucher}
                            className="text-xs font-bold text-rose-600 hover:text-rose-700 shrink-0 px-2.5 py-1.5 rounded-xl hover:bg-rose-50 transition-colors"
                        >
                            {t("checkout.voucher.remove", "Hapus")}
                        </button>
                    </motion.div>
                ) : (
                    userVouchers.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-1.5"
                        >
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                                {t("checkout.voucher.ready_to_use", "Gunakan Voucher Anda")}
                            </label>
                            <select
                                onChange={(e) => e.target.value && applyManualVoucher(e.target.value)}
                                defaultValue=""
                                className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-900 focus:bg-white transition"
                            >
                                <option value="">-- {t("checkout.voucher.select_option", "Pilih Voucher")} --</option>
                                {userVouchers.map(v => (
                                    <option key={v.id} value={v.id}>
                                        {v.code} - {v.name} ({v.type === 'percentage' ? `${parseFloat(v.value)}%` : formatPrice(v.value)})
                                    </option>
                                ))}
                            </select>
                        </motion.div>
                    )
                )}
            </AnimatePresence>

            {/* 2. Event Voucher / Referral Code Slot */}
            <AnimatePresence mode="wait">
                {appliedEventVoucher ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-800"
                    >
                        <div className="flex gap-2.5 items-start min-w-0">
                            <Ticket className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                            <div className="min-w-0">
                                <span className="font-extrabold uppercase bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[9px] tracking-wide block w-fit mb-1 border border-emerald-200">
                                    {appliedEventVoucher.code} ({t("checkout.voucher.badge_event", "Event")})
                                </span>
                                <span className="font-bold block truncate text-slate-800">{appliedEventVoucher.name}</span>
                                <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                                    {t("checkout.voucher.discount_text", "Diskon")} {formatPrice(eventDiscount)}
                                </span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={removeEventVoucher}
                            className="text-xs font-bold text-rose-600 hover:text-rose-700 shrink-0 px-2.5 py-1.5 rounded-xl hover:bg-rose-50 transition-colors"
                        >
                            {t("checkout.voucher.remove", "Hapus")}
                        </button>
                    </motion.div>
                ) : appliedReferral ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex items-center justify-between gap-3 text-xs text-indigo-900"
                    >
                        <div className="flex gap-2.5 items-start min-w-0">
                            <Ticket className="w-4 h-4 text-indigo-600 shrink-0 mt-1" />
                            <div className="min-w-0">
                                <span className="font-extrabold uppercase bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-[9px] tracking-wide block w-fit mb-1 border border-indigo-200">
                                    {appliedReferral.code} ({t("checkout.voucher.referral_label", "Referral")})
                                </span>
                                <span className="font-bold block truncate text-slate-800">{appliedReferral.name}</span>
                                <span className="text-[10px] text-indigo-600 font-bold block mt-0.5">
                                    {t("checkout.voucher.discount_text", "Diskon")} {formatPrice(referralDiscount)}
                                </span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={removeReferral}
                            className="text-xs font-bold text-rose-600 hover:text-rose-700 shrink-0 px-2.5 py-1.5 rounded-xl hover:bg-rose-50 transition-colors"
                        >
                            {t("checkout.voucher.remove", "Hapus")}
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-1.5"
                    >
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                            {t("checkout.voucher.input_code", "Punya Kode Promo / Referral?")}
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder={t("checkout.voucher.placeholder", "Contoh: RAMADAN15 atau REFXXXX")}
                                value={voucherCode}
                                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                                className="flex-1 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-900 focus:bg-white transition uppercase layout-arabic-right"
                            />
                            <button
                                type="button"
                                onClick={() => applyEventVoucher(voucherCode)}
                                disabled={isApplyingVoucher || !voucherCode.trim()}
                                className="px-4 py-2.5 bg-blue-950 text-white text-xs font-bold rounded-xl hover:bg-blue-900 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-sm"
                            >
                                {isApplyingVoucher ? t("common.loading", "Loading...") : t("checkout.voucher.apply", "Terapkan")}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Feedback messages */}
            <AnimatePresence>
                {voucherError && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="p-2.5 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-100 rounded-xl flex gap-1.5 items-center"
                    >
                        <AlertCircle size={12} className="shrink-0" />
                        <span>{voucherError}</span>
                    </motion.div>
                )}
                {voucherSuccess && !voucherError && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="p-2.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl flex gap-1.5 items-center"
                    >
                        <Check size={12} className="shrink-0 text-emerald-600" />
                        <span>{voucherSuccess}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
