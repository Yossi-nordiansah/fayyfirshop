import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import {
    Check,
    Layers,
    Sparkles,
    Grid,
    Star,
    ShieldCheck,
    AlertCircle
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useLanguage } from '@/Contexts/LanguageContext';

// Import Tabs
import HeroTab from '../components/HeroTab';
import CategoryTab from '../components/CategoryTab';
import FeaturedProductTab from '../components/FeaturedProductTab';
import UspTab from '../components/UspTab';

export default function Content({ heroSlides = [], homeCategoryCards = [], featuredProducts = [], uspItems = [], status = null, errors = {} }) {
    const { t } = useLanguage();

    // Active Tab state: 'hero' | 'category' | 'featured_product' | 'usp'
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
                        <div className="border-b border-blue-100 bg-white px-4 pt-3 rounded-t-lg flex flex-wrap gap-6 shadow-sm">
                            <button
                                onClick={() => setActiveTab('hero')}
                                className={`pb-3 text-sm font-bold transition-all relative ${
                                    activeTab === 'hero'
                                        ? 'text-blue-950 border-b-2 border-blue-950 font-extrabold'
                                        : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    <span>{t('backoffice.content.tab.hero', 'Hero')}</span>
                                </div>
                            </button>

                            <button
                                onClick={() => setActiveTab('category')}
                                className={`pb-3 text-sm font-bold transition-all relative ${
                                    activeTab === 'category'
                                        ? 'text-blue-950 border-b-2 border-blue-950 font-extrabold'
                                        : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Grid className="w-4 h-4" />
                                    <span>{t('backoffice.content.tab.category', 'Category')}</span>
                                </div>
                            </button>

                            <button
                                onClick={() => setActiveTab('featured_product')}
                                className={`pb-3 text-sm font-bold transition-all relative ${
                                    activeTab === 'featured_product'
                                        ? 'text-blue-950 border-b-2 border-blue-950 font-extrabold'
                                        : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Star className="w-4 h-4" />
                                    <span>{t('backoffice.content.tab.featured_product', 'Featured Product')}</span>
                                </div>
                            </button>

                            <button
                                onClick={() => setActiveTab('usp')}
                                className={`pb-3 text-sm font-bold transition-all relative ${
                                    activeTab === 'usp'
                                        ? 'text-blue-950 border-b-2 border-blue-950 font-extrabold'
                                        : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4" />
                                    <span>{t('backoffice.content.tab.usp', 'USP')}</span>
                                </div>
                            </button>
                        </div>

                        {/* --- TAB CONTENT CONTAINER --- */}
                        <div className="bg-white border-x border-b border-blue-100 rounded-b-lg shadow-sm p-6">
                            {activeTab === 'hero' && <HeroTab heroSlides={heroSlides} />}

                            {activeTab === 'category' && <CategoryTab categoryCards={homeCategoryCards} />}

                            {activeTab === 'featured_product' && <FeaturedProductTab featuredProducts={featuredProducts} />}

                            {activeTab === 'usp' && <UspTab uspItems={uspItems} />}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
