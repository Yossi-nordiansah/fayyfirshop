import React, { useState, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import {
    Plus,
    Edit2,
    Trash2,
    Check,
    X,
    Upload,
    Image as ImageIcon,
    Eye,
    EyeOff,
    Grid,
    Globe,
    Link2,
    ExternalLink
} from 'lucide-react';
import { useLanguage } from '@/Contexts/LanguageContext';

export default function CategoryTab({ categoryCards = [] }) {
    const { t, locale } = useLanguage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCard, setEditingCard] = useState(null);
    const [deleteId, setDeleteId] = useState(null);

    // Active tab in modal for language inputs: 'id' | 'en' | 'ar'
    const [formLangTab, setFormLangTab] = useState('id');

    // Automatically sync formLangTab with global navbar locale
    useEffect(() => {
        if (locale === 'arabic' || locale === 'ar') {
            setFormLangTab('ar');
        } else if (locale === 'english' || locale === 'en') {
            setFormLangTab('en');
        } else {
            setFormLangTab('id');
        }
    }, [locale]);

    // Form state with 3 languages
    const { data, setData, post, processing, errors, reset } = useForm({
        title_id: '',
        title_en: '',
        title_ar: '',
        slug: '',
        image_file: null,
        image_url: '',
        sort_order: 0,
        is_active: true,
    });

    const [imagePreview, setImagePreview] = useState(null);

    const openAddModal = () => {
        setEditingCard(null);
        reset();
        setImagePreview(null);
        setFormLangTab('id');
        setIsModalOpen(true);
    };

    const openEditModal = (card) => {
        setEditingCard(card);
        const titleTrans = card.title_translations || {};

        setData({
            title_id: titleTrans.id || card.title || '',
            title_en: titleTrans.en || '',
            title_ar: titleTrans.ar || '',
            slug: card.slug || '',
            image_file: null,
            image_url: card.image || '',
            sort_order: card.sort_order ?? 0,
            is_active: Boolean(card.is_active),
        });
        setImagePreview(card.image || null);
        setFormLangTab('id');
        setIsModalOpen(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('image_file', file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingCard) {
            post(`/backoffice/content/home-category/${editingCard.id}`, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        } else {
            post('/backoffice/content/home-category', {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        }
    };

    const handleToggleActive = (id) => {
        router.patch(`/backoffice/content/home-category/${id}/toggle-active`, {}, {
            preserveScroll: true,
        });
    };

    const handleDelete = () => {
        if (!deleteId) return;
        router.delete(`/backoffice/content/home-category/${deleteId}`, {
            onSuccess: () => setDeleteId(null),
        });
    };

    return (
        <div className="space-y-6">
            {/* Header & Add Button */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">
                        {t('backoffice.category.title', 'Category Section Management (3 Bahasa & Custom URL)')}
                    </h2>
                    <p className="text-xs text-slate-500">
                        {t('backoffice.category.subtitle', 'Kelola kartu kategori beranda, gambar background, URL tombol "Lihat Koleksi", dan judul (Indonesia, English, Arabic).')}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={openAddModal}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
                >
                    <Plus className="w-4 h-4" />
                    <span>{t('backoffice.category.add_btn', 'Tambah Kartu Kategori')}</span>
                </button>
            </div>

            {/* List Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                    <thead>
                        <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider font-bold">
                            <th className="py-3 px-4 w-12 text-center">{t('backoffice.common.sort_order', 'Urutan')}</th>
                            <th className="py-3 px-4">{t('backoffice.category.col_bg', 'Background Image')}</th>
                            <th className="py-3 px-4">{t('backoffice.category.col_title', 'Judul Kategori (ID / EN / AR)')}</th>
                            <th className="py-3 px-4">{t('backoffice.category.col_url', 'URL Tombol ("Lihat Koleksi")')}</th>
                            <th className="py-3 px-4 text-center">{t('backoffice.common.status', 'Status')}</th>
                            <th className="py-3 px-4 text-right">{t('backoffice.common.actions', 'Aksi')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {categoryCards.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-8 text-center text-slate-400">
                                    {t('backoffice.category.empty', 'Belum ada kartu kategori beranda. Klik "Tambah Kartu Kategori" untuk membuat.')}
                                </td>
                            </tr>
                        ) : (
                            categoryCards.map((card) => (
                                <tr key={card.id} className="hover:bg-slate-50/70 transition">
                                    <td className="py-3 px-4 text-center font-bold text-blue-900 bg-blue-50/30 rounded-xs">
                                        {card.sort_order}
                                    </td>
                                    <td className="py-3 px-4">
                                        {card.image ? (
                                            <div className="w-24 h-14 bg-slate-900 rounded-lg overflow-hidden border border-slate-200 shadow-xs">
                                                <img
                                                    src={card.image}
                                                    alt={card.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-24 h-14 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                                <ImageIcon className="w-5 h-5" />
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 space-y-1">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-blue-100 text-blue-800 rounded-xs">ID</span>
                                                <span className="font-bold text-slate-900">{card.title_translations?.id || card.title}</span>
                                            </div>
                                            {card.title_translations?.en && (
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-slate-100 text-slate-600 rounded-xs">EN</span>
                                                    <span>{card.title_translations.en}</span>
                                                </div>
                                            )}
                                            {card.title_translations?.ar && (
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-amber-100 text-amber-800 rounded-xs">AR</span>
                                                    <span dir="rtl">{card.title_translations.ar}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 font-mono text-[11px] text-blue-700 max-w-xs break-all">
                                        {card.slug ? (
                                            <a
                                                href={card.slug.startsWith('http') || card.slug.startsWith('/') ? card.slug : `/products/${card.slug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 hover:underline text-blue-600 font-semibold"
                                            >
                                                <span>{card.slug}</span>
                                                <ExternalLink className="w-3 h-3 shrink-0" />
                                            </a>
                                        ) : (
                                            <span className="text-slate-400">-</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <button
                                            type="button"
                                            onClick={() => handleToggleActive(card.id)}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition ${
                                                card.is_active
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                                    : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                                            }`}
                                        >
                                            {card.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                            <span>{card.is_active ? t('backoffice.common.active', 'Aktif') : t('backoffice.common.inactive', 'Non-Aktif')}</span>
                                        </button>
                                    </td>
                                    <td className="py-3 px-4 text-right space-x-2">
                                        <button
                                            type="button"
                                            onClick={() => openEditModal(card)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                            title={t('backoffice.category.edit_card', 'Edit Kartu')}
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDeleteId(card.id)}
                                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                            title={t('backoffice.category.delete_card', 'Hapus Kartu')}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Add/Edit Card */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                            <h3 className="font-bold text-base flex items-center gap-2">
                                <Grid className="w-4 h-4 text-blue-400" />
                                {editingCard ? t('backoffice.modal.edit_category_title', 'Edit Kartu Kategori Beranda (3 Bahasa & Custom URL)') : t('backoffice.modal.add_category_title', 'Tambah Kartu Kategori Beranda Baru (3 Bahasa & Custom URL)')}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                            {/* General Settings */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-3 border-b border-slate-100">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        {t('backoffice.common.sort_order', 'Urutan Tampilan')}
                                    </label>
                                    <input
                                        type="number"
                                        value={data.sort_order}
                                        onChange={(e) => setData('sort_order', parseInt(e.target.value) || 0)}
                                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 space-y-1">
                                        <label className="flex items-center gap-1.5 text-xs font-extrabold text-blue-950">
                                            <Link2 className="w-4 h-4 text-blue-600 shrink-0" />
                                            <span>{t('backoffice.category.btn_url_label', 'URL Target Tombol "Lihat Koleksi"')}</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.slug}
                                            onChange={(e) => setData('slug', e.target.value)}
                                            placeholder={t('backoffice.category.url_placeholder', 'Contoh: https://fayyfirshop.com/products/arang-dan-mabkhara atau /products/parfum')}
                                            className="w-full px-3 py-1.5 text-xs border border-blue-300 rounded-lg focus:outline-none focus:border-blue-600 bg-white font-mono"
                                        />
                                        <p className="text-[10px] text-blue-700">
                                            {t('backoffice.form.url_helper', 'Bisa diisi URL lengkap ("https://..."), path relatif ("/products/..."), atau slug ("parfum").')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 3 Languages Sub-Navigation Tabs */}
                            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                                <div className="flex items-center justify-between mb-2 px-1">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                        <Globe className="w-4 h-4 text-blue-600" />
                                        <span>{t('backoffice.category.lang_header', 'Input Judul Kategori (3 Bahasa)')}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2 border-b border-slate-200 pb-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormLangTab('id')}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                                            formLangTab === 'id'
                                                ? 'bg-blue-600 text-white shadow-xs'
                                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                        }`}
                                    >
                                        <span>{t('backoffice.lang.indonesian', '🇮🇩 Bahasa Indonesia')}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormLangTab('en')}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                                            formLangTab === 'en'
                                                ? 'bg-blue-600 text-white shadow-xs'
                                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                        }`}
                                    >
                                        <span>{t('backoffice.lang.english', '🇬🇧 English')}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormLangTab('ar')}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                                            formLangTab === 'ar'
                                                ? 'bg-blue-600 text-white shadow-xs'
                                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                        }`}
                                    >
                                        <span>{t('backoffice.lang.arabic', '🇸🇦 Arabic (العربية)')}</span>
                                    </button>
                                </div>

                                {/* Language Specific Input Fields */}
                                <div className="p-3 bg-white rounded-lg mt-2 border border-slate-200 space-y-3">
                                    {formLangTab === 'id' && (
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                                {t('backoffice.category.title_id_label', 'Judul Kategori (ID)')} <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={data.title_id}
                                                onChange={(e) => setData('title_id', e.target.value)}
                                                placeholder={t('backoffice.category.title_id_placeholder', 'Contoh: Parfum')}
                                                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-semibold"
                                            />
                                        </div>
                                    )}

                                    {formLangTab === 'en' && (
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                                {t('backoffice.category.title_en_label', 'Category Title (EN)')}
                                            </label>
                                            <input
                                                type="text"
                                                value={data.title_en}
                                                onChange={(e) => setData('title_en', e.target.value)}
                                                placeholder={t('backoffice.category.title_en_placeholder', 'e.g. Perfume')}
                                                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-semibold"
                                            />
                                        </div>
                                    )}

                                    {formLangTab === 'ar' && (
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                                {t('backoffice.category.title_ar_label', 'Category Title (AR)')}
                                            </label>
                                            <input
                                                type="text"
                                                dir="rtl"
                                                value={data.title_ar}
                                                onChange={(e) => setData('title_ar', e.target.value)}
                                                placeholder={t('backoffice.category.title_ar_placeholder', 'مثال: عطور')}
                                                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-right font-bold"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Background Image Section */}
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <label className="block text-xs font-bold text-slate-700">
                                    {t('backoffice.category.bg_image_label', 'Gambar Background Kategori')}
                                </label>
                                <div className="flex items-center gap-3">
                                    <div className="w-24 h-16 bg-slate-800 rounded-lg shrink-0 border border-slate-200 overflow-hidden flex items-center justify-center">
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <ImageIcon className="w-6 h-6 text-slate-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="block w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        />
                                        <input
                                            type="text"
                                            placeholder={t('backoffice.category.bg_url_placeholder', 'Atau URL gambar (mis. /images/category-background/...)')}
                                            value={data.image_url}
                                            onChange={(e) => {
                                                setData('image_url', e.target.value);
                                                if (!data.image_file) setImagePreview(e.target.value);
                                            }}
                                            className="w-full px-2 py-1 text-[11px] border border-slate-200 rounded-md focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Status Option */}
                            <div className="flex items-center pt-2">
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded-xs border-slate-300 focus:ring-blue-500"
                                    />
                                    <span>{t('backoffice.category.show_on_home', 'Tampilkan Kartu Kategori Ini di Beranda')}</span>
                                </label>
                            </div>

                            {/* Buttons */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                                >
                                    {t('backoffice.common.cancel', 'Batal')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition disabled:opacity-50"
                                >
                                    {processing ? t('backoffice.common.saving', 'Menyimpan...') : t('backoffice.category.save_btn', 'Simpan Kartu Kategori')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Delete Confirmation */}
            {deleteId && (
                <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-slate-100 p-6 space-y-4">
                        <h3 className="text-base font-bold text-slate-900">{t('backoffice.modal.delete_confirm_title', 'Konfirmasi Hapus')}</h3>
                        <p className="text-xs text-slate-600">{t('backoffice.category.delete_confirm_desc', 'Apakah Anda yakin ingin menghapus kartu kategori ini?')}</p>
                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setDeleteId(null)}
                                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                            >
                                {t('backoffice.common.cancel', 'Batal')}
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition"
                            >
                                {t('backoffice.common.delete_confirm_btn', 'Ya, Hapus')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
