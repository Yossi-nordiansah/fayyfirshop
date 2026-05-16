import React from "react";
import ProductCard from "@/Components/home/HomeCard";
import SlickSlider from "@/Components/home/SlickSlider";
import { Flame } from "lucide-react";
import { useLanguage } from "@/Contexts/LanguageContext";

// Import Slick Carousel CSS
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

/**
 * NewProduct Component
 * Displays a carousel of new arrivals using react-slick.
 * Showcases 4 products at a time on desktop with infinite looping.
 */
const NewProduct = () => {
    const { t } = useLanguage();

    const products = [
        {
            id: 1,
            title: "Oud Al-Fayyfir Premium",
            price: 350000,
            sold: 120,
            image: "/storage/images/product/1623396841.jpg",
            status: "best-seller",
            rating: 4.5,
        },
        {
            id: 2,
            title: "Sidr Honey Raw 500g",
            price: 175000,
            sold: 85,
            image: "/storage/images/product/1623396975.jpg",
            status: "best-seller",
            rating: 4.5,
        },
        {
            id: 3,
            title: "Negin Saffron Super",
            price: 250000,
            sold: 45,
            image: "/storage/images/product/1623421142.jpg",
            status: "best-seller",
            rating: 5,
        },
        {
            id: 4,
            title: "Ajwa Al-Madinah",
            price: 250000,
            sold: 210,
            image: "/storage/images/product/1623421666.jpg",
            status: "best-seller",
            rating: 5,
        },
        {
            id: 5,
            title: "Arabic Coffee Spiced",
            price: 95000,
            sold: 67,
            image: "/storage/images/product/1625733742.jpg",
            status: "best-seller",
            rating: 0,
        },
        {
            id: 6,
            title: "Premium Attar Oil",
            price: 85000,
            sold: 92,
            image: "/storage/images/product/1625733909.jpg",
            status: "best-seller",
            rating: 1,
        },
    ];

    return (
        <section className="bg-transparent mb-12 pt-3 pb-8 px-2 overflow-hidden bg-red-500">
            <div className="max-w-7xl mx-auto">
                {/* Section Header */}
                <div className="flex items-center justify-center md:justify-start gap-2 mb-3 px-8">
                    <span className="text-blue-600 text-xs font-bold tracking-[0.4em] uppercase font-['Cinzel']">
                        {t("home.bestseller.subtitle", "Best Seller Product")}{" "}
                        {/* Multi-language Subtitle[cite: 1] */}
                    </span>
                </div>

                {/* Title */}
                <div className="flex items-center justify-center md:justify-start gap-4 px-8 mb-4 pt-2">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <Flame
                            size={20}
                            className="text-blue-500 fill-blue-500"
                        />
                    </div>

                    <h2 className="text-3xl md:text-4xl lg:text-5xl text-zinc-900 font-['Amiri'] font-bold">
                        {t("home.bestseller.title", "Best Seller")}{" "}
                        {/* Multi-language Title[cite: 1] */}
                    </h2>
                </div>

                {/* React Slick Slider */}
                <div className="product-slider -mx-2">
                    <SlickSlider>
                        {products.map((product) => (
                            <ProductCard
                                key={product.id}
                                title={product.title}
                                sold={product.sold}
                                image={product.image}
                                status={product.status}
                                rating={product.rating}
                                price={product.price}
                            />
                        ))}
                    </SlickSlider>
                </div>
            </div>
        </section>
    );
};

export default NewProduct;
