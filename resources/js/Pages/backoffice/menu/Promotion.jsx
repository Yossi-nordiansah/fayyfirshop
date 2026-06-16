import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import {
    Check,
    Megaphone,
    Ticket,
    Sparkles,
    Users,
    AlertCircle
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useLanguage } from '@/Contexts/LanguageContext';

// Import split components
import CampaignTab from '../components/CampaignTab';
import VouchersTab from '../components/VouchersTab';
import EventsTab from '../components/EventsTab';
import ReferralsTab from '../components/ReferralsTab';

export default function Promotion({ tickers = [], vouchers = [], events = [], referrals = [], status = null, errors = {} }) {
    const { t } = useLanguage();

    const [showErrorModal, setShowErrorModal] = useState(false);

    useEffect(() => {
        if (errors && Object.keys(errors).length > 0) {
            setShowErrorModal(true);
        }
    }, [errors]);

    // Active Tab state: 'ticker' | 'voucher' | 'event' | 'referral'
    const [activeTab, setActiveTab] = useState('ticker');

    return (
        <div className="min-h-screen bg-blue-50">
            <Head title={t('backoffice.promotion.title', 'Promotion Management')} />

            {/* Error Messages Popup Modal */}
            {showErrorModal && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-rose-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-rose-50 px-6 py-4 border-b border-rose-100 flex items-center gap-2 text-rose-800">
                            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 animate-bounce" />
                            <h3 className="text-base font-extrabold">{t('backoffice.promotion.error_title', 'Kesalahan Input Data')}</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm font-semibold text-slate-700">{t('backoffice.promotion.error_subtitle', 'Beberapa field berikut tidak valid:')}</p>
                            <ul className="list-disc list-inside space-y-1.5 text-xs text-rose-700 bg-rose-50/50 border border-rose-100/50 rounded-lg p-3">
                                {Object.values(errors).map((err, idx) => (
                                    <li key={idx} className="leading-relaxed">{err}</li>
                                ))}
                            </ul>
                            <button
                                type="button"
                                onClick={() => setShowErrorModal(false)}
                                className="w-full px-4 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition"
                            >
                                {t('backoffice.promotion.button.close', 'Tutup')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex min-h-screen">
                <Sidebar />

                <main className="flex flex-col flex-1 min-w-0">
                    <Navbar />

                    <div className="flex-1 p-6 space-y-6">
                        {/* Page Header */}
                        <div className="flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold tracking-normal text-blue-950">
                                    {t('backoffice.promotion.title', 'Promotion Management')}
                                </h1>
                                <p className="mt-1 text-sm text-slate-500">
                                    {t('backoffice.promotion.subtitle', 'Configure campaigns, vouchers, and event promotions.')}
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

                        {/* Custom Modern Tabs Navigation */}
                        <div className="border-b border-blue-100 bg-white px-4 pt-3 rounded-t-lg flex flex-wrap gap-6 shadow-sm">
                            <button
                                onClick={() => setActiveTab('ticker')}
                                className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'ticker'
                                    ? 'text-blue-950 border-b-2 border-blue-950 font-extrabold'
                                    : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Megaphone className="w-4 h-4" />
                                    <span>{t('backoffice.promotion.tab.campaign', 'Campaign Management')}</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('voucher')}
                                className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'voucher'
                                    ? 'text-blue-950 border-b-2 border-blue-950 font-extrabold'
                                    : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Ticket className="w-4 h-4" />
                                    <span>{t('backoffice.promotion.tab.vouchers', 'Vouchers')}</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('event')}
                                className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'event'
                                    ? 'text-blue-950 border-b-2 border-blue-950 font-extrabold'
                                    : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    <span>{t('backoffice.promotion.tab.events', 'Events')}</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('referral')}
                                className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'referral'
                                    ? 'text-blue-950 border-b-2 border-blue-950 font-extrabold'
                                    : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    <span>{t('backoffice.promotion.tab.referrals', 'Referrals')}</span>
                                </div>
                            </button>
                        </div>

                        {/* --- TAB CONTENT CONTAINER --- */}
                        <div className="bg-white border-x border-b border-blue-100 rounded-b-lg shadow-sm p-6">
                            {activeTab === 'ticker' && <CampaignTab tickers={tickers} />}
                            {activeTab === 'voucher' && <VouchersTab vouchers={vouchers} />}
                            {activeTab === 'event' && <EventsTab events={events} vouchers={vouchers} />}
                            {activeTab === 'referral' && <ReferralsTab referrals={referrals} />}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
