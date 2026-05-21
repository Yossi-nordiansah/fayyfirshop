import React, { useState, useEffect, useMemo } from "react";
import { Head, Link, router } from "@inertiajs/react";
import Navbar from "@/Components/Navbar";
import Footer from "@/Components/Footer";
import MainLayout from "@/Layouts/MainLayout";
import CardProduct from "@/Components/product/CardProduct";
import { CATEGORY_MAP } from "@/Components/product/FilterSidebar";
import SidebarFilter from "./SidebarFilter";
import productsData from "@/data-source/data_products_30.json";
import { useLanguage } from "@/Contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    SlidersHorizontal,
    ChevronRight,
    X,
    Star,
    ShoppingBag,
    ArrowUpDown,
    RotateCcw,
} from "lucide-react";

export default function Products({ category = null, subCategory = null }) {
    const { t, locale } = useLanguage();

    // Core filtering & sorting states
    const [selectedCat, setSelectedCat] = useState(category);
    const [selectedSub, setSelectedSub] = useState(subCategory);
    const [searchQuery, setSearchQuery] = useState("");
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
        setSelectedCat(category);
        setSelectedSub(subCategory);
    }, [category, subCategory]);

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
        setSelectedCat(catSlug);
        setSelectedSub(subSlug);
        setSearchQuery("");
        setMobileFiltersOpen(false);

        // Update URL bar without standard hard visit to keep SPA routing elegant
        let newUrl = "/products";
        if (catSlug) {
            newUrl += `/${catSlug}`;
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
        return CATEGORY_MAP[selectedCat] || null;
    }, [selectedCat]);

    // Active Subcategory Object Details
    const activeSubcategoryInfo = useMemo(() => {
        if (!activeCategoryInfo || !selectedSub) return null;
        return activeCategoryInfo.subCategories[selectedSub] || null;
    }, [activeCategoryInfo, selectedSub]);

    // 1. Filter products based on selected category, subcategory and search term
    const filteredProducts = useMemo(() => {
        return productsData.filter((product) => {
            // Category check
            if (selectedCat) {
                const mappedCat = CATEGORY_MAP[selectedCat];
                if (!mappedCat || product.category !== mappedCat.name) {
                    return false;
                }

                // Subcategory check
                if (selectedSub) {
                    const mappedSub = mappedCat.subCategories[selectedSub];
                    if (!mappedSub || product.subCategory !== mappedSub.name) {
                        return false;
                    }
                }
            }

            // Search query check
            if (searchQuery.trim() !== "") {
                const query = searchQuery.toLowerCase();
                const titleMatch = product.title.toLowerCase().includes(query);
                const descMatch = (product.description || "")
                    .toLowerCase()
                    .includes(query);
                const catMatch = product.category.toLowerCase().includes(query);
                const subMatch = product.subCategory
                    .toLowerCase()
                    .includes(query);
                return titleMatch || descMatch || catMatch || subMatch;
            }

            return true;
        });
    }, [selectedCat, selectedSub, searchQuery]);

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
            return t(
                activeSubcategoryInfo.translationKey,
                activeSubcategoryInfo.name,
            );
        }
        if (activeCategoryInfo) {
            return t(
                activeCategoryInfo.translationKey,
                activeCategoryInfo.name,
            );
        }
        return t("nav.all", "Semua Produk");
    }, [activeCategoryInfo, activeSubcategoryInfo, t]);

    const bannerSubtitle = useMemo(() => {
        if (selectedCat === "perfume") {
            return t(
                "hero.perfume.subtitle",
                "Eau de Parfum & Fragrance Spray",
            );
        }
        if (selectedCat === "aromatic-oil") {
            return t("hero.oil.subtitle", "Dehn Oud & Campuran Minyak Pilihan");
        }
        if (selectedCat === "bakhoor-and-oud") {
            return t(
                "hero.bakhoor.subtitle",
                "Dupa Arab Tradisional & Kayu Oud",
            );
        }
        if (selectedCat === "healthy-nutrition") {
            return t("hero.nutrition.subtitle", "Madu Sidr & Saffron Premium");
        }
        return t(
            "footer.description",
            "Destinasi Anda untuk kemewahan Arab premium.",
        );
    }, [selectedCat, t]);

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
            <Head title={`${bannerTitle} - Fayyfir Shop`} />

            <Navbar />

            <MainLayout>
                {/* 1. Luxurious Banner Header */}
                <div className="relative pt-28 pb-20 px-6 bg-gradient-to-br from-slate-950 via-blue-950 to-zinc-950 border-b border-amber-500/20 overflow-hidden shadow-2xl text-center">
                    {/* Arabesque Geometric Overlay */}
                    <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

                    {/* Golden Ambient Blur Rings */}
                    <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-80 h-80 rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />
                    <div className="absolute top-1/3 right-1/4 -translate-y-1/2 w-80 h-80 rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

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
                <div className="max-w-7xl mx-auto px-1 md:px-6 py-12 lg:py-16">
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
                                            {productsData.length}
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
                                        <SlidersHorizontal size={14} />
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
                                                    ? t(
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
                                                    ? t(
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
                                                    slug={product.slug}
                                                    title={product.title}
                                                    price={product.price}
                                                    variants={product.variants}
                                                    sold={product.sold}
                                                    image={product.image}
                                                    status={product.status}
                                                    rating={product.rating}
                                                />
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                ) : (
                                    /* No Products Empty State */
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="bg-zinc-100 backdrop-blur-md border border-white/10 rounded-3xl py-24 px-8 text-center max-w-xl mx-auto space-y-5 shadow-2xl"
                                    >
                                        <div className="w-16 h-16 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600 shadow-inner">
                                            <ShoppingBag size={24} />
                                        </div>
                                        <div className="space-y-2">
                                            {/* Title */}
                                            <h3 className="text-xl font-bold text-slate-700 font-['Cinzel'] tracking-wide">
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



                <Footer />
            </MainLayout>
        </div>
    );
}
