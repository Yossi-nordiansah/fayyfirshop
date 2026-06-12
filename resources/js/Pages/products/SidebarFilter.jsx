import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/Contexts/LanguageContext";
import {
    Filter,
    RotateCcw,
    Grid,
    ChevronDown,
    X,
} from "lucide-react";
import FilterSidebar, { CATEGORY_MAP } from "@/Components/product/FilterSidebar";

/**
 * SidebarFilter — Komponen gabungan sidebar filter untuk halaman Products.
 *
 * Menggabungkan:
 *  - Desktop sticky sidebar  (via <FilterSidebar />)
 *  - Mobile slide-in drawer  (AnimatePresence + motion.div)
 */
const SidebarFilter = ({
    selectedCat,
    selectedSub,
    searchQuery,
    expandedCategories,
    toggleCategoryExpand,
    handleCategorySelect,
    resetFilters,
    mobileFiltersOpen,
    setMobileFiltersOpen,
    categoryMap = CATEGORY_MAP,
}) => {
    const { t, locale } = useLanguage();

    return (
        <>
            {/* ── Desktop Sticky Sidebar ── */}
            <FilterSidebar
                selectedCat={selectedCat}
                selectedSub={selectedSub}
                searchQuery={searchQuery}
                expandedCategories={expandedCategories}
                toggleCategoryExpand={toggleCategoryExpand}
                handleCategorySelect={handleCategorySelect}
                resetFilters={resetFilters}
                categoryMap={categoryMap}
            />

            {/* ── Mobile Slide-in Drawer ── */}
            <AnimatePresence>
                {mobileFiltersOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileFiltersOpen(false)}
                            className="fixed inset-0 bg-black z-[120] lg:hidden "
                        />

                        {/* Drawer Content */}
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "tween", duration: 0.3 }}
                            className="fixed right-0 top-0 bottom-0 w-80 bg-white z-[130] p-6 flex flex-col space-y-6 lg:hidden shadow-2xl"
                        >
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                                <span className="font-bold text-xs uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                                    <Filter size={14} className="text-amber-600" />
                                    Filter Kategori
                                </span>
                                <button
                                    onClick={() => setMobileFiltersOpen(false)}
                                    className="p-1 border rounded-full bg-zinc-50 border-zinc-100 text-zinc-500 hover:text-zinc-800"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Category List */}
                            <div className="pr-1 space-y-4 overflow-y-auto grow">
                                <button
                                    onClick={() => handleCategorySelect(null)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-300 ${!selectedCat
                                        ? "bg-gradient-to-r from-blue-900 to-blue-800 text-white"
                                        : "text-zinc-600 bg-zinc-50 hover:bg-zinc-100"
                                        }`}
                                >
                                    <Grid size={15} />
                                    {t("nav.all", "Semua Produk")}
                                </button>

                                {Object.entries(categoryMap).map(([catSlug, catObj]) => {
                                    const isSelected = selectedCat === catSlug;
                                    const isExpanded = expandedCategories[catSlug];

                                    return (
                                        <div key={catSlug} className="space-y-1">
                                            <div className="flex items-center justify-between w-full gap-1 border bg-zinc-50 border-zinc-100 rounded-xl">
                                                <button
                                                    onClick={() =>
                                                        handleCategorySelect(catSlug)
                                                    }
                                                    className={`grow text-left flex items-center justify-between px-4 py-3 rounded-l-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${isSelected && !selectedSub
                                                        ? "bg-gradient-to-r from-blue-900 to-blue-800 text-white"
                                                        : isSelected
                                                            ? "text-blue-600 font-extrabold"
                                                            : "text-zinc-600"
                                                        }`}
                                                >
                                                    {catObj.name_translations?.[locale] || catObj.name || t(catObj.translationKey, catObj.name)}
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        toggleCategoryExpand(catSlug)
                                                    }
                                                    className={`px-3 py-3 rounded-r-xl transition-all ${isSelected
                                                        ? "text-blue-600"
                                                        : "text-zinc-400 hover:text-zinc-700"
                                                        }`}
                                                >
                                                    <ChevronDown
                                                        size={14}
                                                        className={`transform transition-transform duration-300 ${isExpanded ? "rotate-180" : ""
                                                            }`}
                                                    />
                                                </button>
                                            </div>

                                            {isExpanded && (
                                                <div className="py-1 pl-4 ml-5 space-y-1 border-l border-zinc-100">
                                                    {catObj.subCategories && Object.entries(
                                                        catObj.subCategories,
                                                    ).map(([subSlug, subObj]) => {
                                                        const isSubSelected =
                                                            selectedCat === catSlug &&
                                                            selectedSub === subSlug;
                                                        return (
                                                            <button
                                                                key={subSlug}
                                                                onClick={() =>
                                                                    handleCategorySelect(
                                                                        catSlug,
                                                                        subSlug,
                                                                    )
                                                                }
                                                                className={`w-full text-left px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-between ${isSubSelected
                                                                    ? "text-amber-600 bg-amber-50/50 font-bold"
                                                                    : "text-zinc-500 hover:bg-zinc-50"
                                                                    }`}
                                                            >
                                                                <span>
                                                                    {subObj.name_translations?.[locale] || subObj.name || t(subObj.translationKey, subObj.name)}
                                                                </span>
                                                                {isSubSelected && (
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Drawer Footer Actions */}
                            <div className="pt-4 space-y-2 border-t border-zinc-100">
                                {(selectedCat || selectedSub || searchQuery) && (
                                    <button
                                        onClick={resetFilters}
                                        className="w-full py-2.5 border border-zinc-200 text-zinc-600 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 hover:bg-zinc-50 transition-colors"
                                    >
                                        <RotateCcw size={13} />
                                        RESET FILTERS
                                    </button>
                                )}
                                <button
                                    onClick={() => setMobileFiltersOpen(false)}
                                    className="w-full py-2.5 bg-zinc-950 text-white rounded-xl text-xs font-extrabold flex items-center justify-center"
                                >
                                    APPLY FILTERS
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default SidebarFilter;
