import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/Contexts/LanguageContext";
import { Filter, RotateCcw, Grid, ChevronDown } from "lucide-react";

// Category slug mapping to database values and translations keys
export const CATEGORY_MAP = {
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
            "aromatic-oil": {
                name: "aromatic oil",
                translationKey: "sub.oil",
            },
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

/**
 * FilterSidebar Component - Fayyfir Shop Premium Filters
 */
const FilterSidebar = ({
    selectedCat,
    selectedSub,
    searchQuery,
    expandedCategories,
    toggleCategoryExpand,
    handleCategorySelect,
    resetFilters,
}) => {
    const { t } = useLanguage();

    return (
        <aside className="sticky hidden border shadow-xl lg:block w-72 shrink-0 top-24 bg-white/80 backdrop-blur-md border-zinc-100 rounded-3xl p-7 shadow-zinc-200/50">
            {/* Heading */}
            <div className="flex items-center justify-between pb-5 mb-6 border-b border-zinc-100">
                <span className="font-['Cinzel'] font-bold text-xs uppercase tracking-[0.2em] text-zinc-900 flex items-center gap-2">
                    <Filter size={14} className="text-amber-600" />
                    {t("nav.product", "Kategori")}
                </span>
                {(selectedCat || selectedSub || searchQuery) && (
                    <button
                        onClick={resetFilters}
                        className="text-[10px] font-bold text-zinc-400 hover:text-amber-600 flex items-center gap-1 transition-colors"
                    >
                        <RotateCcw size={10} />
                        {t("filter.reset", "RESET")}
                    </button>
                )}
            </div>

            {/* Collections List */}
            <div className="space-y-4">
                <button
                    onClick={() => handleCategorySelect(null)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-300 ${!selectedCat ? "bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg shadow-blue-900/20" : "text-zinc-600 hover:text-blue-600 hover:bg-zinc-50"}`}
                >
                    <Grid size={15} />
                    {t("nav.all", "Semua Produk")}
                </button>

                {/* Mapping categorized folders */}
                {Object.entries(CATEGORY_MAP).map(([catSlug, catObj]) => {
                    const isSelected = selectedCat === catSlug;
                    const isExpanded = expandedCategories[catSlug];

                    return (
                        <div key={catSlug} className="space-y-1">
                            <div className="flex items-center justify-between w-full gap-1 rounded-xl">
                                <button
                                    onClick={() =>
                                        handleCategorySelect(catSlug)
                                    }
                                    className={`grow text-left text-nowrap flex items-center justify-between px-4 py-3 rounded-l-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${isSelected && !selectedSub ? "bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg shadow-blue-900/20" : isSelected ? "text-blue-600 font-extrabold bg-blue-50/50" : "text-zinc-600 hover:text-blue-600 hover:bg-zinc-50"}`}
                                >
                                    {t(catObj.translationKey, catObj.name)}
                                </button>

                                <button
                                    onClick={() =>
                                        toggleCategoryExpand(catSlug)
                                    }
                                    className={`px-3 py-3 rounded-r-xl transition-all ${isSelected ? "text-blue-600 bg-blue-50/50" : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50"}`}
                                    aria-label="Expand category"
                                >
                                    <ChevronDown
                                        size={14}
                                        className={`transform transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                                    />
                                </button>
                            </div>

                            {/* Subcategories (Flyout/Collapsed Accordion) */}
                            <AnimatePresence initial={false}>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="py-1 pl-4 ml-5 space-y-1 overflow-hidden border-l border-zinc-100"
                                    >
                                        {Object.entries(
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
                                                    className={`w-full text-left px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-between ${isSubSelected ? "text-amber-600 bg-amber-50/50 font-bold" : "text-zinc-500 hover:text-amber-600 hover:bg-zinc-50"}`}
                                                >
                                                    <span>
                                                        {t(
                                                            subObj.translationKey,
                                                            subObj.name,
                                                        )}
                                                    </span>
                                                    {isSubSelected && (
                                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
        </aside>
    );
};

export default FilterSidebar;
