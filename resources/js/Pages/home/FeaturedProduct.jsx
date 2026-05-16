import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/Contexts/LanguageContext";
import { ShoppingBag, ShieldCheck, Sparkles, Award } from "lucide-react";

export default function FeaturedProduct() {
    const { t } = useLanguage();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.2, delayChildren: 0.1 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: "spring", stiffness: 100, damping: 20 },
        },
    };

    return (
        <section className="relative w-full min-h-[80vh] md:max-h-[80vh] flex items-center justify-start overflow-hidden bg-amber-950/20">
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover lg:bg-bottom md:bg-bottom-right bg-[position:80%_center] bg-no-repeat"
                style={{
                    backgroundImage: `url('/images/featured-product/bg-featured-product.png')`, // Sesuaikan dengan path asset Anda
                }}
            />
            {/* Premium Overlay (Gelap di kiri ke transparan di kanan untuk estetika sinematik) */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent md:bg-gradient-to-r" />
            <div className="absolute inset-0 bg-black/30 md:hidden" />{" "}
            {/* Extra dark overlay untuk mobile */}
            {/* Content Container */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-24 w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Teks & Deskripsi Kiri */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="flex flex-col space-y-6 text-white max-w-xl"
                >
                    {/* Badge Atas */}
                    <motion.div
                        variants={itemVariants}
                        className="inline-flex items-center space-x-2 bg-amber-500/20 border border-amber-500/40 backdrop-blur-md px-3 py-1 rounded-full w-fit"
                    >
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-semibold tracking-wider uppercase text-amber-300">
                            {t("featured.badge", "Special Premium Product")}
                        </span>
                    </motion.div>

                    {/* Judul & Caption */}
                    <div className="space-y-3">
                        <motion.h2
                            variants={itemVariants}
                            className="text-3xl md:text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200"
                        >
                            {t("featured.title", "Alsharif Pure Honey Marai")}
                        </motion.h2>
                        <motion.p
                            variants={itemVariants}
                            className="text-sm md:text-base text-gray-300 leading-relaxed font-light"
                        >
                            {t(
                                "featured.caption",
                                "Rasakan kemurnian madu Marai otentik yang dipanen langsung dari nektar bunga pilihan di lembah subur Timur Tengah. Menghadirkan kualitas premium nan kaya manfaat untuk gaya hidup sehat keluarga Anda.",
                            )}
                        </motion.p>
                    </div>

                    {/* Fitur / Keunggulan Produk */}
                    <motion.div
                        variants={itemVariants}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2"
                    >
                        {/* Keunggulan 1 */}
                        <div className="flex items-start space-x-3">
                            <div className="p-2 bg-blue-950/40 border border-amber-500/30 rounded-lg text-amber-400 backdrop-blur-sm">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-amber-200">
                                    {t(
                                        "featured.feat1.title",
                                        "100% Organik & Murni",
                                    )}
                                </h4>
                                <p className="text-xs text-gray-400">
                                    {t(
                                        "featured.feat1.desc",
                                        "Tanpa pemanis buatan maupun bahan pengawet.",
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Keunggulan 2 */}
                        <div className="flex items-start space-x-3">
                            <div className="p-2 bg-blue-950/40 border border-amber-500/30 rounded-lg text-amber-400 backdrop-blur-sm">
                                <Award className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-amber-200">
                                    {t(
                                        "featured.feat2.title",
                                        "Kualitas Ekstra Premium",
                                    )}
                                </h4>
                                <p className="text-xs text-gray-400">
                                    {t(
                                        "featured.feat2.desc",
                                        "Melalui proses kurasi ketat standar ekspor.",
                                    )}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Tombol Cetak / Buy Now */}
                    <motion.div variants={itemVariants} className="pt-4">
                        <button className="group relative inline-flex items-center justify-center px-8 py-3.5 font-medium tracking-wide text-blue-950 transition-all duration-300 ease-in-out bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 rounded-xl shadow-[0_4px_20px_rgba(245,158,11,0.3)] hover:shadow-[0_4px_25px_rgba(245,158,11,0.5)] hover:scale-[1.02] active:scale-[0.98] overflow-hidden">
                            {/* Efek kilauan internal (shimmer effect) */}
                            <span
                                className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-shimmer"
                                style={{ animationDuration: "1.5s" }}
                            />

                            <ShoppingBag className="w-5 h-5 mr-2 transition-transform group-hover:-translate-y-0.5 group-hover:scale-110" />
                            <span className="font-bold text-sm md:text-base">
                                {t("featured.btn.buy", "Beli Sekarang")}
                            </span>
                        </button>
                    </motion.div>
                </motion.div>

                {/* Kolom Kanan dikosongkan secara strategis agar botol madu di background kanan tidak tertutup teks */}
                <div className="hidden md:block" />
            </div>
        </section>
    );
}
