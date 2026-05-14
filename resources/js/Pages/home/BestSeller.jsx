import React from 'react';
import ProductCard from '@/Components/home/HomeCard';
import SlickSlider from '@/Components/home/SlickSlider';
import { Flame } from 'lucide-react';

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
        { id: 1, title: "Oud Al-Fayyfir Premium", sold: 120, image: "/images/products/oud-oil.png", status: 'best-seller', rating: 0 },
        { id: 2, title: "Sidr Honey Raw 500g", sold: 85, image: "/images/products/sidr-honey.png", status: 'best-seller', rating: 0 },
        { id: 3, title: "Negin Saffron Super", sold: 45, image: "/images/hero/honey.png", status: 'best-seller', rating: 0 },
        { id: 4, title: "Ajwa Al-Madinah", sold: 210, image: "/images/hero/dates.png", status: 'best-seller', rating: 4.7 },
        { id: 5, title: "Arabic Coffee Spiced", sold: 67, image: "/images/hero/perfume.png", status: 'best-seller', rating: 4.6 },
        { id: 6, title: "Premium Attar Oil", sold: 92, image: "/images/products/oud-oil.png", status: 'best-seller', rating: 4.8 },
    ];

    return (
        <section className="bg-white pt-3 pb-8 px-2 overflow-hidden bg-red-500">
            <div className="max-w-7xl mx-auto">
                
                {/* Section Header */}
    <div className="flex items-center justify-center md:justify-start gap-2 mb-3 px-8">
        <span className="text-blue-600 text-xs font-bold tracking-[0.4em] uppercase font-['Cinzel']">
            Best Seller Product
        </span>
    </div>

    {/* Title */}
    <div className="flex items-center justify-center md:justify-start gap-4 px-8 mb-8">
        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <Flame
                size={20}
                className="text-blue-500 fill-blue-500"
            />
        </div>

        <h2 className="text-3xl md:text-4xl lg:text-5xl text-zinc-900 font-['Amiri'] font-bold">
            Best Seller
        </h2>
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
                                    status={product.status}
                                    rating={product.rating}
                                />
                        ))}
                    </SlickSlider>
                </div>
            </div>
        </section>
    );
};

export default NewProduct;
