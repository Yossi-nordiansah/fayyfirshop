import React from "react";
import { Head, Link } from "@inertiajs/react";
import { CheckCircle, ArrowRight, ShoppingBag, MapPin, Truck, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import MainLayout from "@/Layouts/MainLayout";
import Navbar from "@/Components/Navbar";
import Footer from "@/Components/Footer";
import { useLanguage } from "@/Contexts/LanguageContext";

export default function SuccessPage({ order }) {
    const { t, locale } = useLanguage();

    const formatPrice = (value) => {
        const currencyCode = locale === "indonesia" ? "IDR" : "SAR";
        const formatterLocale = locale === "indonesia" ? "id-ID-u-nu-latn" : locale === "arabic" ? "ar-SA-u-nu-latn" : "en-US-u-nu-latn";

        return new Intl.NumberFormat(formatterLocale, {
            style: "currency",
            currency: currencyCode,
            minimumFractionDigits: 0,
        }).format(value || 0);
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
            <Head title={`${t("checkout.success.title", "Pesanan Berhasil")} - Fayyfir Shop`} />
            <Navbar alwaysSolid={true} />

            <div className="min-h-screen bg-slate-50 pb-20 pt-28 flex flex-col justify-center">
                <div className="max-w-2xl mx-auto w-full px-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="bg-white border border-slate-100 shadow-xl rounded-3xl p-6 md:p-10 text-center"
                    >
                        {/* Success Icon */}
                        <div className="flex justify-center mb-6">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-100 shadow-lg shadow-emerald-100/50"
                            >
                                <CheckCircle size={40} className="stroke-[2.5]" />
                            </motion.div>
                        </div>

                        {/* Title */}
                        <h1 className="font-['Cinzel'] text-2xl md:text-3xl font-extrabold text-slate-900 tracking-wide">
                            {t("checkout.success.title", "Terima Kasih!")}
                        </h1>
                        <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
                            {t("checkout.success.desc", "Pesanan Anda berhasil dibuat dan sedang kami verifikasi. Invoice Anda telah diterbitkan.")}
                        </p>

                        {/* Order info details box */}
                        <div className="mt-8 border border-slate-100 bg-slate-50/50 rounded-2xl p-5 text-left text-xs text-slate-600 space-y-4">
                            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                <span className="font-semibold text-slate-400">Invoice Number</span>
                                <span className="font-mono font-black text-sm text-blue-950 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg">
                                    {order.invoice_number}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex gap-2.5">
                                    <Calendar className="text-slate-400 w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-bold text-slate-900">Tanggal Pemesanan</h4>
                                        <p className="mt-0.5 text-slate-500">{formattedDate}</p>
                                    </div>
                                </div>

                                <div className="flex gap-2.5">
                                    <Truck className="text-slate-400 w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-bold text-slate-900">Kurir Pengiriman</h4>
                                        <p className="mt-0.5 text-slate-500 uppercase">{order.shipping_courier} ({order.shipping_service})</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                                <MapPin className="text-slate-400 w-4 h-4 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="font-bold text-slate-900">Alamat Tujuan</h4>
                                    <p className="mt-0.5 text-slate-500 leading-relaxed">{order.shipping_address}</p>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-3 border-t border-slate-100 font-extrabold text-sm">
                                <span className="text-slate-900">Total Pembayaran</span>
                                <span className="text-blue-900 text-base font-black">{formatPrice(order.total_amount)}</span>
                            </div>
                        </div>

                        {/* Quick actions buttons */}
                        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                href={route('orders.track', order.id)}
                                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-900 to-blue-800 text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-lg hover:from-blue-800 hover:to-blue-700 transition-all active:scale-[0.98]"
                            >
                                <span>Lacak Pengiriman</span>
                                <ArrowRight size={16} />
                            </Link>

                            <Link
                                href="/products"
                                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 font-bold text-sm px-6 py-3.5 rounded-2xl hover:bg-slate-50 transition-all active:scale-[0.98]"
                            >
                                <ShoppingBag size={16} />
                                <span>Belanja Lagi</span>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>

            <Footer />
        </MainLayout>
    );
}
