import { Head } from '@inertiajs/react';
import {
    AlertTriangle,
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
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { useLanguage } from '@/Contexts/LanguageContext';

const salesTrend = [
    { label: 'Jan', sales: 32 },
    { label: 'Feb', sales: 45 },
    { label: 'Mar', sales: 38 },
    { label: 'Apr', sales: 61 },
    { label: 'May', sales: 72 },
    { label: 'Jun', sales: 68 },
    { label: 'Jul', sales: 84 },
];

const pendingOrders = [
    { id: 'ORD-1027', customer: 'Rani Wijaya', total: 'Rp 620.000' },
    { id: 'ORD-1028', customer: 'Dimas Putra', total: 'Rp 285.000' },
    { id: 'ORD-1029', customer: 'Sinta Lestari', total: 'Rp 940.000' },
    { id: 'ORD-1030', customer: 'Bagus Pratama', total: 'Rp 175.000' },
];

const lowStockProducts = [
    { name: 'Kemeja Linen Premium', stock: 4 },
    { name: 'Dress Batik Modern', stock: 3 },
    { name: 'Sneakers Putih Casual', stock: 5 },
    { name: 'Tas Selempang Kulit', stock: 2 },
];

function SalesTrendChart() {
    const { t, locale } = useLanguage();

    return (
        <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={salesTrend}
                    margin={{
                        top: 24,
                        right: locale === 'arabic' ? 0 : 16,
                        left: locale === 'arabic' ? 16 : 0,
                        bottom: 0,
                    }}
                >
                    <defs>
                        <linearGradient id="salesArea" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#d97706" stopOpacity={0.24} />
                            <stop offset="100%" stopColor="#d97706" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#f1f5f9" strokeDasharray="4 4" />
                    <XAxis
                        axisLine={false}
                        dataKey="label"
                        tick={{ fill: '#1e3a8a', fontSize: 13, fontWeight: 600 }}
                        tickLine={false}
                    />
                    <YAxis
                        axisLine={false}
                        orientation={locale === 'arabic' ? 'right' : 'left'}
                        tick={{ fill: '#1e3a8a', fontSize: 13 }}
                        tickLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            border: '1px solid #f59e0b',
                            borderRadius: '8px',
                            backgroundColor: '#ffffff',
                            boxShadow: '0 10px 25px rgba(30, 64, 175, 0.05)',
                            textAlign: locale === 'arabic' ? 'right' : 'left',
                        }}
                        formatter={(value) => [
                            t('chart.unit_million', '{value} million').replace(
                                '{value}',
                                value,
                            ),
                            t('chart.sales_label', 'Sales'),
                        ]}
                        labelFormatter={(label) =>
                            t('chart.month_label', 'Month {name}').replace(
                                '{name}',
                                label,
                            )
                        }
                    />
                    <Area
                        dataKey="sales"
                        fill="url(#salesArea)"
                        stroke="#d97706"
                        strokeWidth={3}
                        type="monotone"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

export default function Dashboard() {
    const { t } = useLanguage();

    // Mapping summaryCards di dalam komponen agar pembacaan JSON key berjalan dinamis saat bahasa berganti
    const summaryCards = [
        {
            title: t('summary.total_sales', 'Total Sales'),
            value: 'Rp 128.450.000',
            note: t('summary.last_month_note', '+{percent}% from last month').replace(
                '{percent}',
                '18',
            ),
            icon: TrendingUp,
        },
        {
            title: t('summary.new_orders', 'New Orders Count'),
            value: '342',
            note: t('summary.unprocessed_note', '{count} unprocessed').replace(
                '{count}',
                '28',
            ),
            icon: ShoppingBag,
            isAlert: true,
        },
        {
            title: t('summary.total_customers', 'Total Customers'),
            value: '4.812',
            note: t('summary.new_customers_note', '+{count} new customers').replace(
                '{count}',
                '126',
            ),
            icon: Users,
        },
        {
            title: t('summary.products_sold', 'Products Sold'),
            value: '1.936',
            note: t('summary.this_month_note', 'Throughout this month'),
            icon: PackageCheck,
        },
    ];

    return (
        <div className="min-h-screen bg-[#fcfcfd]">
            <Head title={t('dashboard.title', 'Fayyfir Backoffice')} />

            <div className="flex min-h-screen">
                <Sidebar />

                <main className="flex flex-col flex-1 min-w-0 bg-slate-50/50">
                    <Navbar />

                    <div className="flex-1 p-6 space-y-6">
                        {/* Section Card Summary */}
                        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            {summaryCards.map((card) => {
                                const Icon = card.icon;

                                return (
                                    <article
                                        key={card.title}
                                        className="p-5 transition-all bg-white border shadow-sm border-slate-100 rounded-xl hover:shadow-md hover:border-amber-500/20 group"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-semibold transition-colors text-slate-500 group-hover:text-blue-950">
                                                {card.title}
                                            </p>
                                            <div className="inline-flex items-center justify-center transition-transform border shadow-inner text-amber-500 rounded-xl min-h-11 min-w-11 bg-blue-950 border-amber-500/30 group-hover:scale-105">
                                                <Icon className="w-5 h-5" aria-hidden="true" />
                                            </div>
                                        </div>
                                        <h3 className="mt-3 font-sans text-2xl font-bold tracking-tight text-blue-950 text-nowrap">
                                            {card.value}
                                        </h3>
                                        <p className={`mt-4 text-xs font-semibold px-2 py-1 rounded-md inline-block ${card.isAlert ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                                            }`}>
                                            {card.note}
                                        </p>
                                    </article>
                                );
                            })}
                        </section>

                        {/* Section Chart */}
                        <section className="p-6 bg-white border shadow-sm border-slate-100 rounded-xl">
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                                <div>
                                    <p className="text-xs font-bold tracking-wider uppercase text-amber-600">
                                        {t('chart.trend_title', 'Trend Chart')}
                                    </p>
                                    <h3 className="mt-1 text-xl font-bold tracking-tight text-blue-950">
                                        {t('chart.monthly_sales', 'Monthly Sales Chart')}
                                    </h3>
                                </div>
                                <span className="px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/50 rounded-lg">
                                    {t('dashboard.dummy_data', 'Dummy Data')}
                                </span>
                            </div>

                            <SalesTrendChart />
                        </section>

                        {/* Section Lists */}
                        <section className="grid gap-6 lg:grid-cols-2">
                            {/* Pending Orders */}
                            <article className="p-6 bg-white border shadow-sm border-slate-100 rounded-xl">
                                <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-50">
                                    <div>
                                        <p className="text-xs font-bold tracking-wider uppercase text-amber-600">
                                            {t(
                                                'dashboard.quick_notification',
                                                'Quick Notification',
                                            )}
                                        </p>
                                        <h3 className="mt-1 text-lg font-bold text-blue-950">
                                            {t(
                                                'orders.unprocessed_title',
                                                'Unprocessed Orders',
                                            )}
                                        </h3>
                                    </div>
                                    <ShoppingBag className="w-5 h-5 text-blue-950" aria-hidden="true" />
                                </div>

                                <div className="mt-2 divide-y divide-slate-100">
                                    {pendingOrders.map((order) => (
                                        <div key={order.id} className="flex items-center justify-between gap-4 px-2 py-4 transition-colors rounded-lg hover:bg-slate-50/50">
                                            <div>
                                                <p className="font-bold text-blue-950">
                                                    {order.id}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    {order.customer}
                                                </p>
                                            </div>
                                            <p className="font-sans text-sm font-bold text-amber-600">
                                                {order.total}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </article>

                            {/* Low Stock Alert */}
                            <article className="p-6 bg-white border shadow-sm border-slate-100 rounded-xl">
                                <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-50">
                                    <div>
                                        <p className="text-xs font-bold tracking-wider uppercase text-amber-600">
                                            {t(
                                                'dashboard.quick_notification',
                                                'Quick Notification',
                                            )}
                                        </p>
                                        <h3 className="mt-1 text-lg font-bold text-blue-950">
                                            {t(
                                                'products.low_stock_title',
                                                'Low Stock Alert',
                                            )}
                                        </h3>
                                    </div>
                                    <AlertTriangle className="w-5 h-5 text-amber-600" aria-hidden="true" />
                                </div>

                                <div className="mt-2 divide-y divide-slate-100">
                                    {lowStockProducts.map((product) => (
                                        <div key={product.name} className="flex items-center justify-between gap-4 px-2 py-4 transition-colors rounded-lg hover:bg-slate-50/50">
                                            <p className="text-sm font-semibold text-blue-950">
                                                {product.name}
                                            </p>
                                            <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-rose-50 text-rose-700 border border-rose-100">
                                                {t('products.stock_left', '{count} left').replace(
                                                    '{count}',
                                                    product.stock,
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </article>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
}
