import React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useLanguage } from "@/Contexts/LanguageContext";

export default function CancelOrderModal({
    isOpen,
    onClose,
    onSubmit,
    cancelReason,
    setCancelReason,
    isSubmitting
}) {
    const { t } = useLanguage();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-white border border-slate-100 rounded-3xl shadow-xl w-full max-w-md overflow-hidden flex flex-col"
            >
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="font-bold text-base text-slate-950">
                        {t("orders.cancel_title", "Alasan Pembatalan Pesanan")}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="p-5 space-y-4">
                    <p className="text-xs text-slate-500">
                        {t("orders.cancel_desc", "Silakan masukkan alasan mengapa Anda ingin membatalkan pesanan ini. Untuk pesanan yang sudah dibayar, pengajuan Anda akan ditinjau oleh admin.")}
                    </p>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            {t("orders.cancel_reason_label", "Alasan Pembatalan")}
                        </label>
                        <textarea
                            rows={4}
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder={t("orders.cancel_reason_placeholder", "Contoh: Ingin mengubah alamat pengiriman, salah memilih varian, dll.")}
                            className="w-full border border-slate-200 rounded-2xl text-xs outline-none p-3.5 focus:border-blue-500 bg-slate-50/30 focus:bg-white transition"
                            maxLength={1000}
                            required
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-2xl text-xs transition"
                        >
                            {t("common.cancel", "Batal")}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-2xl text-xs transition"
                        >
                            {isSubmitting ? t("common.submitting", "Mengirim...") : t("orders.cancel_submit", "Kirim Pengajuan")}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
