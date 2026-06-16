import React from "react";
import { useLanguage } from "@/Contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Activity, Check, Ticket, ShoppingBag, Truck } from "lucide-react";

export default function OrderSummary({
    cartItems,
    selectedBranch,
    selectedRate,
    subtotal,
    shippingCost,
    grandTotal,
    errorMsg,
    isPlacingOrder,
    formatPrice,
    formatNumber,
    handlePlaceOrder,
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
    totalWeight = 0,
    appliedReferral = null,
    referralDiscount = 0,
    removeReferral,
}) {
    const { t, locale } = useLanguage();

    const formatWeight = (grams) => {
        if (grams >= 1000) {
            return `${(grams / 1000).toFixed(2)} kg`;
        }
        return `${grams} ${t("checkout.summary.grams", "gram")}`;
    };

    return (
        <aside className="p-6 border shadow-xl h-fit rounded-3xl border-slate-100 bg-white lg:sticky lg:top-28 backdrop-blur-md">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <ShoppingBag className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-extrabold text-slate-950">
                    {t("cart.summary", "Ringkasan Pesanan")}
                </h2>
            </div>

            {/* Items List */}
            <div className="py-4 space-y-3.5 border-b border-slate-100 max-h-60 overflow-y-auto custom-scrollbar">
                {cartItems.map(item => (
                    <div key={`${item.id}-${item.variantId ?? 'base'}`} className="flex gap-3 text-xs items-center">
                        <img
                            src={item.image}
                            alt={item.title}
                            className="w-12 h-12 object-cover rounded-xl bg-slate-50 border border-slate-100 shrink-0 shadow-sm"
                        />
                        <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-slate-900 truncate">
                                {item.title_translations?.[locale] || item.title}
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-0.5 truncate font-medium">
                                {item.variantNameTranslations?.[locale] || item.variantName ? (
                                    `${item.variantNameTranslations?.[locale] || item.variantName}`
                                ) : (
                                    item.color ? `${t("product.color", "Color")}: ${item.color}` : ''
                                )}
                                {item.subVariantNameTranslations?.[locale] || item.subVariantName ? (
                                    ` | ${t("product.size", "Size")}: ${item.subVariantNameTranslations?.[locale] || item.subVariantName}`
                                ) : (
                                    item.size ? ` | ${item.size}` : ''
                                )}
                                <span className="text-amber-600 font-bold ml-1">
                                    {` x ${formatNumber(item.quantity)}`}
                                </span>
                            </p>
                        </div>
                        <span className="font-extrabold text-slate-900 text-right shrink-0">
                            {formatPrice(item.price * item.quantity)}
                        </span>
                    </div>
                ))}
            </div>

            {/* Shipping point details */}
            {(selectedBranch || totalWeight > 0) && (
                <div className="py-3.5 border-b border-slate-100 text-[11px] text-slate-500 space-y-2 bg-slate-50/50 p-3 rounded-2xl mt-4">
                    {selectedBranch && (
                        <div className="flex justify-between items-center">
                            <span className="font-medium">{t("checkout.summary.branch", "Gudang Pengirim:")}</span>
                            <strong className="text-slate-800 font-bold">{selectedBranch.name}</strong>
                        </div>
                    )}
                    {selectedBranch && (
                        <div className="flex justify-between items-center">
                            <span className="font-medium">{t("checkout.summary.shipping_method", "Metode Kirim:")}</span>
                            <strong className="text-slate-800 font-bold">
                                {selectedRate ? `${selectedRate.courier_name} (${selectedRate.courier_service_name})` : '-'}
                            </strong>
                        </div>
                    )}
                    {totalWeight > 0 && (
                        <div className="flex justify-between items-center">
                            <span className="font-medium">{t("checkout.summary.total_weight", "Total Berat:")}</span>
                            <strong className="text-slate-800 font-bold">{formatWeight(totalWeight)}</strong>
                        </div>
                    )}
                </div>
            )}

            {/* Financial breakdown */}
            <div className="py-4 space-y-2.5 border-b border-slate-100 text-sm font-medium mt-1">
                <div className="flex justify-between text-slate-600">
                    <span>{t("cart.subtotal", "Subtotal")}</span>
                    <span className="font-bold text-slate-900">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                    <span>{t("checkout.shipping_fee", "Ongkos Kirim")}</span>
                    <span className="font-bold text-slate-900">
                        {selectedRate ? formatPrice(shippingCost) : '-'}
                    </span>
                </div>

                <AnimatePresence>
                    {appliedManualVoucher && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex justify-between text-emerald-600 font-semibold"
                        >
                            <span className="truncate max-w-[70%]">{appliedManualVoucher.name}</span>
                            <span>-{formatPrice(manualDiscount)}</span>
                        </motion.div>
                    )}
                    {appliedEventVoucher && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex justify-between text-emerald-600 font-semibold"
                        >
                            <span className="truncate max-w-[70%]">{appliedEventVoucher.name}</span>
                            <span>-{formatPrice(eventDiscount)}</span>
                        </motion.div>
                    )}
                    {appliedReferral && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex justify-between text-indigo-600 font-semibold"
                        >
                            <span>{t("checkout.voucher.referral_label", "Referral")} ({appliedReferral.code})</span>
                            <span>-{formatPrice(referralDiscount)}</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Voucher Section */}
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

            <div className="flex items-center justify-between py-4 mb-4">
                <span className="text-base font-extrabold text-slate-900">{t("cart.total", "Total")}</span>
                <span className="text-xl font-black text-blue-950 tracking-tight">{formatPrice(grandTotal)}</span>
            </div>

            <AnimatePresence>
                {errorMsg && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="p-3 mb-4 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex gap-1.5 items-center"
                    >
                        <AlertCircle size={14} className="shrink-0" />
                        <span>{errorMsg}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder || cartItems.length === 0}
                className="w-full py-4 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white text-sm font-bold rounded-2xl shadow-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-blue-900/50 hover:brightness-110"
            >
                {isPlacingOrder ? (
                    <>
                        <Activity size={16} className="animate-spin text-amber-400" />
                        <span>{t("checkout.button.processing", "Memproses Pesanan...")}</span>
                    </>
                ) : (
                    <>
                        <Check size={16} className="text-amber-400 stroke-[3px]" />
                        <span>{t("checkout.button.place_order", "Buat Pesanan & Bayar")}</span>
                    </>
                )}
            </motion.button>

            <p className="mt-3.5 text-[10px] text-center text-slate-400 leading-relaxed font-medium px-2">
                {t("checkout.disclaimer", "Dengan menekan tombol di atas, Anda menyetujui transaksi pembelian & pengiriman barang sesuai ketentuan toko.")}
            </p>
        </aside>
    );
}