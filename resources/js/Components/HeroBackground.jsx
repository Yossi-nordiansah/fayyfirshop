import React from 'react';
import { motion } from 'framer-motion';

/**
 * HeroBackground Component
 * Provides a flexible, premium background for hero sections.
 * Features zoom effect, gradient overlays, and glassmorphism support.
 */
const HeroBackground = ({ image, theme, isActive, children, productImage, className = "" }) => {
    return (
        <div className={`relative w-full h-full overflow-hidden bg-zinc-950 ${className}`}>
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
                <div className={`absolute inset-0 bg-gradient-to-r ${theme} via-zinc-950/60 to-zinc-950/20 transition-colors duration-1000`} />
                <div className="absolute inset-0 bg-black/40 backdrop-brightness-75" />
            </motion.div>

            {/* 3. Floating Product Image (Optional) */}
            {productImage && (
                <motion.div
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ 
                        x: isActive ? 0 : 50, 
                        opacity: isActive ? 1 : 0,
                        y: [0, -15, 0] 
                    }}
                    transition={{ 
                        x: { duration: 1.2, delay: 0.5 },
                        opacity: { duration: 1.2, delay: 0.5 },
                        y: { repeat: Infinity, duration: 6, ease: "easeInOut" }
                    }}
                    className="absolute hidden right-[10%] bottom-32 -translate-y-1/2 z-20 hidden md:block w-1/3"
                >
                    <img
                        src={productImage}
                        alt="Product"
                        className="lg:block hidden lg:w-96 drop-shadow-[0_35px_35px_rgba(0,0,0,0.6)]"
                    />
                </motion.div>
            )}

            {/* 4. Content Slot */}
            <div className="relative z-30 w-full h-full">
                {children}
            </div>
        </div>
    );
};

export default HeroBackground;
