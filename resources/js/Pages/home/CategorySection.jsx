import React from 'react';
import { motion } from 'framer-motion';

/**
 * CategorySection Component
 * Featuring 3 main categories: Oud And Oil, Healthy And Nutrition, Food And Drink.
 * Designed with a clean white background and premium image-based cards.
 */
const CategorySection = () => {
    const categories = [
        {
            title: "Oud And Oil",
            image: "/images/category-background/oudoil.jpg", // Temporary image provided by user
        },
        {
            title: "Healthy And Nutrition",
            image: "/images/category-background/healty.jpg", // Temporary image provided by user
        },
        {
            title: "Food And Drink",
            image: "/images/category-background/kurma.jpg", // Temporary image provided by user
        }
    ];

    return (
        <section className="bg-white py-10 px-6 relative overflow-hidden">

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <span className="text-amber-600 text-xs font-bold tracking-[0.4em] uppercase font-['Cinzel'] block mb-2">
                        Collections
                    </span>
                    <h2 className="text-4xl md:text-5xl text-zinc-900 font-['Amiri'] font-bold">
                        Browse by Category
                    </h2>
                    <div className="w-20 h-1 bg-amber-500 mx-auto mt-6 rounded-full" />
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                            
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-75 transition-opacity duration-500" />
                            
                            {/* Content */}
                            <div className="absolute inset-0 flex flex-col items-center justify-end p-10 text-center">
                                <motion.div 
                                    className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500"
                                >
                                    <h3 className="text-white text-3xl font-['Amiri'] font-bold mb-6 tracking-wide">
                                        {cat.title}
                                    </h3>
                                    
                                    <div className="h-[1px] w-12 bg-amber-500 mx-auto mb-6 transition-all duration-500 group-hover:w-24" />
                                    
                                    <button className="px-8 py-3 bg-white/10 backdrop-blur-md border border-white/30 text-white text-[10px] font-['Cinzel'] font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-zinc-900 transition-all duration-300 rounded-sm">
                                        View Collection
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
