import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, FolderTree, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

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

    const languageTabs = useMemo(
        () => [
            { id: 'indonesia', label: 'Indonesia' },
            { id: 'arabic', label: 'Arab' },
            { id: 'english', label: 'English' },
        ],
        [],
    );

    const [activeLang, setActiveLang] = useState('indonesia');
    const [pendingDeleteIndex, setPendingDeleteIndex] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(
        (statusAction === 'created' || statusAction === 'updated') && Boolean(status),
    );

    useEffect(() => {
        setShowSuccessModal(
            (statusAction === 'created' || statusAction === 'updated') && Boolean(status),
        );
    }, [status, statusAction]);

    const isEmpty = (value) => typeof value !== 'string' || value.trim() === '';

    const isLangMissing = (langKey) => {
        if (isEmpty(form.data.name_translations?.[langKey] ?? '')) {
            return true;
        }

        const subs = Array.isArray(form.data.sub_categories) ? form.data.sub_categories : [];
        if (subs.length === 0) {
            return false;
        }

        return subs.some((row) => isEmpty(row?.[langKey] ?? ''));
    };

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
            <Head title={isEditing ? 'Edit Category' : 'Create Category'} />

            <ConfirmModal
                show={pendingDeleteIndex !== null}
                title="Delete Sub Category"
                message={`Delete sub category #${pendingDeleteIndex !== null ? pendingDeleteIndex + 1 : ''}?`}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onConfirm={confirmRemoveSubCategory}
                onCancel={() => setPendingDeleteIndex(null)}
            />

            <SuccessModal
                show={showSuccessModal}
                title={statusAction === 'updated' ? 'Updated successfully' : 'Created successfully'}
                message={status ?? ''}
                btnLabel="OK"
                onClose={() => setShowSuccessModal(false)}
            />

            <div className="flex min-h-screen">
                <Sidebar />

                <main className="flex min-w-0 flex-1 flex-col">
                    <Navbar />

                    <div className="flex-1 space-y-6 p-6">
                        <section className="flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold tracking-normal text-blue-950">
                                    {isEditing ? 'Edit Category' : 'Create Category'}
                                </h1>
                                <p className="mt-1 text-sm text-slate-500">
                                    Fill in category name and optional sub categories.
                                </p>
                            </div>

                            <Link
                                href={route('backoffice.product-categories.index')}
                                className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-900 transition hover:bg-blue-50"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to List
                            </Link>
                        </section>

                        {status && (
                            <section className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                                {status}
                            </section>
                        )}

                        <section className="mx-auto w-full max-w-4xl rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-3 border-b border-blue-100 pb-4">
                                <div>
                                    <h2 className="text-lg font-bold text-blue-950">
                                        {isEditing ? 'Category Form' : 'New Category Form'}
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Add one or more sub categories using the button below.
                                    </p>
                                </div>
                                <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                                    <FolderTree className="h-4 w-4" />
                                </div>
                            </div>

                            <form className="mt-5 space-y-5" onSubmit={submit}>
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-blue-950">
                                        Category Name <span className="text-rose-500">*</span>
                                    </label>

                                    {/* Language tab controls ALL inputs below */}
                                    <div className="mb-3 inline-flex flex-wrap gap-2 rounded-lg border border-blue-100 bg-blue-50/40 p-1">
                                        {languageTabs.map((tab) => (
                                            <button
                                                key={tab.id}
                                                type="button"
                                                onClick={() => setActiveLang(tab.id)}
                                                className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${activeLang === tab.id
                                                        ? 'bg-blue-950 text-white'
                                                        : 'text-blue-900 hover:bg-white'
                                                    }`}
                                            >
                                                <span className="relative inline-flex items-center">
                                                    {tab.label}
                                                    {isLangMissing(tab.id) && (
                                                        <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-rose-500" />
                                                    )}
                                                </span>
                                            </button>
                                        ))}
                                    </div>

                                    <p className="mb-2 text-xs font-medium text-slate-500">
                                        Urutan pengisian bahasa: <span className="font-semibold">Indonesia</span> →{' '}
                                        <span className="font-semibold">Arab</span> →{' '}
                                        <span className="font-semibold">English</span>
                                    </p>

                                    <input
                                        type="text"
                                        value={form.data.name_translations?.[activeLang] ?? ''}
                                        onChange={(event) =>
                                            form.setData('name_translations', {
                                                ...form.data.name_translations,
                                                [activeLang]: event.target.value,
                                            })
                                        }
                                        className="w-full rounded-lg border border-blue-100 bg-blue-50/40 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
                                    />
                                    {isEditing &&
                                        isEmpty(form.data.name_translations?.[activeLang] ?? '') && (
                                            <p className="mt-2 text-xs font-medium text-slate-500">
                                                belum di set
                                            </p>
                                        )}
                                    {form.errors['name_translations.indonesia'] && (
                                        <p className="mt-2 text-xs font-medium text-rose-600">
                                            {form.errors['name_translations.indonesia']}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                                        <label className="text-sm font-semibold text-blue-950">
                                            Sub Categories
                                        </label>
                                        <button
                                            type="button"
                                            onClick={addSubCategory}
                                            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-blue-900 transition hover:bg-blue-50"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            Add Sub Category
                                        </button>
                                    </div>

                                    {form.data.sub_categories.length === 0 ? (
                                        <p className="text-sm text-slate-500">
                                            No sub categories yet. Click <span className="font-semibold">Add Sub Category</span> to add.
                                        </p>
                                    ) : (
                                        <div className="space-y-3">
                                            {form.data.sub_categories.map((subCategory, index) => (
                                                <div key={index} className="flex items-start gap-2">
                                                    <div className="mt-2 w-10 shrink-0 text-center text-xs font-bold text-slate-500">
                                                        #{index + 1}
                                                    </div>
                                                    <div className="w-full">
                                                        <input
                                                            type="text"
                                                            value={subCategory?.[activeLang] ?? ''}
                                                            onChange={(event) =>
                                                                updateSubCategory(
                                                                    index,
                                                                    activeLang,
                                                                    event.target.value,
                                                                )
                                                            }
                                                            placeholder={`Sub category ${index + 1}`}
                                                            className="w-full rounded-lg border border-blue-100 bg-blue-50/40 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
                                                        />
                                                        {isEditing &&
                                                            isEmpty(subCategory?.[activeLang] ?? '') && (
                                                                <p className="mt-2 text-xs font-medium text-slate-500">
                                                                    belum di set
                                                                </p>
                                                            )}

                                                        <div className="mt-2 grid grid-cols-1 gap-1 text-[11px] text-slate-500">
                                                            <p>
                                                                <span className="font-bold">Indonesia</span>: {subCategory?.indonesia?.trim() ? subCategory.indonesia : <span className="italic">belum di set</span>}
                                                            </p>
                                                            <p>
                                                                <span className="font-bold">Arab</span>: {subCategory?.arabic?.trim() ? subCategory.arabic : <span className="italic">belum di set</span>}
                                                            </p>
                                                            <p>
                                                                <span className="font-bold">English</span>: {subCategory?.english?.trim() ? subCategory.english : <span className="italic">belum di set</span>}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeSubCategory(index)}
                                                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-rose-100 text-rose-600 transition hover:bg-rose-50"
                                                        aria-label="Remove sub category"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {form.errors.sub_categories && (
                                        <p className="mt-2 text-xs font-medium text-rose-600">
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
                                        {isEditing ? 'Update Category' : 'Create Category'}
                                    </button>

                                    <Link
                                        href={route('backoffice.product-categories.index')}
                                        className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                    >
                                        Cancel
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
