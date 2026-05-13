import React from 'react';
import { 
    BadgeCheck, 
    Truck, 
    ShieldCheck, 
    MessageCircle, 
    Lock 
} from 'lucide-react';

/**
 * UniqueSellingProposition Component
 * Showcases the key benefits of Fayyfir Shop in a premium grid layout.
 * Now updated with 5 key features: Original, Fast Shipping, Warranty, WhatsApp Support, and Secure Payment.
 */
const UniqueSellingProposition = () => {
    const features = [
        {
            icon: <BadgeCheck className="w-8 h-8 text-amber-500" />,
            title: "Produk Original",
            description: "Jaminan keaslian 100% untuk semua produk yang kami sediakan."
        },
        {
            icon: <Truck className="w-8 h-8 text-amber-500" />,
            title: "Pengiriman Cepat",
            description: "Layanan pengiriman prioritas yang aman dan sampai tepat waktu."
        },
        {
            icon: <ShieldCheck className="w-8 h-8 text-amber-500" />,
            title: "Garansi",
            description: "Kepuasan pelanggan adalah prioritas kami dengan jaminan retur."
        },
        {
            icon: <MessageCircle className="w-8 h-8 text-amber-500" />,
            title: "Support WhatsApp",
            description: "Layanan bantuan pelanggan siap membantu Anda melalui WhatsApp."
        },
        {
            icon: <Lock className="w-8 h-8 text-amber-500" />,
            title: "Pembayaran Aman",
            description: "Berbagai pilihan metode pembayaran yang terenkripsi dan aman."
        }
    ];

    return (
        <section className="bg-zinc-950 border-y border-white/5 py-16 px-6">
            <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-4">
                {features.map((feature, index) => (
                    <div key={index} className="flex flex-col items-center text-center space-y-4 group">
                        <div className="w-16 h-16 bg-amber-500/5 flex items-center justify-center rounded-2xl border border-white/5 transition-all duration-300 group-hover:scale-110 group-hover:bg-amber-500/10 group-hover:border-amber-500/20 shadow-lg shadow-black/20">
                            {feature.icon}
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-white text-sm md:text-base font-['Amiri'] font-bold tracking-wide">
                                {feature.title}
                            </h3>
                            <p className="text-zinc-500 text-[10px] md:text-xs leading-relaxed max-w-[150px] mx-auto">
                                {feature.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default UniqueSellingProposition;
