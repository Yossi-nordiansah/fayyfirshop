import React, { useState, useMemo } from "react";
import { Head, Link, router } from "@inertiajs/react";
import axios from "axios";
import {
    ShoppingBag,
    Calendar,
    Truck,
    MapPin,
    CreditCard,
    ChevronDown,
    ChevronUp,
    MessageCircle,
    ExternalLink,
    AlertCircle,
    CheckCircle2,
    Clock,
    ArrowLeft,
    Package,
    Store,
    DollarSign,
    RefreshCw,
    X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "@/Layouts/MainLayout";
import Navbar from "@/Components/Navbar";
import Footer from "@/Components/Footer";
import { useLanguage } from "@/Contexts/LanguageContext";

export default function OrderHistoryPage({ orders = [] }) {
    const { t, locale } = useLanguage();
    const isRtl = locale === 'arabic';

    const [activeTab, setActiveTab] = useState("all");
    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [cancellingOrderId, setCancellingOrderId] = useState(null);
    const [cancelReason, setCancelReason] = useState("");
    const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

    const openCancelModal = (orderId) => {
        setCancellingOrderId(orderId);
        setCancelReason("");
        setIsCancelModalOpen(true);
    };

    const closeCancelModal = () => {
        setIsCancelModalOpen(false);
        setCancellingOrderId(null);
        setCancelReason("");
    };

    const handleCancelSubmit = (e) => {
        e.preventDefault();
        if (!cancelReason.trim()) {
            alert(t("orders.cancel_reason_required", "Silakan masukkan alasan pembatalan."));
            return;
        }

        setIsSubmittingCancel(true);
        axios.post(route('orders.cancel-request', cancellingOrderId), {
            reason: cancelReason
        })
            .then(res => {
                setIsSubmittingCancel(false);
                closeCancelModal();
                router.reload();
            })
            .catch(err => {
                setIsSubmittingCancel(false);
                alert(err.response?.data?.message || "Terjadi kesalahan saat memproses pembatalan.");
            });
    };

    // Helpers
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

    const getLocalizedValue = (translations, fallback) => {
        if (!translations) return fallback;
        return translations[locale] || translations['indonesia'] || fallback;
    };

    // Filter Logic
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            if (activeTab === "all") return true;
            if (activeTab === "unpaid") {
                return order.payment_status === "unpaid" && order.status === "pending";
            }
            if (activeTab === "processing") {
                return order.status === "processing" || (order.status === "pending" && order.payment_status === "paid");
            }
            if (activeTab === "shipped") {
                return order.status === "shipped";
            }
            if (activeTab === "completed") {
                return order.status === "completed";
            }
            if (activeTab === "cancelled") {
                return order.status === "cancelled";
            }
            return true;
        });
    }, [orders, activeTab]);

    // Counts for tab badges
    const counts = useMemo(() => {
        const res = { all: orders.length, unpaid: 0, processing: 0, shipped: 0, completed: 0, cancelled: 0 };
        orders.forEach(order => {
            if (order.payment_status === "unpaid" && order.status === "pending") res.unpaid++;
            if (order.status === "processing" || (order.status === "pending" && order.payment_status === "paid")) res.processing++;
            if (order.status === "shipped") res.shipped++;
            if (order.status === "completed") res.completed++;
            if (order.status === "cancelled") res.cancelled++;
        });
        return res;
    }, [orders]);

    const toggleExpand = (orderId) => {
        setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
    };

    const getStatusStyle = (status, paymentStatus, cancellationStatus) => {
        if (cancellationStatus === "pending") {
            return {
                bg: "bg-amber-100 text-amber-800 border-amber-200",
                label: t("orders.status.cancellation_pending", "Menunggu Pembatalan"),
                icon: <Clock size={12} className="stroke-[3]" />
            };
        }
        if (status === "cancelled") {
            return {
                bg: "bg-rose-50 text-rose-600 border-rose-100",
                label: t("orders.tabs.cancelled", "Dibatalkan"),
                icon: <X size={12} className="stroke-[3]" />
            };
        }
        if (paymentStatus === "unpaid" && status === "pending") {
            return {
                bg: "bg-amber-50 text-amber-600 border-amber-100",
                label: t("orders.tabs.unpaid", "Belum Bayar"),
                icon: <Clock size={12} className="stroke-[3]" />
            };
        }
        if (status === "pending" && paymentStatus === "paid") {
            return {
                bg: "bg-blue-50 text-blue-600 border-blue-100",
                label: t("orders.tabs.processing", "Diproses"),
                icon: <Package size={12} className="stroke-[3]" />
            };
        }
        if (status === "processing") {
            return {
                bg: "bg-blue-50 text-blue-600 border-blue-100",
                label: t("orders.tabs.processing", "Diproses"),
                icon: <Package size={12} className="stroke-[3]" />
            };
        }
        if (status === "shipped") {
            return {
                bg: "bg-indigo-50 text-indigo-600 border-indigo-100",
                label: t("orders.tabs.shipped", "Dikirim"),
                icon: <Truck size={12} className="stroke-[3]" />
            };
        }
        if (status === "completed") {
            return {
                bg: "bg-emerald-50 text-emerald-600 border-emerald-100",
                label: t("orders.tabs.completed", "Selesai"),
                icon: <CheckCircle2 size={12} className="stroke-[3]" />
            };
        }
        return {
            bg: "bg-slate-50 text-slate-600 border-slate-100",
            label: status,
            icon: <Clock size={12} />
        };
    };

    const handlePayNow = (order) => {
        axios.post(route('orders.payment-token', order.id))
            .then(res => {
                if (res.data && res.data.snap_token) {
                    window.snap.pay(res.data.snap_token, {
                        onSuccess: function (result) {
                            router.reload();
                        },
                        onPending: function (result) {
                            router.reload();
                        },
                        onError: function (result) {
                            alert(t("orders.payment_failed", "Pembayaran gagal. Silakan coba lagi."));
                        },
                        onClose: function () {
                            router.reload();
                        }
                    });
                } else {
                    alert(res.data.message || "Gagal mendapatkan token pembayaran.");
                }
            })
            .catch(err => {
                console.error(err);
                alert(err.response?.data?.message || "Terjadi kesalahan saat memproses pembayaran.");
            });
    };

    const handleCancelOrder = (orderId) => {
        if (!confirm(t("payment.cancel_confirm", "Apakah Anda yakin ingin membatalkan pesanan ini?"))) {
            return;
        }

        axios.post(route('checkout.payment.cancel', orderId))
            .then(res => {
                if (res.data.success) {
                    router.reload();
                } else {
                    alert(res.data.message || "Gagal membatalkan pesanan.");
                }
            })
            .catch(err => {
                console.error(err);
                alert(err.response?.data?.message || "Terjadi kesalahan saat memproses pembatalan.");
            });
    };

    const getWhatsAppUrl = (order) => {
        const text = `Halo Admin Fayyfir Shop, saya ingin menanyakan perihal pesanan saya:\n\n*No. Invoice:* ${order.invoice_number}\n*Status:* ${order.status.toUpperCase()}\n*Total Pembayaran:* ${formatPrice(order.total_amount)}\n\nTerima kasih.`;
        return `https://wa.me/6281234567890?text=${encodeURIComponent(text)}`;
    };

    const tabs = [
        { id: "all", label: t("orders.tabs.all", "Semua"), count: counts.all },
        { id: "unpaid", label: t("orders.tabs.unpaid", "Belum Bayar"), count: counts.unpaid },
        { id: "processing", label: t("orders.tabs.processing", "Diproses"), count: counts.processing },
        { id: "shipped", label: t("orders.tabs.shipped", "Dikirim"), count: counts.shipped },
        { id: "completed", label: t("orders.tabs.completed", "Selesai"), count: counts.completed },
        { id: "cancelled", label: t("orders.tabs.cancelled", "Dibatalkan"), count: counts.cancelled },
    ];

    return (
        <MainLayout>
            <Head title={`${t("orders.title", "Pesanan Saya")} - Fayyfir Shop`} />
            <Navbar alwaysSolid={true} />

            <div className="min-h-screen bg-slate-50 pb-10 pt-28" dir={isRtl ? "rtl" : "ltr"}>
                <div className="mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center gap-3 pb-6 mb-8 border-b border-slate-200/60">
                        <Link href="/products" className="flex items-center justify-center w-10 h-10 transition-colors bg-white border rounded-full text-slate-500 hover:text-blue-700 border-slate-200">
                            <ArrowLeft size={18} className={isRtl ? "rotate-180" : ""} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold tracking-wide text-slate-900 md:text-3xl">
                                {t("orders.title", "Pesanan Saya")}
                            </h1>
                            <p className="mt-1 text-xs text-slate-500">
                                {t("orders.subtitle", "Pantau status pembayaran dan pelacakan pesanan Anda di sini.")}
                            </p>
                        </div>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="flex overflow-x-auto pb-2 mb-6 scrollbar-hide border-b border-slate-200/80 -mx-4 px-4 sm:mx-0 sm:px-0">
                        <div className="flex space-x-2 md:space-x-4 min-w-max">
                            {tabs.map((tab) => {
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => {
                                            setActiveTab(tab.id);
                                            setExpandedOrderId(null);
                                        }}
                                        className={`relative py-3 px-4 text-xs md:text-sm font-extrabold tracking-wide uppercase transition-all flex items-center gap-2 ${isActive
                                            ? "text-blue-900 font-black"
                                            : "text-slate-500 hover:text-slate-900"
                                            }`}
                                    >
                                        <span>{tab.label}</span>
                                        {tab.count > 0 && (
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${isActive ? "bg-blue-100 text-blue-950" : "bg-slate-200/60 text-slate-600"
                                                }`}>
                                                {tab.count}
                                            </span>
                                        )}
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeTabUnderline"
                                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-900"
                                                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Orders List Container */}
                    <div className="space-y-4">
                        <AnimatePresence mode="wait">
                            {filteredOrders.length > 0 ? (
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-4"
                                >
                                    {filteredOrders.map((order) => {
                                        const statusInfo = getStatusStyle(order.status, order.payment_status, order.cancellation_status);
                                        const isExpanded = expandedOrderId === order.id;

                                        return (
                                            <div
                                                key={order.id}
                                                className="bg-white border border-slate-100 shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-shadow"
                                            >
                                                {/* Card Header */}
                                                <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                                        <div className="font-mono font-bold text-xs bg-white border border-slate-200 text-blue-950 px-3 py-1 rounded-xl shadow-xs">
                                                            {order.invoice_number}
                                                        </div>
                                                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                                                            <Calendar size={12} />
                                                            <span>{formatDate(order.created_at)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                                                            <Store size={12} className="text-blue-700" />
                                                            <span>{order.store_branch?.name || "-"}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <span className={`inline-flex items-center gap-1 px-3 py-1 text-[10px] font-black border uppercase rounded-full ${statusInfo.bg}`}>
                                                            {statusInfo.icon}
                                                            <span>{statusInfo.label}</span>
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Card Content (Main items brief) */}
                                                <div className="p-5">
                                                    <div className="space-y-4">
                                                        {order.items.map((item, idx) => (
                                                            <div key={idx} className="flex gap-4">
                                                                {/* Image thumbnail placeholder */}
                                                                <div className="w-16 h-16 bg-slate-100 rounded-xl border border-slate-100 flex items-center justify-center flex-shrink-0">
                                                                    {item.product?.images && item.product.images.length > 0 ? (
                                                                        (() => {
                                                                            const primaryImg = item.product.images.find(img => !!img.is_primary && img.is_primary !== '0' && img.is_primary !== 0) || item.product.images[0];
                                                                            const src = primaryImg.image_path.startsWith("http") || primaryImg.image_path.startsWith("/")
                                                                                ? primaryImg.image_path
                                                                                : `/storage/${primaryImg.image_path}`;
                                                                            return (
                                                                                <img
                                                                                    src={src}
                                                                                    alt={item.product.title}
                                                                                    className="max-w-full max-h-full object-contain rounded-xl"
                                                                                />
                                                                            );
                                                                        })()
                                                                    ) : (
                                                                        <Package className="text-slate-400" size={24} />
                                                                    )}
                                                                </div>

                                                                {/* Item Details */}
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="text-sm font-bold text-slate-900 truncate">
                                                                        {getLocalizedValue(item.product?.name_translations, item.product?.title)}
                                                                    </h4>
                                                                    {item.variant && (
                                                                        <p className="text-xs text-slate-500 mt-0.5">
                                                                            Varian: {getLocalizedValue(item.variant.name_translations, item.variant.name)}
                                                                        </p>
                                                                    )}
                                                                    <p className="text-xs text-slate-400 mt-1">
                                                                        {item.quantity} x {formatPrice(item.price)}
                                                                    </p>
                                                                </div>

                                                                {/* Subtotal Item */}
                                                                <div className="text-right text-xs font-black text-slate-900 self-center">
                                                                    {formatPrice(item.price * item.quantity)}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Card Expandable Details Accordion */}
                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.25 }}
                                                            className="overflow-hidden border-t border-slate-100 bg-slate-50/20"
                                                        >
                                                            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600">
                                                                {/* Left: Shipping destination details */}
                                                                <div className="space-y-4">
                                                                    <div>
                                                                        <h5 className="font-bold text-slate-900 flex items-center gap-1.5 mb-2">
                                                                            <MapPin size={14} className="text-blue-700" />
                                                                            <span>Alamat Pengiriman</span>
                                                                        </h5>
                                                                        <p className="leading-relaxed bg-white border border-slate-100 p-3 rounded-2xl">
                                                                            {order.shipping_address}
                                                                        </p>
                                                                    </div>

                                                                    {order.notes && (
                                                                        <div>
                                                                            <h5 className="font-bold text-slate-900 mb-1">Catatan Pesanan</h5>
                                                                            <p className="italic text-slate-500 bg-white border border-slate-100 p-3 rounded-2xl">
                                                                                "{order.notes}"
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                    {order.cancellation_reason && (
                                                                        <div className="mt-3">
                                                                            <h5 className="font-bold text-slate-900 mb-1">Alasan Pembatalan</h5>
                                                                            <p className="text-rose-600 bg-rose-50/50 border border-rose-100 p-3 rounded-2xl">
                                                                                "{order.cancellation_reason}"
                                                                                {order.cancellation_status && (
                                                                                    <span className="block text-[10px] text-slate-400 mt-1 uppercase font-bold">
                                                                                        Status Pengajuan: {order.cancellation_status}
                                                                                    </span>
                                                                                )}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Right: Payment details */}
                                                                <div className="space-y-4">
                                                                    <div>
                                                                        <h5 className="font-bold text-slate-900 flex items-center gap-1.5 mb-3">
                                                                            <DollarSign size={14} className="text-blue-700" />
                                                                            <span>Rincian Pembayaran</span>
                                                                        </h5>
                                                                        <div className="bg-white border border-slate-100 p-4 rounded-2xl space-y-2">
                                                                            <div className="flex justify-between">
                                                                                <span>Subtotal</span>
                                                                                <span className="font-bold text-slate-800">{formatPrice(order.subtotal)}</span>
                                                                            </div>
                                                                            <div className="flex justify-between">
                                                                                <span>Ongkos Kirim ({order.shipping_courier})</span>
                                                                                <span className="font-bold text-slate-800">{formatPrice(order.shipping_cost)}</span>
                                                                            </div>
                                                                            {order.discount_amount > 0 && (
                                                                                <div className="flex justify-between text-emerald-600">
                                                                                    <span>Diskon</span>
                                                                                    <span>-{formatPrice(order.discount_amount)}</span>
                                                                                </div>
                                                                            )}
                                                                            <div className="flex justify-between pt-2 border-t border-slate-100 font-extrabold text-sm text-slate-900">
                                                                                <span>Total Pembayaran</span>
                                                                                <span className="text-blue-900 font-black">{formatPrice(order.total_amount)}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                {/* Card Footer (Totals & Actions) */}
                                                <div className="p-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-slate-400">{t("orders.total", "Total Belanja")}:</span>
                                                        <span className="text-base font-black text-blue-950">{formatPrice(order.total_amount)}</span>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {/* Toggle Details Button */}
                                                        <button
                                                            onClick={() => toggleExpand(order.id)}
                                                            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-950 px-3.5 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                                                        >
                                                            <span>{t("orders.action.details", "Detail")}</span>
                                                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                        </button>

                                                        {/* WhatsApp Admin button */}
                                                        <a
                                                            href={getWhatsAppUrl(order)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 px-3.5 py-2 border border-emerald-100 hover:border-emerald-200 rounded-xl bg-emerald-50/50 hover:bg-emerald-50 transition-colors"
                                                        >
                                                            <MessageCircle size={14} />
                                                            <span>{t("orders.action.contact", "Hubungi Admin")}</span>
                                                        </a>

                                                        {/* Special Actions: Pay Now, Change Method, Cancel if Unpaid */}
                                                        {order.payment_status === "unpaid" && order.status === "pending" && order.cancellation_status !== "pending" && (
                                                            <>
                                                                <Link
                                                                    href={route('checkout.payment', order.id)}
                                                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-xl shadow-md transition-all active:scale-[0.98]"
                                                                >
                                                                    <CreditCard size={14} />
                                                                    <span>{t("orders.action.pay", "Bayar Sekarang")}</span>
                                                                </Link>
                                                                <button
                                                                    onClick={() => openCancelModal(order.id)}
                                                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 border border-rose-200 hover:bg-rose-50 px-4 py-2 rounded-xl transition-all active:scale-[0.98]"
                                                                >
                                                                    <X size={14} />
                                                                    <span>{t("orders.action.cancel", "Batalkan Pesanan")}</span>
                                                                </button>
                                                            </>
                                                        )}

                                                        {/* Special Action: Request Cancellation if Processing/Paid */}
                                                        {/* Special Action: Waiting for Approval */}
                                                         {order.cancellation_status === "pending" && (
                                                             <button
                                                                 disabled
                                                                 className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 border border-slate-200 bg-slate-50 px-4 py-2 rounded-xl cursor-not-allowed"
                                                             >
                                                                 <Clock size={14} className="animate-pulse text-amber-500" />
                                                                 <span>{t("orders.action.waiting_cancel", "Menunggu Persetujuan Pembatalan")}</span>
                                                             </button>
                                                         )}

                                                          {order.cancellation_status === "rejected" && (
                                                              <button
                                                                  disabled
                                                                  className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-400 border border-rose-200 bg-rose-50 px-4 py-2 rounded-xl cursor-not-allowed"
                                                              >
                                                                  <X size={14} className="text-rose-500" />
                                                                  <span>{t("orders.action.cancel_rejected", "Pengajuan Pembatalan Ditolak")}</span>
                                                              </button>
                                                          )}

                                                         {(order.status === "processing" || (order.status === "pending" && order.payment_status === "paid")) && order.cancellation_status !== "pending" && order.cancellation_status !== "rejected" && (
                                                            <button
                                                                onClick={() => openCancelModal(order.id)}
                                                                className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 border border-rose-200 hover:bg-rose-50 px-4 py-2 rounded-xl transition-all active:scale-[0.98]"
                                                            >
                                                                <X size={14} />
                                                                <span>{t("orders.action.request_cancel", "Ajukan Pembatalan")}</span>
                                                            </button>
                                                        )}

                                                        {/* Special Action: Track Order if Shipped */}
                                                        {order.status === "shipped" && (
                                                            <Link
                                                                href={route('orders.track', order.id)}
                                                                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 px-4 py-2 rounded-xl shadow-md transition-all active:scale-[0.98]"
                                                            >
                                                                <span>{t("orders.track", "Lacak Pengiriman")}</span>
                                                                <ExternalLink size={14} />
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="p-10 bg-white border border-slate-100 shadow-sm rounded-3xl text-center flex flex-col items-center justify-center min-h-[300px]"
                                >
                                    <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                                        <ShoppingBag size={28} />
                                    </div>
                                    <h3 className="text-base font-extrabold text-slate-800">
                                        {t("orders.empty", "Belum ada pesanan")}
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                                        {t("orders.empty_desc", "Anda tidak memiliki riwayat transaksi di kategori status ini.")}
                                    </p>
                                    <Link
                                        href="/products"
                                        className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-blue-900 to-blue-800 text-white font-bold text-xs px-6 py-3 rounded-2xl shadow-lg hover:from-blue-800 hover:to-blue-700 transition-all active:scale-[0.98]"
                                    >
                                        <Package size={14} />
                                        <span>Mulai Belanja</span>
                                    </Link>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
            {/* Cancellation Reason Modal */}
            <AnimatePresence>
                {isCancelModalOpen && (
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
                                    onClick={closeCancelModal}
                                    className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleCancelSubmit} className="p-5 space-y-4">
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
                                        onClick={closeCancelModal}
                                        className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-2xl text-xs transition"
                                    >
                                        {t("common.cancel", "Batal")}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmittingCancel}
                                        className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-2xl text-xs transition"
                                    >
                                        {isSubmittingCancel ? t("common.submitting", "Mengirim...") : t("orders.cancel_submit", "Kirim Pengajuan")}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <Footer />
        </MainLayout>
    );
}
