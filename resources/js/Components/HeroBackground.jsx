import React from 'react';
import { motion } from 'framer-motion';

/**
 * HeroBackground Component
 * Provides a flexible, premium background for hero sections.
 * Features zoom effect, gradient overlays, and perfectly proportioned floating product image.
 */
const HeroBackground = ({ image, theme, isActive, children, productImage, className = "" }) => {
    return (
        <div className={`relative w-full h-full overflow-hidden bg-blue-950 ${className}`}>
            {/* 1. Base Background Image with Zoom Animation */}
            <motion.div
                initial={{ scale: 1 }}
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ duration: 10, ease: "linear" }}
                className="absolute inset-0"
            >
                <img
                    src={image}
                    alt="Hero Background"
                    className="w-full h-full object-cover"
                />

                {/* 2. Aesthetic Overlays */}
                <div className={`absolute inset-0 bg-gradient-to-r ${theme} from-blue-800/60 to-blue-400/20 transition-colors duration-1000`} />
                <div className="absolute inset-0 bg-black/40 backdrop-brightness-75" />
            </motion.div>

            {/* 3. Floating Product Image with Controlled Max Bounding Box */}
            {productImage && (
                <div className="absolute top-1/2 right-6 xl:right-16 2xl:right-24 -translate-y-1/2 z-20 hidden lg:flex items-center justify-center pointer-events-none w-[320px] xl:w-[380px] 2xl:w-[420px] h-[320px] xl:h-[380px] 2xl:h-[420px]">
                    <motion.div
                        initial={{ x: 50, opacity: 0 }}
                        animate={{
                            x: isActive ? 0 : 50,
                            opacity: isActive ? 1 : 0,
                            y: [0, -12, 0]
                        }}
                        transition={{
                            x: { duration: 1.2, delay: 0.5 },
                            opacity: { duration: 1.2, delay: 0.5 },
                            y: { repeat: Infinity, duration: 6, ease: "easeInOut" }
                        }}
                        className="w-full h-full flex items-center justify-center p-2"
                    >
                        <img
                            src={productImage}
                            alt="Product"
                            className="max-w-full max-h-full object-contain drop-shadow-[0_25px_30px_rgba(0,0,0,0.6)]"
                        />
                    </motion.div>
                </div>
            )}

            {/* 4. Content Slot */}
            <div className="relative z-30 w-full h-full">
                {children}
            </div>
        </div>
    );
};

export default HeroBackground;
