import { Head, Link } from '@inertiajs/react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useLanguage } from '@/Contexts/LanguageContext';
import { Globe, Calendar, MapPin, Monitor } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

export default function Index({ logs, countryStats, timeStats }) {
    const { t } = useLanguage();

    const formatDate = (dateStr) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleString('id-ID', {
                dateStyle: 'medium',
                timeStyle: 'short',
            });
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <div className="min-h-screen bg-blue-50">
            <Head title={t('backoffice.sidebar.visitor_logs', 'Visitor Logs')} />

            <div className="flex min-h-screen">
                <Sidebar />

                <main className="flex flex-col flex-1 min-w-0">
                    <Navbar />

                    <div className="flex-1 p-6 space-y-6">
                        <section className="flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold tracking-normal text-blue-950">
                                    {t('backoffice.visitor_logs.title', 'Visitor Access Logs')}
                                </h1>
                                <p className="text-sm text-slate-500 mt-1">
                                    {t('backoffice.visitor_logs.subtitle', 'Monitor visitor geographical locations and countries of origin in real-time.')}
                                </p>
                            </div>
                        </section>

                        {/* Charts Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Time Access Chart */}
                            <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-sm space-y-4">
                                <div>
                                    <h3 className="font-bold text-blue-950 text-base">
                                        {t('backoffice.visitor_logs.charts.time_title', 'Aktivitas Kunjungan (Harian)')}
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {t('backoffice.visitor_logs.charts.time_subtitle', 'Frekuensi akses website berdasarkan tanggal')}
                                    </p>
                                </div>
                                <div className="h-64">
                                    {timeStats && timeStats.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={timeStats} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                                <XAxis 
                                                    dataKey="date" 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                                                />
                                                <YAxis 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                                    allowDecimals={false}
                                                />
                                                <Tooltip 
                                                    cursor={{ fill: '#f8fafc' }}
                                                    contentStyle={{
                                                        border: '1px solid #f1f5f9',
                                                        borderRadius: '12px',
                                                        backgroundColor: '#ffffff',
                                                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
                                                    }}
                                                />
                                                <Bar dataKey="count" name={t('backoffice.visitor_logs.charts.visits', 'Kunjungan')} fill="#1e40af" radius={[4, 4, 0, 0]} barSize={28} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-slate-400 italic text-xs">
                                            {t('backoffice.visitor_logs.charts.no_data', 'Tidak ada data untuk ditampilkan')}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Country Access Chart */}
                            <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-sm space-y-4">
                                <div>
                                    <h3 className="font-bold text-blue-950 text-base">
                                        {t('backoffice.visitor_logs.charts.country_title', 'Kunjungan per Negara')}
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {t('backoffice.visitor_logs.charts.country_subtitle', 'Negara asal pengunjung paling aktif')}
                                    </p>
                                </div>
                                <div className="h-64">
                                    {countryStats && countryStats.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart 
                                                data={countryStats} 
                                                layout="vertical"
                                                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                                <XAxis 
                                                    type="number"
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                                    allowDecimals={false}
                                                />
                                                <YAxis 
                                                    dataKey="country" 
                                                    type="category"
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
                                                    width={90}
                                                />
                                                <Tooltip 
                                                    cursor={{ fill: '#f8fafc' }}
                                                    contentStyle={{
                                                        border: '1px solid #f1f5f9',
                                                        borderRadius: '12px',
                                                        backgroundColor: '#ffffff',
                                                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
                                                    }}
                                                />
                                                <Bar dataKey="count" name={t('backoffice.visitor_logs.charts.visits', 'Kunjungan')} fill="#0284c7" radius={[0, 4, 4, 0]} barSize={16} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-slate-400 italic text-xs">
                                            {t('backoffice.visitor_logs.charts.no_data', 'Tidak ada data untuk ditampilkan')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <section className="overflow-hidden bg-white border border-blue-100 rounded-lg shadow-sm">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-blue-100">
                                <div>
                                    <h2 className="text-lg font-bold text-blue-950">
                                        {t('backoffice.visitor_logs.table.title', 'Access History')}
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        {logs.total} {t('backoffice.visitor_logs.table.total_count', 'visitors detected')}
                                    </p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-blue-100">
                                    <thead className="bg-blue-50/70">
                                        <tr className="text-xs font-bold tracking-wider text-left text-blue-800 uppercase">
                                            <th className="px-5 py-3">{t('backoffice.visitor_logs.th.ip', 'IP Address')}</th>
                                            <th className="px-5 py-3">{t('backoffice.visitor_logs.th.country', 'Country')}</th>
                                            <th className="px-5 py-3">{t('backoffice.visitor_logs.th.region', 'Region / Province')}</th>
                                            <th className="px-5 py-3">{t('backoffice.visitor_logs.th.city', 'City')}</th>
                                            <th className="px-5 py-3">{t('backoffice.visitor_logs.th.time', 'Accessed At')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm divide-y divide-blue-50 text-slate-700">
                                        {logs.data.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className="px-5 py-12 text-center text-slate-400 italic"
                                                >
                                                    {t('backoffice.visitor_logs.empty', 'No visitor logs recorded yet.')}
                                                </td>
                                            </tr>
                                        ) : (
                                            logs.data.map((log) => (
                                                <tr key={log.id} className="hover:bg-slate-50/50 transition">
                                                    <td className="px-5 py-4 font-mono font-medium text-slate-600">
                                                        <div className="flex items-center gap-2">
                                                            <Monitor className="w-4 h-4 text-slate-400" />
                                                            {log.ip_address}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-2">
                                                            {log.country_code ? (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800 uppercase border border-blue-200">
                                                                    {log.country_code}
                                                                </span>
                                                            ) : (
                                                                <Globe className="w-4 h-4 text-slate-400" />
                                                            )}
                                                            <span className="font-semibold text-blue-950">
                                                                {log.country}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-2 text-slate-600">
                                                            <MapPin className="w-4 h-4 text-slate-400" />
                                                            {log.region || '-'}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 text-slate-600">
                                                        {log.city || '-'}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-2 text-slate-500 text-xs">
                                                            <Calendar className="w-4 h-4 text-slate-400" />
                                                            {formatDate(log.created_at)}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {logs.links && logs.links.length > 3 && (
                                <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 border-t border-blue-100 bg-slate-50/50">
                                    <div className="text-xs font-semibold text-slate-500">
                                        {t('backoffice.pagination.showing', 'Showing')} {logs.from} {t('backoffice.pagination.to', 'to')} {logs.to} {t('backoffice.pagination.of', 'of')} {logs.total} {t('backoffice.pagination.entries', 'entries')}
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {logs.links.map((link, idx) => {
                                            const isPrev = link.label.includes('Previous') || link.label.includes('&laquo;');
                                            const isNext = link.label.includes('Next') || link.label.includes('&raquo;');
                                            
                                            let displayLabel = link.label;
                                            if (isPrev) displayLabel = t('backoffice.pagination.previous', 'Sebelumnya');
                                            else if (isNext) displayLabel = t('backoffice.pagination.next', 'Berikutnya');

                                            return (
                                                <Link
                                                    key={idx}
                                                    href={link.url || '#'}
                                                    as={link.url ? 'a' : 'span'}
                                                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                                                        link.active
                                                            ? 'bg-blue-950 text-white'
                                                            : link.url
                                                            ? 'bg-blue-50 text-blue-950 hover:bg-blue-100'
                                                            : 'bg-transparent text-slate-300 cursor-not-allowed pointer-events-none'
                                                    }`}
                                                >
                                                    <span dangerouslySetInnerHTML={{ __html: displayLabel }} />
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
}
