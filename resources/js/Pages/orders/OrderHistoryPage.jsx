import React, { useState, useMemo, useEffect } from "react";
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
    ChevronRight,
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
import OrderCard from "@/Components/orders/OrderCard";
import CancelOrderModal from "@/Components/orders/CancelOrderModal";

export default function OrderHistoryPage({ orders = [], midtransClientKey, isProduction }) {
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

    const touchStartX = React.useRef(0);
    const touchStartY = React.useRef(0);

    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
        const deltaX = e.changedTouches[0].clientX - touchStartX.current;
        const deltaY = e.changedTouches[0].clientY - touchStartY.current;

        if (Math.abs(deltaX) > 80 && Math.abs(deltaY) < 40) {
            const tabIndex = tabs.findIndex(tab => tab.id === activeTab);
            if (deltaX < 0) {
                // Swipe Left -> Next Tab
                if (tabIndex < tabs.length - 1) {
                    setActiveTab(tabs[tabIndex + 1].id);
                    setExpandedOrderId(null);
                }
            } else {
                // Swipe Right -> Previous Tab
                if (tabIndex > 0) {
                    setActiveTab(tabs[tabIndex - 1].id);
                    setExpandedOrderId(null);
                }
            }
        }
    };

    const getEstimatedArrival = (order) => {
        const courier = order.shipping_courier ? order.shipping_courier.toLowerCase() : "";
        let durationText = t("orders.duration.regular", "2-3 Hari Kerja");
        if (courier.includes("instant") || courier.includes("sameday")) {
            durationText = t("orders.duration.sameday", "1 Hari (Sameday/Instant)");
        } else if (courier.includes("cargo") || courier.includes("trucking")) {
            durationText = t("orders.duration.cargo", "4-7 Hari Kerja");
        }
        
        if (order.updated_at) {
            try {
                const shipDate = new Date(order.updated_at);
                const minDays = (courier.includes("cargo") || courier.includes("trucking")) ? 4 : 2;
                const maxDays = (courier.includes("cargo") || courier.includes("trucking")) ? 7 : 3;
                
                const minDate = new Date(shipDate.getTime() + minDays * 24 * 60 * 60 * 1000);
                const maxDate = new Date(shipDate.getTime() + maxDays * 24 * 60 * 60 * 1000);
                
                const formatOptions = { day: 'numeric', month: 'short' };
                const minDateStr = minDate.toLocaleDateString(locale === "indonesia" ? "id-ID" : "en-US", formatOptions);
                const maxDateStr = maxDate.toLocaleDateString(locale === "indonesia" ? "id-ID" : "en-US", formatOptions);
                
                return `${minDateStr} - ${maxDateStr} (${durationText})`;
            } catch (err) {
                return durationText;
            }
        }
        return durationText;
    };

    const getWhatsAppReviewUrl = (order) => {
        const text = `Halo Admin Fayyfir Shop, saya ingin memberikan ulasan/nilai untuk pesanan saya:\n\n*No. Invoice:* ${order.invoice_number}\n\nPesanan saya sangat memuaskan!`;
        return `https://wa.me/6281234567890?text=${encodeURIComponent(text)}`;
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
        const triggerSnapPay = (snapToken) => {
            window.snap.pay(snapToken, {
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
        };

        const loadSnapAndPay = (snapToken) => {
            if (window.snap) {
                triggerSnapPay(snapToken);
                return;
            }

            // Load Snap script dynamically
            const scriptId = "midtrans-snap-script";
            let script = document.getElementById(scriptId);

            if (!script) {
                script = document.createElement("script");
                script.src = isProduction
                    ? "https://app.midtrans.com/snap/snap.js"
                    : "https://app.sandbox.midtrans.com/snap/snap.js";
                script.id = scriptId;
                script.setAttribute("data-client-key", midtransClientKey);
                script.async = true;

                script.onload = () => {
                    triggerSnapPay(snapToken);
                };
                script.onerror = () => {
                    alert("Gagal memuat sistem pembayaran Midtrans. Coba lagi.");
                };

                document.body.appendChild(script);
            } else {
                // If script tag exists but window.snap is not yet initialized
                script.onload = () => {
                    triggerSnapPay(snapToken);
                };
            }
        };

        axios.post(route('orders.payment-token', order.id))
            .then(res => {
                if (res.data && res.data.snap_token) {
                    loadSnapAndPay(res.data.snap_token);
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

            <div className="min-h-screen bg-slate-100 pb-10 pt-28" dir={isRtl ? "rtl" : "ltr"}>
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
                    <div 
                        className="space-y-4 min-h-[450px]"
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                    >
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
                                    {filteredOrders.map((order) => (
                                        <OrderCard
                                            key={order.id}
                                            order={order}
                                            isExpanded={expandedOrderId === order.id}
                                            onToggle={toggleExpand}
                                            onOpenCancelModal={openCancelModal}
                                            formatPrice={formatPrice}
                                            formatDate={formatDate}
                                            getLocalizedValue={getLocalizedValue}
                                            getEstimatedArrival={getEstimatedArrival}
                                            getWhatsAppUrl={getWhatsAppUrl}
                                            getWhatsAppReviewUrl={getWhatsAppReviewUrl}
                                            getStatusStyle={getStatusStyle}
                                        />
                                    ))}
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
                <CancelOrderModal
                    isOpen={isCancelModalOpen}
                    onClose={closeCancelModal}
                    onSubmit={handleCancelSubmit}
                    cancelReason={cancelReason}
                    setCancelReason={setCancelReason}
                    isSubmitting={isSubmittingCancel}
                />
            </AnimatePresence>

            <Footer />
        </MainLayout>
    );
}
