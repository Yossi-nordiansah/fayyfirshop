import React from "react";
import ProductCard from "@/Components/home/HomeCard";
import SlickSlider from "@/Components/home/SlickSlider";
import { Flame } from "lucide-react";
import { useLanguage } from "@/Contexts/LanguageContext";
import { useIsMobile } from "@/Hooks/useIsMobile";

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
    const isMobile = useIsMobile();

    if (products.length === 0) return null;

    const getPrimaryImage = (product) => {
        if (!product.images || product.images.length === 0) return product.image;
        const primary = product.images.find(img => !!img.is_primary && img.is_primary !== '0' && img.is_primary !== 0);
        const target = primary || product.images[0];
        return target?.image_path ? `/storage/${target.image_path}` : product.image;
    };

    const useSlider = products.length > 4 || (isMobile && products.length > 1);

    return (
        <section className="bg-transparent mb-12 pt-12 pb-8 px-2 overflow-hidden">
            <div className="max-w-7xl 2xl:max-w-none mx-auto">
                {/* Section Header */}
                <div className="flex items-center justify-center md:justify-start gap-2 mb-3 px-8">
                    <span className="text-blue-600 text-xs font-bold tracking-[0.4em] uppercase">
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
                                <div key={product.id} className="md:px-2 px-0">
                                    <ProductCard
                                        id={product.id}
                                        product={product}
                                        slug={product.slug}
                                        title={product.name_translations?.[locale] || product.title}
                                        price={product.price}
                                        discount_price={product.discount_price}
                                        variants={product.variants}
                                        sold={product.sold}
                                        image={getPrimaryImage(product)}
                                        status={product.status}
                                        is_new={product.is_new}
                                        is_best_seller={product.is_best_seller}
                                        rating={Number(product.rating || 0)}
                                    />
                                </div>
                            ))}
                        </SlickSlider>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:px-16 px-8 max-w-7xl 2xl:max-w-none mx-auto">
                            {products.map((product) => (
                                <ProductCard
                                    id={product.id}
                                    product={product}
                                    slug={product.slug}
                                    title={product.name_translations?.[locale] || product.title}
                                    price={product.price}
                                    discount_price={product.discount_price}
                                    variants={product.variants}
                                    sold={product.sold}
                                    image={getPrimaryImage(product)}
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
