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
        icon: <BadgeCheck className="w-8 h-8 text-white" />,
        title: "Original Products",
        description: "100% authenticity guaranteed for every product we provide."
    },
    {
        icon: <Truck className="w-8 h-8 text-white" />,
        title: "Fast Delivery",
        description: "Priority shipping service that is secure and delivered on time."
    },
    {
        icon: <ShieldCheck className="w-8 h-8 text-white" />,
        title: "Warranty Guarantee",
        description: "Customer satisfaction is our priority with return and warranty protection."
    },
    {
        icon: <MessageCircle className="w-8 h-8 text-white" />,
        title: "WhatsApp Support",
        description: "Our customer support team is ready to assist you through WhatsApp."
    },
    {
        icon: <Lock className="w-8 h-8 text-white" />,
        title: "Secure Payment",
        description: "Multiple encrypted and secure payment methods available."
    }
];

    return (
        <section className="bg-gradient-to-b from-blue-700 to-blue-800 border-y border-white/5 py-16 px-6">
            <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-4">
                {features.map((feature, index) => (
                    <div key={index} className="flex flex-col items-center text-center space-y-4 group">
                        <div className="w-16 h-16 bg-blue-600 flex items-center justify-center rounded-2xl border border-white/5 transition-all duration-300 group-hover:scale-110 group-hover:bg-blue-500/10 group-hover:border-white/20 shadow-lg shadow-black/20">
                            {feature.icon}
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-white text-sm md:text-base font-['Amiri'] font-bold tracking-wide">
                                {feature.title}
                            </h3>
                            <p className="text-white text-[10px] md:text-xs leading-relaxed max-w-[150px] mx-auto">
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
