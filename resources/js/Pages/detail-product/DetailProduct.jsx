import React, { useState, useEffect } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import {
    Star,
    ShoppingCart,
    ChevronRight,
    Check,
    Package,
    Flame,
    BadgeCheck,
    Minus,
    Plus,
    Tag,
    ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "@/Layouts/MainLayout";
import Navbar from "@/Components/Navbar";
import Footer from "@/Components/Footer";
import products from "../../data-source/data_products_30.json";
import { useLanguage } from "@/Contexts/LanguageContext"; // 1. Import LanguageContext Proyek
import LoginModal from "@/Components/LoginModal";

const resolveProductImage = (img) => {
    if (!img) return "/images/placeholder.jpg";
    if (typeof img !== 'string') return "/images/placeholder.jpg";
    if (
        img.startsWith("http://") ||
        img.startsWith("https://") ||
        img.startsWith("data:") ||
        img.startsWith("/images/") ||
        img.startsWith("images/") ||
        img.startsWith("/storage/") ||
        img.startsWith("storage/")
    ) {
        if (img.startsWith("images/")) return `/${img}`;
        if (img.startsWith("storage/")) return `/${img}`;
        return img;
    }
    return `/storage/${img}`;
};

const getUnitLabel = (unit, lang) => {
    if (!unit) return '';
    if (typeof unit === 'object') {
        return unit[lang] || unit.name_translations?.[lang] || unit.indonesia || unit.name || '';
    }
    try {
        const parsed = JSON.parse(unit);
        if (parsed && typeof parsed === 'object') {
            return parsed[lang] || parsed.indonesia || '';
        }
    } catch (e) { }
    return String(unit);
};

const formatFullVariantName = (v, lang) => {
    if (!v) return '';
    let name = v.name_translations?.[lang] || v.name_translations?.indonesia || v.name || '';

    // Check if it's actually of type "ukuran" (size)
    const isUkuranType = (typeStr, transObj) => {
        const t = String(typeStr || '').toLowerCase();
        if (t === 'ukuran' || t === 'size' || t.includes('| ukuran') || t.includes('| size')) return true;
        if (transObj) {
            let trans = transObj;
            if (typeof trans === 'string') {
                try { trans = JSON.parse(trans); } catch (e) { trans = null; }
            }
            if (trans && typeof trans === 'object') {
                const indo = String(trans.indonesia || '').toLowerCase();
                const eng = String(trans.english || '').toLowerCase();
                if (indo === 'ukuran' || indo === 'size' || indo.includes('| ukuran') || indo.includes('| size')) return true;
                if (eng === 'ukuran' || eng === 'size' || eng.includes('| ukuran') || eng.includes('| size')) return true;
            }
        }
        return false;
    };

    if (!isUkuranType(v.type, v.type_translations)) {
        return name;
    }

    const unitName = getUnitLabel(v.unit, lang);
    if (unitName && !name.toLowerCase().includes(unitName.toLowerCase())) {
        if (name.includes('(') && name.includes(')')) {
            return name.replace(')', ` ${unitName})`);
        }
        return `${name} ${unitName}`;
    }
    return name;
};

const parseCapacityJs = (variantName, parentUnit = null, activeVariant = null) => {
    if (!variantName) return 1;

    const pUnit = String(parentUnit ? (typeof parentUnit === 'object' ? (parentUnit.name || '') : parentUnit) : '').toLowerCase();

    // If parent unit is piece-based, capacity relative to parent is 1
    if (['pcs', 'box', 'pack', 'piece', 'pieces', 'botol', 'butir', 'tablet'].includes(pUnit)) {
        return 1;
    }

    let textToParse = variantName;
    const parenMatches = textToParse.match(/\(([^)]+)\)/);
    if (parenMatches) {
        textToParse = parenMatches[1];
    }

    // Match value and unit from variantName
    const match = textToParse.match(/(\d+(?:\.\d+)?)\s*(kg|g|gr|gram|kilogram|ml|l|liter|pcs|box|pack)?/i);
    if (!match) return 1;

    const capacityValue = parseFloat(match[1]);
    let capacityUnit = match[2] ? match[2].toLowerCase() : '';

    // Fallback to activeVariant unit if available
    if (!capacityUnit && activeVariant && activeVariant.unit) {
        const uLabel = typeof activeVariant.unit === 'object'
            ? activeVariant.unit.name
            : activeVariant.unit;
        capacityUnit = String(uLabel || '').toLowerCase();
    }

    // Normalize parent stock unit to base multiplier
    let parentMultiplier = 1;
    if (['kg', 'kilogram'].includes(pUnit)) {
        parentMultiplier = 1000;
    } else if (['l', 'liter'].includes(pUnit)) {
        parentMultiplier = 1000;
    }

    // Normalize variant capacity unit to base multiplier
    let capacityMultiplier = 1;
    if (['kg', 'kilogram'].includes(capacityUnit)) {
        capacityMultiplier = 1000;
    } else if (['l', 'liter'].includes(capacityUnit)) {
        capacityMultiplier = 1000;
    }

    const parentBase = parentMultiplier;
    const capacityBase = capacityValue * Math.max(1, capacityMultiplier);

    if (parentBase <= 0) return 1;

    // Capacity relative to parent unit
    return capacityBase / parentBase;
};

const parseWeightJs = (variant, product) => {
    if (variant) {
        // Prioritize direct weight values input in backoffice
        if (variant.weight && parseInt(variant.weight, 10) > 0) {
            return parseInt(variant.weight, 10);
        }

        if (variant.parent_id && product && product.variants) {
            const parentVar = product.variants.find(v => v.id === variant.parent_id);
            if (parentVar && parentVar.weight && parseInt(parentVar.weight, 10) > 0) {
                return parseInt(parentVar.weight, 10);
            }
        }

        const variantsToTry = [variant];
        if (variant.parent_id && product && product.variants) {
            const parentVar = product.variants.find(v => v.id === variant.parent_id);
            if (parentVar) {
                variantsToTry.push(parentVar);
            }
        }

        for (const v of variantsToTry) {
            const textToParse = v.name || '';
            let unitName = '';
            if (v.unit) {
                unitName = typeof v.unit === 'object' ? (v.unit.name || '') : String(v.unit);
            } else if (product && product.unit) {
                unitName = typeof product.unit === 'object' ? (product.unit.name || '') : String(product.unit);
            }
            unitName = unitName.toLowerCase();

            // Match numbers and units
            const matches = textToParse.match(/(\d+(?:\.\d+)?)\s*(kg|g|gr|gram|kilogram|ml|l|pcs)?/i);
            if (matches) {
                const value = parseFloat(matches[1]);
                const unit = matches[2] ? matches[2].toLowerCase() : '';

                if (unit === 'kg' || unit === 'kilogram' || unitName === 'kilogram') {
                    return Math.round(value * 1000);
                }
                if (['g', 'gr', 'gram'].includes(unit) || unitName === 'gram' || unitName === 'gr') {
                    return Math.round(value);
                }
                if (unitName === 'kg' || unitName === 'kilogram') {
                    return Math.round(value * 1000);
                }
                if (['g', 'gr', 'gram'].includes(unitName)) {
                    return Math.round(value);
                }
            }
        }
    }

    if (product && product.weight > 0) {
        return parseInt(product.weight, 10);
    }

    // Fallback parsing from product title
    if (product && product.title) {
        const matches = product.title.match(/(\d+(?:\.\d+)?)\s*(kg|g|gr|gram|kilogram)?/i);
        if (matches) {
            const value = parseFloat(matches[1]);
            const unit = matches[2] ? matches[2].toLowerCase() : '';
            if (unit === 'kg' || unit === 'kilogram') {
                return Math.round(value * 1000);
            }
            if (['g', 'gr', 'gram'].includes(unit)) {
                return Math.round(value);
            }
        }
    }

    return 1000; // default 1kg
};

