import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Globe } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import ConfirmModal from '../../components/ConfirmModal';
import SuccessModal from '../../components/SuccessModal';
import { useLanguage } from '@/Contexts/LanguageContext';
import axios from 'axios';


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
    const [skuAlert, setSkuAlert] = useState({ show: false, message: '' });

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
        // If there's any variant with a non-null parent_id, group by parent_id
        const hasParentRelations = productVariants.some(v => v.parent_id !== null && v.parent_id !== undefined);

        if (hasParentRelations) {
            const parents = productVariants.filter(v => v.parent_id === null || v.parent_id === undefined);
            const children = productVariants.filter(v => v.parent_id !== null && v.parent_id !== undefined);

            return parents.map(p => {
                const pChildren = children.filter(c => Number(c.parent_id) === Number(p.id));
                const hasSub = pChildren.length > 0;

                const parseChildName = (fullValue, parentValue) => {
                    if (!fullValue) return '';
                    let clean = fullValue;
                    if (parentValue && fullValue.startsWith(parentValue)) {
                        clean = fullValue.slice(parentValue.length).trim();
                    }
                    const match = clean.match(/\(([^)]+)\)/);
                    if (match) {
                        return match[1].trim();
                    }
                    return clean;
                };

                return {
                    id: p.id,
                    type: p.type,
                    type_translations: p.type_translations,
                    sku: hasSub ? '' : (p.sku || ''),
                    price: hasSub ? '' : (p.price || ''),
                    unit_id: hasSub ? '' : (p.unit_id || ''),
                    weight: hasSub ? '' : (p.weight ?? ''),
                    image: null,
                    imagePreview: hasSub ? null : (p.image ? `/storage/${p.image}` : null),
                    name_translations: p.name_translations,
                    has_sub_variants: hasSub,
                    stock_type: p.stock_type || 'variant',
                    unit: (p.unit && typeof p.unit === 'object') ? (p.unit.name || '') : (p.unit || ''),
                    branch_stocks: storeBranches.map(branch => {
                        const existing = p.stocks?.find(s => Number(s.store_branch_id) === Number(branch.id));
                        return {
                            store_branch_id: branch.id,
                            branch_name: branch.name,
                            country_code: branch.country_code,
                            stock: existing?.stock ?? 0
                        };
                    }),
                    sub_variants: pChildren.map(c => {
                        let subType = c.type;
                        if (c.type && c.type.includes(' | ')) {
                            subType = c.type.split(' | ')[1].trim();
                        }

                        let subTypeTranslations = { indonesia: 'Ukuran', english: 'Size', arabic: 'المقاس' };
                        if (c.type_translations) {
                            const splitTranslation = (str) => {
                                if (str && str.includes(' | ')) {
                                    return str.split(' | ')[1].trim();
                                }
                                return null;
                            };
                            const sIndo = splitTranslation(c.type_translations.indonesia);
                            const sEng = splitTranslation(c.type_translations.english);
                            const sAra = splitTranslation(c.type_translations.arabic);
                            if (sIndo || sEng || sAra) {
                                subTypeTranslations = {
                                    indonesia: sIndo || 'Ukuran',
                                    english: sEng || sIndo || 'Size',
                                    arabic: sAra || sIndo || 'المقاس',
                                };
                            }
                        }

                        const cleanIndo = parseChildName(c.name_translations?.indonesia, p.name_translations?.indonesia);
                        const cleanEng = parseChildName(c.name_translations?.english, p.name_translations?.english);
                        const cleanAra = parseChildName(c.name_translations?.arabic, p.name_translations?.arabic);

                        const parentUnitName = (p.unit && typeof p.unit === 'object') ? (p.unit.name || '') : (p.unit || '');

                        let parsedSize = cleanIndo;
                        let subUnitId = c.unit_id ? String(c.unit_id) : '';

                        if (c.unit_id) {
                            const foundUnit = units.find(u => {
                                const name = u.name.toLowerCase();
                                return cleanIndo.toLowerCase().includes(name);
                            });
                            if (foundUnit) {
                                parsedSize = cleanIndo.replace(new RegExp(foundUnit.name, 'i'), '').trim();
                            }
                        } else if (p.stock_type === 'parent' && parentUnitName) {
                            parsedSize = cleanIndo.replace(new RegExp(parentUnitName, 'i'), '').trim();
                        }

                        return {
                            id: c.id,
                            type: subType,
                            type_translations: subTypeTranslations,
                            name_translations: {
                                indonesia: parsedSize,
                                english: (c.unit_id && subUnitId) 
                                    ? cleanEng.replace(new RegExp(units.find(u => u.id === Number(subUnitId))?.name || '', 'i'), '').trim() 
                                    : (p.stock_type === 'parent' && parentUnitName) 
                                        ? cleanEng.replace(new RegExp(parentUnitName, 'i'), '').trim() 
                                        : cleanEng,
                                arabic: (c.unit_id && subUnitId) 
                                    ? cleanAra.replace(new RegExp(units.find(u => u.id === Number(subUnitId))?.name || '', 'i'), '').trim() 
                                    : (p.stock_type === 'parent' && parentUnitName) 
                                        ? cleanAra.replace(new RegExp(parentUnitName, 'i'), '').trim() 
                                        : cleanAra,
                            },
                            unit_id: subUnitId,
                            sku: c.sku || '',
                            price: c.price || '',
                            weight: c.weight ?? '',
                            image: null,
                            imagePreview: c.image ? `/storage/${c.image}` : null,
                            branch_stocks: storeBranches.map(branch => {
                                const existing = c.stocks?.find(s => Number(s.store_branch_id) === Number(branch.id));
                                return {
                                    store_branch_id: branch.id,
                                    branch_name: branch.name,
                                    country_code: branch.country_code,
                                    stock: existing?.stock ?? 0
                                };
                            }),
                        };
                    })
                };
            });
        }

        const parentGroups = {};

        productVariants.forEach(v => {
            const indonesiaName = v.name_translations?.indonesia || v.name || '';
            const englishName = v.name_translations?.english || '';
            const arabicName = v.name_translations?.arabic || '';

            const regex = /\(([^)]+)\)/g;
            const matchesIndo = [...indonesiaName.matchAll(regex)].map(m => m[1]);
            const matchesEng = [...englishName.matchAll(regex)].map(m => m[1]);
            const matchesAra = [...arabicName.matchAll(regex)].map(m => m[1]);

            const cleanName = (str) => str.replace(/\s*\([^)]+\)/g, '').trim();
            const parentNameIndo = cleanName(indonesiaName);
            const parentNameEng = cleanName(englishName);
            const parentNameAra = cleanName(arabicName);

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
            const hasSub = matchesIndo.length > 0;

            if (!parentGroups[parentKey]) {
                parentGroups[parentKey] = {
                    id: hasSub ? null : v.id,
                    type: parentType,
                    type_translations: parentTypeTranslations,
                    sku: hasSub ? '' : v.sku,
                    price: hasSub ? '' : v.price,
                    unit_id: hasSub ? '' : v.unit_id,
                    weight: hasSub ? '' : (v.weight ?? ''),
                    image: null,
                    imagePreview: hasSub ? null : (v.image ? `/storage/${v.image}` : null),
                    name_translations: {
                        indonesia: parentNameIndo,
                        english: parentNameEng,
                        arabic: parentNameAra,
                    },
                    has_sub_variants: hasSub,
                    stock_type: v.stock_type || 'variant',
                    unit: (v.unit && typeof v.unit === 'object') ? (v.unit.name || '') : (v.unit || ''),
                    sub_variants: [],
                    branch_stocks: hasSub ? [] : storeBranches.map(branch => {
                        const existing = v.stocks?.find(s => Number(s.store_branch_id) === Number(branch.id));
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
                    isUnitSize = true;
                    subUnitId = String(v.unit_id);
                    const foundUnit = units.find(u => {
                        const name = u.name.toLowerCase();
                        return valIndo.toLowerCase().includes(name);
                    });
                    if (foundUnit) {
                        parsedSize = valIndo.replace(new RegExp(foundUnit.name, 'i'), '').trim();
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
                    weight: v.weight ?? '',
                    image: null,
                    imagePreview: v.image ? `/storage/${v.image}` : null,
                    branch_stocks: storeBranches.map(branch => {
                        const existing = v.stocks?.find(s => Number(s.store_branch_id) === Number(branch.id));
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
        stock_type: product?.stock_type ?? 'variant',
        unit: product?.unit ?? '',
        weight: product?.weight ?? '',
        capacity: product?.capacity ?? 1,

        // Gallery images
        images: [],   // new File uploads
        primary_image_index: productImages.findIndex(i => i.is_primary) >= 0
            ? productImages.findIndex(i => i.is_primary)
            : 0,
        existing_image_ids: productImages.map(i => i.id),

        // Standard stock (no-variant mode)
        branch_stocks: storeBranches.map(branch => {
            const existing = initialStocks.find(s => Number(s.store_branch_id) === Number(branch.id));
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

    const hasWeightVariant = useMemo(() => {
        if (!form.data.has_variants || !form.data.variants) return false;
        return form.data.variants.some(v => {
            const isSize = v.type?.toLowerCase() === 'ukuran' || v.type_translations?.indonesia?.toLowerCase() === 'ukuran';
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
                return name === 'gr' || name === 'kg' || name === 'g' || name === 'gram' || name === 'kilogram';
            };

            const isParentWeightUnit = (unitName) => {
                if (!unitName) return false;
                const name = unitName.toLowerCase();
                return name === 'gr' || name === 'kg' || name === 'g' || name === 'gram' || name === 'kilogram';
            };

            if (v.has_sub_variants) {
                return v.sub_variants?.some(sv => {
                    const svName = sv.name_translations?.indonesia || '';
                    return isWeightStr(svName) || isWeightUnit(sv.unit_id);
                });
            } else {
                const vName = v.name_translations?.indonesia || '';
                return isWeightStr(vName) || isWeightUnit(v.unit_id) || isParentWeightUnit(v.unit);
            }
        });
    }, [form.data.has_variants, form.data.variants, units]);

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
        const trimmedType = type.trim();
        const lowerType = trimmedType.toLowerCase();

        const defaultTranslations = {
            indonesia: lowerType === 'ukuran' ? 'Ukuran' : lowerType === 'warna' ? 'Warna' : lowerType === 'rasa' ? 'Rasa' : lowerType === 'model' ? 'Model' : lowerType === 'bahan' ? 'Bahan' : trimmedType,
            english: lowerType === 'ukuran' ? 'Size' : lowerType === 'warna' ? 'Color' : lowerType === 'rasa' ? 'Flavor' : lowerType === 'model' ? 'Model' : lowerType === 'bahan' ? 'Material' : trimmedType,
            arabic: lowerType === 'ukuran' ? 'المقاس' : lowerType === 'warna' ? 'اللون' : lowerType === 'rasa' ? 'النكهة' : lowerType === 'model' ? 'الموديل' : lowerType === 'bahan' ? 'المادة' : trimmedType,
        };

        form.setData(data => ({
            ...data,
            has_variants: true,
            variants: [
                {
                    id: null,
                    type: type.trim(),
                    type_translations: defaultTranslations,
                    sku: '', price: '', unit_id: '', weight: '',
                    image: null, imagePreview: null,
                    name_translations: { indonesia: '', arabic: '', english: '' },
                    has_sub_variants: false,
                    stock_type: 'variant',
                    unit: '',
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

    /**
     * Mengganti stock_type varian dengan sanitasi otomatis:
     * - Ganti ke 'parent'  → hapus unit_id di semua sub-varian (ikut satuan induk varian)
     * - Ganti ke 'variant' → hapus unit induk varian (tiap sub-varian pilih satuannya sendiri)
     */
    const changeVariantStockType = (vIdx, newStockType) => {
        const updated = [...form.data.variants];
        const v = { ...updated[vIdx] };
        v.stock_type = newStockType;
        if (newStockType === 'parent') {
            // Sub-varian tidak boleh punya unit_id sendiri — akan ikut unit induk varian
            v.sub_variants = (v.sub_variants || []).map(sv => ({ ...sv, unit_id: '' }));
        } else {
            // Mode per-varian: hapus unit teks pada induk (tiap sub-varian pilih unit_id sendiri)
            v.unit = '';
        }
        updated[vIdx] = v;
        form.setData('variants', updated);
    };

    /**
     * Mengganti stock_type level produk (global) dengan sanitasi otomatis:
     * - Ganti ke 'parent'  → hapus unit_id pada sub-varian Ukuran di semua varian
     * - Ganti ke 'variant' → hapus data.unit produk
     */
    const changeGlobalStockType = (newStockType) => {
        if (newStockType === 'parent') {
            const updatedVariants = form.data.variants.map(v => ({
                ...v,
                sub_variants: (v.sub_variants || []).map(sv => ({
                    ...sv,
                    unit_id: sv.type?.toLowerCase() === 'ukuran' ? '' : sv.unit_id,
                })),
            }));
            form.setData(prev => ({ ...prev, stock_type: newStockType, variants: updatedVariants }));
        } else {
            // Mode stok per varian: hapus unit produk yang sebelumnya dipilih
            form.setData(prev => ({ ...prev, stock_type: newStockType, unit: '' }));
        }
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
                weight: '',
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

    // Clear main SKU error when its value changes
    useEffect(() => {
        if (form.errors.sku) {
            form.clearErrors('sku');
        }
    }, [form.data.sku]);

    // Clear variant SKU errors when variants data changes
    useEffect(() => {
        Object.keys(form.errors).forEach(key => {
            if (key.startsWith('variants.') && key.endsWith('.sku')) {
                form.clearErrors(key);
            }
        });
    }, [form.data.variants]);

    const validateSkus = (data) => {
        const skuErrors = {};
        const skuMap = new Map();

        const addSku = (path, val, label) => {
            if (!val || !val.trim()) return;
            const cleaned = val.trim().toLowerCase();
            if (!skuMap.has(cleaned)) {
                skuMap.set(cleaned, []);
            }
            skuMap.get(cleaned).push({ path, original: val.trim(), label });
        };

        // 1. Main product SKU
        addSku('sku', data.sku, t('backoffice.product.th_sku', 'SKU Induk'));

        // 2. Variants and Sub-variants SKUs
        if (data.has_variants && data.variants) {
            data.variants.forEach((v, vIdx) => {
                const label = `${t('backoffice.product.th_variant', 'Varian')} #${vIdx + 1}`;
                if (v.has_sub_variants && v.sub_variants && v.sub_variants.length > 0) {
                    v.sub_variants.forEach((sv, svIdx) => {
                        const subLabel = `${t('backoffice.product.form.sub_variant', 'Sub-Varian')} #${vIdx + 1}.${svIdx + 1}`;
                        addSku(`variants.${vIdx}.sub_variants.${svIdx}.sku`, sv.sku, subLabel);
                    });
                } else {
                    addSku(`variants.${vIdx}.sku`, v.sku, label);
                }
            });
        }

        let hasDuplicates = false;
        let duplicateMessage = '';
        skuMap.forEach((occurrences, cleaned) => {
            if (occurrences.length > 1) {
                hasDuplicates = true;
                const labels = occurrences.map(o => o.label).join(', ');
                const originalVal = occurrences[0].original;
                duplicateMessage += `• SKU "${originalVal}" (${labels})\n`;

                occurrences.forEach(o => {
                    skuErrors[o.path] = t('backoffice.product.form.validation.sku_duplicate_form', 'SKU ini duplikat di dalam form.');
                });
            }
        });

        return { hasDuplicates, skuErrors, duplicateMessage };
    };

    const getAllSkusInForm = (data) => {
        const skus = [];
        if (data.sku && data.sku.trim()) {
            skus.push(data.sku.trim());
        }
        if (data.has_variants && data.variants) {
            data.variants.forEach(v => {
                if (v.has_sub_variants && v.sub_variants) {
                    v.sub_variants.forEach(sv => {
                        if (sv.sku && sv.sku.trim()) {
                            skus.push(sv.sku.trim());
                        }
                    });
                } else {
                    if (v.sku && v.sku.trim()) {
                        skus.push(v.sku.trim());
                    }
                }
            });
        }
        return skus;
    };

    // ── submit ────────────────────────────────────────────────────────────────
    const submit = async (e) => {
        e.preventDefault();

        // ─── Perform SKU frontend validation first ───
        const { hasDuplicates, skuErrors, duplicateMessage } = validateSkus(form.data);
        if (hasDuplicates) {
            form.clearErrors('sku');
            Object.keys(form.errors).forEach(key => {
                if (key.startsWith('variants.') && key.endsWith('.sku')) {
                    form.clearErrors(key);
                }
            });
            form.setError(skuErrors);
            setSkuAlert({
                show: true,
                message: `${t('backoffice.product.form.validation.sku_duplicate_alert_msg', 'Terdapat duplikasi SKU di dalam form! Silakan perbaiki SKU yang sama berikut:')}\n\n${duplicateMessage}`
            });
            return;
        }

        // ─── Perform database SKU validation ───
        try {
            const skusToCheck = getAllSkusInForm(form.data);
            if (skusToCheck.length > 0) {
                const checkResponse = await axios.post(route('backoffice.products.check-sku'), {
                    product_id: product?.id || null,
                    skus: skusToCheck
                });

                const duplicates = checkResponse.data.duplicates || [];
                if (duplicates.length > 0) {
                    const dbSkuErrors = {};
                    let dbDuplicateMessage = '';

                    duplicates.forEach(dup => {
                        const matchingSku = dup.sku.toLowerCase();
                        dbDuplicateMessage += `• SKU "${dup.sku}" ${t('backoffice.product.form.validation.sku_used_by', 'sudah digunakan produk lain:')} "${dup.product_name}"\n`;

                        // Find where this SKU is in our form to show error inline
                        if (form.data.sku && form.data.sku.trim().toLowerCase() === matchingSku) {
                            dbSkuErrors['sku'] = `${t('backoffice.product.form.validation.sku_used_by', 'SKU sudah digunakan produk lain:')} "${dup.product_name}"`;
                        }
                        if (form.data.has_variants && form.data.variants) {
                            form.data.variants.forEach((v, vIdx) => {
                                if (v.has_sub_variants && v.sub_variants) {
                                    v.sub_variants.forEach((sv, svIdx) => {
                                        if (sv.sku && sv.sku.trim().toLowerCase() === matchingSku) {
                                            dbSkuErrors[`variants.${vIdx}.sub_variants.${svIdx}.sku`] = `${t('backoffice.product.form.validation.sku_used_by', 'SKU sudah digunakan produk lain:')} "${dup.product_name}"`;
                                        }
                                    });
                                } else {
                                    if (v.sku && v.sku.trim().toLowerCase() === matchingSku) {
                                        dbSkuErrors[`variants.${vIdx}.sku`] = `${t('backoffice.product.form.validation.sku_used_by', 'SKU sudah digunakan produk lain:')} "${dup.product_name}"`;
                                    }
                                }
                            });
                        }
                    });

                    // Clear previous errors first
                    form.clearErrors('sku');
                    Object.keys(form.errors).forEach(key => {
                        if ((key.startsWith('variants.') && key.endsWith('.sku')) || (key.includes('.sub_variants.') && key.endsWith('.sku'))) {
                            form.clearErrors(key);
                        }
                    });

                    form.setError(dbSkuErrors);
                    setSkuAlert({
                        show: true,
                        message: `${t('backoffice.product.form.validation.sku_db_duplicate_msg', 'Terdapat SKU yang sudah terdaftar di database! Silakan gunakan SKU lain:')}\n\n${dbDuplicateMessage}`
                    });
                    return;
                }
            }
        } catch (error) {
            console.error('Error checking SKU uniqueness:', error);
        }

        // Transform data before sending
        form.transform((data) => {
            const cleanedBranchStocks = data.branch_stocks.map(bs => ({
                ...bs,
                stock: bs.stock === '' ? 0 : bs.stock
            }));

            const transformedVariants = [];

            data.variants.forEach((v) => {
                if (v.has_sub_variants && v.sub_variants && v.sub_variants.length > 0) {
                    const cleanedParentStocks = (v.branch_stocks || []).map(bs => ({
                        ...bs,
                        stock: bs.stock === '' ? 0 : bs.stock
                    }));

                    const cleanedSubVariants = v.sub_variants.map((sv) => {
                        let nameTranslations = {};

                        const getSuffix = (subVar, lang) => {
                            const val = subVar.name_translations?.[lang] || '';
                            if (!val) return '';
                            if (subVar.type === 'Ukuran') {
                                if (v.stock_type === 'parent' && v.unit) {
                                    return ` (${val} ${v.unit})`.trim();
                                } else if (subVar.unit_id) {
                                    const unitObj = units.find(u => Number(u.id) === Number(subVar.unit_id));
                                    const unitName = unitObj ? unitObj.name : '';
                                    return ` (${val} ${unitName})`.trim();
                                }
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

                        return {
                            id: sv.id ?? null,
                            type: `${v.type} | ${sv.type}`,
                            type_translations: typeTranslations,
                            sku: sv.sku ?? '',
                            price: sv.price ?? '',
                            unit_id: (v.stock_type === 'parent') ? null : (sv.unit_id || null),
                            image: sv.image,
                            image_deleted: sv.image_deleted || false,
                            name: nameTranslations.indonesia || nameTranslations.english || nameTranslations.arabic || '',
                            name_translations: nameTranslations,
                            branch_stocks: cleanedVariantStocks,
                            weight: sv.weight || 0
                        };
                    });

                    transformedVariants.push({
                        id: v.id ?? null,
                        type: v.type ?? '',
                        type_translations: v.type_translations,
                        sku: v.sku ?? '',
                        price: v.price ?? '',
                        unit_id: null,
                        image: v.image,
                        image_deleted: v.image_deleted || false,
                        name: v.name_translations?.indonesia || '',
                        name_translations: v.name_translations,
                        stock_type: v.stock_type || 'variant',
                        unit: v.unit || '',
                        branch_stocks: cleanedParentStocks,
                        has_sub_variants: true,
                        sub_variants: cleanedSubVariants
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
                        branch_stocks: cleanedVariantStocks,
                        stock_type: v.stock_type || 'variant',
                        unit: v.unit || '',
                        has_sub_variants: false,
                        sub_variants: [],
                        weight: v.weight || 0
                    });
                }
            });

            const finalWeight = hasWeightVariant ? 0 : (data.weight || 0);

            const isSingle = !data.has_variants;
            const unitLower = data.unit ? data.unit.toLowerCase() : '';
            const finalCapacity = (isSingle && !['pcs', 'pack', 'box'].includes(unitLower))
                ? (parseInt(data.capacity, 10) || 1)
                : 1;

            return {
                ...data,
                weight: finalWeight,
                capacity: finalCapacity,
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
            <ConfirmModal
                show={skuAlert.show}
                title={t('backoffice.product.form.validation.sku_duplicate_title', 'Duplikasi SKU Terdeteksi')}
                message={skuAlert.message}
                confirmLabel={t('backoffice.product.btn_ok', 'Mengerti')}
                cancelLabel={false}
                variant="warning"
                onConfirm={() => setSkuAlert({ show: false, message: '' })}
                onCancel={() => setSkuAlert({ show: false, message: '' })}
            />

            <div className="flex min-h-screen">
                <Sidebar />
                <main className="flex flex-col flex-1 min-w-0">
                    <Navbar />
                    <div className="flex-1 p-6 space-y-6 lg:p-8">

                        {/* ── Header ─────────────────────────────────────── */}
                        <section className="flex flex-wrap items-end justify-between gap-4 pb-5 border-b border-slate-200">
                            <div>
                                <span className="text-xs font-bold tracking-widest uppercase text-amber-600">{t('backoffice.product.suite', 'Fayyfir Inventory Suite')}</span>
                                <h1 className="mt-1 text-3xl font-black tracking-tight text-blue-950 lg:text-4xl">
                                    {isEditing ? t('backoffice.product.form.title_edit', 'Edit Produk') : t('backoffice.product.form.title_create', 'Tambah Produk')}
                                </h1>
                            </div>
                            <Link
                                href={route('backoffice.products.index')}
                                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold transition bg-white border shadow-sm rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-950 active:scale-95"
                            >
                                <ArrowLeft className="w-4 h-4" /> {t('backoffice.product.form.btn_back', 'Kembali')}
                            </Link>
                        </section>

                        {/* ── Language Tabs ────────────────────────────── */}
                        <div className="flex items-center justify-between p-3 border border-blue-100 shadow-inner rounded-2xl bg-blue-50/50">
                            <div className="flex items-center gap-2 text-blue-950">
                                <Globe className="w-4 h-4 text-amber-500" />
                                <span className="text-xs font-bold tracking-wider uppercase">{t('backoffice.product.form.lang_title', 'Bahasa Konten')}</span>
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
                                                    <span className="w-2 h-2 rounded-full bg-rose-500 ring-4 ring-rose-500/20" />
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
                                    changeVariantStockType={changeVariantStockType}
                                    changeGlobalStockType={changeGlobalStockType}
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
                            <div className="self-start space-y-3 lg:sticky lg:top-6">
                                <ProductClassificationSection
                                    data={form.data}
                                    setData={form.setData}
                                    errors={form.errors}
                                    categories={categories}
                                    availableSubCategories={availableSubCategories}
                                    handleCategoryChange={handleCategoryChange}
                                    hasWeightVariant={hasWeightVariant}
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