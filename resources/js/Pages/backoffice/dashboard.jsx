import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    ArrowUpRight,
    ArrowDownRight,
    Package,
    PackageCheck,
    ShoppingBag,
    TrendingUp,
    Users,
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
import { motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { useLanguage } from '@/Contexts/LanguageContext';

function SalesTrendChart({ data, locale, t }) {
    return (
        <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 16, right: 16, left: locale === 'arabic' ? 16 : 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="salesArea" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#1e40af" stopOpacity={0.2} />
                            <stop offset="100%" stopColor="#1e40af" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#f1f5f9" strokeDasharray="4 4" />
                    <XAxis
                        axisLine={false}
                        dataKey="month"
                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                        tickLine={false}
                    />
                    <YAxis
                        axisLine={false}
                        orientation={locale === 'arabic' ? 'right' : 'left'}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        tickLine={false}
                        tickFormatter={(v) => v + t('chart.suffix_million', 'jt')}
                    />
                    <Tooltip
                        contentStyle={{
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            backgroundColor: '#ffffff',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.07)',
                            textAlign: locale === 'arabic' ? 'right' : 'left',
                        }}
                        formatter={(value) => [
                            'Rp ' + (value * 1_000_000).toLocaleString('id-ID'),
                            t('chart.revenue', 'Revenue')
                        ]}
                        labelFormatter={(label) => label}
                    />
                    <Area
                        dataKey="sales"
                        fill="url(#salesArea)"
                        stroke="#1e40af"
                        strokeWidth={2.5}
                        type="monotone"
                        dot={{ fill: '#1e40af', r: 3, strokeWidth: 0 }}
                        activeDot={{ r: 5 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

function GrowthBadge({ value }) {
    if (value === null || value === undefined) return null;
    const positive = value >= 0;
    return (
        <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {positive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {Math.abs(value)}%
        </span>
    );
}

export default function Dashboard({ stats = {}, pendingOrders = [], lowStockProducts = [], monthlySales = [] }) {
    const { t, locale } = useLanguage();

    const formatRupiah = (value) => {
        if (value >= 1_000_000_000) {
            return 'Rp ' + (value / 1_000_000_000).toFixed(1) + t('chart.suffix_billion', 'M');
        }
        if (value >= 1_000_000) {
            return 'Rp ' + (value / 1_000_000).toFixed(1) + t('chart.suffix_million', 'jt');
        }
        return 'Rp ' + new Intl.NumberFormat('id-ID').format(value);
    };

    const summaryCards = [
        {
            title: t('summary.total_revenue', 'Total Revenue (Completed)'),
            value: formatRupiah(stats.totalRevenue ?? 0),
            note: stats.revenueGrowth !== null && stats.revenueGrowth !== undefined
                ? null
                : t('summary.all_time', 'All time'),
            growth: stats.revenueGrowth,
            icon: TrendingUp,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'border-blue-100',
        },
        {
            title: t('summary.new_orders', 'Total Orders'),
            value: (stats.totalOrders ?? 0).toLocaleString('id-ID'),
            note: t('summary.pending_orders', '{count} pending').replace('{count}', stats.pendingOrdersCount ?? 0),
            isAlert: (stats.pendingOrdersCount ?? 0) > 0,
            icon: ShoppingBag,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            border: 'border-amber-100',
        },
        {
            title: t('summary.total_customers', 'Total Customers'),
            value: (stats.totalCustomers ?? 0).toLocaleString('id-ID'),
            note: t('summary.new_customers_note', '+{count} new this month').replace('{count}', stats.newCustomersThisMonth ?? 0),
            growth: stats.customerGrowth,
            icon: Users,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            border: 'border-emerald-100',
        },
        {
            title: t('summary.products_sold', 'Products Sold This Month'),
            value: (stats.productsSoldThisMonth ?? 0).toLocaleString('id-ID'),
            note: t('summary.this_month_note', 'Throughout this month'),
            icon: PackageCheck,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
            border: 'border-indigo-100',
        },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Head title={t('dashboard.title', 'Dashboard - Backoffice')} />

            <div className="flex min-h-screen">
                <Sidebar />

                <main className="flex flex-col flex-1 min-w-0">
                    <Navbar />

                    <motion.div
                        className="flex-1 p-6 space-y-6"
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                    >
                        {/* Header */}
                        <motion.section variants={itemVariants}>
                            <h1 className="text-2xl font-bold tracking-tight text-blue-950">
                                {t('dashboard.heading', 'Dashboard Overview')}
                            </h1>
                            <p className="mt-1 text-sm text-slate-500">
                                {t('dashboard.subheading', 'Real-time store performance metrics.')}
                            </p>
                        </motion.section>

                        {/* Summary Cards */}
                        <motion.section variants={itemVariants} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {summaryCards.map((card) => {
                                const Icon = card.icon;
                                return (
                                    <article
                                        key={card.title}
                                        className={`p-5 bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all group ${card.border ?? 'border-slate-100'}`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-xs font-semibold text-slate-500 group-hover:text-blue-950 transition-colors">
                                                {card.title}
                                            </p>
                                            <div className={`flex items-center justify-center w-9 h-9 rounded-xl ${card.bg ?? 'bg-slate-50'} ${card.color ?? 'text-slate-600'} border ${card.border ?? 'border-slate-100'} group-hover:scale-105 transition-transform`}>
                                                <Icon className="w-4 h-4" aria-hidden="true" />
                                            </div>
                                        </div>
                                        <h3 className="mt-3 text-2xl font-bold tracking-tight text-blue-950 tabular-nums">
                                            {card.value}
                                        </h3>
                                        <div className="mt-3 flex items-center gap-1.5">
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md inline-block ${card.isAlert ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {card.note}
                                            </span>
                                            {card.growth !== undefined && card.growth !== null && (
                                                <GrowthBadge value={card.growth} />
                                            )}
                                        </div>
                                    </article>
                                );
                            })}
                        </motion.section>

                        {/* Monthly Sales Chart */}
                        <motion.section variants={itemVariants} className="p-6 bg-white border border-slate-100 shadow-sm rounded-2xl">
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                                <div>
                                    <p className="text-xs font-bold tracking-wider uppercase text-blue-500">
                                        {t('chart.trend_title', 'Revenue Trend')}
                                    </p>
                                    <h3 className="mt-1 text-lg font-bold tracking-tight text-blue-950">
                                        {t('chart.monthly_sales', 'Monthly Revenue (Last 12 Months)')}
                                    </h3>
                                </div>
                                <span className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/50 rounded-lg">
                                    {t('chart.real_data', 'Live Data')}
                                </span>
                            </div>
                            <SalesTrendChart data={monthlySales} locale={locale} t={t} />
                        </motion.section>

                        {/* Bottom Grid: Pending Orders + Low Stock */}
                        <motion.section variants={itemVariants} className="grid gap-6 lg:grid-cols-2">
                            {/* Pending Orders */}
                            <article className="p-6 bg-white border border-slate-100 shadow-sm rounded-2xl">
                                <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
                                    <div>
                                        <p className="text-xs font-bold tracking-wider uppercase text-amber-600">
                                            {t('dashboard.quick_notification', 'Quick Notification')}
                                        </p>
                                        <h3 className="mt-1 text-base font-bold text-blue-950">
                                            {t('orders.unprocessed_title', 'Pending Orders')}
                                        </h3>
                                    </div>
                                    <ShoppingBag className="w-5 h-5 text-amber-500" aria-hidden="true" />
                                </div>

                                <div className="mt-2 divide-y divide-slate-100">
                                    {pendingOrders.length === 0 ? (
                                        <p className="py-8 text-sm text-center text-slate-400">
                                            {t('orders.no_pending', 'No pending orders 🎉')}
                                        </p>
                                    ) : (
                                        pendingOrders.map((order) => (
                                            <Link
                                                key={order.id}
                                                href={`/backoffice/orders?search=${encodeURIComponent(order.id)}`}
                                                className="flex items-center justify-between gap-4 px-1 py-3 rounded-lg hover:bg-slate-50/60 transition-colors cursor-pointer block"
                                            >
                                                <div>
                                                    <p className="text-sm font-bold text-blue-950 font-mono">{order.id}</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">{order.customer} · {order.created_at}</p>
                                                </div>
                                                <p className="text-sm font-bold text-amber-600 tabular-nums">{order.total}</p>
                                            </Link>
                                        ))
                                    )}
                                </div>

                                <Link
                                    href="/backoffice/orders"
                                    className="mt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                    {t('orders.view_all', 'View all orders')} <ArrowRight size={13} />
                                </Link>
                            </article>

                            {/* Low Stock Alert */}
                            <article className="p-6 bg-white border border-slate-100 shadow-sm rounded-2xl">
                                <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
                                    <div>
                                        <p className="text-xs font-bold tracking-wider uppercase text-rose-500">
                                            {t('dashboard.stock_alert', 'Stock Alert')}
                                        </p>
                                        <h3 className="mt-1 text-base font-bold text-blue-950">
                                            {t('products.low_stock_title', 'Low Stock Products')}
                                        </h3>
                                    </div>
                                    <AlertTriangle className="w-5 h-5 text-rose-500" aria-hidden="true" />
                                </div>

                                <div className="mt-2 divide-y divide-slate-100">
                                    {lowStockProducts.length === 0 ? (
                                        <p className="py-8 text-sm text-center text-slate-400">
                                            {t('products.no_low_stock', 'All products are well-stocked ✅')}
                                        </p>
                                    ) : (
                                        lowStockProducts.map((product) => (
                                            <Link
                                                key={product.name}
                                                href={`/backoffice/product-management?search=${encodeURIComponent(product.name)}`}
                                                className="flex items-center justify-between gap-4 px-1 py-3 rounded-lg hover:bg-slate-50/60 transition-colors cursor-pointer block"
                                            >
                                                <p className="text-sm font-semibold text-blue-950 truncate">{product.name}</p>
                                                <span className={`flex-shrink-0 px-2.5 py-1 text-xs font-bold rounded-md border ${product.stock === 0 ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                                    {product.stock === 0 ? t('products.out_of_stock', 'Out of stock') : t('products.stock_left', '{count} left').replace('{count}', product.stock)}
                                                </span>
                                            </Link>
                                        ))
                                    )}
                                </div>

                                <Link
                                    href="/backoffice/product-management"
                                    className="mt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                    {t('products.manage_all', 'Manage products')} <ArrowRight size={13} />
                                </Link>
                            </article>
                        </motion.section>
                    </motion.div>
                </main>
            </div>
        </div>
    );
}