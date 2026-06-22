import React, { useState, useEffect } from "react";
import { Link, router } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Store,
    ChevronRight,
    ChevronDown,
    Calendar,
    X,
    Clock,
    Package,
    Truck,
    CheckCircle2,
    MessageCircle,
    CreditCard,
    ExternalLink,
    MapPin,
    DollarSign
} from "lucide-react";
import { useLanguage } from "@/Contexts/LanguageContext";
import ReviewOrderModal from "./ReviewOrderModal";

function PaymentCountdown({ expiryTime, paymentMethod, paymentDetails, onClickPay, t }) {
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        if (!expiryTime) {
            setTimeLeft("23:59:59");
            return;
        }

        const updateTimer = () => {
            const diff = +new Date(expiryTime.replace(/-/g, "/")) - +new Date();
            if (diff <= 0) {
                setTimeLeft("Expired");
                return;
            }
            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff / (1000 * 60)) % 60);
            const s = Math.floor((diff / 1000) % 60);
            setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        };

        updateTimer();
        const timer = setInterval(updateTimer, 1000);
        return () => clearInterval(timer);
    }, [expiryTime]);

    if (timeLeft === "Expired") return null;

    const getPaymentName = () => {
        if (paymentDetails?.bank) {
            return `Bank ${paymentDetails.bank.toUpperCase()}`;
        }
        if (paymentMethod === "cod") {
            return t('orders.payment_method.cod'); // "COD (Bayar di Tempat)" / "COD (Cash on Delivery)"
        }
        return paymentMethod ? paymentMethod.toUpperCase().replace("_VA", " VA") : t('orders.payment_method.transfer');
    };

    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                onClickPay(e);
            }}
            className="mt-2.5 flex items-center justify-between p-3 px-3.5 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-slate-800 cursor-pointer hover:bg-blue-100/60 transition-colors"
        >
            <div className="flex items-center gap-1.5">
                <span>
                    {t('orders.pay_within')}{" "}
                    <strong className="text-blue-900 font-mono font-bold">{timeLeft || "23:59:59"}</strong>{" "}
                    {t('orders.with_method')} {getPaymentName()}
                </span>
            </div>
            <ChevronRight className="w-4 h-4 text-blue-900 shrink-0" />
        </div>
    );
}

