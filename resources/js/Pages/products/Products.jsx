import React, { useState, useEffect, useMemo, useRef } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import MainLayout from "@/Layouts/MainLayout";
import CardProduct from "@/Components/product/CardProduct";
import { CATEGORY_MAP } from "@/Components/product/FilterSidebar";
import SidebarFilter, { MobileFilterDrawer } from "./SidebarFilter";

import { useLanguage } from "@/Contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    ChevronRight,
    X,
    ShoppingBag,
    ArrowUpDown,
    RotateCcw,
    Filter,
} from "lucide-react";

export default function Products({ category = null, subCategory = null, products = [], heroSlides = [], homeCategoryCards = [] }) {
    const { t, locale } = useLanguage();
    const { navCategories = [] } = usePage().props;
    const { url } = usePage();

    const bannerRef = useRef(null);
    const [showStickyFilter, setShowStickyFilter] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setShowStickyFilter(!entry.isIntersecting);
            },
            { threshold: 0 }
        );

        if (bannerRef.current) {
            observer.observe(bannerRef.current);
        }

        return () => {
            if (bannerRef.current) {
                observer.unobserve(bannerRef.current);
            }
        };
    }, []);

    // Helper functions to map selected database category and subcategory to the format in productsData (data_products_30.json)
    const getProductCategoryKey = (catNameOrSlug) => {
        const lower = String(catNameOrSlug).toLowerCase();
        if (lower === 'parfum' || lower === 'perfume') return 'perfume';
        if (lower === 'kesehatan dan nutrisi' || lower === 'healthy nutrition' || lower === 'kesehatan-dan-nutrisi' || lower === 'healthy-nutrition') return 'healthy nutrition';
        if (lower === 'minyak aromaterapi' || lower === 'aromatic oil' || lower === 'minyak-aromaterapi' || lower === 'aromatic-oil') return 'aromatic oil';
        if (lower === 'bakhoor-and-oud' || lower === 'bakhoor and oud') return 'bakhoor and oud';
        return lower;
    };

    const getProductSubcategoryKey = (subNameOrVal) => {
        const lower = String(subNameOrVal).toLowerCase();
        if (lower === 'pria' || lower === 'mens' || lower === 'men') return 'mens';
        if (lower === 'wanita' || lower === 'womens' || lower === 'woman') return 'womens';
        if (lower === 'unisex') return 'unisex';
        if (lower === 'parfum set' || lower === 'parfume-set' || lower === 'perfume set') return 'parfume-set';
        if (lower === 'saffron') return 'saffron';
        if (lower === 'honey') return 'honey';
        if (lower === 'oud') return 'oud';
        if (lower === 'bakhoor') return 'bakhoor';
        if (lower === 'mamoul') return 'mamoul';
        if (lower === 'dehn-oud' || lower === 'dehn oud') return 'dehn oud';
        if (lower === 'aromatic-oil' || lower === 'aromatic oil') return 'aromatic oil';
        return lower;
    };

    const dynamicCategoryMap = useMemo(() => {
        // If database categories exist, build ONLY from database categories to avoid duplication!
        if (navCategories && navCategories.length > 0) {
            const map = {};
            navCategories.forEach((cat) => {
                const catSlug = cat.slug;
                const subCategoriesObj = {};
                if (cat.subCategories) {
                    cat.subCategories.forEach((sub) => {
                        subCategoriesObj[sub.val] = {
                            id: sub.id,
                            name: sub.name,
                            name_translations: sub.name_translations,
                            translationKey: null,
                        };
                    });
                }

                map[catSlug] = {
                    id: cat.id,
                    name: cat.name,
                    name_translations: cat.name_translations,
                    banner_image: cat.banner_image,
                    translationKey: null,
                    subCategories: subCategoriesObj,
                };
            });
            return map;
        }

        // Fallback static map if database is empty
        return {
            perfume: {
                name: "perfume",
                translationKey: "nav.perfume",
                subCategories: {
                    mens: { name: "mens", translationKey: "sub.mens" },
                    womens: { name: "Womens", translationKey: "sub.womens" },
                    unisex: { name: "Unisex", translationKey: "sub.unisex" },
                    "parfume-set": { name: "Parfum Set", translationKey: "sub.set" },
                },
            },
            "aromatic-oil": {
                name: "aromatic oil",
                translationKey: "nav.aromaticOil",
                subCategories: {
                    "aromatic-oil": { name: "aromatic oil", translationKey: "sub.oil" },
                    "dehn-oud": { name: "dehn oud", translationKey: "sub.dehn" },
                },
            },
            "bakhoor-and-oud": {
                name: "bakhoor and oud",
                translationKey: "nav.bakhoor",
                subCategories: {
                    oud: { name: "oud", translationKey: "sub.oud" },
                    bakhoor: { name: "bakhoor", translationKey: "sub.bakhoor" },
                    mamoul: { name: "mamoul", translationKey: "sub.mamoul" },
                },
            },
            "healthy-nutrition": {
                name: "healthy nutrition",
                translationKey: "nav.nutrition",
                subCategories: {
                    saffron: { name: "saffron", translationKey: "sub.saffron" },
                    honey: { name: "honey", translationKey: "sub.honey" },
                },
            },
        };
    }, [navCategories]);

    // Always use products from database — empty array = show empty state
    const productsList = useMemo(() => {
        return Array.isArray(products) ? products : [];
    }, [products]);

    // Helper function to extract product images dynamically (database structure vs mock data)
    const getProductImage = (prod) => {
        if (prod.image) {
            return prod.image;
        }
        if (prod.images && prod.images.length > 0) {
            const sortedImages = [...prod.images].sort((a, b) => {
                const aPrimary = !!a.is_primary && a.is_primary !== '0' && a.is_primary !== 0;
                const bPrimary = !!b.is_primary && b.is_primary !== '0' && b.is_primary !== 0;
                if (aPrimary && !bPrimary) return -1;
                if (!aPrimary && bPrimary) return 1;
                return (a.sort_order ?? 0) - (b.sort_order ?? 0);
            });
            return sortedImages.map(img => {
                if (!img.image_path) return '/images/logo-footer.webp';
                return img.image_path.startsWith('http') || img.image_path.startsWith('/')
                    ? img.image_path
                    : `/storage/${img.image_path}`;
            });
        }
        return '/images/logo-footer.webp';
    };

    const matchCategory = (prod, selectedCatSlug) => {
        if (!selectedCatSlug) return true;

        // Database product category object
        if (prod.category && typeof prod.category === 'object') {
            return prod.category.slug === selectedCatSlug;
        }

        // Legacy mock category string fallback
        const mappedCat = dynamicCategoryMap[selectedCatSlug];
        if (!mappedCat) return false;

        const productCatKey = getProductCategoryKey(prod.category);
        const mappedCatKey = getProductCategoryKey(mappedCat.name);
        return productCatKey === mappedCatKey;
    };

    const matchSubCategory = (prod, selectedSubVal, selectedCatSlug) => {
        if (!selectedSubVal) return true;

        // Database product subcategory relation
        const sub = prod.sub_category || prod.subCategory;
        if (sub && typeof sub === 'object') {
            // Slugify subcategory name for comparison
            const subSlug = String(sub.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            return subSlug === selectedSubVal;
        }

        // Legacy mock subcategory string fallback
        const mappedCat = dynamicCategoryMap[selectedCatSlug];
        if (!mappedCat) return false;

        const mappedSub = mappedCat.subCategories?.[selectedSubVal];
        if (!mappedSub) return false;

        const productSubKey = getProductSubcategoryKey(prod.subCategory);
        const mappedSubKey = getProductSubcategoryKey(mappedSub.name);
        return productSubKey === mappedSubKey;
    };

    // Helper to get normalized category slug (maps legacy slugs to database slugs if database categories exist)
    const getNormalizedCategorySlug = (slug) => {
        if (!slug) return slug;
        if (navCategories && navCategories.length > 0) {
            const legacyMapping = {
                'perfume': 'parfum',
                'aromatic-oil': 'minyak-aromaterapi',
                'healthy-nutrition': 'kesehatan-dan-nutrisi',
            };
            const mapped = legacyMapping[slug.toLowerCase()];
            if (mapped && navCategories.some(cat => cat.slug === mapped)) {
                return mapped;
            }
        }
        return slug;
    };

    // Core filtering & sorting states
    const [selectedCat, setSelectedCat] = useState(category);
    const [selectedSub, setSelectedSub] = useState(subCategory);
    const [searchQuery, setSearchQuery] = useState(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            return params.get("q") || params.get("search") || "";
        }
        return "";
    });
    const [sortBy, setSortBy] = useState("popular");

    // Mobile controls
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState({
        perfume: true,
        "aromatic-oil": true,
        "bakhoor-and-oud": true,
        "healthy-nutrition": true,
    });

    // Synchronize local states with URL/Inertia props
    useEffect(() => {
        setSelectedCat(getNormalizedCategorySlug(category));
        setSelectedSub(subCategory);
    }, [category, subCategory, navCategories]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            setSearchQuery(params.get("q") || params.get("search") || "");
        }
    }, [url]);

    // Listen to changes from Navbar search input
    useEffect(() => {
        const handleNavbarSearch = (e) => {
            setSearchQuery(e.detail);
        };
        window.addEventListener('navbar-search', handleNavbarSearch);
        return () => {
            window.removeEventListener('navbar-search', handleNavbarSearch);
        };
    }, []);

    // Sync local searchQuery back to Navbar search input
    useEffect(() => {
        window.dispatchEvent(new CustomEvent('product-search', { detail: searchQuery }));
    }, [searchQuery]);

    // Expand category on sidebar if active
    useEffect(() => {
        if (selectedCat) {
            setExpandedCategories((prev) => ({
                ...prev,
                [selectedCat]: true,
            }));
        }
    }, [selectedCat]);

    // Handle internal page category navigation (preserves quick responsive feel while syncing URL)
    const handleCategorySelect = (catSlug, subSlug = null) => {
        const normalized = getNormalizedCategorySlug(catSlug);
        setSelectedCat(normalized);
        setSelectedSub(subSlug);
        setSearchQuery("");
        setMobileFiltersOpen(false);

        // Update URL bar without standard hard visit to keep SPA routing elegant
        let newUrl = "/products";
        if (normalized) {
            newUrl += `/${normalized}`;
            if (subSlug) {
                newUrl += `?sub=${subSlug}`;
            }
        }
        router.visit(newUrl, {
            preserveState: true,
            preserveScroll: true,
            only: ["category", "subCategory"],
        });
    };

    const toggleCategoryExpand = (catSlug) => {
        setExpandedCategories((prev) => ({
            ...prev,
            [catSlug]: !prev[catSlug],
        }));
    };

    const resetFilters = () => {
        setSelectedCat(null);
        setSelectedSub(null);
        setSearchQuery("");
        setSortBy("popular");
        setMobileFiltersOpen(false);
        router.visit("/products", {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Active Category Object Details
    const activeCategoryInfo = useMemo(() => {
        if (!selectedCat) return null;
        return dynamicCategoryMap[selectedCat] || null;
    }, [selectedCat, dynamicCategoryMap]);

    // Active Subcategory Object Details
    const activeSubcategoryInfo = useMemo(() => {
        if (!activeCategoryInfo || !selectedSub) return null;
        return activeCategoryInfo.subCategories?.[selectedSub] || null;
    }, [activeCategoryInfo, selectedSub]);

    // 1. Filter products based on selected category, subcategory and search term
    const filteredProducts = useMemo(() => {
        return productsList.filter((product) => {
            // Category check
            if (!matchCategory(product, selectedCat)) {
                return false;
            }

            // Subcategory check
            if (!matchSubCategory(product, selectedSub, selectedCat)) {
                return false;
            }

            // Search query check
            if (searchQuery.trim() !== "") {
                const query = searchQuery.toLowerCase();
                const titleMatch = (product.title || "").toLowerCase().includes(query);
                const descMatch = (product.description || "")
                    .toLowerCase()
                    .includes(query);

                const catName = typeof product.category === 'object'
                    ? (product.category?.name || "")
                    : (product.category || "");
                const subName = typeof product.subCategory === 'object' || typeof product.sub_category === 'object'
                    ? ((product.subCategory || product.sub_category)?.name || "")
                    : (product.subCategory || "");

                const catMatch = String(catName).toLowerCase().includes(query);
                const subMatch = String(subName).toLowerCase().includes(query);
                return titleMatch || descMatch || catMatch || subMatch;
            }

            return true;
        });
    }, [selectedCat, selectedSub, searchQuery, productsList, dynamicCategoryMap]);

    // Helper to get actual minimum price for sorting
    const getProductPrice = (product) => {
        if (product.variants && product.variants.length > 0) {
            const prices = product.variants.map(v => v.price).filter(p => typeof p === 'number');
            if (prices.length > 0) {
                return Math.min(...prices);
            }
        }
        return product.price || 0;
    };

    // 2. Sort the filtered products
    const sortedProducts = useMemo(() => {
        const items = [...filteredProducts];
        switch (sortBy) {
            case "price-low":
                return items.sort((a, b) => getProductPrice(a) - getProductPrice(b));
            case "price-high":
                return items.sort((a, b) => getProductPrice(b) - getProductPrice(a));
            case "rating":
                return items.sort((a, b) => b.rating - a.rating);
            case "popular":
            default:
                return items.sort((a, b) => b.sold - a.sold);
        }
    }, [filteredProducts, sortBy]);

    // Dynamic translation headings
    const bannerTitle = useMemo(() => {
        if (activeSubcategoryInfo) {
            return activeSubcategoryInfo.name_translations?.[locale] ||
                activeSubcategoryInfo.name ||
                t(activeSubcategoryInfo.translationKey, activeSubcategoryInfo.name);
        }
        if (activeCategoryInfo) {
            return activeCategoryInfo.name_translations?.[locale] ||
                activeCategoryInfo.name ||
                t(activeCategoryInfo.translationKey, activeCategoryInfo.name);
        }
        return t("nav.all", "Semua Produk");
    }, [activeCategoryInfo, activeSubcategoryInfo, locale, t]);

    const bannerSubtitle = useMemo(() => {
        const catLower = String(selectedCat || "").toLowerCase();
        if (catLower.includes("perfume") || catLower.includes("parfum")) {
            return t(
                "hero.perfume.subtitle",
                "Eau de Parfum & Fragrance Spray",
            );
        }
        if (catLower.includes("oil") || catLower.includes("minyak")) {
            return t("hero.oil.subtitle", "Dehn Oud & Campuran Minyak Pilihan");
        }
        if (
            catLower.includes("bakhoor") ||
            catLower.includes("oud") ||
            catLower.includes("arang") ||
            catLower.includes("mabkhara") ||
            catLower.includes("mabhkara") ||
            catLower.includes("bukhur")
        ) {
            return t(
                "hero.bakhoor.subtitle",
                "Dupa Arab Tradisional & Kayu Oud",
            );
        }
        if (catLower.includes("nutrition") || catLower.includes("kesehatan") || catLower.includes("honey") || catLower.includes("saffron") || catLower.includes("kurma") || catLower.includes("dates")) {
            return t("hero.nutrition.subtitle", "Madu Sidr & Saffron Premium");
        }
        return t(
            "footer.description",
            "Destinasi Anda untuk kemewahan Arab premium.",
        );
    }, [selectedCat, t]);

    // Category background configuration (matches home page hero images & themes)
    const categoryBgMap = useMemo(
        () => ({
            perfume: {
                image: "/images/hero/bg-perfume.webp",
                overlayTheme:
                    "from-slate-950/85 via-blue-950/75 to-slate-950/90",
                accentGlow: "from-amber-500/10 to-blue-500/10",
            },
            parfum: {
                image: "/images/hero/bg-perfume.webp",
                overlayTheme:
                    "from-slate-950/85 via-blue-950/75 to-slate-950/90",
                accentGlow: "from-amber-500/10 to-blue-500/10",
            },
            "aromatic-oil": {
                image: "/images/hero/aromatic-oil2.webp",
                overlayTheme:
                    "from-slate-950/85 via-blue-900/75 to-slate-950/90",
                accentGlow: "from-blue-600/10 to-cyan-500/10",
            },
            "minyak-aromaterapi": {
                image: "/images/hero/aromatic-oil2.webp",
                overlayTheme:
                    "from-slate-950/85 via-blue-900/75 to-slate-950/90",
                accentGlow: "from-blue-600/10 to-cyan-500/10",
            },
            "minyak-aromatik": {
                image: "/images/hero/aromatic-oil2.webp",
                overlayTheme:
                    "from-slate-950/85 via-blue-900/75 to-slate-950/90",
                accentGlow: "from-blue-600/10 to-cyan-500/10",
            },
            "bakhoor-and-oud": {
                image: "/images/hero/bakhoor.webp",
                overlayTheme:
                    "from-slate-950/85 via-amber-950/75 to-slate-950/90",
                accentGlow: "from-amber-500/15 to-orange-500/10",
            },
            "bakhoor-dan-oud": {
                image: "/images/hero/bakhoor.webp",
                overlayTheme:
                    "from-slate-950/85 via-amber-950/75 to-slate-950/90",
                accentGlow: "from-amber-500/15 to-orange-500/10",
            },
            "arang-dan-mabkhara": {
                image: "/images/hero/bakhoor.webp",
                overlayTheme:
                    "from-slate-950/85 via-amber-950/75 to-slate-950/90",
                accentGlow: "from-amber-500/15 to-orange-500/10",
            },
            "arang-dan-mabhkara": {
                image: "/images/hero/bakhoor.webp",
                overlayTheme:
                    "from-slate-950/85 via-amber-950/75 to-slate-950/90",
                accentGlow: "from-amber-500/15 to-orange-500/10",
            },
            mabkhara: {
                image: "/images/hero/bakhoor.webp",
                overlayTheme:
                    "from-slate-950/85 via-amber-950/75 to-slate-950/90",
                accentGlow: "from-amber-500/15 to-orange-500/10",
            },
            mabhkara: {
                image: "/images/hero/bakhoor.webp",
                overlayTheme:
                    "from-slate-950/85 via-amber-950/75 to-slate-950/90",
                accentGlow: "from-amber-500/15 to-orange-500/10",
            },
            "healthy-nutrition": {
                image: "/images/hero/bg-honey.webp",
                overlayTheme:
                    "from-slate-950/85 via-amber-900/70 to-slate-950/90",
                accentGlow: "from-amber-500/15 to-yellow-500/10",
            },
            "kesehatan-dan-nutrisi": {
                image: "/images/hero/bg-honey.webp",
                overlayTheme:
                    "from-slate-950/85 via-amber-900/70 to-slate-950/90",
                accentGlow: "from-amber-500/15 to-yellow-500/10",
            },
        }),
        [],
    );

    const getFormattedImageUrl = (imgPath) => {
        if (!imgPath) return null;
        if (imgPath.startsWith("http://") || imgPath.startsWith("https://") || imgPath.startsWith("/")) {
            return imgPath;
        }
        return `/storage/${imgPath}`;
    };

    const currentCategoryBg = useMemo(() => {
        const defaultBg = {
            image: "/images/hero/bg-perfume.webp",
            overlayTheme: "from-slate-950/60 via-blue-950/50 to-slate-950/70",
            accentGlow: "from-amber-500/10 to-blue-500/10",
        };

        const targetCatSlug = selectedCat ? String(selectedCat).toLowerCase() : null;

        // 1. Check direct Category Banner Image from Backoffice (Product Categories CRUD)
        if (activeCategoryInfo?.banner_image) {
            const formattedImg = getFormattedImageUrl(activeCategoryInfo.banner_image);
            if (formattedImg) {
                return {
                    image: formattedImg,
                    overlayTheme: "from-slate-950/85 via-blue-950/75 to-slate-950/90",
                    accentGlow: "from-amber-500/10 to-blue-500/10",
                };
            }
        }

        // Also check navCategories directly for targetCatSlug
        if (targetCatSlug && navCategories && navCategories.length > 0) {
            const matchedNavCat = navCategories.find(c => String(c.slug || '').toLowerCase() === targetCatSlug);
            if (matchedNavCat?.banner_image) {
                const formattedImg = getFormattedImageUrl(matchedNavCat.banner_image);
                if (formattedImg) {
                    return {
                        image: formattedImg,
                        overlayTheme: "from-slate-950/85 via-blue-950/75 to-slate-950/90",
                        accentGlow: "from-amber-500/10 to-blue-500/10",
                    };
                }
            }
        }

        // 2. Check dynamic heroSlides from Backoffice (Content Management)
        if (heroSlides && heroSlides.length > 0) {
            let matchedSlide = null;
            if (!targetCatSlug) {
                // For "Semua Produk", use first active hero slide from backoffice if available
                matchedSlide = heroSlides[0];
            } else {
                matchedSlide = heroSlides.find((slide) => {
                    const slideSlug = String(slide.slug || "").toLowerCase();
                    const slideCat = String(slide.category || "").toLowerCase();
                    if (slideSlug === targetCatSlug || slideCat === targetCatSlug) return true;
                    if (targetCatSlug.includes("parfum") || targetCatSlug.includes("perfume")) {
                        return slideSlug.includes("parfum") || slideSlug.includes("perfume") || slideCat.includes("parfum") || slideCat.includes("perfume");
                    }
                    if (targetCatSlug.includes("oil") || targetCatSlug.includes("minyak")) {
                        return slideSlug.includes("oil") || slideSlug.includes("minyak") || slideCat.includes("oil") || slideCat.includes("minyak");
                    }
                    if (targetCatSlug === "bakhoor-dan-oud" || targetCatSlug === "bakhoor-and-oud") {
                        return (slideSlug.includes("bakhoor") || slideSlug.includes("oud") || slideCat.includes("bakhoor") || slideCat.includes("oud")) &&
                            !slideSlug.includes("arang") && !slideSlug.includes("mabkhara") && !slideCat.includes("arang") && !slideCat.includes("mabkhara");
                    }
                    if (targetCatSlug.includes("arang") || targetCatSlug.includes("mabkhara") || targetCatSlug.includes("mabhkara")) {
                        return slideSlug.includes("arang") || slideSlug.includes("mabkhara") || slideSlug.includes("mabhkara") ||
                            slideCat.includes("arang") || slideCat.includes("mabkhara") || slideCat.includes("mabhkara");
                    }
                    if (targetCatSlug.includes("nutrition") || targetCatSlug.includes("kesehatan") || targetCatSlug.includes("honey") || targetCatSlug.includes("saffron") || targetCatSlug.includes("kurma") || targetCatSlug.includes("dates")) {
                        return slideSlug.includes("nutrition") || slideSlug.includes("kesehatan") || slideSlug.includes("honey") || slideCat.includes("nutrition") || slideCat.includes("kesehatan") || slideCat.includes("honey");
                    }
                    return false;
                });
            }

            if (matchedSlide) {
                const rawImg = matchedSlide.background_image || matchedSlide.image;
                const formattedImg = getFormattedImageUrl(rawImg);
                if (formattedImg) {
                    let overlayTheme = "from-slate-950/30 via-blue-950/70 to-slate-950/60";
                    let accentGlow = "from-amber-500/10 to-blue-500/10";
                    if (matchedSlide.theme) {
                        if (matchedSlide.theme.includes("amber")) {
                            overlayTheme = "from-slate-950/85 via-amber-950/75 to-slate-950/90";
                            accentGlow = "from-amber-500/15 to-orange-500/10";
                        } else if (matchedSlide.theme.includes("blue-800") || matchedSlide.theme.includes("cyan")) {
                            overlayTheme = "from-slate-950/85 via-blue-900/75 to-slate-950/90";
                            accentGlow = "from-blue-600/10 to-cyan-500/10";
                        }
                    } else if (
                        targetCatSlug?.includes("bakhoor") ||
                        targetCatSlug?.includes("oud") ||
                        targetCatSlug?.includes("arang") ||
                        targetCatSlug?.includes("mabkhara") ||
                        targetCatSlug?.includes("mabhkara") ||
                        targetCatSlug?.includes("bukhur")
                    ) {
                        overlayTheme = "from-slate-950/85 via-amber-950/75 to-slate-950/90";
                        accentGlow = "from-amber-500/15 to-orange-500/10";
                    } else if (targetCatSlug?.includes("nutrition") || targetCatSlug?.includes("kesehatan")) {
                        overlayTheme = "from-slate-950/85 via-amber-900/70 to-slate-950/90";
                        accentGlow = "from-amber-500/15 to-yellow-500/10";
                    }
                    return { image: formattedImg, overlayTheme, accentGlow };
                }
            }
        }

        // 2. Check dynamic homeCategoryCards from Backoffice (Content Management)
        if (targetCatSlug && homeCategoryCards && homeCategoryCards.length > 0) {
            const matchedCard = homeCategoryCards.find((card) => {
                const cardSlug = String(card.slug || "").toLowerCase();
                if (cardSlug === targetCatSlug || cardSlug === `/products/${targetCatSlug}`) return true;
                if (targetCatSlug.includes("parfum") || targetCatSlug.includes("perfume")) return cardSlug.includes("parfum") || cardSlug.includes("perfume");
                if (targetCatSlug.includes("oil") || targetCatSlug.includes("minyak")) return cardSlug.includes("oil") || cardSlug.includes("minyak");
                if (targetCatSlug === "bakhoor-dan-oud" || targetCatSlug === "bakhoor-and-oud") {
                    return (cardSlug.includes("bakhoor") || cardSlug.includes("oud")) &&
                        !cardSlug.includes("arang") && !cardSlug.includes("mabkhara");
                }
                if (targetCatSlug.includes("arang") || targetCatSlug.includes("mabkhara") || targetCatSlug.includes("mabhkara")) {
                    return cardSlug.includes("arang") || cardSlug.includes("mabkhara") || cardSlug.includes("mabhkara");
                }
                if (targetCatSlug.includes("nutrition") || targetCatSlug.includes("kesehatan") || targetCatSlug.includes("honey") || targetCatSlug.includes("saffron") || targetCatSlug.includes("kurma") || targetCatSlug.includes("dates")) {
                    return cardSlug.includes("nutrition") || cardSlug.includes("kesehatan") || cardSlug.includes("healty") || cardSlug.includes("honey");
                }
                return false;
            });

            if (matchedCard) {
                const formattedImg = getFormattedImageUrl(matchedCard.image);
                if (formattedImg) {
                    return {
                        image: formattedImg,
                        overlayTheme: "from-slate-950/85 via-blue-950/75 to-slate-950/90",
                        accentGlow: "from-amber-500/10 to-blue-500/10",
                    };
                }
            }
        }

        // 3. Fallback to category static map if matches
        if (targetCatSlug && categoryBgMap[targetCatSlug]) {
            return categoryBgMap[targetCatSlug];
        }

        // 4. Fallback to activeCategoryInfo (ProductCategory model image)
        if (activeCategoryInfo?.image || activeCategoryInfo?.background_image) {
            const formattedImg = getFormattedImageUrl(activeCategoryInfo.image || activeCategoryInfo.background_image);
            if (formattedImg) {
                return {
                    image: formattedImg,
                    overlayTheme: "from-slate-950/85 via-blue-950/75 to-slate-950/90",
                    accentGlow: "from-amber-500/10 to-blue-500/10",
                };
            }
        }

        // 5. Dynamic fallback for ANY brand new category: automatically use primary image from category products
        if (targetCatSlug && filteredProducts && filteredProducts.length > 0) {
            const firstProdImg = getProductImage(filteredProducts[0]);
            if (firstProdImg && !firstProdImg.includes("logo-footer")) {
                const formattedImg = Array.isArray(firstProdImg) ? firstProdImg[0] : firstProdImg;
                return {
                    image: formattedImg,
                    overlayTheme: "from-slate-950/90 via-blue-950/80 to-slate-950/95",
                    accentGlow: "from-amber-500/10 to-blue-500/10",
                };
            }
        }

        return defaultBg;
    }, [selectedCat, heroSlides, homeCategoryCards, categoryBgMap, activeCategoryInfo, filteredProducts]);

    // Grid animation configs
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        show: {
            opacity: 1,
            y: 0,
            transition: { type: "spring", stiffness: 100, damping: 15 },
        },
    };

    return (
        <div className="min-h-screen text-zinc-100 font-sans selection:bg-amber-500 selection:text-white">
            <Head title={`Fayyfir - ${bannerTitle}`} />

            <MainLayout alwaysSolid={false} showWhatsAppFloatingButton={true}>
                {/* 1. Luxurious Banner Header with Category-Specific Background */}
                <div
                    ref={bannerRef}
                    className="relative pt-28 pb-20 px-6 border-b border-amber-500/20 overflow-hidden shadow-2xl text-center bg-slate-950"
                >
                    {/* Category Background Image with Smooth Animation */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentCategoryBg.image}
                            initial={{ opacity: 0, scale: 1.05 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            transition={{ duration: 0.7, ease: "easeInOut" }}
                            className="absolute inset-0 z-0"
                        >
                            <img
                                src={currentCategoryBg.image}
                                alt="Category Background"
                                className="w-full h-full object-cover object-center"
                            />
                            {/* Dark Gradient Overlays for optimal text contrast */}
                            <div
                                className={`absolute inset-0 bg-gradient-to-br ${currentCategoryBg.overlayTheme}`}
                            />
                            <div className="absolute inset-0 bg-black/20 backdrop-brightness-20" />
                        </motion.div>
                    </AnimatePresence>

                    {/* Arabesque Geometric Overlay */}
                    <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none z-[1]" />

                    {/* Dynamic Golden Ambient Blur Rings */}
                    <div
                        className={`absolute top-1/2 left-1/4 -translate-y-1/2 w-80 h-80 rounded-full bg-gradient-to-br ${currentCategoryBg.accentGlow} blur-[120px] pointer-events-none z-[1]`}
                    />
                    <div className="absolute top-1/3 right-1/4 -translate-y-1/2 w-80 h-80 rounded-full bg-blue-500/10 blur-[120px] pointer-events-none z-[1]" />

                    <div className="max-w-4xl mx-auto space-y-4 relative z-10">
                        {/* Breadcrumbs */}
                        <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber-500/70">
                            <Link
                                href="/"
                                className="hover:text-amber-400 transition-colors"
                            >
                                {t("nav.home", "Home")}
                            </Link>
                            <ChevronRight size={10} className="opacity-50" />
                            <span
                                className="cursor-pointer hover:text-amber-400 transition-colors"
                                onClick={() => handleCategorySelect(null)}
                            >
                                {t("nav.product", "Product")}
                            </span>
                            {activeCategoryInfo && (
                                <>
                                    <ChevronRight
                                        size={10}
                                        className="opacity-50"
                                    />
                                    <span
                                        className="cursor-pointer hover:text-amber-400 transition-colors"
                                        onClick={() =>
                                            handleCategorySelect(selectedCat)
                                        }
                                    >
                                        {t(
                                            activeCategoryInfo.translationKey,
                                            activeCategoryInfo.name,
                                        )}
                                    </span>
                                </>
                            )}
                            {activeSubcategoryInfo && (
                                <>
                                    <ChevronRight
                                        size={10}
                                        className="opacity-50"
                                    />
                                    <span className="text-amber-400 font-bold">
                                        {t(
                                            activeSubcategoryInfo.translationKey,
                                            activeSubcategoryInfo.name,
                                        )}
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Title with serif styling */}
                        <motion.h1
                            key={bannerTitle}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="text-4xl sm:text-5xl lg:text-6xl font-['Amiri'] font-bold text-white tracking-wide"
                        >
                            {bannerTitle}
                        </motion.h1>

                        {/* Subtitle */}
                        <motion.p
                            key={bannerSubtitle}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1, duration: 0.5 }}
                            className="text-sm sm:text-base text-zinc-400 font-medium max-w-2xl mx-auto leading-relaxed"
                        >
                            {bannerSubtitle}
                        </motion.p>

                        {/* Centered Premium Instant Search */}
                        <div className="pt-6 max-w-md mx-auto relative">
                            <div className="relative flex items-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-full py-1.5 pl-5 pr-2 focus-within:border-amber-500/70 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all duration-300">
                                <Search
                                    size={18}
                                    className="text-zinc-500 shrink-0"
                                />
                                <input
                                    type="text"
                                    placeholder={t(
                                        "nav.searchPlaceholder",
                                        "Cari produk...",
                                    )}
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    className="w-full bg-transparent border-none text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-0 px-3"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-all mr-1"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Main Page Layout (Sidebar + Grid) */}
                <div className="max-w-7xl 2xl:max-w-none mx-auto px-1 md:px-6 py-12 lg:py-16">
                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                        {/* 2a. Sidebar — Desktop sticky + Mobile drawer */}
                        <SidebarFilter
                            selectedCat={selectedCat}
                            selectedSub={selectedSub}
                            searchQuery={searchQuery}
                            expandedCategories={expandedCategories}
                            toggleCategoryExpand={toggleCategoryExpand}
                            handleCategorySelect={handleCategorySelect}
                            resetFilters={resetFilters}
                            mobileFiltersOpen={mobileFiltersOpen}
                            setMobileFiltersOpen={setMobileFiltersOpen}
                            categoryMap={dynamicCategoryMap}
                        />

                        {/* 2b. Main Products Area */}
                        <div className="grow w-full space-y-6">
                            {/* Sort & Info Header Bar */}
                            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-zinc-100 backdrop-blur-md border border-white/10 px-6 py-4 rounded-2xl gap-4 shadow-lg">
                                {/* Result Count */}
                                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900">
                                    <ShoppingBag
                                        size={14}
                                        className="text-zinc-800"
                                    />
                                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                                        {t("catalog.showing", "Showing")}{" "}
                                        <strong className="text-zinc-800 font-bold">
                                            {sortedProducts.length}
                                        </strong>{" "}
                                        {t("catalog.of", "of")}{" "}
                                        <strong className="text-zinc-800 font-bold">
                                            {productsList.length}
                                        </strong>{" "}
                                        {t("nav.product", "products")}
                                    </span>
                                </div>

                                {/* Sort & Mobile filter button */}
                                <div className="flex justify-between items-center gap-3">
                                    {/* Mobile Filter Toggle */}
                                    <button
                                        onClick={() =>
                                            setMobileFiltersOpen(true)
                                        }
                                        className="lg:hidden flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-900 rounded-xl text-xs font-bold transition-colors"
                                    >
                                        <Filter size={14} />
                                        {t("catalog.filter_btn", "Filters")}
                                    </button>

                                    {/* Sort Dropdown */}
                                    <div className="relative flex items-center bg-slate-100 border border-zinc-100 rounded-xl px-3 py-2">
                                        <ArrowUpDown
                                            size={13}
                                            className="text-zinc-900 mr-2 shrink-0"
                                        />
                                        <select
                                            value={sortBy}
                                            onChange={(e) =>
                                                setSortBy(e.target.value)
                                            }
                                            className="bg-transparent border-none p-0 text-xs font-bold text-slate-900 outline-none focus:ring-0 pr-8 cursor-pointer"
                                        >
                                            <option value="popular">
                                                {t(
                                                    "sort.popularity",
                                                    "Popularity",
                                                )}
                                            </option>
                                            <option value="price-low">
                                                {t(
                                                    "sort.price_low",
                                                    "Price: Low to High",
                                                )}
                                            </option>
                                            <option value="price-high">
                                                {t(
                                                    "sort.price_high",
                                                    "Price: High to Low",
                                                )}
                                            </option>
                                            <option value="rating">
                                                {t("sort.rating", "Top Rated")}
                                            </option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Active Filters Tag list */}
                            {(selectedCat || selectedSub || searchQuery) && (
                                <div className="flex flex-wrap items-center gap-2 px-1">
                                    {/* Active Filters Label */}
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mr-1">
                                        {t("filter.active", "Active filters:")}
                                    </span>

                                    {/* Category Badge */}
                                    {selectedCat && (
                                        <div className="flex items-center gap-1 px-3 py-1 bg-blue-50 border border-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                            <span>
                                                {t(
                                                    "filter.category",
                                                    "Category",
                                                )}
                                                :{" "}
                                                {activeCategoryInfo
                                                    ? activeCategoryInfo.name_translations?.[locale] ||
                                                    activeCategoryInfo.name ||
                                                    t(
                                                        activeCategoryInfo.translationKey,
                                                        activeCategoryInfo.name,
                                                    )
                                                    : selectedCat}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    handleCategorySelect(null)
                                                }
                                                className="hover:text-blue-900"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    )}

                                    {/* Subcategory Badge */}
                                    {selectedSub && (
                                        <div className="flex items-center gap-1 px-3 py-1 bg-amber-50 border border-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                                            <span>
                                                {t("filter.sub", "Sub")}:{" "}
                                                {activeSubcategoryInfo
                                                    ? activeSubcategoryInfo.name_translations?.[locale] ||
                                                    activeSubcategoryInfo.name ||
                                                    t(
                                                        activeSubcategoryInfo.translationKey,
                                                        activeSubcategoryInfo.name,
                                                    )
                                                    : selectedSub}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    handleCategorySelect(
                                                        selectedCat,
                                                        null,
                                                    )
                                                }
                                                className="hover:text-amber-900"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    )}

                                    {/* Search Query Badge */}
                                    {searchQuery && (
                                        <div className="flex items-center gap-1 px-3 py-1 bg-zinc-100 border border-zinc-200 text-zinc-700 rounded-full text-xs font-semibold">
                                            <span>
                                                {t("filter.search", "Search")}:
                                                "{searchQuery}"
                                            </span>
                                            <button
                                                onClick={() =>
                                                    setSearchQuery("")
                                                }
                                                className="hover:text-zinc-900"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    )}

                                    {/* Clear All Button */}
                                    <button
                                        onClick={resetFilters}
                                        className="text-xs font-bold text-zinc-400 hover:text-red-500 transition-colors ml-2 flex items-center gap-1"
                                    >
                                        <RotateCcw size={12} />
                                        {t("filter.clear_all", "Clear All")}
                                    </button>
                                </div>
                            )}

                            {/* 3. Product Listing Grid */}
                            <AnimatePresence mode="popLayout">
                                {sortedProducts.length > 0 ? (
                                    <motion.div
                                        key="products-grid"
                                        variants={containerVariants}
                                        initial="hidden"
                                        animate="show"
                                        className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-1 md:gap-x-3 gap-y-1"
                                    >
                                        {sortedProducts.map((product) => (
                                            <motion.div
                                                key={product.id}
                                                variants={itemVariants}
                                                layout
                                            >
                                                <CardProduct
                                                    id={product.id}
                                                    product={product}
                                                    slug={product.slug}
                                                    title={product.title}
                                                    price={product.price}
                                                    variants={product.variants}
                                                    sold={product.sold}
                                                    image={getProductImage(product)}
                                                    status={product.status}
                                                    is_new={product.is_new}
                                                    is_best_seller={product.is_best_seller}
                                                    rating={Number(product.rating || 0)}
                                                />
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                ) : (
                                    /* No Products Empty State */
                                    <motion.div
                                        key="no-products-empty"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="bg-zinc-100 backdrop-blur-md border border-white/10 rounded-3xl py-24 md:mx-auto mx-4 md:px-8 px-4 text-center max-w-xl mx-auto space-y-5 shadow-2xl"
                                    >
                                        <div className="w-16 h-16 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600 shadow-inner">
                                            <ShoppingBag size={24} />
                                        </div>
                                        <div className="space-y-2">
                                            {/* Title */}
                                            <h3 className="text-xl font-bold text-slate-700 tracking-wide">
                                                {t(
                                                    "catalog.empty.title",
                                                    "No Products Found",
                                                )}
                                            </h3>

                                            {/* Description */}
                                            <p className="text-sm text-zinc-400 leading-relaxed max-w-sm mx-auto">
                                                {t(
                                                    "catalog.empty.desc",
                                                    "We couldn't find any products matching your selection. Try clearing your filters or using a different search query.",
                                                )}
                                            </p>
                                        </div>

                                        {/* Reset Action Button */}
                                        <button
                                            onClick={resetFilters}
                                            className="px-6 py-2.5 bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 text-white rounded-full text-xs font-extrabold tracking-wider uppercase shadow-md shadow-blue-900/20 hover:scale-105 transition-all duration-300"
                                        >
                                            {t(
                                                "catalog.empty.btn",
                                                "View All Products",
                                            )}
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Sticky/Fixed Side Tab Button for Mobile */}
                <AnimatePresence>
                    {showStickyFilter && (
                        <motion.button
                            initial={{ x: -50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -50, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setMobileFiltersOpen(true)}
                            className="lg:hidden fixed left-0 top-[35%] -translate-y-1/2 z-[90] flex items-center justify-center w-11 h-12 bg-blue-950 text-white rounded-r-2xl shadow-xl border-y border-r border-amber-500/30 active:scale-95 transition-all focus:outline-none"
                            title="Filter Kategori"
                        >
                            <Filter size={18} className="text-amber-400" />
                        </motion.button>
                    )}
                </AnimatePresence>

                {/* Mobile Slide-in Drawer */}
                <MobileFilterDrawer
                    selectedCat={selectedCat}
                    selectedSub={selectedSub}
                    searchQuery={searchQuery}
                    expandedCategories={expandedCategories}
                    toggleCategoryExpand={toggleCategoryExpand}
                    handleCategorySelect={handleCategorySelect}
                    resetFilters={resetFilters}
                    mobileFiltersOpen={mobileFiltersOpen}
                    setMobileFiltersOpen={setMobileFiltersOpen}
                    categoryMap={dynamicCategoryMap}
                />
            </MainLayout>
        </div>
    );
}
