import React, { useEffect, useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import {
    Search,
    ShoppingCart,
    User,
    Menu,
    X,
    ChevronDown,
    ChevronRight,
    Globe,
    LogIn,
    LogOut,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/Contexts/LanguageContext";
import LoginModal from "./LoginModal";

const Navbar = ({ alwaysSolid = false, topOffset = 0 }) => {
    // Ambil data auth global dari shared props Inertia (Laravel Breeze)
    const { auth, navCategories = [] } = usePage().props;
    const user = auth?.user;

    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [activeCategory, setActiveCategory] = useState(null);
    const [showAccountDropdown, setShowAccountDropdown] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [cartCount, setCartCount] = useState(0);

    const { locale, setLocale, t } = useLanguage();

    useEffect(() => {
        const updateCartCount = () => {
            const cart = JSON.parse(localStorage.getItem("fayyfir_cart") || "[]");
            setCartCount(cart.reduce((total, item) => total + (item.quantity || 0), 0));
        };

        updateCartCount();

        const handleScroll = () => {
            setScrolled(window.scrollY > 30);
        };
        window.addEventListener("scroll", handleScroll);
        window.addEventListener("storage", updateCartCount);
        window.addEventListener("fayyfir-cart-updated", updateCartCount);

        // Check for login=1 query parameter to trigger login modal
        const params = new URLSearchParams(window.location.search);
        if (params.get("login") === "1") {
            setShowLoginModal(true);
            const url = new URL(window.location.href);
            url.searchParams.delete("login");
            window.history.replaceState({}, document.title, url.pathname + url.search);
        }

        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("storage", updateCartCount);
            window.removeEventListener("fayyfir-cart-updated", updateCartCount);
        };
    }, []);

    const languages = [
        { code: "indonesia", label: "Indonesia", flag: "🇮🇩" },
        { code: "english", label: "English", flag: "🇺🇸" },
        { code: "arabic", label: "العربية", flag: "🇸🇦" },
    ];

    const productDropdown = [
        ...navCategories.map((cat) => ({
            name: cat.name_translations?.[locale] || cat.name,
            href: cat.href,
            subCategory: cat.subCategories && cat.subCategories.length > 0
                ? cat.subCategories.map((sub) => ({
                      name: sub.name_translations?.[locale] || sub.name,
                      val: sub.val,
                  }))
                : null,
        })),
        { name: t("nav.all", "All Products"), href: "/products" },
    ];

    return (
        <>
            <nav
                style={{ top: topOffset }}
                className={`fixed left-0 right-0 z-[100] transition-all duration-500 ${scrolled || alwaysSolid
                    ? "bg-gradient-to-l from-blue-900 to-blue-800 backdrop-blur-xl shadow-xl"
                    : "bg-transparent"
                    }`}
            >
                <div className="px-6 mx-auto max-w-7xl lg:px-12">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <div className="flex items-center flex-shrink-0">
                            <Link href="/" className="flex items-center gap-2 group">
                                <img
                                    src="/images/logo-footer.png"
                                    alt="logo fayyfir"
                                    className="h-12 md:h-16"
                                />
                            </Link>
                        </div>

                        {/* Desktop Menu */}
                        <div className="absolute items-center hidden space-x-12 -translate-x-1/2 lg:flex left-1/2">
                            {/* Home */}
                            <Link
                                href="/"
                                className="relative text-xs font-['Cinzel'] font-bold tracking-[0.2em] uppercase text-white hover:text-blue-500 transition-colors duration-300 group"
                            >
                                {t("nav.home", "Home")}
                                <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full" />
                            </Link>

                            {/* Product Dropdown */}
                            <div
                                className="relative py-2 group"
                                onMouseLeave={() => setActiveCategory(null)}
                            >
                                <button className="flex items-center gap-1 relative text-xs font-['Cinzel'] font-bold tracking-[0.2em] uppercase text-white hover:text-blue-500 transition-colors duration-300">
                                    {t("nav.product", "Products")}
                                    <ChevronDown size={14} className="transition-transform duration-300 group-hover:rotate-180" />
                                </button>
                                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full" />

                                {/* Dropdown Container */}
                                <div className="absolute invisible pt-4 transition-all duration-300 -translate-x-1/2 opacity-0 top-full left-1/2 group-hover:opacity-100 group-hover:visible">
                                    <div className="relative">
                                        <div className="py-2 bg-white border shadow-2xl w-60 backdrop-blur-xl border-white/10 rounded-xl">
                                            {productDropdown.map((item, index) => (
                                                <div
                                                    key={index}
                                                    onMouseEnter={() =>
                                                        item.subCategory
                                                            ? setActiveCategory(item)
                                                            : setActiveCategory(null)
                                                    }
                                                    className="relative"
                                                >
                                                    <Link
                                                        href={item.href}
                                                        className={`flex items-center justify-between px-6 py-4 text-sm transition-all duration-300 ${activeCategory?.name === item.name
                                                            ? "text-blue-500 bg-zinc-100"
                                                            : "text-zinc-700 hover:text-blue-500"
                                                            }`}
                                                    >
                                                        {item.name}
                                                        {item.subCategory && (
                                                            <ChevronRight
                                                                size={14}
                                                                className={`transition-transform duration-300 ${activeCategory?.name === item.name
                                                                    ? "translate-x-1"
                                                                    : "opacity-50"
                                                                    }`}
                                                            />
                                                        )}
                                                    </Link>

                                                    {/* Subcategories Flyout Box */}
                                                    <AnimatePresence>
                                                        {activeCategory?.name === item.name && item.subCategory && (
                                                            <motion.div
                                                                key={item.name}
                                                                initial={{ opacity: 0, x: -10 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                exit={{ opacity: 0, x: -10 }}
                                                                transition={{ duration: 0.2 }}
                                                                className="absolute top-0 z-50 py-1 ml-1 overflow-hidden bg-white border shadow-2xl left-full w-44 backdrop-blur-xl border-white/10 rounded-xl"
                                                            >
                                                                <div className="flex flex-col">
                                                                    {item.subCategory.map((sub, sIdx) => (
                                                                        <Link
                                                                            key={sIdx}
                                                                            href={`${item.href}?sub=${sub.val}`}
                                                                            className="block px-8 py-3 text-sm transition-all duration-300 text-zinc-500 hover:text-blue-600 hover:translate-x-2 hover:bg-zinc-100"
                                                                        >
                                                                            {sub.name}
                                                                        </Link>
                                                                    ))}
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
                                {t("nav.about", "About")}
                                <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full" />
                            </Link>
                        </div>

                        {/* Right Icons */}
                        <div className="items-center hidden space-x-6 lg:flex">
                            {/* Language Selector (Sama seperti Menu Product) */}
                            <div className={`${showSearch ? "hidden" : ""} relative group py-2`}>
                                <button
                                    className="flex items-center gap-1.5 text-white hover:text-blue-500 transition-all duration-300"
                                >
                                    <Globe size={18} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">
                                        {languages.find((l) => l.code === locale)?.label}
                                    </span>
                                    <ChevronDown
                                        size={14}
                                        className="transition-transform duration-300 group-hover:rotate-180"
                                    />
                                </button>

                                {/* Dropdown Container dengan Jembatan Hover pt-4 */}
                                <div className="absolute top-full right-0 pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[110]">
                                    <div className="overflow-hidden bg-white border shadow-2xl w-36 border-zinc-100 rounded-xl">
                                        {languages.map((lang) => (
                                            <button
                                                key={lang.code}
                                                onClick={() => {
                                                    setLocale(lang.code);
                                                }}
                                                className={`w-full flex items-center justify-between px-4 py-3 text-xs transition-colors ${locale === lang.code
                                                    ? "text-blue-600 bg-blue-50 font-bold"
                                                    : "text-zinc-600 hover:bg-zinc-50"
                                                    }`}
                                            >
                                                <span>{lang.flag} {lang.label}</span>
                                                {locale === lang.code && (
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Search */}
                            <div
                                className="flex items-center w-10 px-2 py-2 overflow-hidden transition-all duration-300 bg-transparent rounded-full group hover:w-64 hover:bg-white/30"
                                onMouseEnter={() => setShowSearch(true)}
                                onMouseLeave={() => setShowSearch(false)}
                            >
                                <Search size={20} className="text-white shrink-0" />
                                <input
                                    type="text"
                                    className="w-full p-0 ml-2 text-sm text-white bg-transparent border-none outline-none placeholder-white/70 focus:ring-0"
                                    placeholder={t("nav.searchPlaceholder", "Search parameters...")}
                                />
                            </div>

                            {/* Cart Icon */}
                            <Link
                                href="/cart"
                                className="relative py-2 text-white transition-all duration-300 hover:text-blue-500 hover:scale-110 group"
                                aria-label="Cart"
                            >
                                <ShoppingCart size={20} />
                                {cartCount > 0 && (
                                    <span className="absolute -right-2 -top-1 min-w-5 h-5 rounded-full bg-amber-500 px-1.5 text-[10px] font-bold leading-5 text-white text-center shadow-md">
                                        {cartCount}
                                    </span>
                                )}
                                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
                                    Cart
                                </span>
                            </Link>

                            {/* PREMIUM ACCOUNT DROPDOWN */}
                            <div
                                className="relative py-2"
                                onMouseEnter={() => setShowAccountDropdown(true)}
                                onMouseLeave={() => setShowAccountDropdown(false)}
                            >
                                <button
                                    className="relative flex items-center text-white transition-all duration-300 hover:text-amber-400 hover:scale-110"
                                    aria-label="Account"
                                >
                                    {user ? (
                                        <img
                                            src={
                                                user.avatar
                                                    ? user.avatar.startsWith("http") || user.avatar.startsWith("/")
                                                        ? user.avatar
                                                        : `/storage/${user.avatar}`
                                                    : "/images/default-profile.png"
                                            }
                                            alt={user.name}
                                            className="object-cover transition-all border rounded-full w-7 h-7 border-white/20 hover:border-amber-400"
                                        />
                                    ) : (
                                        <User size={20} />
                                    )}
                                </button>

                                <AnimatePresence>
                                    {showAccountDropdown && (
                                        <motion.div
                                            key="account-dropdown"
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 15 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute right-0 top-full pt-4 w-52 z-[120]"
                                        >
                                            <div className="py-2 overflow-hidden bg-white border shadow-2xl backdrop-blur-xl border-zinc-100 rounded-xl">
                                                {user ? (
                                                    <>
                                                        <div className="px-4 py-2 mb-1 border-b border-zinc-100">
                                                            <p className="text-sm font-semibold truncate text-zinc-800">{user.name}</p>
                                                        </div>
                                                        <Link
                                                            href="/profile"
                                                            className="flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200 text-zinc-700 hover:bg-blue-50 hover:text-blue-600"
                                                        >
                                                            <User size={16} className="text-zinc-400" />
                                                            {t("nav.account.profile", "Edit Profile")}
                                                        </Link>
                                                        <Link
                                                            href="/logout"
                                                            method="post"
                                                            as="button"
                                                            className="flex items-center w-full gap-3 px-4 py-3 text-sm text-left text-red-600 transition-all duration-200 hover:bg-red-50"
                                                        >
                                                            <LogOut size={16} />
                                                            {t("nav.account.logout", "Sign Out")}
                                                        </Link>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setShowAccountDropdown(false);
                                                            setShowLoginModal(true);
                                                        }}
                                                        className="flex items-center w-full gap-3 px-4 py-3 text-sm text-left transition-all duration-200 text-zinc-700 hover:bg-blue-50 hover:text-blue-600"
                                                    >
                                                        <LogIn size={16} className="text-blue-500" />
                                                        {t("nav.account.login", "Sign In")}
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="flex items-center lg:hidden">
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="p-2 text-white transition-colors hover:text-blue-500"
                            >
                                {isOpen ? <X size={28} /> : <Menu size={28} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Drawer */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            key="mobile-menu"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="lg:hidden absolute top-20 left-0 right-0 bg-blue-950/95 backdrop-blur-2xl border-t border-white/10 shadow-2xl z-[90] overflow-y-auto max-h-[calc(100vh-5rem)]"
                        >
                            <div className="p-6 space-y-6 text-white" dir={locale === 'arabic' ? 'rtl' : 'ltr'}>
                                {/* Search Bar */}
                                <div className="relative">
                                    <Search size={18} className={`absolute ${locale === 'arabic' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-white/50`} />
                                    <input
                                        type="text"
                                        placeholder={t("nav.searchPlaceholder", "Cari produk...")}
                                        className={`w-full bg-white/10 border border-white/10 rounded-xl ${locale === 'arabic' ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 text-sm text-white placeholder-white/50 outline-none focus:border-blue-500/50 transition-all`}
                                    />
                                </div>

                                {/* Navigation Links */}
                                <div className="space-y-4">
                                    <Link
                                        href="/"
                                        onClick={() => setIsOpen(false)}
                                        className="block py-2 text-sm font-semibold tracking-wider uppercase transition-colors border-b border-white/5 hover:text-blue-400"
                                    >
                                        {t("nav.home", "Home")}
                                    </Link>

                                    {/* Products (with Expandable Submenu) */}
                                    <MobileProductsMenu productDropdown={productDropdown} t={t} setIsOpen={setIsOpen} />

                                    <Link
                                        href="/about"
                                        onClick={() => setIsOpen(false)}
                                        className="block py-2 text-sm font-semibold tracking-wider uppercase transition-colors border-b border-white/5 hover:text-blue-400"
                                    >
                                        {t("nav.about", "About Us")}
                                    </Link>
                                </div>

                                {/* User & Settings Section */}
                                <div className="pt-4 space-y-4 border-t border-white/10">
                                    {/* Language Selector */}
                                    <MobileLanguageSelector languages={languages} locale={locale} setLocale={setLocale} t={t} />

                                    {/* Cart */}
                                    <Link
                                        href="/cart"
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center justify-between w-full py-2 transition-colors border-b border-white/5 hover:text-blue-400"
                                    >
                                        <span className="text-sm font-semibold tracking-wider uppercase">Cart</span>
                                        <span className="relative">
                                            <ShoppingCart size={18} />
                                            {cartCount > 0 && (
                                                <span className="absolute -right-2 -top-2 min-w-4 h-4 rounded-full bg-amber-500 px-1 text-[9px] font-bold leading-4 text-white text-center">
                                                    {cartCount}
                                                </span>
                                            )}
                                        </span>
                                    </Link>

                                    {/* Account Actions */}
                                    {user ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                                                <img
                                                    src={
                                                        user.avatar
                                                            ? user.avatar.startsWith("http") || user.avatar.startsWith("/")
                                                                ? user.avatar
                                                                : `/storage/${user.avatar}`
                                                            : "/images/default-profile.png"
                                                    }
                                                    alt={user.name}
                                                    className="object-cover border rounded-full w-9 h-9 border-white/10"
                                                />
                                                <div className="overflow-hidden">
                                                    <p className="text-sm font-semibold truncate">{user.name}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Link
                                                    href="/profile"
                                                    onClick={() => setIsOpen(false)}
                                                    className="flex items-center justify-center gap-2 py-3 text-xs font-semibold tracking-wider text-center uppercase transition-all bg-white/10 hover:bg-white/15 rounded-xl"
                                                >
                                                    <User size={14} />
                                                    {t("nav.account.profile", "Profile")}
                                                </Link>
                                                <Link
                                                    href="/logout"
                                                    method="post"
                                                    as="button"
                                                    onClick={() => setIsOpen(false)}
                                                    className="flex items-center justify-center gap-2 py-3 text-xs font-semibold tracking-wider text-red-400 uppercase transition-all bg-red-600/20 hover:bg-red-600/30 rounded-xl"
                                                >
                                                    <LogOut size={14} />
                                                    {t("nav.account.logout", "Sign Out")}
                                                </Link>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setIsOpen(false);
                                                setShowLoginModal(true);
                                            }}
                                            className="flex items-center justify-center w-full gap-2 py-3 text-xs font-bold tracking-widest text-white uppercase transition-all shadow-md bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 rounded-xl"
                                        >
                                            <LogIn size={14} />
                                            {t("nav.account.login", "Sign In")}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            <LoginModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                t={t}
            />
        </>
    );
};

// Expandable Product Submenu for Mobile
const MobileProductsMenu = ({ productDropdown, t, setIsOpen }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [expandedCategory, setExpandedCategory] = useState(null);

    return (
        <div className="border-b border-white/5">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center justify-between w-full py-2 transition-colors hover:text-blue-400"
            >
                <span className="text-sm font-semibold tracking-wider uppercase">
                    {t("nav.product", "Products")}
                </span>
                <ChevronDown size={16} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        key="mobile-products-menu"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="py-2 pl-4 pr-2 mt-1 space-y-3 overflow-hidden bg-white/5 rounded-xl"
                    >
                        {productDropdown.map((item, index) => (
                            <div key={index} className="space-y-1">
                                {item.subCategory ? (
                                    <>
                                        <button
                                            onClick={() => setExpandedCategory(expandedCategory === item.name ? null : item.name)}
                                            className="w-full flex items-center justify-between py-1.5 text-sm text-white/85 hover:text-white transition-colors"
                                        >
                                            <span>{item.name}</span>
                                            <ChevronDown size={14} className={`transition-transform duration-300 ${expandedCategory === item.name ? 'rotate-180' : ''}`} />
                                        </button>
                                        {expandedCategory === item.name && (
                                            <div className="py-1 pl-4 space-y-2 border-l border-white/10">
                                                {item.subCategory.map((sub, sIdx) => (
                                                    <Link
                                                        key={sIdx}
                                                        href={`${item.href}?sub=${sub.val}`}
                                                        onClick={() => setIsOpen(false)}
                                                        className="block py-1 text-xs transition-colors text-white/60 hover:text-blue-400"
                                                    >
                                                        {sub.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <Link
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        className="block py-1.5 text-sm text-white/85 hover:text-white transition-colors"
                                    >
                                        {item.name}
                                    </Link>
                                )}
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Expandable Language Selector for Mobile
const MobileLanguageSelector = ({ languages, locale, setLocale, t }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="pb-2 border-b border-white/5">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center justify-between w-full py-2 transition-colors hover:text-blue-400"
            >
                <div className="flex items-center gap-2">
                    <Globe size={18} />
                    <span className="text-sm font-semibold tracking-wider uppercase">
                        {t("nav.language", "Language")}: {languages.find((l) => l.code === locale)?.label}
                    </span>
                </div>
                <ChevronDown size={16} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        key="mobile-language-selector"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid grid-cols-3 gap-2 mt-2 overflow-hidden"
                    >
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => {
                                    setLocale(lang.code);
                                    setIsExpanded(false);
                                }}
                                className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs transition-all ${locale === lang.code
                                    ? "bg-blue-600/30 text-white font-bold border border-blue-500/30"
                                    : "bg-white/5 text-white/70 hover:bg-white/10"
                                    }`}
                            >
                                <span className="mb-1 text-lg">{lang.flag}</span>
                                <span>{lang.label}</span>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Navbar;
