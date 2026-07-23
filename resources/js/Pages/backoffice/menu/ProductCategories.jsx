import { Head, Link, router } from '@inertiajs/react';
import { Edit3, Eye, Plus, Trash2, Power } from 'lucide-react';
import { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ConfirmModal from '../components/ConfirmModal';
import { useLanguage } from '@/Contexts/LanguageContext';

export default function ProductCategories({ categories, status, statusAction }) {
    const { locale, t } = useLanguage();

    const getLocalizedName = (item) => {
        const translations = item?.name_translations;
        if (translations && typeof translations === 'object') {
            const value = translations?.[locale];
            if (typeof value === 'string' && value.trim() !== '') {
                return value;
            }
        }
        return item?.name ?? '-';
    };

    const getSubCategoriesLabel = (category) => {
        const list = category?.sub_categories ?? category?.subCategories ?? [];
        if (!Array.isArray(list) || list.length === 0) {
            return '-';
        }

        const names = list
            .map((sub) => getLocalizedName(sub))
            .map((value) => (typeof value === 'string' ? value.trim() : ''))
            .filter((value) => value !== '' && value !== '-');

        return names.length > 0 ? names.join(', ') : '-';
    };

    const [pendingDelete, setPendingDelete] = useState(null);

    const removeCategory = (category) => {
        setPendingDelete(category);
    };

    const confirmRemoveCategory = () => {
        if (!pendingDelete) return;
        router.delete(route('backoffice.product-categories.destroy', pendingDelete.slug), {
            preserveScroll: true,
        });
        setPendingDelete(null);
    };

    const toggleActive = (category) => {
        router.patch(route('backoffice.product-categories.toggle-active', category.slug), {}, {
            preserveScroll: true,
        });
    };

    return (
        <div className="min-h-screen bg-blue-50">
            <Head title={t('backoffice.category.title', 'Kategori Produk')} />

            <ConfirmModal
                show={Boolean(pendingDelete)}
                title={t('backoffice.category.delete.title', 'Hapus Kategori')}
                message={t('backoffice.category.delete.confirm', 'Hapus kategori "{name}"? Tindakan ini tidak dapat dibatalkan.').replace('{name}', getLocalizedName(pendingDelete))}
                confirmLabel={t('backoffice.category.delete.btn_confirm', 'Hapus')}
                cancelLabel={t('backoffice.category.buttons.cancel', 'Batal')}
                onConfirm={confirmRemoveCategory}
                onCancel={() => setPendingDelete(null)}
            />

            <div className="flex min-h-screen">
                <Sidebar />

                <main className="flex min-w-0 flex-1 flex-col">
                    <Navbar />

                    <div className="flex-1 space-y-6 p-6">
                        <section className="flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold tracking-normal text-blue-950">
                                    {t('backoffice.category.title', 'Kategori Produk')}
                                </h1>
                                <p className="mt-1 text-sm text-slate-500">
                                    {t('backoffice.category.desc', 'Kelola kategori produk dan sub kategori.')}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <Link
                                    href={route('backoffice.product-management')}
                                    className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-900 transition hover:bg-blue-50"
                                >
                                    {t('backoffice.category.back_to_product_management', 'Kembali ke Manajemen Produk')}
                                </Link>
                                <Link
                                    href={route('backoffice.product-categories.create')}
                                    className="inline-flex items-center gap-2 rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800"
                                >
                                    <Plus className="h-4 w-4" />
                                    {t('backoffice.category.add_category', 'Tambah Kategori')}
                                </Link>
                            </div>
                        </section>

                        {status && (
                            <section className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                                {status}
                            </section>
                        )}

                        <section className="overflow-hidden rounded-lg border border-blue-100 bg-white shadow-sm">
                            <div className="flex items-center justify-between border-b border-blue-100 px-5 py-4">
                                <div>
                                    <h2 className="text-lg font-bold text-blue-950">
                                        {t('backoffice.category.list_title', 'Daftar Kategori')}
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        {t('backoffice.category.data_available', '{count} data tersedia').replace('{count}', categories.length)}
                                    </p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-blue-100">
                                    <thead className="bg-blue-50/70">
                                        <tr className="text-left text-xs font-bold uppercase tracking-wider text-blue-800">
                                            <th className="px-5 py-3">
                                                {t('backoffice.category.table.category', 'Kategori')}
                                            </th>
                                            <th className="px-5 py-3">
                                                {t('backoffice.category.table.sub_categories', 'Sub Kategori')}
                                            </th>
                                            <th className="px-5 py-3 text-right">
                                                {t('backoffice.category.table.action', 'Aksi')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-blue-50 text-sm text-slate-700">
                                        {categories.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={3}
                                                    className="px-5 py-12 text-center text-slate-500"
                                                >
                                                    {t('backoffice.category.empty_data', 'Belum ada data kategori.')}
                                                </td>
                                            </tr>
                                        ) : (
                                            categories.map((category) => (
                                                <tr key={category.id} className="align-top">
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <p className="font-semibold text-blue-950" dir={locale === 'arabic' ? 'rtl' : 'ltr'}>
                                                                {getLocalizedName(category)}
                                                            </p>
                                                            {category.is_active ? (
                                                                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                                                                    {t('backoffice.category.active', 'Aktif')}
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 ring-1 ring-inset ring-rose-600/20">
                                                                    {t('backoffice.category.inactive', 'Nonaktif')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="space-y-2">
                                                            <p className="text-xs text-slate-600" dir={locale === 'arabic' ? 'rtl' : 'ltr'}>
                                                                {getSubCategoriesLabel(category)}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex justify-end gap-2">
                                                            <Link
                                                                href={route(
                                                                    'backoffice.product-categories.show',
                                                                    category.slug,
                                                                )}
                                                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-100 text-blue-700 transition hover:bg-blue-50"
                                                                aria-label={`View ${getLocalizedName(category)}`}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Link>
                                                            <Link
                                                                href={route(
                                                                    'backoffice.product-categories.edit',
                                                                    category.slug,
                                                                )}
                                                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-100 text-blue-700 transition hover:bg-blue-50"
                                                                aria-label={`Edit ${getLocalizedName(category)}`}
                                                            >
                                                                <Edit3 className="h-4 w-4" />
                                                            </Link>
                                                            {/* Action Toggle Active Button */}
                                                             <button
                                                                 type="button"
                                                                 onClick={() => toggleActive(category)}
                                                                 className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border shadow-sm transition active:scale-90 ${
                                                                     category.is_active
                                                                         ? 'border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white hover:border-emerald-600'
                                                                         : 'border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600'
                                                                 }`}
                                                                 title={
                                                                     category.is_active
                                                                         ? t('backoffice.category.tooltip_deactivate', 'Deactivate Category')
                                                                         : t('backoffice.category.tooltip_activate', 'Activate Category')
                                                                 }
                                                             >
                                                                 <Power className="h-4 w-4" />
                                                             </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeCategory(category)}
                                                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-100 text-rose-600 transition hover:bg-rose-50"
                                                                aria-label={`Delete ${getLocalizedName(category)}`}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
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
