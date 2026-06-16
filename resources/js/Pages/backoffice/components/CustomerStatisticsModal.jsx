import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    X,
    BarChart3,
    Mail,
    Phone,
    UserCheck,
    Activity,
    TrendingUp,
    ShoppingBag,
    Tag,
    Clock,
    Gift,
} from 'lucide-react';
import { useLanguage } from '@/Contexts/LanguageContext';

export default function CustomerStatisticsModal({ show = false, customer, statsLoading, statsData, onClose }) {
    const { t } = useLanguage();
    if (!customer) return null;

    // Format currency helper
    const formatCurrency = (val) => {
        if (val === null || val === undefined) return 'Rp 0';
        return 'Rp ' + Number(val).toLocaleString('id-ID');
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
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-blue-950/40 backdrop-blur-sm" onClick={onClose}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97, y: 15 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className="w-full max-w-4xl max-h-[85vh] rounded-xl border border-blue-50 bg-white shadow-2xl flex flex-col overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-blue-950 text-white shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/10 rounded-lg">
                                    <BarChart3 className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-extrabold">{t('backoffice.customer.stats_modal.title', 'Statistik Belanja Customer')}</h3>
                                    <p className="text-xs text-white/70">{customer.name} (ID: #{customer.id})</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {statsLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                                    <div className="w-10 h-10 border-4 border-blue-950 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-sm font-semibold text-slate-500">{t('backoffice.customer.stats_modal.loading', 'Memuat statistik customer...')}</p>
                                </div>
                            ) : statsData ? (
                                <>
                                    {/* Profil Ringkas Info Banner */}
                                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
                                        <div className="space-y-0.5">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t('backoffice.customer.stats_modal.email', 'Email')}</span>
                                            <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                                                <Mail className="w-4 h-4 text-blue-950/60 shrink-0" />
                                                {statsData.customer.email || '-'}
                                            </span>
                                        </div>
                                        <div className="space-y-0.5">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t('backoffice.customer.stats_modal.phone', 'No. Telepon')}</span>
                                            <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                                                <Phone className="w-4 h-4 text-blue-950/60 shrink-0" />
                                                {statsData.customer.phone || '-'}
                                            </span>
                                        </div>
                                        <div className="space-y-0.5">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t('backoffice.customer.stats_modal.status', 'Status Pelanggan')}</span>
                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-2 py-0.5 w-fit">
                                                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                                <span>{t('backoffice.customer.stats_modal.active_customer', 'Customer Aktif')}</span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* KPI Summary Cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="bg-gradient-to-br from-white to-blue-50/20 border border-blue-100 rounded-xl p-5 shadow-xs flex items-center justify-between">
                                            <div className="space-y-1">
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{t('backoffice.customer.stats_modal.order_frequency', 'Frekuensi Order')}</span>
                                                <h4 className="text-3xl font-extrabold text-blue-950">
                                                    {statsData.stats.orders_count} <span className="text-xs text-slate-400 font-bold">{t('backoffice.customer.stats_modal.order_count_suffix', 'Kali Transaksi')}</span>
                                                </h4>
                                            </div>
                                            <div className="p-3 bg-blue-50 text-blue-900 rounded-lg border border-blue-100 shadow-inner">
                                                <Activity className="w-5.5 h-5.5" />
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-white to-emerald-50/10 border border-blue-100 rounded-xl p-5 shadow-xs flex items-center justify-between">
                                            <div className="space-y-1">
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{t('backoffice.customer.stats_modal.total_spent', 'Total Transaksi Belanja')}</span>
                                                <h4 className="text-2xl font-black text-emerald-700">
                                                    {formatCurrency(statsData.stats.total_spent)}
                                                </h4>
                                            </div>
                                            <div className="p-3 bg-emerald-50 text-emerald-900 rounded-lg border border-emerald-100 shadow-inner">
                                                <TrendingUp className="w-5.5 h-5.5" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Products Bought Section */}
                                    <div className="bg-white border border-slate-100 rounded-xl p-5 space-y-3 shadow-xs">
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                                            <div>
                                                <h4 className="font-extrabold text-blue-950 text-sm">{t('backoffice.customer.stats_modal.products_bought', 'Barang yang dibeli')}</h4>
                                                <p className="text-[11px] text-slate-400">{t('backoffice.customer.stats_modal.products_bought_desc', 'Daftar item produk yang berhasil dibeli oleh pelanggan ini.')}</p>
                                            </div>
                                            <span className="inline-flex bg-slate-100 font-bold text-slate-700 text-xs px-2.5 py-1 rounded-full">
                                                {t('backoffice.customer.stats_modal.products_count_value', '{count} Item').replace('{count}', statsData.stats.products?.length || 0)}
                                            </span>
                                        </div>

                                        <div className="overflow-x-auto max-h-[250px] border border-slate-50 rounded-lg">
                                            <table className="min-w-full divide-y divide-slate-100">
                                                <thead className="bg-slate-50/70 sticky top-0">
                                                    <tr className="text-xs font-bold tracking-wider text-left text-slate-600 uppercase">
                                                        <th className="px-4 py-2.5">{t('backoffice.customer.stats_modal.table.product_name', 'Nama Produk')}</th>
                                                        <th className="px-4 py-2.5 text-center">{t('backoffice.customer.stats_modal.table.qty', 'Jumlah (Qty)')}</th>
                                                        <th className="px-4 py-2.5 text-right">{t('backoffice.customer.stats_modal.table.total_spent', 'Total Belanja')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-xs divide-y divide-slate-50 text-slate-700">
                                                    {!statsData.stats.products || statsData.stats.products.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={3} className="px-4 py-8 text-center text-slate-400 font-medium">
                                                                {t('backoffice.customer.stats_modal.no_products', 'Belum ada catatan produk dibeli.')}
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        statsData.stats.products.map((p, idx) => (
                                                            <tr key={idx} className="hover:bg-slate-50/50 transition">
                                                                <td className="px-4 py-3 font-bold text-blue-950">
                                                                    {p.name}
                                                                </td>
                                                                <td className="px-4 py-3 text-center font-bold text-slate-800">
                                                                    {t('backoffice.customer.stats_modal.qty_value', '{count} pcs').replace('{count}', p.total_quantity)}
                                                                </td>
                                                                <td className="px-4 py-3 text-right font-extrabold text-slate-850">
                                                                    {formatCurrency(p.total_spent)}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Vouchers section */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {/* Vouchers Used */}
                                        <div className="bg-white border border-slate-100 rounded-xl p-5 space-y-3 shadow-xs">
                                            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                                                <div>
                                                    <h4 className="font-extrabold text-blue-950 text-sm">{t('backoffice.customer.stats_modal.vouchers_used', 'Voucher yang digunakan')}</h4>
                                                    <p className="text-[11px] text-slate-400">{t('backoffice.customer.stats_modal.vouchers_used_desc', 'Penggunaan voucher di checkout.')}</p>
                                                </div>
                                                <span className="inline-flex bg-slate-100 font-bold text-slate-700 text-xs px-2.5 py-1 rounded-full">
                                                    {statsData.stats.vouchers_used?.length || 0}
                                                </span>
                                            </div>

                                            <div className="overflow-y-auto max-h-[180px] space-y-2 border border-slate-50 p-2 rounded-lg">
                                                {!statsData.stats.vouchers_used || statsData.stats.vouchers_used.length === 0 ? (
                                                    <div className="text-center text-xs text-slate-400 py-6">
                                                        {t('backoffice.customer.stats_modal.no_vouchers_used', 'Belum pernah menggunakan voucher.')}
                                                    </div>
                                                ) : (
                                                    statsData.stats.vouchers_used.map((vu, idx) => (
                                                        <div key={idx} className="flex justify-between items-center bg-indigo-50/40 border border-indigo-100/50 rounded-lg p-2.5">
                                                            <div className="space-y-0.5">
                                                                <div className="font-extrabold text-indigo-950 text-xs flex items-center gap-1">
                                                                    <Tag className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                                                                    <span>{vu.code}</span>
                                                                </div>
                                                                <div className="text-[10px] text-slate-500 font-semibold">{vu.name}</div>
                                                                <div className="text-[10px] text-slate-450 flex items-center gap-1 font-bold">
                                                                    <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                                                    <span>{formatDateTime(vu.used_at)}</span>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-[11px] font-black text-indigo-700 block">
                                                                    -{formatCurrency(vu.discount_obtained)}
                                                                </span>
                                                                <span className="text-[9px] bg-indigo-100 text-indigo-800 font-black px-1.5 py-0.5 rounded uppercase">
                                                                    {t('backoffice.customer.stats_modal.used_status', 'Used')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>

                                        {/* Vouchers Assigned */}
                                        <div className="bg-white border border-slate-100 rounded-xl p-5 space-y-3 shadow-xs">
                                            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                                                <div>
                                                    <h4 className="font-extrabold text-blue-950 text-sm">
                                                        {t("backoffice.stats.vouchers_assigned_title", "Voucher yang Diberikan")}
                                                    </h4>
                                                    <p className="text-[11px] text-slate-400">
                                                        {t("backoffice.stats.vouchers_assigned_desc", "Diberikan manual via Backoffice.")}
                                                    </p>
                                                </div>
                                                <span className="inline-flex bg-slate-100 font-bold text-slate-700 text-xs px-2.5 py-1 rounded-full">
                                                    {statsData.stats.vouchers_assigned?.length || 0}
                                                </span>
                                            </div>

                                            <div className="overflow-y-auto max-h-[180px] space-y-2 border border-slate-50 p-2 rounded-lg">
                                                {!statsData.stats.vouchers_assigned || statsData.stats.vouchers_assigned.length === 0 ? (
                                                    <div className="text-center text-xs text-slate-400 py-6">
                                                        Belum ada voucher yang diberikan manual.
                                                    </div>
                                                ) : (
                                                    statsData.stats.vouchers_assigned.map((va, idx) => (
                                                        <div key={idx} className="flex justify-between items-center bg-emerald-50/40 border border-emerald-100/50 rounded-lg p-2.5">
                                                            <div className="space-y-0.5">
                                                                <div className="font-extrabold text-emerald-950 text-xs flex items-center gap-1">
                                                                    <Gift className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                                                    <span>{va.code}</span>
                                                                </div>
                                                                <div className="text-[10px] text-slate-500 font-semibold">{va.name}</div>
                                                                <div className="text-[9px] text-slate-450 flex flex-col gap-0.5 font-bold">
                                                                    <span>{t('backoffice.customer.stats_modal.assigned_at_label', 'Diberikan: ')}{formatDateTime(va.assigned_at)}</span>
                                                                    {va.is_used && <span>{t('backoffice.customer.stats_modal.used_at_label', 'Digunakan: ')}{formatDateTime(va.used_at)}</span>}
                                                                </div>
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase block w-fit ml-auto ${va.is_used ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs'}`}>
                                                                    {va.is_used ? t('backoffice.customer.stats_modal.status.used', 'Telah Dipakai') : t('backoffice.customer.stats_modal.status.available', 'Tersedia')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-20 text-slate-400 font-medium">
                                    {t('backoffice.customer.stats_modal.error_message', 'Gagal memuat data. Silakan coba beberapa saat lagi.')}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
                            <button
                                onClick={onClose}
                                className="rounded-lg bg-blue-950 hover:bg-blue-900 text-white font-bold px-5 py-2.5 text-sm active:scale-[0.98] transition shadow-md"
                            >
                                {t('backoffice.customer.button.close', 'Tutup')}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