export default function OrderCard({
    order,
    isExpanded,
    onToggle,
    onOpenCancelModal,
    formatPrice,
    formatDate,
    getLocalizedValue,
    getEstimatedArrival,
    getWhatsAppUrl,
    getWhatsAppReviewUrl,
    getStatusStyle
}) {
    const { t, locale } = useLanguage();
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const statusInfo = getStatusStyle(order.status, order.payment_status, order.cancellation_status);

    const isOrderReviewed = order.items.some(item => {
        if (!item.product) return false;
        return item.product.reviews && item.product.reviews.some(r => 
            Number(r.order_id) === Number(order.id) &&
            Number(r.product_id) === Number(item.product_id) &&
            (item.product_variant_id ? Number(r.product_variant_id) === Number(item.product_variant_id) : true)
        );
    });

    const getFirstProductSlug = (order) => {
        const firstItem = order.items?.[0];
        return firstItem?.product?.slug || null;
    };

    const handleShopAgain = (e, order) => {
        e.stopPropagation();
        const slug = getFirstProductSlug(order);
        if (slug) {
            router.visit(`/product/${slug}`);
        } else {
            router.visit('/products');
        }
    };

    return (
        <div
            onClick={() => onToggle(order.id)}
            className="bg-white border border-slate-200/80 shadow-xs rounded-2xl overflow-hidden hover:shadow-sm transition-shadow cursor-pointer p-4 space-y-3"
        >
            {/* Card Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 bg-white">
                <div className="flex items-center gap-1.5">
                    <Store size={15} className="text-slate-500 shrink-0" />
                    <span className="font-semibold text-slate-800 text-xs md:text-sm select-none">
                        {order.store_branch?.name || "Fayyfir Shop"}
                    </span>
                    <ChevronRight size={14} className="text-slate-400 shrink-0" />

                    <div className="hidden sm:flex items-center gap-2.5 ml-2 border-l border-slate-200 pl-3">
                        <span className="font-mono text-[10px] bg-slate-50 border border-slate-200 text-slate-500 px-2 py-0.5 rounded-lg">
                            {order.invoice_number}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Calendar size={11} />
                            <span>{formatDate(order.created_at)}</span>
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold uppercase tracking-wider ${order.payment_status === "unpaid" && order.status === "pending"
                        ? "text-blue-900"
                        : order.status === "cancelled"
                            ? "text-rose-600"
                            : order.status === "completed"
                                ? "text-emerald-600"
                                : "text-blue-600"
                        }`}>
                        {statusInfo.label}
                    </span>
                </div>
            </div>

            {/* Card Content (Main items brief) */}
            <div className="space-y-3">
                {order.items.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-start">
                        {/* Image thumbnail placeholder */}
                        <div className="w-16 h-16 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center flex-shrink-0">
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
                                            className="max-w-full max-h-full object-contain rounded-lg"
                                        />
                                    );
                                })()
                            ) : (
                                <Package className="text-slate-400" size={20} />
                            )}
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                            <h4 className="text-xs md:text-sm font-medium text-slate-800 leading-snug line-clamp-2">
                                {getLocalizedValue(item.product?.name_translations, item.product?.title)}
                            </h4>
                            {item.variant && (
                                <p className="text-[10px] text-slate-500 mt-1">
                                    {t('orders.variant')}: {getLocalizedValue(item.variant.name_translations, item.variant.name)}
                                </p>
                            )}
                        </div>

                        {/* Right: Quantity and Price Stacked */}
                        <div className="text-right flex-shrink-0 select-none">
                            <span className="text-[11px] text-slate-400 block">x{item.quantity}</span>
                            <span className="text-xs md:text-sm font-semibold text-slate-900 block mt-1">{formatPrice(item.price)}</span>
                        </div>
                    </div>
                ))}

                {!isExpanded && order.status === 'shipped' && (
                    <div className="mt-3 flex items-center gap-2 p-3 bg-blue-50/50 border border-blue-100 rounded-2xl text-xs text-blue-800">
                        <Truck size={14} className="text-blue-700 shrink-0" />
                        <span>
                            <strong>{t('orders.est_arrival')}:</strong> {getEstimatedArrival(order)}
                        </span>
                    </div>
                )}
            </div>

            {/* Total Products Block */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-slate-500 gap-2.5 pt-2 border-t border-slate-100/50">
                {/* Desktop metadata */}
                <div className="hidden md:flex items-center gap-2 text-[10.5px] text-slate-500 select-none">
                    <span className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-xl font-medium">
                        <Truck size={12} className="text-slate-400" />
                        <span>{order.shipping_courier?.toUpperCase()} {order.shipping_service ? `(${order.shipping_service})` : ''}</span>
                    </span>
                    <span className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-xl font-medium">
                        <CreditCard size={12} className="text-slate-400" />
                        <span>{order.payment_method?.toUpperCase().replace("_VA", " VA").replace("_", " ")}</span>
                    </span>
                    <span className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-xl font-medium max-w-[200px]">
                        <MapPin size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate">{t('orders.receiver')}: {order.user?.receiver_name || order.user?.name || '-'}</span>
                    </span>
                </div>

                {/* Total payment */}
                <div className="flex items-center gap-1.5 ml-auto">
                    <span>{t('orders.total_products', 'Total {count} produk:').replace('{count}', order.items.reduce((sum, item) => sum + item.quantity, 0))}</span>
                    <span className="text-sm md:text-base font-bold text-blue-900">
                        {formatPrice(order.total_amount)}
                    </span>
                </div>
            </div>

            {/* Payment Countdown Banner for Unpaid */}
            {order.payment_status === "unpaid" && order.status === "pending" && order.cancellation_status !== "pending" && (
                <PaymentCountdown
                    expiryTime={order.payment_details?.expiry_time}
                    paymentMethod={order.payment_method}
                    paymentDetails={order.payment_details}
                    t={t}
                    onClickPay={(e) => {
                        e.stopPropagation();
                        router.visit(route('checkout.payment', order.id));
                    }}
                />
            )}

            {/* Actions Row */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                <div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggle(order.id);
                        }}
                        className="hidden md:inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 px-3 py-1.5 border border-slate-300 rounded-lg transition-all select-none"
                    >
                        <span>{isExpanded ? t('orders.action.hide_detail') : t('orders.action.show_detail')}</span>
                        <ChevronDown size={14} className={`transform transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                </div>
                <div className="flex gap-2">
                    {/* 1. UNPAID STATE */}
                    {order.payment_status === "unpaid" && order.status === "pending" && order.cancellation_status !== "pending" && (
                        <>
                            <a
                                href={getWhatsAppUrl(order)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50/50 px-3.5 py-1.5 border border-slate-300 rounded-lg transition-all"
                            >
                                <MessageCircle size={13} className="shrink-0 text-slate-500" />
                                <span>{t('orders.action.contact_admin')}</span>
                            </a>
                            <Link
                                href={route('checkout.payment', order.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 px-5 py-1.5 rounded-lg shadow-xs transition-all active:scale-[0.98] whitespace-nowrap"
                            >
                                <CreditCard size={13} className="shrink-0" />
                                <span>{t('orders.action.pay')}</span>
                            </Link>
                        </>
                    )}

                    {/* 2. PROCESSING / PAID STATE */}
                    {(order.status === "processing" || (order.status === "pending" && order.payment_status === "paid")) && (
                        <a
                            href={getWhatsAppUrl(order)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50/50 px-3.5 py-1.5 border border-slate-300 rounded-lg transition-all"
                        >
                            <MessageCircle size={13} className="shrink-0 text-slate-500" />
                            <span>{t('orders.action.contact_admin')}</span>
                        </a>
                    )}

                    {/* 3. SHIPPED STATE */}
                    {order.status === "shipped" && (
                        <a
                            href={order.tracking_number ? `https://results.biteship.com/tracking/${order.tracking_number}` : route('orders.track', order.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 px-4 py-1.5 rounded-lg shadow-xs transition-all active:scale-[0.98] whitespace-nowrap"
                        >
                            <span>{t('orders.action.track_shipping')}</span>
                            <ExternalLink size={13} className="shrink-0" />
                        </a>
                    )}

                    {/* 4. COMPLETED STATE */}
                    {order.status === "completed" && (
                        isOrderReviewed ? (
                            <button
                                onClick={(e) => handleShopAgain(e, order)}
                                className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-1.5 rounded-lg shadow-xs transition-all active:scale-[0.98] whitespace-nowrap"
                            >
                                <span>{t('orders.action.shop_again', 'Belanja Lagi')}</span>
                            </button>
                        ) : (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsReviewOpen(true);
                                }}
                                className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 px-4 py-1.5 rounded-lg shadow-xs transition-all active:scale-[0.98] whitespace-nowrap"
                            >
                                <span>{t('orders.action.review')}</span>
                            </button>
                        )
                    )}

                    {/* 5. CANCELLED STATE */}
                    {order.status === "cancelled" && (
                        <button
                            onClick={(e) => handleShopAgain(e, order)}
                            className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 px-4 py-1.5 rounded-lg shadow-xs transition-all active:scale-[0.98] whitespace-nowrap"
                        >
                            <span>{t('orders.action.shop_again')}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Card Expandable Details Accordion */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-slate-100 pt-3"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] text-slate-600">
                            {/* Left: Shipping destination details */}
                            <div className="space-y-3">
                                {/* Mobile-only Order Metadata Block */}
                                <div className="grid grid-cols-2 gap-2 bg-slate-50/50 border border-slate-100 p-3 rounded-xl md:hidden shadow-xs">
                                    <div className="col-span-2 pb-1.5 border-b border-slate-100 flex justify-between items-center">
                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{t('orders.invoice_info')}</span>
                                        <strong className="text-blue-950 font-mono text-xs">{order.invoice_number}</strong>
                                    </div>
                                    <div>
                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">{t('orders.order_date')}</span>
                                        <span className="text-slate-700 font-semibold">{formatDate(order.created_at)}</span>
                                    </div>
                                    <div>
                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">{t('orders.shipping_warehouse')}</span>
                                        <span className="text-slate-700 font-semibold">{order.store_branch?.name || "-"}</span>
                                    </div>
                                </div>
                                <div>
                                    <h5 className="font-bold text-slate-900 flex items-center gap-1 mb-1">
                                        <MapPin size={12} className="text-blue-700" />
                                        <span>{t('orders.shipping_address')}</span>
                                    </h5>
                                    <div className="leading-relaxed bg-slate-50/30 border border-slate-100 p-2.5 rounded-xl text-slate-600">
                                        {order.user?.address ? (
                                            <div className="space-y-0.5">
                                                <p className="font-bold text-slate-800">{order.user.receiver_name || order.user.name}</p>
                                                <p className="text-slate-500 font-mono text-[10px]">{order.user.phone || '-'}</p>
                                                <p className="mt-1 leading-normal">
                                                    {order.user.address}, Kec. {order.user.district}, {order.user.city}, {order.user.province} {order.user.postal_code}
                                                </p>
                                            </div>
                                        ) : (
                                            <p>{order.shipping_address}</p>
                                        )}
                                    </div>
                                </div>

                                {order.notes && (
                                    <div>
                                        <h5 className="font-bold text-slate-900 mb-1">{t('orders.order_notes')}</h5>
                                        <p className="italic text-slate-500 bg-slate-50/30 border border-slate-100 p-2.5 rounded-xl">
                                            "{order.notes}"
                                        </p>
                                    </div>
                                )}
                                {order.cancellation_reason && (
                                    <div>
                                        <h5 className="font-bold text-slate-900 mb-1">{t('orders.cancel_reason')}</h5>
                                        <p className="text-rose-600 bg-rose-50/30 border border-rose-100 p-2.5 rounded-xl">
                                            "{order.cancellation_reason}"
                                            {order.cancellation_status && (
                                                <span className="block text-[9px] text-slate-400 mt-1 uppercase font-bold">
                                                    {t('orders.cancel_status')}: {order.cancellation_status}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Right: Payment details */}
                            <div className="space-y-3">
                                <div>
                                    <h5 className="font-bold text-slate-900 flex items-center gap-1 mb-1">
                                        <DollarSign size={12} className="text-blue-700" />
                                        <span>{t('orders.payment_details')}</span>
                                    </h5>
                                    <div className="bg-slate-50/30 border border-slate-100 p-3 rounded-xl space-y-1.5">
                                        <div className="flex justify-between">
                                            <span>{t('orders.subtotal')}</span>
                                            <span className="font-semibold text-slate-800">{formatPrice(order.subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>{t('orders.shipping_cost')} ({order.shipping_courier})</span>
                                            <span className="font-semibold text-slate-800">{formatPrice(order.shipping_cost)}</span>
                                        </div>
                                        {order.discount_amount > 0 && (
                                            <div className="flex justify-between text-emerald-600">
                                                <span>{t('orders.discount')}</span>
                                                <span>-{formatPrice(order.discount_amount)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between pt-1.5 border-t border-slate-100 font-bold text-xs text-slate-900">
                                            <span>{t('orders.total_payment')}</span>
                                            <span className="text-blue-900 font-extrabold">{formatPrice(order.total_amount)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Cancellation Actions */}
                                <div className="flex justify-end pt-1">
                                    {(order.status === "pending" || order.status === "processing") && (
                                        <>
                                            {order.cancellation_status === "pending" && (
                                                <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg">
                                                    {t('orders.cancel_awaiting')}
                                                </span>
                                            )}
                                            {order.cancellation_status === "rejected" && (
                                                <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-lg">
                                                    {t('orders.cancel_rejected')}
                                                </span>
                                            )}
                                            {order.cancellation_status !== "pending" && order.cancellation_status !== "rejected" && order.cancellation_status !== "approved" && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onOpenCancelModal(order.id);
                                                    }}
                                                    className="text-xs font-bold text-rose-600 border border-rose-200 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-all"
                                                >
                                                    {t('orders.action.request_cancel')}
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Review Order Modal */}
            <ReviewOrderModal
                isOpen={isReviewOpen}
                onClose={() => setIsReviewOpen(false)}
                order={order}
            />
        </div>
    );
}