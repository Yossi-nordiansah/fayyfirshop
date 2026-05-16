import React from "react";
import Slider from "react-slick";
import ProductCard from "@/Components/home/HomeCard";

// Import Slick Carousel CSS
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

/**
 * NewProduct Component
 * Displays a carousel of new arrivals using react-slick.
 * Showcases 4 products at a time on desktop with infinite looping.
 */
const SlickSlider = ({ children }) => {
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
                },
            },
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 3,
                },
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 2,
                },
            },
            {
                breakpoint: 480,
                settings: {
                    slidesToShow: 1,
                    centerMode: true,
                    centerPadding: "7px",
                },
            },
        ],
    };

    return (
        <section className="bg-transparent pb-2 px-8 lg:px-12">
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