export default function DetailProduct({ product: initialProduct, slug }) {
    const { t, locale } = useLanguage(); // 2. Inisialisasi fungsi translasi t dan locale proyek
    const { auth } = usePage().props;

    const product =
        initialProduct ||
        (slug ? products.find((p) => p.slug === slug) : null) ||
        products[0];

    // Tentukan apakah produk ini berasal dari database Eloquent
    const isDbProduct = React.useMemo(() => {
        return (
            product.variants &&
            product.variants.length > 0 &&
            product.variants.some((v) => v.type || v.name_translations || v.unit_id || v.unit)
        );
    }, [product]);

    // Resolusi nama & deskripsi multi-bahasa dengan fallback yang aman
    const displayName = React.useMemo(() => {
        if (product.name_translations && typeof product.name_translations === 'object') {
            return product.name_translations[locale] || product.name_translations['indonesia'] || product.title || product.name;
        }
        return product.title || product.name;
    }, [product, locale]);

    const displayDescription = React.useMemo(() => {
        if (product.description_translations && typeof product.description_translations === 'object') {
            return product.description_translations[locale] || product.description_translations['indonesia'] || product.description;
        }
        return product.description;
    }, [product, locale]);

    const uniqueColors = React.useMemo(() => {
        if (isDbProduct) return [];
        return Array.from(
            new Set(product.variants?.map((v) => v.color).filter(Boolean)),
        );
    }, [product.variants, isDbProduct]);

    const uniqueSizes = React.useMemo(() => {
        if (isDbProduct) return [];
        return Array.from(
            new Set(product.variants?.map((v) => v.size).filter(Boolean)),
        );
    }, [product.variants, isDbProduct]);

    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedSize, setSelectedSize] = useState(null);
    const [selectedVariantId, setSelectedVariantId] = useState(null);
    const [selectedParentKey, setSelectedParentKey] = useState(null);

    // Helper to group flat database variants into parent-sub-variant structure
    const groupedVariants = React.useMemo(() => {
        if (!isDbProduct || !product.variants || product.variants.length === 0) return [];

        const parentGroups = {};

        const getVariantNameWithUnit = (name, unitObj, lang) => {
            if (!name) return "";
            if (!unitObj) return name;
            const unitName = getUnitLabel(unitObj, lang);
            if (unitName && !name.toLowerCase().includes(unitName.toLowerCase())) {
                return `${name} ${unitName}`;
            }
            return name;
        };

        const isUkuranType = (typeStr, trans) => {
            const t = String(typeStr || '').toLowerCase();
            if (t === 'ukuran' || t === 'size') return true;
            if (trans) {
                let transObj = trans;
                if (typeof trans === 'string') {
                    try { transObj = JSON.parse(trans); } catch (e) { transObj = null; }
                }
                if (transObj && typeof transObj === 'object') {
                    const indo = String(transObj.indonesia || '').toLowerCase();
                    const eng = String(transObj.english || '').toLowerCase();
                    if (indo === 'ukuran' || indo === 'size') return true;
                    if (eng === 'ukuran' || eng === 'size') return true;
                }
            }
            return false;
        };

        const hasParentRelations = product.variants.some(v => v.parent_id !== null && v.parent_id !== undefined);

        if (hasParentRelations) {
            product.variants.forEach(v => {
                if (!v.parent_id) {
                    const parentKey = `${v.type}_${v.name_translations?.indonesia || v.name}`;
                    const pTrans = v.type_translations || { indonesia: v.type, english: v.type, arabic: v.type };
                    const isParentUkuran = isUkuranType(v.type, pTrans);
                    parentGroups[v.id] = {
                        key: parentKey,
                        id: v.id,
                        type: v.type,
                        type_translations: pTrans,
                        sku: v.sku,
                        price: v.price,
                        unit: v.unit || product.unit,
                        image: v.image,
                        stock: v.stock || 0,
                        stock_type: v.stock_type || 'variant',
                        name_translations: {
                            indonesia: isParentUkuran ? getVariantNameWithUnit(v.name_translations?.indonesia || v.name, v.unit || product.unit, 'indonesia') : (v.name_translations?.indonesia || v.name || ""),
                            english: isParentUkuran ? getVariantNameWithUnit(v.name_translations?.english || v.name, v.unit || product.unit, 'english') : (v.name_translations?.english || v.name || ""),
                            arabic: isParentUkuran ? getVariantNameWithUnit(v.name_translations?.arabic || v.name, v.unit || product.unit, 'arabic') : (v.name_translations?.arabic || v.name || ""),
                        },
                        has_sub_variants: false,
                        sub_variants: [],
                    };
                }
            });

            product.variants.forEach(v => {
                if (v.parent_id && parentGroups[v.parent_id]) {
                    const parent = parentGroups[v.parent_id];
                    parent.has_sub_variants = true;

                    const fullnameIndo = v.name_translations?.indonesia || v.name || '';
                    const fullnameEng = v.name_translations?.english || '';
                    const fullnameAra = v.name_translations?.arabic || '';

                    const regex = /\(([^)]+)\)/;
                    const matchIndo = fullnameIndo.match(regex);
                    const matchEng = fullnameEng.match(regex);
                    const matchAra = fullnameAra.match(regex);

                    const valIndo = matchIndo ? matchIndo[1] : fullnameIndo;
                    const valEng = matchEng ? matchEng[1] : fullnameEng;
                    const valAra = matchAra ? matchAra[1] : fullnameAra;

                    let subType = 'Ukuran';
                    if (v.type && v.type.includes(' | ')) {
                        subType = v.type.split(' | ')[1].trim();
                    }
                    let subTypeTranslations = { indonesia: 'Ukuran', english: 'Size', arabic: 'المقاس' };
                    if (parent.type_translations) {
                        const getSubT = (str) => str && str.includes(' | ') ? str.split(' | ')[1].trim() : null;
                        const sI = getSubT(v.type_translations?.indonesia);
                        const sE = getSubT(v.type_translations?.english);
                        const sA = getSubT(v.type_translations?.arabic);
                        if (sI || sE || sA) {
                            subTypeTranslations = { indonesia: sI || 'Ukuran', english: sE || sI || 'Size', arabic: sA || sI || 'المقاس' };
                        }
                    }

                    const parentUnit = parent?.unit;
                    const isSubUkuran = isUkuranType(subType, subTypeTranslations);

                    parent.sub_variants.push({
                        id: v.id,
                        parent_id: v.parent_id,
                        type: subType,
                        type_translations: subTypeTranslations,
                        name_translations: {
                            indonesia: isSubUkuran ? getVariantNameWithUnit(valIndo, v.unit || parentUnit || product.unit, 'indonesia') : valIndo,
                            english: isSubUkuran ? getVariantNameWithUnit(valEng, v.unit || parentUnit || product.unit, 'english') : valEng,
                            arabic: isSubUkuran ? getVariantNameWithUnit(valAra, v.unit || parentUnit || product.unit, 'arabic') : valAra,
                        },
                        unit: v.unit || parentUnit || product.unit,
                        sku: v.sku || '',
                        price: v.price || '',
                        image: v.image,
                        stock: v.stock || 0,
                    });
                    parent.stock += (v.stock || 0);
                }
            });

            return Object.values(parentGroups);
        } else {
            product.variants.forEach(v => {
                let nameTrans = {};
                if (v.name_translations) {
                    if (typeof v.name_translations === 'string') {
                        try { nameTrans = JSON.parse(v.name_translations); } catch (e) { nameTrans = {}; }
                    } else if (typeof v.name_translations === 'object') {
                        nameTrans = v.name_translations;
                    }
                }

                const indonesiaName = String(nameTrans?.indonesia || v.name || '');
                const englishName = String(nameTrans?.english || '');
                const arabicName = String(nameTrans?.arabic || '');

                const regex = /\(([^)]+)\)/g;
                const matchesIndo = [...indonesiaName.matchAll(regex)].map(m => m[1]);
                const matchesEng = [...englishName.matchAll(regex)].map(m => m[1]);
                const matchesAra = [...arabicName.matchAll(regex)].map(m => m[1]);

                const cleanName = (str) => String(str || '').replace(/\s*\([^)]+\)/g, '').trim();
                const parentNameIndo = cleanName(indonesiaName);
                const parentNameEng = cleanName(englishName);
                const parentNameAra = cleanName(arabicName);

                let parentType = String(v.type || '');
                let subType = null;
                if (parentType.includes(' | ')) {
                    const parts = parentType.split(' | ');
                    parentType = parts[0].trim();
                    subType = parts[1].trim();
                }

                const parentKey = `${parentType}_${parentNameIndo}`;
                const hasSub = matchesIndo.length > 0;

                if (!parentGroups[parentKey]) {
                    let parentTypeTranslations = { indonesia: parentType, english: parentType, arabic: parentType };
                    let subTypeTranslations = null;
                    if (v.type_translations) {
                        let tObj = {};
                        if (typeof v.type_translations === 'string') {
                            try { tObj = JSON.parse(v.type_translations); } catch (e) { tObj = {}; }
                        } else if (typeof v.type_translations === 'object') {
                            tObj = v.type_translations;
                        }

                        const splitT = (str) => {
                            const sStr = String(str || '');
                            return sStr && sStr.includes(' | ') ? sStr.split(' | ').map(s => s.trim()) : [sStr.trim() || '', null];
                        };
                        const [pI, sI] = splitT(tObj?.indonesia || '');
                        const [pE, sE] = splitT(tObj?.english || '');
                        const [pA, sA] = splitT(tObj?.arabic || '');
                        parentTypeTranslations = { indonesia: pI || parentType, english: pE || pI || parentType, arabic: pA || pI || parentType };
                        if (sI || sE || sA) {
                            subTypeTranslations = { indonesia: sI || '', english: sE || sI || '', arabic: sA || sI || '' };
                        }
                    }

                    const isParentUkuran = isUkuranType(parentType, parentTypeTranslations);

                    parentGroups[parentKey] = {
                        key: parentKey,
                        id: hasSub ? null : v.id,
                        type: parentType,
                        type_translations: parentTypeTranslations,
                        sku: hasSub ? '' : v.sku,
                        price: hasSub ? '' : v.price,
                        unit: v.unit || product.unit,
                        image: v.image,
                        stock: hasSub ? 0 : (v.stock || 0),
                        name_translations: {
                            indonesia: isParentUkuran ? getVariantNameWithUnit(parentNameIndo, v.unit || product.unit, 'indonesia') : parentNameIndo,
                            english: isParentUkuran ? getVariantNameWithUnit(parentNameEng, v.unit || product.unit, 'english') : parentNameEng,
                            arabic: isParentUkuran ? getVariantNameWithUnit(parentNameAra, v.unit || product.unit, 'arabic') : parentNameAra,
                        },
                        has_sub_variants: hasSub,
                        sub_variants: [],
                        _subTypeTranslations: subTypeTranslations,
                    };
                }

                if (hasSub) {
                    const valIndo = matchesIndo[0] || '';
                    const valEng = matchesEng[0] || '';
                    const valAra = matchesAra[0] || '';

                    const isSubUkuran = isUkuranType(subType || 'Custom', parentGroups[parentKey]._subTypeTranslations || {
                        indonesia: subType || 'Custom',
                        english: subType || 'Custom',
                        arabic: subType || 'مخصص',
                    });

                    parentGroups[parentKey].sub_variants.push({
                        id: v.id,
                        type: subType || 'Custom',
                        type_translations: parentGroups[parentKey]._subTypeTranslations || {
                            indonesia: subType || 'Custom',
                            english: subType || 'Custom',
                            arabic: subType || 'مخصص',
                        },
                        name_translations: {
                            indonesia: isSubUkuran ? getVariantNameWithUnit(valIndo, v.unit || parentGroups[parentKey].unit || product.unit, 'indonesia') : valIndo,
                            english: isSubUkuran ? getVariantNameWithUnit(valEng, v.unit || parentGroups[parentKey].unit || product.unit, 'english') : valEng,
                            arabic: isSubUkuran ? getVariantNameWithUnit(valAra, v.unit || parentGroups[parentKey].unit || product.unit, 'arabic') : valAra,
                        },
                        unit: v.unit || parentGroups[parentKey].unit || product.unit,
                        sku: v.sku || '',
                        price: v.price || '',
                        image: v.image,
                        stock: v.stock || 0,
                    });
                    parentGroups[parentKey].stock += (v.stock || 0);
                    parentGroups[parentKey].has_sub_variants = true;
                }
            });

            return Object.values(parentGroups);
        }
    }, [product.variants, isDbProduct, locale]);

    // Resolusi combined gallery: gambar produk (Eloquent / static JSON) + gambar varian
    const productImages = React.useMemo(() => {
        if (product.images && product.images.length > 0) {
            const sortedImages = [...product.images].sort((a, b) => {
                const aPrimary = !!a.is_primary && a.is_primary !== '0' && a.is_primary !== 0;
                const bPrimary = !!b.is_primary && b.is_primary !== '0' && b.is_primary !== 0;
                if (aPrimary && !bPrimary) return -1;
                if (!aPrimary && bPrimary) return 1;
                return (a.sort_order ?? 0) - (b.sort_order ?? 0);
            });
            return sortedImages.map((img) => img.image_path).filter(Boolean);
        }
        if (Array.isArray(product.image)) {
            return product.image;
        }
        if (product.image) {
            return [product.image];
        }
        if (product.image_path) {
            return [product.image_path];
        }
        return [];
    }, [product]);

    const variantImages = React.useMemo(() => {
        return product.variants?.map((v) => v.image).filter(Boolean) || [];
    }, [product.variants]);

    const allImages = React.useMemo(() => {
        const imgs = Array.from(new Set([...productImages, ...variantImages]));
        return imgs.length > 0 ? imgs : ["/images/placeholder.jpg"];
    }, [productImages, variantImages]);

    const variantImagesMap = React.useMemo(() => {
        const map = {}; // color -> image url
        if (!isDbProduct) {
            product.variants?.forEach((v) => {
                if (v.color && v.image && !map[v.color]) {
                    map[v.color] = v.image;
                }
            });
        }
        return map;
    }, [product.variants, isDbProduct]);

    const [activeImage, setActiveImage] = useState(allImages[0] || null);
    const [swipeDirection, setSwipeDirection] = useState("none");

    const handleSelectImage = (img) => {
        if (!img) return;
        const currentIndex = allImages.indexOf(activeImage);
        const targetIndex = allImages.indexOf(img);
        if (currentIndex !== -1 && targetIndex !== -1) {
            if (targetIndex > currentIndex) {
                setSwipeDirection("next");
            } else if (targetIndex < currentIndex) {
                setSwipeDirection("prev");
            } else {
                setSwipeDirection("none");
            }
        } else {
            setSwipeDirection("none");
        }
        setActiveImage(img);
    };

    const [quantity, setQuantity] = useState(1);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isPendingBuyNow, setIsPendingBuyNow] = useState(false);


    // Sinkronisasi state ketika produk / locale / image pool berubah
    useEffect(() => {
        setSwipeDirection("none");
        if (isDbProduct) {
            setSelectedColor(null);
            setSelectedSize(null);
            if (groupedVariants && groupedVariants.length > 0) {
                const firstParent = groupedVariants[0];
                setSelectedParentKey(firstParent.key);
                if (firstParent.has_sub_variants && firstParent.sub_variants.length > 0) {
                    const firstSub = firstParent.sub_variants[0];
                    setSelectedVariantId(firstSub.id);
                    if (firstSub.image) {
                        setActiveImage(firstSub.image);
                    } else if (firstParent.image) {
                        setActiveImage(firstParent.image);
                    } else {
                        setActiveImage(allImages[0] || null);
                    }
                } else {
                    setSelectedVariantId(firstParent.id);
                    if (firstParent.image) {
                        setActiveImage(firstParent.image);
                    } else {
                        setActiveImage(allImages[0] || null);
                    }
                }
            } else {
                setSelectedParentKey(null);
                setSelectedVariantId(null);
                setActiveImage(allImages[0] || null);
            }
        } else {
            setSelectedParentKey(null);
            setSelectedVariantId(null);
            const nextColors = Array.from(
                new Set(product.variants?.map((v) => v.color).filter(Boolean)),
            );
            const nextSizes = Array.from(
                new Set(product.variants?.map((v) => v.size).filter(Boolean)),
            );
            setSelectedColor(nextColors[0] || null);
            setSelectedSize(nextSizes[0] || null);
            setActiveImage(allImages[0] || null);
        }
        setQuantity(1);
    }, [product, isDbProduct, allImages, groupedVariants]);

    // Ketika warna dirubah, ganti gambar aktif ke gambar varian jika tersedia
    const handleColorSelect = (color) => {
        setSelectedColor(color);
        if (variantImagesMap[color]) {
            handleSelectImage(variantImagesMap[color]);
        }
    };

    const activeVariant = React.useMemo(() => {
        if (!product.variants || product.variants.length === 0) return null;
        if (isDbProduct) {
            return product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];
        } else {
            return (
                product.variants.find(
                    (v) =>
                        (selectedColor ? v.color === selectedColor : true) &&
                        (selectedSize ? v.size === selectedSize : true),
                ) || product.variants[0]
            );
        }
    }, [product.variants, isDbProduct, selectedVariantId, selectedColor, selectedSize]);

    const currentPrice = React.useMemo(() => {
        if (activeVariant) {
            return activeVariant.price;
        }
        return product.variants?.[0]?.price || product.price || 0;
    }, [activeVariant, product.variants, product.price]);

    const currentStock = React.useMemo(() => {
        if (product.stock_type === 'parent') {
            const parentStock = product.stock || 0;
            const variantName = activeVariant ? (activeVariant.name_translations?.[locale] || activeVariant.name_translations?.indonesia || activeVariant.name || '') : '';
            const capacity = parseCapacityJs(variantName, product.unit, activeVariant);
            return Math.floor(parentStock / capacity);
        }
        if (activeVariant) {
            if (activeVariant.parent_id) {
                const parentVar = product.variants?.find(v => v.id === activeVariant.parent_id);
                if (parentVar && parentVar.stock_type === 'parent') {
                    const parentStock = parentVar.stock || 0;
                    const variantName = activeVariant.name_translations?.[locale] || activeVariant.name_translations?.indonesia || activeVariant.name || '';
                    const capacity = parseCapacityJs(variantName, parentVar.unit, activeVariant);
                    return Math.floor(parentStock / capacity);
                }
            }
            return activeVariant.stock;
        }
        return product.stock || 0;
    }, [activeVariant, product.stock, product.stock_type, product.variants, locale]);

    // Resolve the active variant from groupedVariants (has inherited units)
    const activeGroupedSubVariant = React.useMemo(() => {
        if (!isDbProduct || !selectedVariantId || !groupedVariants.length) return null;
        for (const parent of groupedVariants) {
            if (parent.has_sub_variants) {
                const found = parent.sub_variants.find(sv => sv.id === selectedVariantId);
                if (found) return { subVariant: found, parent };
            }
        }
        return null;
    }, [isDbProduct, selectedVariantId, groupedVariants]);

    const currentUnit = React.useMemo(() => {
        // 1. Try unit from grouped sub-variant (has inherited parent unit)
        if (activeGroupedSubVariant?.subVariant?.unit) {
            return getUnitLabel(activeGroupedSubVariant.subVariant.unit, locale);
        }
        // 2. Try unit from grouped parent variant
        if (activeGroupedSubVariant?.parent?.unit) {
            return getUnitLabel(activeGroupedSubVariant.parent.unit, locale);
        }
        // 3. Try raw activeVariant unit
        if (activeVariant?.unit) {
            return getUnitLabel(activeVariant.unit, locale);
        }
        // 4. Try parent via raw parent_id lookup
        if (activeVariant?.parent_id) {
            const parentVar = product.variants?.find(v => v.id === activeVariant.parent_id);
            if (parentVar?.unit) {
                return getUnitLabel(parentVar.unit, locale);
            }
        }
        // 5. Try unit from any parent group (single variant type, no sub-variant selected)
        if (isDbProduct && groupedVariants.length > 0) {
            const activeParent = groupedVariants.find(p => p.key === selectedParentKey);
            if (activeParent?.unit) {
                return getUnitLabel(activeParent.unit, locale);
            }
            const anyParentWithUnit = groupedVariants.find(p => p.unit);
            if (anyParentWithUnit?.unit) {
                return getUnitLabel(anyParentWithUnit.unit, locale);
            }
        }
        // 6. Product-level unit
        if (product.unit) {
            return getUnitLabel(product.unit, locale);
        }
        return t("product.detail.pcs", "Pcs");
    }, [activeGroupedSubVariant, activeVariant, product.unit, product.variants, groupedVariants, selectedParentKey, isDbProduct, locale, t]);

    const displayStock = React.useMemo(() => {
        if (product.stock_type === 'parent') {
            return product.stock || 0;
        }
        if (activeVariant) {
            if (activeVariant.parent_id) {
                const parentVar = product.variants?.find(v => v.id === activeVariant.parent_id);
                if (parentVar && parentVar.stock_type === 'parent') {
                    return parentVar.stock || 0;
                }
            }
            return activeVariant.stock || 0;
        }
        return product.stock || 0;
    }, [activeVariant, product.stock, product.stock_type, product.variants]);

    const isParentStockMode = React.useMemo(() => {
        if (product.stock_type === 'parent') return true;
        if (activeVariant) {
            if (activeVariant.parent_id) {
                const parentVar = product.variants?.find(v => v.id === activeVariant.parent_id);
                if (parentVar && parentVar.stock_type === 'parent') return true;
            }
        }
        return false;
    }, [activeVariant, product.stock_type, product.variants]);

    // Resolves the PARENT's unit (not the sub-variant's unit) for raw stock display.
    // displayStock returns the parent's raw stock value, so the unit label must match the parent's unit.
    const parentStockUnit = React.useMemo(() => {
        if (product.stock_type === 'parent') {
            return product.unit ? getUnitLabel(product.unit, locale) : null;
        }
        if (activeVariant?.parent_id) {
            const parentVar = product.variants?.find(v => v.id === activeVariant.parent_id);
            if (parentVar?.stock_type === 'parent') {
                return parentVar.unit ? getUnitLabel(parentVar.unit, locale) : null;
            }
        }
        return null;
    }, [activeVariant, product.stock_type, product.unit, product.variants, locale]);

    const stockStatusText = React.useMemo(() => {
        let text = t("product.detail.stock_qty_available", "Stok: {qty} {unit} tersedia");
        if (!text.includes("{unit}")) {
            text = text.replace("{qty}", "{qty} {unit}");
        }
        // In parent stock mode, displayStock is the raw parent stock value, so use
        // parentStockUnit (parent's unit, e.g. "gr") — NOT currentUnit (sub-variant's unit).
        const unitStr = isParentStockMode
            ? (parentStockUnit || currentUnit || t("product.detail.pcs", "Pcs"))
            : t("product.detail.pcs", "Pcs");
        return text.replace("{qty}", displayStock).replace("{unit}", unitStr).trim().replace(/\s+/g, ' ');
    }, [displayStock, currentUnit, parentStockUnit, isParentStockMode, locale, t]);

    const handleQuantityChange = (type) => {
        if (type === "minus" && quantity > 1) setQuantity(quantity - 1);
        else if (type === "plus" && quantity < currentStock)
            setQuantity(quantity + 1);
    };

    const formatPrice = (val) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(val);

    const renderStars = (rating) => {
        const parsedRating = parseFloat(rating) || 5.0;
        return [...Array(5)].map((_, i) => {
            const full = parsedRating >= i + 1;
            const half = !full && parsedRating >= i + 0.5;
            return (
                <div key={i} className="relative inline-block">
                    <Star size={14} className="text-zinc-200 fill-zinc-100" />
                    {(full || half) && (
                        <div
                            className="absolute inset-0 overflow-hidden"
                            style={{ width: full ? "100%" : "50%" }}
                        >
                            <Star
                                size={14}
                                className="text-amber-400 fill-amber-400"
                            />
                        </div>
                    )}
                </div>
            );
        });
    };

    const isOutOfStock = currentStock === 0;
    const canBuy = !isOutOfStock && currentPrice > 0;
    const [cartNotice, setCartNotice] = useState("");

    const handleAddToCart = () => {
        if (!canBuy) return;

        const cartKey = "fayyfir_cart";

        // Resolusi nama kategori & subkategori yang kompatibel
        const categoryName = typeof product.category === 'object' && product.category !== null
            ? (product.category.name_translations?.[locale] || product.category.name)
            : product.category || 'Perfume';

        const subCategoryName = typeof product.subCategory === 'object' && product.subCategory !== null
            ? (product.subCategory.name_translations?.[locale] || product.subCategory.name)
            : typeof product.sub_category === 'object' && product.sub_category !== null
                ? (product.sub_category.name_translations?.[locale] || product.sub_category.name)
                : product.subCategory || '';

        const cartItem = {
            id: product.id,
            slug: product.slug,
            title: displayName,
            category: categoryName,
            subCategory: subCategoryName,
            image: resolveProductImage(activeImage || allImages[0] || ""),
            variantId: activeVariant?.id || null,
            color: isDbProduct ? null : selectedColor,
            size: isDbProduct
                ? formatFullVariantName(activeVariant, locale)
                : (selectedSize || (product.size && Array.isArray(product.size) ? product.size[0] : product.size) || null),
            price: currentPrice,
            stock: currentStock,
            quantity,
            sku: activeVariant?.sku || product.sku || `SKU-${product.id}`,
            weight: parseWeightJs(activeVariant, product),
        };

        const currentCart = JSON.parse(localStorage.getItem(cartKey) || "[]");
        const existingIndex = currentCart.findIndex(
            (item) =>
                item.id === cartItem.id &&
                item.variantId === cartItem.variantId &&
                item.color === cartItem.color &&
                item.size === cartItem.size,
        );

        if (existingIndex >= 0) {
            const existingItem = currentCart[existingIndex];
            currentCart[existingIndex] = {
                ...existingItem,
                quantity: Math.min(existingItem.quantity + quantity, currentStock),
                stock: currentStock,
                price: currentPrice,
                image: cartItem.image,
            };
        } else {
            currentCart.push(cartItem);
        }

        localStorage.setItem(cartKey, JSON.stringify(currentCart));
        window.dispatchEvent(new Event("fayyfir-cart-updated"));
        setCartNotice(t("cart.added", "Produk ditambahkan ke keranjang"));
        setTimeout(() => setCartNotice(""), 2200);
    };

    const handleBuyNow = () => {
        if (!canBuy) return;

        if (!auth?.user) {
            setIsPendingBuyNow(true);
            setIsLoginModalOpen(true);
            return;
        }


        // Resolusi nama kategori & subkategori yang kompatibel
        const categoryNameResolved = typeof product.category === 'object' && product.category !== null
            ? (product.category.name_translations?.[locale] || product.category.name)
            : product.category || 'Perfume';

        const subCategoryNameResolved = typeof product.subCategory === 'object' && product.subCategory !== null
            ? (product.subCategory.name_translations?.[locale] || product.subCategory.name)
            : typeof product.sub_category === 'object' && product.sub_category !== null
                ? (product.sub_category.name_translations?.[locale] || product.sub_category.name)
                : product.subCategory || '';

        const cartItem = {
            id: product.id,
            slug: product.slug,
            title: displayName,
            category: categoryNameResolved,
            subCategory: subCategoryNameResolved,
            image: resolveProductImage(activeImage || allImages[0] || ""),
            variantId: activeVariant?.id || null,
            color: isDbProduct ? null : selectedColor,
            size: isDbProduct
                ? formatFullVariantName(activeVariant, locale)
                : (selectedSize || (product.size && Array.isArray(product.size) ? product.size[0] : product.size) || null),
            price: currentPrice,
            stock: currentStock,
            quantity,
            sku: activeVariant?.sku || product.sku || `SKU-${product.id}`,
            weight: parseWeightJs(activeVariant, product),
        };

        // Simpan hanya item ini ke cart agar checkout hanya memproses produk ini saja
        localStorage.setItem("fayyfir_cart", JSON.stringify([cartItem]));
        window.dispatchEvent(new Event("fayyfir-cart-updated"));

        router.visit('/checkout');
    };

    useEffect(() => {
        if (auth?.user && isPendingBuyNow) {
            setIsPendingBuyNow(false);
            handleBuyNow();
        }
    }, [auth?.user, isPendingBuyNow]);

    // Helper resolusi teks kategori & subkategori reaktif
    const categoryName = React.useMemo(() => {
        if (typeof product.category === 'object' && product.category !== null) {
            return product.category.name_translations?.[locale] || product.category.name;
        }
        return product.category || 'Perfume';
    }, [product.category, locale]);

    const categorySlug = React.useMemo(() => {
        return typeof product.category === 'object' && product.category !== null
            ? product.category.slug || product.category.name.toLowerCase().replace(/\s+/g, "-")
            : (product.category || 'perfume').toLowerCase().replace(/\s+/g, "-");
    }, [product.category]);

    const subCategoryName = React.useMemo(() => {
        if (typeof product.subCategory === 'object' && product.subCategory !== null) {
            return product.subCategory.name_translations?.[locale] || product.subCategory.name;
        }
        if (typeof product.sub_category === 'object' && product.sub_category !== null) {
            return product.sub_category.name_translations?.[locale] || product.sub_category.name;
        }
        return product.subCategory || '';
    }, [product.subCategory, product.sub_category, locale]);

    // Dapatkan tipe varian (Ukuran, Rasa, Warna, dll.)
    const variantType = React.useMemo(() => {
        if (!product.variants || product.variants.length === 0) return 'Varian';
        const type = product.variants[0].type || 'Varian';
        return type.charAt(0).toUpperCase() + type.slice(1);
    }, [product.variants]);

    return (
        <MainLayout>
            <Head title={`${displayName} - Fayyfir Shop`} />
            <Navbar alwaysSolid={true} />

            <div className="min-h-screen pt-24 pb-20 font-sans bg-white">
                {/* Breadcrumbs */}
                <div className="border-b bg-zinc-50 border-zinc-100">
                    <div className="px-4 py-3 mx-auto max-w-7xl sm:px-6 lg:px-8">
                        <nav className="flex text-xs text-zinc-400 items-center gap-1.5">
                            <Link
                                href="/"
                                className="flex items-center gap-1 font-medium transition-colors hover:text-blue-600"
                            >
                                <ArrowLeft size={12} />
                                {t("product.detail.home", "Home")}
                            </Link>
                            <ChevronRight size={12} className="text-zinc-300" />
                            <Link
                                href={`/products/${categorySlug}`}
                                className="font-medium transition-colors hover:text-blue-600"
                            >
                                {categoryName}
                            </Link>
                            <ChevronRight size={12} className="text-zinc-300" />
                            <span className="text-zinc-600 truncate max-w-[180px] font-medium">
                                {displayName}
                            </span>
                        </nav>
                    </div>
                </div>

                {/* Main Content */}
                <div className="px-4 pt-10 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 xl:gap-16">
                        {/* ─── Left: Image Gallery ─── */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                                duration: 0.6,
                                ease: [0.25, 1, 0.5, 1],
                            }}
                            className="flex flex-col gap-4"
                        >
                            {/* Main Image */}
                            <div className="relative overflow-hidden border shadow-xl rounded-3xl bg-zinc-50 border-zinc-100 aspect-square">
                                    <motion.img
                                        key={activeImage}
                                        src={resolveProductImage(activeImage)}
                                        alt={displayName}
                                        className="object-cover w-full h-full select-none cursor-grab active:cursor-grabbing"
                                        style={{ touchAction: "pan-y" }}
                                        initial={{ x: swipeDirection === "next" ? "100%" : swipeDirection === "prev" ? "-100%" : 0 }}
                                        animate={{ x: 0 }}
                                        transition={{ type: "tween", ease: "easeOut", duration: 0.22 }}
                                        drag={allImages.length > 1 ? "x" : false}
                                        dragConstraints={{ left: 0, right: 0 }}
                                        dragElastic={0.5}
                                        onDragEnd={(event, info) => {
                                            if (allImages.length <= 1) return;
                                            const threshold = 50;
                                            const currentIndex = allImages.indexOf(activeImage);
                                            if (info.offset.x < -threshold) {
                                                // Swipe left -> Next image (comes from right)
                                                setSwipeDirection("next");
                                                const nextIdx = (currentIndex + 1) % allImages.length;
                                                setActiveImage(allImages[nextIdx]);
                                            } else if (info.offset.x > threshold) {
                                                // Swipe right -> Prev image (comes from left)
                                                setSwipeDirection("prev");
                                                const prevIdx = (currentIndex - 1 + allImages.length) % allImages.length;
                                                setActiveImage(allImages[prevIdx]);
                                            }
                                        }}
                                    />

                                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/10 via-transparent to-transparent" />

                                {/* Status Badge */}
                                <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
                                    {(product.is_best_seller || product.status === "best-seller") && (
                                        <span className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-blue-800 text-white text-[11px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg shadow-amber-400/40">
                                            <Flame
                                                size={11}
                                                className="fill-current animate-pulse"
                                            />
                                            {t("product.detail.best_seller", "Best Seller")}
                                        </span>
                                    )}
                                    {(product.is_new || product.status === "new") && (
                                        <span className="flex items-center gap-1 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[11px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg shadow-blue-400/40 text-center justify-center">
                                            {t("product.detail.new_arrival", "New Arrival")}
                                        </span>
                                    )}
                                </div>

                                {/* Image counter */}
                                {allImages.length > 1 && (
                                    <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
                                        {allImages.indexOf(activeImage) + 1} / {allImages.length}
                                    </div>
                                )}
                            </div>

                            {/* Thumbnails */}
                            {allImages.length > 1 && (
                                <div className="flex gap-3 py-1 overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-200 scrollbar-track-transparent">
                                    {allImages.map((img, idx) => {
                                        const isActive = activeImage === img;
                                        const variantColor = !isDbProduct && Object.keys(variantImagesMap).find(
                                            (c) => variantImagesMap[c] === img,
                                        );
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => handleSelectImage(img)}
                                                className={`relative flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all duration-300 ${isActive
                                                    ? "border-blue-500 shadow-lg shadow-blue-200 scale-[1.03]"
                                                    : "border-zinc-200 hover:border-blue-300"
                                                    }`}
                                            >
                                                <img
                                                    src={resolveProductImage(img)}
                                                    alt={variantColor ? `Varian ${variantColor}` : `Foto ${idx + 1}`}
                                                    className="object-cover w-full h-full"
                                                />
                                                {!isActive && (
                                                    <div className="absolute inset-0 transition-colors bg-white/40 hover:bg-white/10" />
                                                )}
                                                {variantColor && (
                                                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] font-bold text-center py-0.5 truncate px-1">
                                                        {variantColor}
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </motion.div>

                        {/* ─── Right: Product Details ─── */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                                duration: 0.6,
                                ease: [0.25, 1, 0.5, 1],
                                delay: 0.1,
                            }}
                            className="flex flex-col gap-4"
                        >
                            {/* Category + stock pills */}
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-700 border border-blue-200 bg-blue-50 px-3 py-1 rounded-full">
                                    {subCategoryName || categoryName}
                                </span>
                                {!isOutOfStock && (
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700 border border-emerald-200 bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-1">
                                        <BadgeCheck size={10} /> {t("product.detail.stock_available", "Stok Tersedia")}
                                    </span>
                                )}
                            </div>

                            {/* Title */}
                            <div>
                                <h1 className="text-3xl lg:text-4xl font-bold text-zinc-900 leading-tight tracking-wide mb-3">
                                    {displayName}
                                </h1>

                                {/* Rating row */}
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-0.5">
                                        {renderStars(product.rating)}
                                    </div>
                                    <span className="text-sm font-bold text-amber-500">
                                        {product.rating}
                                    </span>
                                    <span className="text-xs text-zinc-300">|</span>
                                    <span className="text-sm text-zinc-500">
                                        {product.reviewCount || product.sold || 0}{" "}
                                        {t("product.detail.reviews", "ulasan")}
                                    </span>
                                    <span className="text-xs text-zinc-300">|</span>
                                    <span className="flex items-center gap-1 text-sm text-zinc-500">
                                        <Package size={12} className="text-zinc-400" />
                                        {product.sold || 0} {t("product.detail.sold", "terjual")}
                                    </span>
                                </div>
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent" />

                            {/* Price block */}
                            <div className="px-5 py-2 border border-blue-100 bg-gradient-to-br from-blue-50 to-blue-100/60 rounded-2xl">
                                <p className="text-xs font-bold tracking-widest text-blue-500 uppercase">
                                    {t("product.detail.price_label", "Harga")}
                                </p>
                                <div className="flex items-end gap-3">
                                    <span className="text-2xl font-extrabold tracking-tight text-blue-900">
                                        {formatPrice(currentPrice)}
                                    </span>
                                </div>
                                {((!isDbProduct && uniqueSizes.length > 0) || (isDbProduct && product.variants && product.variants.length > 1)) && (
                                    <p className="text-xs text-zinc-400 mt-1.5">
                                        {t("product.detail.price_notice", "Harga dapat berubah sesuai varian yang dipilih")}
                                    </p>
                                )}
                            </div>

                            {/* Database Variant Selection */}
                            {isDbProduct && groupedVariants && groupedVariants.length > 0 && (
                                <div className="space-y-4">
                                    {/* Row 1: Parent Variant */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xs font-bold tracking-widest uppercase text-zinc-500">
                                                {(() => {
                                                    const firstParent = groupedVariants[0];
                                                    const rawPType = firstParent.type_translations?.[locale] || firstParent.type || 'Varian';
                                                    const translatedPType = t("backoffice.product.form.preset_type." + rawPType.toLowerCase(), rawPType);
                                                    const pTypeCapitalized = translatedPType.charAt(0).toUpperCase() + translatedPType.slice(1);
                                                    const selectPrefix = locale === 'english' ? 'Select' : locale === 'arabic' ? 'اختر' : 'Pilih';
                                                    return t(`product.detail.select_${pTypeCapitalized.toLowerCase()}`, `${selectPrefix} ${pTypeCapitalized}`);
                                                })()}
                                            </h3>
                                            {(() => {
                                                const activeParent = groupedVariants.find(p => p.key === selectedParentKey) || groupedVariants[0];
                                                if (!activeParent) return null;
                                                const rawName = activeParent.name_translations?.[locale] || activeParent.name_translations?.indonesia || '';
                                                const isUkuranType = activeParent.type?.toLowerCase() === 'ukuran' || activeParent.type?.toLowerCase() === 'size'
                                                    || activeParent.type_translations?.[locale]?.toLowerCase() === 'ukuran'
                                                    || activeParent.type_translations?.[locale]?.toLowerCase() === 'size';
                                                let parentName = rawName;
                                                if (isUkuranType) {
                                                    const parentUnitStr = activeParent.unit
                                                        ? getUnitLabel(activeParent.unit, locale)
                                                        : currentUnit !== t('product.detail.pcs', 'Pcs') ? currentUnit : '';
                                                    if (parentUnitStr && !rawName.toLowerCase().includes(parentUnitStr.toLowerCase())) {
                                                        parentName = `${rawName} ${parentUnitStr}`;
                                                    }
                                                }
                                                return parentName ? (
                                                    <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                                                        {parentName}
                                                    </span>
                                                ) : null;
                                            })()}
                                        </div>
                                        <div className="flex flex-wrap gap-2.5">
                                            {groupedVariants.map((parent) => {
                                                const isSelected = selectedParentKey === parent.key;
                                                const parentName = parent.name_translations?.[locale] || parent.name_translations?.indonesia || '';
                                                const isParentOutOfStock = product.stock_type === 'parent'
                                                    ? (product.stock || 0) < parseCapacityJs(parent.name_translations?.[locale] || parent.name_translations?.indonesia || parent.name || '', product.unit, parent)
                                                    : parent.stock === 0;

                                                return (
                                                    <button
                                                        key={parent.key}
                                                        onClick={() => {
                                                            setSelectedParentKey(parent.key);
                                                            if (parent.has_sub_variants && parent.sub_variants.length > 0) {
                                                                // Select the first sub-variant of this parent
                                                                const firstSub = parent.sub_variants[0];
                                                                setSelectedVariantId(firstSub.id);
                                                                if (firstSub.image) {
                                                                    handleSelectImage(firstSub.image);
                                                                } else if (parent.image) {
                                                                    handleSelectImage(parent.image);
                                                                }
                                                            } else {
                                                                setSelectedVariantId(parent.id);
                                                                if (parent.image) {
                                                                    handleSelectImage(parent.image);
                                                                }
                                                            }
                                                        }}
                                                        disabled={isParentOutOfStock}
                                                        className={`flex min-w-24 items-center justify-center text-center gap-2.5 py-2 rounded-2xl border text-sm font-semibold transition-all duration-300 ${isSelected
                                                            ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-200"
                                                            : "bg-white border-zinc-200 text-zinc-600 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50"
                                                            } ${isParentOutOfStock ? "opacity-40 cursor-not-allowed" : ""}`}
                                                    >
                                                        <div className="text-center px-3 w-full">
                                                            <span className="block leading-tight">{parentName}</span>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Row 2: Sub-Variant (shown if current parent has sub-variants) */}
                                    {(() => {
                                        const currentParent = groupedVariants.find(p => p.key === selectedParentKey);
                                        if (!currentParent || !currentParent.has_sub_variants || currentParent.sub_variants.length === 0) return null;

                                        const rawSubType = currentParent.sub_variants[0].type_translations?.[locale] || currentParent.sub_variants[0].type || 'Sub Varian';
                                        const translatedSubType = t("backoffice.product.form.preset_type." + rawSubType.toLowerCase(), rawSubType);
                                        const subTypeCapitalized = translatedSubType.charAt(0).toUpperCase() + translatedSubType.slice(1);
                                        const selectPrefix = locale === 'english' ? 'Select' : locale === 'arabic' ? 'اختر' : 'Pilih';

                                        return (
                                            <div className="space-y-3 pt-2">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-xs font-bold tracking-widest uppercase text-zinc-500">
                                                        {t(`product.detail.select_${subTypeCapitalized.toLowerCase()}`, `${selectPrefix} ${subTypeCapitalized}`)}
                                                    </h3>
                                                    {selectedVariantId && (() => {
                                                        const resolvedSv = currentParent.sub_variants.find(sv => sv.id === selectedVariantId);
                                                        if (!resolvedSv) return null;
                                                        const svName = resolvedSv.name_translations?.[locale] || resolvedSv.name_translations?.indonesia || '';
                                                        const isUkuranSub = resolvedSv.type?.toLowerCase() === 'ukuran' || resolvedSv.type?.toLowerCase() === 'size'
                                                            || resolvedSv.type_translations?.[locale]?.toLowerCase() === 'ukuran'
                                                            || resolvedSv.type_translations?.[locale]?.toLowerCase() === 'size';
                                                        let displayName = svName;
                                                        if (isUkuranSub) {
                                                            const svUnitStr = resolvedSv.unit
                                                                ? getUnitLabel(resolvedSv.unit, locale)
                                                                : currentUnit !== t('product.detail.pcs', 'Pcs') ? currentUnit : '';
                                                            if (svUnitStr && !svName.toLowerCase().includes(svUnitStr.toLowerCase())) {
                                                                displayName = `${svName} ${svUnitStr}`;
                                                            }
                                                        }
                                                        return displayName ? (
                                                            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                                                                {displayName}
                                                            </span>
                                                        ) : null;
                                                    })()}
                                                </div>
                                                <div className="flex flex-wrap gap-2.5">
                                                    {currentParent.sub_variants.map((subVar) => {
                                                        const isSelected = selectedVariantId === subVar.id;
                                                        const subVarRawName = subVar.name_translations?.[locale] || subVar.name_translations?.indonesia || '';
                                                        const isUkuranSubBtn = subVar.type?.toLowerCase() === 'ukuran' || subVar.type?.toLowerCase() === 'size'
                                                            || subVar.type_translations?.[locale]?.toLowerCase() === 'ukuran'
                                                            || subVar.type_translations?.[locale]?.toLowerCase() === 'size';
                                                        let subVarDisplayName = subVarRawName;
                                                        if (isUkuranSubBtn) {
                                                            const subVarUnitStr = subVar.unit
                                                                ? getUnitLabel(subVar.unit, locale)
                                                                : currentUnit !== t('product.detail.pcs', 'Pcs') ? currentUnit : '';
                                                            if (subVarUnitStr && !subVarRawName.toLowerCase().includes(subVarUnitStr.toLowerCase())) {
                                                                subVarDisplayName = `${subVarRawName} ${subVarUnitStr}`;
                                                            }
                                                        }
                                                        const parentVarOfSub = subVar.parent_id ? product.variants?.find(v => v.id === subVar.parent_id) : null;
                                                        const isSubOutOfStock = product.stock_type === 'parent'
                                                            ? (product.stock || 0) < parseCapacityJs(subVar.name_translations?.[locale] || subVar.name_translations?.indonesia || subVar.name || '', product.unit, subVar)
                                                            : (parentVarOfSub && parentVarOfSub.stock_type === 'parent')
                                                                ? (parentVarOfSub.stock || 0) < parseCapacityJs(subVar.name_translations?.[locale] || subVar.name_translations?.indonesia || subVar.name || '', parentVarOfSub.unit, subVar)
                                                                : subVar.stock === 0;

                                                        return (
                                                            <button
                                                                key={subVar.id}
                                                                onClick={() => {
                                                                    setSelectedVariantId(subVar.id);
                                                                    if (subVar.image) {
                                                                        handleSelectImage(subVar.image);
                                                                    } else if (currentParent.image) {
                                                                        handleSelectImage(currentParent.image);
                                                                    }
                                                                }}
                                                                disabled={isSubOutOfStock}
                                                                className={`flex items-center justify-center gap-2.5 px-3 min-w-20 py-2 rounded-2xl border text-sm font-semibold transition-all duration-300 ${isSelected
                                                                    ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-200 scale-[1.03]"
                                                                    : "bg-white border-zinc-200 text-zinc-600 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50"
                                                                    } ${isSubOutOfStock ? "opacity-40 cursor-not-allowed" : ""}`}
                                                            >
                                                                <div className="text-center">
                                                                    <span className="block leading-tight">{subVarDisplayName}</span>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {/* Color / Variant Selection (Static JSON) */}
                            {!isDbProduct && uniqueColors.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-xs font-bold tracking-widest uppercase text-zinc-500">
                                            {t("product.detail.variant_label", "Warna / Varian")}
                                        </h3>
                                        {selectedColor && (
                                            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                                                {selectedColor}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2.5">
                                        {uniqueColors.map((color) => {
                                            const variantImg = variantImagesMap[color];
                                            const isSelected = selectedColor === color;
                                            return (
                                                <button
                                                    key={color}
                                                    onClick={() => handleColorSelect(color)}
                                                    className={`flex items-center gap-2 pl-1 pr-4 py-1.5 rounded-xl border text-sm font-semibold transition-all duration-300 ${isSelected
                                                        ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-200 scale-[1.03]"
                                                        : "bg-white border-zinc-200 text-zinc-600 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50"
                                                        }`}
                                                >
                                                    {variantImg ? (
                                                        <span className={`w-7 h-7 rounded-lg overflow-hidden border-2 flex-shrink-0 ${isSelected ? "border-white/40" : "border-zinc-200"}`}>
                                                            <img
                                                                src={resolveProductImage(variantImg)}
                                                                alt={color}
                                                                className="object-cover w-full h-full"
                                                            />
                                                        </span>
                                                    ) : (
                                                        isSelected && <Check size={12} className="ml-1" />
                                                    )}
                                                    {color}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Sizes Selection (Static JSON) */}
                            {!isDbProduct && uniqueSizes.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                                            <Tag size={12} /> {t("product.detail.size_label", "Ukuran")}
                                        </h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2.5">
                                        {uniqueSizes.map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => setSelectedSize(size)}
                                                className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-300 ${selectedSize === size
                                                    ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-200 scale-[1.03]"
                                                    : "bg-white border-zinc-200 text-zinc-600 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50"
                                                    }`}
                                            >
                                                {selectedSize === size && (
                                                    <Check size={12} className="inline mr-1.5" />
                                                )}
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Qty + Stock */}
                            <div className="flex items-center gap-5">
                                <div className="flex items-center overflow-hidden bg-white border shadow-sm rounded-xl border-zinc-200">
                                    <button
                                        onClick={() => handleQuantityChange("minus")}
                                        disabled={quantity <= 1 || !canBuy}
                                        className="flex items-center justify-center transition-colors w-11 h-11 text-zinc-500 hover:text-blue-700 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <div className="flex items-center justify-center w-12 text-base font-bold h-11 text-zinc-800 border-x border-zinc-200">
                                        {quantity}
                                    </div>
                                    <button
                                        onClick={() => handleQuantityChange("plus")}
                                        disabled={quantity >= currentStock || !canBuy}
                                        className="flex items-center justify-center transition-colors w-11 h-11 text-zinc-500 hover:text-blue-700 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>

                                <div>
                                    {isOutOfStock ? (
                                        <span className="text-red-500 text-sm font-semibold flex items-center gap-1.5">
                                            <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                            {t("product.detail.stock_out", "Stok habis")}
                                        </span>
                                    ) : (
                                        <span className="text-emerald-600 text-sm font-semibold flex items-center gap-1.5">
                                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                                            {stockStatusText}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    disabled={!canBuy}
                                    onClick={handleAddToCart}
                                    className="flex-1 px-4 flex items-center justify-center gap-2.5 py-4 rounded-2xl border-2 border-blue-600 text-blue-700 font-bold text-sm hover:bg-blue-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-nowrap"
                                >
                                    <ShoppingCart size={18} />
                                    {t("product.detail.cart_btn", "Keranjang")}
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    disabled={!canBuy}
                                    onClick={handleBuyNow}
                                    className="flex-[2] flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 text-white font-bold text-sm transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <Check size={18} />
                                    {t("product.detail.buy_btn", "Beli Sekarang")}
                                </motion.button>
                            </div>
                            {cartNotice && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border rounded-xl border-emerald-200 bg-emerald-50 text-emerald-700"
                                >
                                    <Check size={16} />
                                    {cartNotice}
                                    <Link href="/cart" className="ml-auto text-blue-700 hover:underline">
                                        {t("cart.view", "Lihat Cart")}
                                    </Link>
                                </motion.div>
                            )}

                            {/* Payment Method */}
                            <div className="flex flex-col items-center gap-2 px-4 py-2 border shadow-lg rounded-2xl bg-zinc-100 border-zinc-100">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                                    {t("product.detail.payment_method", "Metode Pembayaran")}
                                </p>
                                <img
                                    src="/images/payment/safecheckout.png"
                                    alt="Metode Pembayaran"
                                    className="object-contain h-16 transition-opacity"
                                />
                            </div>
                        </motion.div>
                    </div>

                    {/* Description Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="pt-10 mt-4 border-t border-zinc-100"
                    >
                        <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-3">
                            {t("product.detail.description_title", "Deskripsi Produk")}
                            <span className="flex-1 h-px bg-gradient-to-r from-zinc-200 to-transparent" />
                        </h2>
                        <div className="p-6 border bg-zinc-50 border-zinc-100 rounded-2xl lg:p-8">
                            <p className="text-sm leading-relaxed whitespace-pre-line text-zinc-600">
                                {displayDescription}
                            </p>
                        </div>
                    </motion.div>
                </div>

            </div>

            <Footer />
            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={() => {
                    setIsLoginModalOpen(false);
                    setIsPendingBuyNow(false);
                }}
                t={t}
            />

        </MainLayout>
    );
}
