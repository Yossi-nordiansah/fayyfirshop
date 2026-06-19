import React from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";

export default function ActionPanel({ order, formatPrice, onChangeMethod, t }) {
    // Generate dinamis template pesan WhatsApp berdasarkan bahasa terpilih
    const getWhatsAppMessage = () => {
        const invoiceText = t("checkout.action.wa.message", "Halo Admin Fayyfir Shop, saya mengalami kendala pembayaran untuk nomor invoice");
        const totalText = t("checkout.action.wa.amount_text", "sebesar");
        return encodeURIComponent(`${invoiceText} ${order.invoice_number} ${totalText} ${formatPrice(order.total_amount)}.`);
    };

    return (
        <div className="space-y-2.5">
            {/* Change Method Button — only when unpaid & pending */}
            {order.payment_status === "unpaid" && order.status === "pending" && (
                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={onChangeMethod}
                    className="w-full py-3 border border-dashed border-blue-900/40 text-blue-950 font-bold text-xs rounded-xl hover:bg-blue-50/50 hover:border-blue-900 transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                    <RefreshCw size={13} className="text-blue-900" />
                    <span>{t("checkout.action.change_method", "Ubah Metode Pembayaran")}</span>
                </motion.button>
            )}

            {/* WhatsApp Support */}
            <motion.a
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                href={`https://wa.me/6281234567890?text=${getWhatsAppMessage()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 border border-emerald-100 bg-emerald-50/20 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 transition font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
            >
                <img src="/images/icons/whatsapp.svg" alt="WhatsApp" className="w-3.5 h-3.5 object-contain shrink-0" />
                <span>{t("checkout.action.contact_admin", "Butuh Bantuan? Hubungi Admin")}</span>
            </motion.a>
        </div>
    );
}