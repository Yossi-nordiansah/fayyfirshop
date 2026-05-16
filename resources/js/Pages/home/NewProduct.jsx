import React from "react";
import ProductCard from "@/Components/home/HomeCard";
import SlickSlider from "@/Components/home/SlickSlider";
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
    // Sample product data
    const products = [
        {
            id: 1,
            title: "Oud Al-Fayyfir Premium",
            price: 350000,
            sold: 120,
            image: "/storage/images/product/1623396841.jpg",
            status: "new",
            rating: 4.5,
        },
        {
            id: 2,
            title: "Sidr Honey Raw 500g",
            price: 175000,
            sold: 85,
            image: "/storage/images/product/1623396975.jpg",
            status: "new",
            rating: 4.5,
        },
        {
            id: 3,
            title: "Negin Saffron Super",
            price: 250000,
            sold: 45,
            image: "/storage/images/product/1623421142.jpg",
            status: "new",
            rating: 5,
        },
        {
            id: 4,
            title: "Ajwa Al-Madinah",
            price: 250000,
            sold: 210,
            image: "/storage/images/product/1623421666.jpg",
            status: "new",
            rating: 5,
        },
        {
            id: 5,
            title: "Arabic Coffee Spiced",
            price: 95000,
            sold: 67,
            image: "/storage/images/product/1625733742.jpg",
            status: "new",
            rating: 0,
        },
        {
            id: 6,
            title: "Premium Attar Oil",
            price: 85000,
            sold: 92,
            image: "/storage/images/product/1625733909.jpg",
            status: "new",
            rating: 1,
        },
    ];

    return (
        <section className="bg-transparent pt-6 pb-8 px-2 overflow-hidden bg-red-500">
            <div className="max-w-7xl mx-auto">
                {/* Section Header */}
                <div className="mb-3 text-center md:text-left px-8">
                    <span className="mb-4 text-blue-600 text-xs font-bold tracking-[0.4em] uppercase font-['Cinzel'] block mb-2">
                        {t("nav.latest_collection", "Koleksi Terkini")}
                    </span>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl text-zinc-900 font-['Amiri'] font-bold">
                        {t("nav.new_arrivals", "Produk Terbaru")}
                    </h2>
                    <div className="w-16 h-1 bg-blue-500 mt-4 mx-auto md:mx-0 rounded-full" />
                </div>

                {/* React Slick Slider */}
                <div className="product-slider -mx-2">
                    <SlickSlider>
                        {products.map((product) => (
                            <ProductCard
                                title={product.title}
                                price={product.price}
                                sold={product.sold}
                                image={product.image}
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
