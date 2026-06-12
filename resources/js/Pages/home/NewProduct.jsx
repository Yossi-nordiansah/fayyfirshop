import React from "react";
import ProductCard from "@/Components/home/HomeCard";
import SlickSlider from "@/Components/home/SlickSlider";
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
const NewProduct = ({ products = [] }) => {
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
        <section className="bg-transparent pt-6 pb-8 px-2 overflow-hidden">
            <div className="max-w-7xl mx-auto">
                {/* Section Header */}
                <div className="mb-3 text-center md:text-left px-8">
                    <span className="mb-4 text-blue-600 text-xs font-bold tracking-[0.4em] uppercase block mb-2">
                        {t("nav.latest_collection", "Koleksi Terkini")}
                    </span>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl text-zinc-900 font-['Amiri'] font-bold">
                        {t("nav.new_arrivals", "Produk Terbaru")}
                    </h2>
                    <div className="w-16 h-1 bg-blue-500 mt-4 mx-auto md:mx-0 rounded-full" />
                </div>

                {/* Products Grid or Slider */}
                <div className="product-slider -mx-2">
                    {useSlider ? (
                        <SlickSlider>
                            {products.map((product) => (
                                <div key={product.id} className="md:px-2 px-0">
                                    <ProductCard
                                        slug={product.slug}
                                        title={product.name_translations?.[locale] || product.title}
                                        price={product.price}
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:px-16 px-8 max-w-7xl mx-auto">
                            {products.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    slug={product.slug}
                                    title={product.name_translations?.[locale] || product.title}
                                    price={product.price}
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

export default NewProduct;
