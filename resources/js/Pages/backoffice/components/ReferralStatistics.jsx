import React from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Coins,
    TrendingUp,
    Activity,
    ShoppingBag,
    User,
    Calendar,
    Globe2,
} from 'lucide-react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useLanguage } from '@/Contexts/LanguageContext';

export default function ReferralStatistics({ referral = {}, stats = {} }) {
    const { t } = useLanguage();

    const formatCurrency = (val) => {
        if (val === null || val === undefined) return 'Rp 0';
        return 'Rp ' + Number(val).toLocaleString('id-ID');
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const commissionRate = referral.commission_percentage || 0;

    return (
        <div className="min-h-screen bg-blue-50">
            <Head title={`Statistik Referral - ${referral.name}`} />

            <div className="flex min-h-screen">
                <Sidebar />

                <main className="flex flex-col flex-1 min-w-0">
                    <Navbar />

                    <div className="flex-1 p-6 space-y-6">
                        {/* Header with Back Button */}
                        <div className="flex flex-col gap-2">
                            <Link
                                href="/backoffice/promotion"
                                className="inline-flex items-center gap-2 text-sm font-bold text-blue-900 hover:text-blue-700 transition w-fit"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span>Kembali ke Manajemen Promosi</span>
                            </Link>
                            <div className="flex flex-wrap items-end justify-between gap-4 mt-2">
                                <div>
                                    <h1 className="text-3xl font-extrabold tracking-normal text-blue-950 flex items-center gap-3">
                                        <User className="w-8 h-8 text-blue-900" />
                                        <span>Statistik Referral: {referral.name}</span>
                                    </h1>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Pantau performa penjualan, komisi, dan penggunaan kode referral.
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-sm bg-blue-900 text-white font-extrabold px-3 py-1.5 rounded-lg border border-blue-950 shadow-sm select-all">
                                        KODE: {referral.code}
                                    </span>
                                    <span className="text-xs bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-1.5 rounded-lg border border-emerald-200">
                                        Komisi: {commissionRate}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Referral Details Info Banner */}
                        <div className="bg-white border border-blue-100 rounded-xl p-5 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-1">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Masa Berlaku</span>
                                <div className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-blue-800 shrink-0" />
                                    <span>{formatDate(referral.start_date)} s/d {formatDate(referral.end_date)}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Negara Berlaku</span>
                                <div className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Globe2 className="w-4 h-4 text-blue-800 shrink-0" />
                                    <span className="capitalize">{referral.countries?.join(', ') || '-'}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Bentuk Diskon</span>
                                <div className="text-sm font-bold text-slate-700">
                                    <span className="capitalize font-extrabold text-indigo-950 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded text-xs mr-2">
                                        {referral.type === 'percentage' ? 'Persentase' : 'Nilai Tetap'}
                                    </span>
                                    <span>{referral.type === 'percentage' ? `${parseFloat(referral.value)}%` : formatCurrency(referral.value)}</span>
                                </div>
                            </div>
                        </div>

                        {/* KPI Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Card 1: Usage Count */}
                            <div className="bg-gradient-to-br from-white to-blue-50/30 border border-blue-100 rounded-xl p-6 shadow-sm flex items-center justify-between hover:shadow-md transition duration-200">
                                <div className="space-y-1">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Frekuensi Penggunaan</span>
                                    <h3 className="text-4xl font-extrabold text-blue-950">
                                        {stats.total_usage || 0} <span className="text-sm font-bold text-slate-400">kali</span>
                                    </h3>
                                    <span className="text-[11px] text-slate-400 block font-semibold">
                                        Kuota Limit: {referral.total_quota || 0}
                                    </span>
                                </div>
                                <div className="p-4 bg-blue-100 text-blue-900 rounded-xl border border-blue-200 shadow-inner">
                                    <Activity className="w-6 h-6" />
                                </div>
                            </div>

                            {/* Card 2: Revenue Generated */}
                            <div className="bg-gradient-to-br from-white to-emerald-50/10 border border-blue-100 rounded-xl p-6 shadow-sm flex items-center justify-between hover:shadow-md transition duration-200">
                                <div className="space-y-1">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Omzet Penjualan</span>
                                    <h3 className="text-2xl font-black text-blue-950">
                                        {formatCurrency(stats.total_revenue)}
                                    </h3>
                                    <span className="text-[11px] text-emerald-600 block font-bold flex items-center gap-1">
                                        <TrendingUp className="w-3.5 h-3.5" />
                                        <span>Dari pesanan referral</span>
                                    </span>
                                </div>
                                <div className="p-4 bg-emerald-100 text-emerald-900 rounded-xl border border-emerald-200 shadow-inner">
                                    <ShoppingBag className="w-6 h-6" />
                                </div>
                            </div>

                            {/* Card 3: Commission Earned */}
                            <div className="bg-gradient-to-br from-white to-amber-50/10 border border-blue-100 rounded-xl p-6 shadow-sm flex items-center justify-between hover:shadow-md transition duration-200">
                                <div className="space-y-1">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pendapatan Pemilik (Komisi)</span>
                                    <h3 className="text-2xl font-black text-amber-600">
                                        {formatCurrency(stats.total_earnings)}
                                    </h3>
                                    <span className="text-[11px] text-slate-400 block font-semibold">
                                        Bagi Hasil: {commissionRate}% dari Omzet
                                    </span>
                                </div>
                                <div className="p-4 bg-amber-100 text-amber-900 rounded-xl border border-amber-200 shadow-inner">
                                    <Coins className="w-6 h-6" />
                                </div>
                            </div>
                        </div>

                        {/* Products Sold Table */}
                        <div className="bg-white border border-blue-100 rounded-xl shadow-sm p-6 space-y-4">
                            <div className="flex items-center justify-between border-b border-blue-50 pb-3">
                                <div>
                                    <h2 className="text-lg font-extrabold text-blue-950">Daftar Produk yang Berhasil Dijual</h2>
                                    <p className="text-xs text-slate-400">Daftar item produk yang dipesan pembeli menggunakan kode referral ini.</p>
                                </div>
                                <span className="inline-flex bg-slate-100 font-bold text-slate-700 text-xs px-2.5 py-1 rounded-full">
                                    {stats.products_sold?.length || 0} Produk Unik
                                </span>
                            </div>

                            <div className="overflow-x-auto border border-slate-50 rounded-lg">
                                <table className="min-w-full divide-y divide-slate-100">
                                    <thead className="bg-slate-50/70">
                                        <tr className="text-xs font-bold tracking-wider text-left text-slate-600 uppercase">
                                            <th className="px-5 py-3">Nama Produk</th>
                                            <th className="px-5 py-3 text-center">Jumlah Terjual (Qty)</th>
                                            <th className="px-5 py-3 text-right">Total Nominal Penjualan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm divide-y divide-slate-50 text-slate-700">
                                        {!stats.products_sold || stats.products_sold.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="px-5 py-12 text-center text-slate-400 font-medium">
                                                    Belum ada catatan produk terjual untuk kode referral ini.
                                                </td>
                                            </tr>
                                        ) : (
                                            stats.products_sold.map((product, idx) => (
                                                <tr key={idx} className="align-middle hover:bg-slate-50/50 transition">
                                                    <td className="px-5 py-4 font-bold text-blue-950">
                                                        {product.name}
                                                    </td>
                                                    <td className="px-5 py-4 text-center font-bold text-slate-800">
                                                        {product.total_quantity} pcs
                                                    </td>
                                                    <td className="px-5 py-4 text-right font-extrabold text-slate-800">
                                                        {formatCurrency(product.total_sales)}
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
        </div>
    );
}
