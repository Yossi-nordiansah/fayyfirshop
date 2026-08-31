import React from "react";
import { Head, Link } from "@inertiajs/react";
import { Truck, MapPin, Calendar, Clock, ShoppingBag, ArrowLeft, Package, User, Store } from "lucide-react";
import { motion } from "framer-motion";
import MainLayout from "@/Layouts/MainLayout";
import { useLanguage } from "@/Contexts/LanguageContext";

export default function TrackOrderPage({ order, trackingLogs = [], biteshipStatus = null }) {
    const { t, locale } = useLanguage();

    const formatPrice = (value) => {
        const currencySymbol = locale === "indonesia" ? "Rp" : "IDR";
        const formattedNumber = new Intl.NumberFormat("id-ID", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value || 0);

        return `${currencySymbol} ${formattedNumber}`;
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

    const translateStatus = (status) => {
        if (!status) return "";
        const s = status.toLowerCase();
        switch (s) {
            case "confirmed":
                return "Pengiriman Terkonfirmasi";
            case "allocated":
                return "Kurir Dialokasikan";
            case "picking_up":
                return "Dalam Penjemputan";
            case "picked":
                return "Paket Telah Dijemput";
            case "dropping_off":
            case "in_transit":
                return "Sedang Diantar ke Tujuan";
            case "on_hold":
                return "Paket Tertahan di Transit";
            case "delivered":
                return "Paket Terkirim";
            case "cancelled":
                return "Pengiriman Dibatalkan";
            case "rejected":
                return "Pengiriman Ditolak";
            case "returned":
                return "Paket Dikembalikan";
            case "shipped":
                return "Sedang Dikirim";
            case "processing":
                return "Sedang Diproses";
            case "completed":
                return "Selesai";
            default:
                return status.toUpperCase();
        }
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
            {
                title: t("orders.track.step1.title", "Pesanan Dibuat"),
                desc: t("orders.track.step1.desc", "Pesanan Anda berhasil dicatat oleh sistem"),
                date: order.created_at,
                active: activeStep >= 0
            },
            {
                title: t("orders.track.step2.title", "Diproses Penjual"),
                desc: `${t("orders.track.step2.desc", "Produk sedang disiapkan di gudang")} ${order.store_branch?.name ?? ''}`,
                date: order.status !== 'pending' ? order.updated_at : null,
                active: activeStep >= 1
            },
            {
                title: t("orders.track.step3.title", "Paket Dikirim"),
                desc: order.tracking_number
                    ? t("orders.track.step3.desc_shipped", "Barang diserahkan ke {courier}. No Resi: {tracking_number}")
                        .replace("{courier}", order.shipping_courier)
                        .replace("{tracking_number}", order.tracking_number)
                    : t("orders.track.step3.desc_waiting", "Menunggu penyerahan barang ke kurir"),
                date: activeStep >= 2 ? order.updated_at : null,
                active: activeStep >= 2
            },
            {
                title: t("orders.track.step4.title", "Selesai"),
                desc: t("orders.track.step4.desc", "Paket telah sampai di tujuan dan diterima pembeli"),
                date: activeStep >= 3 ? order.updated_at : null,
                active: activeStep >= 3
            },
        ];

        return timeline;
    };

    const fallbackTimeline = getFallbackTimeline();
    const currentDisplayStatus = translateStatus(biteshipStatus || order.status);

    // Sort tracking logs newest first (descending by timestamp)
    const sortedTrackingLogs = React.useMemo(() => {
        if (!trackingLogs || trackingLogs.length === 0) return [];
        return [...trackingLogs].sort((a, b) => {
            const timeA = a.date ? new Date(a.date).getTime() : 0;
            const timeB = b.date ? new Date(b.date).getTime() : 0;
            return timeB - timeA; // Newest first
        });
    }, [trackingLogs]);

    return (
        <MainLayout>
            <Head title={`Fayyfir - ${t("orders.track.page_title", "Lacak Pesanan")}`} />

            <div className="min-h-screen bg-slate-50 pb-20 pt-20 lg:pt-28 ">
                <div className="max-w-4xl mx-auto px-4">
                    {/* Header */}
                    <div className="flex items-center gap-3 pb-2 lg:pb-6 mb-2 lg:mb-8 border-b border-slate-200/60">
                        <button
                            onClick={() => window.history.back()}
                            className="flex items-center justify-center w-10 h-10 transition-colors bg-white border rounded-full text-slate-500 hover:text-blue-700 border-slate-200 cursor-pointer"
                        >
                            <ArrowLeft size={18} className={locale === "arabic" ? "rotate-180" : ""} />
                        </button>
                        <div className="flex-1 flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold tracking-wide text-slate-900 md:text-3xl">
                                    {t("orders.track.title", "Lacak Pengiriman")}
                                </h1>
                                <p className="mt-1 text-xs text-slate-500">
                                    {t("orders.track.subtitle", "Pantau status pengiriman pesanan Anda secara real-time.")}
                                </p>
                            </div>
                            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-blue-50 text-blue-900 border border-blue-200">
                                <Truck size={14} className="text-blue-700" />
                                <span>{currentDisplayStatus}</span>
                            </span>
                        </div>
                    </div>

                    <div className="grid gap-6 grid-cols-1 md:grid-cols-[1fr_300px]">
                        {/* Left Column: Tracking logs */}
                        <div className="space-y-6">

                            {/* Shipment Logs Timeline */}
                            <section className="p-6 bg-white border border-slate-100 shadow-sm rounded-3xl">
                                <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
                                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                                        {t("orders.track.timeline_title", "Riwayat Perjalanan Paket")}
                                    </h3>
                                    <span className="sm:hidden inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-50 text-blue-900 border border-blue-200">
                                        {currentDisplayStatus}
                                    </span>
                                </div>

                                {sortedTrackingLogs.length > 0 ? (
                                    <div className="relative border-l-2 border-slate-200 ml-3 pl-6 space-y-6">
                                        {sortedTrackingLogs.map((log, idx) => {
                                            const isLatest = idx === 0;
                                            return (
                                                <div key={idx} className="relative">
                                                    {/* Bullet dot */}
                                                    <div
                                                        className={`absolute -left-[31px] rounded-full transition-all ${
                                                            isLatest
                                                                ? "w-3.5 h-3.5 -left-[32px] bg-blue-600 border-2 border-white ring-4 ring-blue-100 shadow-sm"
                                                                : "w-2.5 h-2.5 bg-slate-300 border-2 border-white"
                                                        }`}
                                                    />
                                                    <div>
                                                        <span className="text-[10px] font-bold text-slate-400 block font-mono">
                                                            {formatDate(log.date)}
                                                        </span>
                                                        {log.title && (
                                                            <h4 className={`text-xs mt-0.5 font-bold ${isLatest ? "text-blue-950 text-sm" : "text-slate-700"}`}>
                                                                {log.title}
                                                            </h4>
                                                        )}
                                                        <p className={`text-xs mt-1 leading-relaxed ${isLatest ? "font-semibold text-slate-900" : "text-slate-500"}`}>
                                                            {log.note}
                                                        </p>
                                                        {log.service_status && (
                                                            <span
                                                                className={`inline-block mt-1.5 text-[10px] font-bold px-2.5 py-0.5 border rounded-lg ${
                                                                    isLatest
                                                                        ? "text-blue-800 bg-blue-50 border-blue-200 font-extrabold"
                                                                        : "text-slate-600 bg-slate-50 border-slate-200"
                                                                }`}
                                                            >
                                                                {translateStatus(log.service_status)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="space-y-6 ml-3 border-l-2 border-slate-200 pl-6">
                                        {fallbackTimeline
                                            .filter((s) => s.date)
                                            .reverse()
                                            .map((step, idx) => (
                                                <div key={idx} className="relative">
                                                    <div
                                                        className={`absolute -left-[31px] rounded-full ${
                                                            idx === 0
                                                                ? "w-3.5 h-3.5 -left-[32px] bg-blue-600 border-2 border-white ring-4 ring-blue-100"
                                                                : "w-2.5 h-2.5 bg-slate-300 border-2 border-white"
                                                        }`}
                                                    />
                                                    <div>
                                                        <span className="text-[10px] font-bold text-slate-400 block font-mono">{formatDate(step.date)}</span>
                                                        <h4 className={`text-xs mt-0.5 font-bold ${idx === 0 ? "text-blue-950 text-sm" : "text-slate-800"}`}>
                                                            {step.title}
                                                        </h4>
                                                        <p className={`text-xs mt-0.5 leading-relaxed ${idx === 0 ? "font-semibold text-slate-800" : "text-slate-500"}`}>{step.desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        {order.status === 'processing' && (
                                            <div className="p-3 bg-blue-50/50 border border-blue-100 text-[11px] text-blue-800 rounded-xl">
                                                {t("orders.track.processing_desc", "Penjual sedang menyiapkan barang di gudang. Riwayat pelacakan kurir terperinci akan muncul di sini segera setelah paket dijemput.")}
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
                                <h3 className="text-sm font-extrabold text-slate-900 pb-3 border-b border-slate-100">
                                    {t("orders.track.invoice_detail", "Detail Invoice")}
                                </h3>

                                <div className="mt-4 space-y-3.5 text-xs">
                                    <div>
                                        <span className="text-slate-400 block">{t("orders.track.invoice_number", "No. Invoice")}</span>
                                        <strong className="text-blue-950 font-mono text-sm block mt-0.5">{order.invoice_number}</strong>
                                    </div>

                                    <div>
                                        <span className="text-slate-400 block">{t("orders.track.sender_warehouse", "Gudang Pengirim")}</span>
                                        <div className="flex items-center gap-1 mt-1 text-slate-800 font-bold">
                                            <Store size={13} className="text-blue-700" />
                                            <span>{order.store_branch?.name ?? '-'}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <span className="text-slate-400 block">{t("orders.track.courier_service", "Kurir & Layanan")}</span>
                                        <div className="flex items-center gap-1 mt-1 text-slate-800 font-bold uppercase">
                                            <Truck size={13} className="text-blue-700" />
                                            <span>{order.shipping_courier} ({order.shipping_service})</span>
                                        </div>
                                    </div>

                                    {order.tracking_number && (
                                        <div>
                                            <span className="text-slate-400 block">{t("orders.track.tracking_number", "No. Resi (AWB)")}</span>
                                            <strong className="text-slate-800 font-mono text-sm block mt-0.5">{order.tracking_number}</strong>
                                        </div>
                                    )}

                                    <div className="pt-3 border-t border-slate-100">
                                        <span className="text-slate-400 block">{t("orders.track.total_amount", "Total Transaksi")}</span>
                                        <strong className="text-blue-900 text-sm font-black block mt-0.5">{formatPrice(order.total_amount)}</strong>
                                    </div>
                                </div>
                            </div>

                            {/* Destination Info */}
                            <div className="p-5 border shadow-sm rounded-3xl border-slate-100 bg-white">
                                <h3 className="text-sm font-extrabold text-slate-900 pb-3 border-b border-slate-100">
                                    {t("orders.track.receiver", "Penerima")}
                                </h3>

                                <div className="mt-4 space-y-3.5 text-xs text-slate-600">
                                    <div className="flex gap-2">
                                        <User size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <span className="text-slate-400">{t("orders.track.receiver", "Penerima")}</span>
                                            <strong className="text-slate-900 block mt-0.5">{order.receiver_name || order.user?.receiver_name || order.user?.name}</strong>
                                            {(order.receiver_phone || order.user?.phone) && (
                                                <span className="text-slate-500 font-semibold block">{order.receiver_phone || order.user?.phone}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-3 border-t border-slate-100">
                                        <MapPin size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <span className="text-slate-400">{t("orders.track.shipping_address", "Alamat Pengiriman")}</span>
                                            <p className="text-slate-600 mt-1 leading-normal">
                                                {order.shipping_address || (order.user?.address ? `${order.user.address}, Kec. ${order.user.district}, ${order.user.city}, ${order.user.province} ${order.user.postal_code}` : '-')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
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
