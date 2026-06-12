import React, { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Search,
    Trash2,
    BarChart3,
    Ticket,
    X,
    Check,
    ChevronDown,
    User,
    Mail,
    Phone,
    ArrowUpDown,
    AlertCircle,
    ShoppingBag,
    DollarSign,
    Gift,
    Calendar,
    Activity,
    TrendingUp,
    Coins,
    UserCheck,
    Clock,
    Tag,
    Eye,
    Globe2,
} from 'lucide-react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ConfirmModal from '../components/ConfirmModal';
import CustomerDetailModal from '../components/CustomerDetailModal';
import CustomerStatisticsModal from '../components/CustomerStatisticsModal';
import { useLanguage } from '@/Contexts/LanguageContext';



export default function Customer({ customers = [], vouchers = [], status = null, errors = {} }) {
    const { t } = useLanguage();

    // Flash status message state
    const [flashMessage, setFlashMessage] = useState(status);
    useEffect(() => {
        setFlashMessage(status);
    }, [status]);

    // Search and Sort Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('newest'); // 'alphabetical-asc', 'alphabetical-desc', 'most-orders', 'highest-spent', 'newest'

    // Modal states
    const [customerToDelete, setCustomerToDelete] = useState(null);
    const [customerForVoucher, setCustomerForVoucher] = useState(null);
    const [selectedVoucherId, setSelectedVoucherId] = useState('');
    const [isAssigningVoucher, setIsAssigningVoucher] = useState(false);

    // Statistics modal states
    const [customerForStats, setCustomerForStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(false);
    const [statsData, setStatsData] = useState(null);

    // Detail modal state
    const [customerForDetail, setCustomerForDetail] = useState(null);

    // Form errors state
    const [voucherErrors, setVoucherErrors] = useState({});

    // Sync validation errors from Inertia props
    useEffect(() => {
        if (errors && Object.keys(errors).length > 0) {
            setVoucherErrors(errors);
        } else {
            setVoucherErrors({});
        }
    }, [errors]);

    // Client-side search and sort
    const filteredAndSortedCustomers = useMemo(() => {
        let result = [...customers];

        // Search text filter
        if (searchTerm.trim() !== '') {
            const query = searchTerm.toLowerCase();
            result = result.filter(c =>
                (c.name || '').toLowerCase().includes(query) ||
                (c.email || '').toLowerCase().includes(query) ||
                (c.phone || '').toLowerCase().includes(query)
            );
        }

        // Apply selected sort option
        result.sort((a, b) => {
            if (sortBy === 'newest') {
                return (b.id || 0) - (a.id || 0);
            } else if (sortBy === 'alphabetical-asc') {
                return (a.name || '').localeCompare(b.name || '');
            } else if (sortBy === 'alphabetical-desc') {
                return (b.name || '').localeCompare(a.name || '');
            } else if (sortBy === 'most-orders') {
                return (b.orders_count || 0) - (a.orders_count || 0);
            } else if (sortBy === 'highest-spent') {
                return (Number(b.total_spent) || 0) - (Number(a.total_spent) || 0);
            }
            return 0;
        });

        return result;
    }, [customers, searchTerm, sortBy]);

    // Handle delete action
    const handleDeleteCustomer = () => {
        if (!customerToDelete) return;
        router.delete(route('backoffice.customer.destroy', customerToDelete.id), {
            onSuccess: () => {
                setCustomerToDelete(null);
            }
        });
    };

    // Open statistics modal with mock/dummy statistics immediately on client-side
    const handleOpenStats = (customer) => {
        setCustomerForStats(customer);
        setStatsLoading(false);
        setStatsData({
            customer: {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone
            },
            stats: {
                orders_count: customer.orders_count || 8,
                total_spent: customer.total_spent || 3200000,
                products: [
                    {
                        name: 'Certified Yemen Sidr Honey 250g',
                        total_quantity: 3,
                        total_spent: 1200000
                    },
                    {
                        name: 'Oud Luxe Perfume 50ml',
                        total_quantity: 2,
                        total_spent: 1000000
                    },
                    {
                        name: 'Royal Amber Gold Blend 10ml',
                        total_quantity: 4,
                        total_spent: 1000000
                    }
                ],
                vouchers_used: [
                    {
                        code: 'RAMADAN15',
                        name: 'Diskon Ramadan 15%',
                        discount_obtained: 150000,
                        used_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
                    }
                ],
                vouchers_assigned: [
                    {
                        code: 'RAMADAN15',
                        name: 'Diskon Ramadan 15%',
                        assigned_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                        is_used: true,
                        used_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
                    },
                    {
                        code: 'LOYALTY50',
                        name: 'Voucher Loyalitas Rp50.000',
                        assigned_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                        is_used: false,
                        used_at: null
                    }
                ]
            }
        });
    };

    // Submit manual voucher assignment
    const handleAssignVoucher = (e) => {
        e.preventDefault();
        if (!selectedVoucherId) {
            setVoucherErrors({ voucher_id: t('backoffice.customer.errors.voucher_required', 'Pilih salah satu voucher terlebih dahulu.') });
            return;
        }

        setIsAssigningVoucher(true);
        router.post(route('backoffice.customer.assign-voucher', customerForVoucher.id), {
            voucher_id: selectedVoucherId
        }, {
            onSuccess: () => {
                setCustomerForVoucher(null);
                setSelectedVoucherId('');
                setVoucherErrors({});
            },
            onError: (errs) => {
                setVoucherErrors(errs);
            },
            onFinish: () => {
                setIsAssigningVoucher(false);
            }
        });
    };

    // Format currency helper
    const formatCurrency = (val) => {
        if (val === null || val === undefined) return 'Rp 0';
        return 'Rp ' + Number(val).toLocaleString('id-ID');
    };

    // Format date helper
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen bg-blue-50">
            <Head title={t('backoffice.customer.title', 'Customer Management')} />

            {/* Confirm Delete Modal */}
            <ConfirmModal
                show={Boolean(customerToDelete)}
                title={t('backoffice.customer.confirm.delete_title', 'Hapus Customer')}
                message={`${t('backoffice.customer.confirm.delete_message', 'Apakah Anda yakin ingin menghapus akun customer')} "${customerToDelete?.name}"? ${t('backoffice.customer.confirm.delete_warning', 'Tindakan ini tidak dapat dibatalkan.')}`}
                confirmLabel={t('backoffice.customer.button.delete', 'Hapus')}
                cancelLabel={t('backoffice.customer.button.cancel', 'Batal')}
                onConfirm={handleDeleteCustomer}
                onCancel={() => setCustomerToDelete(null)}
            />

            <div className="flex min-h-screen">
                <Sidebar />

                <main className="flex flex-col flex-1 min-w-0">
                    <Navbar />

                    <div className="flex-1 p-6 space-y-6">
                        {/* Page Header */}
                        <div className="flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-extrabold tracking-normal text-blue-950">
                                    {t('backoffice.customer.header', 'Manajemen Customer')}
                                </h1>
                                <p className="mt-1 text-sm text-slate-500">
                                    {t('backoffice.customer.subtitle', 'Kelola data pelanggan, pantau aktivitas belanja, dan bagikan voucher loyalitas.')}
                                </p>
                            </div>
                        </div>

                        {/* Flash Status Notification */}
                        {flashMessage && (
                            <div className="flex items-center justify-between gap-2 px-4 py-3 text-sm font-semibold border rounded-lg border-emerald-200 bg-emerald-50 text-emerald-700 shadow-xs animate-fade-in">
                                <div className="flex items-center gap-2">
                                    <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                                    <span>{flashMessage}</span>
                                </div>
                                <button onClick={() => setFlashMessage(null)} className="text-emerald-700 hover:text-emerald-950 font-bold">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* Search & Sort Panel */}
                        <div className="bg-white border border-blue-100 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                            {/* Search bar */}
                            <div className="relative flex-1 max-w-lg">
                                <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder={t('backoffice.customer.search_placeholder', 'Cari berdasarkan nama, email, atau telepon...')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition"
                                />
                            </div>

                            {/* Sort Filter Dropdown */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                                    <ArrowUpDown className="w-3.5 h-3.5 inline mr-1" />
                                    Urutkan:
                                </span>
                                <div className="relative">
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="appearance-none bg-blue-50/50 border border-blue-100 rounded-lg pl-3 pr-10 py-2 text-sm font-semibold text-blue-950 focus:outline-none focus:border-blue-900 transition"
                                    >
                                        <option value="newest">Paling Baru Terdaftar</option>
                                        <option value="alphabetical-asc">Abjad A - Z</option>
                                        <option value="alphabetical-desc">Abjad Z - A</option>
                                        <option value="most-orders">Paling Sering Beli (Frekuensi)</option>
                                        <option value="highest-spent">Total Pembelian Tertinggi</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Customer List Table */}
                        <div className="bg-white border border-blue-100 rounded-xl shadow-xs overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-blue-50">
                                    <thead className="bg-blue-50/40">
                                        <tr className="text-xs font-bold tracking-wider text-left text-blue-800 uppercase border-b border-blue-100">
                                            <th className="px-6 py-4">Customer</th>
                                            <th className="px-6 py-4">Kontak</th>
                                            <th className="px-6 py-4 text-center">Frekuensi Order</th>
                                            <th className="px-6 py-4 text-right">Total Belanja</th>
                                            <th className="px-6 py-4 text-center">Bergabung</th>
                                            <th className="px-6 py-4 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm divide-y divide-blue-50 text-slate-700">
                                        {filteredAndSortedCustomers.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-16 text-center text-slate-400 font-medium bg-slate-50/10">
                                                    Tidak ada customer yang ditemukan.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredAndSortedCustomers.map((customer) => (
                                                <tr key={customer.id} className="hover:bg-blue-50/20 transition align-middle">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            {customer.avatar ? (
                                                                <img
                                                                    src={`/storage/${customer.avatar}`}
                                                                    alt={customer.name}
                                                                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                                                                />
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 font-bold border border-blue-200 flex items-center justify-center text-sm uppercase">
                                                                    {(customer.name || 'C').substring(0, 2)}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <div className="font-bold text-blue-950 text-base flex items-center gap-2">
                                                                    <span>{customer.name}</span>
                                                                    <span className="text-[10px] bg-blue-50 text-blue-800 font-bold px-1.5 py-0.5 rounded border border-blue-100 uppercase flex items-center gap-0.5 shrink-0">
                                                                        <Globe2 className="w-3 h-3 text-blue-500 shrink-0" />
                                                                        <span>{customer.country || 'ID'}</span>
                                                                    </span>
                                                                </div>
                                                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">ID: #{customer.id}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="space-y-1 text-xs">
                                                            <div className="flex items-center gap-1.5 text-slate-600">
                                                                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                                <span>{customer.email || '-'}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-slate-600">
                                                                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                                <span>{customer.phone || '-'}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex items-center gap-1 font-bold text-sm px-2.5 py-1 rounded-full ${customer.orders_count > 0 ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-50 text-slate-400'}`}>
                                                            <ShoppingBag className="w-3.5 h-3.5" />
                                                            <span>{customer.orders_count || 0}x Order</span>
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-extrabold text-blue-950">
                                                        {formatCurrency(customer.total_spent)}
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-medium text-xs text-slate-500">
                                                        {formatDate(customer.created_at)}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end items-center gap-2">
                                                            {/* Detail Button */}
                                                            <button
                                                                onClick={() => setCustomerForDetail(customer)}
                                                                title="Lihat Detail Customer"
                                                                className="inline-flex items-center justify-center text-slate-700 bg-white border border-slate-200 rounded-lg h-9 px-3 gap-1.5 hover:bg-slate-50 active:scale-[0.98] transition font-bold text-xs"
                                                            >
                                                                <Eye className="w-4 h-4 text-slate-500" />
                                                                <span>Detail</span>
                                                            </button>

                                                            {/* Statistics Button */}
                                                            <button
                                                                onClick={() => handleOpenStats(customer)}
                                                                title="Lihat Statistik Belanja"
                                                                className="inline-flex items-center justify-center text-blue-700 bg-white border border-blue-100 rounded-lg h-9 px-3 gap-1.5 hover:bg-blue-50 active:scale-[0.98] transition font-bold text-xs"
                                                            >
                                                                <BarChart3 className="w-4 h-4" />
                                                                <span>Statistik</span>
                                                            </button>

                                                            {/* Give Voucher Button */}
                                                            <button
                                                                onClick={() => {
                                                                    setCustomerForVoucher(customer);
                                                                    setSelectedVoucherId('');
                                                                    setVoucherErrors({});
                                                                }}
                                                                title="Beri Voucher secara Manual"
                                                                className="inline-flex items-center justify-center text-emerald-700 bg-white border border-emerald-100 rounded-lg h-9 px-3 gap-1.5 hover:bg-emerald-50 active:scale-[0.98] transition font-bold text-xs"
                                                            >
                                                                <Gift className="w-4 h-4" />
                                                                <span>Beri Voucher</span>
                                                            </button>

                                                            {/* Delete Button */}
                                                            <button
                                                                onClick={() => setCustomerToDelete(customer)}
                                                                title="Hapus Customer"
                                                                className="inline-flex items-center justify-center text-rose-600 bg-white border border-rose-100 rounded-lg h-9 w-9 hover:bg-rose-50 active:scale-[0.98] transition"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
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

            {/* MANUAL ASSIGN VOUCHER MODAL */}
            <AnimatePresence>
                {customerForVoucher && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-blue-950/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.97, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.97, y: 10 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="w-full max-w-md rounded-xl border border-blue-50 bg-white p-6 shadow-2xl"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                                        <Gift className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-extrabold text-blue-950">Beri Voucher Manual</h3>
                                        <p className="text-xs text-slate-500">Berikan reward ke {customerForVoucher.name}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setCustomerForVoucher(null)}
                                    className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleAssignVoucher} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                                        Daftar Voucher Aktif
                                    </label>
                                    {vouchers.length === 0 ? (
                                        <div className="text-sm text-slate-400 py-3 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-center">
                                            Tidak ada voucher aktif yang tersedia untuk dibagikan.
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <select
                                                value={selectedVoucherId}
                                                onChange={(e) => {
                                                    setSelectedVoucherId(e.target.value);
                                                    setVoucherErrors({});
                                                }}
                                                className="w-full appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-10 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-900 transition"
                                            >
                                                <option value="">-- Pilih Voucher --</option>
                                                {vouchers.map(v => (
                                                    <option key={v.id} value={v.id}>
                                                        {v.code} - {v.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {voucherErrors.voucher_id && (
                                        <p className="mt-1.5 text-xs font-semibold text-rose-600 flex items-center gap-1">
                                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                            <span>{voucherErrors.voucher_id}</span>
                                        </p>
                                    )}
                                </div>

                                <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setCustomerForVoucher(null)}
                                        className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isAssigningVoucher || vouchers.length === 0}
                                        className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 text-sm active:scale-[0.98] transition disabled:opacity-50"
                                    >
                                        {isAssigningVoucher ? 'Memproses...' : 'Kirim Voucher'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* CUSTOMER DETAIL MODAL */}
            <CustomerDetailModal
                show={Boolean(customerForDetail)}
                customer={customerForDetail}
                onClose={() => setCustomerForDetail(null)}
            />

            {/* CUSTOMER STATISTICS DETAIL MODAL */}
            <CustomerStatisticsModal
                show={Boolean(customerForStats)}
                customer={customerForStats}
                statsLoading={statsLoading}
                statsData={statsData}
                onClose={() => setCustomerForStats(null)}
            />
        </div>
    );
}
