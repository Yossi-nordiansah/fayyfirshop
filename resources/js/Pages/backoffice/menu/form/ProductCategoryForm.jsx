import { Head, Link, useForm, router } from '@inertiajs/react';
import { ArrowLeft, FolderTree, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/Contexts/LanguageContext';

import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import ConfirmModal from '../../components/ConfirmModal';
import SuccessModal from '../../components/SuccessModal';

export default function ProductCategoryForm({
    category = null,
    categoryNameTranslations: initialCategoryNameTranslations = null,
    subCategories: initialSubCategories = [],
    status,
    statusAction,
}) {
    const isEditing = Boolean(category);
    const { t } = useLanguage();

    const [pendingDeleteIndex, setPendingDeleteIndex] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(
        (statusAction === 'created' || statusAction === 'updated') && Boolean(status),
    );

    useEffect(() => {
        setShowSuccessModal(
            (statusAction === 'created' || statusAction === 'updated') && Boolean(status),
        );
    }, [status, statusAction]);

    const form = useForm({
        name_translations: initialCategoryNameTranslations ?? {
            indonesia: category?.name ?? '',
            arabic: '',
            english: '',
        },
        sub_categories:
            initialSubCategories.length > 0
                ? initialSubCategories
                : [],
    });

    const addSubCategory = () => {
        form.setData('sub_categories', [
            ...form.data.sub_categories,
            { indonesia: '', arabic: '', english: '' },
        ]);
    };

    const updateSubCategory = (index, langKey, value) => {
        const updated = [...form.data.sub_categories];
        updated[index] = {
            ...(updated[index] ?? { indonesia: '', arabic: '', english: '' }),
            [langKey]: value,
        };
        form.setData('sub_categories', updated);
    };

    const removeSubCategory = (index) => {
        setPendingDeleteIndex(index);
    };

    const confirmRemoveSubCategory = () => {
        if (pendingDeleteIndex === null) return;
        const updated = form.data.sub_categories.filter((_, i) => i !== pendingDeleteIndex);
        form.setData('sub_categories', updated);
        setPendingDeleteIndex(null);
    };

    const submit = (event) => {
        event.preventDefault();

        const payload = {
            name_translations: {
                indonesia: (form.data.name_translations?.indonesia ?? '').trim(),
                english: (form.data.name_translations?.english ?? '').trim(),
                arabic: (form.data.name_translations?.arabic ?? '').trim(),
            },
            sub_categories: (form.data.sub_categories ?? []).map((row) => ({
                indonesia: (row?.indonesia ?? '').trim(),
                english: (row?.english ?? '').trim(),
                arabic: (row?.arabic ?? '').trim(),
            })),
        };

        if (isEditing) {
            form.transform(() => payload);
            form.patch(route('backoffice.product-categories.update', category.slug), {
                preserveScroll: true,
            });

            return;
        }

        form.transform(() => payload);
        form.post(route('backoffice.product-categories.store'), {
            preserveScroll: true,
        });
    };

    return (
        <div className="min-h-screen bg-blue-50">
            <Head title={t(isEditing ? 'backoffice.category.title_edit' : 'backoffice.category.title_create', isEditing ? 'Edit Category' : 'Create Category')} />

            <ConfirmModal
                show={pendingDeleteIndex !== null}
                title={t('backoffice.category.delete_sub.title', 'Delete Sub Category')}
                message={`${t('backoffice.category.delete_sub.confirm', 'Delete sub category')} #${pendingDeleteIndex !== null ? pendingDeleteIndex + 1 : ''}?`}
                confirmLabel={t('admin.management.action.aria.delete', 'Delete')}
                cancelLabel={t('auth.password.btn_cancel', 'Cancel')}
                onConfirm={confirmRemoveSubCategory}
                onCancel={() => setPendingDeleteIndex(null)}
            />

            <SuccessModal
                show={showSuccessModal}
                title={statusAction === 'updated' ? t('backoffice.category.success.updated', 'Updated successfully') : t('backoffice.category.success.created', 'Created successfully')}
                message={status ?? ''}
                btnLabel={t('backoffice.store_branches.success_btn', 'OK')}
                onClose={() => {
                    setShowSuccessModal(false);
                    router.visit(route('backoffice.product-categories.index'));
                }}
            />

            <div className="flex min-h-screen">
                <Sidebar />

                <main className="flex flex-col flex-1 min-w-0">
                    <Navbar />

                    <div className="flex-1 p-6 space-y-6">
                        <section className="flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold tracking-normal text-blue-950">
                                    {t(isEditing ? 'backoffice.category.title_edit' : 'backoffice.category.title_create', isEditing ? 'Edit Category' : 'Create Category')}
                                </h1>
                                <p className="mt-1 text-sm text-slate-500">
                                    {t('backoffice.category.subtitle', 'Fill in category name and optional sub categories.')}
                                </p>
                            </div>

                            <Link
                                href={route('backoffice.product-categories.index')}
                                className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-900 transition hover:bg-blue-50"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                {t('backoffice.category.back_to_list', 'Back to List')}
                            </Link>
                        </section>

                        {status && (
                            <section className="px-4 py-3 text-sm font-medium border rounded-lg border-emerald-200 bg-emerald-50 text-emerald-700">
                                {status}
                            </section>
                        )}

                        <section className="w-full max-w-4xl p-5 mx-auto bg-white border border-blue-100 rounded-lg shadow-sm">
                            <div className="flex items-start justify-between gap-3 pb-4 border-b border-blue-100">
                                <div>
                                    <h2 className="text-lg font-bold text-blue-950">
                                        {t(isEditing ? 'backoffice.category.form_title_edit' : 'backoffice.category.form_title_create', isEditing ? 'Category Form' : 'New Category Form')}
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {t('backoffice.category.form_subtitle', 'Add one or more sub categories using the button below.')}
                                    </p>
                                </div>
                                <div className="inline-flex items-center justify-center text-blue-700 bg-blue-100 rounded-lg h-9 w-9">
                                    <FolderTree className="w-4 h-4" />
                                </div>
                            </div>

                            <form className="mt-5 space-y-5" onSubmit={submit}>
                                <div>
                                    <label className="block mb-3 text-sm font-semibold text-blue-950">
                                        {t('backoffice.category.fields.name', 'Category Name / Nama Kategori')} <span className="text-rose-500">*</span>
                                    </label>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-xl border border-blue-50">
                                        {/* Indonesia */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-700">Indonesia <span className="text-rose-500">*</span></span>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">IND</span>
                                            </div>
                                            <input
                                                type="text"
                                                value={form.data.name_translations?.indonesia ?? ''}
                                                onChange={(event) =>
                                                    form.setData('name_translations', {
                                                        ...form.data.name_translations,
                                                        indonesia: event.target.value,
                                                    })
                                                }
                                                placeholder="Contoh: Makanan"
                                                className="w-full rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                                            />
                                            {form.errors['name_translations.indonesia'] && (
                                                <p className="text-xs font-semibold text-rose-600">
                                                    {form.errors['name_translations.indonesia']}
                                                </p>
                                            )}
                                        </div>

                                        {/* Arab */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-700">Arab (العربية)</span>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">ARA</span>
                                            </div>
                                            <input
                                                type="text"
                                                dir="rtl"
                                                value={form.data.name_translations?.arabic ?? ''}
                                                onChange={(event) =>
                                                    form.setData('name_translations', {
                                                        ...form.data.name_translations,
                                                        arabic: event.target.value,
                                                    })
                                                }
                                                placeholder="مثال: طعام"
                                                className="w-full rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                                            />
                                            {form.errors['name_translations.arabic'] && (
                                                <p className="text-xs font-semibold text-rose-600">
                                                    {form.errors['name_translations.arabic']}
                                                </p>
                                            )}
                                        </div>

                                        {/* English */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-700">English</span>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">ENG</span>
                                            </div>
                                            <input
                                                type="text"
                                                value={form.data.name_translations?.english ?? ''}
                                                onChange={(event) =>
                                                    form.setData('name_translations', {
                                                        ...form.data.name_translations,
                                                        english: event.target.value,
                                                    })
                                                }
                                                placeholder="Example: Food"
                                                className="w-full rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                                            />
                                            {form.errors['name_translations.english'] && (
                                                <p className="text-xs font-semibold text-rose-600">
                                                    {form.errors['name_translations.english']}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                                        <label className="text-sm font-semibold text-blue-950">
                                            {t('backoffice.category.fields.sub_categories', 'Sub Categories / Sub Kategori')}
                                        </label>
                                        <button
                                            type="button"
                                            onClick={addSubCategory}
                                            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold text-blue-900 transition bg-white border border-blue-200 rounded-lg hover:bg-blue-50 active:scale-95 shadow-sm"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            {t('backoffice.category.buttons.add_sub', 'Add Sub Category')}
                                        </button>
                                    </div>

                                    {form.data.sub_categories.length === 0 ? (
                                        <div className="text-center p-6 bg-slate-50/50 border border-dashed border-blue-100 rounded-xl">
                                            <p className="text-sm text-slate-500">
                                                {t('backoffice.category.empty_subs', 'No sub categories yet. Click Add Sub Category to get started.')}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {form.data.sub_categories.map((subCategory, index) => (
                                                <div 
                                                    key={index} 
                                                    className="flex items-start gap-4 p-4 rounded-xl border border-blue-50 bg-slate-50/30 transition hover:bg-slate-50/50 hover:border-blue-100 shadow-sm"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-extrabold text-blue-900 shrink-0 mt-6 border border-blue-200">
                                                        #{index + 1}
                                                    </div>

                                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        {/* Sub category Indonesia */}
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Indonesia</span>
                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-50 text-blue-600 border border-blue-100">IND</span>
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={subCategory?.indonesia ?? ''}
                                                                onChange={(event) =>
                                                                    updateSubCategory(
                                                                        index,
                                                                        'indonesia',
                                                                        event.target.value,
                                                                    )
                                                                }
                                                                placeholder="Nama Sub Kategori"
                                                                className="w-full rounded-lg border border-blue-100 bg-white px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                                                            />
                                                            {form.errors[`sub_categories.${index}.indonesia`] && (
                                                                <p className="text-[10px] font-semibold text-rose-600">
                                                                    {form.errors[`sub_categories.${index}.indonesia`]}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Sub category Arab */}
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Arab</span>
                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-50 text-amber-600 border border-amber-100">ARA</span>
                                                            </div>
                                                            <input
                                                                type="text"
                                                                dir="rtl"
                                                                value={subCategory?.arabic ?? ''}
                                                                onChange={(event) =>
                                                                    updateSubCategory(
                                                                        index,
                                                                        'arabic',
                                                                        event.target.value,
                                                                    )
                                                                }
                                                                placeholder="اسم الفئة الفرعية"
                                                                className="w-full rounded-lg border border-blue-100 bg-white px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                                                            />
                                                            {form.errors[`sub_categories.${index}.arabic`] && (
                                                                <p className="text-[10px] font-semibold text-rose-600">
                                                                    {form.errors[`sub_categories.${index}.arabic`]}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Sub category English */}
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">English</span>
                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">ENG</span>
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={subCategory?.english ?? ''}
                                                                onChange={(event) =>
                                                                    updateSubCategory(
                                                                        index,
                                                                        'english',
                                                                        event.target.value,
                                                                    )
                                                                }
                                                                placeholder="Sub Category Name"
                                                                className="w-full rounded-lg border border-blue-100 bg-white px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                                                            />
                                                            {form.errors[`sub_categories.${index}.english`] && (
                                                                <p className="text-[10px] font-semibold text-rose-600">
                                                                    {form.errors[`sub_categories.${index}.english`]}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => removeSubCategory(index)}
                                                        className="inline-flex items-center justify-center w-10 h-10 transition border rounded-lg shrink-0 border-rose-100 text-rose-600 hover:bg-rose-50 hover:text-rose-700 mt-5 active:scale-95 shadow-sm bg-white"
                                                        aria-label="Remove sub category"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {form.errors.sub_categories && (
                                        <p className="mt-2 text-xs font-semibold text-rose-600">
                                            {form.errors.sub_categories}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={form.processing}
                                        className="rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {t(isEditing ? 'backoffice.category.buttons.submit_edit' : 'backoffice.category.buttons.submit_create', isEditing ? 'Update Category' : 'Create Category')}
                                    </button>

                                    <Link
                                        href={route('backoffice.product-categories.index')}
                                        className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                    >
                                        {t('backoffice.category.buttons.cancel', 'Cancel')}
                                    </Link>
                                </div>
                            </form>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
}
