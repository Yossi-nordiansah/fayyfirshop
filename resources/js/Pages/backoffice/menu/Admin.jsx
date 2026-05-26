import { Head, Link, router } from '@inertiajs/react';
import { Edit3, Plus, Trash2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useLanguage } from '@/Contexts/LanguageContext'; // Mengimpor custom hook

export default function Admin({ admins, status }) {
    const { t } = useLanguage();

    const removeAdmin = (admin) => {
        // Integrasi konfirmasi multi-bahasa
        if (!window.confirm(`${t('admin.management.confirm.delete', 'Delete admin')} "${admin.name}"?`)) {
            return;
        }

        router.delete(route('backoffice.admin.destroy', admin.id), {
            preserveScroll: true,
        });
    };

    const getAvatarUrl = (avatar) => {
        if (!avatar) return '/images/default-profile.png';
        if (avatar.startsWith('http') || avatar.startsWith('/')) return avatar;
        return `/storage/${avatar}`;
    };

    return (
        <div className="min-h-screen bg-blue-50">
            <Head title={t('admin.management.title', 'Admin Management')} />

            <div className="flex min-h-screen">
                <Sidebar />

                <main className="flex flex-col flex-1 min-w-0">
                    <Navbar />

                    <div className="flex-1 p-6 space-y-6">
                        <section className="flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold tracking-normal text-blue-950">
                                    {t('admin.management.title', 'Admin Management')}
                                </h1>
                            </div>
                            <Link
                                href={route('backoffice.admin.create')}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800"
                            >
                                <Plus className="w-4 h-4" />
                                {t('admin.management.button.add', 'Add Admin')}
                            </Link>
                        </section>

                        {status && (
                            <section className="px-4 py-3 text-sm font-medium border rounded-lg border-emerald-200 bg-emerald-50 text-emerald-700">
                                {status}
                            </section>
                        )}

                        <section className="overflow-hidden bg-white border border-blue-100 rounded-lg shadow-sm">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-blue-100">
                                <div>
                                    <h2 className="text-lg font-bold text-blue-950">
                                        {t('admin.management.list.title', 'Admin List')}
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        {admins.length} {t('admin.management.list.count', 'data available')}
                                    </p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-blue-100">
                                    <thead className="bg-blue-50/70">
                                        <tr className="text-xs font-bold tracking-wider text-left text-blue-800 uppercase">
                                            <th className="px-5 py-3">{t('admin.management.table.th.admin', 'Admin')}</th>
                                            <th className="px-5 py-3">{t('admin.management.table.th.email', 'Email')}</th>
                                            <th className="px-5 py-3">{t('admin.management.table.th.phone', 'Phone')}</th>
                                            <th className="px-5 py-3">{t('admin.management.table.th.country', 'Country')}</th>
                                            <th className="px-5 py-3">{t('admin.management.table.th.branch', 'Branch Store')}</th>
                                            <th className="px-5 py-3 text-right">{t('admin.management.table.th.action', 'Action')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm divide-y divide-blue-50 text-slate-700">
                                        {admins.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={6}
                                                    className="px-5 py-12 text-center text-slate-500"
                                                >
                                                    {t('admin.management.list.empty', 'No admin data yet.')}
                                                </td>
                                            </tr>
                                        ) : (
                                            admins.map((admin) => (
                                                <tr key={admin.id} className="align-top">
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <img
                                                                src={getAvatarUrl(admin.avatar)}
                                                                alt={admin.name}
                                                                className="object-cover border border-blue-100 rounded-full h-11 w-11"
                                                            />
                                                            <div>
                                                                <p className="font-semibold text-blue-950">
                                                                    {admin.name}
                                                                </p>
                                                                <p className="mt-1 text-xs text-slate-500">
                                                                    {admin.address}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">{admin.email}</td>
                                                    <td className="px-5 py-4">{admin.phone}</td>
                                                    <td className="px-5 py-4 font-semibold text-blue-900">
                                                        {admin.country}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        {admin.assigned_branch?.name ?? '-'}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex justify-end gap-2">
                                                            <Link
                                                                href={route('backoffice.admin.edit', admin.id)}
                                                                className="inline-flex items-center justify-center text-blue-700 transition border border-blue-100 rounded-lg h-9 w-9 hover:bg-blue-50"
                                                                aria-label={`${t('admin.management.action.aria.edit', 'Edit')} ${admin.name}`}
                                                            >
                                                                <Edit3 className="w-4 h-4" />
                                                            </Link>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeAdmin(admin)}
                                                                className="inline-flex items-center justify-center transition border rounded-lg h-9 w-9 border-rose-100 text-rose-600 hover:bg-rose-50"
                                                                aria-label={`${t('admin.management.action.aria.delete', 'Delete')} ${admin.name}`}
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
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
}