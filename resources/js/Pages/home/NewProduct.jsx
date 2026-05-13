import React from 'react';
import ProductCard from '@/Components/home/HomeCard';
import SlickSlider from '@/Components/home/SlickSlider';

// Import Slick Carousel CSS
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

/**
 * NewProduct Component
 * Displays a carousel of new arrivals using react-slick.
 * Showcases 4 products at a time on desktop with infinite looping.
 */
const NewProduct = () => {
    // Sample product data
    const products = [
        { id: 1, title: "Oud Al-Fayyfir Premium", sold: 120, image: "/images/products/oud-oil.png", isNew: true },
        { id: 2, title: "Sidr Honey Raw 500g", sold: 85, image: "/images/products/sidr-honey.png", isNew: true },
        { id: 3, title: "Negin Saffron Super", sold: 45, image: "/images/hero/honey.png", isNew: true },
        { id: 4, title: "Ajwa Al-Madinah", sold: 210, image: "/images/hero/dates.png", isNew: true },
        { id: 5, title: "Arabic Coffee Spiced", sold: 67, image: "/images/hero/perfume.png", isNew: true },
        { id: 6, title: "Premium Attar Oil", sold: 92, image: "/images/products/oud-oil.png", isNew: true },
    ];

    // Carousel settings
    const settings = {
        dots: true,
        infinite: true,
        speed: 600,
        slidesToShow: 4,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 4000,
        pauseOnHover: true,
        arrows: true,
        responsive: [
            {
                breakpoint: 1280,
                settings: {
                    slidesToShow: 4,
                }
            },
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 3,
                }
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 2,
                }
            },
            {
                breakpoint: 480,
                settings: {
                    slidesToShow: 1,
                    centerMode: true,
                    centerPadding: '20px',
                }
            }
        ]
    };

    return (
        <section className="bg-white pt-6 pb-8 px-2 overflow-hidden bg-red-500">
            <div className="max-w-7xl mx-auto">
                
                {/* Section Header */}
                <div className="mb-6 text-center md:text-left">
                    <span className="text-amber-600 text-xs font-bold tracking-[0.4em] uppercase font-['Cinzel'] block mb-2">
                        Latest Collection
                    </span>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl text-zinc-900 font-['Amiri'] font-bold">
                        New Arrivals
                    </h2>
                    <div className="w-16 h-1 bg-amber-500 mt-4 mx-auto md:mx-0 rounded-full" />
                </div>

                {/* React Slick Slider */}
                <div className="product-slider -mx-2">
                    <SlickSlider>
                        {products.map((product) => (
                                <ProductCard
                                    title={product.title}
                                    sold={product.sold}
                                    image={product.image}
                                    isNew={product.isNew}
                                />
                        ))}
                    </SlickSlider>
                </div>
            </div>
        </section>
    );
};

export default NewProduct;
