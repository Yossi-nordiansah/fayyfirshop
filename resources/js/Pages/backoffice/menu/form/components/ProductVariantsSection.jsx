import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Layers, Plus, Trash2, Upload, X } from 'lucide-react';

const PRESET_TYPES = ['Ukuran', 'Warna', 'Rasa', 'Model', 'Bahan'];

const getUnitValue = (unitObj, lang) => {
    if (!unitObj) return '';
    if (typeof unitObj === 'object') {
        return unitObj[lang] || unitObj.indonesia || '';
    }
    return String(unitObj);
};

const getTranslatedType = (type, t) => {
    if (!type) return '';
    if (type.includes(' | ')) {
        return type.split(' | ').map(part => getTranslatedType(part.trim(), t)).join(' | ');
    }
    const lower = type.toLowerCase();

    // Normalize presets in English, Arabic, and Indonesian to the base Indonesian key
    let key = lower;
    if (lower === 'ukuran' || lower === 'size' || lower === 'المقاس') {
        key = 'ukuran';
    } else if (lower === 'warna' || lower === 'color' || lower === 'اللون') {
        key = 'warna';
    } else if (lower === 'rasa' || lower === 'flavor' || lower === 'النكهة') {
        key = 'rasa';
    } else if (lower === 'model' || lower === 'الموديل') {
        key = 'model';
    } else if (lower === 'bahan' || lower === 'material' || lower === 'المادة') {
        key = 'bahan';
    }

    if (['ukuran', 'warna', 'rasa', 'model', 'bahan'].includes(key)) {
        return t('backoffice.product.form.preset_type.' + key, type);
    }
    if (lower === 'custom') {
        return t('backoffice.product.form.sub_variant_type_custom', 'Kustom');
    }
    return type;
};

// Helper to format price with thousands separator
const formatPriceInput = (value) => {
    if (value === undefined || value === null || value === '') return '';
    const clean = String(value).replace(/\D/g, '');
    if (!clean) return '';
    return new Intl.NumberFormat('id-ID').format(parseInt(clean, 10));
};

const parsePriceInput = (value) => {
    if (value === undefined || value === null || value === '') return '';
    const clean = String(value).replace(/\D/g, '');
    return clean ? parseInt(clean, 10) : '';
};

// Helper to format stock with thousands separator
const formatStockInput = (value) => {
    if (value === undefined || value === null || value === '') return '';
    const clean = String(value).replace(/\D/g, '');
    if (!clean) return '';
    return new Intl.NumberFormat('id-ID').format(parseInt(clean, 10));
};

const parseStockInput = (value) => {
    if (value === undefined || value === null || value === '') return '';
    const clean = String(value).replace(/\D/g, '');
    return clean ? parseInt(clean, 10) : '';
};

// Helper to format any numeric sequences inside a sub-variant value with a thousands separator
const formatValueWithSeparator = (value, type = '') => {
    if (value === undefined || value === null || value === '') return '';
    const valStr = String(value);

    const isUkuran = type?.toLowerCase() === 'ukuran' || type?.toLowerCase() === 'size' || type === 'المقاس';
    if (!isUkuran) {
        return valStr;
    }

    return valStr.replace(/[\d\.]+/g, (match) => {
        const cleanDigits = match.replace(/\./g, '');
        if (!cleanDigits) return '';
        if (cleanDigits.length < 4) {
            return match; // Preserve decimals like 39.5 or 1.5
        }
        return new Intl.NumberFormat('id-ID').format(parseInt(cleanDigits, 10));
    });
};

const isWeightVariant = (item, parent = null, units = []) => {
    const type = item.type || parent?.type || '';
    const isSize = type.toLowerCase() === 'ukuran';
    if (!isSize) return false;

    const isWeightStr = (str) => {
        if (!str) return false;
        return /\b(gr|kg|g|gram|kilogram)\b/i.test(str);
    };

    const isWeightUnit = (unitId) => {
        if (!unitId) return false;
        const foundUnit = units.find(u => u.id === Number(unitId));
        if (!foundUnit) return false;
        const name = foundUnit.name.toLowerCase();
        return ['gr', 'kg', 'g', 'gram', 'kilogram'].includes(name);
    };

    const isParentWeightUnit = (unitName) => {
        if (!unitName) return false;
        const name = unitName.toLowerCase();
        return ['gr', 'kg', 'g', 'gram', 'kilogram'].includes(name);
    };

    const nameVal = item.name_translations?.indonesia || item.name || '';

    return (
        isWeightStr(nameVal) ||
        isWeightUnit(item.unit_id) ||
        (parent && isParentWeightUnit(parent.unit)) ||
        isParentWeightUnit(item.unit)
    );
};

