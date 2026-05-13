import React, { useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import {
    Search,
    ShoppingCart,
    User,
    Menu,
    X,
    ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Navbar Component
 * Features:
 * - Transparent navbar on top
 * - Navbar background appears on scroll
 * - Product dropdown menu
 * - Search input popup on hover
 * - Responsive mobile menu
 */

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [showSearch, setShowSearch] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 30);
        };

        window.addEventListener('scroll', handleScroll);

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Home', href: '/' },
        { name: 'About Us', href: '/about' },
    ];

    const productDropdown = [
        { name: 'Oud & Oil', href: '/products/oud-oil' },
        { name: 'Healthy & Nutrition', href: '/products/healthy-nutrition' },
        { name: 'Food & Drink', href: '/products/food-drink' },
    ];

    const icons = [
        { icon: <ShoppingCart size={20} />, label: 'Cart' },
        { icon: <User size={20} />, label: 'Account' },
    ];

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
                scrolled
                    ? 'bg-zinc-950/85 backdrop-blur-xl border-b border-white/5 shadow-xl'
                    : 'bg-transparent'
            }`}
        >
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
                <div className="flex justify-between items-center h-20">

                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link href="/" className="group flex items-center gap-2">
                            <img src="/images/logo-footer.png" alt="logo fayyfir" className='md:h-16 h-12'/>
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                   {/* Desktop Menu */}
<div className="hidden md:flex items-center space-x-12 absolute left-1/2 -translate-x-1/2">

    {/* Home */}
    <Link
        href="/"
        className="relative text-xs font-['Cinzel'] font-bold tracking-[0.2em] uppercase text-zinc-300 hover:text-amber-500 transition-colors duration-300 group"
    >
        Home

        <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-amber-500 transition-all duration-300 group-hover:w-full" />
    </Link>

    {/* Product Dropdown */}
    <div className="relative group">
        <button className="flex items-center gap-1 relative text-xs font-['Cinzel'] font-bold tracking-[0.2em] uppercase text-zinc-300 hover:text-amber-500 transition-colors duration-300">
            Product
            <ChevronDown size={14} />
        </button>

        <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-amber-500 transition-all duration-300 group-hover:w-full" />

        {/* Dropdown */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 pt-6 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
            <div className="w-72 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                {productDropdown.map((item, index) => (
                    <Link
                        key={index}
                        href={item.href}
                        className="block px-6 py-4 text-sm text-zinc-300 hover:text-amber-500 hover:bg-white/5 transition-all duration-300"
                    >
                        {item.name}
                    </Link>
                ))}
            </div>
        </div>
    </div>

    {/* About */}
    <Link
        href="/about"
        className="relative text-xs font-['Cinzel'] font-bold tracking-[0.2em] uppercase text-zinc-300 hover:text-amber-500 transition-colors duration-300 group"
    >
        About Us

        <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-amber-500 transition-all duration-300 group-hover:w-full" />
    </Link>
</div>

                    {/* Right Icons */}
                    <div className="hidden md:flex items-center space-x-6">

                        {/* Search Hover Input */}
                                <div className="group flex w-10 items-center overflow-hidden rounded-full bg-transparent px-2 py-2 transition-all duration-300 hover:w-64 hover:bg-white/30">
                        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input 
                            type="text" 
                            className="ml-2 w-full border-none bg-transparent p-0 text-sm text-white placeholder-white/70 outline-none focus:ring-0" 
                            placeholder="Search products..."
                        />
                    </div>

                        {/* Other Icons */}
                        {icons.map((item, index) => (
                            <button
                                key={index}
                                className="text-zinc-300 hover:text-amber-500 transition-all duration-300 hover:scale-110 relative group"
                                aria-label={item.label}
                            >
                                {item.icon}

                                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
                                    {item.label}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-zinc-300 hover:text-white p-2 transition-colors"
                        >
                            {isOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
<AnimatePresence>
    {isOpen && (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="absolute top-full left-0 right-0 bg-zinc-900 shadow-2xl md:hidden overflow-hidden"
        >
          <div className="flex flex-col items-center text-center space-y-8 py-4">

    {/* Search Input Mobile */}
    <div className="w-full">
        <div className="relative">
            <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
            />

            <input
                type="text"
                placeholder="Search product..."
                className="w-full bg-zinc-950 border border-white/10 rounded-full pl-12 pr-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-amber-500 transition-all"
            />
        </div>
    </div>

    {/* Home */}
    <Link
        href="/"
        className="text-xl font-serif font-bold text-white hover:text-amber-500 transition-colors"
        onClick={() => setIsOpen(false)}
    >
        Home
    </Link>

    {/* Product Dropdown Mobile */}
    <details className="w-full group">
        <summary className="list-none cursor-pointer flex items-center justify-center gap-2 text-xl font-serif font-bold text-white hover:text-amber-500 transition-colors">
            Product

            <ChevronDown
                size={18}
                className="transition-transform duration-300 group-open:rotate-180"
            />
        </summary>

        <div className="mt-5 flex flex-col gap-4">
            {productDropdown.map((item, index) => (
                <Link
                    key={index}
                    href={item.href}
                    className="text-zinc-400 hover:text-amber-500 transition-colors"
                    onClick={() => setIsOpen(false)}
                >
                    {item.name}
                </Link>
            ))}
        </div>
    </details>

    {/* About */}
    <Link
        href="/about"
        className="text-xl font-serif font-bold text-white hover:text-amber-500 transition-colors"
        onClick={() => setIsOpen(false)}
    >
        About Us
    </Link>

    {/* Icons */}
    <div className="w-full pt-8 border-t border-white/5 flex justify-center space-x-12">
        {icons.map((item, index) => (
            <button
                key={index}
                className="text-zinc-400 hover:text-amber-500 p-2 transition-all active:scale-90"
            >
                {item.icon}
            </button>
        ))}
    </div>
</div>
        </motion.div>
    )}
</AnimatePresence>
        </nav>
    );
};

export default Navbar;