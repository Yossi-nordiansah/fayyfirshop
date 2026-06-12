import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Plus,
    Search,
    Edit3,
    Trash2,
    Calendar,
    MapPin,
    Image as ImageIcon,
    Ticket,
    Sparkles,
    Check,
    X,
    Megaphone,
    ExternalLink,
    AlertCircle,
    Users,
    BarChart3,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ConfirmModal from '../components/ConfirmModal';
import { useLanguage } from '@/Contexts/LanguageContext';

export default function Promotion({ tickers = [], vouchers = [], events = [], referrals = [], status = null, errors = {} }) {
    const { t } = useLanguage();

    const [showErrorModal, setShowErrorModal] = useState(false);

    useEffect(() => {
        if (errors && Object.keys(errors).length > 0) {
            setShowErrorModal(true);
        }
    }, [errors]);

    // Active Tab state: 'ticker', 'voucher', 'event'
    const [activeTab, setActiveTab] = useState('ticker');

    // --- SEARCH FILTERS ---
    const [searchTicker, setSearchTicker] = useState('');
    const [searchVoucher, setSearchVoucher] = useState('');
    const [searchEvent, setSearchEvent] = useState('');
    const [searchReferral, setSearchReferral] = useState('');

    // --- STATE FOR DELETE CONFIRMATION ---
    const [pendingDelete, setPendingDelete] = useState(null); // format: { type: 'ticker'|'voucher'|'event'|'referral', item }

    // --- MODAL FOR ADD/EDIT ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
    const [modalType, setModalType] = useState('ticker'); // 'ticker' | 'voucher' | 'event' | 'referral'

    // Form fields states
    // Ticker Form Fields
    const [tickerFields, setTickerFields] = useState({
        id: null,
        key: '',
        translation_id: '',
        translation_en: '',
        translation_ar: '',
        iconFile: null,
        icon: '', // existing file path
        link: '',
        sort_order: 0,
        is_active: true
    });

    // Voucher Form Fields
    const [voucherFields, setVoucherFields] = useState({
        id: null,
        code: '',
        name: '',
        description: '',
        type: 'fixed',
        value: '',
        max_discount: '',
        min_spending: '',
        total_quota: '',
        max_use_per_user: 1,
        start_date: '',
        end_date: '',
        is_active: true,
        distribution_type: 'event'
    });

    // Referral Form Fields
    const [referralFields, setReferralFields] = useState({
        id: null,
        name: '',
        code: '',
        type: 'fixed',
        value: '',
        countries: ['Indonesia'],
        commission_percentage: 0,
        min_spending: '',
        total_quota: '',
        start_date: '',
        end_date: '',
        is_active: true
    });

    // Event Form Fields
    const [eventFields, setEventFields] = useState({
        id: null,
        name: '',
        start_date: '',
        end_date: '',
        countries: [], // array string
        imageFile: null,
        image_path: '', // existing file path
        is_active: true,
        vouchers: [] // array voucher_id
    });

    // --- FORM ACTIONS ---
    const openAddModal = (type) => {
        setModalMode('add');
        setModalType(type);
        if (type === 'ticker') {
            setTickerFields({
                id: null,
                key: `promo.list.${tickers.length + 1}`,
                translation_id: '',
                translation_en: '',
                translation_ar: '',
                iconFile: null,
                icon: '',
                link: '',
                sort_order: tickers.length + 1,
                is_active: true
            });
        } else if (type === 'voucher') {
            setVoucherFields({
                id: null,
                code: '',
                name: '',
                description: '',
                type: 'fixed',
                value: 0,
                max_discount: 0,
                min_spending: 0,
                total_quota: 100,
                max_use_per_user: 1,
                start_date: new Date().toISOString().substring(0, 16),
                end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 16),
                is_active: true,
                distribution_type: 'event'
            });
        } else if (type === 'event') {
            setEventFields({
                id: null,
                name: '',
                start_date: new Date().toISOString().substring(0, 16),
                end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 16),
                countries: ['Indonesia'],
                imageFile: null,
                image_path: '',
                is_active: true,
                vouchers: []
            });
        } else if (type === 'referral') {
            setReferralFields({
                id: null,
                name: '',
                code: '',
                type: 'fixed',
                value: 0,
                countries: ['Indonesia'],
                commission_percentage: 10,
                min_spending: 0,
                total_quota: 100,
                start_date: new Date().toISOString().substring(0, 16),
                end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 16),
                is_active: true
            });
        }
        setIsModalOpen(true);
    };

    const openEditModal = (type, item) => {
        setModalMode('edit');
        setModalType(type);
        if (type === 'ticker') {
            setTickerFields({
                id: item.id,
                key: item.key || '',
                translation_id: item.text_translations?.id || '',
                translation_en: item.text_translations?.en || '',
                translation_ar: item.text_translations?.ar || '',
                iconFile: null,
                icon: item.icon || '',
                link: item.link || '',
                sort_order: item.sort_order || 0,
                is_active: item.is_active
            });
        } else if (type === 'voucher') {
            // format date string correctly for datetime-local input
            const formatInputDate = (dStr) => {
                if (!dStr) return '';
                return dStr.substring(0, 16).replace(' ', 'T');
            };
            setVoucherFields({
                id: item.id,
                code: item.code || '',
                name: item.name || '',
                description: item.description || '',
                type: item.type || 'fixed',
                value: item.value || 0,
                max_discount: item.max_discount || 0,
                min_spending: item.min_spending || 0,
                total_quota: item.total_quota || 0,
                max_use_per_user: item.max_use_per_user || 1,
                start_date: formatInputDate(item.start_date),
                end_date: formatInputDate(item.end_date),
                is_active: item.is_active,
                distribution_type: item.distribution_type || 'event'
            });
        } else if (type === 'event') {
            const formatInputDate = (dStr) => {
                if (!dStr) return '';
                return dStr.substring(0, 16).replace(' ', 'T');
            };
            // item.vouchers is an array of voucher objects from database, extract ids
            const voucherIds = item.vouchers ? item.vouchers.map(v => v.id) : [];
            setEventFields({
                id: item.id,
                name: item.name || '',
                start_date: formatInputDate(item.start_date),
                end_date: formatInputDate(item.end_date),
                countries: item.countries || [],
                imageFile: null,
                image_path: item.image_path || '',
                is_active: item.is_active,
                vouchers: voucherIds
            });
        } else if (type === 'referral') {
            const formatInputDate = (dStr) => {
                if (!dStr) return '';
                return dStr.substring(0, 16).replace(' ', 'T');
            };
            setReferralFields({
                id: item.id,
                name: item.name || '',
                code: item.code || '',
                type: item.type || 'fixed',
                value: item.value || 0,
                countries: item.countries || ['Indonesia'],
                commission_percentage: item.commission_percentage || 0,
                min_spending: item.min_spending || 0,
                total_quota: item.total_quota || 0,
                start_date: formatInputDate(item.start_date),
                end_date: formatInputDate(item.end_date),
                is_active: item.is_active
            });
        }
        setIsModalOpen(true);
    };

    const saveForm = (e) => {
        e.preventDefault();
        if (modalType === 'ticker') {
            const data = {
                key: tickerFields.key,
                translation_id: tickerFields.translation_id,
                translation_en: tickerFields.translation_en,
                translation_ar: tickerFields.translation_ar,
                link: tickerFields.link,
                sort_order: tickerFields.sort_order,
                is_active: tickerFields.is_active ? 1 : 0
            };
            if (tickerFields.iconFile) {
                data.icon = tickerFields.iconFile;
            }

            if (modalMode === 'add') {
                router.post(route('backoffice.promotion.ticker.store'), data, {
                    onSuccess: () => setIsModalOpen(false)
                });
            } else {
                router.post(route('backoffice.promotion.ticker.update', tickerFields.id), data, {
                    onSuccess: () => setIsModalOpen(false)
                });
            }
        } else if (modalType === 'voucher') {
            let finalCode = voucherFields.code;
            if (voucherFields.distribution_type === 'manual') {
                if (!finalCode) {
                    finalCode = 'MAN-' + Math.random().toString(36).substring(2, 9).toUpperCase();
                }
            }

            const data = {
                code: finalCode ? finalCode.toUpperCase() : '',
                name: voucherFields.name,
                description: voucherFields.description,
                type: voucherFields.type,
                value: Number(voucherFields.value),
                max_discount: Number(voucherFields.max_discount) || null,
                min_spending: voucherFields.distribution_type === 'manual' ? 0 : (Number(voucherFields.min_spending) || 0),
                total_quota: Number(voucherFields.total_quota) || 0,
                max_use_per_user: Number(voucherFields.max_use_per_user) || 1,
                start_date: voucherFields.start_date,
                end_date: voucherFields.end_date,
                is_active: voucherFields.is_active ? 1 : 0,
                distribution_type: voucherFields.distribution_type
            };

            if (modalMode === 'add') {
                router.post(route('backoffice.promotion.voucher.store'), data, {
                    onSuccess: () => setIsModalOpen(false)
                });
            } else {
                router.put(route('backoffice.promotion.voucher.update', voucherFields.id), data, {
                    onSuccess: () => setIsModalOpen(false)
                });
            }
        } else if (modalType === 'event') {
            const data = {
                name: eventFields.name,
                start_date: eventFields.start_date,
                end_date: eventFields.end_date,
                countries: eventFields.countries,
                is_active: eventFields.is_active ? 1 : 0,
                vouchers: eventFields.vouchers
            };
            if (eventFields.imageFile) {
                data.image = eventFields.imageFile;
            }

            if (modalMode === 'add') {
                router.post(route('backoffice.promotion.event.store'), data, {
                    onSuccess: () => setIsModalOpen(false)
                });
            } else {
                router.post(route('backoffice.promotion.event.update', eventFields.id), data, {
                    onSuccess: () => setIsModalOpen(false)
                });
            }
        } else if (modalType === 'referral') {
            const data = {
                name: referralFields.name,
                code: referralFields.code.toUpperCase(),
                type: referralFields.type,
                value: Number(referralFields.value),
                countries: referralFields.countries,
                commission_percentage: Number(referralFields.commission_percentage) || 0,
                min_spending: Number(referralFields.min_spending) || 0,
                total_quota: Number(referralFields.total_quota) || 0,
                start_date: referralFields.start_date,
                end_date: referralFields.end_date,
                is_active: referralFields.is_active ? 1 : 0
            };

            if (modalMode === 'add') {
                router.post(route('backoffice.promotion.referral.store'), data, {
                    onSuccess: () => setIsModalOpen(false)
                });
            } else {
                router.put(route('backoffice.promotion.referral.update', referralFields.id), data, {
                    onSuccess: () => setIsModalOpen(false)
                });
            }
        }
    };

    // Toggle Active switches directly from the lists
    const toggleActive = (type, item) => {
        if (type === 'ticker') {
            router.post(route('backoffice.promotion.ticker.update', item.id), {
                key: item.key,
                translation_id: item.text_translations?.id,
                translation_en: item.text_translations?.en,
                translation_ar: item.text_translations?.ar,
                link: item.link,
                sort_order: item.sort_order,
                is_active: item.is_active ? 0 : 1
            });
        } else if (type === 'voucher') {
            router.put(route('backoffice.promotion.voucher.update', item.id), {
                ...item,
                is_active: !item.is_active
            });
        } else if (type === 'event') {
            const voucherIds = item.vouchers ? item.vouchers.map(v => v.id) : [];
            router.post(route('backoffice.promotion.event.update', item.id), {
                name: item.name,
                start_date: item.start_date,
                end_date: item.end_date,
                countries: item.countries,
                vouchers: voucherIds,
                is_active: item.is_active ? 0 : 1
            });
        } else if (type === 'referral') {
            router.put(route('backoffice.promotion.referral.update', item.id), {
                ...item,
                is_active: !item.is_active
            });
        }
    };

    // Delete actions
    const initiateDelete = (type, item) => {
        setPendingDelete({ type, item });
    };

    const confirmDelete = () => {
        if (!pendingDelete) return;
        const { type, item } = pendingDelete;
        if (type === 'ticker') {
            router.delete(route('backoffice.promotion.ticker.destroy', item.id));
        } else if (type === 'voucher') {
            router.delete(route('backoffice.promotion.voucher.destroy', item.id));
        } else if (type === 'event') {
            router.delete(route('backoffice.promotion.event.destroy', item.id));
        } else if (type === 'referral') {
            router.delete(route('backoffice.promotion.referral.destroy', item.id));
        }
        setPendingDelete(null);
    };

    // Toggle country item inside Event Form
    const toggleEventCountry = (country) => {
        const currentCountries = [...eventFields.countries];
        if (currentCountries.includes(country)) {
            setEventFields({
                ...eventFields,
                countries: currentCountries.filter(c => c !== country)
            });
        } else {
            setEventFields({
                ...eventFields,
                countries: [...currentCountries, country]
            });
        }
    };

    // Toggle country item inside Referral Form
    const toggleReferralCountry = (country) => {
        const currentCountries = [...referralFields.countries];
        if (currentCountries.includes(country)) {
            setReferralFields({
                ...referralFields,
                countries: currentCountries.filter(c => c !== country)
            });
        } else {
            setReferralFields({
                ...referralFields,
                countries: [...currentCountries, country]
            });
        }
    };

    // Toggle associated voucher inside Event Form
    const toggleEventVoucher = (voucherId) => {
        const currentVouchers = [...eventFields.vouchers];
        if (currentVouchers.includes(voucherId)) {
            setEventFields({
                ...eventFields,
                vouchers: currentVouchers.filter(id => id !== voucherId)
            });
        } else {
            setEventFields({
                ...eventFields,
                vouchers: [...currentVouchers, voucherId]
            });
        }
    };

    // Filter items
    const filteredTickers = tickers.filter(item =>
        (item.text_translations?.id || '').toLowerCase().includes(searchTicker.toLowerCase()) ||
        (item.text_translations?.en || '').toLowerCase().includes(searchTicker.toLowerCase()) ||
        (item.key || '').toLowerCase().includes(searchTicker.toLowerCase())
    );

    const filteredVouchers = vouchers.filter(item =>
        item.code.toLowerCase().includes(searchVoucher.toLowerCase()) ||
        item.name.toLowerCase().includes(searchVoucher.toLowerCase())
    );

    const filteredEvents = events.filter(item =>
        item.name.toLowerCase().includes(searchEvent.toLowerCase())
    );

    const filteredReferrals = referrals.filter(item =>
        item.code.toLowerCase().includes(searchReferral.toLowerCase()) ||
        item.name.toLowerCase().includes(searchReferral.toLowerCase())
    );

    // Format currency helper
    const formatCurrency = (val) => {
        if (val === null || val === undefined) return '-';
        return 'Rp ' + Number(val).toLocaleString('id-ID');
    };

    // Format date helper
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen bg-blue-50">
            <Head title={t('backoffice.promotion.title', 'Promotion Management')} />

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                show={Boolean(pendingDelete)}
                title={t('backoffice.promotion.confirm.delete_title', 'Confirm Delete')}
                message={`${t('backoffice.promotion.confirm.delete_message', 'Are you sure you want to delete')} "${pendingDelete?.item?.name || pendingDelete?.item?.code || (pendingDelete?.item?.text_translations?.id || pendingDelete?.item?.text_translations?.en)}"?`}
                confirmLabel={t('backoffice.promotion.button.delete', 'Hapus')}
                cancelLabel={t('backoffice.promotion.button.cancel', 'Batal')}
                onConfirm={confirmDelete}
                onCancel={() => setPendingDelete(null)}
            />

            {/* Error Messages Popup Modal */}
            {showErrorModal && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-rose-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-rose-50 px-6 py-4 border-b border-rose-100 flex items-center gap-2 text-rose-800">
                            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 animate-bounce" />
                            <h3 className="text-base font-extrabold">Kesalahan Input Data</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm font-semibold text-slate-700">Beberapa field berikut tidak valid:</p>
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
                                Tutup
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
                            <div className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border rounded-lg border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm animate-pulse">
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
                                    <span>Campaign Management</span>
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
                                    <span>Vouchers</span>
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
                                    <span>Events</span>
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
                                    <span>Referrals</span>
                                </div>
                            </button>
                        </div>

                        {/* --- TAB CONTENT CONTAINER --- */}
                        <div className="bg-white border-x border-b border-blue-100 rounded-b-lg shadow-sm p-6">

                            {/* 1. CAMPAIGN MANAGEMENT TAB */}
                            {activeTab === 'ticker' && (
                                <div className="space-y-6">
                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                        <div className="relative flex-1 max-w-md">
                                            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Cari promo ticker..."
                                                value={searchTicker}
                                                onChange={(e) => setSearchTicker(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-900"
                                            />
                                        </div>
                                        <button
                                            onClick={() => openAddModal('ticker')}
                                            className="inline-flex items-center gap-2 rounded-lg bg-blue-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-800"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Ticker Promo
                                        </button>
                                    </div>

                                    {/* Campaign Ticker Table */}
                                    <div className="overflow-x-auto border border-blue-50 rounded-lg">
                                        <table className="min-w-full divide-y divide-blue-100">
                                            <thead className="bg-blue-50/70">
                                                <tr className="text-xs font-bold tracking-wider text-left text-blue-800 uppercase">
                                                    <th className="px-5 py-3">Order</th>
                                                    <th className="px-5 py-3">Icon</th>
                                                    <th className="px-5 py-3">Key</th>
                                                    <th className="px-5 py-3">Translations Preview</th>
                                                    <th className="px-5 py-3">Link</th>
                                                    <th className="px-5 py-3">Status</th>
                                                    <th className="px-5 py-3 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm divide-y divide-blue-50 text-slate-700">
                                                {filteredTickers.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={7} className="px-5 py-12 text-center text-slate-400 font-medium bg-slate-50/10">
                                                            Data kosong. Belum ada ticker campaign.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredTickers.map((item) => (
                                                        <tr key={item.id} className="align-middle">
                                                            <td className="px-5 py-4 font-semibold text-slate-600">
                                                                #{item.sort_order}
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                {item.icon ? (
                                                                    <div className="w-10 h-10 p-1 rounded-lg border border-slate-200 bg-white flex items-center justify-center">
                                                                        <img
                                                                            src={`/storage/${item.icon}`}
                                                                            className="w-full h-full object-contain"
                                                                            alt="icon"
                                                                            onError={(e) => { e.target.style.display = 'none'; }}
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <span className="inline-flex p-2 bg-amber-50 rounded-lg border border-amber-200 text-amber-500">
                                                                        <Sparkles className="w-4 h-4" />
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <div className="font-mono text-xs text-slate-800">{item.key || '-'}</div>
                                                            </td>
                                                            <td className="px-5 py-4 max-w-sm">
                                                                <div className="space-y-1 text-xs text-slate-600">
                                                                    <div className="flex gap-1.5"><span className="font-bold text-slate-800 shrink-0">ID:</span> <span className="line-clamp-1">{item.text_translations?.id || '-'}</span></div>
                                                                    <div className="flex gap-1.5"><span className="font-bold text-slate-800 shrink-0">EN:</span> <span className="line-clamp-1">{item.text_translations?.en || '-'}</span></div>
                                                                    <div className="flex gap-1.5"><span className="font-bold text-slate-800 shrink-0">AR:</span> <span className="line-clamp-1">{item.text_translations?.ar || '-'}</span></div>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                {item.link ? (
                                                                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium hover:underline">
                                                                        <span>{item.link}</span>
                                                                        <ExternalLink className="w-3 h-3" />
                                                                    </a>
                                                                ) : (
                                                                    <span className="text-slate-400">-</span>
                                                                )}
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <button
                                                                    onClick={() => toggleActive('ticker', item)}
                                                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${item.is_active ? 'bg-blue-950' : 'bg-slate-200'
                                                                        }`}
                                                                >
                                                                    <span
                                                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${item.is_active ? 'translate-x-5' : 'translate-x-0'
                                                                            }`}
                                                                    />
                                                                </button>
                                                            </td>
                                                            <td className="px-5 py-4 text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    <button
                                                                        onClick={() => openEditModal('ticker', item)}
                                                                        className="inline-flex items-center justify-center text-blue-700 transition border border-blue-100 rounded-lg h-9 w-9 hover:bg-blue-50"
                                                                    >
                                                                        <Edit3 className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => initiateDelete('ticker', item)}
                                                                        className="inline-flex items-center justify-center transition border rounded-lg h-9 w-9 border-rose-100 text-rose-600 hover:bg-rose-50"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* 2. VOUCHER TAB */}
                            {activeTab === 'voucher' && (
                                <div className="space-y-6">
                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                        <div className="relative flex-1 max-w-md">
                                            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Cari voucher..."
                                                value={searchVoucher}
                                                onChange={(e) => setSearchVoucher(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-900"
                                            />
                                        </div>
                                        <button
                                            onClick={() => openAddModal('voucher')}
                                            className="inline-flex items-center gap-2 rounded-lg bg-blue-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-800"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Voucher
                                        </button>
                                    </div>

                                    {/* Voucher Table */}
                                    <div className="overflow-x-auto border border-blue-50 rounded-lg">
                                        <table className="min-w-full divide-y divide-blue-100">
                                            <thead className="bg-blue-50/70">
                                                <tr className="text-xs font-bold tracking-wider text-left text-blue-800 uppercase">
                                                    <th className="px-5 py-3">Voucher Info</th>
                                                    <th className="px-5 py-3">Distribusi</th>
                                                    <th className="px-5 py-3">Type</th>
                                                    <th className="px-5 py-3">Diskon / Value</th>
                                                    <th className="px-5 py-3">Min Spending</th>
                                                    <th className="px-5 py-3">Quota (Used)</th>
                                                    <th className="px-5 py-3">Validity Duration</th>
                                                    <th className="px-5 py-3">Status</th>
                                                    <th className="px-5 py-3 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm divide-y divide-blue-50 text-slate-700">
                                                {filteredVouchers.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={9} className="px-5 py-12 text-center text-slate-400 font-medium bg-slate-50/10">
                                                            Data kosong. Belum ada voucher.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredVouchers.map((item) => (
                                                        <tr key={item.id} className="align-middle">
                                                            <td className="px-5 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                                                                        <Ticket className="w-5 h-5" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-extrabold text-blue-950 uppercase tracking-wide">{item.code}</div>
                                                                        <div className="text-xs font-semibold text-slate-700">{item.name}</div>
                                                                        <div className="text-[11px] text-slate-400 line-clamp-1 max-w-[200px] mt-0.5">{item.description}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <span className={`inline-flex px-2.5 py-0.5 text-[11px] font-extrabold rounded-full uppercase ${item.distribution_type === 'manual'
                                                                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                                                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                                                                    }`}>
                                                                    {item.distribution_type === 'manual' ? 'Manual' : 'Event'}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full uppercase ${item.type === 'percentage'
                                                                    ? 'bg-purple-100 text-purple-800'
                                                                    : 'bg-indigo-100 text-indigo-800'
                                                                    }`}>
                                                                    {item.type}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-4 font-bold text-slate-800">
                                                                {item.type === 'percentage' ? `${parseFloat(item.value)}%` : formatCurrency(item.value)}
                                                                {item.type === 'percentage' && item.max_discount && (
                                                                    <div className="text-[11px] text-slate-400 font-normal">
                                                                        Max: {formatCurrency(item.max_discount)}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                {formatCurrency(item.min_spending)}
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <div className="font-semibold">{item.used_quota} / {item.total_quota}</div>
                                                                <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                                                                    <div
                                                                        className="bg-emerald-500 h-full"
                                                                        style={{ width: `${Math.min(100, (item.used_quota / item.total_quota) * 100)}%` }}
                                                                    />
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-4 text-xs space-y-1">
                                                                <div className="flex items-center gap-1.5 text-slate-600">
                                                                    <span className="font-semibold text-blue-900">Start:</span>
                                                                    <span>{formatDate(item.start_date)}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-slate-600">
                                                                    <span className="font-semibold text-rose-800">End:</span>
                                                                    <span>{formatDate(item.end_date)}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <button
                                                                    onClick={() => toggleActive('voucher', item)}
                                                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${item.is_active ? 'bg-blue-950' : 'bg-slate-200'
                                                                        }`}
                                                                >
                                                                    <span
                                                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${item.is_active ? 'translate-x-5' : 'translate-x-0'
                                                                            }`}
                                                                    />
                                                                </button>
                                                            </td>
                                                            <td className="px-5 py-4 text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    <button
                                                                        onClick={() => openEditModal('voucher', item)}
                                                                        className="inline-flex items-center justify-center text-blue-700 transition border border-blue-100 rounded-lg h-9 w-9 hover:bg-blue-50"
                                                                    >
                                                                        <Edit3 className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => initiateDelete('voucher', item)}
                                                                        className="inline-flex items-center justify-center transition border rounded-lg h-9 w-9 border-rose-100 text-rose-600 hover:bg-rose-50"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* 3. EVENT MANAGEMENT TAB */}
                            {activeTab === 'event' && (
                                <div className="space-y-6">
                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                        <div className="relative flex-1 max-w-md">
                                            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Cari event..."
                                                value={searchEvent}
                                                onChange={(e) => setSearchEvent(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-900"
                                            />
                                        </div>
                                        <button
                                            onClick={() => openAddModal('event')}
                                            className="inline-flex items-center gap-2 rounded-lg bg-blue-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-800"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Event
                                        </button>
                                    </div>

                                    {/* Events Grid layout */}
                                    {filteredEvents.length === 0 ? (
                                        <div className="py-12 text-center text-slate-400 font-medium border border-blue-50 rounded-lg bg-slate-50/10">
                                            Data kosong. Belum ada event.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {filteredEvents.map((item) => {
                                                const linkedVouchersList = item.vouchers || [];

                                                return (
                                                    <div
                                                        key={item.id}
                                                        className="border border-blue-100 rounded-xl bg-white shadow-xs hover:shadow-md transition p-5 flex flex-col justify-between space-y-4"
                                                    >
                                                        {/* Header: Title, dates, small image thumbnail preview */}
                                                        <div>
                                                            <div className="flex justify-between items-start gap-4">
                                                                <div className="space-y-1">
                                                                    <h3 className="text-lg font-extrabold text-blue-950 leading-snug line-clamp-2">
                                                                        {item.name}
                                                                    </h3>
                                                                    <div className="text-xs text-slate-500 flex items-center gap-2">
                                                                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                                                                        <span>{formatDate(item.start_date)} - {formatDate(item.end_date)}</span>
                                                                    </div>
                                                                </div>

                                                                {/* Event Image Banner Small Thumbnail Preview */}
                                                                {item.image_path && (
                                                                    <a
                                                                        href={item.image_path}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="w-16 h-12 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden shrink-0 block hover:opacity-85 transition"
                                                                        title="Lihat Banner Penuh"
                                                                    >
                                                                        <img src={item.image_path} alt="Banner" className="w-full h-full object-cover" />
                                                                    </a>
                                                                )}
                                                            </div>

                                                            {/* Country badges */}
                                                            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 w-fit">
                                                                <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                                                <span className="font-bold text-slate-700">Berlaku di:</span>
                                                                <span>{item.countries?.join(', ') || '-'}</span>
                                                            </div>
                                                        </div>

                                                        {/* Associated Vouchers */}
                                                        <div>
                                                            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                                                                Linked Vouchers ({linkedVouchersList.length})
                                                            </h4>
                                                            {linkedVouchersList.length === 0 ? (
                                                                <span className="text-xs text-slate-400 italic">No vouchers linked</span>
                                                            ) : (
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {linkedVouchersList.map(v => (
                                                                        <span
                                                                            key={v.id}
                                                                            className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-md border border-emerald-200"
                                                                        >
                                                                            <Ticket className="w-3 h-3 text-emerald-600" />
                                                                            {v.code}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Actions & Status row */}
                                                        <div className="flex items-center justify-between pt-3 border-t border-blue-50">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-bold text-slate-500">Status:</span>
                                                                <button
                                                                    onClick={() => toggleActive('event', item)}
                                                                    className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${item.is_active ? 'bg-blue-950' : 'bg-slate-200'
                                                                        }`}
                                                                >
                                                                    <span
                                                                        className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${item.is_active ? 'translate-x-4.5' : 'translate-x-0'
                                                                            }`}
                                                                    />
                                                                </button>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => openEditModal('event', item)}
                                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50 border border-blue-100 rounded-lg transition"
                                                                >
                                                                    <Edit3 className="w-3.5 h-3.5" />
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => initiateDelete('event', item)}
                                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-100 rounded-lg transition"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 4. REFERRAL TAB */}
                            {activeTab === 'referral' && (
                                <div className="space-y-6">
                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                        <div className="relative flex-1 max-w-md">
                                            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Cari referral..."
                                                value={searchReferral}
                                                onChange={(e) => setSearchReferral(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-900"
                                            />
                                        </div>
                                        <button
                                            onClick={() => openAddModal('referral')}
                                            className="inline-flex items-center gap-2 rounded-lg bg-blue-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-800"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Referral
                                        </button>
                                    </div>

                                    {/* Referral Table */}
                                    <div className="overflow-x-auto border border-blue-50 rounded-lg">
                                        <table className="min-w-full divide-y divide-blue-100">
                                            <thead className="bg-blue-50/70">
                                                <tr className="text-xs font-bold tracking-wider text-left text-blue-800 uppercase">
                                                    <th className="px-5 py-3">Owner / Info</th>
                                                    <th className="px-5 py-3">Code</th>
                                                    <th className="px-5 py-3">Type</th>
                                                    <th className="px-5 py-3">Diskon / Value</th>
                                                    <th className="px-5 py-3">Min Spending</th>
                                                    <th className="px-5 py-3">Quota (Used)</th>
                                                    <th className="px-5 py-3">Validity Duration</th>
                                                    <th className="px-5 py-3">Status</th>
                                                    <th className="px-5 py-3 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm divide-y divide-blue-50 text-slate-700">
                                                {filteredReferrals.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={9} className="px-5 py-12 text-center text-slate-400 font-medium bg-slate-50/10">
                                                            Data kosong. Belum ada referral.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredReferrals.map((item) => (
                                                        <tr key={item.id} className="align-middle">
                                                            <td className="px-5 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                                                                        <Users className="w-5 h-5" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-extrabold text-blue-950">{item.name}</div>
                                                                        <div className="text-[10px] text-slate-500 font-semibold mt-0.5 flex flex-wrap gap-1 items-center">
                                                                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 px-1 py-0.5 rounded">
                                                                                Komisi: {item.commission_percentage || 0}%
                                                                            </span>
                                                                            <span className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded">
                                                                                {item.countries?.join(', ') || '-'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-4 font-mono font-bold text-indigo-950 uppercase tracking-wide">
                                                                {item.code}
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full uppercase ${item.type === 'percentage'
                                                                    ? 'bg-purple-100 text-purple-800'
                                                                    : 'bg-indigo-100 text-indigo-800'
                                                                    }`}>
                                                                    {item.type}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-4 font-bold text-slate-800">
                                                                {item.type === 'percentage' ? `${parseFloat(item.value)}%` : formatCurrency(item.value)}
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                {formatCurrency(item.min_spending)}
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <div className="font-semibold">{item.used_quota} / {item.total_quota}</div>
                                                                <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                                                                    <div
                                                                        className="bg-emerald-500 h-full"
                                                                        style={{ width: `${Math.min(100, (item.used_quota / item.total_quota) * 100)}%` }}
                                                                    />
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-4 text-xs space-y-1">
                                                                <div className="flex items-center gap-1.5 text-slate-600">
                                                                    <span className="font-semibold text-blue-900">Start:</span>
                                                                    <span>{formatDate(item.start_date)}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-slate-600">
                                                                    <span className="font-semibold text-rose-800">End:</span>
                                                                    <span>{formatDate(item.end_date)}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <button
                                                                    onClick={() => toggleActive('referral', item)}
                                                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${item.is_active ? 'bg-blue-950' : 'bg-slate-200'
                                                                        }`}
                                                                >
                                                                    <span
                                                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${item.is_active ? 'translate-x-5' : 'translate-x-0'
                                                                            }`}
                                                                    />
                                                                </button>
                                                            </td>
                                                            <td className="px-5 py-4 text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    <button
                                                                        onClick={() => router.visit(route('backoffice.promotion.referral.statistics', item.id))}
                                                                        className="inline-flex items-center justify-center text-indigo-700 transition border border-indigo-100 rounded-lg h-9 w-9 hover:bg-indigo-50"
                                                                        title="Lihat Statistik"
                                                                    >
                                                                        <BarChart3 className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => openEditModal('referral', item)}
                                                                        className="inline-flex items-center justify-center text-blue-700 transition border border-blue-100 rounded-lg h-9 w-9 hover:bg-blue-50"
                                                                    >
                                                                        <Edit3 className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => initiateDelete('referral', item)}
                                                                        className="inline-flex items-center justify-center transition border rounded-lg h-9 w-9 border-rose-100 text-rose-600 hover:bg-rose-50"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </main>
            </div>

            {/* --- FORMS DIALOG / MODAL OVERLAY --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                    <form
                        onSubmit={saveForm}
                        className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-blue-50 flex flex-col max-h-[90vh]"
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-blue-100">
                            <div>
                                <h2 className="text-xl font-extrabold text-blue-950">
                                    {modalMode === 'add' ? 'Tambah Data Baru' : 'Edit Data'}
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Menu / Promotion / {modalType.toUpperCase()}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Scrollable Form Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">

                            {/* TICKER FORM FIELDS */}
                            {modalType === 'ticker' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Key Identification</label>
                                            <input
                                                type="text"
                                                value={tickerFields.key}
                                                onChange={(e) => setTickerFields({ ...tickerFields, key: e.target.value })}
                                                placeholder="promo.list.X"
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-950"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Urutan Tampilan (Sort Order)</label>
                                            <input
                                                type="number"
                                                value={tickerFields.sort_order}
                                                onChange={(e) => setTickerFields({ ...tickerFields, sort_order: Number(e.target.value) })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-950"
                                            />
                                        </div>
                                    </div>

                                    {/* Translation Boxes (Unified dynamic translation texts) */}
                                    <div className="border border-blue-50 rounded-lg p-4 bg-blue-50/20 space-y-3">
                                        <h3 className="text-xs font-extrabold text-blue-950 uppercase tracking-wide">Teks Terjemahan Dinamis (JSON)</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Bahasa Indonesia</label>
                                                <input
                                                    type="text"
                                                    value={tickerFields.translation_id}
                                                    onChange={(e) => setTickerFields({ ...tickerFields, translation_id: e.target.value })}
                                                    placeholder="Teks versi Indonesia"
                                                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-950"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">English</label>
                                                <input
                                                    type="text"
                                                    value={tickerFields.translation_en}
                                                    onChange={(e) => setTickerFields({ ...tickerFields, translation_en: e.target.value })}
                                                    placeholder="Text version in English"
                                                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-950"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Arabic (العربية)</label>
                                                <input
                                                    type="text"
                                                    value={tickerFields.translation_ar}
                                                    onChange={(e) => setTickerFields({ ...tickerFields, translation_ar: e.target.value })}
                                                    placeholder="النص باللغة العربية"
                                                    dir="rtl"
                                                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-950 text-right font-medium"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Icon File Upload as requested */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Upload Icon File (PNG, SVG, JPG)</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setTickerFields({ ...tickerFields, iconFile: e.target.files[0] })}
                                            className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-950 hover:file:bg-blue-100"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1">Uploaded files are stored securely in `storage/app/public/icons/campaign`.</p>

                                        {tickerFields.icon && (
                                            <div className="mt-3 flex items-center gap-2 border border-slate-100 rounded-lg p-2 bg-slate-50 w-fit">
                                                <span className="text-xs font-bold text-slate-500">Current Icon:</span>
                                                <img
                                                    src={`/storage/${tickerFields.icon}`}
                                                    className="w-8 h-8 object-contain"
                                                    alt="Current Icon"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3 pt-2">
                                        <input
                                            type="checkbox"
                                            id="ticker_active"
                                            checked={tickerFields.is_active}
                                            onChange={(e) => setTickerFields({ ...tickerFields, is_active: e.target.checked })}
                                            className="h-4 w-4 rounded-sm border-slate-300 text-blue-950 focus:ring-blue-950"
                                        />
                                        <label htmlFor="ticker_active" className="text-sm font-bold text-slate-700 select-none">
                                            Aktifkan / Tampilkan Ticker Ini
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* VOUCHER FORM FIELDS */}
                            {modalType === 'voucher' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nama Voucher</label>
                                            <input
                                                type="text"
                                                value={voucherFields.name}
                                                onChange={(e) => setVoucherFields({ ...voucherFields, name: e.target.value })}
                                                placeholder="Contoh: Diskon Mudik Ramadan"
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-950"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Tipe Distribusi Voucher</label>
                                            <select
                                                value={voucherFields.distribution_type}
                                                onChange={(e) => setVoucherFields({ ...voucherFields, distribution_type: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-950 font-semibold text-slate-800"
                                            >
                                                <option value="event">Voucher Event (Gunakan Kode)</option>
                                                <option value="manual">Voucher Manual (Diberikan ke Customer)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {voucherFields.distribution_type === 'event' && (
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Kode Voucher (Unique)</label>
                                            <input
                                                type="text"
                                                value={voucherFields.code}
                                                onChange={(e) => setVoucherFields({ ...voucherFields, code: e.target.value })}
                                                placeholder="Contoh: RAMADAN15"
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-950 font-bold uppercase"
                                                required={voucherFields.distribution_type === 'event'}
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Deskripsi Voucher</label>
                                        <textarea
                                            value={voucherFields.description}
                                            onChange={(e) => setVoucherFields({ ...voucherFields, description: e.target.value })}
                                            placeholder="Keterangan mengenai voucher..."
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-950 h-16"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Tipe Voucher</label>
                                            <select
                                                value={voucherFields.type}
                                                onChange={(e) => setVoucherFields({ ...voucherFields, type: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-950"
                                            >
                                                <option value="fixed">Fixed (Potongan Nominal)</option>
                                                <option value="percentage">Percentage (Persentase %)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                                Nilai ({voucherFields.type === 'percentage' ? '%' : 'Rupiah'})
                                            </label>
                                            <input
                                                type="number"
                                                value={voucherFields.value}
                                                onChange={(e) => setVoucherFields({ ...voucherFields, value: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-950 font-bold"
                                                required
                                            />
                                        </div>
                                        {/* <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Max Discount (Rp)</label>
                                            <input
                                                type="number"
                                                value={voucherFields.max_discount}
                                                onChange={(e) => setVoucherFields({ ...voucherFields, max_discount: e.target.value })}
                                                placeholder="Beri 0 jika tiada batas"
                                                disabled={voucherFields.type === 'fixed'}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-950 disabled:bg-slate-100 disabled:text-slate-400"
                                            />
                                        </div> */}
                                    </div>

                                    <div className={`grid grid-cols-1 ${voucherFields.distribution_type === 'event' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
                                        {voucherFields.distribution_type === 'event' && (
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Minimal Belanja (Rp)</label>
                                                <input
                                                    type="number"
                                                    value={voucherFields.min_spending}
                                                    onChange={(e) => setVoucherFields({ ...voucherFields, min_spending: e.target.value })}
                                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-950"
                                                />
                                            </div>
                                        )}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Total Kuota (Voucher)</label>
                                            <input
                                                type="number"
                                                value={voucherFields.total_quota}
                                                onChange={(e) => setVoucherFields({ ...voucherFields, total_quota: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-950 font-semibold text-emerald-800"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Batas Pakai / User</label>
                                            <input
                                                type="number"
                                                value={voucherFields.max_use_per_user}
                                                onChange={(e) => setVoucherFields({ ...voucherFields, max_use_per_user: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-950"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Mulai Berlaku (DateTime)</label>
                                            <input
                                                type="datetime-local"
                                                value={voucherFields.start_date}
                                                onChange={(e) => setVoucherFields({ ...voucherFields, start_date: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-950"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Berakhir Berlaku (DateTime)</label>
                                            <input
                                                type="datetime-local"
                                                value={voucherFields.end_date}
                                                onChange={(e) => setVoucherFields({ ...voucherFields, end_date: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-950"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 pt-2">
                                        <input
                                            type="checkbox"
                                            id="voucher_active"
                                            checked={voucherFields.is_active}
                                            onChange={(e) => setVoucherFields({ ...voucherFields, is_active: e.target.checked })}
                                            className="h-4 w-4 rounded-sm border-slate-300 text-blue-950 focus:ring-blue-950"
                                        />
                                        <label htmlFor="voucher_active" className="text-sm font-bold text-slate-700 select-none">
                                            Status Voucher Aktif
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* EVENT FORM FIELDS */}
                            {modalType === 'event' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nama Event / Acara</label>
                                        <input
                                            type="text"
                                            value={eventFields.name}
                                            onChange={(e) => setEventFields({ ...eventFields, name: e.target.value })}
                                            placeholder="Contoh: Kemerdekaan RI Ke-81"
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-950 font-bold"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Tanggal Mulai Event</label>
                                            <input
                                                type="datetime-local"
                                                value={eventFields.start_date}
                                                onChange={(e) => setEventFields({ ...eventFields, start_date: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-950"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Tanggal Berakhir Event</label>
                                            <input
                                                type="datetime-local"
                                                value={eventFields.end_date}
                                                onChange={(e) => setEventFields({ ...eventFields, end_date: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-950"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Country selection checkboxes */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Berlaku di Negara</label>
                                        <div className="flex flex-wrap gap-3">
                                            {['Indonesia', 'Malaysia', 'Arab', 'Internasional'].map((country) => (
                                                <button
                                                    type="button"
                                                    key={country}
                                                    onClick={() => toggleEventCountry(country)}
                                                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 ${eventFields.countries.includes(country)
                                                        ? 'bg-blue-950 text-white border-blue-950'
                                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    {eventFields.countries.includes(country) && <Check className="w-3.5 h-3.5" />}
                                                    {country}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Event Banner image upload */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Gambar Event (Pop up Banner)</label>
                                        <div className="flex flex-col md:flex-row gap-4 items-start">
                                            <div className="flex-1 w-full space-y-2">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => setEventFields({ ...eventFields, imageFile: e.target.files[0] })}
                                                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-950 hover:file:bg-blue-100"
                                                />
                                            </div>
                                            {eventFields.image_path && (
                                                <div className="w-32 h-20 rounded-lg border border-slate-200 overflow-hidden relative shrink-0">
                                                    <img
                                                        src={eventFields.image_path}
                                                        alt="Preview"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            *Gambar ini nantinya akan ditampilkan dalam format pop-up diskon saat pertama kali user masuk ke website Fayyfir Shop.
                                        </p>
                                    </div>

                                    {/* Event Voucher Associations */}
                                    <div className="border border-blue-50 rounded-lg p-4 bg-blue-50/20">
                                        <h3 className="text-xs font-extrabold text-blue-950 uppercase tracking-wide mb-2">Voucher Terkait Dengan Event Ini</h3>
                                        {vouchers.length === 0 ? (
                                            <p className="text-xs text-slate-400 italic">Belum ada data voucher, buat voucher terlebih dahulu.</p>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-40 overflow-y-auto pr-1">
                                                {vouchers.map((v) => (
                                                    <button
                                                        type="button"
                                                        key={v.id}
                                                        onClick={() => toggleEventVoucher(v.id)}
                                                        className={`p-2.5 rounded-lg border text-left flex items-center justify-between text-xs transition ${eventFields.vouchers.includes(v.id)
                                                            ? 'bg-emerald-50/70 border-emerald-500 text-emerald-950'
                                                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Ticket className={`w-4 h-4 ${eventFields.vouchers.includes(v.id) ? 'text-emerald-600' : 'text-slate-400'}`} />
                                                            <div>
                                                                <span className="font-extrabold tracking-wide uppercase block">{v.code}</span>
                                                                <span className="text-[10px] text-slate-500 font-medium line-clamp-1">{v.name}</span>
                                                            </div>
                                                        </div>
                                                        {eventFields.vouchers.includes(v.id) && (
                                                            <div className="h-4.5 w-4.5 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0">
                                                                <Check className="w-3 h-3" />
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3 pt-2">
                                        <input
                                            type="checkbox"
                                            id="event_active"
                                            checked={eventFields.is_active}
                                            onChange={(e) => setEventFields({ ...eventFields, is_active: e.target.checked })}
                                            className="h-4 w-4 rounded-sm border-slate-300 text-blue-950 focus:ring-blue-950"
                                        />
                                        <label htmlFor="event_active" className="text-sm font-bold text-slate-700 select-none">
                                            Status Event Aktif
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* REFERRAL FORM FIELDS */}
                            {modalType === 'referral' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nama Pemilik Referral</label>
                                            <input
                                                type="text"
                                                value={referralFields.name}
                                                onChange={(e) => setReferralFields({ ...referralFields, name: e.target.value })}
                                                placeholder="Contoh: Yossi Nordiansah"
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-950 font-bold"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Kode Referral (Unique)</label>
                                            <input
                                                type="text"
                                                value={referralFields.code}
                                                onChange={(e) => setReferralFields({ ...referralFields, code: e.target.value })}
                                                placeholder="Contoh: YOSSI50"
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-950 font-bold uppercase"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Tipe Diskon</label>
                                            <select
                                                value={referralFields.type}
                                                onChange={(e) => setReferralFields({ ...referralFields, type: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-950"
                                            >
                                                <option value="fixed">Fixed (Potongan Nominal)</option>
                                                <option value="percentage">Percentage (Persentase %)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                                Nilai Diskon ({referralFields.type === 'percentage' ? '%' : 'Rupiah'})
                                            </label>
                                            <input
                                                type="number"
                                                value={referralFields.value}
                                                onChange={(e) => setReferralFields({ ...referralFields, value: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-950 font-bold"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Minimal Belanja (Rp)</label>
                                            <input
                                                type="number"
                                                value={referralFields.min_spending}
                                                onChange={(e) => setReferralFields({ ...referralFields, min_spending: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-955"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Kuota Penggunaan</label>
                                            <input
                                                type="number"
                                                value={referralFields.total_quota}
                                                onChange={(e) => setReferralFields({ ...referralFields, total_quota: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-955 font-semibold text-emerald-800"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Keuntungan Owner (%)</label>
                                            <input
                                                type="number"
                                                value={referralFields.commission_percentage}
                                                onChange={(e) => setReferralFields({ ...referralFields, commission_percentage: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-955 font-semibold text-blue-900"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Country multi-selection */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Berlaku di Negara</label>
                                        <div className="flex flex-wrap gap-3">
                                            {['Indonesia', 'Malaysia', 'Arab Saudi', 'Internasional'].map((country) => (
                                                <button
                                                    type="button"
                                                    key={country}
                                                    onClick={() => toggleReferralCountry(country)}
                                                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1.5 ${referralFields.countries?.includes(country)
                                                        ? 'bg-blue-950 text-white border-blue-950'
                                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    {referralFields.countries?.includes(country) && <Check className="w-3.5 h-3.5" />}
                                                    {country}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Mulai Berlaku (DateTime)</label>
                                            <input
                                                type="datetime-local"
                                                value={referralFields.start_date}
                                                onChange={(e) => setReferralFields({ ...referralFields, start_date: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-950"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Berakhir Berlaku (DateTime)</label>
                                            <input
                                                type="datetime-local"
                                                value={referralFields.end_date}
                                                onChange={(e) => setReferralFields({ ...referralFields, end_date: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-950"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 pt-2">
                                        <input
                                            type="checkbox"
                                            id="referral_active"
                                            checked={referralFields.is_active}
                                            onChange={(e) => setReferralFields({ ...referralFields, is_active: e.target.checked })}
                                            className="h-4 w-4 rounded-sm border-slate-300 text-blue-950 focus:ring-blue-950"
                                        />
                                        <label htmlFor="referral_active" className="text-sm font-bold text-slate-700 select-none">
                                            Status Referral Aktif
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer Actions */}
                        <div className="px-6 py-4 border-t border-blue-100 flex justify-end gap-3 bg-blue-50/30">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-sm font-bold text-slate-600 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 transition"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 text-sm font-bold text-white bg-blue-950 hover:bg-blue-800 rounded-lg transition"
                            >
                                Simpan
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
