import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Globe } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import ConfirmModal from '../../components/ConfirmModal';
import SuccessModal from '../../components/SuccessModal';
import { useLanguage } from '@/Contexts/LanguageContext';

// Import modular components
import ProductInfoSection from './components/ProductInfoSection';
import ProductGallerySection from './components/ProductGallerySection';
import ProductVariantsSection from './components/ProductVariantsSection';
import ProductClassificationSection from './components/ProductClassificationSection';
import ProductFormActions from './components/ProductFormActions';


// ─── ProductForm (main) ───────────────────────────────────────────────────────
export default function ProductForm({
    product = null,
    categories = [],
    storeBranches = [],
    units = [],
    productNameTranslations = null,
    productDescTranslations = null,
    productVariants = [],
    initialStocks = [],
    productImages = [],
    status,
    statusAction,
}) {
    const { t, locale } = useLanguage();
    const isEditing = Boolean(product);

    const languageTabs = useMemo(() => [
        { id: 'indonesia', label: 'Indonesia' },
        { id: 'arabic', label: 'Arab (العربية)' },
        { id: 'english', label: 'English' },
    ], []);

    // ── local UI state ────────────────────────────────────────────────────────
    const [activeLang, setActiveLang] = useState('indonesia');
    const [selectedCategory, setSelectedCategory] = useState(product?.product_category_id ?? '');
    const [pendingDeleteVariant, setPendingDeleteVariant] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(
        (statusAction === 'created' || statusAction === 'updated') && Boolean(status),
    );

    // Image previews (existing first, then new uploads)
    const [imagePreviews, setImagePreviews] = useState(() =>
        productImages.map(img => `/storage/${img.image_path}`),
    );

    // Variant type selector
    const [pendingType, setPendingType] = useState('');
    const [showCustomType, setShowCustomType] = useState(false);
    const [customTypeValue, setCustomTypeValue] = useState('');
    const typeSelectRef = useRef(null);

    // ── derived data ──────────────────────────────────────────────────────────
    const availableSubCategories = useMemo(() => {
        const cat = categories.find(c => c.id === Number(selectedCategory));
        return cat?.subCategories ?? cat?.sub_categories ?? [];
    }, [selectedCategory, categories]);

    useEffect(() => {
        setShowSuccessModal((statusAction === 'created' || statusAction === 'updated') && Boolean(status));
    }, [status, statusAction]);

    const isEmpty = v => typeof v !== 'string' || v.trim() === '';

    // Helper to group flat variants from DB into parent and sub-variants
    const groupVariantsFromDB = (productVariants, storeBranches, units) => {
        const parentGroups = {};

        productVariants.forEach(v => {
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

            let parentTypeTranslations = { indonesia: parentType, english: parentType, arabic: parentType };
            let subTypeTranslations = { indonesia: 'Ukuran', english: 'Size', arabic: 'المقاس' };

            if (v.type_translations) {
                const indoType = v.type_translations.indonesia || '';
                const engType = v.type_translations.english || '';
                const araType = v.type_translations.arabic || '';

                const splitTranslation = (str) => {
                    if (str.includes(' | ')) {
                        const parts = str.split(' | ');
                        return [parts[0].trim(), parts[1].trim()];
                    }
                    return [str.trim(), null];
                };

                const [pIndo, sIndo] = splitTranslation(indoType);
                const [pEng, sEng] = splitTranslation(engType);
                const [pAra, sAra] = splitTranslation(araType);

                parentTypeTranslations = {
                    indonesia: pIndo || parentType,
                    english: pEng || pIndo || parentType,
                    arabic: pAra || pIndo || parentType,
                };

                if (sIndo || sEng || sAra) {
                    subTypeTranslations = {
                        indonesia: sIndo || 'Ukuran',
                        english: sEng || sIndo || 'Size',
                        arabic: sAra || sIndo || 'المقاس',
                    };
                }
            } else {
                parentTypeTranslations = {
                    indonesia: parentType,
                    english: parentType,
                    arabic: parentType,
                };
                if (subType) {
                    subTypeTranslations = {
                        indonesia: subType,
                        english: subType,
                        arabic: subType,
                    };
                }
            }

            const parentKey = `${parentType}_${parentNameIndo}`;

            // Determine if there is actually a sub-variant
            const hasSub = matchesIndo.length > 0;

            if (!parentGroups[parentKey]) {
                parentGroups[parentKey] = {
                    id: hasSub ? null : v.id,
                    type: parentType,
                    type_translations: parentTypeTranslations,
                    sku: hasSub ? '' : v.sku,
                    price: hasSub ? '' : v.price,
                    unit_id: hasSub ? '' : v.unit_id,
                    image: null,
                    imagePreview: hasSub ? null : (v.image ? `/storage/${v.image}` : null),
                    name_translations: {
                        indonesia: parentNameIndo,
                        english: parentNameEng,
                        arabic: parentNameAra,
                    },
                    has_sub_variants: hasSub,
                    sub_variants: [],
                    branch_stocks: hasSub ? [] : storeBranches.map(branch => {
                        const existing = v.stocks?.find(s => s.store_branch_id === branch.id);
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
                    type_translations: subTypeTranslations,
                    name_translations: {
                        indonesia: parsedSize,
                        english: isUnitSize && subUnitId ? valEng.replace(new RegExp(units.find(u => u.id === Number(subUnitId))?.name || '', 'i'), '').trim() : valEng,
                        arabic: isUnitSize && subUnitId ? valAra.replace(new RegExp(units.find(u => u.id === Number(subUnitId))?.name || '', 'i'), '').trim() : valAra,
                    },
                    unit_id: subUnitId || '',
                    sku: v.sku || '',
                    price: v.price || '',
                    image: null,
                    imagePreview: v.image ? `/storage/${v.image}` : null,
                    branch_stocks: storeBranches.map(branch => {
                        const existing = v.stocks?.find(s => s.store_branch_id === branch.id);
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

        return Object.values(parentGroups);
    };

    const isLangMissing = (langKey) => {
        if (isEmpty(form.data.name_translations?.[langKey] ?? '')) return true;
        if (isEmpty(form.data.description_translations?.[langKey] ?? '')) return true;
        if (form.data.has_variants && form.data.variants.length > 0) {
            return form.data.variants.some(v => {
                if (v.has_sub_variants && v.sub_variants && v.sub_variants.length > 0) {
                    return isEmpty(v.name_translations?.[langKey] ?? '') || v.sub_variants.some(sv => isEmpty(sv.name_translations?.[langKey] ?? ''));
                }
                return isEmpty(v.name_translations?.[langKey] ?? '');
            });
        }
        return false;
    };

    // ── form state ────────────────────────────────────────────────────────────
    const form = useForm({
        name_translations: productNameTranslations ?? { indonesia: '', arabic: '', english: '' },
        description_translations: productDescTranslations ?? { indonesia: '', arabic: '', english: '' },
        product_category_id: product?.product_category_id ?? '',
        product_sub_category_id: product?.product_sub_category_id ?? '',
        sku: product?.sku ?? '',
        price: product?.price ?? '',
        has_variants: productVariants.length > 0,
        is_new: product?.is_new ?? false,
        is_best_seller: product?.is_best_seller ?? false,

        // Gallery images
        images: [],   // new File uploads
        primary_image_index: productImages.findIndex(i => i.is_primary) >= 0
            ? productImages.findIndex(i => i.is_primary)
            : 0,
        existing_image_ids: productImages.map(i => i.id),

        // Standard stock (no-variant mode)
        branch_stocks: storeBranches.map(branch => {
            const existing = initialStocks.find(s => s.store_branch_id === branch.id);
            return {
                store_branch_id: branch.id,
                branch_name: branch.name,
                country_code: branch.country_code,
                stock: existing?.stock ?? 0
            };
        }),

        // Variants
        variants: groupVariantsFromDB(productVariants, storeBranches, units),
    });

    // ── image handlers ────────────────────────────────────────────────────────
    const handleAddImages = (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        form.setData('images', [...form.data.images, ...files]);
        const newPreviews = files.map(f => URL.createObjectURL(f));
        setImagePreviews(prev => [...prev, ...newPreviews]);
        e.target.value = '';
    };

    const handleRemoveImage = (idx) => {
        const existingCount = form.data.existing_image_ids.length;
        if (idx < existingCount) {
            const newIds = [...form.data.existing_image_ids];
            newIds.splice(idx, 1);
            form.setData('existing_image_ids', newIds);
        } else {
            const newIdx = idx - existingCount;
            const newFiles = [...form.data.images];
            URL.revokeObjectURL(imagePreviews[idx]);
            newFiles.splice(newIdx, 1);
            form.setData('images', newFiles);
        }
        setImagePreviews(prev => {
            const next = [...prev];
            next.splice(idx, 1);
            return next;
        });
        if (form.data.primary_image_index >= idx && form.data.primary_image_index > 0) {
            form.setData('primary_image_index', form.data.primary_image_index - 1);
        }
    };

    const handleSetPrimary = (idx) => form.setData('primary_image_index', idx);

    // ── variant type handlers ─────────────────────────────────────────────────
    const handleTypeSelect = (e) => {
        const val = e.target.value;
        if (val === '__new__') {
            setShowCustomType(true);
            setPendingType('');
        } else {
            setShowCustomType(false);
            setPendingType(val);
        }
    };

    const addVariant = (type) => {
        if (!type.trim()) return;
        const defaultTranslations = {
            indonesia: type.trim(),
            english: type.trim() === 'Ukuran' ? 'Size' : type.trim() === 'Warna' ? 'Color' : type.trim() === 'Rasa' ? 'Flavor' : type.trim() === 'Model' ? 'Model' : type.trim() === 'Bahan' ? 'Material' : type.trim(),
            arabic: type.trim() === 'Ukuran' ? 'المقاس' : type.trim() === 'Warna' ? 'اللون' : type.trim() === 'Rasa' ? 'النكهة' : type.trim() === 'Model' ? 'الموديل' : type.trim() === 'Bahan' ? 'المادة' : type.trim(),
        };

        form.setData(data => ({
            ...data,
            has_variants: true,
            variants: [
                {
                    id: null,
                    type: type.trim(),
                    type_translations: defaultTranslations,
                    sku: '', price: '', unit_id: '',
                    image: null, imagePreview: null,
                    name_translations: { indonesia: '', arabic: '', english: '' },
                    has_sub_variants: false,
                    sub_variants: [],
                    branch_stocks: storeBranches.map(b => ({
                        store_branch_id: b.id,
                        branch_name: b.name,
                        country_code: b.country_code,
                        stock: 0,
                    })),
                },
                ...data.variants,
            ],
        }));
        setPendingType('');
        setShowCustomType(false);
        setCustomTypeValue('');
        if (typeSelectRef.current) typeSelectRef.current.value = '';
    };

    // ── variant field updaters ────────────────────────────────────────────────
    const updateVariantField = (idx, field, value) => {
        const updated = [...form.data.variants];
        updated[idx] = { ...updated[idx], [field]: value };
        form.setData('variants', updated);
    };

    const updateVariantLang = (vIdx, langKey, value) => {
        const updated = [...form.data.variants];
        updated[vIdx] = {
            ...updated[vIdx],
            name_translations: { ...updated[vIdx].name_translations, [langKey]: value },
        };
        form.setData('variants', updated);
    };

    const updateVariantTypeLang = (vIdx, langKey, value) => {
        const updated = [...form.data.variants];
        updated[vIdx] = {
            ...updated[vIdx],
            type_translations: { 
                indonesia: '', english: '', arabic: '', 
                ...updated[vIdx].type_translations, 
                [langKey]: value 
            },
        };
        form.setData('variants', updated);
    };

    // ── sub-variant updaters ──────────────────────────────────────────────────
    const addSubVariant = (vIdx) => {
        const updated = [...form.data.variants];
        updated[vIdx].sub_variants = [
            {
                id: null,
                type: 'Ukuran',
                type_translations: { indonesia: 'Ukuran', english: 'Size', arabic: 'المقاس' },
                name_translations: { indonesia: '', arabic: '', english: '' },
                unit_id: '',
                sku: '',
                price: '',
                image: null,
                imagePreview: null,
                branch_stocks: storeBranches.map(b => ({
                    store_branch_id: b.id,
                    branch_name: b.name,
                    country_code: b.country_code,
                    stock: 0,
                })),
            },
            ...updated[vIdx].sub_variants,
        ];
        form.setData('variants', updated);
    };

    const removeSubVariant = (vIdx, svIdx) => {
        const updated = [...form.data.variants];
        updated[vIdx].sub_variants = updated[vIdx].sub_variants.filter((_, i) => i !== svIdx);
        form.setData('variants', updated);
    };

    const updateSubVariantField = (vIdx, svIdx, field, value) => {
        const updated = [...form.data.variants];
        updated[vIdx].sub_variants = updated[vIdx].sub_variants.map((sv, i) =>
            i === svIdx ? { ...sv, [field]: value } : sv
        );
        form.setData('variants', updated);
    };

    const updateSubVariantLang = (vIdx, svIdx, langKey, value) => {
        const updated = [...form.data.variants];
        updated[vIdx].sub_variants = updated[vIdx].sub_variants.map((sv, i) =>
            i === svIdx ? {
                ...sv,
                name_translations: { ...sv.name_translations, [langKey]: value }
            } : sv
        );
        form.setData('variants', updated);
    };

    const updateSubVariantTypeLang = (vIdx, svIdx, langKey, value) => {
        const updated = [...form.data.variants];
        updated[vIdx].sub_variants = updated[vIdx].sub_variants.map((sv, i) =>
            i === svIdx ? {
                ...sv,
                type_translations: { 
                    indonesia: '', english: '', arabic: '', 
                    ...sv.type_translations, 
                    [langKey]: value 
                }
            } : sv
        );
        form.setData('variants', updated);
    };

    const updateSubVariantStock = (vIdx, svIdx, bIdx, value) => {
        const updated = [...form.data.variants];
        const sv = updated[vIdx].sub_variants[svIdx];
        sv.branch_stocks[bIdx].stock = value === '' ? '' : (parseInt(value) >= 0 ? parseInt(value) : 0);
        form.setData('variants', updated);
    };

    const handleSubVariantImage = (vIdx, svIdx, file) => {
        const updated = [...form.data.variants];
        const sv = updated[vIdx].sub_variants[svIdx];
        if (sv.image instanceof File) {
            URL.revokeObjectURL(sv.imagePreview ?? '');
        }
        updated[vIdx].sub_variants[svIdx] = {
            ...sv,
            image: file,
            imagePreview: file ? URL.createObjectURL(file) : null,
            image_deleted: file === null && sv.id !== null,
        };
        form.setData('variants', updated);
    };

    const updateVariantStock = (vIdx, bIdx, value) => {
        const updated = [...form.data.variants];
        updated[vIdx].branch_stocks[bIdx].stock = value === '' ? '' : (parseInt(value) >= 0 ? parseInt(value) : 0);
        form.setData('variants', updated);
    };

    const updateStandardStock = (bIdx, value) => {
        const updated = [...form.data.branch_stocks];
        updated[bIdx].stock = value === '' ? '' : (parseInt(value) >= 0 ? parseInt(value) : 0);
        form.setData('branch_stocks', updated);
    };

    const handleVariantImage = (vIdx, file) => {
        const updated = [...form.data.variants];
        if (updated[vIdx].image instanceof File) {
            URL.revokeObjectURL(updated[vIdx].imagePreview ?? '');
        }
        updated[vIdx] = {
            ...updated[vIdx],
            image: file,
            imagePreview: file ? URL.createObjectURL(file) : null,
            image_deleted: file === null && updated[vIdx].id !== null,
        };
        form.setData('variants', updated);
    };

    const removeVariant = (idx) => setPendingDeleteVariant(idx);

    const confirmRemoveVariant = () => {
        if (pendingDeleteVariant === null) return;
        const updated = form.data.variants.filter((_, i) => i !== pendingDeleteVariant);
        form.setData(data => ({ ...data, variants: updated, has_variants: updated.length > 0 }));
        setPendingDeleteVariant(null);
    };

    // ── category handler ──────────────────────────────────────────────────────
    const handleCategoryChange = (e) => {
        const value = e.target.value;
        setSelectedCategory(value);
        form.setData(data => ({ ...data, product_category_id: value, product_sub_category_id: '' }));
    };

    // ── submit ────────────────────────────────────────────────────────────────
    const submit = (e) => {
        e.preventDefault();

        // Transform data before sending
        form.transform((data) => {
            const cleanedBranchStocks = data.branch_stocks.map(bs => ({
                ...bs,
                stock: bs.stock === '' ? 0 : bs.stock
            }));

            const transformedVariants = [];

            data.variants.forEach((v) => {
                if (v.has_sub_variants && v.sub_variants && v.sub_variants.length > 0) {
                    v.sub_variants.forEach((sv) => {
                        let nameTranslations = { ...v.name_translations };

                        const getSuffix = (subVar, lang) => {
                            const val = subVar.name_translations?.[lang] || '';
                            if (!val) return '';
                            if (subVar.type === 'Ukuran' && subVar.unit_id) {
                                const unitObj = units.find(u => Number(u.id) === Number(subVar.unit_id));
                                const unitName = unitObj ? unitObj.name : '';
                                return ` (${val} ${unitName})`.trim();
                            }
                            return ` (${val})`.trim();
                        };

                        const appendSuffix = (lang) => {
                            let baseVal = v.name_translations?.[lang] || '';
                            baseVal = baseVal.replace(/\s*\([^)]+\)/g, '').trim();
                            if (!baseVal) return '';
                            const suffix = getSuffix(sv, lang);
                            return suffix ? `${baseVal} ${suffix}`.trim() : baseVal;
                        };

                        nameTranslations = {
                            indonesia: appendSuffix('indonesia'),
                            arabic: appendSuffix('arabic'),
                            english: appendSuffix('english'),
                        };

                        const cleanedVariantStocks = (sv.branch_stocks || []).map(bs => ({
                            ...bs,
                            stock: bs.stock === '' ? 0 : bs.stock
                        }));

                        const typeTranslations = {
                            indonesia: `${v.type_translations?.indonesia || v.type} | ${sv.type_translations?.indonesia || sv.type}`,
                            english: `${v.type_translations?.english || v.type} | ${sv.type_translations?.english || sv.type}`,
                            arabic: `${v.type_translations?.arabic || v.type} | ${sv.type_translations?.arabic || sv.type}`,
                        };

                        transformedVariants.push({
                            id: sv.id ?? null,
                            type: `${v.type} | ${sv.type}`,
                            type_translations: typeTranslations,
                            sku: sv.sku ?? '',
                            price: sv.price ?? '',
                            unit_id: sv.unit_id || null,
                            image: sv.image,
                            image_deleted: sv.image_deleted || false,
                            name: nameTranslations.indonesia || nameTranslations.english || nameTranslations.arabic || '',
                            name_translations: nameTranslations,
                            branch_stocks: cleanedVariantStocks
                        });
                    });
                } else {
                    const cleanedVariantStocks = v.branch_stocks.map(bs => ({
                        ...bs,
                        stock: bs.stock === '' ? 0 : bs.stock
                    }));

                    transformedVariants.push({
                        id: v.id ?? null,
                        type: v.type ?? '',
                        type_translations: v.type_translations,
                        sku: v.sku ?? '',
                        price: v.price ?? '',
                        unit_id: v.unit_id || null,
                        image: v.image,
                        image_deleted: v.image_deleted || false,
                        name: v.name_translations?.indonesia || v.name_translations?.english || v.name_translations?.arabic || '',
                        name_translations: v.name_translations,
                        branch_stocks: cleanedVariantStocks
                    });
                }
            });

            return {
                ...data,
                ...(isEditing ? { _method: 'PATCH' } : {}),
                branch_stocks: cleanedBranchStocks,
                variants: transformedVariants
            };
        });

        if (isEditing) {
            form.post(route('backoffice.products.update', product.slug), {
                preserveScroll: true,
                forceFormData: true
            });
        } else {
            form.post(route('backoffice.products.store'), {
                preserveScroll: true,
                forceFormData: true
            });
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-950 selection:text-white">
            <Head title={isEditing ? `${t('backoffice.product.form.page_title_edit', 'Edit Produk')} — Fayyfir` : `${t('backoffice.product.form.page_title_create', 'Tambah Produk')} — Fayyfir`} />

            <ConfirmModal
                show={pendingDeleteVariant !== null}
                title={t('backoffice.product.form.confirm_delete_variant', 'Hapus Varian')}
                message={t('backoffice.product.form.confirm_delete_variant_msg', 'Hapus varian #{number}? Stok cabang terkait juga akan dihapus.').replace('{number}', pendingDeleteVariant !== null ? pendingDeleteVariant + 1 : '')}
                confirmLabel={t('backoffice.product.delete.btn_confirm', 'Hapus')}
                cancelLabel={t('backoffice.product.btn_cancel', 'Batal')}
                onConfirm={confirmRemoveVariant}
                onCancel={() => setPendingDeleteVariant(null)}
            />
            <SuccessModal
                show={showSuccessModal}
                title={statusAction === 'updated' ? t('backoffice.product.success.updated', 'Produk Diperbarui') : t('backoffice.product.success.created', 'Produk Ditambahkan')}
                message={status ?? ''}
                btnLabel={t('backoffice.product.success.btn_ok', 'Selesai')}
                onClose={() => setShowSuccessModal(false)}
            />

            <div className="flex min-h-screen">
                <Sidebar />
                <main className="flex min-w-0 flex-1 flex-col">
                    <Navbar />
                    <div className="flex-1 space-y-6 p-6 lg:p-8">

                        {/* ── Header ─────────────────────────────────────── */}
                        <section className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
                            <div>
                                <span className="text-xs font-bold uppercase tracking-widest text-amber-600">{t('backoffice.product.suite', 'Fayyfir Inventory Suite')}</span>
                                <h1 className="mt-1 text-3xl font-black tracking-tight text-blue-950 lg:text-4xl">
                                    {isEditing ? t('backoffice.product.form.title_edit', 'Edit Produk') : t('backoffice.product.form.title_create', 'Tambah Produk')}
                                </h1>
                            </div>
                            <Link
                                href={route('backoffice.products.index')}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-blue-950 active:scale-95"
                            >
                                <ArrowLeft className="h-4 w-4" /> {t('backoffice.product.form.btn_back', 'Kembali')}
                            </Link>
                        </section>

                        {/* ── Language Tabs ────────────────────────────── */}
                        <div className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/50 p-3 shadow-inner">
                            <div className="flex items-center gap-2 text-blue-950">
                                <Globe className="h-4 w-4 text-amber-500" />
                                <span className="text-xs font-bold uppercase tracking-wider">{t('backoffice.product.form.lang_title', 'Bahasa Konten')}</span>
                            </div>
                            <div className="inline-flex gap-2 rounded-xl bg-white p-1.5 shadow-sm">
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
                                            className={`relative rounded-lg px-4 py-2 text-xs font-black transition-all duration-300 ${activeLang === tab.id
                                                ? 'bg-blue-950 text-white shadow-md'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-blue-950'
                                                }`}
                                        >
                                            <span className="flex items-center gap-2">
                                                {label}
                                                {isLangMissing(tab.id) && (
                                                    <span className="h-2 w-2 rounded-full bg-rose-500 ring-4 ring-rose-500/20" />
                                                )}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ── Form Grid ────────────────────────────────── */}
                        <form onSubmit={submit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">

                            {/* LEFT COLUMN */}
                            <div className="space-y-6 lg:col-span-2">
                                <ProductInfoSection
                                    activeLang={activeLang}
                                    data={form.data}
                                    setData={form.setData}
                                    errors={form.errors}
                                    t={t}
                                />

                                <ProductGallerySection
                                    previews={imagePreviews}
                                    primaryIndex={form.data.primary_image_index}
                                    onAdd={handleAddImages}
                                    onRemove={handleRemoveImage}
                                    onSetPrimary={handleSetPrimary}
                                    t={t}
                                />

                                <ProductVariantsSection
                                    data={form.data}
                                    setData={form.setData}
                                    errors={form.errors}
                                    units={units}
                                    activeLang={activeLang}
                                    storeBranches={storeBranches}
                                    pendingType={pendingType}
                                    setPendingType={setPendingType}
                                    showCustomType={showCustomType}
                                    setShowCustomType={setShowCustomType}
                                    customTypeValue={customTypeValue}
                                    setCustomTypeValue={setCustomTypeValue}
                                    typeSelectRef={typeSelectRef}
                                    handleTypeSelect={handleTypeSelect}
                                    addVariant={addVariant}
                                    removeVariant={removeVariant}
                                    updateVariantField={updateVariantField}
                                    updateVariantLang={updateVariantLang}
                                    updateVariantTypeLang={updateVariantTypeLang}
                                    updateVariantStock={updateVariantStock}
                                    updateStandardStock={updateStandardStock}
                                    handleVariantImage={handleVariantImage}
                                    addSubVariant={addSubVariant}
                                    removeSubVariant={removeSubVariant}
                                    updateSubVariantField={updateSubVariantField}
                                    updateSubVariantLang={updateSubVariantLang}
                                    updateSubVariantTypeLang={updateSubVariantTypeLang}
                                    updateSubVariantStock={updateSubVariantStock}
                                    handleSubVariantImage={handleSubVariantImage}
                                    t={t}
                                />
                            </div>

                            {/* RIGHT COLUMN (Sticky Sidebar Layout) */}
                            <div className="space-y-3 lg:sticky lg:top-6 self-start">
                                <ProductClassificationSection
                                    data={form.data}
                                    setData={form.setData}
                                    errors={form.errors}
                                    categories={categories}
                                    availableSubCategories={availableSubCategories}
                                    handleCategoryChange={handleCategoryChange}
                                    t={t}
                                    locale={locale}
                                />

                                <ProductFormActions
                                    processing={form.processing}
                                    isEditing={isEditing}
                                    t={t}
                                />
                            </div>

                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
}