// ─── Component 3: Varian & Inventaris ─────────────────────────────────────────
export default function ProductVariantsSection({
    data,
    setData,
    errors = {},
    units,
    activeLang,
    storeBranches,
    pendingType,
    setPendingType,
    showCustomType,
    setShowCustomType,
    customTypeValue,
    setCustomTypeValue,
    typeSelectRef,
    handleTypeSelect,
    addVariant,
    removeVariant,
    updateVariantField,
    changeVariantStockType,
    changeGlobalStockType,
    updateVariantLang,
    updateVariantTypeLang,
    updateVariantStock,
    updateStandardStock,
    updateVariantLowStockThreshold,
    updateStandardLowStockThreshold,
    updateSubVariantLowStockThreshold,
    handleVariantImage,
    addSubVariant,
    removeSubVariant,
    updateSubVariantField,
    updateSubVariantLang,
    updateSubVariantTypeLang,
    updateSubVariantStock,
    handleSubVariantImage,
    t,
}) {
    let activeLangLabel = activeLang;
    if (activeLang === 'indonesia') activeLangLabel = t('backoffice.product.modal.lang_id', 'Indonesia');
    else if (activeLang === 'arabic') activeLangLabel = t('backoffice.product.modal.lang_ar', 'Arab (العربية)');
    else if (activeLang === 'english') activeLangLabel = t('backoffice.product.modal.lang_en', 'Inggris');

    const hasSizeVariant = (data.variants || []).some(v => v.type?.toLowerCase() === 'ukuran' && !v.has_sub_variants);

    const getVariantError = (vIdx, svIdx = null, field = 'sku') => {
        if (svIdx !== null) {
            const nestedKey = `variants.${vIdx}.sub_variants.${svIdx}.${field}`;
            if (errors?.[nestedKey]) return errors[nestedKey];
            if (field.startsWith('name_translations.')) {
                const nestedNameKey = `variants.${vIdx}.sub_variants.${svIdx}.name`;
                if (errors?.[nestedNameKey]) return errors[nestedNameKey];
            }
        } else {
            const nestedKey = `variants.${vIdx}.${field}`;
            if (errors?.[nestedKey]) return errors[nestedKey];
            if (field.startsWith('name_translations.')) {
                const nestedNameKey = `variants.${vIdx}.name`;
                if (errors?.[nestedNameKey]) return errors[nestedNameKey];
            }
        }

        let flatIdx = 0;
        for (let i = 0; i < data.variants.length; i++) {
            const v = data.variants[i];
            const hasSub = v.sub_variants && v.sub_variants.length > 0;

            if (i === vIdx) {
                const targetIdx = (svIdx !== null && hasSub) ? (flatIdx + svIdx) : flatIdx;
                if (field.startsWith('name_translations.')) {
                    return errors?.[`variants.${targetIdx}.${field}`] || errors?.[`variants.${targetIdx}.name`] || null;
                }
                return errors?.[`variants.${targetIdx}.${field}`] || null;
            }

            flatIdx += hasSub ? v.sub_variants.length : 1;
        }
        return null;
    };

    const handleSubVariantTypeChange = (vIdx, svIdx, typeVal) => {
        updateSubVariantField(vIdx, svIdx, 'type', typeVal);
        const lowerVal = typeVal.trim().toLowerCase();
        const defaultTranslations = {
            indonesia: lowerVal === 'ukuran' ? 'Ukuran' : lowerVal === 'warna' ? 'Warna' : lowerVal === 'rasa' ? 'Rasa' : lowerVal === 'model' ? 'Model' : lowerVal === 'bahan' ? 'Bahan' : typeVal,
            english: lowerVal === 'ukuran' ? 'Size' : lowerVal === 'warna' ? 'Color' : lowerVal === 'rasa' ? 'Flavor' : lowerVal === 'model' ? 'Model' : lowerVal === 'bahan' ? 'Material' : typeVal,
            arabic: lowerVal === 'ukuran' ? 'المقاس' : lowerVal === 'warna' ? 'اللون' : lowerVal === 'rasa' ? 'النكهة' : lowerVal === 'model' ? 'الموديل' : lowerVal === 'bahan' ? 'المادة' : typeVal,
        };
        updateSubVariantField(vIdx, svIdx, 'type_translations', defaultTranslations);
    };

    return (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                    <Layers className="h-5 w-5 text-amber-500" />
                    <div>
                        <h3 className="text-base font-bold text-blue-950">{t('backoffice.product.variant', 'Varian & Inventaris')}</h3>
                        <p className="text-xs text-slate-400">{t('backoffice.product.form.variant_desc', 'Tambahkan varian ukuran, warna, rasa, dll.')}</p>
                    </div>
                </div>
            </div>

            {/* Variant type selector */}
            <div className="mb-5 space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">{t('backoffice.product.form.add_variant_type', 'Tambah Tipe Varian Baru')}</p>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                        <select
                            ref={typeSelectRef}
                            defaultValue=""
                            onChange={handleTypeSelect}
                            className="h-10 w-52 cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-sm font-medium text-slate-700 outline-none focus:border-blue-950 focus:ring-2 focus:ring-blue-950/5"
                        >
                            <option value="" disabled>{t('backoffice.product.form.select_variant_type', 'Pilih tipe varian...')}</option>
                            {PRESET_TYPES.map(type => (
                                <option key={type} value={type}>
                                    {t('backoffice.product.form.preset_type.' + type.toLowerCase(), type)}
                                </option>
                            ))}
                            <option value="__new__">{t('backoffice.product.form.new_type', '+ Tipe Baru...')}</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>

                    {pendingType && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            type="button"
                            onClick={() => addVariant(pendingType)}
                            className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-950 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-blue-900 active:scale-95"
                        >
                            <Plus className="h-4 w-4" />
                            {t('backoffice.product.form.btn_add_variant', 'Tambah Varian {type}').replace('{type}', getTranslatedType(pendingType, t))}
                        </motion.button>
                    )}
                </div>

                {/* Custom type input */}
                <AnimatePresence>
                    {showCustomType && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="text"
                                    value={customTypeValue}
                                    onChange={e => setCustomTypeValue(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addVariant(customTypeValue);
                                        }
                                    }}
                                    placeholder={t('backoffice.product.form.new_variant_type_placeholder', 'Nama tipe varian baru...')}
                                    className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-950"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => addVariant(customTypeValue)}
                                    disabled={!customTypeValue.trim()}
                                    className="h-10 rounded-xl bg-blue-950 px-4 text-sm font-bold text-white transition disabled:opacity-40 hover:bg-blue-900"
                                >
                                    {t('backoffice.product.form.btn_add', 'Tambah')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCustomType(false);
                                        setCustomTypeValue('');
                                        if (typeSelectRef.current) typeSelectRef.current.value = '';
                                    }}
                                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Stock Management Mode for Product (Only shown if has size variant directly) */}
            {data.has_variants && hasSizeVariant && (
                <div className="mb-5 space-y-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                        {t('backoffice.product.form.stock_type', 'Mode Manajemen Stok')}
                    </label>
                    <div className="flex flex-wrap gap-6 rounded-xl border border-slate-200 bg-white px-4 py-3">
                        <label className="flex items-center gap-2 cursor-pointer select-none group text-xs font-bold text-slate-700 hover:text-blue-950">
                            <input
                                type="radio"
                                name="stock_type"
                                value="variant"
                                checked={data.stock_type === 'variant'}
                                onChange={e => changeGlobalStockType(e.target.value)}
                                className="h-4 w-4 border-slate-300 text-blue-950 focus:ring-blue-950/20"
                            />
                            <span>{t('backoffice.product.form.stock_type_variant', 'Stok per Varian')}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none group text-xs font-bold text-slate-700 hover:text-blue-950">
                            <input
                                type="radio"
                                name="stock_type"
                                value="parent"
                                checked={data.stock_type === 'parent'}
                                onChange={e => changeGlobalStockType(e.target.value)}
                                className="h-4 w-4 border-slate-300 text-blue-950 focus:ring-blue-950/20"
                            />
                            <span>{t('backoffice.product.form.stock_type_parent', 'Stok Induk (Terpusat)')}</span>
                        </label>
                    </div>
                </div>
            )}

            {/* Standard/Parent stock view */}
            {(!data.has_variants || (data.has_variants && hasSizeVariant && data.stock_type === 'parent')) && (
                <div className="space-y-4 mb-6 rounded-xl border border-slate-100 bg-slate-50/50 p-5">
                    <span className="block rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-600">
                        {data.stock_type === 'parent' && data.has_variants
                            ? t('backoffice.product.form.parent_mode_hint', '💡 Mode Stok Induk — Kelola stok terpusat per cabang gudang (dalam satuan {unit}).').replace('{unit}', data.unit || 'mili')
                            : t('backoffice.product.form.single_mode_hint', '💡 Mode Produk Tunggal — Kelola stok langsung per cabang gudang.')
                        }
                    </span>

                    {/* Unit selector and Weight input */}
                    {(() => {
                        const showCapacityInput = !data.has_variants && data.unit && !['pcs', 'pack', 'box'].includes(data.unit.toLowerCase());
                        const gridClass = !data.has_variants 
                            ? (showCapacityInput ? "grid grid-cols-1 gap-4 sm:grid-cols-3" : "grid grid-cols-1 gap-4 sm:grid-cols-2") 
                            : "space-y-2 max-w-xs";
                        
                        return (
                            <div className={gridClass}>
                                {/* Unit selector */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                                        {data.has_variants
                                            ? t('backoffice.product.form.parent_unit', 'Satuan Stok Induk')
                                            : t('backoffice.product.form.variant_unit', 'Satuan (Unit)')
                                        } <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={data.unit || ''}
                                        onChange={e => setData('unit', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-950"
                                        required
                                    >
                                        <option value="">{t('backoffice.product.form.placeholders.parent_unit', 'Pilih satuan...')}</option>
                                        {units.map(u => (
                                            <option key={u.id} value={u.name}>{u.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Weight input for Single Product (when there are no variants) */}
                                {!data.has_variants && (
                                    <div className="space-y-2">
                                        <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                                            {t('backoffice.product.weight', 'Berat Produk (Gram)')} <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="relative flex items-center">
                                            <input
                                                type="text"
                                                value={data.weight === '' || data.weight === null || data.weight === undefined ? '' : String(data.weight)}
                                                onChange={e => {
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    setData('weight', val === '' ? '' : parseInt(val, 10));
                                                }}
                                                placeholder="e.g. 1000"
                                                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-12 text-sm font-semibold outline-none focus:border-blue-950"
                                                required
                                            />
                                            <span className="absolute right-3 text-xs font-bold text-slate-400">gram</span>
                                        </div>
                                        {errors.weight && (
                                            <p className="mt-1 text-xs text-rose-600">{errors.weight}</p>
                                        )}
                                    </div>
                                )}

                                {/* Capacity (Ukuran) input for Single Product when unit is not pcs/pack/box */}
                                {showCapacityInput && (
                                    <div className="space-y-2">
                                        <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                                            {t('backoffice.product.form.capacity_label', 'Ukuran / Kapasitas')} <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="relative flex items-center">
                                            <input
                                                type="text"
                                                value={data.capacity === '' || data.capacity === null || data.capacity === undefined ? '' : String(data.capacity)}
                                                onChange={e => {
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    setData('capacity', val === '' ? '' : parseInt(val, 10));
                                                }}
                                                placeholder="e.g. 500"
                                                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-12 text-sm font-semibold outline-none focus:border-blue-950"
                                                required
                                            />
                                            <span className="absolute right-3 text-xs font-bold text-slate-400">
                                                {data.unit}
                                            </span>
                                        </div>
                                        {errors.capacity && (
                                            <p className="mt-1 text-xs text-rose-600">{errors.capacity}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {data.branch_stocks.map((bs, bIdx) => (
                            <div key={bs.store_branch_id} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                                <label className="mb-2 block truncate text-xs font-black uppercase text-slate-700">
                                    {bs.country_code ? bs.country_code.toUpperCase() : bs.branch_name}
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="mb-1 block text-[10px] font-bold text-slate-400 uppercase">
                                            {t('backoffice.product.form.stock', 'Stok')}
                                        </label>
                                        <div className="relative flex items-center">
                                            <input
                                                type="text"
                                                value={formatStockInput(bs.stock)}
                                                onChange={e => updateStandardStock(bIdx, parseStockInput(e.target.value))}
                                                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-2 pr-2 py-1.5 text-center text-sm font-semibold text-slate-800 outline-none focus:border-blue-950 focus:bg-white"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[10px] font-bold text-slate-400 uppercase">
                                            {t('backoffice.product.form.min_stock', 'Min. Stok')}
                                        </label>
                                        <input
                                            type="text"
                                            value={formatStockInput(bs.low_stock_threshold ?? 5)}
                                            onChange={e => updateStandardLowStockThreshold(bIdx, parseStockInput(e.target.value))}
                                            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2 py-1.5 text-center text-sm font-semibold text-slate-800 outline-none focus:border-blue-950 focus:bg-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Add Button */}
            {data.has_variants && data.variants && data.variants.length > 0 && (
                <div className="mb-4 flex justify-end">
                    <button
                        type="button"
                        onClick={() => addVariant(data.variants[0].type)}
                        className="bg-blue-800 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-600 active:scale-95"
                    >
                        <Plus className="h-4 w-4 text-white" />
                        {t('backoffice.product.form.btn_add_variant_simple', 'Tambah {type}').replace('{type}', getTranslatedType(data.variants[0].type, t))}
                    </button>
                </div>
            )}

            {/* Variant cards */}
            {data.has_variants && (
                <div className="space-y-4">
                    <AnimatePresence initial={false}>
                        {data.variants.map((variant, vIdx) => {
                            const hasSubVariants = variant.has_sub_variants;
                            const isSizeVariant = variant.type?.toLowerCase() === 'ukuran';
                            const showUnitSelector = !hasSubVariants && !(isSizeVariant && data.stock_type === 'parent');
                            const showSkuAndPrice = !hasSubVariants;
                            const showSubVariantsSection = hasSubVariants;

                            return (
                                <motion.div
                                    key={variant.id || `variant-${vIdx}`}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.96 }}
                                    className="relative rounded-2xl border border-blue-50 bg-slate-50/40 p-5 shadow-sm transition hover:border-blue-100"
                                >
                                    {/* Variant header */}
                                    <div className="mb-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-950 text-[11px] font-black text-white shadow">
                                                #{vIdx + 1}
                                            </span>
                                            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-950">
                                                {getTranslatedType(variant.type_translations?.[activeLang] || variant.type_translations?.indonesia || variant.type, t) || t('backoffice.product.th_variant', 'Varian')}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeVariant(vIdx)}
                                            className="text-slate-400 transition hover:text-rose-500"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>

                                    {/* Option Selector (Segmented Control) */}
                                    <div className="mb-5 flex max-w-xs rounded-xl bg-slate-100 p-1">
                                        <button
                                            type="button"
                                            onClick={() => updateVariantField(vIdx, 'has_sub_variants', false)}
                                            className={`flex-1 rounded-lg py-1.5 text-center text-[10px] font-black transition-all ${!variant.has_sub_variants
                                                ? 'bg-white text-blue-950 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-800'
                                                }`}
                                        >
                                            {t('backoffice.product.form.no_sub_variant', 'Tanpa Sub-Varian')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => updateVariantField(vIdx, 'has_sub_variants', true)}
                                            className={`flex-1 rounded-lg py-1.5 text-center text-[10px] font-black transition-all ${variant.has_sub_variants
                                                ? 'bg-white text-blue-950 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-800'
                                                }`}
                                        >
                                            {t('backoffice.product.form.has_sub_variant', 'Dengan Sub-Varian')}
                                        </button>
                                    </div>

                                    {/* Variant Type Name (3 languages or 1 if Ukuran) */}
                                    <div className="mb-5 space-y-2 rounded-xl border border-amber-100 bg-amber-50/30 p-4">
                                        <label className="block text-[11px] font-black uppercase tracking-wider text-amber-700">
                                            {t('backoffice.product.form.variant_type_name', 'Nama Tipe Varian')}
                                        </label>
                                        {variant.type?.toLowerCase() === 'ukuran' ? (
                                            <div className="space-y-0.5">
                                                <input
                                                    type="text"
                                                    value={variant.type_translations?.indonesia ?? variant.type ?? ''}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        updateVariantField(vIdx, 'type_translations', {
                                                            indonesia: val,
                                                            english: val,
                                                            arabic: val
                                                        });
                                                    }}
                                                    placeholder="Ukuran..."
                                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium outline-none focus:border-blue-950"
                                                />
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                                {/* Indonesia */}
                                                <div className="space-y-0.5">
                                                    <span className="text-[10px] font-bold text-slate-400">Indonesia</span>
                                                    <input
                                                        type="text"
                                                        value={variant.type_translations?.indonesia ?? variant.type ?? ''}
                                                        onChange={e => updateVariantTypeLang(vIdx, 'indonesia', e.target.value)}
                                                        placeholder="Kepekatan, Ukuran..."
                                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium outline-none focus:border-blue-950"
                                                    />
                                                </div>
                                                {/* English */}
                                                <div className="space-y-0.5">
                                                    <span className="text-[10px] font-bold text-slate-400">English</span>
                                                    <input
                                                        type="text"
                                                        value={variant.type_translations?.english ?? ''}
                                                        onChange={e => updateVariantTypeLang(vIdx, 'english', e.target.value)}
                                                        placeholder="Intensity, Size..."
                                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium outline-none focus:border-blue-950"
                                                    />
                                                </div>
                                                {/* Arabic */}
                                                <div className="space-y-0.5">
                                                    <span className="text-[10px] font-bold text-slate-400">Arab (العربية)</span>
                                                    <input
                                                        type="text"
                                                        dir="rtl"
                                                        value={variant.type_translations?.arabic ?? ''}
                                                        onChange={e => updateVariantTypeLang(vIdx, 'arabic', e.target.value)}
                                                        placeholder="التركيز، المقاس..."
                                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium outline-none focus:border-blue-950"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Variant fields */}
                                    <div className="space-y-4">
                                        {/* Name (translated) */}
                                        <div className="space-y-1.5">
                                            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500">
                                                {t('backoffice.product.form.variant_value_label', 'Nilai {type}').replace(
                                                    '{type}',
                                                    getTranslatedType(variant.type_translations?.[activeLang] || variant.type_translations?.indonesia || variant.type, t)
                                                )}
                                            </label>

                                            {variant.type?.toLowerCase() === 'ukuran' ? (
                                                <div className="">
                                                    <input
                                                        type="text"
                                                        value={variant.name_translations?.indonesia ?? ''}
                                                        onChange={e => {
                                                            const val = formatValueWithSeparator(e.target.value, variant.type);
                                                            updateVariantField(vIdx, 'name_translations', {
                                                                indonesia: val,
                                                                english: val,
                                                                arabic: val
                                                            });
                                                        }}
                                                        placeholder={t('backoffice.product.form.placeholder_ukuran', 'Contoh: S, M, L, XL / 38, 39, 40 / 100ml...')}
                                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-950"
                                                    />
                                                    {getVariantError(vIdx, null, 'name_translations.indonesia') && (
                                                        <p className="text-[10px] font-semibold text-rose-500">
                                                            {getVariantError(vIdx, null, 'name_translations.indonesia')}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                                    {/* Indonesia */}
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-bold text-slate-400">Indonesia</span>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={variant.name_translations?.indonesia ?? ''}
                                                            onChange={e => updateVariantLang(vIdx, 'indonesia', formatValueWithSeparator(e.target.value, variant.type))}
                                                            placeholder={
                                                                variant.type === 'Ukuran' ? '100ml / Large'
                                                                    : variant.type === 'Warna' ? 'Merah / Rouge'
                                                                        : 'Contoh nilai...'
                                                            }
                                                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-blue-950"
                                                        />
                                                        {getVariantError(vIdx, null, 'name_translations.indonesia') && (
                                                            <p className="text-[10px] font-semibold text-rose-500">
                                                                {getVariantError(vIdx, null, 'name_translations.indonesia')}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* English */}
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-bold text-slate-400">English</span>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={variant.name_translations?.english ?? ''}
                                                            onChange={e => updateVariantLang(vIdx, 'english', formatValueWithSeparator(e.target.value, variant.type))}
                                                            placeholder={
                                                                variant.type === 'Ukuran' ? '100ml / Large'
                                                                    : variant.type === 'Warna' ? 'Red / Blue'
                                                                        : 'Example value...'
                                                            }
                                                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-blue-950"
                                                        />
                                                        {getVariantError(vIdx, null, 'name_translations.english') && (
                                                            <p className="text-[10px] font-semibold text-rose-500">
                                                                {getVariantError(vIdx, null, 'name_translations.english')}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Arabic */}
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-bold text-slate-400">Arab (العربية)</span>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            dir="rtl"
                                                            value={variant.name_translations?.arabic ?? ''}
                                                            onChange={e => updateVariantLang(vIdx, 'arabic', formatValueWithSeparator(e.target.value, variant.type))}
                                                            placeholder={
                                                                variant.type === 'Ukuran' ? '١٠٠ مل / كبير'
                                                                    : variant.type === 'Warna' ? 'أحمر / أزرق'
                                                                        : 'مثال nilai...'
                                                            }
                                                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-blue-950"
                                                        />
                                                        {getVariantError(vIdx, null, 'name_translations.arabic') && (
                                                            <p className="text-[10px] font-semibold text-rose-500">
                                                                {getVariantError(vIdx, null, 'name_translations.arabic')}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Stock Management Mode for Variant (shown if sub-variant type is Ukuran) */}
                                        {variant.has_sub_variants && variant.sub_variants?.some(sv => sv.type?.toLowerCase() === 'ukuran') && (
                                            <div className="space-y-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                                                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500">
                                                    {t('backoffice.product.form.stock_type', 'Mode Manajemen Stok')}
                                                </label>
                                                <div className="flex flex-wrap gap-4 rounded-lg border border-slate-200 bg-white px-3 py-2">
                                                    <label className="flex items-center gap-2 cursor-pointer select-none group text-xs font-bold text-slate-700 hover:text-blue-950">
                                                        <input
                                                            type="radio"
                                                            name={`stock_type_${vIdx}`}
                                                            value="variant"
                                                            checked={(variant.stock_type || 'variant') === 'variant'}
                                                            onChange={e => changeVariantStockType(vIdx, e.target.value)}
                                                            className="h-3.5 w-3.5 border-slate-300 text-blue-950 focus:ring-blue-950/20"
                                                        />
                                                        <span>{t('backoffice.product.form.stock_type_variant', 'Stok per Varian')}</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer select-none group text-xs font-bold text-slate-700 hover:text-blue-950">
                                                        <input
                                                            type="radio"
                                                            name={`stock_type_${vIdx}`}
                                                            value="parent"
                                                            checked={variant.stock_type === 'parent'}
                                                            onChange={e => changeVariantStockType(vIdx, e.target.value)}
                                                            className="h-3.5 w-3.5 border-slate-300 text-blue-950 focus:ring-blue-950/20"
                                                        />
                                                        <span>{t('backoffice.product.form.stock_type_parent', 'Stok Induk (Terpusat)')}</span>
                                                    </label>
                                                </div>

                                                {variant.stock_type === 'parent' && (
                                                    <div className="space-y-3">
                                                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                                                            {t('backoffice.product.form.parent_unit', 'Satuan Stok Induk')} <span className="text-rose-500">*</span>
                                                        </label>
                                                        <div className="w-full sm:w-72">
                                                            <select
                                                                value={variant.unit || ''}
                                                                onChange={e => updateVariantField(vIdx, 'unit', e.target.value)}
                                                                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-blue-950"
                                                                required
                                                            >
                                                                <option value="">{t('backoffice.product.form.placeholders.parent_unit', 'Pilih satuan...')}</option>
                                                                {units.map(u => (
                                                                    <option key={u.id} value={u.name}>{u.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                )}

                                                {variant.stock_type === 'parent' && (
                                                    <div className="pt-2 border-t border-dashed border-slate-200">
                                                        <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                            {t('backoffice.product.form.branch_stock_allocation', 'Alokasi Stok Gudang Cabang')}
                                                        </p>
                                                        <div className="grid grid-cols-3 gap-3">
                                                            {variant.branch_stocks.map((bStock, bIdx) => (
                                                                <div
                                                                    key={bStock.store_branch_id}
                                                                    className="flex flex-col gap-1.5 rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm"
                                                                >
                                                                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 text-center block">
                                                                        {bStock.country_code ? bStock.country_code.toUpperCase() : bStock.branch_name}
                                                                    </label>
                                                                    <div className="space-y-1 w-full">
                                                                        <div className="relative flex items-center w-full">
                                                                            <input
                                                                                type="text"
                                                                                value={formatStockInput(bStock.stock)}
                                                                                onChange={e => updateVariantStock(vIdx, bIdx, parseStockInput(e.target.value))}
                                                                                placeholder="Stok"
                                                                                className="w-full rounded bg-slate-50 border border-slate-200 px-1.5 py-0.5 text-center text-xs font-semibold outline-none focus:border-blue-950 focus:bg-white"
                                                                            />
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            <span className="text-[9px] font-bold text-slate-400 uppercase leading-none truncate">{t('backoffice.product.form.min_stock_abbr', 'Min')}:</span>
                                                                            <input
                                                                                type="text"
                                                                                value={formatStockInput(bStock.low_stock_threshold ?? 5)}
                                                                                onChange={e => updateVariantLowStockThreshold(vIdx, bIdx, parseStockInput(e.target.value))}
                                                                                className="w-full rounded bg-slate-50/50 border border-slate-200/80 px-1 py-0.5 text-center text-[10px] font-medium outline-none focus:border-blue-950 focus:bg-white"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* SKU, Price, and Unit Row */}
                                        {showSkuAndPrice && (
                                            <div className={`grid grid-cols-1 gap-4 ${(2 + (showUnitSelector || (isSizeVariant && data.stock_type === 'parent') ? 1 : 0) + (!isWeightVariant(variant, data.stock_type === 'parent' ? data : null, units) ? 1 : 0)) === 4
                                                ? 'sm:grid-cols-4'
                                                : (2 + (showUnitSelector || (isSizeVariant && data.stock_type === 'parent') ? 1 : 0) + (!isWeightVariant(variant, data.stock_type === 'parent' ? data : null, units) ? 1 : 0)) === 3
                                                    ? 'sm:grid-cols-3'
                                                    : 'sm:grid-cols-2'
                                                }`}>
                                                {/* SKU */}
                                                <div>
                                                    <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">{t('backoffice.product.form.variant_sku', 'SKU Varian')}</label>
                                                    <input
                                                        type="text"
                                                        value={variant.sku}
                                                        onChange={e => updateVariantField(vIdx, 'sku', e.target.value)}
                                                        placeholder="FYF-VAR-01"
                                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-950"
                                                    />
                                                    {getVariantError(vIdx, null, 'sku') && (
                                                        <p className="mt-1 text-[11px] font-semibold text-rose-500">
                                                            {getVariantError(vIdx, null, 'sku')}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Price */}
                                                <div>
                                                    <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500 text-nowrap">
                                                        {t('backoffice.product.form.variant_price', 'Harga (IDR)')} <span className="font-normal normal-case text-slate-400">— {t('backoffice.product.form.optional', 'opsional')}</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formatPriceInput(variant.price)}
                                                        onChange={e => updateVariantField(vIdx, 'price', parsePriceInput(e.target.value))}
                                                        placeholder={t('backoffice.product.form.variant_price_placeholder', 'Kosong = ikut harga induk')}
                                                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-blue-950"
                                                    />
                                                    {getVariantError(vIdx, null, 'price') && (
                                                        <p className="mt-1 text-[11px] font-semibold text-rose-500">
                                                            {getVariantError(vIdx, null, 'price')}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Unit */}
                                                {showUnitSelector ? (
                                                    <div>
                                                        <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">{t('backoffice.product.form.variant_unit', 'Satuan (Unit)')}</label>
                                                        <select
                                                            value={variant.unit_id}
                                                            onChange={e => updateVariantField(vIdx, 'unit_id', e.target.value)}
                                                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-950"
                                                        >
                                                            <option value="">{t('backoffice.product.form.select_unit', 'Pilih satuan...')}</option>
                                                            {units.map(u => (
                                                                <option key={u.id} value={u.id}>{u.name}</option>
                                                            ))}
                                                        </select>
                                                        {getVariantError(vIdx, null, 'unit_id') && (
                                                            <p className="mt-1 text-[11px] font-semibold text-rose-500">
                                                                {getVariantError(vIdx, null, 'unit_id')}
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    isSizeVariant && data.stock_type === 'parent' && (
                                                        <div className="flex flex-col justify-end h-full pb-2">
                                                            <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500 opacity-0">Spacer</label>
                                                            <span className="text-xs text-slate-400 italic block">{t('backoffice.product.form.follows_parent_unit', 'Mengikuti satuan induk')}</span>
                                                        </div>
                                                    )
                                                )}

                                                {/* Weight (Only if NOT weight variant) */}
                                                {!isWeightVariant(variant, data.stock_type === 'parent' ? data : null, units) && (
                                                    <div>
                                                        <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">
                                                            {t('backoffice.product.weight', 'Berat (Gram)')} <span className="text-rose-500">*</span>
                                                        </label>
                                                        <div className="relative flex items-center">
                                                            <input
                                                                type="text"
                                                                value={variant.weight === '' || variant.weight === null || variant.weight === undefined ? '' : String(variant.weight)}
                                                                onChange={e => {
                                                                    const val = e.target.value.replace(/\D/g, '');
                                                                    updateVariantField(vIdx, 'weight', val === '' ? '' : parseInt(val, 10));
                                                                }}
                                                                placeholder="e.g. 1000"
                                                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-blue-950"
                                                                required
                                                            />
                                                            <span className="absolute right-3 text-xs font-bold text-slate-400">gram</span>
                                                        </div>
                                                        {getVariantError(vIdx, null, 'weight') && (
                                                            <p className="mt-1 text-[11px] font-semibold text-rose-500">
                                                                {getVariantError(vIdx, null, 'weight')}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Variant Image (Only shown in Tanpa Sub-Varian mode) */}
                                        {!hasSubVariants && (
                                            <div className="pt-1">
                                                <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">{t('backoffice.product.form.variant_image', 'Gambar Varian')}</label>
                                                <div className="flex items-center gap-3">
                                                    {variant.imagePreview && (
                                                        <div className="relative h-16 w-16 flex-shrink-0">
                                                            <img
                                                                src={variant.imagePreview}
                                                                alt="variant"
                                                                className="h-16 w-16 rounded-xl border border-slate-200 object-cover"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => handleVariantImage(vIdx, null)}
                                                                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white shadow"
                                                            >
                                                                <X className="h-2.5 w-2.5" />
                                                            </button>
                                                        </div>
                                                    )}
                                                    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-500 transition hover:border-blue-300 hover:text-blue-950">
                                                        <Upload className="h-3.5 w-3.5" />
                                                        {variant.imagePreview ? t('backoffice.product.form.change_image', 'Ganti Gambar') : t('backoffice.product.form.upload_image', 'Upload Gambar')}
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={e => {
                                                                const file = e.target.files[0];
                                                                if (file) handleVariantImage(vIdx, file);
                                                                e.target.value = '';
                                                            }}
                                                        />
                                                    </label>
                                                </div>
                                                {getVariantError(vIdx, null, 'image') && (
                                                    <p className="mt-1 text-[11px] font-semibold text-rose-500">
                                                        {getVariantError(vIdx, null, 'image')}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Sub-Variants Section */}
                                    {showSubVariantsSection && (
                                        <div className="mt-4 border-t border-slate-100 pt-3">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                                    <Layers className="h-3.5 w-3.5 text-amber-500" />
                                                    {t('backoffice.product.form.sub_variants_count', 'Sub-Varian ({count})').replace('{count}', variant.sub_variants?.length || 0)}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => addSubVariant(vIdx)}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-950 transition hover:bg-blue-100 hover:text-blue-900 active:scale-95 shadow-sm"
                                                >
                                                    <Plus className="h-3.5 w-3.5" /> {variant.sub_variants && variant.sub_variants.length > 0
                                                        ? t('backoffice.product.form.add_sub_variant_type', 'Tambah {type}').replace('{type}', getTranslatedType(variant.sub_variants[0].type, t))
                                                        : t('backoffice.product.form.add_sub_variant', 'Tambah Sub-Varian')
                                                    }
                                                </button>
                                            </div>

                                            {variant.sub_variants && variant.sub_variants.length > 0 ? (
                                                <div className="space-y-3">
                                                    {variant.sub_variants.map((subVar, svIdx) => (
                                                        <div key={svIdx} className="rounded-xl border border-slate-100 bg-white p-3 space-y-3 shadow-inner relative">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeSubVariant(vIdx, svIdx)}
                                                                className="absolute right-3 top-3 text-slate-400 hover:text-rose-500 transition"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>

                                                            {/* Sub-Variant Fields */}
                                                            <div className="space-y-3 pr-8">
                                                                {/* Sub-Variant Type Selector */}
                                                                <div>
                                                                    <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">{t('backoffice.product.form.sub_variant_type', 'Tipe Sub-Varian')}</label>
                                                                    <select
                                                                        value={subVar.type}
                                                                        onChange={e => handleSubVariantTypeChange(vIdx, svIdx, e.target.value)}
                                                                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-blue-950"
                                                                    >
                                                                        {PRESET_TYPES.map(type => (
                                                                            <option key={type} value={type}>
                                                                                {t('backoffice.product.form.preset_type.' + type.toLowerCase(), type)}
                                                                            </option>
                                                                        ))}
                                                                        <option value="Custom">{t('backoffice.product.form.sub_variant_type_custom', 'Custom')}</option>
                                                                    </select>
                                                                </div>

                                                                {/* Sub-Variant Value Input */}
                                                                <div className="space-y-1.5">
                                                                    <label className="block text-[10px] font-bold uppercase text-slate-500">
                                                                        {t('backoffice.product.form.sub_variant_value', 'Nilai')}
                                                                    </label>

                                                                    {subVar.type?.toLowerCase() === 'ukuran' ? (
                                                                        <div className="space-y-0.5">
                                                                            <input
                                                                                type="text"
                                                                                value={subVar.name_translations?.indonesia ?? ''}
                                                                                onChange={e => {
                                                                                    const val = formatValueWithSeparator(e.target.value, subVar.type);
                                                                                    updateSubVariantField(vIdx, svIdx, 'name_translations', {
                                                                                        indonesia: val,
                                                                                        english: val,
                                                                                        arabic: val
                                                                                    });
                                                                                }}
                                                                                placeholder={t('backoffice.product.form.placeholder_ukuran', 'Contoh: S, M, L, XL / 38, 39, 40 / 100ml...')}
                                                                                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-blue-950"
                                                                            />
                                                                            {getVariantError(vIdx, svIdx, 'name_translations.indonesia') && (
                                                                                <p className="text-[9px] font-semibold text-rose-500">
                                                                                    {getVariantError(vIdx, svIdx, 'name_translations.indonesia')}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                                                            {/* Indonesia */}
                                                                            <div className="space-y-0.5">
                                                                                <span className="text-[9px] font-bold text-slate-400">Indonesia</span>
                                                                                <input
                                                                                    type="text"
                                                                                    value={subVar.name_translations?.indonesia ?? ''}
                                                                                    onChange={e => updateSubVariantLang(vIdx, svIdx, 'indonesia', formatValueWithSeparator(e.target.value, subVar.type))}
                                                                                    placeholder="Contoh: 250ml, Stroberi"
                                                                                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-blue-950"
                                                                                />
                                                                                {getVariantError(vIdx, svIdx, 'name_translations.indonesia') && (
                                                                                    <p className="text-[9px] font-semibold text-rose-500">
                                                                                        {getVariantError(vIdx, svIdx, 'name_translations.indonesia')}
                                                                                    </p>
                                                                                )}
                                                                            </div>

                                                                            {/* English */}
                                                                            <div className="space-y-0.5">
                                                                                <span className="text-[9px] font-bold text-slate-400">English</span>
                                                                                <input
                                                                                    type="text"
                                                                                    value={subVar.name_translations?.english ?? ''}
                                                                                    onChange={e => updateSubVariantLang(vIdx, svIdx, 'english', formatValueWithSeparator(e.target.value, subVar.type))}
                                                                                    placeholder="e.g. 250ml, Strawberry"
                                                                                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-blue-950"
                                                                                />
                                                                                {getVariantError(vIdx, svIdx, 'name_translations.english') && (
                                                                                    <p className="text-[9px] font-semibold text-rose-500">
                                                                                        {getVariantError(vIdx, svIdx, 'name_translations.english')}
                                                                                    </p>
                                                                                )}
                                                                            </div>

                                                                            {/* Arabic */}
                                                                            <div className="space-y-0.5">
                                                                                <span className="text-[9px] font-bold text-slate-400">Arab (العربية)</span>
                                                                                <input
                                                                                    type="text"
                                                                                    value={subVar.name_translations?.arabic ?? ''}
                                                                                    onChange={e => updateSubVariantLang(vIdx, svIdx, 'arabic', formatValueWithSeparator(e.target.value, subVar.type))}
                                                                                    placeholder="مثال: ٢٥٠ مل, فراولة"
                                                                                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-blue-950"
                                                                                />
                                                                                {getVariantError(vIdx, svIdx, 'name_translations.arabic') && (
                                                                                    <p className="text-[9px] font-semibold text-rose-500">
                                                                                        {getVariantError(vIdx, svIdx, 'name_translations.arabic')}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Sub-Variant SKU, Price, and Unit Row */}
                                                                <div className={`grid grid-cols-1 gap-3 pt-2 border-t border-slate-100 ${!isWeightVariant(subVar, variant.stock_type === 'parent' ? variant : null, units)
                                                                    ? 'sm:grid-cols-4'
                                                                    : 'sm:grid-cols-3'
                                                                    }`}>
                                                                    {/* SKU */}
                                                                    <div>
                                                                        <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">{t('backoffice.product.form.sub_variant_sku', 'SKU Sub-Varian')}</label>
                                                                        <input
                                                                            type="text"
                                                                            value={subVar.sku || ''}
                                                                            onChange={e => updateSubVariantField(vIdx, svIdx, 'sku', e.target.value)}
                                                                            placeholder="FYF-SVAR-01"
                                                                            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-blue-950"
                                                                        />
                                                                        {getVariantError(vIdx, svIdx, 'sku') && (
                                                                            <p className="mt-1 text-[10px] font-semibold text-rose-500">
                                                                                {getVariantError(vIdx, svIdx, 'sku')}
                                                                            </p>
                                                                        )}
                                                                    </div>

                                                                    {/* Price */}
                                                                    <div>
                                                                        <label className="mb-1 text-nowrap block text-[10px] font-bold uppercase text-slate-500">
                                                                            {t('backoffice.product.th_base_price', 'Harga (IDR)')} <span className="font-normal normal-case text-slate-400">— {t('backoffice.product.form.optional', 'opsional')}</span>
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            value={formatPriceInput(subVar.price)}
                                                                            onChange={e => updateSubVariantField(vIdx, svIdx, 'price', parsePriceInput(e.target.value))}
                                                                            placeholder={t('backoffice.product.form.variant_price_placeholder', 'Kosong = ikut harga induk')}
                                                                            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-blue-950"
                                                                        />
                                                                        {getVariantError(vIdx, svIdx, 'price') && (
                                                                            <p className="mt-1 text-[10px] font-semibold text-rose-500">
                                                                                {getVariantError(vIdx, svIdx, 'price')}
                                                                            </p>
                                                                        )}
                                                                    </div>

                                                                    {/* Unit (Satuan) */}
                                                                    {subVar.type === 'Ukuran' && variant.stock_type !== 'parent' ? (
                                                                        <div>
                                                                            <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">{t('backoffice.product.form.variant_unit', 'Satuan (Unit)')}</label>
                                                                            <select
                                                                                value={subVar.unit_id || ''}
                                                                                onChange={e => updateSubVariantField(vIdx, svIdx, 'unit_id', e.target.value)}
                                                                                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-blue-950"
                                                                            >
                                                                                <option value="">{t('backoffice.product.form.select_unit', 'Pilih satuan...')}</option>
                                                                                {units.map(u => (
                                                                                    <option key={u.id} value={u.id}>{u.name}</option>
                                                                                ))}
                                                                            </select>
                                                                            {getVariantError(vIdx, svIdx, 'unit_id') && (
                                                                                <p className="mt-1 text-[10px] font-semibold text-rose-500">
                                                                                    {getVariantError(vIdx, svIdx, 'unit_id')}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex flex-col justify-end h-full pb-1.5">
                                                                            <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500 opacity-0">Spacer</label>
                                                                            <span className="text-[10px] text-slate-400 italic block">
                                                                                {variant.stock_type === 'parent' && subVar.type === 'Ukuran'
                                                                                    ? t('backoffice.product.form.follows_parent_unit', 'Mengikuti satuan induk')
                                                                                    : t('backoffice.product.form.no_unit_needed', 'Tidak memerlukan satuan')
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                    )}

                                                                    {/* Weight (Only if NOT weight variant) */}
                                                                    {!isWeightVariant(subVar, variant.stock_type === 'parent' ? variant : null, units) && (
                                                                        <div>
                                                                            <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
                                                                                {t('backoffice.product.weight', 'Berat (Gram)')} <span className="text-rose-500">*</span>
                                                                            </label>
                                                                            <div className="relative flex items-center">
                                                                                <input
                                                                                    type="text"
                                                                                    value={subVar.weight === '' || subVar.weight === null || subVar.weight === undefined ? '' : String(subVar.weight)}
                                                                                    onChange={e => {
                                                                                        const val = e.target.value.replace(/\D/g, '');
                                                                                        updateSubVariantField(vIdx, svIdx, 'weight', val === '' ? '' : parseInt(val, 10));
                                                                                    }}
                                                                                    placeholder="e.g. 1000"
                                                                                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold outline-none focus:border-blue-950"
                                                                                    required
                                                                                />
                                                                                <span className="absolute right-2.5 text-xs font-bold text-slate-400">gram</span>
                                                                            </div>
                                                                            {getVariantError(vIdx, svIdx, 'weight') && (
                                                                                <p className="mt-1 text-[10px] font-semibold text-rose-500">
                                                                                    {getVariantError(vIdx, svIdx, 'weight')}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Sub-Variant Image Upload (At the very bottom of fields) */}
                                                                <div className="pt-2 border-t border-slate-100">
                                                                    <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">{t('backoffice.product.form.sub_variant_image', 'Gambar Sub-Varian')}</label>
                                                                    <div className="flex items-center gap-2">
                                                                        {subVar.imagePreview && (
                                                                            <div className="relative h-10 w-10 flex-shrink-0">
                                                                                <img
                                                                                    src={subVar.imagePreview}
                                                                                    alt="sub-variant"
                                                                                    className="h-10 w-10 rounded-lg border border-slate-200 object-cover"
                                                                                />
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleSubVariantImage(vIdx, svIdx, null)}
                                                                                    className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-white shadow"
                                                                                >
                                                                                    <X className="h-2 w-2" />
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                        <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-slate-200 bg-white px-2 py-1.5 text-[10px] font-medium text-slate-500 transition hover:border-blue-300 hover:text-blue-950">
                                                                            <Upload className="h-3 w-3" />
                                                                            {subVar.imagePreview ? t('backoffice.product.form.change_image_short', 'Ganti') : t('backoffice.product.form.upload_image_short', 'Upload')}
                                                                            <input
                                                                                type="file"
                                                                                accept="image/*"
                                                                                className="hidden"
                                                                                onChange={e => {
                                                                                    const file = e.target.files[0];
                                                                                    if (file) handleSubVariantImage(vIdx, svIdx, file);
                                                                                    e.target.value = '';
                                                                                }}
                                                                            />
                                                                        </label>
                                                                    </div>
                                                                    {getVariantError(vIdx, svIdx, 'image') && (
                                                                        <p className="mt-1 text-[10px] font-semibold text-rose-500">
                                                                            {getVariantError(vIdx, svIdx, 'image')}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Sub-Variant Branch Stocks */}
                                                            {data.stock_type !== 'parent' && variant.stock_type !== 'parent' && (
                                                                <div className="pt-2 border-t border-slate-100">
                                                                    <p className="mb-1.5 text-[9px] font-black uppercase tracking-wider text-slate-400">
                                                                        {t('backoffice.product.form.branch_stock', 'Stok Cabang Gudang')}
                                                                    </p>
                                                                    <div className="grid grid-cols-3 gap-2">
                                                                        {(subVar.branch_stocks || []).map((bStock, bIdx) => (
                                                                            <div key={bStock.store_branch_id} className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-slate-50/50 p-2">
                                                                                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 text-center block">
                                                                                    {bStock.country_code ? bStock.country_code.toUpperCase() : bStock.branch_name}
                                                                                </label>
                                                                                <div className="space-y-1 w-full">
                                                                                    <input
                                                                                        type="text"
                                                                                        value={formatStockInput(bStock.stock)}
                                                                                        onChange={e => updateSubVariantStock(vIdx, svIdx, bIdx, parseStockInput(e.target.value))}
                                                                                        className="w-full rounded bg-white border border-slate-200 px-1 py-0.5 text-center text-xs font-semibold outline-none focus:border-blue-950"
                                                                                    />
                                                                                    <div className="flex items-center gap-1">
                                                                                        <span className="text-[8px] font-bold text-slate-400 uppercase leading-none truncate">{t('backoffice.product.form.min_stock_abbr', 'Min')}:</span>
                                                                                        <input
                                                                                            type="text"
                                                                                            value={formatStockInput(bStock.low_stock_threshold ?? 5)}
                                                                                            onChange={e => updateSubVariantLowStockThreshold(vIdx, svIdx, bIdx, parseStockInput(e.target.value))}
                                                                                            className="w-full rounded bg-white/80 border border-slate-200 px-1 py-0.5 text-center text-[9px] font-medium outline-none focus:border-blue-950"
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-[11px] text-slate-400 italic">{t('backoffice.product.form.no_sub_variants_yet', 'Belum ada sub-varian untuk varian ini.')}</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Branch stocks */}
                                    {!hasSubVariants && data.stock_type !== 'parent' && (
                                        <div className="mt-4 border-t border-dashed border-slate-200 pt-3">
                                            <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                {t('backoffice.product.form.branch_stock_allocation', 'Alokasi Stok Gudang Cabang')}
                                            </p>
                                            <div className="grid grid-cols-3 gap-3">
                                                {variant.branch_stocks.map((bStock, bIdx) => (
                                                    <div
                                                        key={bStock.store_branch_id}
                                                        className="flex flex-col gap-1.5 rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm"
                                                    >
                                                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 text-center block">
                                                            {bStock.country_code ? bStock.country_code.toUpperCase() : bStock.branch_name}
                                                        </label>
                                                        <div className="space-y-1 w-full">
                                                            <input
                                                                type="text"
                                                                value={formatStockInput(bStock.stock)}
                                                                onChange={e => updateVariantStock(vIdx, bIdx, parseStockInput(e.target.value))}
                                                                className="w-full rounded bg-slate-50 border border-slate-200 px-1.5 py-1 text-center text-xs font-semibold outline-none focus:border-blue-950 focus:bg-white"
                                                            />
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-[9px] font-bold text-slate-400 uppercase leading-none truncate">{t('backoffice.product.form.min_stock_abbr', 'Min')}:</span>
                                                                <input
                                                                    type="text"
                                                                    value={formatStockInput(bStock.low_stock_threshold ?? 5)}
                                                                    onChange={e => updateVariantLowStockThreshold(vIdx, bIdx, parseStockInput(e.target.value))}
                                                                    className="w-full rounded bg-slate-50/50 border border-slate-200/80 px-1 py-0.5 text-center text-[10px] font-medium outline-none focus:border-blue-950 focus:bg-white"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {data.variants.length === 0 && (
                        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-10 text-slate-400">
                            <Layers className="h-8 w-8 stroke-[1.5]" />
                            <p className="text-sm">{t('backoffice.product.form.no_variants_yet', 'Belum ada varian. Pilih tipe varian di atas untuk menambah.')}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
