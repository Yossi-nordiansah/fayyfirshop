import React, { useState, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import {
    Edit2,
    Check,
    X,
    Upload,
    Image as ImageIcon,
    Eye,
    EyeOff,
    Globe,
    Link2,
    ExternalLink,
    Search,
    Star,
    Sparkles,
    
    // Icon Palette (50+ Lucide Icons)
    ShieldCheck, Shield, ShieldAlert, Lock, Key, CheckCircle, CheckCircle2, BadgeCheck, Badge,
    Award, Crown, Gem, Medal, Trophy, ThumbsUp, Heart, Smile,
    Leaf, Sun, Droplets, Flower, Flower2, Sprout, Apple,
    Truck, Package, PackageCheck, Send, MapPin, Compass, Box,
    Clock, Zap, Timer, Calendar, Hourglass,
    ShoppingBag, ShoppingCart, Tag, Percent, CreditCard, Gift, Store,
    Coffee, Flame, Feather, Info, Sparkle, Palette
} from 'lucide-react';
import { useLanguage } from '@/Contexts/LanguageContext';

export default function FeaturedProductTab({ featuredProducts = [] }) {
    const { t, locale } = useLanguage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

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
    const [activeIconTarget, setActiveIconTarget] = useState('feature_1'); // 'feature_1' | 'feature_2'
    const [iconSearchText, setIconSearchText] = useState('');

    // Single item from database (or empty)
    const featuredItem = featuredProducts && featuredProducts.length > 0 ? featuredProducts[0] : null;

    // Comprehensive list of 50+ icons
    const iconList = [
        { name: 'ShieldCheck', icon: ShieldCheck, category: 'Keamanan & Garansi' },
        { name: 'Shield', icon: Shield, category: 'Keamanan & Garansi' },
        { name: 'ShieldAlert', icon: ShieldAlert, category: 'Keamanan & Garansi' },
        { name: 'BadgeCheck', icon: BadgeCheck, category: 'Keamanan & Garansi' },
        { name: 'Badge', icon: Badge, category: 'Keamanan & Garansi' },
        { name: 'CheckCircle', icon: CheckCircle, category: 'Keamanan & Garansi' },
        { name: 'CheckCircle2', icon: CheckCircle2, category: 'Keamanan & Garansi' },
        { name: 'Lock', icon: Lock, category: 'Keamanan & Garansi' },
        { name: 'Key', icon: Key, category: 'Keamanan & Garansi' },

        { name: 'Award', icon: Award, category: 'Kualitas & Mewah' },
        { name: 'Crown', icon: Crown, category: 'Kualitas & Mewah' },
        { name: 'Star', icon: Star, category: 'Kualitas & Mewah' },
        { name: 'Sparkles', icon: Sparkles, category: 'Kualitas & Mewah' },
        { name: 'Sparkle', icon: Sparkle, category: 'Kualitas & Mewah' },
        { name: 'Gem', icon: Gem, category: 'Kualitas & Mewah' },
        { name: 'Medal', icon: Medal, category: 'Kualitas & Mewah' },
        { name: 'Trophy', icon: Trophy, category: 'Kualitas & Mewah' },
        { name: 'ThumbsUp', icon: ThumbsUp, category: 'Kualitas & Mewah' },
        { name: 'Heart', icon: Heart, category: 'Kualitas & Mewah' },
        { name: 'Smile', icon: Smile, category: 'Kualitas & Mewah' },

        { name: 'Leaf', icon: Leaf, category: 'Alami & Organik' },
        { name: 'Sun', icon: Sun, category: 'Alami & Organik' },
        { name: 'Droplets', icon: Droplets, category: 'Alami & Organik' },
        { name: 'Flower', icon: Flower, category: 'Alami & Organik' },
        { name: 'Flower2', icon: Flower2, category: 'Alami & Organik' },
        { name: 'Sprout', icon: Sprout, category: 'Alami & Organik' },
        { name: 'Apple', icon: Apple, category: 'Alami & Organik' },
        { name: 'Feather', icon: Feather, category: 'Alami & Organik' },

        { name: 'Truck', icon: Truck, category: 'Pengiriman & Layanan' },
        { name: 'Package', icon: Package, category: 'Pengiriman & Layanan' },
        { name: 'PackageCheck', icon: PackageCheck, category: 'Pengiriman & Layanan' },
        { name: 'Send', icon: Send, category: 'Pengiriman & Layanan' },
        { name: 'MapPin', icon: MapPin, category: 'Pengiriman & Layanan' },
        { name: 'Globe', icon: Globe, category: 'Pengiriman & Layanan' },
        { name: 'Compass', icon: Compass, category: 'Pengiriman & Layanan' },
        { name: 'Box', icon: Box, category: 'Pengiriman & Layanan' },

        { name: 'Clock', icon: Clock, category: 'Waktu & Kecepatan' },
        { name: 'Zap', icon: Zap, category: 'Waktu & Kecepatan' },
        { name: 'Timer', icon: Timer, category: 'Waktu & Kecepatan' },
        { name: 'Calendar', icon: Calendar, category: 'Waktu & Kecepatan' },
        { name: 'Hourglass', icon: Hourglass, category: 'Waktu & Kecepatan' },

        { name: 'ShoppingBag', icon: ShoppingBag, category: 'Belanja & Penawaran' },
        { name: 'ShoppingCart', icon: ShoppingCart, category: 'Belanja & Penawaran' },
        { name: 'Tag', icon: Tag, category: 'Belanja & Penawaran' },
        { name: 'Percent', icon: Percent, category: 'Belanja & Penawaran' },
        { name: 'CreditCard', icon: CreditCard, category: 'Belanja & Penawaran' },
        { name: 'Gift', icon: Gift, category: 'Belanja & Penawaran' },
        { name: 'Store', icon: Store, category: 'Belanja & Penawaran' },

        { name: 'Coffee', icon: Coffee, category: 'Aromatik & Lainnya' },
        { name: 'Flame', icon: Flame, category: 'Aromatik & Lainnya' },
        { name: 'Info', icon: Info, category: 'Aromatik & Lainnya' },
    ];

    const ICON_LOOKUP = iconList.reduce((acc, curr) => {
        acc[curr.name] = curr.icon;
        return acc;
    }, {});

    // Form state
    const { data, setData, post, processing, errors, reset, transform } = useForm({
        badge_id: '',
        badge_en: '',
        badge_ar: '',
        title_id: '',
        title_en: '',
        title_ar: '',
        description_id: '',
        description_en: '',
        description_ar: '',
        feature_1_icon: 'ShieldCheck',
        feature_1_title_id: '',
        feature_1_title_en: '',
        feature_1_title_ar: '',
        feature_1_desc_id: '',
        feature_1_desc_en: '',
        feature_1_desc_ar: '',
        feature_2_icon: 'Award',
        feature_2_title_id: '',
        feature_2_title_en: '',
        feature_2_title_ar: '',
        feature_2_desc_id: '',
        feature_2_desc_en: '',
        feature_2_desc_ar: '',
        button_text_id: '',
        button_text_en: '',
        button_text_ar: '',
        button_url: '',
        text_color: '',
        button_color: '',
        button_text_color: '',
        background_image_file: null,
        background_image_url: '',
        sort_order: 0,
        is_active: true,
    });

    const [imagePreview, setImagePreview] = useState(null);

    const openEditModal = (item) => {
        if (!item) return;
        setEditingItem(item);
        const badgeTrans = item.badge_translations || {};
        const titleTrans = item.title_translations || {};
        const descTrans = item.description_translations || {};
        const f1TitleTrans = item.feature_1_title_translations || {};
        const f1DescTrans = item.feature_1_desc_translations || {};
        const f2TitleTrans = item.feature_2_title_translations || {};
        const f2DescTrans = item.feature_2_desc_translations || {};
        const btnTextTrans = item.button_text_translations || {};

        setData({
            badge_id: badgeTrans.id || item.badge || '',
            badge_en: badgeTrans.en || '',
            badge_ar: badgeTrans.ar || '',
            title_id: titleTrans.id || item.title || '',
            title_en: titleTrans.en || '',
            title_ar: titleTrans.ar || '',
            description_id: descTrans.id || item.description || '',
            description_en: descTrans.en || '',
            description_ar: descTrans.ar || '',
            feature_1_icon: item.feature_1_icon || 'ShieldCheck',
            feature_1_title_id: f1TitleTrans.id || item.feature_1_title || '',
            feature_1_title_en: f1TitleTrans.en || '',
            feature_1_title_ar: f1TitleTrans.ar || '',
            feature_1_desc_id: f1DescTrans.id || item.feature_1_desc || '',
            feature_1_desc_en: f1DescTrans.en || '',
            feature_1_desc_ar: f1DescTrans.ar || '',
            feature_2_icon: item.feature_2_icon || 'Award',
            feature_2_title_id: f2TitleTrans.id || item.feature_2_title || '',
            feature_2_title_en: f2TitleTrans.en || '',
            feature_2_title_ar: f2TitleTrans.ar || '',
            feature_2_desc_id: f2DescTrans.id || item.feature_2_desc || '',
            feature_2_desc_en: f2DescTrans.en || '',
            feature_2_desc_ar: f2DescTrans.ar || '',
            button_text_id: btnTextTrans.id || item.button_text || '',
            button_text_en: btnTextTrans.en || '',
            button_text_ar: btnTextTrans.ar || '',
            button_url: item.button_url || '',
            text_color: item.text_color || '',
            button_color: item.button_color || '',
            button_text_color: item.button_text_color || '',
            background_image_file: null,
            background_image_url: item.background_image || '',
            sort_order: item.sort_order ?? 0,
            is_active: Boolean(item.is_active),
        });
        setImagePreview(item.background_image || null);
        setFormLangTab('id');
        setIconSearchText('');
        setIsModalOpen(true);
    };

    const openIconPickerPopUp = (target) => {
        setActiveIconTarget(target);
        setIconSearchText('');
        setIconPickerModalOpen(true);
    };

    const selectIconForTarget = (iconName) => {
        if (activeIconTarget === 'feature_1') {
            setData('feature_1_icon', iconName);
        } else {
            setData('feature_2_icon', iconName);
        }
        setIconPickerModalOpen(false);
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
            const hasF1 = Boolean(data.feature_1_title_id?.trim() || data.feature_1_desc_id?.trim());
            const hasF2 = Boolean(data.feature_2_title_id?.trim() || data.feature_2_desc_id?.trim());
            const hasBadge = Boolean(data.badge_id?.trim());
            const hasTitle = Boolean(data.title_id?.trim());
            const hasDesc = Boolean(data.description_id?.trim());
            const hasBtn = Boolean(data.button_text_id?.trim());

            transform((prevData) => ({
                ...prevData,
                badge_en: hasBadge ? prevData.badge_en : '',
                badge_ar: hasBadge ? prevData.badge_ar : '',
                title_en: hasTitle ? prevData.title_en : '',
                title_ar: hasTitle ? prevData.title_ar : '',
                description_en: hasDesc ? prevData.description_en : '',
                description_ar: hasDesc ? prevData.description_ar : '',
                feature_1_title_id: hasF1 ? prevData.feature_1_title_id : '',
                feature_1_desc_id: hasF1 ? prevData.feature_1_desc_id : '',
                feature_1_title_en: hasF1 ? prevData.feature_1_title_en : '',
                feature_1_desc_en: hasF1 ? prevData.feature_1_desc_en : '',
                feature_1_title_ar: hasF1 ? prevData.feature_1_title_ar : '',
                feature_1_desc_ar: hasF1 ? prevData.feature_1_desc_ar : '',
                feature_2_title_id: hasF2 ? prevData.feature_2_title_id : '',
                feature_2_desc_id: hasF2 ? prevData.feature_2_desc_id : '',
                feature_2_title_en: hasF2 ? prevData.feature_2_title_en : '',
                feature_2_desc_en: hasF2 ? prevData.feature_2_desc_en : '',
                feature_2_title_ar: hasF2 ? prevData.feature_2_title_ar : '',
                feature_2_desc_ar: hasF2 ? prevData.feature_2_desc_ar : '',
                button_text_en: hasBtn ? prevData.button_text_en : '',
                button_text_ar: hasBtn ? prevData.button_text_ar : '',
            }));

            post(`/backoffice/content/featured-product/${editingItem.id}`, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        }
    };

    const handleToggleActive = (id) => {
        router.patch(`/backoffice/content/featured-product/${id}/toggle-active`, {}, {
            preserveScroll: true,
        });
    };

    const renderSelectedIcon = (iconName) => {
        const IconComp = ICON_LOOKUP[iconName];
        if (IconComp) {
            return <IconComp className="w-5 h-5 text-amber-500 shrink-0" />;
        }
        return <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />;
    };

    const filteredIcons = iconList.filter(item =>
        item.name.toLowerCase().includes(iconSearchText.toLowerCase()) ||
        item.category.toLowerCase().includes(iconSearchText.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header (No Add Button) */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">
                        {t('backoffice.promo3.title', 'Promo Section 3 (Posisi Bawah - Di Bawah Produk Terlaris)')}
                    </h2>
                    <p className="text-xs text-slate-500">
                        {t('backoffice.promo3.subtitle', 'Kelola banner Promo Section 3 yang tampil di bawah daftar produk terlaris.')}
                    </p>
                </div>
            </div>

            {/* Display Single Featured Product Card */}
            {!featuredItem ? (
                <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400">
                    {t('backoffice.featured.loading', 'Memuat data Featured Product...')}
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            {featuredItem.badge && (
                                <span className="px-3 py-1 text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300 rounded-full">
                                    {featuredItem.badge_translations?.id || featuredItem.badge}
                                </span>
                            )}
                            <h3 className="text-base font-bold text-slate-900">
                                {featuredItem.title_translations?.id || featuredItem.title || <span className="text-slate-400 italic">(Tanpa Judul Utama)</span>}
                            </h3>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Toggle Active Status */}
                            <button
                                type="button"
                                onClick={() => handleToggleActive(featuredItem.id)}
                                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                                    featuredItem.is_active
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 shadow-xs'
                                        : 'bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100 shadow-xs'
                                }`}
                            >
                                {featuredItem.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                <span>{featuredItem.is_active ? t('backoffice.featured.status_active', 'Tampil di Beranda (Aktif)') : t('backoffice.featured.status_inactive', 'Sembunyikan dari Beranda (Non-Aktif)')}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => openEditModal(featuredItem)}
                                className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
                            >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>{t('backoffice.promo3.edit_btn', 'Edit Konten Promo Section 3')}</span>
                            </button>
                        </div>
                    </div>

                    {/* Summary Info Preview */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left: Background Preview */}
                        <div className="space-y-1">
                            <span className="block text-xs font-bold text-slate-500">{t('backoffice.featured.bg_label', 'Gambar Background Section')}</span>
                            <div className="w-full h-40 bg-slate-900 rounded-xl overflow-hidden border border-slate-200 relative shadow-inner">
                                {featuredItem.background_image ? (
                                    <img
                                        src={featuredItem.background_image}
                                        alt={featuredItem.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <ImageIcon className="w-8 h-8" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Middle: 3 Languages Preview */}
                        <div className="space-y-2 lg:col-span-2">
                            <span className="block text-xs font-bold text-slate-500">{t('backoffice.featured.desc_and_features_label', 'Deskripsi & Keunggulan (3 Bahasa)')}</span>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                                <div>
                                    <span className="font-bold text-slate-700">{t('backoffice.lang.indonesian', '🇮🇩 Bahasa Indonesia:')}</span>
                                    <p className="text-slate-600 mt-0.5 line-clamp-2">{featuredItem.description_translations?.id || featuredItem.description}</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-amber-100 rounded-lg text-amber-700">
                                            {renderSelectedIcon(featuredItem.feature_1_icon)}
                                        </div>
                                        <div>
                                            <span className="font-bold text-slate-800 block">{featuredItem.feature_1_title_translations?.id || featuredItem.feature_1_title}</span>
                                            <span className="text-[11px] text-slate-500 block">{featuredItem.feature_1_desc_translations?.id || featuredItem.feature_1_desc}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-amber-100 rounded-lg text-amber-700">
                                            {renderSelectedIcon(featuredItem.feature_2_icon)}
                                        </div>
                                        <div>
                                            <span className="font-bold text-slate-800 block">{featuredItem.feature_2_title_translations?.id || featuredItem.feature_2_title}</span>
                                            <span className="text-[11px] text-slate-500 block">{featuredItem.feature_2_desc_translations?.id || featuredItem.feature_2_desc}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-slate-600">
                                    <div>
                                        <span className="font-bold">{t('backoffice.featured.target_link_label', 'Target Link Tombol:')}</span>{' '}
                                        <span className="font-mono text-blue-600 font-semibold">{featuredItem.button_url || '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-[11px]">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-slate-400">Teks:</span>
                                            {featuredItem.text_color ? (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-200 bg-white font-mono font-bold" style={{ color: featuredItem.text_color }}>
                                                    <span className="w-2.5 h-2.5 rounded-full border border-slate-300" style={{ backgroundColor: featuredItem.text_color }} />
                                                    {featuredItem.text_color}
                                                </span>
                                            ) : (
                                                <span className="text-slate-500 font-medium">Default</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-slate-400">Tombol:</span>
                                            {featuredItem.button_color ? (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-200 bg-white font-mono font-bold" style={{ color: featuredItem.button_color }}>
                                                    <span className="w-2.5 h-2.5 rounded-full border border-slate-300" style={{ backgroundColor: featuredItem.button_color }} />
                                                    {featuredItem.button_color}
                                                </span>
                                            ) : (
                                                <span className="text-slate-500 font-medium">Default</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Edit Featured Product */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                    <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                            <h3 className="font-bold text-base flex items-center gap-2">
                                <Star className="w-4 h-4 text-amber-400" />
                                {t('backoffice.modal.edit_promo3_title', 'Edit Promo Section 3 (3 Bahasa & Pop-Up Icon)')}
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
                            {/* URL Target Settings */}
                            <div className="pb-3 border-b border-slate-100">
                                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 space-y-1">
                                    <label className="flex items-center gap-1.5 text-xs font-extrabold text-blue-950">
                                        <Link2 className="w-4 h-4 text-blue-600 shrink-0" />
                                        <span>{t('backoffice.featured.btn_target_url', 'URL Target Tombol "Beli Sekarang"')}</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.button_url}
                                        onChange={(e) => setData('button_url', e.target.value)}
                                        placeholder={t('backoffice.featured.url_placeholder', 'Contoh: https://fayyfirshop.com/products/arang-dan-mabkhara atau /products/kesehatan-dan-nutrisi')}
                                        className="w-full px-3 py-1.5 text-xs border border-blue-300 rounded-lg focus:outline-none focus:border-blue-600 bg-white font-mono"
                                    />
                                    <p className="text-[10px] text-blue-700">
                                        {t('backoffice.form.url_helper', 'Bisa diisi URL lengkap ("https://..."), path relatif ("/products/..."), atau slug ("kesehatan-dan-nutrisi").')}
                                    </p>
                                </div>
                            </div>

                            {/* 3 Languages Sub-Navigation Tabs */}
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                        <Globe className="w-4 h-4 text-blue-600" />
                                        <span>{t('backoffice.featured.lang_and_icons_label', 'Input Teks Terjemahan (3 Bahasa) & Icon Keunggulan')}</span>
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
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                                        {t('backoffice.featured.badge_id_label', 'Badge Atas (ID)')} <span className="text-[10px] text-slate-400 font-normal">(Opsional)</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={data.badge_id}
                                                        onChange={(e) => setData('badge_id', e.target.value)}
                                                        placeholder={t('backoffice.featured.badge_id_placeholder', 'Contoh: Special Premium Product')}
                                                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                                        {t('backoffice.featured.title_id_label', 'Judul Utama Produk (ID)')} <span className="text-[10px] text-slate-400 font-normal">(Opsional)</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={data.title_id}
                                                        onChange={(e) => setData('title_id', e.target.value)}
                                                        placeholder={t('backoffice.featured.title_id_placeholder', 'Kosongkan jika tidak ingin menampilkan judul')}
                                                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-semibold"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                                    {t('backoffice.featured.desc_id_label', 'Deskripsi Utama (ID)')}
                                                </label>
                                                <textarea
                                                    rows={2}
                                                    value={data.description_id}
                                                    onChange={(e) => setData('description_id', e.target.value)}
                                                    placeholder={t('backoffice.featured.desc_id_placeholder', 'Rasakan kemurnian madu Marai otentik...')}
                                                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                                                />
                                            </div>

                                            {/* Feature 1 ID with Icon Button */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                                        {t('backoffice.featured.feature_1_title_id_label', 'Judul Keunggulan 1 (ID) & Icon')}
                                                    </label>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => openIconPickerPopUp('feature_1')}
                                                            title={t('backoffice.featured.select_icon_1_title', 'Klik untuk memilih Icon Keunggulan 1')}
                                                            className="w-9 h-9 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg flex items-center justify-center text-amber-600 shrink-0 transition shadow-xs group"
                                                        >
                                                            {renderSelectedIcon(data.feature_1_icon)}
                                                        </button>
                                                        <input
                                                            type="text"
                                                            value={data.feature_1_title_id}
                                                            onChange={(e) => setData('feature_1_title_id', e.target.value)}
                                                            placeholder={t('backoffice.featured.feature_1_title_id_placeholder', 'Contoh: 100% Organik & Murni')}
                                                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                                        {t('backoffice.featured.feature_1_desc_id_label', 'Deskripsi Keunggulan 1 (ID)')}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={data.feature_1_desc_id}
                                                        onChange={(e) => setData('feature_1_desc_id', e.target.value)}
                                                        placeholder={t('backoffice.featured.feature_1_desc_id_placeholder', 'Contoh: Tanpa pemanis buatan...')}
                                                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
                                                    />
                                                </div>
                                            </div>

                                            {/* Feature 2 ID with Icon Button */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                                        {t('backoffice.featured.feature_2_title_id_label', 'Judul Keunggulan 2 (ID) & Icon')}
                                                    </label>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => openIconPickerPopUp('feature_2')}
                                                            title={t('backoffice.featured.select_icon_2_title', 'Klik untuk memilih Icon Keunggulan 2')}
                                                            className="w-9 h-9 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg flex items-center justify-center text-amber-600 shrink-0 transition shadow-xs group"
                                                        >
                                                            {renderSelectedIcon(data.feature_2_icon)}
                                                        </button>
                                                        <input
                                                            type="text"
                                                            value={data.feature_2_title_id}
                                                            onChange={(e) => setData('feature_2_title_id', e.target.value)}
                                                            placeholder={t('backoffice.featured.feature_2_title_id_placeholder', 'Contoh: Kualitas Ekstra Premium')}
                                                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                                        {t('backoffice.featured.feature_2_desc_id_label', 'Deskripsi Keunggulan 2 (ID)')}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={data.feature_2_desc_id}
                                                        onChange={(e) => setData('feature_2_desc_id', e.target.value)}
                                                        placeholder={t('backoffice.featured.feature_2_desc_id_placeholder', 'Contoh: Melalui proses kurasi...')}
                                                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
                                                    />
                                                </div>
                                            </div>

                                            {/* Button Text ID */}
                                            <div className="pt-2 border-t border-slate-100">
                                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                                    {t('backoffice.featured.btn_text_id_label', 'Teks Tombol (ID)')}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.button_text_id}
                                                    onChange={(e) => setData('button_text_id', e.target.value)}
                                                    placeholder={t('backoffice.featured.btn_text_id_placeholder', 'Contoh: Beli Sekarang')}
                                                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {formLangTab === 'en' && (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                                        {t('backoffice.featured.badge_en_label', 'Badge Tag (EN)')}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={data.badge_en}
                                                        onChange={(e) => setData('badge_en', e.target.value)}
                                                        placeholder={t('backoffice.featured.badge_en_placeholder', 'e.g. Special Premium Product')}
                                                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                                        {t('backoffice.featured.title_en_label', 'Main Title (EN)')}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={data.title_en}
                                                        onChange={(e) => setData('title_en', e.target.value)}
                                                        placeholder={t('backoffice.featured.title_en_placeholder', 'e.g. Alsharif Pure Honey Marai')}
                                                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none font-semibold"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                                    {t('backoffice.featured.desc_en_label', 'Main Description (EN)')}
                                                </label>
                                                <textarea
                                                    rows={2}
                                                    value={data.description_en}
                                                    onChange={(e) => setData('description_en', e.target.value)}
                                                    placeholder={t('backoffice.featured.desc_en_placeholder', 'Experience the purity of authentic Marai honey...')}
                                                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
                                                />
                                            </div>

                                            {/* Feature 1 EN */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                                        {t('backoffice.featured.feature_1_title_en_label', 'Feature 1 Title (EN) & Icon')}
                                                    </label>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => openIconPickerPopUp('feature_1')}
                                                            title={t('backoffice.featured.select_icon_1_title', 'Click to change Feature 1 Icon')}
                                                            className="w-9 h-9 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg flex items-center justify-center text-amber-600 shrink-0 transition shadow-xs"
                                                        >
                                                            {renderSelectedIcon(data.feature_1_icon)}
                                                        </button>
                                                        <input
                                                            type="text"
                                                            value={data.feature_1_title_en}
                                                            onChange={(e) => setData('feature_1_title_en', e.target.value)}
                                                            placeholder={t('backoffice.featured.feature_1_title_en_placeholder', 'e.g. 100% Organic & Pure')}
                                                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none font-medium"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                                        {t('backoffice.featured.feature_1_desc_en_label', 'Feature 1 Desc (EN)')}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={data.feature_1_desc_en}
                                                        onChange={(e) => setData('feature_1_desc_en', e.target.value)}
                                                        placeholder={t('backoffice.featured.feature_1_desc_en_placeholder', 'e.g. No artificial sweeteners...')}
                                                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
                                                    />
                                                </div>
                                            </div>

                                            {/* Feature 2 EN */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                                        {t('backoffice.featured.feature_2_title_en_label', 'Feature 2 Title (EN) & Icon')}
                                                    </label>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => openIconPickerPopUp('feature_2')}
                                                            title={t('backoffice.featured.select_icon_2_title', 'Click to change Feature 2 Icon')}
                                                            className="w-9 h-9 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg flex items-center justify-center text-amber-600 shrink-0 transition shadow-xs"
                                                        >
                                                            {renderSelectedIcon(data.feature_2_icon)}
                                                        </button>
                                                        <input
                                                            type="text"
                                                            value={data.feature_2_title_en}
                                                            onChange={(e) => setData('feature_2_title_en', e.target.value)}
                                                            placeholder={t('backoffice.featured.feature_2_title_en_placeholder', 'e.g. Extra Premium Quality')}
                                                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none font-medium"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                                        {t('backoffice.featured.feature_2_desc_en_label', 'Feature 2 Desc (EN)')}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={data.feature_2_desc_en}
                                                        onChange={(e) => setData('feature_2_desc_en', e.target.value)}
                                                        placeholder={t('backoffice.featured.feature_2_desc_en_placeholder', 'e.g. Through strict export...')}
                                                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
                                                    />
                                                </div>
                                            </div>

                                            {/* Button Text EN */}
                                            <div className="pt-2 border-t border-slate-100">
                                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                                    {t('backoffice.featured.btn_text_en_label', 'Button Text (EN)')}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.button_text_en}
                                                    onChange={(e) => setData('button_text_en', e.target.value)}
                                                    placeholder={t('backoffice.featured.btn_text_en_placeholder', 'e.g. Buy Now')}
                                                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {formLangTab === 'ar' && (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                                        {t('backoffice.featured.badge_ar_label', 'Badge Tag (AR)')}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        dir="rtl"
                                                        value={data.badge_ar}
                                                        onChange={(e) => setData('badge_ar', e.target.value)}
                                                        placeholder={t('backoffice.featured.badge_ar_placeholder', 'مثال: منتج فاخر خاص')}
                                                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none text-right font-medium"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                                        {t('backoffice.featured.title_ar_label', 'Main Title (AR)')}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        dir="rtl"
                                                        value={data.title_ar}
                                                        onChange={(e) => setData('title_ar', e.target.value)}
                                                        placeholder={t('backoffice.featured.title_ar_placeholder', 'مثال: عسل الشريف المري الصافي')}
                                                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none text-right font-bold"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                                    {t('backoffice.featured.desc_ar_label', 'Main Description (AR)')}
                                                </label>
                                                <textarea
                                                    rows={2}
                                                    dir="rtl"
                                                    value={data.description_ar}
                                                    onChange={(e) => setData('description_ar', e.target.value)}
                                                    placeholder={t('backoffice.featured.desc_ar_placeholder', 'استمتع بنقاء عسل المري الأصيل...')}
                                                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none text-right font-medium"
                                                />
                                            </div>

                                            {/* Feature 1 AR */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                                        {t('backoffice.featured.feature_1_title_ar_label', 'Feature 1 Title (AR) & Icon')}
                                                    </label>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => openIconPickerPopUp('feature_1')}
                                                            title={t('backoffice.featured.select_icon_1_title', 'انقر لتغيير الأيقونة 1')}
                                                            className="w-9 h-9 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg flex items-center justify-center text-amber-600 shrink-0 transition shadow-xs"
                                                        >
                                                            {renderSelectedIcon(data.feature_1_icon)}
                                                        </button>
                                                        <input
                                                            type="text"
                                                            dir="rtl"
                                                            value={data.feature_1_title_ar}
                                                            onChange={(e) => setData('feature_1_title_ar', e.target.value)}
                                                            placeholder={t('backoffice.featured.feature_1_title_ar_placeholder', 'مثال: 100٪ عضوي ونقي')}
                                                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none text-right font-medium"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                                        {t('backoffice.featured.feature_1_desc_ar_label', 'Feature 1 Desc (AR)')}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        dir="rtl"
                                                        value={data.feature_1_desc_ar}
                                                        onChange={(e) => setData('feature_1_desc_ar', e.target.value)}
                                                        placeholder={t('backoffice.featured.feature_1_desc_ar_placeholder', 'مثال: بدون محليات صناعية...')}
                                                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none text-right"
                                                    />
                                                </div>
                                            </div>

                                            {/* Feature 2 AR */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                                        {t('backoffice.featured.feature_2_title_ar_label', 'Feature 2 Title (AR) & Icon')}
                                                    </label>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => openIconPickerPopUp('feature_2')}
                                                            title={t('backoffice.featured.select_icon_2_title', 'انقر لتغيير الأيقونة 2')}
                                                            className="w-9 h-9 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg flex items-center justify-center text-amber-600 shrink-0 transition shadow-xs"
                                                        >
                                                            {renderSelectedIcon(data.feature_2_icon)}
                                                        </button>
                                                        <input
                                                            type="text"
                                                            dir="rtl"
                                                            value={data.feature_2_title_ar}
                                                            onChange={(e) => setData('feature_2_title_ar', e.target.value)}
                                                            placeholder={t('backoffice.featured.feature_2_title_ar_placeholder', 'مثال: جودة فاخرة إضافية')}
                                                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none text-right font-medium"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                                        {t('backoffice.featured.feature_2_desc_ar_label', 'Feature 2 Desc (AR)')}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        dir="rtl"
                                                        value={data.feature_2_desc_ar}
                                                        onChange={(e) => setData('feature_2_desc_ar', e.target.value)}
                                                        placeholder={t('backoffice.featured.feature_2_desc_ar_placeholder', 'مثال: من خلال عملية تقييم...')}
                                                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none text-right"
                                                    />
                                                </div>
                                            </div>

                                            {/* Button Text AR */}
                                            <div className="pt-2 border-t border-slate-100">
                                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                                    {t('backoffice.featured.btn_text_ar_label', 'Button Text (AR)')}
                                                </label>
                                                <input
                                                    type="text"
                                                    dir="rtl"
                                                    value={data.button_text_ar}
                                                    onChange={(e) => setData('button_text_ar', e.target.value)}
                                                    placeholder={t('backoffice.featured.btn_text_ar_placeholder', 'مثال: اشتر الآن')}
                                                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none text-right"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Color Customization Section */}
                            <div className="pt-4 border-t border-slate-100 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Palette className="w-4 h-4 text-blue-600" />
                                    <h4 className="text-xs font-bold text-slate-800">
                                        {t('backoffice.featured.color_settings_title', 'Kustomisasi Warna Teks & Tombol')}
                                    </h4>
                                    <span className="text-[10px] text-slate-400 font-normal">
                                        {t('backoffice.featured.color_settings_subtitle', '(Opsional - kosongkan untuk memakai warna tema bawaan)')}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {/* Warna Teks / Judul */}
                                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1.5">
                                        <label className="block text-xs font-semibold text-slate-700">
                                            {t('backoffice.featured.text_color_label', 'Warna Teks & Judul')}
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={data.text_color || '#ffffff'}
                                                onChange={(e) => setData('text_color', e.target.value)}
                                                className="w-8 h-8 rounded-md border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0"
                                            />
                                            <input
                                                type="text"
                                                value={data.text_color}
                                                onChange={(e) => setData('text_color', e.target.value)}
                                                placeholder="#ffffff (Default)"
                                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md font-mono focus:outline-none focus:border-blue-500 bg-white"
                                            />
                                            {data.text_color && (
                                                <button
                                                    type="button"
                                                    onClick={() => setData('text_color', '')}
                                                    title="Reset ke Default"
                                                    className="text-[10px] text-rose-500 hover:text-rose-700 px-1.5 py-1 rounded bg-rose-50 hover:bg-rose-100 shrink-0 font-medium transition"
                                                >
                                                    Reset
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Warna Background Tombol */}
                                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1.5">
                                        <label className="block text-xs font-semibold text-slate-700">
                                            {t('backoffice.featured.button_color_label', 'Warna Background Tombol')}
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={data.button_color || '#f59e0b'}
                                                onChange={(e) => setData('button_color', e.target.value)}
                                                className="w-8 h-8 rounded-md border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0"
                                            />
                                            <input
                                                type="text"
                                                value={data.button_color}
                                                onChange={(e) => setData('button_color', e.target.value)}
                                                placeholder="Warna Tema (Default)"
                                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md font-mono focus:outline-none focus:border-blue-500 bg-white"
                                            />
                                            {data.button_color && (
                                                <button
                                                    type="button"
                                                    onClick={() => setData('button_color', '')}
                                                    title="Reset ke Default"
                                                    className="text-[10px] text-rose-500 hover:text-rose-700 px-1.5 py-1 rounded bg-rose-50 hover:bg-rose-100 shrink-0 font-medium transition"
                                                >
                                                    Reset
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Warna Teks Tombol */}
                                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1.5">
                                        <label className="block text-xs font-semibold text-slate-700">
                                            {t('backoffice.featured.button_text_color_label', 'Warna Teks Tombol')}
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={data.button_text_color || '#1e1b4b'}
                                                onChange={(e) => setData('button_text_color', e.target.value)}
                                                className="w-8 h-8 rounded-md border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0"
                                            />
                                            <input
                                                type="text"
                                                value={data.button_text_color}
                                                onChange={(e) => setData('button_text_color', e.target.value)}
                                                placeholder="Warna Teks (Default)"
                                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md font-mono focus:outline-none focus:border-blue-500 bg-white"
                                            />
                                            {data.button_text_color && (
                                                <button
                                                    type="button"
                                                    onClick={() => setData('button_text_color', '')}
                                                    title="Reset ke Default"
                                                    className="text-[10px] text-rose-500 hover:text-rose-700 px-1.5 py-1 rounded bg-rose-50 hover:bg-rose-100 shrink-0 font-medium transition"
                                                >
                                                    Reset
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Background Image Section */}
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <label className="block text-xs font-bold text-slate-700">
                                    {t('backoffice.featured.bg_image_label', 'Gambar Background Featured Product')}
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
                                            placeholder={t('backoffice.featured.bg_url_placeholder', 'Atau URL gambar (mis. /images/featured-product/...)')}
                                            value={data.background_image_url}
                                            onChange={(e) => {
                                                setData('background_image_url', e.target.value);
                                                if (!data.background_image_file) setImagePreview(e.target.value);
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
                                    <span>{t('backoffice.featured.show_on_home', 'Tampilkan Banner Ini di Beranda')}</span>
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
                                    {processing ? t('backoffice.common.saving', 'Menyimpan...') : t('backoffice.promo3.save_btn', 'Simpan Promo Section 3')}
                                </button>
                            </div>
                        </form>
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
                                <Sparkles className="w-4 h-4 text-amber-400" />
                                {t('backoffice.featured.select_icon_modal_title', 'Pilih Icon Keunggulan')}
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
                                    placeholder={t('backoffice.modal.icon_search_placeholder', 'Cari icon (mis. Shield, Crown, Leaf, Truck, Award)...')}
                                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none bg-white font-medium shadow-xs"
                                />
                            </div>
                            <p className="text-[10px] text-slate-500 px-1">
                                {t('backoffice.modal.icon_picker_subtitle', 'Klik salah satu icon di bawah ini untuk memilih dan menerapkannya secara langsung.')}
                            </p>
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
                                        const currentVal = activeIconTarget === 'feature_1' ? data.feature_1_icon : data.feature_2_icon;
                                        const isSelected = currentVal === item.name;

                                        return (
                                            <button
                                                key={item.name}
                                                type="button"
                                                onClick={() => selectIconForTarget(item.name)}
                                                title={`${item.name} (${t(`backoffice.icon_cat.${item.category}`, item.category)})`}
                                                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition ${
                                                    isSelected
                                                        ? 'bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-300'
                                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300 hover:scale-105'
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
