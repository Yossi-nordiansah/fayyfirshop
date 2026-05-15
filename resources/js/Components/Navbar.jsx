import React, { useEffect, useState } from "react";
import { Link } from "@inertiajs/react";
import {
    Search,
    ShoppingCart,
    User,
    Menu,
    X,
    ChevronDown,
    ChevronRight,
    Globe,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/Contexts/LanguageContext";

/**
 * Navbar Component
 * Features:
 * - Multi-language support (ID, EN, AR)
 * - Transparent navbar on scroll
 * - Product dropdown menu with subcategories
 * - Responsive mobile menu
 */

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [activeCategory, setActiveCategory] = useState(null);
    const [showLangDropdown, setShowLangDropdown] = useState(false);
    const { locale, setLocale, t } = useLanguage();
    const [showSearch, setShowSearch] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 30);
        };

        window.addEventListener("scroll", handleScroll);

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const languages = [
        { code: "indonesia", label: "Indonesia", flag: "🇮🇩" },
        { code: "english", label: "English", flag: "🇺🇸" },
        { code: "arabic", label: "العربية", flag: "🇸🇦" },
    ];

    const productDropdown = [
        {
            name: t("nav.perfume"),
            href: "/products/perfume",
            subCategory: [
                { name: t("sub.mens"), val: "mens" },
                { name: t("sub.womens"), val: "womens" },
                { name: t("sub.unisex"), val: "unisex" },
                { name: t("sub.set"), val: "parfume-set" },
            ],
        },
        {
            name: t("nav.aromaticOil"),
            href: "/products/aromatic-oil",
            subCategory: [
                { name: t("sub.oil"), val: "aromatic-oil" },
                { name: t("sub.dehn"), val: "dehn-oud" },
            ],
        },
        {
            name: t("nav.bakhoor"),
            href: "/products/bakhoor-and-oud",
            subCategory: [
                { name: t("sub.oud"), val: "oud" },
                { name: t("sub.bakhoor"), val: "bakhoor" },
                { name: t("sub.mamoul"), val: "mamoul" },
            ],
        },
        {
            name: t("nav.nutrition"),
            href: "/products/healthy-nutrition",
            subCategory: [
                { name: t("sub.saffron"), val: "saffron" },
                { name: t("sub.honey"), val: "honey" },
            ],
        },
        { name: t("nav.all"), href: "/products" },
    ];

    const icons = [
        { icon: <ShoppingCart size={20} />, label: "Cart" },
        { icon: <User size={20} />, label: "Account" },
    ];

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
                scrolled
                    ? "bg-gradient-to-l from-blue-900 to-blue-800 backdrop-blur-xl shadow-xl"
                    : "bg-transparent"
            }`}
        >
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
                <div className="flex justify-between items-center h-20">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link
                            href="/"
                            className="group flex items-center gap-2"
                        >
                            <img
                                src="/images/logo-footer.png"
                                alt="logo fayyfir"
                                className="md:h-16 h-12"
                            />
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-12 absolute left-1/2 -translate-x-1/2">
                        {/* Home */}
                        <Link
                            href="/"
                            className="relative text-xs font-['Cinzel'] font-bold tracking-[0.2em] uppercase text-white hover:text-blue-500 transition-colors duration-300 group"
                        >
                            {t("nav.home")}
                            <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full" />
                        </Link>

                        {/* Product Dropdown */}
                        <div
                            className="relative group"
                            onMouseLeave={() => setActiveCategory(null)}
                        >
                            <button className="flex items-center gap-1 relative text-xs font-['Cinzel'] font-bold tracking-[0.2em] uppercase text-white hover:text-blue-500 transition-colors duration-300">
                                {t("nav.product")}
                                <ChevronDown size={14} />
                            </button>

                            <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full" />

                            {/* Dropdown Container */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-6 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                                <div className="relative">
                                    {/* Main Categories Box */}
                                    <div className="w-60 bg-white backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-2">
                                        {productDropdown.map((item, index) => (
                                            <div
                                                key={index}
                                                onMouseEnter={() =>
                                                    item.subCategory
                                                        ? setActiveCategory(
                                                              item,
                                                          )
                                                        : setActiveCategory(
                                                              null,
                                                          )
                                                }
                                                className="relative"
                                            >
                                                <Link
                                                    href={item.href}
                                                    className={`flex items-center justify-between px-6 py-4 text-sm transition-all duration-300 ${activeCategory?.name === item.name ? "text-blue-500 bg-zinc-100" : "text-zinc-700 hover:text-blue-500"}`}
                                                >
                                                    {item.name}
                                                    {item.subCategory && (
                                                        <ChevronRight
                                                            size={14}
                                                            className={`transition-transform duration-300 ${activeCategory?.name === item.name ? "translate-x-1" : "opacity-50"}`}
                                                        />
                                                    )}
                                                </Link>

                                                {/* Subcategories Flyout Box */}
                                                <AnimatePresence>
                                                    {activeCategory?.name ===
                                                        item.name &&
                                                        item.subCategory && (
                                                            <motion.div
                                                                initial={{
                                                                    opacity: 0,
                                                                    x: -10,
                                                                }}
                                                                animate={{
                                                                    opacity: 1,
                                                                    x: 0,
                                                                }}
                                                                exit={{
                                                                    opacity: 0,
                                                                    x: -10,
                                                                }}
                                                                transition={{
                                                                    duration: 0.2,
                                                                }}
                                                                className="absolute left-full top-0 ml-1 w-44 bg-white backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1 z-50"
                                                            >
                                                                <div className="flex flex-col">
                                                                    {item.subCategory.map(
                                                                        (
                                                                            sub,
                                                                            sIdx,
                                                                        ) => (
                                                                            <Link
                                                                                key={
                                                                                    sIdx
                                                                                }
                                                                                href={`${item.href}?sub=${sub.val}`}
                                                                                className="block px-8 py-3 text-sm text-zinc-500 hover:text-blue-600 hover:translate-x-2 hover:bg-zinc-100 transition-all duration-300"
                                                                            >
                                                                                {
                                                                                    sub.name
                                                                                }
                                                                            </Link>
                                                                        ),
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                </AnimatePresence>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* About */}
                        <Link
                            href="/about"
                            className="relative text-xs font-['Cinzel'] font-bold tracking-[0.2em] uppercase text-white hover:text-blue-500 transition-colors duration-300 group"
                        >
                            {t("nav.about")}
                            <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full" />
                        </Link>
                    </div>

                    {/* Right Icons */}
                    <div className={`hidden md:flex items-center space-x-6`}>
                        {/* Language Selector */}
                        <div
                            className={`${showSearch ? "hidden" : ""} relative`}
                            onMouseLeave={() => setShowLangDropdown(false)}
                        >
                            <button
                                onMouseEnter={() => setShowLangDropdown(true)}
                                className="flex absolute right-0 pb-10 -top-2 items-center gap-1.5 text-white hover:text-blue-500 transition-all duration-300"
                            >
                                <Globe size={18} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">
                                    {
                                        languages.find((l) => l.code === locale)
                                            ?.label
                                    }
                                </span>
                                <ChevronDown
                                    size={14}
                                    className={`transition-transform duration-300 ${showLangDropdown ? "rotate-180" : ""}`}
                                />
                            </button>

                            <AnimatePresence>
                                {showLangDropdown && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute top-full right-0 mt-8 w-36 bg-white border border-zinc-100 rounded-xl shadow-2xl overflow-hidden z-[110]"
                                    >
                                        {languages.map((lang) => (
                                            <button
                                                key={lang.code}
                                                onClick={() => {
                                                    setLocale(lang.code);
                                                    setShowLangDropdown(false);
                                                }}
                                                className={`w-full flex items-center justify-between px-4 py-3 text-xs transition-colors ${
                                                    locale === lang.code
                                                        ? "text-blue-600 bg-blue-50 font-bold"
                                                        : "text-zinc-600 hover:bg-zinc-50"
                                                }`}
                                            >
                                                <span>
                                                    {lang.flag} {lang.label}
                                                </span>
                                                {locale === lang.code && (
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                                )}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Search */}
                        <div
                            className="group flex w-10 items-center overflow-hidden rounded-full bg-transparent px-2 py-2 transition-all duration-300 hover:w-64 hover:bg-white/30"
                            onMouseEnter={() => setShowSearch(true)}
                            onMouseLeave={() => setShowSearch(false)}
                        >
                            <Search size={20} className="shrink-0 text-white" />
                            <input
                                type="text"
                                className="ml-2 w-full border-none bg-transparent p-0 text-sm text-white placeholder-white/70 outline-none focus:ring-0"
                                placeholder={t("nav.searchPlaceholder")}
                            />
                        </div>

                        {/* Icons */}
                        {icons.map((item, index) => (
                            <button
                                key={index}
                                className="text-white hover:text-blue-500 transition-all duration-300 hover:scale-110 relative group"
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
                            className="text-white hover:text-blue-500 p-2 transition-colors"
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
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="absolute top-full left-0 right-0 bg-zinc-900 shadow-2xl md:hidden overflow-hidden"
                    >
                        <div className="flex flex-col space-y-4 p-6 max-h-[calc(100vh-80px)] overflow-y-auto">
                            {/* Language Mobile */}
                            <div className="flex justify-center gap-4 py-2 border-b border-white/5">
                                {languages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => setLocale(lang.code)}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                            locale === lang.code
                                                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                                                : "text-zinc-400 bg-white/5"
                                        }`}
                                    >
                                        {lang.flag} {lang.label}
                                    </button>
                                ))}
                            </div>

                            {/* Search Mobile */}
                            <div className="relative">
                                <Search
                                    size={18}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                                />
                                <input
                                    type="text"
                                    placeholder={t("nav.searchPlaceholder")}
                                    className="w-full bg-zinc-950 border border-white/10 rounded-full pl-12 pr-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-all"
                                />
                            </div>

                            {/* Home */}
                            <Link
                                href="/"
                                className="text-lg font-['Cinzel'] font-bold text-white hover:text-blue-500 py-2 border-b border-white/5"
                                onClick={() => setIsOpen(false)}
                            >
                                {t("nav.home")}
                            </Link>

                            {/* Product Dropdown Mobile */}
                            <details className="w-full group">
                                <summary className="list-none cursor-pointer flex items-center justify-between text-lg font-['Cinzel'] font-bold text-white hover:text-blue-500 py-2 border-b border-white/5">
                                    {t("nav.product")}
                                    <ChevronDown
                                        size={18}
                                        className="transition-transform duration-300 group-open:rotate-180"
                                    />
                                </summary>
                                <div className="mt-4 flex flex-col gap-2 pl-4">
                                    {productDropdown.map((item, index) =>
                                        item.subCategory ? (
                                            <details
                                                key={index}
                                                className="group/sub"
                                            >
                                                <summary className="list-none cursor-pointer flex items-center justify-between py-2 text-zinc-400 hover:text-white transition-colors">
                                                    {item.name}
                                                    <ChevronDown
                                                        size={14}
                                                        className="transition-transform duration-300 group-open/sub:rotate-180"
                                                    />
                                                </summary>
                                                <div className="flex flex-col gap-2 pl-4 py-2 border-l border-white/10 ml-1">
                                                    {item.subCategory.map(
                                                        (sub, sIdx) => (
                                                            <Link
                                                                key={sIdx}
                                                                href={`${item.href}?sub=${sub.val}`}
                                                                className="text-sm text-zinc-500 hover:text-blue-400"
                                                                onClick={() =>
                                                                    setIsOpen(
                                                                        false,
                                                                    )
                                                                }
                                                            >
                                                                {sub.name}
                                                            </Link>
                                                        ),
                                                    )}
                                                </div>
                                            </details>
                                        ) : (
                                            <Link
                                                key={index}
                                                href={item.href}
                                                className="py-2 text-zinc-400 hover:text-white"
                                                onClick={() => setIsOpen(false)}
                                            >
                                                {item.name}
                                            </Link>
                                        ),
                                    )}
                                </div>
                            </details>

                            {/* About */}
                            <Link
                                href="/about"
                                className="text-lg font-['Cinzel'] font-bold text-white hover:text-blue-500 py-2 border-b border-white/5"
                                onClick={() => setIsOpen(false)}
                            >
                                {t("nav.about")}
                            </Link>

                            {/* Icons Mobile */}
                            <div className="flex justify-around pt-6">
                                {icons.map((item, index) => (
                                    <button
                                        key={index}
                                        className="text-zinc-400 hover:text-blue-500 p-2"
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
