import React from "react";
import { Head, Link } from "@inertiajs/react";
import { CheckCircle, ArrowRight, ShoppingBag, MapPin, Truck, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import MainLayout from "@/Layouts/MainLayout";
import { useLanguage } from "@/Contexts/LanguageContext";

export default function SuccessPage({ order }) {
    const { t, locale } = useLanguage();

    const formatPrice = (value) => {
        // Konversi dinamis simbol mata uang berdasarkan setelan regional global
        const currencySymbol = locale === "indonesia" ? "Rp" : locale === "arabic" ? "ر.س" : "SAR";
        const formattedNumber = new Intl.NumberFormat(locale === "indonesia" ? "id-ID" : "en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value || 0);

        return `${currencySymbol} ${formattedNumber}`;
    };

    const formattedDate = new Date(order.created_at).toLocaleDateString(
        locale === "indonesia" ? "id-ID" : locale === "arabic" ? "ar-SA" : "en-US",
        {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

    return (
        <MainLayout>
            <Head title={`Fayyfir - ${t("checkout.success.title_head", "Pesanan Berhasil")}`} />

            <div className="min-h-[calc(100vh-5rem)] bg-slate-50 pt-20 pb-6 flex flex-col justify-center">
                <div className="max-w-6xl mx-auto w-full px-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                        className="bg-white border border-slate-100 shadow-xl rounded-3xl p-6 md:p-8"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                            {/* Left Panel: Status, Title, Actions (5 Cols) */}
                            <div className="md:col-span-5 text-center md:text-left flex flex-col items-center md:items-start justify-center md:pr-6 md:border-r md:border-slate-100">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                    className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-100 shadow-md shadow-emerald-100/50 mb-3"
                                >
                                    <CheckCircle className="w-7 h-7 stroke-[2.5]" />
                                </motion.div>

                                <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-wide">
                                    {t("checkout.success.thank_you", "Terima Kasih!")}
                                </h1>
                                <p className="mt-1 text-xs text-slate-500 max-w-sm">
                                    {t("checkout.success.desc", "Pesanan Anda berhasil dibuat dan sedang kami verifikasi. Invoice Anda telah diterbitkan.")}
                                </p>

                                <div className="mt-5 w-full flex flex-col sm:flex-row md:flex-col gap-2.5">
                                    <Link
                                        href={route('orders.index', { tab: order.payment_status === 'paid' ? 'processing' : 'unpaid' })}
                                        className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-900 to-blue-800 text-white font-bold text-xs md:text-sm px-5 py-2.5 rounded-xl shadow-md hover:from-blue-800 hover:to-blue-700 transition-all active:scale-[0.98]"
                                    >
                                        <span>{t("orders.title", "Pesanan Saya")}</span>
                                        <ArrowRight size={15} />
                                    </Link>

                                    <Link
                                        href="/products"
                                        className="w-full inline-flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 font-bold text-xs md:text-sm px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-all active:scale-[0.98]"
                                    >
                                        <ShoppingBag size={15} />
                                        <span>{t("checkout.success.btn_continue", "Belanja Lagi")}</span>
                                    </Link>
                                </div>
                            </div>

                            {/* Right Panel: Detailed Order Info (7 Cols) */}
                            <div className="md:col-span-7">
                                <div className="border border-slate-100 bg-slate-50/60 rounded-2xl p-4 md:p-5 text-left text-xs text-slate-600 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200/60">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-slate-400">{t("checkout.success.invoice", "Nomor Invoice")}</span>
                                            <span className="font-mono font-black text-xs md:text-sm text-blue-950 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-lg">
                                                {order.invoice_number}
                                            </span>
                                            {order.payment_status === 'paid' ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    {t("payment.status.paid", "Lunas")}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                    {t("payment.status.unpaid", "Belum Bayar")}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-500">{t("checkout.success.total_payment", "Total Pembayaran")}</span>
                                            <span className="text-blue-950 text-sm md:text-base font-black">{formatPrice(order.total_amount)}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="flex gap-2.5">
                                            <Calendar className="text-slate-400 w-4 h-4 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <h4 className="font-bold text-slate-900">{t("checkout.success.date", "Tanggal Pemesanan")}</h4>
                                                <p className="mt-0.5 text-slate-500">{formattedDate}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2.5">
                                            <Truck className="text-slate-400 w-4 h-4 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <h4 className="font-bold text-slate-900">{t("checkout.success.courier", "Kurir Pengiriman")}</h4>
                                                <p className="mt-0.5 text-slate-500 uppercase">{order.shipping_courier} ({order.shipping_service})</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2.5 pt-3 border-t border-slate-200/60">
                                        <MapPin className="text-slate-400 w-4 h-4 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-bold text-slate-900">{t("checkout.success.address", "Alamat Tujuan")}</h4>
                                            {order.user?.address ? (
                                                <div className="mt-0.5 text-slate-500 leading-relaxed">
                                                    <p className="font-bold text-slate-800">{order.user.receiver_name || order.user.name}</p>
                                                    <p className="font-mono text-[10px]">{order.user.phone || '-'}</p>
                                                    <p className="mt-0.5">
                                                        {order.user.address}, {t("checkout.success.district_label", "Kec.")} {order.user.district}, {order.user.city}, {order.user.province} {order.user.postal_code}
                                                    </p>
                                                </div>
                                            ) : (
                                                <p className="mt-0.5 text-slate-500 leading-relaxed">{order.shipping_address}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </MainLayout>
    );
}