import React from "react";
import { router } from "@inertiajs/react";
import { ArrowLeft } from "lucide-react";

export default function PaymentHeader({ t, isRtl }) {
    return (
        <div className="flex items-center gap-3 pb-6 mb-8 border-b border-slate-200/60">
            <button
                onClick={() => router.visit(route("orders.index"))}
                className="flex items-center justify-center w-10 h-10 transition-colors bg-white border rounded-full text-slate-500 hover:text-blue-700 border-slate-200 shadow-xs shrink-0"
            >
                <ArrowLeft size={18} className={isRtl ? "rotate-180" : ""} />
            </button>
            <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-wide text-slate-900 md:text-3xl">
                    {t("payment.title", "Detail Pembayaran")}
                </h1>
                <p className="mt-1 text-[10px] sm:text-xs text-slate-500">
                    {t("payment.subtitle", "Selesaikan transaksi Anda menggunakan metode pembayaran yang dipilih.")}
                </p>
            </div>
        </div>
    );
}
