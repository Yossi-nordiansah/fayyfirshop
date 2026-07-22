import React from "react";
import { useLanguage } from "@/Contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Activity, Check, ShoppingBag } from "lucide-react";
import SummaryItem from "./SummaryItem";
import ShippingDetails from "./ShippingDetails";
import VoucherSection from "./VoucherSection";
import LoadingSpinner from "@/Components/LoadingSpinner";

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
                    <SummaryItem
                        key={`${item.id}-${item.variantId ?? 'base'}`}
                        item={item}
                        locale={locale}
                        formatNumber={formatNumber}
                        formatPrice={formatPrice}
                        t={t}
                    />
                ))}
            </div>

            {/* Shipping point details */}
            <ShippingDetails
                selectedBranch={selectedBranch}
                selectedRate={selectedRate}
                totalWeight={totalWeight}
                t={t}
            />

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
            <VoucherSection
                userVouchers={userVouchers}
                voucherCode={voucherCode}
                setVoucherCode={setVoucherCode}
                appliedManualVoucher={appliedManualVoucher}
                appliedEventVoucher={appliedEventVoucher}
                manualDiscount={manualDiscount}
                eventDiscount={eventDiscount}
                applyManualVoucher={applyManualVoucher}
                applyEventVoucher={applyEventVoucher}
                removeManualVoucher={removeManualVoucher}
                removeEventVoucher={removeEventVoucher}
                voucherError={voucherError}
                voucherSuccess={voucherSuccess}
                isApplyingVoucher={isApplyingVoucher}
                appliedReferral={appliedReferral}
                referralDiscount={referralDiscount}
                removeReferral={removeReferral}
                formatPrice={formatPrice}
                t={t}
            />

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
                        <LoadingSpinner className="w-5 h-5 shrink-0" />
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