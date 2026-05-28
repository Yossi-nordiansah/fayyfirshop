import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, FolderTree } from 'lucide-react';
import { useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function ProductCategoryShow({ category }) {
    const languageTabs = useMemo(
        () => [
            { id: 'indonesia', label: 'Indonesia' },
            { id: 'arabic', label: 'Arab' },
            { id: 'english', label: 'English' },
        ],
        [],
    );

    const [activeLang, setActiveLang] = useState('indonesia');

    const getTranslatedOrPlaceholder = (item, langKey) => {
        const translations = item?.name_translations;
        if (translations && typeof translations === 'object') {
            const value = translations?.[langKey];
            if (typeof value === 'string' && value.trim() !== '') {
                return value;
            }
        }
        return null;
    };

    return (
        <div className="min-h-screen bg-blue-50">
            <Head title="Category Detail" />

            <div className="flex min-h-screen">
                <Sidebar />

                <main className="flex min-w-0 flex-1 flex-col">
                    <Navbar />

                    <div className="flex-1 space-y-6 p-6">
                        <section className="flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold tracking-normal text-blue-950">
                                    Category Detail
                                </h1>
                                <p className="mt-1 text-sm text-slate-500">
                                    View category information and sub categories.
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

                        <section className="mx-auto w-full max-w-4xl rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-3 border-b border-blue-100 pb-4">
                                <div>
                                    <h2 className="text-lg font-bold text-blue-950">
                                        {getTranslatedOrPlaceholder(category, activeLang) ?? (
                                            <span className="text-slate-500">
                                                bahasa belum di set
                                            </span>
                                        )}
                                    </h2>
                                </div>
                                <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                                    <FolderTree className="h-4 w-4" />
                                </div>
                            </div>

                            <div className="mt-5">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-blue-800">
                                        Sub Categories
                                    </h3>

                                    <div className="inline-flex flex-wrap gap-2 rounded-lg border border-blue-100 bg-blue-50/40 p-1">
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
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {category.sub_categories?.length === 0 ? (
                                    <p className="mt-3 text-sm text-slate-500">
                                        No sub categories for this category.
                                    </p>
                                ) : (
                                    <ul className="mt-3 divide-y divide-blue-50 rounded-lg border border-blue-100">
                                        {category.sub_categories.map((subCategory) => (
                                            <li
                                                key={subCategory.id}
                                                className="px-4 py-3 text-sm font-medium text-slate-700"
                                            >
                                                {getTranslatedOrPlaceholder(subCategory, activeLang) ?? (
                                                    <span className="text-slate-500">
                                                        bahasa belum di set
                                                    </span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <Link
                                    href={route('backoffice.product-categories.edit', category.slug)}
                                    className="rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800"
                                >
                                    Edit Category
                                </Link>
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
}
