import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, ChevronLeft, ChevronRight, Leaf, Sparkles, Coffee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * HeroSlider Component
 * Premium Middle Eastern aesthetic design for Fayyfir Shop.
 * Updated with Lucide React icons and Arabic-inspired typography.
 */

const SLIDES = [
    {
        id: 1,
        category: "Exclusive Perfume",
        title: "The Essence of Luxury",
        subtitle: "Oud, Attar, & Bukhoor Collection",
        description: "Captivating Arabian fragrances that are long-lasting and leave a legendary impression of elegance with every step.",
        image: "/images/hero/bg-perfume.jpg",
        productImage: "/images/hero/perfume.png",
        icon: <Sparkles size={24} />,
        theme: "from-blue-900/60"
    },
    {
        id: 2,
        category: "Healthy & Nutrition",
        title: "Purity From Nature",
        subtitle: "Yemeni Sidr Honey & Negin Saffron",
        description: "Experience the finest benefits from selected organic ingredients imported directly for your optimal health and vitality.",
        productImage: "/images/hero/honey.png",
        image: "/images/hero/bg-honey.jpg",
        icon: <Leaf size={24} />,
        theme: "from-blue-900/60"
    },
    {
        id: 3,
        category: "Premium Food & Drink",
        title: "Authentic Arabian Delights",
        subtitle: "Ajwa Dates & Premium Arabic Coffee",
        description: "Enjoy the delight of selected premium dates and spiced coffee that warms the soul and creates lasting memories.",
        image: "/images/hero/dates.png",
        productImage: "/images/hero/food.png",
        icon: <Coffee size={24} />,
        theme: "from-blue-900/60"
    }
];

import HeroBackground from '@/Components/HeroBackground';

const HeroSlider = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    const nextSlide = useCallback(() => {
        if (isAnimating) return;
        setIsAnimating(true);
        setCurrentSlide((prev) => (prev === SLIDES.length - 1 ? 0 : prev + 1));
        setTimeout(() => setIsAnimating(false), 800);
    }, [isAnimating]);

    const prevSlide = () => {
        if (isAnimating) return;
        setIsAnimating(true);
        setCurrentSlide((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1));
        setTimeout(() => setIsAnimating(false), 800);
    };

    useEffect(() => {
        const timer = setInterval(nextSlide, 7000);
        return () => clearInterval(timer);
    }, [nextSlide]);

    return (
        <section className="relative w-full h-screen lg:max-h-screen overflow-hidden bg-zinc-950 select-none">
            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(e, { offset, velocity }) => {
                    const swipe = Math.abs(offset.x) > 50 && Math.abs(velocity.x) > 500;
                    if (swipe && offset.x > 0) prevSlide();
                    else if (swipe && offset.x < 0) nextSlide();
                }}
                className="relative w-full h-full"
            >
                {SLIDES.map((slide, index) => (
                <div
                    key={slide.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                        index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                >
                    <HeroBackground
                        image={slide.image}
                        productImage={slide.productImage}
                        theme={slide.theme}
                        isActive={index === currentSlide}
                    >
                        {/* Content Area */}
                        <div className="h-full lg:max-w-7xl w-full mx-auto px-6 lg:px-12 flex flex-col justify-center items-start text-white">
                            <div className={`max-w-3xl lg:mx-0 mx-auto md:space-y-4 space-y-2 transition-all duration-700 transform ${
                                index === currentSlide ? 'translate-y-0 opacity-100 delay-300' : 'translate-y-10 opacity-0'
                            }`}>
                                
                                {/* Category Badge */}
                                <div className="flex items-center gap-2 lg:mx-0 mx-auto px-4 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-full w-fit backdrop-blur-md">
                                    <span className="text-white">{slide.icon}</span>
                                    <span className="text-white text-xs font-bold tracking-[0.3em] uppercase font-['Cinzel']">
                                        {slide.category}
                                    </span>
                                </div>

                                <div className="lg:hidden block py-4">
                                    <img 
                                        src={slide.productImage} 
                                        alt={slide.title} 
                                        className="w-48 md:w-96 mx-auto drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)] animate-floating" 
                                    />
                                </div>

                                {/* Main Heading */}
                                <h1 className="text-2xl md:text-3xl lg:text-5xl font-['Amiri'] lg:text-left text-center font-bold leading-tight">
                                    {slide.title}
                                    <span className="block text-2xl md:text-3xl lg:text-4xl text-white mt-4 font-normal italic opacity-90 font-serif">
                                        {slide.subtitle}
                                    </span>
                                </h1>

                                {/* Description */}
                                <p className="lg:text-left text-center text-zinc-300 text-sm md:text-xl max-w-xl leading-relaxed font-light">
                                    {slide.description}
                                </p>

                                {/* CTA Button */}
                                <div className="pt-6 md:pt-10">
                                    <button
                                        className="lg:mx-0 mx-auto flex block px-5 py-4 rounded-lg group relative items-center gap-4 lg:px-10 lg:py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-sm transition-all duration-500 shadow-2xl shadow-blue-900/40 overflow-hidden"
                                    >
                                        <span className="relative z-10 tracking-[0.2em] uppercase text-sm font-['Cinzel']">Explore Collection</span>
                                        <span className="relative z-10 transition-transform group-hover:translate-x-1">
                                            <ShoppingBag size={20} />
                                        </span>
                                        <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white/20 opacity-40 group-hover:animate-shine" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </HeroBackground>
                </div>
            ))}
        </motion.div>

            {/* Navigation Arrows */}
            <div className="absolute hidden md:flex inset-x-0 md:inset-auto md:bottom-10 md:right-10 top-1/2 -translate-y-1/2 md:translate-y-0 z-50 justify-between md:justify-end px-0 md:gap-4 pointer-events-none">
                <button 
                    onClick={prevSlide}
                    className="p-2 md:p-4 bg-transparent md:bg-white/5 hover:bg-blue-600 md:border-white/10 hover:border-blue-600 rounded-full text-white transition-all duration-300 md:backdrop-blur-md group pointer-events-auto shadow-2xl"
                >
                    <ChevronLeft size={24} className="md:w-6 md:h-6 group-hover:-translate-x-1 transition-transform" />
                </button>
                <button 
                    onClick={nextSlide}
                    className="p-2 md:p-4 bg-transparent md:bg-white/5 hover:bg-blue-600 md:border-white/10 hover:border-blue-600 rounded-full text-white transition-all duration-300 md:backdrop-blur-md group pointer-events-auto shadow-2xl"
                >
                    <ChevronRight size={24} className="md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            {/* Pagination Indicators */}
            <div className="absolute bottom-12 left-6 lg:left-12 z-30 flex gap-3">
                {SLIDES.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`h-1.5 transition-all duration-500 rounded-full ${
                            index === currentSlide ? 'w-16 bg-blue-500' : 'w-4 bg-white/20 hover:bg-white/40'
                        }`}
                    />
                ))}
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes shine {
                    100% {
                        left: 125%;
                    }
                }
                .group:hover .animate-shine {
                    animation: shine 0.8s forwards;
                }
            ` }} />
        </section>
    );
};

export default HeroSlider;
