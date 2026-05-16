import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/Contexts/LanguageContext";
import SlickSlider from "@/Components/home/SlickSlider";
import { Star, Quote, BadgeCheck } from "lucide-react";

const CustomerRating = () => {
    const { t } = useLanguage();

    // Data ulasan pelanggan premium (Sudah diperbaiki dari duplikasi)
    const reviews = [
        {
            id: 1,
            name: "Abdullah Mansur",
            role: t("rating.verified", "Verified Buyer"),
            avatar: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Bahlil_Lahadalia_HIPMI.jpg",
            rating: 5,
            comment: t(
                "rating.review1.text",
                "The Oud Al-Fayyfir Premium scent is deeply luxurious and stays all day long.",
            ),
        },
        {
            id: 2,
            name: "Siti Rahma",
            role: t("rating.verified", "Verified Buyer"),
            avatar: "https://www.obsessionnews.com/uploads/media/2025/02/03/012-ca7e79.jpeg",
            rating: 5,
            comment: t(
                "rating.review2.text",
                "The purest Sidr Honey quality I have ever purchased. Authentic texture and rich original taste.",
            ),
        },
        {
            id: 3,
            name: "Faisal Karim",
            role: t("rating.verified", "Verified Buyer"),
            avatar: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Bahlil_Lahadalia_at_the_Indonesia_Naik_Kelas_book_launching%2C_21_November_2025_24_%28cropped%29.jpg/250px-Bahlil_Lahadalia_at_the_Indonesia_Naik_Kelas_book_launching%2C_21_November_2025_24_%28cropped%29.jpg",
            rating: 5,
            comment: t(
                "rating.review3.text",
                "Ajwa Al-Madinah dates are incredibly soft and perfectly sweet. Highly recommended.",
            ),
        },
        {
            id: 4,
            name: "Dr. Amira Ahmad",
            role: t("rating.verified", "Verified Buyer"),
            avatar: "https://sultranesia.com/wp-content/uploads/2025/09/67c6a70245c01.jpg",
            rating: 4,
            comment: t(
                "rating.review4.text",
                "Their super negin saffron truly boosts my physical stamina. Rich natural color.",
            ),
        },
        {
            id: 5,
            name: "Ahmed Al-Fahim",
            role: t("rating.verified", "Verified Buyer"),
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
            rating: 5,
            comment: t(
                "rating.review5.text",
                "Extremely satisfied with the lightning-fast shipping and luxury packaging of Fayyfir Shop!",
            ),
        },
    ];

    return (
        <section className="bg-transparent pb-14 pt-4 px-2 overflow-hidden">
            <div className="max-w-7xl mx-auto">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-5 space-y-2">
                    <span className="text-blue-600 text-xs font-bold uppercase font-['Cinzel'] block tracking-[0.4em]">
                        {t("rating.subtitle", "Customer Testimonials")}
                    </span>
                    <h2 className="text-3xl md:text-4xl text-zinc-900 font-['Amiri'] font-bold tracking-wide">
                        {t("rating.title", "What They Say About Us")}
                    </h2>
                    <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mt-3" />
                </div>

                {/* Integration with SlickSlider */}
                <div className="px-4">
                    <SlickSlider>
                        {reviews.map((review) => (
                            <div key={review.id} className="px-3 py-4">
                                <motion.div
                                    whileHover={{ y: -6, scale: 1.01 }}
                                    className="bg-slate-100 rounded-2xl border border-zinc-100 p-6 shadow-lg relative flex flex-col justify-between h-[260px] group transition-all duration-300"
                                >
                                    {/* Quote Icon Background Accent */}
                                    <Quote className="absolute right-6 top-6 text-zinc-100 group-hover:text-amber-500/10 transition-colors duration-300 w-10 h-10 -scale-x-100" />

                                    <div className="space-y-4">
                                        {/* Render Bintang Dinamik */}
                                        <div className="flex items-center gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={16}
                                                    className={`${
                                                        i < review.rating
                                                            ? "text-amber-400 fill-amber-400"
                                                            : "text-zinc-200"
                                                    }`}
                                                />
                                            ))}
                                        </div>

                                        {/* Ulasan Teks */}
                                        <p className="text-xs text-zinc-600 font-medium font-sans leading-relaxed line-clamp-5">
                                            "{review.comment}"
                                        </p>
                                    </div>

                                    {/* Identitas Pelanggan (Footer Card) */}
                                    <div className="flex items-center gap-3 pt-4 border-t border-zinc-50 mt-auto">
                                        <img
                                            src={review.avatar}
                                            alt={review.name}
                                            className="w-10 h-10 rounded-full object-cover ring-2 ring-zinc-100 group-hover:ring-amber-500/20 transition-all duration-300"
                                        />
                                        <div className="overflow-hidden">
                                            <h4 className="text-xs font-bold text-zinc-800 font-sans truncate">
                                                {review.name}
                                            </h4>
                                            <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                                                <BadgeCheck
                                                    size={12}
                                                    className="fill-emerald-500 text-white"
                                                />
                                                <span className="tracking-wide">
                                                    {review.role}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        ))}
                    </SlickSlider>
                </div>
            </div>
        </section>
    );
};

export default CustomerRating;
