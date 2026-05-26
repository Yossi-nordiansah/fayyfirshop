import { Head, Link, router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Edit3, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/Contexts/LanguageContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function StoreBranches({ storeBranches, status, statusAction }) {
    const { t, locale } = useLanguage();

    const [showCreatedModal, setShowCreatedModal] = useState(
        statusAction === 'created' && Boolean(status),
    );

    useEffect(() => {
        setShowCreatedModal(statusAction === 'created' && Boolean(status));
    }, [status, statusAction]);

    const removeBranch = (branch) => {
        const confirmMessage = `${t('backoffice.store_branches.confirm_delete', 'Delete store branch')} "${branch.name}"?`;
        if (!window.confirm(confirmMessage)) {
            return;
        }

        router.delete(route('backoffice.store-branches.destroy', branch.id), {
            preserveScroll: true,
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800">
            <Head title={t('backoffice.store_branches.title', 'Store Branches')} />

            {/* PREMIUM ANIMATED MODAL SUKSES (FRAMER MOTION) */}
            <AnimatePresence>
                {showCreatedModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-blue-950/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            className="w-full max-w-md p-6 bg-white border shadow-2xl rounded-xl border-blue-50"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="inline-flex items-center justify-center w-12 h-12 border rounded-full shrink-0 bg-emerald-50 text-emerald-600 border-emerald-100">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-blue-950">
                                            {t('backoffice.store_branches.success_title', 'Data successfully created')}
                                        </h2>
                                        <p className="mt-1 text-sm text-slate-600">
                                            {status}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setShowCreatedModal(false)}
                                    className="inline-flex items-center justify-center w-8 h-8 transition rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowCreatedModal(false)}
                                    className="rounded-lg bg-blue-950 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-blue-900 border border-amber-500/20 shadow-md active:scale-[0.98]"
                                >
                                    {t('backoffice.store_branches.success_btn', 'Okay')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="flex min-h-screen">
                <Sidebar />

                <main className="flex flex-col flex-1 min-w-0 bg-gradient-to-b from-blue-50/50 to-white">
                    <Navbar />

                    <div className="flex-1 w-full p-6 mx-auto space-y-6 max-w-7xl">
                        {/* HEADER SECTION DENGAN SENTUHAN WARNA BLUE-GOLD */}
                        <section className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-blue-100/60">
                            <div>
                                <h1 className="text-3xl font-extrabold tracking-tight text-blue-950">
                                    {t('backoffice.store_branches.title', 'Store Branches')}
                                </h1>
                            </div>

                            <Link
                                href={route('backoffice.store-branches.create')}
                                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-950 to-blue-900 px-5 py-2.5 text-sm font-bold text-white transition hover:from-blue-900 hover:to-blue-800 shadow-lg shadow-blue-950/10 border border-amber-400/30 hover:border-amber-400/60 active:scale-[0.98]"
                            >
                                <Plus className="w-4 h-4 text-amber-400" />
                                {t('backoffice.store_branches.add_branch', 'Add Store Branch')}
                            </Link>
                        </section>

                        {/* STATUS MESSAGE (MISAL: DELETE SUCCESS) */}
                        {status && statusAction !== 'created' && (
                            <motion.section
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 px-4 py-3 text-sm font-medium border rounded-lg border-emerald-200 bg-emerald-50 text-emerald-700"
                            >
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                                {status}
                            </motion.section>
                        )}

                        {/* TABLE CONTAINER CARD */}
                        <section className="overflow-hidden bg-white border border-blue-100/70 rounded-xl shadow-xl shadow-blue-950/[0.02]">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-blue-50 bg-slate-50/60">
                                <div>
                                    <h2 className="text-base font-bold text-blue-950">
                                        {t('backoffice.store_branches.branch_list', 'Branch List')}
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {storeBranches.length} {t('backoffice.store_branches.data_available', 'data available')}
                                    </p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-blue-50">
                                    <thead className="bg-blue-50/40">
                                        <tr className="text-left text-xs font-bold tracking-wider text-blue-900 uppercase">
                                            <th className="px-6 py-4">{t('backoffice.store_branches.table.branch', 'Branch')}</th>
                                            <th className="px-6 py-4">{t('backoffice.store_branches.table.code', 'Code')}</th>
                                            <th className="px-6 py-4">{t('backoffice.store_branches.table.country', 'Country')}</th>
                                            <th className="px-6 py-4">{t('backoffice.store_branches.table.currency', 'Currency')}</th>
                                            <th className="px-6 py-4">{t('backoffice.store_branches.table.status', 'Status')}</th>
                                            <th className="px-6 py-4 text-right">{t('backoffice.store_branches.table.action', 'Action')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm divide-y divide-blue-50/60 text-slate-700">
                                        {storeBranches.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={6}
                                                    className="px-6 py-16 font-medium text-center text-slate-400 bg-slate-50/20"
                                                >
                                                    {t('backoffice.store_branches.no_data', 'No store branches yet.')}
                                                </td>
                                            </tr>
                                        ) : (
                                            storeBranches.map((branch) => (
                                                <tr key={branch.id} className="align-top transition-colors hover:bg-blue-50/10">
                                                    <td className="px-6 py-4">
                                                        <p className="font-semibold text-blue-950">
                                                            {branch.name}
                                                        </p>
                                                        <p className="mt-1 font-mono text-xs text-slate-400">
                                                            {t('backoffice.store_branches.postal_code', 'Postal Code')}: {branch.postal_code}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-4 font-mono font-semibold text-blue-900/80">
                                                        {branch.code}
                                                    </td>
                                                    <td className="px-6 py-4 font-medium text-slate-600">
                                                        {branch.country_name}
                                                    </td>
                                                    <td className="px-6 py-4 font-medium text-slate-600">
                                                        {branch.currency_code} ({branch.currency_symbol})
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span
                                                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold border ${branch.is_active
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                : 'bg-rose-50 text-rose-700 border-rose-200'
                                                                }`}
                                                        >
                                                            {branch.is_active
                                                                ? t('backoffice.store_branches.status.active', 'Active')
                                                                : t('backoffice.store_branches.status.inactive', 'Inactive')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex justify-end gap-2.5">
                                                            <Link
                                                                href={route('backoffice.store-branches.edit', branch.id)}
                                                                className="inline-flex items-center justify-center text-blue-800 transition bg-white border border-blue-100 rounded-lg shadow-sm h-9 w-9 hover:bg-blue-50 hover:border-blue-200"
                                                                aria-label={`Edit ${branch.name}`}
                                                            >
                                                                <Edit3 className="w-4 h-4 text-blue-950" />
                                                            </Link>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeBranch(branch)}
                                                                className="inline-flex items-center justify-center transition bg-white border rounded-lg shadow-sm h-9 w-9 border-rose-100 text-rose-600 hover:bg-rose-50 hover:border-rose-200"
                                                                aria-label={`Delete ${branch.name}`}
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
