import {
    ShoppingBag,
    ChevronLeft,
    ChevronRight,
    Leaf,
    Sparkles,
    Coffee,
    Droplets,
    Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/Contexts/LanguageContext';
import { useState, useCallback, useEffect } from 'react';
import { Link } from '@inertiajs/react';

/**
 * HeroSlider Component
 * Premium Middle Eastern aesthetic design for Fayyfir Shop.
 * Updated with Lucide React icons and Arabic-inspired typography.
 */

import HeroBackground from '@/Components/HeroBackground';

const HeroSlider = () => {
    const { t } = useLanguage();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    const SLIDES = [
        {
            id: 1,
            category: t('hero.perfume.category', 'Parfum Mewah'),
            title: t('hero.perfume.title', 'Simfoni Aroma'),
            subtitle: t('hero.perfume.subtitle', 'Eau de Parfum & Fragrance Spray'),
            description: t('hero.perfume.description', 'Koleksi wewangian premium dengan konsentrasi tinggi yang memikat, dirancang untuk memancarkan pesona sepanjang hari.'),
            image: "/images/hero/bg-perfume.webp",
            productImage: "/images/hero/Perfume-web-(1).webp",
            icon: <Sparkles size={24} />,
            theme: "from-blue-900/60",
            slug: "parfum"
        },
        {
            id: 2,
            category: t('hero.oil.category', 'Minyak Aromatik'),
            title: t('hero.oil.title', 'Kemurnian Alam'),
            subtitle: t('hero.oil.subtitle', 'Dehn Oud & Campuran Minyak Pilihan'),
            description: t('hero.oil.description', 'Tetesan kemurnian dari alam, memberikan ketenangan dan kepercayaan diri dengan aroma yang mendalam.'),
            image: "/images/hero/aromatic-oil2.webp",
            productImage: "/images/hero/Aromatic-Oil-web.webp",
            icon: <Droplets size={24} />,
            theme: "from-blue-800/60",
            slug: "minyak-aromatik"
        },
        {
            id: 3,
            category: t('hero.bakhoor.category', 'Bakhoor & Oud'),
            title: t('hero.bakhoor.title', 'Warisan Tradisi'),
            subtitle: t('hero.bakhoor.subtitle', 'Dupa Arab Tradisional & Kayu Oud'),
            description: t('hero.bakhoor.description', 'Ciptakan suasana hangat dan spiritual di rumah Anda dengan asap wangi dari tradisi Timur Tengah yang kaya.'),
            image: "/images/hero/bakhoor.webp",
            productImage: "/images/hero/Bukhur-web.webp",
            icon: <Flame size={24} />,
            theme: "from-amber-900/60",
            slug: "bakhoor-dan-oud"
        },
        {
            id: 4,
            category: t('hero.nutrition.category', 'Kesehatan & Nutrisi'),
            title: t('hero.nutrition.title', 'Kebaikan Terbaik'),
            subtitle: t('hero.nutrition.subtitle', 'Madu Sidr & Saffron Premium'),
            description: t('hero.nutrition.description', 'Nutrisi alami berkualitas tinggi untuk gaya hidup sehat Anda, langsung dari sumber terbaik di tanah Arab.'),
            image: "/images/hero/bg-honey.webp",
            productImage: "/images/hero/honey.webp",
            icon: <Leaf size={24} />,
            theme: "from-blue-900/60",
            slug: "kesehatan-dan-nutrisi"
        }
    ];

    const nextSlide = useCallback(() => {
        if (isAnimating) return;
        setIsAnimating(true);
        setCurrentSlide((prev) => (prev === SLIDES.length - 1 ? 0 : prev + 1));
        setTimeout(() => setIsAnimating(false), 800);
    }, [isAnimating, SLIDES.length]);

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
        <section id="hero-section" className="relative w-full h-screen lg:max-h-screen overflow-hidden bg-zinc-950 select-none">
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
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                            }`}
                    >
                        <HeroBackground
                            image={slide.image}
                            productImage={slide.productImage}
                            theme={slide.theme}
                            isActive={index === currentSlide}
                        >
                            {/* Content Area */}
                            <div className="h-full w-full mx-auto px-6 lg:px-14 xl:px-20 2xl:px-32 flex flex-col justify-center items-start text-white">
                                <div className={`max-w-3xl 2xl:max-w-5xl lg:mx-0 mx-auto md:space-y-4 space-y-2 transition-all duration-700 transform ${index === currentSlide ? 'translate-y-0 opacity-100 delay-300' : 'translate-y-10 opacity-0'
                                    }`}>

                                    {/* Category Badge */}
                                    <div className="flex items-center gap-2 lg:mx-0 mx-auto px-4 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-full w-fit backdrop-blur-md">
                                        <span className="text-white">{slide.icon}</span>
                                        <span className="text-white text-xs font-bold tracking-[0.3em] uppercase">
                                            {slide.category}
                                        </span>
                                    </div>

                                    <div className="lg:hidden block py-4">
                                        <img
                                            src={slide.productImage}
                                            alt={slide.title}
                                            className={`${slide.productImage?.includes('Perfume') ? 'w-40 md:w-64' : slide.productImage?.includes('honey') ? 'w-36 md:w-64' : 'w-48 md:w-96'} mx-auto drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)] animate-floating`}
                                        />
                                    </div>

                                    {/* Main Heading */}
                                    <h1 className="text-xl md:text-3xl lg:text-3xl xl:text-5xl 2xl:text-7xl font-['Amiri'] lg:text-left text-center font-bold leading-tight">
                                        {slide.title}
                                        <span className="block text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl text-white mt-4 font-normal italic opacity-90 font-serif">
                                            {slide.subtitle}
                                        </span>
                                    </h1>

                                    {/* Description */}
                                    <p className="lg:text-left text-center text-zinc-300 text-sm md:text-xl xl:text-xl max-w-xl 2xl:text-2xl 2xl:max-w-3xl leading-relaxed font-light">
                                        {slide.description}
                                    </p>

                                    {/* CTA Button */}
                                    <div className="pt-6 md:pt-10">
                                        <Link
                                            href={`/products/${slide.slug}`}
                                            className="lg:mx-0 mx-auto flex px-5 py-4 group relative items-center gap-4 lg:px-10 lg:py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-sm transition-all duration-500 shadow-2xl shadow-blue-900/40 overflow-hidden w-fit"
                                        >
                                            <span className="relative z-10 tracking-[0.2em] uppercase text-sm">
                                                {t('hero.explore', 'Jelajahi Koleksi')}
                                            </span>
                                            <span className="relative z-10 transition-transform group-hover:translate-x-1">
                                                <ShoppingBag size={20} />
                                            </span>
                                            <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white/20 opacity-40 group-hover:animate-shine" />
                                        </Link>
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
                        className={`h-1.5 transition-all duration-500 rounded-full ${index === currentSlide ? 'w-16 bg-blue-500' : 'w-4 bg-white/20 hover:bg-white/40'
                            }`}
                    />
                ))}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
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
