import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/Contexts/LanguageContext";

/**
 * CategorySection Component
 * Featuring 4 main categories: Perfume, Aromatic Oil, Bakhoor and Oud, Healthy and Nutrition.
 * Designed with a clean white background and premium image-based cards.
 */
const CategorySection = () => {
    const { t } = useLanguage();

    const categories = [
        {
            title: t("nav.perfume"),
            image: "/images/category-background/perfume.png",
        },
        {
            title: t("nav.aromaticOil"),
            image: "/images/category-background/oudoil.jpg",
        },
        {
            title: t("nav.bakhoor"),
            image: "/images/category-background/oud.jpg",
        },
        {
            title: t("nav.nutrition"),
            image: "/images/category-background/healty.jpg",
        },
    ];

    return (
        <section className="bg-transparent py-10 px-6 relative overflow-hidden">
            <div className="max-w-7xl mx-auto relative z-10">
                {/* Categories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {categories.map((cat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.6 }}
                            whileHover={{ y: -12 }}
                            className="relative group h-72 rounded-2xl overflow-hidden shadow-xl transition-all duration-500"
                        >
                            {/* Card Background Image */}
                            <img
                                src={cat.image}
                                alt={cat.title}
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                            />

                            {/* Dark Overlay / Mask */}
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-all duration-500" />

                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 opacity-80 group-hover:opacity-90 transition-opacity duration-500" />

                            {/* Content */}
                            <div className="absolute inset-0 flex flex-col items-center justify-end p-10 text-center">
                                <motion.div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                    <h3 className="text-white text-3xl font-['Amiri'] font-bold mb-6 tracking-wide">
                                        {cat.title}
                                    </h3>

                                    <div className="h-[1px] w-12 bg-blue-500 mx-auto mb-6 transition-all duration-500 group-hover:w-24" />

                                    <button className="px-8 py-3 bg-white/10 backdrop-blur-md border border-white/30 text-white text-[10px] font-['Cinzel'] font-bold uppercase tracking-[0.2em] hover:bg-blue-500 transition-all duration-300 rounded-sm">
                                        {t("cat.viewCollection")}
                                    </button>
                                </motion.div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default CategorySection;
