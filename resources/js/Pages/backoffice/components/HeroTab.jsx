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
    Sparkles,
    Globe,
    Link2,
    ExternalLink
} from 'lucide-react';
import { useLanguage } from '@/Contexts/LanguageContext';

export default function HeroTab({ heroSlides = [] }) {
    const { t, locale } = useLanguage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSlide, setEditingSlide] = useState(null);
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
        subtitle_id: '',
        subtitle_en: '',
        subtitle_ar: '',
        description_id: '',
        description_en: '',
        description_ar: '',
        category_id: '',
        category_en: '',
        category_ar: '',
        slug: '',
        theme: 'from-blue-900/60',
        icon: 'Sparkles',
        product_image_file: null,
        product_image_url: '',
        background_image_file: null,
        background_image_url: '',
        sort_order: 0,
        is_active: true,
    });

    const [productPreview, setProductPreview] = useState(null);
    const [backgroundPreview, setBackgroundPreview] = useState(null);

    const openAddModal = () => {
        setEditingSlide(null);
        reset();
        setProductPreview(null);
        setBackgroundPreview(null);
        setFormLangTab('id');
        setIsModalOpen(true);
    };

    const openEditModal = (slide) => {
        setEditingSlide(slide);
        const titleTrans = slide.title_translations || {};
        const subtitleTrans = slide.subtitle_translations || {};
        const descTrans = slide.description_translations || {};
        const categoryTrans = slide.category_translations || {};

        setData({
            title_id: titleTrans.id || slide.title || '',
            title_en: titleTrans.en || '',
            title_ar: titleTrans.ar || '',
            subtitle_id: subtitleTrans.id || slide.subtitle || '',
            subtitle_en: subtitleTrans.en || '',
            subtitle_ar: subtitleTrans.ar || '',
            description_id: descTrans.id || slide.description || '',
            description_en: descTrans.en || '',
            description_ar: descTrans.ar || '',
            category_id: categoryTrans.id || slide.category || '',
            category_en: categoryTrans.en || '',
            category_ar: categoryTrans.ar || '',
            slug: slide.slug || '',
            theme: slide.theme || 'from-blue-900/60',
            icon: slide.icon || 'Sparkles',
            product_image_file: null,
            product_image_url: slide.product_image || '',
            background_image_file: null,
            background_image_url: slide.background_image || '',
            sort_order: slide.sort_order ?? 0,
            is_active: Boolean(slide.is_active),
        });
        setProductPreview(slide.product_image || null);
        setBackgroundPreview(slide.background_image || null);
        setFormLangTab('id');
        setIsModalOpen(true);
    };

    const handleProductFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('product_image_file', file);
            setProductPreview(URL.createObjectURL(file));
        }
    };

    const handleBackgroundFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('background_image_file', file);
            setBackgroundPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingSlide) {
            post(`/backoffice/content/hero/${editingSlide.id}`, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        } else {
            post('/backoffice/content/hero', {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        }
    };

    const handleToggleActive = (id) => {
        router.patch(`/backoffice/content/hero/${id}/toggle-active`, {}, {
            preserveScroll: true,
        });
    };

    const handleDelete = () => {
        if (!deleteId) return;
        router.delete(`/backoffice/content/hero/${deleteId}`, {
            onSuccess: () => setDeleteId(null),
        });
    };

    return (
        <div className="space-y-6">
            {/* Header & Add Button */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">
                        {t('backoffice.hero.title', 'Hero Slider Management (3 Bahasa & Custom URL)')}
                    </h2>
                    <p className="text-xs text-slate-500">
                        {t('backoffice.hero.subtitle', 'Kelola judul, deskripsi, URL tombol "Jelajahi Koleksi", gambar produk, dan background slider hero.')}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={openAddModal}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
                >
                    <Plus className="w-4 h-4" />
                    <span>{t('backoffice.hero.add_btn', 'Tambah Slide Hero')}</span>
                </button>
            </div>

            {/* Slide List Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                    <thead>
                        <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider font-bold">
                            <th className="py-3 px-4 w-12 text-center">{t('backoffice.common.sort_order', 'Urutan')}</th>
                            <th className="py-3 px-4">{t('backoffice.hero.col_product', 'Preview Produk')}</th>
                            <th className="py-3 px-4">{t('backoffice.hero.col_bg', 'Preview BG')}</th>
                            <th className="py-3 px-4">{t('backoffice.hero.col_title', 'Kategori & Judul (3 Bahasa)')}</th>
                            <th className="py-3 px-4">{t('backoffice.hero.col_url', 'URL Tombol ("Jelajahi Koleksi")')}</th>
                            <th className="py-3 px-4 text-center">{t('backoffice.common.status', 'Status')}</th>
                            <th className="py-3 px-4 text-right">{t('backoffice.common.actions', 'Aksi')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {heroSlides.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="py-8 text-center text-slate-400">
                                    {t('backoffice.hero.empty', 'Belum ada slide hero. Klik tombol "Tambah Slide Hero" untuk membuat.')}
                                </td>
                            </tr>
                        ) : (
                            heroSlides.map((slide) => (
                                <tr key={slide.id} className="hover:bg-slate-50/70 transition">
                                    <td className="py-3 px-4 text-center font-bold text-blue-900 bg-blue-50/30 rounded-xs">
                                        {slide.sort_order}
                                    </td>
                                    <td className="py-3 px-4">
                                        {slide.product_image ? (
                                            <div className="w-14 h-14 bg-slate-900/90 rounded-lg p-1 flex items-center justify-center overflow-hidden shadow-xs border border-slate-200">
                                                <img
                                                    src={slide.product_image}
                                                    alt={slide.title}
                                                    className="max-h-full max-w-full object-contain"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-14 h-14 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                                <ImageIcon className="w-5 h-5" />
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-3 px-4">
                                        {slide.background_image ? (
                                            <div className="w-20 h-12 bg-slate-800 rounded-lg overflow-hidden border border-slate-200 shadow-xs relative">
                                                <img
                                                    src={slide.background_image}
                                                    alt="Background"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-20 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                                <ImageIcon className="w-5 h-5" />
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 space-y-1">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-blue-100 text-blue-800 rounded-xs">ID</span>
                                                <span className="font-bold text-slate-900">{slide.title_translations?.id || slide.title}</span>
                                            </div>
                                            {slide.title_translations?.en && (
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-slate-100 text-slate-600 rounded-xs">EN</span>
                                                    <span>{slide.title_translations.en}</span>
                                                </div>
                                            )}
                                            {slide.title_translations?.ar && (
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-amber-100 text-amber-800 rounded-xs">AR</span>
                                                    <span dir="rtl">{slide.title_translations.ar}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 font-mono text-[11px] text-blue-700 max-w-xs break-all">
                                        {slide.slug ? (
                                            <a
                                                href={slide.slug.startsWith('http') || slide.slug.startsWith('/') ? slide.slug : `/products/${slide.slug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 hover:underline text-blue-600 font-semibold"
                                            >
                                                <span>{slide.slug}</span>
                                                <ExternalLink className="w-3 h-3 shrink-0" />
                                            </a>
                                        ) : (
                                            <span className="text-slate-400">-</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <button
                                            type="button"
                                            onClick={() => handleToggleActive(slide.id)}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition ${
                                                slide.is_active
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                                    : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                                            }`}
                                        >
                                            {slide.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                            <span>{slide.is_active ? t('backoffice.common.active', 'Aktif') : t('backoffice.common.inactive', 'Non-Aktif')}</span>
                                        </button>
                                    </td>
                                    <td className="py-3 px-4 text-right space-x-2">
                                        <button
                                            type="button"
                                            onClick={() => openEditModal(slide)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                            title={t('backoffice.hero.edit_slide', 'Edit Slide')}
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDeleteId(slide.id)}
                                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                            title={t('backoffice.hero.delete_slide', 'Hapus Slide')}
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

            {/* Modal Add/Edit Slide */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                    <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                            <h3 className="font-bold text-base flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-400" />
                                {editingSlide ? t('backoffice.modal.edit_hero_title', 'Edit Slide Hero (3 Bahasa & Custom URL)') : t('backoffice.modal.add_hero_title', 'Tambah Slide Hero Baru (3 Bahasa & Custom URL)')}
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
                                        {t('backoffice.common.sort_order', 'Urutan Slide')}
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
                                            <span>{t('backoffice.hero.btn_url_label', 'URL Target Tombol "Jelajahi Koleksi"')}</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.slug}
                                            onChange={(e) => setData('slug', e.target.value)}
                                            placeholder={t('backoffice.hero.url_placeholder', 'Contoh: https://fayyfirshop.com/products/arang-dan-mabkhara atau /products/parfum')}
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
                                        <span>{t('backoffice.form.lang_label', 'Input Teks Terjemahan (3 Bahasa)')}</span>
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
                                        <>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                                    {t('backoffice.hero.category_badge', 'Kategori Badge')} {t('backoffice.lang_suffix.id', '(Bahasa Indonesia)')}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.category_id}
                                                    onChange={(e) => setData('category_id', e.target.value)}
                                                    placeholder={t('backoffice.hero.cat_id_placeholder', 'Contoh: Parfum Mewah')}
                                                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                                    {t('backoffice.hero.slide_title', 'Judul Slide Hero')} {t('backoffice.lang_suffix.id', '(Bahasa Indonesia)')} <span className="text-rose-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={data.title_id}
                                                    onChange={(e) => setData('title_id', e.target.value)}
                                                    placeholder={t('backoffice.hero.title_id_placeholder', 'Contoh: Simfoni Aroma')}
                                                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-semibold"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                                    {t('backoffice.hero.subtitle_tagline', 'Sub-Judul / Tagline')} {t('backoffice.lang_suffix.id', '(Bahasa Indonesia)')}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.subtitle_id}
                                                    onChange={(e) => setData('subtitle_id', e.target.value)}
                                                    placeholder={t('backoffice.hero.sub_id_placeholder', 'Contoh: Eau de Parfum & Fragrance Spray')}
                                                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                                    {t('backoffice.hero.slide_description', 'Deskripsi Slide')} {t('backoffice.lang_suffix.id', '(Bahasa Indonesia)')}
                                                </label>
                                                <textarea
                                                    rows={2}
                                                    value={data.description_id}
                                                    onChange={(e) => setData('description_id', e.target.value)}
                                                    placeholder={t('backoffice.hero.desc_id_placeholder', 'Deskripsi versi Bahasa Indonesia...')}
                                                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {formLangTab === 'en' && (
                                        <>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                                    {t('backoffice.hero.category_badge', 'Category Badge')} {t('backoffice.lang_suffix.en', '(English)')}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.category_en}
                                                    onChange={(e) => setData('category_en', e.target.value)}
                                                    placeholder={t('backoffice.hero.cat_en_placeholder', 'e.g. Luxury Perfume')}
                                                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                                    {t('backoffice.hero.slide_title', 'Hero Slide Title')} {t('backoffice.lang_suffix.en', '(English)')}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.title_en}
                                                    onChange={(e) => setData('title_en', e.target.value)}
                                                    placeholder={t('backoffice.hero.title_en_placeholder', 'e.g. Scent of Luxury')}
                                                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-semibold"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                                    {t('backoffice.hero.subtitle_tagline', 'Subtitle / Tagline')} {t('backoffice.lang_suffix.en', '(English)')}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.subtitle_en}
                                                    onChange={(e) => setData('subtitle_en', e.target.value)}
                                                    placeholder={t('backoffice.hero.sub_en_placeholder', 'e.g. Eau de Parfum & Fragrance Spray')}
                                                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                                    {t('backoffice.hero.slide_description', 'Slide Description')} {t('backoffice.lang_suffix.en', '(English)')}
                                                </label>
                                                <textarea
                                                    rows={2}
                                                    value={data.description_en}
                                                    onChange={(e) => setData('description_en', e.target.value)}
                                                    placeholder={t('backoffice.hero.desc_en_placeholder', 'English description...')}
                                                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {formLangTab === 'ar' && (
                                        <>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                                    {t('backoffice.hero.category_badge', 'Category Badge')} {t('backoffice.lang_suffix.ar', '(Arabic)')}
                                                </label>
                                                <input
                                                    type="text"
                                                    dir="rtl"
                                                    value={data.category_ar}
                                                    onChange={(e) => setData('category_ar', e.target.value)}
                                                    placeholder={t('backoffice.hero.cat_ar_placeholder', 'مثال: عطور فاخرة')}
                                                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-right font-medium"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                                    {t('backoffice.hero.slide_title', 'Hero Slide Title')} {t('backoffice.lang_suffix.ar', '(Arabic)')}
                                                </label>
                                                <input
                                                    type="text"
                                                    dir="rtl"
                                                    value={data.title_ar}
                                                    onChange={(e) => setData('title_ar', e.target.value)}
                                                    placeholder={t('backoffice.hero.title_ar_placeholder', 'مثال: عبير الفخامة')}
                                                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-right font-bold"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                                    {t('backoffice.hero.subtitle_tagline', 'Subtitle / Tagline')} {t('backoffice.lang_suffix.ar', '(Arabic)')}
                                                </label>
                                                <input
                                                    type="text"
                                                    dir="rtl"
                                                    value={data.subtitle_ar}
                                                    onChange={(e) => setData('subtitle_ar', e.target.value)}
                                                    placeholder={t('backoffice.hero.sub_ar_placeholder', 'مثال: أو دو بارفان وبخاخات عطرية')}
                                                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-right font-medium"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                                    {t('backoffice.hero.slide_description', 'Slide Description')} {t('backoffice.lang_suffix.ar', '(Arabic)')}
                                                </label>
                                                <textarea
                                                    rows={2}
                                                    dir="rtl"
                                                    value={data.description_ar}
                                                    onChange={(e) => setData('description_ar', e.target.value)}
                                                    placeholder={t('backoffice.hero.desc_ar_placeholder', 'الوصف باللغة العربية...')}
                                                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-right font-medium"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Image Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                                {/* Product Image */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-700">
                                        {t('backoffice.form.product_image_label', 'Gambar Produk Hero (Melayang)')}
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <div className="w-16 h-16 bg-slate-900/90 rounded-lg p-1 flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden">
                                            {productPreview ? (
                                                <img src={productPreview} alt="Preview" className="max-h-full max-w-full object-contain" />
                                            ) : (
                                                <ImageIcon className="w-6 h-6 text-slate-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleProductFileChange}
                                                className="block w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                            />
                                            <input
                                                type="text"
                                                placeholder={t('backoffice.form.image_url_placeholder', 'Atau URL gambar (mis. /images/hero/...)')}
                                                value={data.product_image_url}
                                                onChange={(e) => {
                                                    setData('product_image_url', e.target.value);
                                                    if (!data.product_image_file) setProductPreview(e.target.value);
                                                }}
                                                className="w-full px-2 py-1 text-[11px] border border-slate-200 rounded-md focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Background Image */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-700">
                                        {t('backoffice.form.bg_image_label', 'Gambar Background Slider Hero')}
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <div className="w-20 h-16 bg-slate-800 rounded-lg shrink-0 border border-slate-200 overflow-hidden flex items-center justify-center">
                                            {backgroundPreview ? (
                                                <img src={backgroundPreview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon className="w-6 h-6 text-slate-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleBackgroundFileChange}
                                                className="block w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                            />
                                            <input
                                                type="text"
                                                placeholder={t('backoffice.hero.bg_url_placeholder', 'Atau URL background (mis. /images/hero/...)')}
                                                value={data.background_image_url}
                                                onChange={(e) => {
                                                    setData('background_image_url', e.target.value);
                                                    if (!data.background_image_file) setBackgroundPreview(e.target.value);
                                                }}
                                                className="w-full px-2 py-1 text-[11px] border border-slate-200 rounded-md focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Options */}
                            <div className="flex items-center pt-2">
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded-xs border-slate-300 focus:ring-blue-500"
                                    />
                                    <span>{t('backoffice.form.show_on_home', 'Tampilkan di Beranda')}</span>
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
                                    {processing ? t('backoffice.common.saving', 'Menyimpan...') : t('backoffice.common.save', 'Simpan Slide Hero')}
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
                        <p className="text-xs text-slate-600">{t('backoffice.hero.delete_confirm_desc', 'Apakah Anda yakin ingin menghapus slide hero ini?')}</p>
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
