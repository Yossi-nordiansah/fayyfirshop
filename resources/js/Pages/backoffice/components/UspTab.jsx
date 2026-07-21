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
    ShieldCheck,
    Globe,
    Search,
    Sparkles,
    
    // Icon Palette (50+ Lucide Icons)
    Shield, ShieldAlert, Lock, Key, CheckCircle, CheckCircle2, BadgeCheck, Badge,
    Award, Crown, Star, Gem, Medal, Trophy, ThumbsUp, Heart, Smile,
    Leaf, Sun, Droplets, Flower, Flower2, Sprout, Apple,
    Truck, Package, PackageCheck, Send, MapPin, Compass, Box,
    Clock, Zap, Timer, Calendar, Hourglass,
    ShoppingBag, ShoppingCart, Tag, Percent, CreditCard, Gift, Store,
    Coffee, Flame, Feather, Info, Sparkle
} from 'lucide-react';
import { useLanguage } from '@/Contexts/LanguageContext';

export default function UspTab({ uspItems = [] }) {
    const { t, locale } = useLanguage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [deleteId, setDeleteId] = useState(null);

    // Active language tab in modal: 'id' | 'en' | 'ar'
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

    // Pop-up Icon Picker state
    const [iconPickerModalOpen, setIconPickerModalOpen] = useState(false);
    const [iconSearchText, setIconSearchText] = useState('');

    // Comprehensive list of 50+ icons
    const iconList = [
        { name: 'Leaf', icon: Leaf, category: 'Alami & Organik' },
        { name: 'Truck', icon: Truck, category: 'Pengiriman & Layanan' },
        { name: 'CreditCard', icon: CreditCard, category: 'Belanja & Pembayaran' },
        { name: 'ShieldCheck', icon: ShieldCheck, category: 'Keamanan & Garansi' },
        { name: 'Award', icon: Award, category: 'Kualitas & Mewah' },
        { name: 'Crown', icon: Crown, category: 'Kualitas & Mewah' },
        { name: 'Star', icon: Star, category: 'Kualitas & Mewah' },
        { name: 'Sparkles', icon: Sparkles, category: 'Kualitas & Mewah' },
        { name: 'Gem', icon: Gem, category: 'Kualitas & Mewah' },
        { name: 'CheckCircle', icon: CheckCircle, category: 'Keamanan & Garansi' },
        { name: 'BadgeCheck', icon: BadgeCheck, category: 'Keamanan & Garansi' },
        { name: 'Heart', icon: Heart, category: 'Kualitas & Mewah' },
        { name: 'Sun', icon: Sun, category: 'Alami & Organik' },
        { name: 'Droplets', icon: Droplets, category: 'Alami & Organik' },
        { name: 'Flower', icon: Flower, category: 'Alami & Organik' },
        { name: 'Package', icon: Package, category: 'Pengiriman & Layanan' },
        { name: 'PackageCheck', icon: PackageCheck, category: 'Pengiriman & Layanan' },
        { name: 'Clock', icon: Clock, category: 'Waktu & Kecepatan' },
        { name: 'Zap', icon: Zap, category: 'Waktu & Kecepatan' },
        { name: 'ShoppingBag', icon: ShoppingBag, category: 'Belanja & Pembayaran' },
        { name: 'ShoppingCart', icon: ShoppingCart, category: 'Belanja & Pembayaran' },
        { name: 'Gift', icon: Gift, category: 'Belanja & Pembayaran' },
        { name: 'Tag', icon: Tag, category: 'Belanja & Pembayaran' },
        { name: 'Percent', icon: Percent, category: 'Belanja & Pembayaran' },
        { name: 'Coffee', icon: Coffee, category: 'Aromatik & Lainnya' },
        { name: 'Flame', icon: Flame, category: 'Aromatik & Lainnya' },
    ];

    const ICON_LOOKUP = iconList.reduce((acc, curr) => {
        acc[curr.name] = curr.icon;
        return acc;
    }, {});

    // Form state
    const { data, setData, post, processing, errors, reset } = useForm({
        title_id: '',
        title_en: '',
        title_ar: '',
        description_id: '',
        description_en: '',
        description_ar: '',
        icon: 'Leaf',
        background_image_file: null,
        background_image_url: '',
        color: 'from-teal-400 to-teal-600',
        sort_order: 0,
        is_active: true,
    });

    const [imagePreview, setImagePreview] = useState(null);

    const openAddModal = () => {
        setEditingItem(null);
        reset();
        setImagePreview(null);
        setFormLangTab('id');
        setIconSearchText('');
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        const titleTrans = item.title_translations || {};
        const descTrans = item.description_translations || {};

        setData({
            title_id: titleTrans.id || item.title || '',
            title_en: titleTrans.en || '',
            title_ar: titleTrans.ar || '',
            description_id: descTrans.id || item.description || '',
            description_en: descTrans.en || '',
            description_ar: descTrans.ar || '',
            icon: item.icon || 'Leaf',
            background_image_file: null,
            background_image_url: item.background_image || '',
            color: item.color || 'from-teal-400 to-teal-600',
            sort_order: item.sort_order ?? 0,
            is_active: Boolean(item.is_active),
        });
        setImagePreview(item.background_image || null);
        setFormLangTab('id');
        setIconSearchText('');
        setIsModalOpen(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('background_image_file', file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingItem) {
            post(`/backoffice/content/usp/${editingItem.id}`, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        } else {
            post('/backoffice/content/usp', {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        }
    };

    const handleToggleActive = (id) => {
        router.patch(`/backoffice/content/usp/${id}/toggle-active`, {}, {
            preserveScroll: true,
        });
    };

    const handleDelete = () => {
        if (!deleteId) return;
        router.delete(`/backoffice/content/usp/${deleteId}`, {
            onSuccess: () => setDeleteId(null),
        });
    };

    const renderSelectedIcon = (iconVal) => {
        if (!iconVal) return <Leaf className="w-5 h-5 text-emerald-600 shrink-0" />;

        if (iconVal.startsWith('/') || iconVal.startsWith('http')) {
            return (
                <img
                    src={iconVal}
                    alt="USP Icon"
                    className="w-5 h-5 object-contain shrink-0"
                />
            );
        }

        const IconComp = ICON_LOOKUP[iconVal];
        if (IconComp) {
            return <IconComp className="w-5 h-5 text-emerald-600 shrink-0" />;
        }
        return <Leaf className="w-5 h-5 text-emerald-600 shrink-0" />;
    };

    const filteredIcons = iconList.filter(item =>
        item.name.toLowerCase().includes(iconSearchText.toLowerCase()) ||
        item.category.toLowerCase().includes(iconSearchText.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header & Add Button */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">
                        {t('backoffice.usp.title', 'Unique Selling Proposition (USP) Management')}
                    </h2>
                    <p className="text-xs text-slate-500">
                        {t('backoffice.usp.subtitle', 'Kelola kartu keunggulan beranda (Natural Product, Fast Delivery, WhatsApp Support, dll), gambar background, icon, dan 3 bahasa.')}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={openAddModal}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
                >
                    <Plus className="w-4 h-4" />
                    <span>{t('backoffice.usp.add_btn', 'Tambah Kartu USP')}</span>
                </button>
            </div>

            {/* List Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                    <thead>
                        <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase tracking-wider font-bold">
                            <th className="py-3 px-4 w-12 text-center">{t('backoffice.common.sort_order', 'Urutan')}</th>
                            <th className="py-3 px-4">{t('backoffice.usp.col_bg', 'Background Card')}</th>
                            <th className="py-3 px-4">{t('backoffice.usp.col_icon', 'Icon')}</th>
                            <th className="py-3 px-4">{t('backoffice.usp.col_title', 'Judul Kartu USP (3 Bahasa)')}</th>
                            <th className="py-3 px-4">{t('backoffice.usp.col_desc', 'Deskripsi Kartu')}</th>
                            <th className="py-3 px-4 text-center">{t('backoffice.common.status', 'Status')}</th>
                            <th className="py-3 px-4 text-right">{t('backoffice.common.actions', 'Aksi')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {uspItems.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="py-8 text-center text-slate-400">
                                    {t('backoffice.usp.empty', 'Belum ada kartu USP. Klik "Tambah Kartu USP" untuk membuat.')}
                                </td>
                            </tr>
                        ) : (
                            uspItems.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/70 transition">
                                    <td className="py-3 px-4 text-center font-bold text-blue-900 bg-blue-50/30 rounded-xs">
                                        {item.sort_order}
                                    </td>
                                    <td className="py-3 px-4">
                                        {item.background_image ? (
                                            <div className="w-20 h-14 bg-slate-900 rounded-lg overflow-hidden border border-slate-200 shadow-xs relative">
                                                <img
                                                    src={item.background_image}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-20 h-14 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                                <ImageIcon className="w-5 h-5" />
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="w-9 h-9 bg-slate-900/90 rounded-lg p-1.5 border border-amber-500/30 flex items-center justify-center shadow-xs">
                                            {renderSelectedIcon(item.icon)}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 space-y-1">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-blue-100 text-blue-800 rounded-xs">ID</span>
                                                <span className="font-bold text-slate-900">{item.title_translations?.id || item.title}</span>
                                            </div>
                                            {item.title_translations?.en && (
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-slate-100 text-slate-600 rounded-xs">EN</span>
                                                    <span>{item.title_translations.en}</span>
                                                </div>
                                            )}
                                            {item.title_translations?.ar && (
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-amber-100 text-amber-800 rounded-xs">AR</span>
                                                    <span dir="rtl">{item.title_translations.ar}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 max-w-xs text-slate-600 line-clamp-2 text-xs">
                                        {item.description_translations?.id || item.description || '-'}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <button
                                            type="button"
                                            onClick={() => handleToggleActive(item.id)}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition ${
                                                item.is_active
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                                    : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                                            }`}
                                        >
                                            {item.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                            <span>{item.is_active ? t('backoffice.common.active', 'Aktif') : t('backoffice.common.inactive', 'Non-Aktif')}</span>
                                        </button>
                                    </td>
                                    <td className="py-3 px-4 text-right space-x-2">
                                        <button
                                            type="button"
                                            onClick={() => openEditModal(item)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                            title={t('backoffice.usp.edit_item', 'Edit Kartu USP')}
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDeleteId(item.id)}
                                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                            title={t('backoffice.common.delete', 'Hapus')}
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

            {/* Modal Add/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                    <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                            <h3 className="font-bold text-base flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                {editingItem ? t('backoffice.modal.edit_usp_title', 'Edit Kartu USP (3 Bahasa & Custom BG)') : t('backoffice.modal.add_usp_title', 'Tambah Kartu USP Baru (3 Bahasa & Custom BG)')}
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
                        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
                            {/* General Settings */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-3 border-b border-slate-100">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        {t('backoffice.common.sort_order', 'Urutan Tampilan (Sort Order)')}
                                    </label>
                                    <input
                                        type="number"
                                        value={data.sort_order}
                                        onChange={(e) => setData('sort_order', parseInt(e.target.value) || 0)}
                                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        {t('backoffice.usp.icon_label', 'Icon Kartu USP')}
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIconSearchText('');
                                                setIconPickerModalOpen(true);
                                            }}
                                            className="w-9 h-9 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg flex items-center justify-center text-emerald-600 shrink-0 transition shadow-xs"
                                            title={t('backoffice.usp.select_icon_tooltip', 'Klik untuk memilih icon')}
                                        >
                                            {renderSelectedIcon(data.icon)}
                                        </button>
                                        <input
                                            type="text"
                                            value={data.icon}
                                            onChange={(e) => setData('icon', e.target.value)}
                                            placeholder={t('backoffice.usp.icon_placeholder', 'Nama Icon (mis. Leaf, Truck, atau URL SVG)')}
                                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 3 Languages Sub-Navigation Tabs */}
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                        <Globe className="w-4 h-4 text-blue-600" />
                                        <span>{t('backoffice.usp.lang_header', 'Input Judul & Deskripsi Kartu (3 Bahasa)')}</span>
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
                                <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-4">
                                    {formLangTab === 'id' && (
                                        <>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                                    {t('backoffice.usp.title_id_label', 'Judul Kartu USP (ID)')} <span className="text-rose-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={data.title_id}
                                                    onChange={(e) => setData('title_id', e.target.value)}
                                                    placeholder={t('backoffice.usp.title_id_placeholder', 'Contoh: Produk Alami')}
                                                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-semibold"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                                    {t('backoffice.usp.desc_id_label', 'Deskripsi Kartu USP (ID)')}
                                                </label>
                                                <textarea
                                                    rows={2}
                                                    value={data.description_id}
                                                    onChange={(e) => setData('description_id', e.target.value)}
                                                    placeholder={t('backoffice.usp.desc_id_placeholder', 'Contoh: Dipilih langsung dari bahan alami murni...')}
                                                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {formLangTab === 'en' && (
                                        <>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                                    {t('backoffice.usp.title_en_label', 'USP Title (EN)')}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.title_en}
                                                    onChange={(e) => setData('title_en', e.target.value)}
                                                    placeholder={t('backoffice.usp.title_en_placeholder', 'e.g. Natural Product')}
                                                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-semibold"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                                    {t('backoffice.usp.desc_en_label', 'USP Description (EN)')}
                                                </label>
                                                <textarea
                                                    rows={2}
                                                    value={data.description_en}
                                                    onChange={(e) => setData('description_en', e.target.value)}
                                                    placeholder={t('backoffice.usp.desc_en_placeholder', 'e.g. Selected from pure, highest-quality natural ingredients...')}
                                                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {formLangTab === 'ar' && (
                                        <>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                                    {t('backoffice.usp.title_ar_label', 'USP Title (AR)')}
                                                </label>
                                                <input
                                                    type="text"
                                                    dir="rtl"
                                                    value={data.title_ar}
                                                    onChange={(e) => setData('title_ar', e.target.value)}
                                                    placeholder={t('backoffice.usp.title_ar_placeholder', 'مثال: منتج طبيعي')}
                                                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-right font-bold"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                                    {t('backoffice.usp.desc_ar_label', 'USP Description (AR)')}
                                                </label>
                                                <textarea
                                                    rows={2}
                                                    dir="rtl"
                                                    value={data.description_ar}
                                                    onChange={(e) => setData('description_ar', e.target.value)}
                                                    placeholder={t('backoffice.usp.desc_ar_placeholder', 'مثال: مختار من مكونات طبيعية نقية بأعلى جودة...')}
                                                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-right font-medium"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Background Image Section */}
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <label className="block text-xs font-bold text-slate-700">
                                    {t('backoffice.usp.bg_image_label', 'Gambar Background Kartu USP')}
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
                                            placeholder={t('backoffice.usp.bg_url_placeholder', 'Atau URL gambar (mis. /images/ups/natural.jpg)')}
                                            value={data.background_image_url}
                                            onChange={(e) => {
                                                setData('background_image_url', e.target.value);
                                                if (!data.background_image_file) setImagePreview(e.target.value);
                                            }}
                                            className="w-full px-2 py-1 text-[11px] border border-slate-200 rounded-md focus:outline-none font-mono"
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
                                    <span>{t('backoffice.usp.show_on_home', 'Tampilkan Kartu USP Ini di Beranda')}</span>
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
                                    {processing ? t('backoffice.common.saving', 'Menyimpan...') : t('backoffice.usp.save_btn', 'Simpan Kartu USP')}
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
                        <p className="text-xs text-slate-600">{t('backoffice.usp.delete_confirm_desc', 'Apakah Anda yakin ingin menghapus kartu USP ini?')}</p>
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

            {/* --- POP-UP ICON PICKER MODAL --- */}
            {iconPickerModalOpen && (
                <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
                        {/* Header */}
                        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
                            <h4 className="font-bold text-sm flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-emerald-400" />
                                {t('backoffice.usp.icon_picker_title', 'Pilih Icon Kartu USP')}
                            </h4>
                            <button
                                type="button"
                                onClick={() => setIconPickerModalOpen(false)}
                                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Search & Input Manual */}
                        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-2">
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={iconSearchText}
                                    onChange={(e) => setIconSearchText(e.target.value)}
                                    placeholder={t('backoffice.modal.icon_search_placeholder', 'Cari icon (mis. Leaf, Truck, CreditCard, Shield)...')}
                                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none bg-white font-medium shadow-xs"
                                />
                            </div>
                        </div>

                        {/* 50+ Icons Grid */}
                        <div className="p-4 max-h-80 overflow-y-auto">
                            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                                {filteredIcons.length === 0 ? (
                                    <div className="col-span-full py-8 text-center text-slate-400 text-xs">
                                        {t('backoffice.modal.icon_not_found', 'Icon tidak ditemukan. Coba kata kunci lain.')}
                                    </div>
                                ) : (
                                    filteredIcons.map((item) => {
                                        const IconComp = item.icon;
                                        const isSelected = data.icon === item.name;

                                        return (
                                            <button
                                                key={item.name}
                                                type="button"
                                                onClick={() => {
                                                    setData('icon', item.name);
                                                    setIconPickerModalOpen(false);
                                                }}
                                                title={`${item.name} (${t(`backoffice.icon_cat.${item.category}`, item.category)})`}
                                                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition ${
                                                    isSelected
                                                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-300'
                                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 hover:scale-105'
                                                }`}
                                            >
                                                <IconComp className="w-5 h-5 shrink-0" />
                                                <span className="text-[9px] truncate w-full text-center font-semibold">
                                                    {item.name}
                                                </span>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
