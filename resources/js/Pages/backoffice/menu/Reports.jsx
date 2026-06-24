import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    BadgeCheck,
    BarChart3,
    CheckCircle,
    Clock,
    Package,
    ShoppingBag,
    TrendingUp,
    Users,
    XCircle,
} from 'lucide-react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useLanguage } from '@/Contexts/LanguageContext';

export default function Reports({
    stats = {},
    monthlySales = [],
    ordersByStatus = {},
    topProducts = [],
    revenueByBranch = [],
    recentTransactions = [],
}) {
    const { t, locale } = useLanguage();

    // Format Rupiah / Mata Uang fleksibel berdasarkan sistem Fayyfir Shop
    function formatCurrency(value) {
        const currencySymbol = t('product.currency', 'Rp ');

        if (value >= 1_000_000_000) {
            return currencySymbol + (value / 1_000_000_000).toFixed(1) + t('reports.stats.billion', 'M');
        }
        if (value >= 1_000_000) {
            return currencySymbol + (value / 1_000_000).toFixed(1) + t('reports.stats.million', 'jt');
        }
        return currencySymbol + new Intl.NumberFormat(locale === 'indonesia' ? 'id-ID' : 'en-US').format(value);
    }

    const STATUS_COLORS = {
        pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', bar: '#f59e0b' },
        processing: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', bar: '#3b82f6' },
        shipped: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', bar: '#6366f1' },
        completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', bar: '#10b981' },
        cancelled: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', bar: '#f43f5e' },
    };

    const STATUS_ICONS = {
        pending: Clock,
        processing: Package,
        shipped: ShoppingBag,
        completed: CheckCircle,
        cancelled: XCircle,
    };

    const summaryCards = [
        {
            title: t('reports.cards.revenue_title', 'Total Revenue (Completed)'),
            value: formatCurrency(stats.totalRevenue ?? 0),
            sub: t('reports.cards.revenue_sub', 'This month: ') + formatCurrency(stats.revenueThisMonth ?? 0),
            icon: TrendingUp,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'border-blue-100',
        },
        {
            title: t('reports.cards.orders_title', 'Total Orders'),
            value: (stats.totalOrders ?? 0).toLocaleString(locale === 'indonesia' ? 'id-ID' : 'en-US'),
            sub: t('reports.cards.orders_sub', 'This month: ') + (stats.ordersThisMonth ?? 0),
            icon: ShoppingBag,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            border: 'border-amber-100',
        },
        {
            title: t('reports.cards.customers_title', 'Total Customers'),
            value: (stats.totalCustomers ?? 0).toLocaleString(locale === 'indonesia' ? 'id-ID' : 'en-US'),
            sub: t('reports.cards.customers_sub', 'Registered customers'),
            icon: Users,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            border: 'border-emerald-100',
        },
        {
            title: t('reports.cards.items_title', 'Total Items Sold'),
            value: (stats.totalProductsSold ?? 0).toLocaleString(locale === 'indonesia' ? 'id-ID' : 'en-US'),
            sub: t('reports.cards.items_sub', 'From completed orders'),
            icon: BadgeCheck,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
            border: 'border-indigo-100',
        },
    ];

    const statusEntries = Object.entries(ordersByStatus);
    const totalOrdersForStatus = statusEntries.reduce((s, [, v]) => s + v, 0);

    return (
        <div className="min-h-screen bg-slate-50">
            <Head title={`${t('reports.title', 'Reports')} - Backoffice`} />

            <div className="flex min-h-screen">
                <Sidebar />

                <main className="flex flex-col flex-1 min-w-0">
                    <Navbar />

                    <div className="flex-1 p-6 space-y-6">
                        {/* Header */}
                        <section>
                            <h1 className="text-2xl font-bold tracking-tight text-blue-950">
                                {t('reports.header.title', 'Reports & Analytics')}
                            </h1>
                            <p className="mt-1 text-sm text-slate-500">
                                {t('reports.header.subtitle', "Comprehensive view of your store's performance.")}
                            </p>
                        </section>

                        {/* Summary Cards */}
                        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {summaryCards.map((card) => {
                                const Icon = card.icon;
                                return (
                                    <article key={card.title} className={`p-5 bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all group ${card.border}`}>
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-semibold text-slate-500">{card.title}</p>
                                            <div className={`flex items-center justify-center w-9 h-9 rounded-xl ${card.bg} ${card.color} border ${card.border} group-hover:scale-105 transition-transform`}>
                                                <Icon className="w-4 h-4" aria-hidden="true" />
                                            </div>
                                        </div>
                                        <h3 className="mt-3 text-2xl font-bold tracking-tight text-blue-950 tabular-nums">{card.value}</h3>
                                        <p className="mt-2 text-[11px] text-slate-400 font-medium">{card.sub}</p>
                                    </article>
                                );
                            })}
                        </section>

                        {/* Revenue Chart */}
                        <section className="p-6 bg-white border border-slate-100 shadow-sm rounded-2xl">
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                                <div>
                                    <p className="text-xs font-bold tracking-wider uppercase text-blue-500">{t('reports.chart.trend', 'Revenue Trend')}</p>
                                    <h3 className="mt-1 text-lg font-bold tracking-tight text-blue-950">{t('reports.chart.title', 'Monthly Revenue (Last 12 Months)')}</h3>
                                </div>
                            </div>
                            <div className="w-full h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={monthlySales}
                                        margin={{ top: 16, right: 16, left: 0, bottom: 0 }}
                                    >
                                        <defs>
                                            <linearGradient id="revenueGrad" x1="0" x2="0" y1="0" y2="1">
                                                <stop offset="0%" stopColor="#1e40af" stopOpacity={0.2} />
                                                <stop offset="100%" stopColor="#1e40af" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid stroke="#f1f5f9" strokeDasharray="4 4" />
                                        <XAxis axisLine={false} dataKey="month" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} tickLine={false} />
                                        <YAxis axisLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} tickFormatter={(v) => formatCurrency(v)} />
                                        <Tooltip
                                            contentStyle={{ border: '1px solid #e2e8f0', borderRadius: '10px', backgroundColor: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.07)' }}
                                            formatter={(value) => [formatCurrency(value), t('reports.chart.revenue_label', 'Revenue')]}
                                            labelFormatter={(label) => label}
                                        />
                                        <Area dataKey="revenue" fill="url(#revenueGrad)" stroke="#1e40af" strokeWidth={2.5} type="monotone" dot={{ fill: '#1e40af', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </section>

                        <div className="grid gap-6 lg:grid-cols-2">
                            {/* Order Status Breakdown */}
                            <section className="p-6 bg-white border border-slate-100 shadow-sm rounded-2xl">
                                <p className="text-xs font-bold tracking-wider uppercase text-blue-500 mb-1">{t('reports.status.tag', 'Orders')}</p>
                                <h3 className="text-lg font-bold tracking-tight text-blue-950 mb-5">{t('reports.status.title', 'Order Status Breakdown')}</h3>
                                <div className="space-y-3">
                                    {statusEntries.map(([status, count]) => {
                                        const colors = STATUS_COLORS[status] ?? { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' };
                                        const Icon = STATUS_ICONS[status] ?? Package;
                                        const pct = totalOrdersForStatus > 0 ? Math.round((count / totalOrdersForStatus) * 100) : 0;
                                        return (
                                            <div key={status} className="flex items-center gap-3">
                                                <span className={`flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg ${colors.bg} ${colors.text} border ${colors.border}`}>
                                                    <Icon size={13} />
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs font-semibold text-slate-700 capitalize">
                                                            {t(`reports.status.${status}`, status)}
                                                        </span>
                                                        <span className="text-xs font-bold text-slate-900">{count} <span className="text-slate-400 font-normal">({pct}%)</span></span>
                                                    </div>
                                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all"
                                                            style={{ width: pct + '%', backgroundColor: STATUS_COLORS[status]?.bar ?? '#94a3b8' }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>

                            {/* Revenue by Branch */}
                            <section className="p-6 bg-white border border-slate-100 shadow-sm rounded-2xl">
                                <p className="text-xs font-bold tracking-wider uppercase text-blue-500 mb-1">{t('reports.branch.tag', 'Branches')}</p>
                                <h3 className="text-lg font-bold tracking-tight text-blue-950 mb-5">{t('reports.branch.title', 'Revenue by Branch')}</h3>
                                {revenueByBranch.length === 0 ? (
                                    <p className="text-sm text-slate-400 text-center py-8">{t('reports.branch.empty', 'No branch data available.')}</p>
                                ) : (
                                    <div className="space-y-3">
                                        {revenueByBranch.map((branch) => (
                                            <div key={branch.branch} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                                <div>
                                                    <p className="text-sm font-semibold text-blue-950">{branch.branch}</p>
                                                    <p className="text-xs text-slate-400 mt-0.5">{branch.orders} {t('reports.branch.orders_count', 'orders')}</p>
                                                </div>
                                                <p className="text-sm font-bold text-blue-700 tabular-nums">{formatCurrency(branch.revenue)}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </div>

                        {/* Top Products */}
                        <section className="p-6 bg-white border border-slate-100 shadow-sm rounded-2xl">
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <p className="text-xs font-bold tracking-wider uppercase text-blue-500">{t('reports.products.tag', 'Products')}</p>
                                    <h3 className="mt-1 text-lg font-bold tracking-tight text-blue-950">{t('reports.products.title', 'Top Selling Products')}</h3>
                                </div>
                            </div>
                            {topProducts.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-8">{t('reports.products.empty', 'No sales data available yet.')}</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                                <th className="px-4 py-3 w-8">#</th>
                                                <th className="px-4 py-3">{t('reports.products.th_product', 'Product')}</th>
                                                <th className="px-4 py-3 text-right">{t('reports.products.th_qty', 'Qty Sold')}</th>
                                                <th className="px-4 py-3 text-right">{t('reports.products.th_revenue', 'Revenue')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {topProducts.map((p, i) => (
                                                <tr key={p.name} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-4 py-3 font-bold text-slate-400">{i + 1}</td>
                                                    <td className="px-4 py-3 font-semibold text-blue-950">{p.name}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-slate-700 tabular-nums">{p.total_qty.toLocaleString(locale === 'indonesia' ? 'id-ID' : 'en-US')}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-blue-700 tabular-nums">{formatCurrency(p.total_revenue)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>

                        {/* Recent Transactions */}
                        <section className="p-6 bg-white border border-slate-100 shadow-sm rounded-2xl">
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <p className="text-xs font-bold tracking-wider uppercase text-blue-500">{t('reports.tx.tag', 'Transactions')}</p>
                                    <h3 className="mt-1 text-lg font-bold tracking-tight text-blue-950">{t('reports.tx.title', 'Recent Orders')}</h3>
                                </div>
                                <Link href="/backoffice/orders" className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                                    {t('reports.tx.view_all', 'View all')} <ArrowRight size={13} />
                                </Link>
                            </div>
                            {recentTransactions.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-8">{t('reports.tx.empty', 'No transactions yet.')}</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                                <th className="px-4 py-3">{t('reports.tx.th_invoice', 'Invoice')}</th>
                                                <th className="px-4 py-3">{t('reports.tx.th_customer', 'Customer')}</th>
                                                <th className="px-4 py-3">{t('reports.tx.th_branch', 'Branch')}</th>
                                                <th className="px-4 py-3">{t('reports.tx.th_date', 'Date')}</th>
                                                <th className="px-4 py-3">{t('reports.tx.th_status', 'Status')}</th>
                                                <th className="px-4 py-3 text-right">{t('reports.tx.th_total', 'Total')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {recentTransactions.map((tx) => {
                                                const colors = STATUS_COLORS[tx.status] ?? { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' };
                                                return (
                                                    <tr key={tx.invoice} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-4 py-3 font-mono font-bold text-blue-950">{tx.invoice}</td>
                                                        <td className="px-4 py-3">
                                                            <p className="font-semibold text-slate-800">{tx.customer}</p>
                                                            <p className="text-[10px] text-slate-400 mt-0.5">{tx.email}</p>
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-600">{tx.branch}</td>
                                                        <td className="px-4 py-3 text-slate-500">{tx.date}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${colors.bg} ${colors.text} border ${colors.border}`}>
                                                                {t(`reports.status.${tx.status}`, tx.status)}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-bold text-blue-700 tabular-nums">{formatCurrency(tx.total)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
}