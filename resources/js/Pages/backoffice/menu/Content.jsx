import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import {
    Check,
    Layers,
    Sparkles,
    Grid,
    Star,
    ShieldCheck,
    AlertCircle,
    BookOpen,
    Home,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useLanguage } from '@/Contexts/LanguageContext';

// Import Tabs
import HeroTab from '../components/HeroTab';
import CategoryTab from '../components/CategoryTab';
import FeaturedProductTab from '../components/FeaturedProductTab';
import FeaturedProduct2Tab from '../components/FeaturedProduct2Tab';
import FeaturedProduct3Tab from '../components/FeaturedProduct3Tab';
import UspTab from '../components/UspTab';
import AboutUsTab from '../components/AboutUsTab';

export default function Content({ heroSlides = [], homeCategoryCards = [], featuredProducts = [], featuredProduct2 = [], featuredProduct3 = [], uspItems = [], aboutUsSettings = {}, status = null, errors = {} }) {
    const { t } = useLanguage();

    // Top-level page: 'home' | 'about_us'
    const [activePage, setActivePage] = useState('home');

    // Active home sub-tab: 'hero' | 'category' | 'featured_product' | 'usp'
    const [activeTab, setActiveTab] = useState('hero');

    return (
        <div className="min-h-screen bg-blue-50">
            <Head title={t('backoffice.content.title', 'Content Management')} />

            <div className="flex min-h-screen">
                <Sidebar />

                <main className="flex flex-col flex-1 min-w-0">
                    <Navbar />

                    <div className="flex-1 p-6 space-y-6">
                        {/* Page Header */}
                        <div className="flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold tracking-normal text-blue-950">
                                    {t('backoffice.content.title', 'Content Management')}
                                </h1>
                                <p className="mt-1 text-sm text-slate-500">
                                    {t('backoffice.content.subtitle', 'Kelola konten hero slider, kategori, produk unggulan, dan USP beranda.')}
                                </p>
                            </div>
                        </div>

                        {/* Flash Status Message */}
                        {status && (
                            <div className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border rounded-lg border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm">
                                <Check className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                                <span>{status}</span>
                            </div>
                        )}

                        {/* Custom Tab Navigation */}
                        {/* ── Level 1: Home / Tentang Kami ─────────────────── */}
                        <div className="border-b border-blue-100 bg-white px-4 pt-3 rounded-t-lg flex flex-wrap gap-0 shadow-sm">
                            <button
                                onClick={() => setActivePage('home')}
                                className={`pb-3 px-4 text-sm font-bold transition-all relative ${
                                    activePage === 'home'
                                        ? 'text-blue-950 border-b-2 border-blue-950 font-extrabold'
                                        : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Home className="w-4 h-4" />
                                    <span>{t('backoffice.content.tab.home', 'Beranda')}</span>
                                </div>
                            </button>

                            <button
                                onClick={() => setActivePage('about_us')}
                                className={`pb-3 px-4 text-sm font-bold transition-all relative ${
                                    activePage === 'about_us'
                                        ? 'text-blue-950 border-b-2 border-blue-950 font-extrabold'
                                        : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <BookOpen className="w-4 h-4" />
                                    <span>{t('backoffice.content.tab.about_us', 'Tentang Kami')}</span>
                                </div>
                            </button>
                        </div>

                        {/* ── Level 2: Home Sub-Tabs (only when page=home) ── */}
                        {activePage === 'home' && (
                            <div className="border-b border-blue-50 bg-slate-50 px-6 pt-2 flex flex-wrap gap-5">
                                <button
                                    onClick={() => setActiveTab('hero')}
                                    className={`pb-2.5 text-xs font-bold transition-all relative ${
                                        activeTab === 'hero'
                                            ? 'text-blue-700 border-b-2 border-blue-700'
                                            : 'text-slate-400 hover:text-slate-500'
                                    }`}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5" />
                                        <span>{t('backoffice.content.tab.hero', 'Hero')}</span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setActiveTab('category')}
                                    className={`pb-2.5 text-xs font-bold transition-all relative ${
                                        activeTab === 'category'
                                            ? 'text-blue-700 border-b-2 border-blue-700'
                                            : 'text-slate-400 hover:text-slate-500'
                                    }`}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <Grid className="w-3.5 h-3.5" />
                                        <span>{t('backoffice.content.tab.category', 'Category')}</span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setActiveTab('promo_section_1')}
                                    className={`pb-2.5 text-xs font-bold transition-all relative ${
                                        activeTab === 'promo_section_1'
                                            ? 'text-blue-700 border-b-2 border-blue-700'
                                            : 'text-slate-400 hover:text-slate-500'
                                    }`}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <Star className="w-3.5 h-3.5" />
                                        <span>{t('backoffice.content.tab.promo_section_1', 'Promo Section 1')}</span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setActiveTab('promo_section_2')}
                                    className={`pb-2.5 text-xs font-bold transition-all relative ${
                                        activeTab === 'promo_section_2'
                                            ? 'text-blue-700 border-b-2 border-blue-700'
                                            : 'text-slate-400 hover:text-slate-500'
                                    }`}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <Star className="w-3.5 h-3.5" />
                                        <span>{t('backoffice.content.tab.promo_section_2', 'Promo Section 2')}</span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setActiveTab('promo_section_3')}
                                    className={`pb-2.5 text-xs font-bold transition-all relative ${
                                        activeTab === 'promo_section_3'
                                            ? 'text-blue-700 border-b-2 border-blue-700'
                                            : 'text-slate-400 hover:text-slate-500'
                                    }`}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <Star className="w-3.5 h-3.5" />
                                        <span>{t('backoffice.content.tab.promo_section_3', 'Promo Section 3')}</span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setActiveTab('usp')}
                                    className={`pb-2.5 text-xs font-bold transition-all relative ${
                                        activeTab === 'usp'
                                            ? 'text-blue-700 border-b-2 border-blue-700'
                                            : 'text-slate-400 hover:text-slate-500'
                                    }`}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                        <span>{t('backoffice.content.tab.usp', 'USP')}</span>
                                    </div>
                                </button>
                            </div>
                        )}

                        {/* --- TAB CONTENT CONTAINER --- */}
                        <div className="bg-white border-x border-b border-blue-100 rounded-b-lg shadow-sm p-6">
                            {/* Home sub-tabs */}
                            {activePage === 'home' && activeTab === 'hero' && <HeroTab heroSlides={heroSlides} />}
                            {activePage === 'home' && activeTab === 'category' && <CategoryTab categoryCards={homeCategoryCards} />}
                            {activePage === 'home' && activeTab === 'promo_section_1' && <FeaturedProduct2Tab featuredProduct2={featuredProduct2} />}
                            {activePage === 'home' && activeTab === 'promo_section_2' && <FeaturedProduct3Tab featuredProduct3={featuredProduct3} />}
                            {activePage === 'home' && activeTab === 'promo_section_3' && <FeaturedProductTab featuredProducts={featuredProducts} />}
                            {activePage === 'home' && activeTab === 'usp' && <UspTab uspItems={uspItems} />}

                            {/* About Us tab */}
                            {activePage === 'about_us' && <AboutUsTab aboutUsSettings={aboutUsSettings} />}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
