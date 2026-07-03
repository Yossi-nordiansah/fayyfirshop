import React from "react";
import { Link } from "@inertiajs/react";
import { useLanguage } from "@/Contexts/LanguageContext";
import {
    // Instagram,
    // Twitter,
    Mail,
    Phone,
    MapPin,
    Send,
    ArrowUpRight,
} from "lucide-react";

/**
 * Footer Component
 * Fayyfir Shop Premium Dark Footer
 * Features: Multi-language support, Responsive layout, and Premium aesthetics.
 */
const Footer = () => {
    const { t } = useLanguage();

    const quickLinks = [
        { name: t("nav.home", "Home"), href: "/" },
        { name: t("nav.product", "Product"), href: "#" },
        { name: t("nav.about", "About Us"), href: "#" },
        { name: t("nav.perfume", "Perfume"), href: "#" },
    ];



    const socialLinks = [
        // { icon: Instagram, href: "#" },
        // { icon: Twitter, href: "#" },
    ];

    return (
        <footer className="bg-zinc-950 text-zinc-400 pt-16 pb-8 border-t border-zinc-900 font-sans">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-16">
                    {/* Brand Section */}
                    <div className="space-y-6">
                        <img
                            src="/images/logo-footer.webp"
                            alt="Fayyfir Shop"
                            className="h-12 w-auto brightness-110"
                        />
                        <p className="text-xs leading-relaxed max-w-xs text-zinc-500">
                            {t("footer.description")}
                        </p>
                        <div className="flex gap-4">
                            {socialLinks.map((social, idx) => (
                                <a
                                    key={idx}
                                    href={social.href}
                                    className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center hover:bg-amber-600 hover:border-amber-600 hover:text-white transition-all duration-300"
                                >
                                    <social.icon size={18} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-6">
                        <h4 className="text-white font-bold tracking-wider text-sm uppercase">
                            {t("footer.quick_links")}
                        </h4>
                        <ul className="space-y-4">
                            {quickLinks.map((link, idx) => (
                                <li key={idx}>
                                    <Link
                                        href={link.href}
                                        className="text-xs hover:text-amber-500 flex items-center group transition-colors duration-300"
                                    >
                                        <ArrowUpRight
                                            size={14}
                                            className="mr-2 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300"
                                        />
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact & Newsletter */}
                    <div className="space-y-6">
                        <h4 className="text-white font-bold tracking-wider text-sm uppercase">
                            {t("footer.contact_us")}
                        </h4>
                        <div className="space-y-4 text-xs">
                            <div className="flex items-start gap-3">
                                <MapPin
                                    size={18}
                                    className="text-amber-600 shrink-0 mt-0.5"
                                />
                                <a href="https://share.google/RTqWfDBuWnTAvMOxb" target="_blank" className="leading-relaxed hover:text-amber-600 transition-colors">
                                    Jl. Ternate No.03, Citarum, Kec. Bandung Wetan, Kota Bandung, Jawa Barat 40115
                                </a>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone size={18} className="text-amber-600" />
                                <a href="https://wa.me/6281290007740">+62 812-9000-7740</a>
                            </div>
                            <a
                                href="mailto:info@fayyfirshop.com"
                                className="flex items-center gap-3 hover:text-amber-600 transition-colors"
                            >
                                <Mail size={18} className="text-amber-600" />
                                <span>info@fayyfirshop.com</span>
                            </a>
                        </div>


                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-zinc-600 text-center md:text-left">
                    <p>{t("footer.rights")}</p>
                    <div className="flex items-center gap-6 opacity-40">
                        <span className="tracking-widest uppercase">
                            Secure Payments Guaranteed
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
