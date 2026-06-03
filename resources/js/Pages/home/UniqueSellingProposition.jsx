import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/Contexts/LanguageContext";
import { Truck, Leaf, CreditCard } from "lucide-react";
// import whatsapp from "/images/icons/whatsapp-icon.svg";

/**
 * UniqueSellingProposition (USP) Section Component
 * Fayyfir Shop Premium Design Standard
 */
const UniqueSellingProposition = () => {
    const { t } = useLanguage();

    // Memetakan data USP lengkap dengan Icon Lucide dan Lokalisasi Flat JSON
    // Sila tambahkan properti 'bgImage' sesuai jalur gambar masing-masing kartu Anda
    const usps = [
        {
            id: "natural",
            icon: Leaf,
            title: t("usp.item4.title", "Natural Product"),
            desc: t(
                "usp.item4.desc",
                "Selected from pure, highest-quality natural ingredients.",
            ),
            color: "from-teal-400 to-teal-600",
            bgImage: "/images/ups/natural.jpg", // Jalur berkas gambar Anda
        },
        {
            id: "delivery",
            icon: Truck,
            title: t("usp.item2.title", "Fast Delivery"),
            desc: t(
                "usp.item2.desc",
                "Priority logistics system ensuring your orders arrive swiftly.",
            ),
            color: "from-blue-500 to-indigo-600",
            bgImage: "/images/ups/delivery.jpg", // Jalur berkas gambar Anda
        },
        {
            id: "whatsapp",
            icon: "/images/icons/whatsappicon.svg",
            title: t("usp.item3.title", "WhatsApp Support"),
            desc: t(
                "usp.item3.desc",
                "Exclusive customer concierge ready to assist you anytime.",
            ),
            color: "from-emerald-400 to-emerald-600",
            bgImage: "/images/ups/chatting.jpg", // Jalur berkas gambar Anda
        },
        {
            id: "payment",
            icon: CreditCard,
            title: t("usp.item5.title", "Secure Payment"),
            desc: t(
                "usp.item5.desc",
                "Fully encrypted digital gateways for ultimate peace of mind.",
            ),
            color: "from-cyan-500 to-blue-600",
            bgImage: "/images/ups/payment.jpg", // Jalur berkas gambar Anda
        },
    ];

    // Animasi Stagger untuk Container Kartu
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
            },
        },
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        show: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: "easeOut" },
        },
    };

    return (
        <section className="bg-transparent py-12 sm:px-6 lg:px-8 border-t border-zinc-100 overflow-hidden">
            <div className="max-w-7xl mx-auto">
                {/* USP Grid Layout */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-100px" }}
                    className="md:px-16 px-4 grid grid-cols-1 lg:grid-cols-2 gap-6 justify-center"
                >
                    {usps.map((usp, index) => {
                        const IconComponent = usp.icon;

                        return (
                            <motion.div
                                key={usp.id}
                                variants={cardVariants}
                                whileHover={{ scale: 1.02, y: -4 }}
                                style={{
                                    backgroundImage: `url(${usp.bgImage})`,
                                }} // Menyisipkan gambar latar belakang secara dinamis
                                className={`relative p-6 rounded-2xl bg-cover bg-center border border-zinc-100 shadow-xl transition-all duration-300 flex flex-col items-center text-center group overflow-hidden
                                    ${index === 4 ? "sm:col-span-2 lg:col-span-1 lg:col-start-2" : ""}
                                `}
                            >
                                {/* Lapisan Overlay Gelap (Mencegah teks tabrakan dengan warna gambar) */}
                                <div className="absolute inset-0 bg-black/60 group-hover:bg-black/50 transition-colors duration-300 z-0" />

                                {/* Konten Utama dibungkus indeks z agar berada di atas lapisan overlay */}
                                <div className="relative z-10 flex flex-col items-center">
                                    {/* Premium Icon Badge */}
                                    <div
                                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${usp.color} flex items-center justify-center text-white shadow-md shadow-zinc-200/50 mb-5 group-hover:rotate-6 transition-transform duration-300`}
                                    >
                                        {typeof usp.icon === "string" ? (
                                            <img
                                                src={usp.icon}
                                                alt={usp.title}
                                                className="w-7 h-7 object-contain brightness-0 invert"
                                            />
                                        ) : (
                                            <IconComponent
                                                size={26}
                                                strokeWidth={1.75}
                                            />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="space-y-1.5">
                                        {/* Mengubah warna teks menjadi putih (atau varian zinc terang) agar terbaca jelas di atas gambar gelap */}
                                        <h3 className="text-base font-bold font-sans text-amber-400">
                                            {usp.title}
                                        </h3>
                                        <p className="text-xs text-zinc-200 font-medium leading-relaxed max-w-[250px] mx-auto">
                                            {usp.desc}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
};

export default UniqueSellingProposition;
