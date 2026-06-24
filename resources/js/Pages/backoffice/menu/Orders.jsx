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
    Box
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
        if (!confirm("Apakah Anda yakin ingin menyetujui pembatalan pesanan ini? Stok produk akan dikembalikan.")) {
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
        if (!confirm("Apakah Anda yakin ingin menolak pembatalan pesanan ini?")) {
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

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700"><Clock size={12} /> Pending</span>;
            case 'processing':
                return <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700"><ActivityIcon size={12} /> Processing</span>;
            case 'shipped':
                return <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700"><Truck size={12} /> Shipped</span>;
            case 'completed':
                return <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700"><CheckCircle size={12} /> Completed</span>;
            case 'cancelled':
                return <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700"><XCircle size={12} /> Cancelled</span>;
            default:
                return <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700">{status}</span>;
        }
    };

    const getPaymentBadge = (status) => {
        switch (status) {
            case 'unpaid':
                return <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-rose-700">Unpaid</span>;
            case 'paid':
                return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700">Paid</span>;
            case 'expired':
                return <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Expired</span>;
            case 'refunded':
                return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-700">Refunded</span>;
            default:
                return <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-700">{status}</span>;
        }
    };

    return (
        <div className="min-h-screen bg-blue-50">
            <Head title="Orders Management - Backoffice" />

            <div className="flex min-h-screen">
                <Sidebar />

                <main className="flex min-w-0 flex-1 flex-col">
                    <Navbar />

                    <div className="flex-1 p-6 space-y-6">
                        {/* Title Section */}
                        <section className="flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold tracking-normal text-blue-950">
                                    Orders Management
                                </h1>
                                <p className="max-w-2xl mt-1 text-sm text-slate-600">
                                    Monitor customer transactions, update order status, and book courier pickup using Biteship.
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
                                                {tab}
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
                                        placeholder="Search invoice or customer..."
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
                                            <th className="p-4 w-12">No</th>
                                            <th className="p-4">Invoice</th>
                                            <th className="p-4">Customer</th>
                                            <th className="p-4">Shipping Warehouse</th>
                                            <th className="p-4 text-right">Total Billing</th>
                                            <th className="p-4">Status</th>
                                            {statusTab === 'cancelled' && <th className="p-4">Cancellation Reason</th>}
                                            <th className="p-4">Payment</th>
                                            <th className="p-4 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs">
                                        {filteredOrders.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="p-8 text-center text-slate-400">
                                                    No orders found matching the filter criteria.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredOrders.map((order, idx) => (
                                                <tr key={order.id} className="hover:bg-slate-50/50">
                                                    <td className="p-4 font-bold text-slate-400">{idx + 1}</td>
                                                    <td className="p-4 font-mono font-bold text-blue-950">{order.invoice_number}</td>
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
                                                         <div className="flex flex-col gap-1 items-start">
                                                             {getStatusBadge(order.status)}
                                                             {order.cancellation_status === 'pending' && (
                                                                 <span className="inline-flex items-center gap-1 rounded bg-rose-50 border border-rose-100 px-2 py-0.5 text-[9px] font-bold text-rose-700 animate-pulse">
                                                                     Cancel Req
                                                                 </span>
                                                             )}
                                                             {order.cancellation_status === 'rejected' && (
                                                                 <span className="inline-flex items-center gap-1 rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-[9px] font-bold text-slate-500">
                                                                     Cancel Ditolak
                                                                 </span>
                                                             )}
                                                         </div>
                                                     </td>
                                                     {statusTab === 'cancelled' && (
                                                         <td className="p-4 max-w-[200px] truncate font-medium text-rose-600" title={order.cancellation_reason}>
                                                             {order.cancellation_reason || '-'}
                                                         </td>
                                                     )}
                                                     <td className="p-4">{getPaymentBadge(order.payment_status)}</td>
                                                     <td className="p-4 text-center">
                                                         <div className="flex items-center justify-center gap-1.5">
                                                             <button
                                                                 onClick={() => handleOpenDetail(order)}
                                                                 className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-blue-800 hover:bg-blue-100 rounded-lg font-bold transition"
                                                             >
                                                                 <Eye size={12} />
                                                                 <span>Details</span>
                                                             </button>
                                                             {order.tracking_number && (
                                                                 <a
                                                                     href={route('orders.track', order.id)}
                                                                     target="_blank"
                                                                     rel="noopener noreferrer"
                                                                     className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 text-indigo-800 hover:bg-indigo-100 rounded-lg font-bold transition border border-indigo-100"
                                                                 >
                                                                     <Truck size={12} />
                                                                     <span>Track</span>
                                                                 </a>
                                                             )}
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
                                        <Calendar size={10} /> Created on {formatDate(selectedOrder.created_at)}
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
                                        <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><User size={12} /> Customer Information</h4>
                                        <div className="bg-slate-50 rounded-2xl p-4 text-xs space-y-2">
                                            <div>
                                                <span className="text-slate-400 block">Name</span>
                                                <strong className="text-slate-800">{selectedOrder.user?.name}</strong>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block">Phone</span>
                                                <strong className="text-slate-800">{selectedOrder.user?.phone}</strong>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block">Email</span>
                                                <strong className="text-slate-800">{selectedOrder.user?.email}</strong>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Column 2: Shipping details */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><Truck size={12} /> Shipping Destination</h4>
                                        <div className="bg-slate-50 rounded-2xl p-4 text-xs space-y-2">
                                            <div>
                                                <span className="text-slate-400 block">Recipient</span>
                                                <strong className="text-slate-800">{selectedOrder.user?.receiver_name || selectedOrder.user?.name}</strong>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block">Courier Service</span>
                                                <strong className="text-slate-800 uppercase">{selectedOrder.shipping_courier} - {selectedOrder.shipping_service}</strong>
                                            </div>
                                             <div>
                                                 <span className="text-slate-400 block">Address Details</span>
                                                 {selectedOrder.user?.address ? (
                                                     <p className="text-slate-600 mt-0.5 leading-normal">
                                                         {selectedOrder.user.address}, Kec. {selectedOrder.user.district}, {selectedOrder.user.city}, {selectedOrder.user.province} {selectedOrder.user.postal_code}
                                                     </p>
                                                 ) : (
                                                     <p className="text-slate-600 mt-0.5 leading-normal">{selectedOrder.shipping_address}</p>
                                                 )}
                                             </div>
                                             {selectedOrder.tracking_number && (
                                                 <div className="pt-2 border-t border-slate-200/80 space-y-2">
                                                     <div>
                                                         <span className="text-slate-400 block">Airwaybill (AWB)</span>
                                                         <strong className="text-blue-950 font-mono">{selectedOrder.tracking_number}</strong>
                                                     </div>
                                                     <a
                                                         href={selectedOrder.tracking_number ? `https://results.biteship.com/tracking/${selectedOrder.tracking_number}` : route('orders.track', selectedOrder.id)}
                                                         className="inline-flex items-center gap-1.5 text-[10px] font-black text-indigo-800 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/60 px-3 py-1.5 rounded-xl transition"
                                                     >
                                                         <Truck size={12} />
                                                         <span>Lacak Pengiriman</span>
                                                     </a>
                                                 </div>
                                             )}
                                        </div>
                                    </div>

                                    {/* Column 3: Logistics details & Actions */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><Box size={12} /> Processing Warehouse</h4>
                                        <div className="bg-slate-50 rounded-2xl p-4 text-xs space-y-2">
                                            <div>
                                                <span className="text-slate-400 block">Fulfillment Branch</span>
                                                <strong className="text-slate-800">{selectedOrder.store_branch?.name}</strong>
                                                <span className="text-[10px] text-slate-400 block mt-0.5">Area ID: {selectedOrder.store_branch?.area_id ?? 'None'}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block">Customer Destination Area ID</span>
                                                <strong className="text-slate-800">{selectedOrder.user?.area_id ?? 'None'}</strong>
                                            </div>
                                            
                                            {/* Biteship Action Trigger */}
                                            {['pending', 'processing'].includes(selectedOrder.status) && !selectedOrder.tracking_number && selectedOrder.store_branch?.area_id && selectedOrder.user?.area_id ? (
                                                <div className="pt-2">
                                                    <button
                                                        type="button"
                                                        disabled={bookingShipmentId === selectedOrder.id}
                                                        onClick={() => handleCreateBiteshipShipment(selectedOrder.id)}
                                                        className="w-full py-2 bg-blue-950 hover:bg-blue-900 text-white font-bold rounded-lg text-center transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                                                    >
                                                        <Truck size={12} />
                                                        <span>{bookingShipmentId === selectedOrder.id ? 'Booking...' : 'Book Biteship Shipment'}</span>
                                                    </button>
                                                </div>
                                            ) : selectedOrder.tracking_number ? (
                                                <div className="pt-1.5">
                                                    <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-100">
                                                        Shipment Booked
                                                    </span>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>

                                {/* Order Items Table */}
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><ShoppingBag size={12} /> Ordered Items</h4>
                                    <div className="border border-slate-100 rounded-2xl overflow-hidden">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                                    <th className="p-3">Product</th>
                                                    <th className="p-3 text-right">Price</th>
                                                    <th className="p-3 text-center">Qty</th>
                                                    <th className="p-3 text-right">Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                                {selectedOrder.items?.map((item) => (
                                                    <tr key={item.id}>
                                                        <td className="p-3">
                                                            <div className="font-bold text-slate-800">{item.product?.title}</div>
                                                            {item.variant && (
                                                                <div className="text-[10px] text-slate-400 mt-0.5">Varian: {item.variant.name}</div>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-right">{formatPrice(item.price)}</td>
                                                        <td className="p-3 text-center font-bold">{item.quantity}</td>
                                                        <td className="p-3 text-right font-bold text-slate-900">{formatPrice(item.price * item.quantity)}</td>
                                                    </tr>
                                                ))}
                                                <tr className="bg-slate-50/50 font-bold border-t border-slate-100">
                                                    <td colSpan={3} className="p-3 text-right text-slate-500">Subtotal</td>
                                                    <td className="p-3 text-right">{formatPrice(selectedOrder.subtotal)}</td>
                                                </tr>
                                                <tr className="bg-slate-50/50 font-bold">
                                                    <td colSpan={3} className="p-3 text-right text-slate-500">Shipping Fee ({selectedOrder.shipping_courier})</td>
                                                    <td className="p-3 text-right">{formatPrice(selectedOrder.shipping_cost)}</td>
                                                </tr>
                                                <tr className="bg-blue-50/30 font-extrabold border-t border-blue-100">
                                                    <td colSpan={3} className="p-3 text-right text-blue-900">Grand Total</td>
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
                                                 <AlertCircle size={14} /> Pengajuan Pembatalan Pesanan
                                             </h4>
                                             <span className="text-[10px] font-bold text-rose-600 bg-rose-100/55 px-2 py-0.5 rounded-full uppercase">
                                                 Pending Approval
                                             </span>
                                         </div>
                                         <div className="bg-white border border-rose-100/60 p-3 rounded-xl text-slate-700 leading-relaxed">
                                             <span className="font-bold text-slate-900 block mb-1">Alasan Pembatalan:</span>
                                             "{selectedOrder.cancellation_reason}"
                                         </div>
                                         <div className="flex gap-2">
                                             <button
                                                 type="button"
                                                 onClick={() => handleApproveCancel(selectedOrder.id)}
                                                 className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition shadow-sm"
                                             >
                                                 Setujui Pembatalan (Refund & Batal)
                                             </button>
                                             <button
                                                 type="button"
                                                 onClick={() => handleRejectCancel(selectedOrder.id)}
                                                 className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition border border-slate-200"
                                             >
                                                 Tolak Pengajuan
                                             </button>
                                         </div>
                                     </div>
                                 )}

                                  {(selectedOrder.status === 'cancelled' || (selectedOrder.cancellation_status && selectedOrder.cancellation_status !== 'pending')) && (
                                      <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl text-xs space-y-1">
                                          <h4 className="font-bold text-rose-800 flex items-center gap-1">
                                              Detail Pembatalan
                                          </h4>
                                          <p className="text-slate-600">
                                              <strong>Status Pengajuan:</strong>{' '}
                                              <span className={`font-bold uppercase ${selectedOrder.cancellation_status === 'rejected' ? 'text-rose-600' : 'text-slate-700'}`}>
                                                  {selectedOrder.cancellation_status === 'rejected' 
                                                      ? 'Pengajuan Pembatalan Ditolak' 
                                                      : (selectedOrder.cancellation_status === 'approved' ? 'Disetujui' : (selectedOrder.cancellation_status || 'Disetujui'))}
                                              </span>
                                          </p>
                                          <p className="text-slate-600">
                                              <strong>Alasan:</strong> "{selectedOrder.cancellation_reason || 'Tidak ada alasan khusus atau dibatalkan otomatis oleh sistem.'}"
                                          </p>
                                      </div>
                                  )}

                                {/* Order Notes */}
                                {selectedOrder.notes && (
                                    <div className="p-4 bg-amber-50/30 border border-amber-100 rounded-2xl text-xs">
                                        <h4 className="font-bold text-amber-800 flex items-center gap-1"><AlertCircle size={12} /> Catatan / Logs</h4>
                                        <p className="mt-1.5 text-slate-600 leading-normal whitespace-pre-wrap">{selectedOrder.notes}</p>
                                    </div>
                                )}
                            </div>

                             {/* Modal Footer: Status Overview */}
                             <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
                                 <div className="flex flex-wrap items-center gap-6">
                                     <div className="flex items-center gap-2">
                                         <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 flex items-center gap-1">
                                             <ActivityIcon size={12} /> Order Status
                                         </span>
                                         {getStatusBadge(selectedOrder.status)}
                                     </div>

                                     <div className="flex items-center gap-2">
                                         <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400 flex items-center gap-1">
                                             <DollarSign size={12} /> Payment Status
                                         </span>
                                         {getPaymentBadge(selectedOrder.payment_status)}
                                     </div>
                                 </div>
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
