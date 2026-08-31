import React, { useState, useEffect } from 'react';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import {
    Eye,
    Truck,
    Search,
    ShoppingBag,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    Calendar,
    User,
    MapPin,
    CreditCard,
    DollarSign,
    Box,
    Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/Contexts/LanguageContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function Orders({ orders = [], status }) {
    const { t, locale } = useLanguage();

    const [searchTerm, setSearchTerm] = useState('');
    const [statusTab, setStatusTab] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [bookingShipmentId, setBookingShipmentId] = useState(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    // Inline tracking state (inside modal)
    const [trackingData, setTrackingData] = useState(null);
    const [isTrackingLoading, setIsTrackingLoading] = useState(false);
    const [isTrackingOpen, setIsTrackingOpen] = useState(false);

    const translateStatus = (status) => {
        if (!status) return '';
        const s = status.toLowerCase();
        switch (s) {
            case 'confirmed': return 'Pengiriman Terkonfirmasi';
            case 'allocated': return 'Kurir Dialokasikan';
            case 'picking_up': return 'Dalam Penjemputan';
            case 'picked': return 'Paket Telah Dijemput';
            case 'dropping_off':
            case 'in_transit': return 'Sedang Diantar ke Tujuan';
            case 'on_hold': return 'Paket Tertahan di Transit';
            case 'delivered': return 'Paket Terkirim';
            case 'cancelled': return 'Pengiriman Dibatalkan';
            case 'shipped': return 'Sedang Dikirim';
            case 'completed': return 'Selesai';
            default: return status.toUpperCase();
        }
    };

    const handleTrackOrder = async (order) => {
        setIsTrackingOpen(true);
        setTrackingData(null);
        setIsTrackingLoading(true);
        try {
            const res = await fetch(route('backoffice.orders.track-api', order.id));
            const json = await res.json();
            setTrackingData(json);
        } catch (e) {
            setTrackingData({ success: false, error: 'Gagal memuat data pelacakan.' });
        } finally {
            setIsTrackingLoading(false);
        }
    };

    const formatPrice = (value) => {
        // Backoffice displays centered values in IDR
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(value || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const { notifications = [] } = usePage().props;
    const [readNotifIds, setReadNotifIds] = useState([]);

    const hasInitializedSearch = React.useRef(false);

    useEffect(() => {
        if (orders.length > 0 && !hasInitializedSearch.current) {
            const params = new URLSearchParams(window.location.search);
            const searchParam = params.get('search');
            if (searchParam) {
                setSearchTerm(searchParam);
                const matchedOrder = orders.find(o => o.invoice_number === searchParam);
                if (matchedOrder) {
                    setSelectedOrder(matchedOrder);
                    setIsDetailOpen(true);
                }
            }
            hasInitializedSearch.current = true;
        }
    }, [orders]);

    useEffect(() => {
        const loadReadIds = () => {
            const stored = JSON.parse(localStorage.getItem('fayyfir_admin_read_notifications') || '[]');
            setReadNotifIds(stored);
        };
        loadReadIds();
        window.addEventListener('admin-notifications-updated', loadReadIds);
        return () => window.removeEventListener('admin-notifications-updated', loadReadIds);
    }, []);

    const unreadOrderNotifs = notifications.filter(
        (n) => n.type === 'order_status' && !readNotifIds.includes(n.id)
    );

    // Mark notifications as read only when user explicitly clicks a specific status tab
    const handleTabChange = (tab) => {
        setStatusTab(tab);
        if (tab === 'all') return; // Don't auto-read 'all' tab — dots should remain visible

        const matching = unreadOrderNotifs.filter(n => n.status === tab);
        if (matching.length > 0) {
            const stored = JSON.parse(localStorage.getItem('fayyfir_admin_read_notifications') || '[]');
            let updated = false;
            matching.forEach((n) => {
                if (!stored.includes(n.id)) {
                    stored.push(n.id);
                    updated = true;
                }
            });
            if (updated) {
                localStorage.setItem('fayyfir_admin_read_notifications', JSON.stringify(stored));
                window.dispatchEvent(new Event('admin-notifications-updated'));
            }
        }
    };

    // Filters
    const filteredOrders = orders.filter((order) => {
        const matchesSearch =
            order.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.user?.name && order.user.name.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesTab = statusTab === 'all' || order.status === statusTab;

        return matchesSearch && matchesTab;
    });

    // open order details modal
    const handleOpenDetail = (order) => {
        setSelectedOrder(order);
        setIsDetailOpen(true);

        // Mark any notifications for this order as read
        const orderNotifs = unreadOrderNotifs.filter(n => n.invoice_number === order.invoice_number);
        if (orderNotifs.length > 0) {
            const stored = JSON.parse(localStorage.getItem('fayyfir_admin_read_notifications') || '[]');
            let updated = false;
            orderNotifs.forEach((n) => {
                if (!stored.includes(n.id)) {
                    stored.push(n.id);
                    updated = true;
                }
            });
            if (updated) {
                localStorage.setItem('fayyfir_admin_read_notifications', JSON.stringify(stored));
                window.dispatchEvent(new Event('admin-notifications-updated'));
            }
        }
    };

    // request Biteship shipping booking
    const handleCreateBiteshipShipment = (orderId) => {
        setBookingShipmentId(orderId);
        router.post(route('backoffice.orders.biteship-shipment', orderId), {}, {
            preserveScroll: true,
            onFinish: () => {
                setBookingShipmentId(null);
                setIsDetailOpen(false);
            }
        });
    };

    const handleApproveCancel = (orderId) => {
        if (!confirm(t('backoffice.orders.confirm.approve_cancel', 'Apakah Anda yakin ingin menyetujui pembatalan pesanan ini? Stok produk akan dikembalikan.'))) {
            return;
        }
        router.post(route('backoffice.orders.approve-cancellation', orderId), {}, {
            preserveScroll: true,
            onSuccess: (page) => {
                // Refresh modal data
                const updated = page.props.orders.find(o => o.id === selectedOrder.id);
                if (updated) setSelectedOrder(updated);
            }
        });
    };

    const handleRejectCancel = (orderId) => {
        if (!confirm(t('backoffice.orders.confirm.reject_cancel', 'Apakah Anda yakin ingin menolak pembatalan pesanan ini?'))) {
            return;
        }
        router.post(route('backoffice.orders.reject-cancellation', orderId), {}, {
            preserveScroll: true,
            onSuccess: (page) => {
                // Refresh modal data
                const updated = page.props.orders.find(o => o.id === selectedOrder.id);
                if (updated) setSelectedOrder(updated);
            }
        });
    };

    const handleUpdateStatus = (orderId, newStatus) => {
        setIsUpdatingStatus(true);
        router.patch(route('backoffice.orders.update-status', orderId), {
            status: newStatus,
            payment_status: selectedOrder.payment_status
        }, {
            preserveScroll: true,
            onSuccess: (page) => {
                const updated = page.props.orders.find(o => o.id === selectedOrder.id);
                if (updated) setSelectedOrder(updated);
            },
            onFinish: () => {
                setIsUpdatingStatus(false);
            }
        });
    };

    const handleUpdatePaymentStatus = (orderId, newPaymentStatus) => {
        setIsUpdatingStatus(true);
        router.patch(route('backoffice.orders.update-status', orderId), {
            status: selectedOrder.status,
            payment_status: newPaymentStatus
        }, {
            preserveScroll: true,
            onSuccess: (page) => {
                const updated = page.props.orders.find(o => o.id === selectedOrder.id);
                if (updated) setSelectedOrder(updated);
            },
            onFinish: () => {
                setIsUpdatingStatus(false);
            }
        });
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700"><Clock size={12} /> {t('backoffice.orders.status.pending', 'Pending')}</span>;
            case 'processing':
                return <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700"><ActivityIcon size={12} /> {t('backoffice.orders.status.processing', 'Processing')}</span>;
            case 'shipped':
                return <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700"><Truck size={12} /> {t('backoffice.orders.status.shipped', 'Shipped')}</span>;
            case 'completed':
                return <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700"><CheckCircle size={12} /> {t('backoffice.orders.status.completed', 'Completed')}</span>;
            case 'cancelled':
                return <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700"><XCircle size={12} /> {t('backoffice.orders.status.cancelled', 'Cancelled')}</span>;
            default:
                return <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700">{status}</span>;
        }
    };

    const getPaymentBadge = (status) => {
        switch (status) {
            case 'unpaid':
                return <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-rose-700">{t('backoffice.orders.payment.unpaid', 'Unpaid')}</span>;
            case 'paid':
                return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700">{t('backoffice.orders.payment.paid', 'Paid')}</span>;
            case 'expired':
                return <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">{t('backoffice.orders.payment.expired', 'Expired')}</span>;
            case 'refunded':
                return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-700">{t('backoffice.orders.payment.refunded', 'Refunded')}</span>;
            default:
                return <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-700">{status}</span>;
        }
    };

    const getTabIcon = (tab) => {
        switch (tab) {
            case 'all':
                return <ShoppingBag size={14} />;
            case 'pending':
                return <Clock size={14} />;
            case 'processing':
                return <ActivityIcon size={14} />;
            case 'shipped':
                return <Truck size={14} />;
            case 'completed':
                return <CheckCircle size={14} />;
            case 'cancelled':
                return <XCircle size={14} />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-blue-50">
            <Head title={t('backoffice.orders.title', 'Orders Management') + " - Backoffice"} />

            <div className="flex min-h-screen">
                <Sidebar />

                <main className="flex min-w-0 flex-1 flex-col">
                    <Navbar />

                    <div className="flex-1 p-6 space-y-6">
                        {/* Title Section */}
                        <section className="flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold tracking-normal text-blue-950">
                                    {t('backoffice.orders.title', 'Orders Management')}
                                </h1>
                                <p className="max-w-2xl mt-1 text-sm text-slate-600">
                                    {t('backoffice.orders.subtitle', 'Monitor customer transactions, update order status, and book courier pickup using Biteship.')}
                                </p>
                            </div>
                        </section>

                        {/* Status Message */}
                        {status && (
                            <section className="px-4 py-3 text-sm font-semibold border rounded-lg border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm">
                                {status}
                            </section>
                        )}

                        {/* Main Content Area */}
                        <div className="bg-white border border-blue-100 rounded-2xl shadow-sm overflow-hidden">
                            {/* Toolbar */}
                            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
                                {/* Status tabs */}
                                <div className="flex gap-1.5 overflow-x-auto">
                                    {['all', 'pending', 'processing', 'shipped', 'completed', 'cancelled'].map((tab) => {
                                        const tabHasDot = tab === 'all'
                                            ? unreadOrderNotifs.length > 0
                                            : unreadOrderNotifs.some(n => n.status === tab);
                                        return (
                                            <button
                                                key={tab}
                                                onClick={() => handleTabChange(tab)}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg uppercase tracking-wide transition-all ${statusTab === tab
                                                    ? 'bg-blue-950 text-white shadow-sm'
                                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {getTabIcon(tab)}
                                                <span>{t('backoffice.orders.tabs.' + tab, tab.charAt(0).toUpperCase() + tab.slice(1))}</span>
                                                {tabHasDot && (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shadow-sm" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Search bar */}
                                <div className="relative w-full max-w-xs">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                        <Search size={14} />
                                    </span>
                                    <input
                                        type="text"
                                        placeholder={t('backoffice.orders.search_placeholder', 'Search invoice or customer...')}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white focus:border-blue-500 transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                            <th className="p-4 w-12">{t('backoffice.orders.table.no', 'No')}</th>
                                            <th className="p-4">{t('backoffice.orders.table.invoice_date', 'Invoice / Date')}</th>
                                            <th className="p-4">{t('backoffice.orders.table.customer', 'Customer')}</th>
                                            <th className="p-4">{t('backoffice.orders.table.shipping_warehouse', 'Shipping Warehouse')}</th>
                                            <th className="p-4 text-right">{t('backoffice.orders.table.total_billing', 'Total Billing')}</th>
                                            <th className="p-4">{t('backoffice.orders.table.courier_service', 'Courier & Service')}</th>
                                            {statusTab === 'cancelled' && <th className="p-4">{t('backoffice.orders.table.cancellation_reason', 'Cancellation Reason')}</th>}
                                            <th className="p-4">{t('backoffice.orders.table.payment_status', 'Payment & Status')}</th>
                                            <th className="p-4 text-center">{t('backoffice.orders.table.actions', 'Actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs">
                                        {filteredOrders.length === 0 ? (
                                            <tr>
                                                <td colSpan={statusTab === 'cancelled' ? 9 : 8} className="p-8 text-center text-slate-400">
                                                    {t('backoffice.orders.table.empty', 'No orders found matching the filter criteria.')}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredOrders.map((order, idx) => (
                                                <tr key={order.id} className="hover:bg-slate-50/50">
                                                    <td className="p-4 font-bold text-slate-400">{idx + 1}</td>
                                                    <td className="p-4">
                                                        <div className="font-mono font-bold text-blue-950">{order.invoice_number}</div>
                                                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                                            <Calendar size={10} /> {formatDate(order.created_at)}
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="font-semibold text-slate-800">{order.user?.name ?? 'Guest'}</div>
                                                        <div className="text-[10px] text-slate-400 mt-0.5">{order.user?.email}</div>
                                                    </td>
                                                    <td className="p-4 font-semibold text-slate-700">
                                                        {order.store_branch?.name ?? '-'}
                                                    </td>
                                                    <td className="p-4 font-extrabold text-blue-900 text-right">
                                                        {formatPrice(order.total_amount)}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="font-extrabold uppercase text-slate-800 tracking-wider">
                                                                {order.shipping_courier || '-'}
                                                            </span>
                                                            <span className="text-[10px] font-medium text-slate-500">
                                                                {order.shipping_service || ''}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    {statusTab === 'cancelled' && (
                                                        <td className="p-4 max-w-[200px] truncate font-medium text-rose-600" title={order.cancellation_reason}>
                                                            {order.cancellation_reason || '-'}
                                                        </td>
                                                    )}
                                                    <td className="p-4">
                                                        <div className="flex flex-col gap-1.5 items-start">
                                                            {getPaymentBadge(order.payment_status)}
                                                            {order.cancellation_status === 'pending' && (
                                                                <span className="inline-flex items-center gap-1 rounded bg-rose-50 border border-rose-100 px-2 py-0.5 text-[9px] font-bold text-rose-700 animate-pulse">
                                                                    {t('backoffice.orders.cancellation.req', 'Cancel Req')}
                                                                </span>
                                                            )}
                                                            {order.cancellation_status === 'rejected' && (
                                                                <span className="inline-flex items-center gap-1 rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-[9px] font-bold text-slate-500">
                                                                    {t('backoffice.orders.cancellation.rejected', 'Cancel Rejected')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <button
                                                                onClick={() => handleOpenDetail(order)}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-blue-800 hover:bg-blue-100 rounded-lg font-bold transition text-xs"
                                                            >
                                                                <Eye size={12} />
                                                                <span>{t('backoffice.orders.action.details', 'Details')}</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Detailed View Modal */}
            <AnimatePresence>
                {isDetailOpen && selectedOrder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white border border-slate-100 rounded-3xl shadow-xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div>
                                    <h3 className="font-mono text-sm font-black text-blue-950 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg inline-block">
                                        {selectedOrder.invoice_number}
                                    </h3>
                                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                        <Calendar size={10} /> {t('backoffice.orders.modal.created_on', 'Created on {date}').replace('{date}', formatDate(selectedOrder.created_at))}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsDetailOpen(false)}
                                    className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                                >
                                    <XIcon size={20} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
                                    {/* Column 1: Customer details */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><User size={12} /> {t('backoffice.orders.modal.customer_info', 'Customer Information')}</h4>
                                        <div className="bg-slate-50 rounded-2xl p-4 text-xs space-y-2">
                                            <div>
                                                <span className="text-slate-400 block">{t('backoffice.orders.modal.name', 'Name')}</span>
                                                <strong className="text-slate-800">{selectedOrder.user?.name}</strong>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block">{t('backoffice.orders.modal.phone', 'Phone')}</span>
                                                <strong className="text-slate-800">{selectedOrder.user?.phone}</strong>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block">{t('backoffice.orders.modal.email', 'Email')}</span>
                                                <strong className="text-slate-800">{selectedOrder.user?.email}</strong>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Column 2: Shipping details */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><Truck size={12} /> {t('backoffice.orders.modal.shipping_destination', 'Shipping Destination')}</h4>
                                        <div className="bg-slate-50 rounded-2xl p-4 text-xs space-y-2">
                                            <div>
                                                <span className="text-slate-400 block">{t('backoffice.orders.modal.recipient', 'Recipient')}</span>
                                                <strong className="text-slate-800">{selectedOrder.receiver_name || selectedOrder.user?.receiver_name || selectedOrder.user?.name}</strong>
                                                {(selectedOrder.receiver_phone || selectedOrder.user?.phone) && (
                                                    <span className="text-slate-500 block font-mono text-[11px] mt-0.5">{selectedOrder.receiver_phone || selectedOrder.user?.phone}</span>
                                                )}
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block">{t('backoffice.orders.modal.courier_service', 'Courier Service')}</span>
                                                <strong className="text-slate-800 uppercase">{selectedOrder.shipping_courier} - {selectedOrder.shipping_service}</strong>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block">{t('backoffice.orders.modal.address_details', 'Address Details')}</span>
                                                <p className="text-slate-600 mt-0.5 leading-normal">{selectedOrder.shipping_address || (selectedOrder.user?.address ? `${selectedOrder.user.address}, Kec. ${selectedOrder.user.district}, ${selectedOrder.user.city}, ${selectedOrder.user.province} ${selectedOrder.user.postal_code}` : '-')}</p>
                                            </div>
                                            {selectedOrder.tracking_number && (
                                                <div className="pt-2 border-t border-slate-200/80 space-y-2">
                                                    <div>
                                                        <span className="text-slate-400 block">{t('backoffice.orders.modal.awb', 'Airwaybill (AWB)')}</span>
                                                        <strong className="text-blue-950 font-mono">{selectedOrder.tracking_number}</strong>
                                                    </div>
                                                    {selectedOrder.status === 'processing' ? (
                                                        <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded-lg">
                                                            <span>{t('backoffice.orders.modal.waiting_pickup', 'Menunggu Penjemputan Kurir')}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <button
                                                                onClick={() => handleTrackOrder(selectedOrder)}
                                                                className="inline-flex items-center gap-1.5 text-[10px] font-black text-indigo-800 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/60 px-3 py-1.5 rounded-xl transition"
                                                            >
                                                                <Truck size={12} />
                                                                <span>{t('backoffice.orders.modal.track_shipment', 'Lacak Pengiriman')}</span>
                                                            </button>
                                                            <a
                                                                href={route('backoffice.orders.print-waybill', selectedOrder.id)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1.5 text-[10px] font-black text-slate-800 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 border border-slate-300/80 px-3 py-1.5 rounded-xl transition"
                                                            >
                                                                <Printer size={12} />
                                                                <span>{t('backoffice.orders.modal.print_waybill', 'Cetak Resi')}</span>
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Column 3: Logistics details & Actions */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><Box size={12} /> {t('backoffice.orders.modal.processing_warehouse', 'Processing Warehouse')}</h4>
                                        <div className="bg-slate-50 rounded-2xl p-4 text-xs space-y-2">
                                            <div>
                                                <span className="text-slate-400 block">{t('backoffice.orders.modal.fulfillment_branch', 'Fulfillment Branch')}</span>
                                                <strong className="text-slate-800">{selectedOrder.store_branch?.name}</strong>
                                                <span className="text-[10px] text-slate-400 block mt-0.5">Area ID: {selectedOrder.store_branch?.area_id ?? 'None'}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block">{t('backoffice.orders.modal.destination_area', 'Customer Destination Area ID')}</span>
                                                <strong className="text-slate-800">{selectedOrder.user?.area_id ?? 'None'}</strong>
                                            </div>
                                            {selectedOrder.tracking_number && (
                                                <div className="pt-1.5 border-t border-slate-200/80 mt-1">
                                                    <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-100">
                                                        {t('backoffice.orders.modal.shipment_booked', 'Shipment Booked')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Order Items Table */}
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><ShoppingBag size={12} /> {t('backoffice.orders.modal.ordered_items', 'Ordered Items')}</h4>
                                    <div className="border border-slate-100 rounded-2xl overflow-hidden">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                                    <th className="p-3">{t('backoffice.orders.modal.product', 'Product')}</th>
                                                    <th className="p-3 text-right">{t('backoffice.orders.modal.price', 'Price')}</th>
                                                    <th className="p-3 text-center">{t('backoffice.orders.modal.qty', 'Qty')}</th>
                                                    <th className="p-3 text-right">{t('backoffice.orders.modal.subtotal', 'Subtotal')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                                {selectedOrder.items?.map((item) => (
                                                    <tr key={item.id}>
                                                        <td className="p-3">
                                                            <div className="font-bold text-slate-800">{item.product?.title}</div>
                                                            {item.variant && (
                                                                <div className="text-[10px] text-slate-400 mt-0.5">{t('backoffice.orders.modal.variant', 'Varian:')} {item.variant.name}</div>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-right">{formatPrice(item.price)}</td>
                                                        <td className="p-3 text-center font-bold">{item.quantity}</td>
                                                        <td className="p-3 text-right font-bold text-slate-900">{formatPrice(item.price * item.quantity)}</td>
                                                    </tr>
                                                ))}
                                                <tr className="bg-slate-50/50 font-bold border-t border-slate-100">
                                                    <td colSpan={3} className="p-3 text-right text-slate-500">{t('backoffice.orders.modal.subtotal', 'Subtotal')}</td>
                                                    <td className="p-3 text-right">{formatPrice(selectedOrder.subtotal)}</td>
                                                </tr>
                                                <tr className="bg-slate-50/50 font-bold">
                                                    <td colSpan={3} className="p-3 text-right text-slate-500">{t('backoffice.orders.modal.shipping_fee', 'Shipping Fee ({courier})').replace('{courier}', selectedOrder.shipping_courier)}</td>
                                                    <td className="p-3 text-right">{formatPrice(selectedOrder.shipping_cost)}</td>
                                                </tr>
                                                <tr className="bg-blue-50/30 font-extrabold border-t border-blue-100">
                                                    <td colSpan={3} className="p-3 text-right text-blue-900">{t('backoffice.orders.modal.grand_total', 'Grand Total')}</td>
                                                    <td className="p-3 text-right text-blue-950 text-sm">{formatPrice(selectedOrder.total_amount)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Cancellation Request Panel */}
                                {selectedOrder.cancellation_status === 'pending' && (
                                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-rose-800 flex items-center gap-1">
                                                <AlertCircle size={14} /> {t('backoffice.orders.cancel.panel_title', 'Pengajuan Pembatalan Pesanan')}
                                            </h4>
                                            <span className="text-[10px] font-bold text-rose-600 bg-rose-100/55 px-2 py-0.5 rounded-full uppercase">
                                                {t('backoffice.orders.cancel.pending_approval', 'Pending Approval')}
                                            </span>
                                        </div>
                                        <div className="bg-white border border-rose-100/60 p-3 rounded-xl text-slate-700 leading-relaxed">
                                            <span className="font-bold text-slate-900 block mb-1">{t('backoffice.orders.cancel.reason_label', 'Alasan Pembatalan:')}</span>
                                            "{selectedOrder.cancellation_reason}"
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleApproveCancel(selectedOrder.id)}
                                                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition shadow-sm"
                                            >
                                                {t('backoffice.orders.cancel.btn_approve', 'Setujui Pembatalan (Refund & Batal)')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleRejectCancel(selectedOrder.id)}
                                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition border border-slate-200"
                                            >
                                                {t('backoffice.orders.cancel.btn_reject', 'Tolak Pengajuan')}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {(selectedOrder.status === 'cancelled' || (selectedOrder.cancellation_status && selectedOrder.cancellation_status !== 'pending')) && (
                                    <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl text-xs space-y-1">
                                        <h4 className="font-bold text-rose-800 flex items-center gap-1">
                                            {t('backoffice.orders.cancel.detail_title', 'Detail Pembatalan')}
                                        </h4>
                                        <p className="text-slate-600">
                                            <strong>{t('backoffice.orders.cancel.status_label', 'Status Pengajuan:')}</strong>{' '}
                                            <span className={`font-bold uppercase ${selectedOrder.cancellation_status === 'rejected' ? 'text-rose-600' : 'text-slate-700'}`}>
                                                {selectedOrder.cancellation_status === 'rejected'
                                                    ? t('backoffice.orders.cancel.status_rejected', 'Pengajuan Pembatalan Ditolak')
                                                    : (selectedOrder.cancellation_status === 'approved' ? t('backoffice.orders.cancel.status_approved', 'Disetujui') : (selectedOrder.cancellation_status || t('backoffice.orders.cancel.status_approved', 'Disetujui')))}
                                            </span>
                                        </p>
                                        <p className="text-slate-600">
                                            <strong>{t('backoffice.orders.cancel.reason_col', 'Alasan:')}</strong> "{selectedOrder.cancellation_reason || t('backoffice.orders.cancel.no_reason', 'Tidak ada alasan khusus atau dibatalkan otomatis oleh sistem.')}"
                                        </p>
                                    </div>
                                )}

                                {/* Order Notes */}
                                {selectedOrder.notes && (
                                    <div className="p-4 bg-amber-50/30 border border-amber-100 rounded-2xl text-xs">
                                        <h4 className="font-bold text-amber-800 flex items-center gap-1"><AlertCircle size={12} /> {t('backoffice.orders.modal.notes_logs', 'Catatan / Logs')}</h4>
                                        <p className="mt-1.5 text-slate-600 leading-normal whitespace-pre-wrap">{selectedOrder.notes}</p>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer: Status Overview & Actions */}
                            <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex flex-wrap items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 flex items-center gap-1">
                                            <ActivityIcon size={12} /> {t('backoffice.orders.modal.order_status', 'Order Status')}
                                        </span>
                                        {getStatusBadge(selectedOrder.status)}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 flex items-center gap-1">
                                            <DollarSign size={12} /> {t('backoffice.orders.modal.payment_status', 'Payment Status')}
                                        </span>
                                        {getPaymentBadge(selectedOrder.payment_status)}
                                        {selectedOrder.status === 'pending' && (
                                            <label className="inline-flex items-center gap-1.5 cursor-pointer ml-3 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1 rounded-lg border border-slate-200 transition text-slate-700">
                                                <input
                                                    type="checkbox"
                                                    disabled={isUpdatingStatus}
                                                    checked={selectedOrder.payment_status === 'paid'}
                                                    onChange={(e) => {
                                                        const targetPaymentStatus = e.target.checked ? 'paid' : 'unpaid';
                                                        handleUpdatePaymentStatus(selectedOrder.id, targetPaymentStatus);
                                                    }}
                                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                                                />
                                                <span className="text-[10px] font-extrabold uppercase tracking-wide">{t('backoffice.orders.modal.mark_as_paid', 'Mark as Paid')}</span>
                                            </label>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Manual Status Change Dropdown (untuk Testing & Management) */}
                                    <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm text-xs font-semibold">
                                        <span className="text-slate-500 mr-2">{t('backoffice.orders.modal.change_status_label', 'Ubah Status:')}</span>
                                        <select
                                            disabled={isUpdatingStatus}
                                            value={selectedOrder.status}
                                            onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value)}
                                            className="bg-transparent border-none p-0 text-xs font-bold text-slate-800 outline-none focus:ring-0 pr-8 cursor-pointer"
                                        >
                                            <option value="pending">{t('backoffice.orders.status.pending', 'Pending')}</option>
                                            <option value="processing">{t('backoffice.orders.status.processing', 'Processing')}</option>
                                            <option value="shipped">{t('backoffice.orders.status.shipped', 'Shipped')}</option>
                                            <option value="completed">{t('backoffice.orders.status.completed', 'Completed')}</option>
                                            <option value="cancelled">{t('backoffice.orders.status.cancelled', 'Cancelled')}</option>
                                        </select>
                                    </div>
                                    {selectedOrder.status === 'pending' && (
                                        <button
                                            type="button"
                                            disabled={isUpdatingStatus}
                                            onClick={() => handleUpdateStatus(selectedOrder.id, 'processing')}
                                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
                                        >
                                            <span>{t('backoffice.orders.modal.btn_process_order', 'Proses Pesanan')}</span>
                                        </button>
                                    )}

                                    {selectedOrder.status === 'processing' && !selectedOrder.tracking_number && selectedOrder.store_branch?.country_code === 'ID' && (
                                        <div className="flex flex-col items-end gap-1">
                                            <button
                                                type="button"
                                                disabled={bookingShipmentId === selectedOrder.id || !selectedOrder.store_branch?.area_id || !selectedOrder.user?.area_id}
                                                onClick={() => handleCreateBiteshipShipment(selectedOrder.id)}
                                                className="px-5 py-2 bg-blue-950 hover:bg-blue-900 text-white font-bold rounded-xl text-xs transition disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
                                            >
                                                <Truck size={12} />
                                                <span>{bookingShipmentId === selectedOrder.id ? t('backoffice.orders.modal.btn_booking', 'Booking...') : t('backoffice.orders.modal.btn_book_shipment', 'Book Biteship Shipment')}</span>
                                            </button>
                                            {(!selectedOrder.store_branch?.area_id || !selectedOrder.user?.area_id) && (
                                                <span className="text-[9px] text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-100 mt-1">
                                                    {!selectedOrder.store_branch?.area_id && !selectedOrder.user?.area_id
                                                        ? t('backoffice.orders.modal.err_complete_both_area', 'Lengkapi Area ID Gudang & Pelanggan')
                                                        : (!selectedOrder.store_branch?.area_id ? t('backoffice.orders.modal.err_complete_warehouse_area', 'Lengkapi Area ID Gudang') : t('backoffice.orders.modal.err_complete_customer_area', 'Lengkapi Area ID Pelanggan'))}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {selectedOrder.status === 'shipped' && (
                                        <>
                                            <button
                                                onClick={() => handleTrackOrder(selectedOrder)}
                                                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                                            >
                                                <Truck size={12} />
                                                <span>{t('backoffice.orders.modal.btn_track_shipment', 'Lacak Pengiriman')}</span>
                                            </button>
                                            <a
                                                href={route('backoffice.orders.print-waybill', selectedOrder.id)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                                            >
                                                <Printer size={12} />
                                                <span>{t('backoffice.orders.modal.btn_print_waybill', 'Cetak Resi / Label')}</span>
                                            </a>
                                        </>
                                    )}

                                    {selectedOrder.status === 'completed' && (
                                        <>
                                            <button
                                                onClick={() => handleTrackOrder(selectedOrder)}
                                                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                                            >
                                                <Truck size={12} />
                                                <span>{t('backoffice.orders.modal.btn_track_pod', 'Lacak & Lihat POD')}</span>
                                            </button>
                                            <a
                                                href={route('backoffice.orders.print-waybill', selectedOrder.id)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                                            >
                                                <Printer size={12} />
                                                <span>{t('backoffice.orders.modal.btn_print_waybill', 'Cetak Resi')}</span>
                                            </a>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ====== INLINE TRACKING MODAL ====== */}
            <AnimatePresence>
                {isTrackingOpen && (
                    <div
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                        onClick={() => setIsTrackingOpen(false)}
                    >
                        <motion.div
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        />
                        <motion.div
                            className="relative z-10 bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
                            initial={{ scale: 0.95, opacity: 0, y: 16 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 16 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                                        <Truck size={16} className="text-indigo-600" />
                                        Lacak Pengiriman
                                    </h3>
                                    {trackingData?.order && (
                                        <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                                            {trackingData.order.invoice_number} &bull;{' '}
                                            <span className="uppercase font-bold">{trackingData.order.shipping_courier}</span>{' '}
                                            &bull; Resi: <span className="text-blue-800">{trackingData.order.tracking_number || '—'}</span>
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => setIsTrackingOpen(false)}
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition"
                                >
                                    <XIcon size={16} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="overflow-y-auto flex-1 p-6">
                                {isTrackingLoading ? (
                                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                        <span className="text-xs text-slate-500 font-medium">Mengambil data tracking dari Biteship...</span>
                                    </div>
                                ) : !trackingData?.success ? (
                                    <div className="text-center py-10">
                                        <p className="text-xs text-rose-600 font-bold">{trackingData?.error || 'Gagal memuat data pelacakan.'}</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Status badge */}
                                        {trackingData.biteshipStatus && (
                                            <div className="flex items-center gap-2 mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-2xl">
                                                <Truck size={14} className="text-indigo-700 shrink-0" />
                                                <div>
                                                    <span className="text-[10px] text-indigo-500 font-bold uppercase block">Status Terkini</span>
                                                    <span className="text-sm font-black text-indigo-900">{translateStatus(trackingData.biteshipStatus)}</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Timeline */}
                                        {trackingData.trackingLogs && trackingData.trackingLogs.length > 0 ? (
                                            <div className="relative border-l-2 border-slate-200 ml-3 pl-6 space-y-5">
                                                {[...trackingData.trackingLogs]
                                                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                                                    .map((log, idx) => {
                                                        const isLatest = idx === 0;
                                                        return (
                                                            <div key={idx} className="relative">
                                                                <div
                                                                    className={`absolute -left-[31px] rounded-full ${
                                                                        isLatest
                                                                            ? 'w-3.5 h-3.5 -left-[32px] bg-indigo-600 border-2 border-white ring-4 ring-indigo-100'
                                                                            : 'w-2.5 h-2.5 bg-slate-300 border-2 border-white'
                                                                    }`}
                                                                />
                                                                <div>
                                                                    <span className="text-[10px] font-bold text-slate-400 block font-mono">
                                                                        {log.date ? new Date(log.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                                                                    </span>
                                                                    {log.title && (
                                                                        <h4 className={`text-xs mt-0.5 font-bold ${isLatest ? 'text-indigo-950' : 'text-slate-700'}`}>
                                                                            {log.title}
                                                                        </h4>
                                                                    )}
                                                                    <p className={`text-xs mt-0.5 leading-relaxed ${isLatest ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>
                                                                        {log.note}
                                                                    </p>
                                                                    {log.service_status && (
                                                                        <span className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 border rounded-md ${isLatest ? 'text-indigo-800 bg-indigo-50 border-indigo-200' : 'text-slate-600 bg-slate-50 border-slate-200'}`}>
                                                                            {translateStatus(log.service_status)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-xs text-slate-500">
                                                <Truck size={32} className="mx-auto mb-2 text-slate-300" />
                                                <p>Belum ada riwayat perjalanan paket yang tersedia.</p>
                                                <p className="mt-1 text-slate-400">Data pelacakan akan muncul setelah kurir menjemput paket.</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function XIcon({ size }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
            <path d="M18 6 6 18M6 6l12 12" />
        </svg>
    );
}

function ActivityIcon({ size }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-activity">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    );
}
