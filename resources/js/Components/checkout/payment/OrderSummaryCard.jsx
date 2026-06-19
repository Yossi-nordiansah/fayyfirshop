import React from "react";

export default function OrderSummaryCard({ order, formatPrice, t }) {
    const isPaid = order.payment_status === "paid";

    return (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl space-y-5">
            {/* Card Header */}
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900">
                    {t("payment.summary.title", "Rincian Pembayaran")}
                </h3>
                <span
                    className={`px-2.5 py-0.5 text-[9px] font-black tracking-wider border rounded-full uppercase ${isPaid
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : "bg-amber-50 text-amber-600 border-amber-100"
                        }`}
                >
                    {isPaid ? t("payment.status.paid", "Lunas") : t("payment.status.unpaid", "Belum Bayar")}
                </span>
            </div>

            {/* Pricing Breakdown */}
            <div className="space-y-3.5 text-xs text-slate-500 font-medium">
                <div className="flex justify-between">
                    <span>{t("payment.summary.subtotal", "Subtotal")}</span>
                    <span className="font-bold text-slate-800">{formatPrice(order.subtotal)}</span>
                </div>

                <div className="flex justify-between">
                    <span>
                        {t("payment.summary.shipping", "Ongkos Kirim")} ({order.shipping_courier})
                    </span>
                    <span className="font-bold text-slate-800">{formatPrice(order.shipping_cost)}</span>
                </div>

                {order.discount_amount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                        <span>{t("payment.summary.discount", "Kupon / Diskon")}</span>
                        <span>-{formatPrice(order.discount_amount)}</span>
                    </div>
                )}

                {/* Total Row */}
                <div className="flex justify-between pt-3 border-t border-slate-100 text-sm font-extrabold text-slate-900">
                    <span>{t("payment.summary.total", "Total Pembayaran")}</span>
                    <span className="text-blue-900 font-black text-base">{formatPrice(order.total_amount)}</span>
                </div>
            </div>
        </div>
    );
}