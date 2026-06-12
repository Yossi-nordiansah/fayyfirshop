import React, { useState, useMemo } from "react";
import { Head, Link } from "@inertiajs/react";
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
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);

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

    const getStatusStyle = (status, paymentStatus) => {
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
        setSelectedOrderForPayment(order);
        setShowPaymentModal(true);
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
                                        const statusInfo = getStatusStyle(order.status, order.payment_status);
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

                                                        {/* Special Action: Pay Now if Unpaid */}
                                                        {order.payment_status === "unpaid" && order.status === "pending" && (
                                                            <button
                                                                onClick={() => handlePayNow(order)}
                                                                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-xl shadow-md transition-all active:scale-[0.98]"
                                                            >
                                                                <CreditCard size={14} />
                                                                <span>{t("orders.action.pay", "Bayar Sekarang")}</span>
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

            {/* Payment instructions modal */}
            <AnimatePresence>
                {showPaymentModal && selectedOrderForPayment && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowPaymentModal(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />

                        {/* Modal Body */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md p-6 relative z-10 text-slate-700"
                        >
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <h3 className="text-base font-extrabold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                                <CreditCard className="text-amber-500" size={20} />
                                <span>Metode Pembayaran</span>
                            </h3>

                            <div className="mt-4 text-xs space-y-4">
                                <div className="p-3 bg-amber-50 border border-amber-100 text-amber-800 rounded-2xl flex gap-2">
                                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                                    <p>Silakan selesaikan pembayaran Anda sebesar <strong>{formatPrice(selectedOrderForPayment.total_amount)}</strong> ke nomor rekening di bawah ini.</p>
                                </div>

                                <div className="space-y-3">
                                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Bank Transfer</p>
                                        <div className="mt-2 flex justify-between items-center font-bold">
                                            <span className="text-blue-950 font-mono text-sm">Bank BCA: 1234567890</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1">Atas Nama: PT Fayyfir Global Indonesia</p>
                                    </div>

                                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Saudi Arabia Transfer</p>
                                        <div className="mt-2 flex justify-between items-center font-bold">
                                            <span className="text-blue-950 font-mono text-sm">Al Rajhi Bank: 987654321</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1">Atas Nama: Fayyfir Trading Est.</p>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <p className="text-slate-500 leading-relaxed mb-3">Setelah melakukan transfer, silakan kirimkan bukti pembayaran kepada admin kami melalui WhatsApp dengan menekan tombol di bawah.</p>

                                    <a
                                        href={`https://wa.me/6281234567890?text=${encodeURIComponent(`Halo Admin, saya telah melakukan transfer untuk invoice ${selectedOrderForPayment.invoice_number} sebesar ${formatPrice(selectedOrderForPayment.total_amount)}. Berikut bukti transfernya.`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold py-3 px-4 rounded-2xl shadow-lg shadow-emerald-100 hover:from-emerald-500 hover:to-emerald-400 transition-all text-center"
                                    >
                                        <MessageCircle size={16} />
                                        <span>Kirim Bukti Transfer via WA</span>
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <Footer />
        </MainLayout>
    );
}
