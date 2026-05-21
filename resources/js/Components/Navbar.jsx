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

const Navbar = ({ alwaysSolid = false }) => {
    // Ambil data auth global dari shared props Inertia (Laravel Breeze)
    const { auth } = usePage().props;
    const user = auth?.user;

    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [activeCategory, setActiveCategory] = useState(null);
    const [showAccountDropdown, setShowAccountDropdown] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showSearch, setShowSearch] = useState(false);

    const { locale, setLocale, t } = useLanguage();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 30);
        };
        window.addEventListener("scroll", handleScroll);

        // Check for login=1 query parameter to trigger login modal
        const params = new URLSearchParams(window.location.search);
        if (params.get("login") === "1") {
            setShowLoginModal(true);
            const url = new URL(window.location.href);
            url.searchParams.delete("login");
            window.history.replaceState({}, document.title, url.pathname + url.search);
        }

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const languages = [
        { code: "indonesia", label: "Indonesia", flag: "🇮🇩" },
        { code: "english", label: "English", flag: "🇺🇸" },
        { code: "arabic", label: "العربية", flag: "🇸🇦" },
    ];

    const productDropdown = [
        {
            name: t("nav.perfume", "Perfume"),
            href: "/products/perfume",
            subCategory: [
                { name: t("sub.mens", "Men's"), val: "mens" },
                { name: t("sub.womens", "Women's"), val: "womens" },
                { name: t("sub.unisex", "Unisex"), val: "unisex" },
                { name: t("sub.set", "Perfume Set"), val: "parfume-set" },
            ],
        },
        {
            name: t("nav.aromaticOil", "Aromatic Oil"),
            href: "/products/aromatic-oil",
            subCategory: [
                { name: t("sub.oil", "Aromatic Oil"), val: "aromatic-oil" },
                { name: t("sub.dehn", "Dehn Al Oud"), val: "dehn-oud" },
            ],
        },
        {
            name: t("nav.bakhoor", "Bakhoor & Oud"),
            href: "/products/bakhoor-and-oud",
            subCategory: [
                { name: t("sub.oud", "Oud Wood"), val: "oud" },
                { name: t("sub.bakhoor", "Bakhoor"), val: "bakhoor" },
                { name: t("sub.mamoul", "Mamoul"), val: "mamoul" },
            ],
        },
        {
            name: t("nav.nutrition", "Healthy Nutrition"),
            href: "/products/healthy-nutrition",
            subCategory: [
                { name: t("sub.saffron", "Premium Saffron"), val: "saffron" },
                { name: t("sub.honey", "Yemeni Honey"), val: "honey" },
            ],
        },
        { name: t("nav.all", "All Products"), href: "/products" },
    ];

    return (
        <>
            <nav
                className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${scrolled || alwaysSolid
                    ? "bg-gradient-to-l from-blue-900 to-blue-800 backdrop-blur-xl shadow-xl"
                    : "bg-transparent"
                    }`}
            >
                <div className="max-w-7xl mx-auto px-6 lg:px-12">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo */}
                        <div className="flex-shrink-0 flex items-center">
                            <Link href="/" className="group flex items-center gap-2">
                                <img
                                    src="/images/logo-footer.png"
                                    alt="logo fayyfir"
                                    className="md:h-16 h-12"
                                />
                            </Link>
                        </div>

                        {/* Desktop Menu */}
                        <div className="hidden lg:flex items-center space-x-12 absolute left-1/2 -translate-x-1/2">
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
                                className="relative group py-2"
                                onMouseLeave={() => setActiveCategory(null)}
                            >
                                <button className="flex items-center gap-1 relative text-xs font-['Cinzel'] font-bold tracking-[0.2em] uppercase text-white hover:text-blue-500 transition-colors duration-300">
                                    {t("nav.product", "Products")}
                                    <ChevronDown size={14} className="transition-transform duration-300 group-hover:rotate-180" />
                                </button>
                                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full" />

                                {/* Dropdown Container */}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                                    <div className="relative">
                                        <div className="w-60 bg-white backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-2">
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
                                                                initial={{ opacity: 0, x: -10 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                exit={{ opacity: 0, x: -10 }}
                                                                transition={{ duration: 0.2 }}
                                                                className="absolute left-full top-0 ml-1 w-44 bg-white backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1 z-50"
                                                            >
                                                                <div className="flex flex-col">
                                                                    {item.subCategory.map((sub, sIdx) => (
                                                                        <Link
                                                                            key={sIdx}
                                                                            href={`${item.href}?sub=${sub.val}`}
                                                                            className="block px-8 py-3 text-sm text-zinc-500 hover:text-blue-600 hover:translate-x-2 hover:bg-zinc-100 transition-all duration-300"
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
                        <div className="hidden lg:flex items-center space-x-6">
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
                                    <div className="w-36 bg-white border border-zinc-100 rounded-xl shadow-2xl overflow-hidden">
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
                                className="group flex w-10 items-center overflow-hidden rounded-full bg-transparent px-2 py-2 transition-all duration-300 hover:w-64 hover:bg-white/30"
                                onMouseEnter={() => setShowSearch(true)}
                                onMouseLeave={() => setShowSearch(false)}
                            >
                                <Search size={20} className="shrink-0 text-white" />
                                <input
                                    type="text"
                                    className="ml-2 w-full border-none bg-transparent p-0 text-sm text-white placeholder-white/70 outline-none focus:ring-0"
                                    placeholder={t("nav.searchPlaceholder", "Search parameters...")}
                                />
                            </div>

                            {/* Cart Icon */}
                            <button
                                className="text-white hover:text-blue-500 transition-all duration-300 hover:scale-110 relative group py-2"
                                aria-label="Cart"
                            >
                                <ShoppingCart size={20} />
                                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
                                    Cart
                                </span>
                            </button>

                            {/* PREMIUM ACCOUNT DROPDOWN */}
                            <div
                                className="relative py-2"
                                onMouseEnter={() => setShowAccountDropdown(true)}
                                onMouseLeave={() => setShowAccountDropdown(false)}
                            >
                                <button
                                    className="text-white hover:text-amber-400 transition-all duration-300 hover:scale-110 relative flex items-center"
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
                                            className="w-7 h-7 rounded-full object-cover border border-white/20 hover:border-amber-400 transition-all"
                                        />
                                    ) : (
                                        <User size={20} />
                                    )}
                                </button>

                                <AnimatePresence>
                                    {showAccountDropdown && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 15 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute right-0 top-full pt-4 w-52 z-[120]"
                                        >
                                            <div className="bg-white backdrop-blur-xl border border-zinc-100 rounded-xl shadow-2xl py-2 overflow-hidden">
                                                {user ? (
                                                    <>
                                                        <div className="px-4 py-2 border-b border-zinc-100 mb-1">
                                                            <p className="text-xs text-zinc-400">Premium Member</p>
                                                            <p className="text-sm font-semibold text-zinc-800 truncate">{user.name}</p>
                                                        </div>
                                                        <Link
                                                            href="/profile"
                                                            className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
                                                        >
                                                            <User size={16} className="text-zinc-400" />
                                                            {t("nav.account.profile", "Edit Profile")}
                                                        </Link>
                                                        <Link
                                                            href="/logout"
                                                            method="post"
                                                            as="button"
                                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-all duration-200 text-left"
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
                                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 text-left"
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
                        <div className="lg:hidden flex items-center">
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="text-white hover:text-blue-500 p-2 transition-colors"
                            >
                                {isOpen ? <X size={28} /> : <Menu size={28} />}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <LoginModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                t={t}
            />
        </>
    );
};

export default Navbar;