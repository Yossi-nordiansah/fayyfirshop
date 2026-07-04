import React from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";

export default function ExpiryBanner({ order, timeLeft, t }) {
    if (order.payment_status !== "unpaid" || order.status !== "pending") {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
            <div className="flex items-center gap-2.5 sm:gap-3">
                <Clock className="text-amber-600 animate-pulse shrink-0 w-5 h-5 sm:w-6 sm:h-6" />
                <div>
                    <h3 className="font-extrabold text-amber-950 text-xs sm:text-sm">
                        {t("payment.expiry_title", "Batas Waktu Pembayaran")}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-amber-800/80 mt-0.5">
                        {t("payment.expiry_desc", "Selesaikan pembayaran Anda sebelum waktu habis.")}
                    </p>
                </div>
            </div>

            <div className="text-right self-end sm:self-auto lg:mr-0 mx-auto">
                {timeLeft ? (
                    <div className="flex gap-1 items-center text-xs sm:text-sm font-black text-amber-950">
                        <div className="flex flex-col items-center">
                            <span className="bg-amber-950 text-amber-100 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg tabular-nums">
                                {String(timeLeft.hours).padStart(2, "0")}
                            </span>
                        </div>
                        <span>:</span>
                        <div className="flex flex-col items-center">
                            <span className="bg-amber-950 text-amber-100 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg tabular-nums">
                                {String(timeLeft.minutes).padStart(2, "0")}
                            </span>
                        </div>
                        <span>:</span>
                        <div className="flex flex-col items-center">
                            <span className="bg-amber-950 text-amber-100 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg tabular-nums">
                                {String(timeLeft.seconds).padStart(2, "0")}
                            </span>
                        </div>
                    </div>
                ) : (
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-lg">
                        {t("payment.expired", "Kedaluwarsa")}
                    </span>
                )}
            </div>
        </motion.div>
    );
}