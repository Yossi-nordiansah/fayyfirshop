import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Ticket, Copy, Check, Info } from "lucide-react";
import axios from "axios";

export default function UserVouchersModal({ isOpen, onClose, t, locale }) {
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [copiedCode, setCopiedCode] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            axios
                .get("/api/user-vouchers")
                .then((res) => {
                    setVouchers(res.data || []);
                })
                .catch((err) => {
                    console.error("Failed to fetch user vouchers:", err);
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setCopiedCode(null);
        }
    }, [isOpen]);

    const handleCopy = (code) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => {
            setCopiedCode(null);
        }, 2000);
    };

    const formatCurrency = (val) => {
        if (val === null || val === undefined) return "Rp 0";
        return `Rp ${Number(val).toLocaleString("id-ID")}`;
    };

    const formatCurrencyShort = (val) => {
        if (val === null || val === undefined) return "Rp 0";
        const num = Number(val);
        if (num >= 1000) {
            if (num % 1000 === 0) {
                return `Rp ${num / 1000}K`;
            }
            return `Rp ${(num / 1000).toFixed(1).replace(".0", "")}K`;
        }
        return `Rp ${num}`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        try {
            const dateParsed = dateStr.includes(" ") ? dateStr.replace(" ", "T") : dateStr;
            const d = new Date(dateParsed);
            return d.toLocaleDateString(
                locale === "indonesia" ? "id-ID" : locale === "arabic" ? "ar-SA" : "en-US",
                {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                }
            );
        } catch (e) {
            return dateStr;
        }
    };

    const isAr = locale === "arabic";

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-[9998] flex items-center justify-center p-4 text-left"
                    dir={isAr ? "rtl" : "ltr"}
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-zinc-950/40 backdrop-blur-md"
                    />

                    {/* Modal body */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 15 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 15 }}
                        transition={{ type: "spring", duration: 0.35 }}
                        className="relative w-full max-w-xl bg-white border border-zinc-200/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] z-10"
                    >
                        {/* Glowing aesthetics */}
                        <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-zinc-100 shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                                    <Ticket size={20} className="stroke-[1.5]" />
                                </div>
                                <h3 className="text-lg font-bold text-zinc-900">
                                    {t("vouchers.modal.title", "Voucher Saya")}
                                </h3>
                                {!loading && vouchers.length > 0 && (
                                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 text-xs font-bold">
                                        {vouchers.length}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body List */}
                        <div className="flex-1 overflow-y-auto p-5 bg-zinc-50/50 space-y-4">
                            {loading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className="flex h-[88px] bg-white border border-zinc-200/60 rounded-xl overflow-hidden animate-pulse"
                                        >
                                            <div className="w-[90px] bg-zinc-200 shrink-0" />
                                            <div className="flex-1 p-3 space-y-2">
                                                <div className="h-3.5 bg-zinc-200 rounded w-3/4" />
                                                <div className="h-2.5 bg-zinc-200 rounded w-5/6" />
                                                <div className="h-2.5 bg-zinc-200 rounded w-1/2" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : vouchers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4 text-zinc-400">
                                        <Ticket size={28} className="stroke-[1.2]" />
                                    </div>
                                    <p className="text-sm font-medium text-zinc-500">
                                        {t("vouchers.modal.empty", "Kamu belum memiliki voucher aktif saat ini.")}
                                    </p>
                                </div>
                            ) : (
                                vouchers.map((voucher, idx) => {
                                    const isPercentage = voucher.type === "percentage";
                                    const valFormatted = isPercentage
                                        ? `${parseFloat(voucher.value)}%`
                                        : formatCurrencyShort(voucher.value);

                                    return (
                                        <motion.div
                                            key={voucher.code}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="relative flex items-stretch rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 bg-white border border-zinc-200/60"
                                        >
                                            {/* Left side: discount value */}
                                            <div className="w-[90px] bg-gradient-to-br from-blue-600 to-blue-800 text-white flex flex-col items-center justify-center py-2 px-3 text-center shrink-0 relative">
                                                <span className="text-lg font-extrabold tracking-tight drop-shadow-xs">
                                                    {valFormatted}
                                                </span>
                                                <span className="text-[9px] font-bold tracking-wider uppercase opacity-90 mt-0.5">
                                                    OFF
                                                </span>
                                            </div>

                                            {/* Dashed Separator */}
                                            <div className="w-[1px] border-r border-dashed border-zinc-200 relative shrink-0" />

                                            {/* Punch holes styling */}
                                            <div
                                                className={`absolute top-0 bottom-0 ${isAr ? "right-[90px] translate-x-1/2" : "left-[90px] -translate-x-1/2"
                                                    } flex flex-col justify-between pointer-events-none z-10`}
                                            >
                                                <div className="w-3.5 h-3.5 rounded-full bg-zinc-50 border-b border-zinc-200/60 -mt-2" />
                                                <div className="w-3.5 h-3.5 rounded-full bg-zinc-50 border-t border-zinc-200/60 -mb-2" />
                                            </div>

                                            {/* Right side: details */}
                                            <div className="flex-1 py-2.5 px-3.5 flex flex-col justify-between min-w-0 bg-white">
                                                <div className="space-y-0.5">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h4 className="text-xs font-bold text-zinc-900 truncate uppercase tracking-wide">
                                                            {voucher.name}
                                                        </h4>
                                                        {voucher.distribution_type === "event" && (
                                                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
                                                                {voucher.code}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-zinc-500 line-clamp-1 leading-normal">
                                                        {voucher.description || "-"}
                                                    </p>
                                                </div>

                                                <div className="mt-1.5 pt-1.5 flex items-end justify-between gap-2 border-t border-zinc-100">
                                                    <div className="text-[9px] text-zinc-400 space-y-0.5 min-w-0">
                                                        {voucher.min_spending > 0 && (
                                                            <p className="truncate">
                                                                {t("vouchers.modal.min_spend", "Min. Belanja: {amount}").replace(
                                                                    "{amount}",
                                                                    formatCurrency(voucher.min_spending)
                                                                )}
                                                            </p>
                                                        )}
                                                        {isPercentage && voucher.max_discount > 0 && (
                                                            <p className="truncate">
                                                                {t(
                                                                    "vouchers.modal.max_discount",
                                                                    "Maks. potongan: {amount}"
                                                                ).replace("{amount}", formatCurrency(voucher.max_discount))}
                                                            </p>
                                                        )}
                                                        <p className="truncate text-zinc-500 font-medium">
                                                            {t("vouchers.modal.valid_until", "Berlaku hingga: {date}").replace(
                                                                "{date}",
                                                                formatDate(voucher.end_date)
                                                            )}
                                                        </p>
                                                    </div>

                                                    {voucher.distribution_type === "event" && (
                                                        <button
                                                            onClick={() => handleCopy(voucher.code)}
                                                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${copiedCode === voucher.code
                                                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                                                : "bg-blue-50 text-blue-600 hover:bg-blue-100 border border-transparent"
                                                                }`}
                                                        >
                                                            {copiedCode === voucher.code ? (
                                                                <>
                                                                    <Check size={12} />
                                                                    <span>{t("vouchers.modal.copied", "Tersalin")}</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Copy size={12} />
                                                                    <span>{t("vouchers.modal.copy", "Salin")}</span>
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer/Info Note */}
                        <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex flex-col gap-2 shrink-0">
                            <div className="flex items-start gap-2 text-blue-800 text-[11px] leading-relaxed">
                                <Info size={14} className="shrink-0 mt-0.5 text-blue-600" />
                                <span className="font-medium">
                                    {t("vouchers.modal.note", "* Voucher dapat digunakan pada halaman checkout")}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
