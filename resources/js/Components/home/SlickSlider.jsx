import React, { useState, useEffect } from "react";
import Slider from "react-slick";
import ProductCard from "@/Components/home/HomeCard";

// Import Slick Carousel CSS
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

/**
 * Hook untuk mendapatkan jumlah slide yang harus ditampilkan
 * berdasarkan lebar window yang sesungguhnya (window.innerWidth).
 * Ini memaksa React re-render saat window di-resize,
 * sehingga react-slick selalu mendapatkan ukuran yang tepat.
 */
function useSlidesToShow() {
    const getSlides = () => {
        if (typeof window === "undefined") return 4;
        const w = window.innerWidth;
        if (w <= 480) return 2;
        if (w <= 768) return 2;
        if (w <= 1024) return 2;
        return 4;
    };

    const [slidesToShow, setSlidesToShow] = useState(getSlides);

    useEffect(() => {
        const handleResize = () => setSlidesToShow(getSlides());
        window.addEventListener("resize", handleResize);
        // Jalankan sekali saat mount untuk memastikan nilai awal benar
        handleResize();
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return slidesToShow;
}

/**
 * SlickSlider Component
 * Displays a carousel using react-slick.
 * Showcases 4 products at a time on desktop with infinite looping.
 *
 * Catatan: Menggunakan useSlidesToShow() karena react-slick mendeteksi
 * breakpoint dari window.innerWidth, bukan dari CSS media query.
 * Extension mobile simulator hanya men-scale CSS sehingga window.innerWidth
 * tetap ukuran desktop. Hook ini memaksa re-render agar slider selalu benar.
 */
const SlickSlider = ({ children }) => {
    const slidesToShow = useSlidesToShow();

    const settings = {
        dots: true,
        infinite: true,
        speed: 600,
        slidesToShow: slidesToShow,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 4000,
        pauseOnHover: true,
        // Sembunyikan arrow di mobile
        arrows: slidesToShow > 1,
        // Responsive tetap disertakan sebagai fallback
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1,
                    arrows: true,
                },
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1,
                    centerMode: false,
                    arrows: false,
                },
            },
            {
                breakpoint: 480,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1,
                    centerMode: false,
                    arrows: false,
                },
            },
        ],
    };

    return (
        <section className="bg-transparent pb-2 md:px-8 px-0 lg:px-16">
            {/* React Slick Slider */}
            <div className="product-slider">
                <Slider {...settings}>{children}</Slider>
            </div>

            {/* Custom Styles for Slick Pagination and Arrows */}
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                .product-slider .slick-dots {
                    bottom: -10px;
                }
                .product-slider .slick-dots li button:before {
                    color: #949494ff;
                    font-size: 10px;
                    transition: all 0.3s ease;
                }
                .product-slider .slick-dots li.slick-active button:before {
                    color: #2a22fbff;
                    font-size: 12px;
                }
                .product-slider .slick-prev, .product-slider .slick-next {
                    z-index: 20;
                    width: 30px;
                    height: 30px;
                    background: transparent;
                    border-radius: 50%;
                    transition: all 0.3s ease;
                }
                .product-slider .slick-prev:hover, .product-slider .slick-next:hover {
                    background: #2a22fbff;
                }
                .product-slider .slick-prev:before, .product-slider .slick-next:before {
                    color: #18181b;
                    font-size: 20px;
                }
                .product-slider .slick-prev:hover:before, .product-slider .slick-next:hover:before {
                    color: white;
                }
                .product-slider .slick-prev { left: -30px; }
                .product-slider .slick-next { right: -30px; }
                
                @media (max-width: 768px) {
                    .product-slider .slick-prev, .product-slider .slick-next {
                        display: none !important;
                    }
                }
            `,
                }}
            />
        </section>
    );
};

export default SlickSlider;
