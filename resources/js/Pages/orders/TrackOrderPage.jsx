import React from "react";
import { Head, Link } from "@inertiajs/react";
import { Truck, MapPin, Calendar, Clock, ShoppingBag, ArrowLeft, Package, User } from "lucide-react";
import { motion } from "framer-motion";
import MainLayout from "@/Layouts/MainLayout";
import Navbar from "@/Components/Navbar";
import Footer from "@/Components/Footer";
import { useLanguage } from "@/Contexts/LanguageContext";

export default function TrackOrderPage({ order, trackingLogs = [] }) {
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

    const formatDate = (dateString) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString(
            locale === "indonesia" ? "id-ID" : locale === "arabic" ? "ar-SA" : "en-US",
            {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    };

    // Calculate active step index for the timeline
    // Statuses: pending, processing, shipped, completed, cancelled
    const getStatusStep = (status) => {
        switch (status) {
            case 'pending': return 0;
            case 'processing': return 1;
            case 'shipped': return 2;
            case 'completed': return 3;
            default: return 0;
        }
    };

    const activeStep = getStatusStep(order.status);
    const isCancelled = order.status === 'cancelled';

    // Mock/Fallback timeline steps if Biteship has no tracking logs yet
    const getFallbackTimeline = () => {
        const timeline = [
            { title: "Pesanan Dibuat", desc: "Pesanan Anda berhasil dicatat oleh sistem", date: order.created_at, active: activeStep >= 0 },
            { title: "Diproses Penjual", desc: "Produk sedang disiapkan di gudang " + (order.store_branch?.name ?? ''), date: order.status !== 'pending' ? order.updated_at : null, active: activeStep >= 1 },
            { title: "Paket Dikirim", desc: order.tracking_number ? `Barang diserahkan ke ${order.shipping_courier}. No Resi: ${order.tracking_number}` : "Menunggu penyerahan barang ke kurir", date: activeStep >= 2 ? order.updated_at : null, active: activeStep >= 2 },
            { title: "Selesai", desc: "Paket telah sampai di tujuan dan diterima pembeli", date: activeStep >= 3 ? order.updated_at : null, active: activeStep >= 3 },
        ];

        return timeline;
    };

    const fallbackTimeline = getFallbackTimeline();

    return (
        <MainLayout>
            <Head title={`${t("orders.track.page_title", "Lacak Pesanan")} - Fayyfir Shop`} />
            <Navbar alwaysSolid={true} />

            <div className="min-h-screen bg-slate-50 pb-20 pt-28 ">
                <div className="max-w-4xl mx-auto px-4">
                    {/* Header */}
                    <div className="flex items-center gap-3 pb-6 mb-8 border-b border-slate-200/60">
                        <Link href="/products" className="flex items-center justify-center w-10 h-10 transition-colors bg-white border rounded-full text-slate-500 hover:text-blue-700 border-slate-200">
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold tracking-wide text-slate-900 md:text-3xl">
                                {t("orders.track.title", "Lacak Pengiriman")}
                            </h1>
                            <p className="mt-1 text-xs text-slate-500">
                                {t("orders.track.subtitle", "Pantau status pengiriman pesanan Anda secara real-time.")}
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-6 grid-cols-1 md:grid-cols-[1fr_300px]">
                        {/* Left Column: Tracking logs & Stepper */}
                        <div className="space-y-6">
                            {/* Visual Progress Stepper */}
                            <section className="p-6 bg-white border border-slate-100 shadow-sm rounded-3xl">
                                <h3 className="text-sm font-extrabold text-slate-900 mb-6 uppercase tracking-wider text-slate-400">Status Pesanan</h3>

                                {isCancelled ? (
                                    <div className="p-4 border border-red-200 bg-red-50 text-red-700 rounded-2xl text-center text-xs font-semibold">
                                        Pesanan ini telah dibatalkan (Cancelled).
                                    </div>
                                ) : (
                                    <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-4">
                                        {/* Mobile Line */}
                                        <div className="absolute left-[15px] md:left-0 top-0 bottom-0 md:bottom-auto md:top-[15px] md:left-[5%] md:right-[5%] h-full md:h-1 w-0.5 md:w-[90%] bg-slate-100 z-0">
                                            <div
                                                className="h-full md:h-full bg-blue-700 transition-all duration-500"
                                                style={{
                                                    height: window.innerWidth < 768 ? `${(activeStep / 3) * 100}%` : 'auto',
                                                    width: window.innerWidth >= 768 ? `${(activeStep / 3) * 100}%` : 'auto',
                                                }}
                                            />
                                        </div>

                                        {/* Steps */}
                                        {fallbackTimeline.map((step, idx) => {
                                            const isDone = activeStep >= idx;
                                            return (
                                                <div key={idx} className="relative z-10 flex md:flex-col items-center md:text-center gap-4 md:gap-2 flex-1 w-full md:w-auto">
                                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-all ${isDone ? 'bg-blue-900 border-blue-900 text-white shadow-md shadow-blue-200' : 'bg-white border-slate-200 text-slate-400'}`}>
                                                        {isDone ? <CheckIcon size={12} /> : idx + 1}
                                                    </div>
                                                    <div className="text-left md:text-center">
                                                        <h4 className={`text-xs font-bold ${isDone ? 'text-blue-950' : 'text-slate-400'}`}>{step.title}</h4>
                                                        {step.date && <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(step.date)}</p>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>

                            {/* Shipment Logs Timeline */}
                            <section className="p-6 bg-white border border-slate-100 shadow-sm rounded-3xl">
                                <h3 className="text-sm font-extrabold text-slate-900 mb-6 uppercase tracking-wider text-slate-400">Riwayat Perjalanan Paket</h3>

                                {trackingLogs.length > 0 ? (
                                    <div className="relative border-l border-slate-200/80 ml-3 pl-6 space-y-6">
                                        {trackingLogs.map((log, idx) => (
                                            <div key={idx} className="relative">
                                                {/* Bullet dot */}
                                                <div className={`absolute -left-[31px] w-2.5 h-2.5 rounded-full border-2 ${idx === 0 ? 'bg-blue-600 border-blue-600 ring-4 ring-blue-50' : 'bg-white border-slate-300'}`} />
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 block">{formatDate(log.date)}</span>
                                                    <p className={`text-xs mt-1 leading-relaxed ${idx === 0 ? 'font-bold text-blue-950' : 'text-slate-600'}`}>{log.note}</p>
                                                    {log.service_status && (
                                                        <span className="inline-block mt-1 text-[9px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 border border-blue-200 rounded">
                                                            {log.service_status.toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-6 ml-3 border-l border-slate-200/80 pl-6">
                                        {fallbackTimeline.filter(s => s.date).reverse().map((step, idx) => (
                                            <div key={idx} className="relative">
                                                <div className={`absolute -left-[31px] w-2.5 h-2.5 rounded-full border-2 ${idx === 0 ? 'bg-blue-600 border-blue-600 ring-4 ring-blue-50' : 'bg-white border-slate-300'}`} />
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 block">{formatDate(step.date)}</span>
                                                    <h4 className={`text-xs mt-0.5 font-bold ${idx === 0 ? 'text-blue-950' : 'text-slate-800'}`}>{step.title}</h4>
                                                    <p className="text-xs mt-0.5 text-slate-500 leading-relaxed">{step.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {order.status === 'processing' && (
                                            <div className="p-3 bg-blue-50/50 border border-blue-100 text-[11px] text-blue-800 rounded-xl">
                                                Penjual sedang menyiapkan barang di gudang. Riwayat pelacakan kurir terperinci akan muncul di sini segera setelah paket dijemput.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </section>
                        </div>

                        {/* Right Column: Order brief */}
                        <aside className="space-y-6">
                            {/* Brief Info */}
                            <div className="p-5 border shadow-sm rounded-3xl border-slate-100 bg-white">
                                <h3 className="text-sm font-extrabold text-slate-900 pb-3 border-b border-slate-100">Detail Invoice</h3>

                                <div className="mt-4 space-y-3.5 text-xs">
                                    <div>
                                        <span className="text-slate-400 block">No. Invoice</span>
                                        <strong className="text-blue-950 font-mono text-sm block mt-0.5">{order.invoice_number}</strong>
                                    </div>

                                    <div>
                                        <span className="text-slate-400 block">Gudang Pengirim</span>
                                        <div className="flex items-center gap-1 mt-1 text-slate-800 font-bold">
                                            <Store size={13} className="text-blue-700" />
                                            <span>{order.store_branch?.name ?? '-'}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <span className="text-slate-400 block">Kurir & Layanan</span>
                                        <div className="flex items-center gap-1 mt-1 text-slate-800 font-bold uppercase">
                                            <Truck size={13} className="text-blue-700" />
                                            <span>{order.shipping_courier} ({order.shipping_service})</span>
                                        </div>
                                    </div>

                                    {order.tracking_number && (
                                        <div>
                                            <span className="text-slate-400 block">No. Resi (AWB)</span>
                                            <strong className="text-slate-800 font-mono text-sm block mt-0.5">{order.tracking_number}</strong>
                                        </div>
                                    )}

                                    <div className="pt-3 border-t border-slate-100">
                                        <span className="text-slate-400 block">Total Transaksi</span>
                                        <strong className="text-blue-900 text-sm font-black block mt-0.5">{formatPrice(order.total_amount)}</strong>
                                    </div>
                                </div>
                            </div>

                            {/* Destination Info */}
                            <div className="p-5 border shadow-sm rounded-3xl border-slate-100 bg-white">
                                <h3 className="text-sm font-extrabold text-slate-900 pb-3 border-b border-slate-100">Penerima</h3>

                                <div className="mt-4 space-y-3.5 text-xs text-slate-600">
                                    <div className="flex gap-2">
                                        <User size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <span className="text-slate-400">Penerima</span>
                                            <strong className="text-slate-900 block mt-0.5">{order.user?.receiver_name || order.user?.name}</strong>
                                            <span className="text-slate-500 font-semibold block">{order.user?.phone}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-3 border-t border-slate-100">
                                        <MapPin size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <span className="text-slate-400">Alamat Pengiriman</span>
                                            <p className="text-slate-600 mt-1 leading-normal">{order.shipping_address}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>

            <Footer />
        </MainLayout>
    );
}

function CheckIcon({ size }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check">
            <path d="M20 6 9 17l-5-5" />
        </svg>
    );
}
