import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Globe, Layers, Package, Tag, Edit3, DollarSign, Archive, ShieldAlert, X } from 'lucide-react';
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useLanguage } from '@/Contexts/LanguageContext';

const getTranslatedType = (type, t) => {
    if (!type) return '';
    const lower = type.toLowerCase();
    if (['ukuran', 'warna', 'rasa', 'model', 'bahan'].includes(lower)) {
        return t('backoffice.product.form.preset_type.' + lower, type);
    }
    if (lower === 'custom') {
        return t('backoffice.product.form.sub_variant_type_custom', 'Kustom');
    }
    return type;
};

const getTranslation = (translations, lang, fallback) => {
    if (!translations) return fallback;
    let obj = translations;
    if (typeof translations === 'string') {
        try {
            obj = JSON.parse(translations);
        } catch (e) {
            return fallback;
        }
    }
    return obj?.[lang] || fallback;
};

export default function ProductDetail({ product, storeBranches = [], units = [] }) {
    const { t, locale } = useLanguage();
    const [activeLang, setActiveLang] = useState(locale || 'indonesia');

    useEffect(() => {
        if (locale) {
            setActiveLang(locale);
        }
    }, [locale]);

    console.log("Product Detail Language Debug:", {
        activeLang,
        locale,
        categoryNameTranslations: product.category?.name_translations,
        subCategoryNameTranslations: product.sub_category?.name_translations
    });

    const activeLangLabel = useMemo(() => {
        if (activeLang === 'indonesia') return t('backoffice.product.modal.lang_id', 'Indonesia');
        if (activeLang === 'arabic') return t('backoffice.product.modal.lang_ar', 'Arab (العربية)');
        if (activeLang === 'english') return t('backoffice.product.modal.lang_en', 'Inggris');
        return activeLang;
    }, [activeLang, t]);
    const [activeImageIdx, setActiveImageIdx] = useState(0);
    const [previewImage, setPreviewImage] = useState(null);

    const languageTabs = useMemo(() => [
        { id: 'indonesia', label: 'Indonesia' },
        { id: 'arabic', label: 'Arab (العربية)' },
        { id: 'english', label: 'English' },
    ], []);

    const formatIDR = (value) => {
        if (value === undefined || value === null || value === '') return '-';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(value);
    };

    // Helper to group flat database variants into parent-sub-variant structure
    const groupedVariants = useMemo(() => {
        if (!product.variants || product.variants.length === 0) return [];

        const parentGroups = {};

        product.variants.forEach(v => {
            const indonesiaName = v.name_translations?.indonesia || v.name || '';
            const englishName = v.name_translations?.english || '';
            const arabicName = v.name_translations?.arabic || '';

            // Extract suffixes in parentheses at the end of the string
            const regex = /\(([^)]+)\)/g;
            const matchesIndo = [...indonesiaName.matchAll(regex)].map(m => m[1]);
            const matchesEng = [...englishName.matchAll(regex)].map(m => m[1]);
            const matchesAra = [...arabicName.matchAll(regex)].map(m => m[1]);

            const cleanName = (str) => str.replace(/\s*\([^)]+\)/g, '').trim();
            const parentNameIndo = cleanName(indonesiaName);
            const parentNameEng = cleanName(englishName);
            const parentNameAra = cleanName(arabicName);

            // If type contains '|', split it
            let parentType = v.type || '';
            let subType = null;
            if (parentType.includes(' | ')) {
                const parts = parentType.split(' | ');
                parentType = parts[0].trim();
                subType = parts[1].trim();
            }

            const parentKey = `${parentType}_${parentNameIndo}`;
            const hasSub = matchesIndo.length > 0;

            if (!parentGroups[parentKey]) {
                // Extract type_translations
                let parentTypeTranslations = { indonesia: parentType, english: parentType, arabic: parentType };
                let subTypeTranslations = null;
                if (v.type_translations) {
                    const tObj = typeof v.type_translations === 'string' ? JSON.parse(v.type_translations) : v.type_translations;
                    const splitT = (str) => str && str.includes(' | ') ? str.split(' | ').map(s => s.trim()) : [str?.trim() || '', null];
                    const [pI, sI] = splitT(tObj?.indonesia || '');
                    const [pE, sE] = splitT(tObj?.english || '');
                    const [pA, sA] = splitT(tObj?.arabic || '');
                    parentTypeTranslations = { indonesia: pI || parentType, english: pE || pI || parentType, arabic: pA || pI || parentType };
                    if (sI || sE || sA) {
                        subTypeTranslations = { indonesia: sI || '', english: sE || sI || '', arabic: sA || sI || '' };
                    }
                }

                parentGroups[parentKey] = {
                    id: hasSub ? null : v.id,
                    type: parentType,
                    type_translations: parentTypeTranslations,
                    sku: hasSub ? '' : v.sku,
                    price: hasSub ? '' : v.price,
                    unit_id: hasSub ? '' : v.unit_id,
                    image: v.image,
                    imagePreview: hasSub ? null : (v.image ? `/storage/${v.image}` : null),
                    name_translations: {
                        indonesia: parentNameIndo,
                        english: parentNameEng,
                        arabic: parentNameAra,
                    },
                    has_sub_variants: hasSub,
                    sub_variants: [],
                    _subTypeTranslations: subTypeTranslations,
                    branch_stocks: hasSub ? [] : storeBranches.map(branch => {
                        const existing = v.branch_stocks?.find(s => s.store_branch_id === branch.id) || v.stocks?.find(s => s.store_branch_id === branch.id);
                        return {
                            store_branch_id: branch.id,
                            branch_name: branch.name,
                            country_code: branch.country_code,
                            stock: existing?.stock ?? 0
                        };
                    }),
                };
            }

            if (hasSub) {
                const valIndo = matchesIndo[0] || '';
                const valEng = matchesEng[0] || '';
                const valAra = matchesAra[0] || '';

                let isUnitSize = false;
                let parsedSize = valIndo;
                let subUnitId = '';

                if (v.unit_id) {
                    const foundUnit = units.find(u => {
                        const name = u.name.toLowerCase();
                        return valIndo.toLowerCase().includes(name);
                    });
                    if (foundUnit) {
                        isUnitSize = true;
                        subUnitId = String(foundUnit.id);
                        parsedSize = valIndo.replace(new RegExp(foundUnit.name, 'i'), '').trim();
                    } else if (/^\d+$/.test(valIndo.trim())) {
                        isUnitSize = true;
                        subUnitId = String(v.unit_id);
                    }
                }

                parentGroups[parentKey].sub_variants.push({
                    id: v.id,
                    type: subType || (isUnitSize ? 'Ukuran' : 'Custom'),
                    type_translations: parentGroups[parentKey]._subTypeTranslations || {
                        indonesia: subType || (isUnitSize ? 'Ukuran' : 'Custom'),
                        english: subType || (isUnitSize ? 'Size' : 'Custom'),
                        arabic: subType || (isUnitSize ? 'المقاس' : 'مخصص'),
                    },
                    name_translations: {
                        indonesia: parsedSize,
                        english: isUnitSize && subUnitId ? valEng.replace(new RegExp(units.find(u => u.id === Number(subUnitId))?.name || '', 'i'), '').trim() : valEng,
                        arabic: isUnitSize && subUnitId ? valAra.replace(new RegExp(units.find(u => u.id === Number(subUnitId))?.name || '', 'i'), '').trim() : valAra,
                    },
                    unit_id: subUnitId || '',
                    sku: v.sku || '',
                    price: v.price || '',
                    image: v.image,
                    imagePreview: v.image ? `/storage/${v.image}` : null,
                    branch_stocks: storeBranches.map(branch => {
                        const existing = v.branch_stocks?.find(s => s.store_branch_id === branch.id) || v.stocks?.find(s => s.store_branch_id === branch.id);
                        return {
                            store_branch_id: branch.id,
                            branch_name: branch.name,
                            country_code: branch.country_code,
                            stock: existing?.stock ?? 0
                        };
                    }),
                });
            }
        });

        // Set parent virtual preview image if it has sub-variants but no parent image
        Object.values(parentGroups).forEach(group => {
            if (group.has_sub_variants && !group.imagePreview) {
                const firstWithImage = group.sub_variants.find(sv => sv.image);
                if (firstWithImage) {
                    group.imagePreview = `/storage/${firstWithImage.image}`;
                } else if (group.image) {
                    group.imagePreview = `/storage/${group.image}`;
                }
            }
        });

        return Object.values(parentGroups);
    }, [product.variants, storeBranches, units]);

    // Product gallery images list
    const galleryImages = useMemo(() => {
        if (!product.images || product.images.length === 0) return [];
        return [...product.images].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    }, [product.images]);

    const activeImageSrc = useMemo(() => {
        if (galleryImages.length === 0) return null;
        const activeImg = galleryImages[activeImageIdx] || galleryImages[0];
        return `/storage/${activeImg.image_path}`;
    }, [galleryImages, activeImageIdx]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-950 selection:text-white">
            <Head title={`${product.name_translations?.[activeLang] || product.title} — ${t('backoffice.product.title.detail', 'Detail Produk')}`} />
 
            <div className="flex min-h-screen">
                <Sidebar />
                <main className="flex min-w-0 flex-1 flex-col">
                    <Navbar />
                    <div className="flex-1 space-y-6 p-6 lg:p-8">
 
                        {/* ── Header ─────────────────────────────────────── */}
                        <section className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
                            <div>
                                <span className="text-xs font-bold uppercase tracking-widest text-amber-600">{t('backoffice.product.detail.catalog_hub', 'Fayyfir Catalog Hub')}</span>
                                <h1 className="mt-1 text-3xl font-black tracking-tight text-blue-950 lg:text-4xl">
                                    {t('backoffice.product.title.modal', 'Detail Informasi Produk')}
                                </h1>
                            </div>
                            <div className="flex items-center gap-3">
                                <Link
                                    href={route('backoffice.products.index')}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-blue-950 active:scale-95"
                                >
                                    <ArrowLeft className="h-4 w-4" /> {t('backoffice.product.form.btn_back', 'Kembali')}
                                </Link>
                                <Link
                                    href={route('backoffice.products.edit', product.slug)}
                                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-950 to-blue-900 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-950/10 transition hover:opacity-95 active:scale-95"
                                >
                                    <Edit3 className="h-4 w-4 text-amber-400" /> {t('backoffice.product.tooltip_edit', 'Edit Produk')}
                                </Link>
                            </div>
                        </section>

                        {/* ── Product Body Grid ─────────────────────────── */}
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

                            {/* LEFT COLUMN: Gallery & Main Info */}
                            <div className="space-y-6 lg:col-span-1">
                                {/* Image Viewer Card */}
                                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                                    <div className="relative aspect-square overflow-hidden rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center">
                                        {activeImageSrc ? (
                                            <img
                                                src={activeImageSrc}
                                                alt="product primary"
                                                className="h-full w-full object-cover transition-all duration-300"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                                <Package className="h-16 w-16 stroke-[1.2]" />
                                                <span className="text-xs">{t('backoffice.product.detail.no_image', 'Tidak ada gambar')}</span>
                                            </div>
                                        )}
                                    </div>
 
                                    {/* Thumbnails */}
                                    {galleryImages.length > 1 && (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {galleryImages.map((img, idx) => (
                                                <button
                                                    key={img.id}
                                                    type="button"
                                                    onClick={() => setActiveImageIdx(idx)}
                                                    className={`relative h-14 w-14 overflow-hidden rounded-lg border transition ${activeImageIdx === idx
                                                        ? 'border-blue-950 ring-2 ring-blue-950/10'
                                                        : 'border-slate-200 hover:border-slate-400'
                                                        }`}
                                                >
                                                    <img
                                                        src={`/storage/${img.image_path}`}
                                                        alt="thumbnail"
                                                        className="h-full w-full object-cover"
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
 
                                {/* Financials & SKU Badge */}
                                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">{t('backoffice.product.modal.centralized_price', 'Harga Basis Terpusat')}</span>
                                        <span className="text-2xl font-black text-blue-950">{formatIDR(product.price)}</span>
                                    </div>
                                    <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">{t('backoffice.product.th_sku', 'SKU Induk')}</span>
                                            <span className="font-mono text-sm font-bold text-slate-700">{product.sku}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">{t('backoffice.product.detail.total_stock', 'Total Stok')}</span>
                                            <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-bold text-blue-950">
                                                {product.stock ?? 0} Pcs
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: Localization & Description & Variants */}
                            <div className="space-y-6 lg:col-span-2">
                                {/* Localization Section */}
                                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-5">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                        <h3 className="text-sm font-black uppercase tracking-wider text-blue-950">{t('backoffice.product.form.lang_title', 'Bahasa Konten')}</h3>
                                    </div>

                                    {/* Lang switcher buttons */}
                                    <div className="inline-flex gap-1.5 rounded-xl bg-slate-100 p-1">
                                        {languageTabs.map(tab => {
                                            let label = tab.label;
                                            if (tab.id === 'indonesia') label = t('backoffice.product.modal.lang_id', 'Indonesia');
                                            else if (tab.id === 'arabic') label = t('backoffice.product.modal.lang_ar', 'Arab (العربية)');
                                            else if (tab.id === 'english') label = t('backoffice.product.modal.lang_en', 'Inggris');
                                            return (
                                                <button
                                                    key={tab.id}
                                                    type="button"
                                                    onClick={() => setActiveLang(tab.id)}
                                                    className={`rounded-lg px-3 py-1.5 text-xs font-black transition ${activeLang === tab.id
                                                        ? 'bg-white text-blue-950 shadow-sm'
                                                        : 'text-slate-500 hover:text-slate-800'
                                                        }`}
                                                >
                                                    {label}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Name & Description translations */}
                                    <div className="space-y-4">
                                        {!product.name_translations?.[activeLang] && !product.description_translations?.[activeLang] ? (
                                            <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 text-xs font-semibold text-amber-700 flex items-center gap-2">
                                                <ShieldAlert className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                                <span>{t('backoffice.product.detail.no_lang_warn', '(belum ada bahasa {lang} di product ini)').replace('{lang}', activeLangLabel)}</span>
                                            </div>
                                        ) : (
                                            <>
                                                <div>
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">{t('backoffice.product.name', 'Nama Produk')} ({activeLangLabel})</span>
                                                    <h2 className="text-xl font-extrabold text-blue-950" dir={activeLang === 'arabic' ? 'rtl' : 'ltr'}>
                                                        {product.name_translations?.[activeLang] || (
                                                            <span className="text-slate-400 font-normal text-xs italic">
                                                                {t('backoffice.product.detail.no_lang_warn', '(belum ada bahasa {lang} di product ini)').replace('{lang}', activeLangLabel)}
                                                            </span>
                                                        )}
                                                    </h2>
                                                </div>
                                                <div className="border-t border-slate-100 pt-3">
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">{t('backoffice.product.desc', 'Deskripsi Produk')} ({activeLangLabel})</span>
                                                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line" dir={activeLang === 'arabic' ? 'rtl' : 'ltr'}>
                                                        {product.description_translations?.[activeLang] || (
                                                            <span className="text-slate-400 text-xs italic">
                                                                {t('backoffice.product.detail.no_lang_warn', '(belum ada bahasa {lang} di product ini)').replace('{lang}', activeLangLabel)}
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Category Classification */}
                                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                                    <h3 className="text-sm font-black uppercase tracking-wider text-blue-950 mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                                        <Tag className="h-4 w-4 text-amber-500" /> {t('backoffice.product.detail.category_classification', 'Kategori & Klasifikasi')}
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                                            <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">{t('backoffice.product.form.main_category', 'Kategori Utama')}</span>
                                            <span className="text-sm font-bold text-blue-950">{getTranslation(product.category?.name_translations, activeLang, product.category?.name || t('backoffice.product.uncategorized', 'Tanpa Kategori'))}</span>
                                        </div>
                                        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                                            <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">{t('backoffice.product.form.sub_category', 'Sub Kategori')}</span>
                                            <span className="text-sm font-bold text-blue-950">{getTranslation(product.sub_category?.name_translations, activeLang, product.sub_category?.name || t('backoffice.product.modal.no_subcategory', 'Tanpa Sub Kategori'))}</span>
                                        </div>
                                    </div>
                                </div>

                        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                            <h3 className="text-base font-black text-blue-950 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                                <Layers className="h-5 w-5 text-amber-500" />
                                {t('backoffice.product.detail.variant_composition', 'Komposisi Varian & Alokasi Inventaris Cabang')}
                            </h3>
 
                            {/* Option 1: No variants */}
                            {groupedVariants.length === 0 ? (
                                <div className="space-y-4">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                                        {t('backoffice.product.detail.single_mode_label', '💡 Produk Tunggal (Tanpa Varian)')}
                                    </span>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                        {storeBranches.map(branch => {
                                            const stockVal = product.branch_stocks?.find(s => s.store_branch_id === branch.id)?.stock ?? 0;
                                            return (
                                                <div key={branch.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-center">
                                                    <span className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-1">
                                                        {branch.country_code ? branch.country_code.toUpperCase() : branch.name}
                                                    </span>
                                                    <span className="text-lg font-extrabold text-blue-950">{stockVal} Pcs</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                /* Option 2: Has variants list */
                                <div className="space-y-6">
                                    {groupedVariants.map((variant, vIdx) => {
                                        return (
                                            <div
                                                key={`${variant.type}-${vIdx}`}
                                                className="rounded-2xl border border-slate-100 bg-slate-50/30 p-5 space-y-4"
                                            >
                                                {/* Variant Header Card */}
                                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-950 text-[10px] font-black text-white">
                                                            #{vIdx + 1}
                                                        </span>
                                                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-950">
                                                            {variant.type_translations?.[activeLang] || getTranslatedType(variant.type, t)}
                                                        </span>
                                                        <span className="text-sm font-bold text-blue-950">
                                                            {variant.name_translations?.[activeLang] || '-'}
                                                        </span>
                                                    </div>
 
                                                    {/* Segmented Control Display */}
                                                    <span className="rounded-lg bg-white border border-slate-200 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                                                        {variant.has_sub_variants ? t('backoffice.product.form.has_sub_variant', 'Dengan Sub-Varian') : t('backoffice.product.form.no_sub_variant', 'Tanpa Sub-Varian')}
                                                    </span>
                                                </div>
 
                                                {/* Variant layout rendering */}
                                                {!variant.has_sub_variants ? (
                                                    /* Layout A: Tanpa Sub Variant */
                                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                                        {/* Image */}
                                                        <div className="sm:col-span-1 flex items-center gap-3">
                                                            <div
                                                                className={`h-16 w-16 overflow-hidden rounded-xl border border-slate-200 bg-white flex items-center justify-center flex-shrink-0 ${variant.imagePreview ? 'cursor-pointer hover:opacity-90 hover:border-blue-950 transition' : ''}`}
                                                                onClick={() => variant.imagePreview && setPreviewImage(variant.imagePreview)}
                                                            >
                                                                {variant.imagePreview ? (
                                                                    <img src={variant.imagePreview} alt="variant" className="h-full w-full object-cover" />
                                                                ) : (
                                                                    <Archive className="h-6 w-6 text-slate-300 stroke-[1.5]" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">{t('backoffice.product.form.variant_sku', 'SKU Varian')}</span>
                                                                <span className="font-mono text-xs font-bold text-slate-800">{variant.sku || '-'}</span>
                                                            </div>
                                                        </div>
 
                                                        {/* Unit & Price */}
                                                        <div className="sm:col-span-1 grid grid-cols-2 gap-2">
                                                            <div>
                                                                <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">{t('backoffice.product.detail.price_label', 'Harga')}</span>
                                                                <span className="text-xs font-extrabold text-blue-950">
                                                                    {variant.price ? formatIDR(variant.price) : formatIDR(product.price)}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">{t('backoffice.product.form.variant_unit', 'Satuan (Unit)')}</span>
                                                                <span className="text-xs font-bold text-slate-700">
                                                                    {units.find(u => String(u.id) === String(variant.unit_id))?.name || '-'}
                                                                </span>
                                                            </div>
                                                        </div>
 
                                                        {/* Branch stock values */}
                                                        <div className="sm:col-span-1">
                                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">{t('backoffice.product.form.branch_stock', 'Stok Cabang Gudang')}</span>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                {variant.branch_stocks.map(bStock => (
                                                                    <div key={bStock.store_branch_id} className="rounded-lg border border-slate-100 bg-white p-1 text-center">
                                                                        <span className="text-[9px] font-black uppercase text-slate-400 block">
                                                                            {bStock.country_code ? bStock.country_code.toUpperCase() : bStock.branch_name}
                                                                        </span>
                                                                        <span className="text-xs font-extrabold text-blue-950">{bStock.stock}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    /* Layout B: Dengan Sub Variant */
                                                    <div className="space-y-4">
                                                        {/* Parent image detail */}
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className={`h-12 w-12 overflow-hidden rounded-lg border border-slate-200 bg-white flex items-center justify-center flex-shrink-0 ${variant.imagePreview ? 'cursor-pointer hover:opacity-90 hover:border-blue-950 transition' : ''}`}
                                                                onClick={() => variant.imagePreview && setPreviewImage(variant.imagePreview)}
                                                            >
                                                                {variant.imagePreview ? (
                                                                    <img src={variant.imagePreview} alt="parent variant" className="h-full w-full object-cover" />
                                                                ) : (
                                                                    <Archive className="h-5 w-5 text-slate-300 stroke-[1.5]" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] font-black uppercase text-slate-400 block">{t('backoffice.product.detail.parent_variant_image', 'Gambar Induk Varian')}</span>
                                                                <span className="text-xs text-slate-500 italic">{t('backoffice.product.detail.parent_variant_image_hint', 'Sub-varian terkelompok di bawah warna/varian induk ini.')}</span>
                                                            </div>
                                                        </div>

                                                        {/* Sub-variant matrix tables */}
                                                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-inner">
                                                            <div className="overflow-x-auto">
                                                                <table className="w-full border-collapse text-left text-xs text-slate-600">
                                                                    <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200">
                                                                        <tr>
                                                                            <th className="px-4 py-2">{t('backoffice.product.detail.table.image', 'Gambar')}</th>
                                                                            <th className="px-4 py-2">{t('backoffice.product.detail.table.type_value', 'Tipe / Nilai')}</th>
                                                                            <th className="px-4 py-2">{t('backoffice.product.form.sub_variant_sku', 'SKU Sub-Varian')}</th>
                                                                            <th className="px-4 py-2">{t('backoffice.product.form.variant_price', 'Harga (IDR)')}</th>
                                                                            <th className="px-4 py-2">{t('backoffice.product.form.variant_unit', 'Satuan (Unit)')}</th>
                                                                            <th className="px-4 py-2 text-center">{t('backoffice.product.form.branch_stock', 'Stok Cabang Gudang')}</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-100 font-medium">
                                                                        {variant.sub_variants.map((sv, svIdx) => {
                                                                            return (
                                                                                <tr key={sv.id || svIdx} className="hover:bg-slate-50/50 transition">
                                                                                    <td className="px-4 py-2.5">
                                                                                        <div
                                                                                            className={`h-8 w-8 overflow-hidden rounded border border-slate-100 bg-slate-50 flex items-center justify-center ${sv.imagePreview ? 'cursor-pointer hover:opacity-90 hover:border-blue-950 transition' : ''}`}
                                                                                            onClick={() => sv.imagePreview && setPreviewImage(sv.imagePreview)}
                                                                                        >
                                                                                            {sv.imagePreview ? (
                                                                                                <img src={sv.imagePreview} alt="sub variant" className="h-full w-full object-cover" />
                                                                                            ) : (
                                                                                                <Package className="h-4 w-4 text-slate-300" />
                                                                                            )}
                                                                                        </div>
                                                                                    </td>
                                                                                    <td className="px-4 py-2.5">
                                                                                        <div className="flex flex-col">
                                                                                            <span className="font-bold text-blue-950">{sv.name_translations?.[activeLang] || '-'}</span>
                                                                                            <span className="text-[9px] text-slate-400">{sv.type_translations?.[activeLang] || getTranslatedType(sv.type, t)}</span>
                                                                                        </div>
                                                                                    </td>
                                                                                    <td className="px-4 py-2.5 font-mono font-bold text-slate-700">
                                                                                        {sv.sku || '-'}
                                                                                    </td>
                                                                                    <td className="px-4 py-2.5 font-bold text-slate-800">
                                                                                        {sv.price ? formatIDR(sv.price) : formatIDR(product.price)}
                                                                                    </td>
                                                                                    <td className="px-4 py-2.5 text-slate-600">
                                                                                        {units.find(u => String(u.id) === String(sv.unit_id))?.name || '-'}
                                                                                    </td>
                                                                                    <td className="px-4 py-2.5">
                                                                                        <div className="flex justify-center gap-1.5">
                                                                                            {sv.branch_stocks.map(bStock => (
                                                                                                <div key={bStock.store_branch_id} className="rounded border border-slate-100 bg-slate-50/50 px-2 py-0.5 text-center min-w-[40px]">
                                                                                                    <span className="text-[8px] font-black uppercase text-slate-400 block leading-none mb-0.5">
                                                                                                        {bStock.country_code ? bStock.country_code.toUpperCase() : bStock.branch_name}
                                                                                                    </span>
                                                                                                    <span className="text-[10px] font-black text-blue-950 leading-none">{bStock.stock}</span>
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>

            {/* Image Preview Modal Overlay */}
            <AnimatePresence>
                {previewImage && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setPreviewImage(null)}
                            className="fixed inset-0 z-50 bg-blue-950/60 backdrop-blur-xs flex items-center justify-center p-4"
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl p-2"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <img src={previewImage} alt="preview" className="w-full h-auto max-h-[80vh] object-contain rounded-xl" />
                                <button
                                    type="button"
                                    onClick={() => setPreviewImage(null)}
                                    className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-blue-950/80 text-white shadow hover:bg-blue-950 transition"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
