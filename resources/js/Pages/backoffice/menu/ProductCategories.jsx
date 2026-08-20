import { Head, Link, router, useForm } from '@inertiajs/react';
import { Edit3, Eye, Image, Plus, Trash2, Power, Upload, X } from 'lucide-react';
import { useState, useRef } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ConfirmModal from '../components/ConfirmModal';
import { useLanguage } from '@/Contexts/LanguageContext';

export default function ProductCategories({ categories, allProductSlides = [], status, statusAction }) {
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
    const [pendingDeleteSlide, setPendingDeleteSlide] = useState(null);

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

    // ─── All Product Slides (Carousel CRUD) ───────────────────────────────────
    const [slidePreview, setSlidePreview] = useState(null);
    const fileInputRef = useRef(null);

    const slideForm = useForm({
        title: '',
        image_file: null,
    });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        slideForm.setData('image_file', file);
        setSlidePreview(URL.createObjectURL(file));
    };

    const submitSlide = (e) => {
        e.preventDefault();
        const data = new FormData();
        if (slideForm.data.title) data.append('title', slideForm.data.title);
        if (slideForm.data.image_file) data.append('image_file', slideForm.data.image_file);

        router.post(route('backoffice.all-product-slides.store'), data, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                slideForm.reset();
                setSlidePreview(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
            },
        });
    };

    const toggleSlideActive = (slide) => {
        router.patch(route('backoffice.all-product-slides.toggle-active', slide.id), {}, {
            preserveScroll: true,
        });
    };

    const confirmDeleteSlide = () => {
        if (!pendingDeleteSlide) return;
        router.delete(route('backoffice.all-product-slides.destroy', pendingDeleteSlide.id), {
            preserveScroll: true,
        });
        setPendingDeleteSlide(null);
    };

    return (
        <div className="min-h-screen bg-blue-50">
            <Head title={t('backoffice.category.title', 'Kategori Produk')} />

            {/* Confirm delete category */}
            <ConfirmModal
                show={Boolean(pendingDelete)}
                title={t('backoffice.category.delete.title', 'Hapus Kategori')}
                message={t('backoffice.category.delete.confirm', 'Hapus kategori "{name}"? Tindakan ini tidak dapat dibatalkan.').replace('{name}', getLocalizedName(pendingDelete))}
                confirmLabel={t('backoffice.category.delete.btn_confirm', 'Hapus')}
                cancelLabel={t('backoffice.category.buttons.cancel', 'Batal')}
                onConfirm={confirmRemoveCategory}
                onCancel={() => setPendingDelete(null)}
            />

            {/* Confirm delete slide */}
            <ConfirmModal
                show={Boolean(pendingDeleteSlide)}
                title="Hapus Slide Carousel"
                message={`Hapus slide carousel "${pendingDeleteSlide?.title || 'ini'}"? File gambar juga akan dihapus permanen.`}
                confirmLabel="Hapus"
                cancelLabel="Batal"
                onConfirm={confirmDeleteSlide}
                onCancel={() => setPendingDeleteSlide(null)}
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
                            <section className={`rounded-lg border px-4 py-3 text-sm font-medium ${
                                statusAction === 'deleted'
                                    ? 'border-rose-200 bg-rose-50 text-rose-700'
                                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            }`}>
                                {status}
                            </section>
                        )}

                        {/* ── Kategori Produk Table ── */}
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

                        {/* ── Carousel "Semua Produk" ── */}
                        <section className="overflow-hidden rounded-lg border border-blue-100 bg-white shadow-sm">
                            <div className="flex items-center justify-between border-b border-blue-100 px-5 py-4">
                                <div>
                                    <h2 className="text-lg font-bold text-blue-950 flex items-center gap-2">
                                        <Image className="h-5 w-5 text-blue-600" />
                                        Gambar Carousel — Semua Produk
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        Gambar latar yang bergantian otomatis saat tidak ada kategori yang dipilih.
                                        {' '}
                                        <span className="font-semibold text-blue-700">{allProductSlides.length} slide</span> tersedia.
                                    </p>
                                </div>
                            </div>

                            <div className="p-5 space-y-6">
                                {/* Upload Form */}
                                <form onSubmit={submitSlide} className="rounded-xl border border-dashed border-blue-200 bg-blue-50/50 p-5 space-y-4">
                                    <p className="text-sm font-bold text-blue-900">Tambah Slide Baru</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                        {/* Title input */}
                                        <div className="space-y-1">
                                            <label className="block text-xs font-semibold text-slate-600">
                                                Judul Slide <span className="font-normal text-slate-400">(opsional)</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={slideForm.data.title}
                                                onChange={e => slideForm.setData('title', e.target.value)}
                                                placeholder="misal: Koleksi Premium"
                                                className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-400 outline-none"
                                            />
                                        </div>

                                        {/* File input */}
                                        <div className="space-y-1">
                                            <label className="block text-xs font-semibold text-slate-600">
                                                Gambar Background <span className="text-rose-500">*</span>
                                            </label>
                                            <div
                                                className="relative flex items-center gap-3 rounded-lg border border-blue-200 bg-white px-3 py-2 cursor-pointer hover:border-blue-400 transition"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <Upload className="h-4 w-4 text-blue-500 shrink-0" />
                                                <span className="text-sm text-slate-500 truncate">
                                                    {slideForm.data.image_file ? slideForm.data.image_file.name : 'Klik untuk upload gambar…'}
                                                </span>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleFileChange}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Preview */}
                                    {slidePreview && (
                                        <div className="relative w-full h-36 rounded-lg overflow-hidden border border-blue-100">
                                            <img src={slidePreview} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSlidePreview(null);
                                                    slideForm.setData('image_file', null);
                                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                                }}
                                                className="absolute top-2 right-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70 transition"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={!slideForm.data.image_file || slideForm.processing}
                                            className="inline-flex items-center gap-2 rounded-lg bg-blue-950 px-5 py-2 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Plus className="h-4 w-4" />
                                            {slideForm.processing ? 'Menyimpan…' : 'Tambah Slide'}
                                        </button>
                                    </div>
                                </form>

                                {/* Slides Grid */}
                                {allProductSlides.length === 0 ? (
                                    <div className="py-12 text-center text-slate-400 text-sm">
                                        Belum ada slide carousel. Tambah gambar di atas.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {allProductSlides.map((slide) => (
                                            <div
                                                key={slide.id}
                                                className="group relative rounded-xl overflow-hidden border border-blue-100 shadow-sm"
                                            >
                                                {/* Thumbnail */}
                                                <div className="relative h-28 bg-slate-100">
                                                    {slide.image ? (
                                                        <img
                                                            src={slide.image}
                                                            alt={slide.title || `Slide ${slide.id}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                            <Image className="h-8 w-8" />
                                                        </div>
                                                    )}
                                                    {/* Overlay actions on hover */}
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleSlideActive(slide)}
                                                            className={`p-2 rounded-full transition ${
                                                                slide.is_active
                                                                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                                                    : 'bg-slate-500 text-white hover:bg-slate-600'
                                                            }`}
                                                            title={slide.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                                        >
                                                            <Power className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setPendingDeleteSlide(slide)}
                                                            className="p-2 rounded-full bg-rose-500 text-white hover:bg-rose-600 transition"
                                                            title="Hapus slide"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                    {/* Status badge */}
                                                    <div className="absolute top-1.5 left-1.5">
                                                        {slide.is_active ? (
                                                            <span className="inline-flex items-center rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-bold text-white">
                                                                Aktif
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center rounded-full bg-slate-500 px-2 py-0.5 text-[9px] font-bold text-white">
                                                                Nonaktif
                                                            </span>
                                                        )}
                                                    </div>
                                                    {/* Sort order badge */}
                                                    <div className="absolute top-1.5 right-1.5">
                                                        <span className="inline-flex items-center rounded-full bg-black/50 px-2 py-0.5 text-[9px] font-bold text-white">
                                                            #{slide.sort_order}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Title */}
                                                <div className="px-3 py-2 bg-white">
                                                    <p className="text-xs font-semibold text-slate-700 truncate">
                                                        {slide.title || <span className="text-slate-400 italic">Tanpa judul</span>}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                                        ID: {slide.id}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
}
