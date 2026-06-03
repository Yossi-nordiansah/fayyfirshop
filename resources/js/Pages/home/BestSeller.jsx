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
const BestSeller = ({ products = [] }) => {
    const { t, locale } = useLanguage();

    if (products.length === 0) return null;

    const useSlider = products.length > 4;

    return (
        <section className="bg-transparent mb-12 pt-3 pb-8 px-2 overflow-hidden">
            <div className="max-w-7xl mx-auto">
                {/* Section Header */}
                <div className="flex items-center justify-center md:justify-start gap-2 mb-3 px-8">
                    <span className="text-blue-600 text-xs font-bold tracking-[0.4em] uppercase font-['Cinzel']">
                        {t("home.bestseller.subtitle", "Best Seller Product")}{" "}
                        {/* Multi-language Subtitle */}
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
                        {/* Multi-language Title */}
                    </h2>
                </div>

                {/* Products Grid or Slider */}
                <div className="product-slider -mx-2">
                    {useSlider ? (
                        <SlickSlider>
                            {products.map((product) => (
                                <div key={product.id} className="md:px-2 px-4">
                                    <ProductCard
                                        slug={product.slug}
                                        title={product.name_translations?.[locale] || product.title}
                                        price={product.price}
                                        sold={product.sold}
                                        image={product.images?.[0]?.image_path ? `/storage/${product.images[0].image_path}` : product.image}
                                        status={product.status}
                                        is_new={product.is_new}
                                        is_best_seller={product.is_best_seller}
                                        rating={Number(product.rating || 0)}
                                    />
                                </div>
                            ))}
                        </SlickSlider>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-8 max-w-7xl mx-auto">
                            {products.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    slug={product.slug}
                                    title={product.name_translations?.[locale] || product.title}
                                    price={product.price}
                                    sold={product.sold}
                                    image={product.images?.[0]?.image_path ? `/storage/${product.images[0].image_path}` : product.image}
                                    status={product.status}
                                    is_new={product.is_new}
                                    is_best_seller={product.is_best_seller}
                                    rating={Number(product.rating || 0)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default BestSeller;
