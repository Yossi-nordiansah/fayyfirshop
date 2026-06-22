import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { Search, Star, Eye, EyeOff, MessageSquare, Trash2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useLanguage } from '@/Contexts/LanguageContext';

export default function Reviews({ reviews = [], status }) {
    const { t, locale } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [starFilter, setStarFilter] = useState('all');

    // Helper untuk mengekstrak judul produk berdasarkan locale aktif
    const getLocalizedProductTitle = (product) => {
        if (!product) return '-';
        const nameTranslations = product.name_translations;
        let parsed = nameTranslations;
        if (typeof nameTranslations === 'string') {
            try {
                parsed = JSON.parse(nameTranslations);
            } catch (e) {
                parsed = {};
            }
        }
        return parsed?.[locale] || product.title || '-';
    };

    // Helper untuk memformat tanggal sesuai dengan bahasa/lokalitas terpilih
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        let localeTag = 'en-US';
        if (locale === 'indonesia' || locale === 'id') localeTag = 'id-ID';
        else if (locale === 'arabic' || locale === 'ar') localeTag = 'ar-SA';
        else if (locale === 'chinese' || locale === 'zh') localeTag = 'zh-CN';

        return new Date(dateString).toLocaleDateString(localeTag, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Toggle visibilitas ulasan
    const handleToggleVisibility = (reviewId) => {
        router.patch(route('backoffice.review.toggle-visibility', reviewId), {}, {
            preserveScroll: true
        });
    };

    // Hapus ulasan
    const handleDeleteReview = (reviewId) => {
        if (confirm(t('backoffice.review.confirm_delete', 'Apakah Anda yakin ingin menghapus ulasan ini?'))) {
            router.delete(route('backoffice.review.destroy', reviewId), {
                preserveScroll: true
            });
        }
    };

    // Filter ulasan secara lokal
    const filteredReviews = useMemo(() => {
        return reviews.filter((review) => {
            const productTitle = getLocalizedProductTitle(review.product).toLowerCase();
            const matchesSearch = productTitle.includes(searchTerm.toLowerCase());
            const matchesStar = starFilter === 'all' || String(review.rating) === starFilter;
            return matchesSearch && matchesStar;
        });
    }, [reviews, searchTerm, starFilter, locale]);

    // Statistik filter bintang
    const starStats = useMemo(() => {
        const stats = { all: reviews.length, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviews.forEach((r) => {
            if (stats[r.rating] !== undefined) {
                stats[r.rating]++;
            }
        });
        return stats;
    }, [reviews]);

    return (
        <div className="min-h-screen bg-blue-50">
            <Head title={t('backoffice.review.title', 'Customer Reviews')} />

            <div className="flex min-h-screen">
                <Sidebar />

                <main className="flex flex-col flex-1 min-w-0">
                    <Navbar />

                    <div className="flex-1 p-6 space-y-6">
                        {/* Header Section */}
                        <section className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold tracking-normal text-blue-950">
                                    {t('backoffice.review.header', 'Customer Reviews')}
                                </h1>
                                <p className="text-sm text-slate-500 mt-1">
                                    {t('backoffice.review.sub_header', 'Manage product reviews and control which reviews are displayed on the homepage.')}
                                </p>
                            </div>
                        </section>

                        {/* Status notification message */}
                        {status && (
                            <section className="px-4 py-3 text-sm font-medium border rounded-xl border-emerald-200 bg-emerald-50 text-emerald-700">
                                {status}
                            </section>
                        )}

                        {/* Filters and Search Bar */}
                        <section className="bg-white p-4 border border-blue-100 rounded-2xl shadow-xs space-y-4">
                            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                                {/* Search Input */}
                                <div className="relative w-full md:max-w-md">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                                        <Search size={16} />
                                    </span>
                                    <input
                                        type="text"
                                        placeholder={t('backoffice.review.search_placeholder', 'Search by product name...')}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors bg-slate-50/50 focus:bg-white"
                                    />
                                </div>

                                {/* Star Filters Dropdown */}
                                <div className="relative w-full md:w-48">
                                    <select
                                        value={starFilter}
                                        onChange={(e) => setStarFilter(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors bg-white text-slate-700 cursor-pointer appearance-none pr-8"
                                    >
                                        <option value="all">
                                            {t('backoffice.review.filter_all', 'All')} ({starStats['all']})
                                        </option>
                                        {['5', '4', '3', '2', '1'].map((star) => (
                                            <option key={star} value={star}>
                                                {star} {t('backoffice.review.star_suffix', 'Stars')} ({starStats[star]})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </section>

                        {/* Reviews Table Card */}
                        <section className="overflow-hidden bg-white border border-blue-100 rounded-2xl shadow-sm">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-blue-100 bg-slate-50/50">
                                <div>
                                    <h2 className="text-base font-bold text-blue-950">
                                        {t('backoffice.review.list_title', 'Reviews List')}
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {filteredReviews.length} {t('backoffice.review.data_available', 'review data found')}
                                    </p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-blue-100">
                                    <thead className="bg-slate-50">
                                        <tr className="text-[10px] font-black uppercase tracking-wider text-left text-slate-500">
                                            <th className="px-5 py-3.5">{t('backoffice.review.th.date', 'Date & Customer')}</th>
                                            <th className="px-5 py-3.5">{t('backoffice.review.th.product', 'Product')}</th>
                                            <th className="px-5 py-3.5">{t('backoffice.review.th.rating', 'Rating')}</th>
                                            <th className="px-5 py-3.5">{t('backoffice.review.th.comment', 'Comment')}</th>
                                            <th className="px-5 py-3.5 text-center w-36">{t('backoffice.review.th.actions', 'Actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-xs divide-y divide-blue-50 text-slate-700">
                                        {filteredReviews.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-5 py-16 text-center text-slate-500">
                                                    <div className="flex flex-col items-center justify-center space-y-2">
                                                        <MessageSquare className="w-8 h-8 text-slate-300" />
                                                        <p className="font-semibold text-slate-400">
                                                            {t('backoffice.review.empty_state', 'No reviews match the criteria.')}
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredReviews.map((review) => {
                                                const productTitle = getLocalizedProductTitle(review.product);
                                                const userAvatar = review.user?.avatar
                                                    ? review.user.avatar.startsWith('http') || review.user.avatar.startsWith('/')
                                                        ? review.user.avatar
                                                        : `/storage/${review.user.avatar}`
                                                    : '/images/default-profile.png';

                                                return (
                                                    <tr key={review.id} className="align-top hover:bg-slate-50/50 transition-colors">
                                                        {/* Date & Customer Info */}
                                                        <td className="px-5 py-4 whitespace-nowrap">
                                                            <div className="flex flex-col space-y-1">
                                                                <span className="font-mono text-[10px] text-slate-400">
                                                                    {formatDate(review.created_at)}
                                                                </span>
                                                                <div className="flex items-center gap-2">
                                                                    <img
                                                                        src={userAvatar}
                                                                        alt={review.user?.name || 'User'}
                                                                        className="object-cover border border-slate-100 rounded-full h-8 w-8"
                                                                        onError={(e) => { e.target.src = '/images/default-profile.png'; }}
                                                                    />
                                                                    <div className="min-w-0">
                                                                        <p className="font-semibold text-slate-800 truncate max-w-[120px]">
                                                                            {review.user?.name || '-'}
                                                                        </p>
                                                                        <p className="text-[10px] text-slate-400 truncate max-w-[120px]">
                                                                            {review.user?.email || '-'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Product Column */}
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-start gap-2.5">
                                                                <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                                    {review.product?.images && review.product.images.length > 0 ? (
                                                                        (() => {
                                                                            const primaryImg = review.product.images.find(img => !!img.is_primary && img.is_primary !== '0' && img.is_primary !== 0) || review.product.images[0];
                                                                            const src = primaryImg.image_path.startsWith("http") || primaryImg.image_path.startsWith("/")
                                                                                ? primaryImg.image_path
                                                                                : `/storage/${primaryImg.image_path}`;
                                                                            return (
                                                                                <img
                                                                                    src={src}
                                                                                    alt={productTitle}
                                                                                    className="max-w-full max-h-full object-contain rounded-lg"
                                                                                />
                                                                            );
                                                                        })()
                                                                    ) : (
                                                                        <div className="w-6 h-6 bg-slate-200 rounded-md" />
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="font-semibold text-slate-800 line-clamp-1 max-w-[200px]" title={productTitle}>
                                                                        {productTitle}
                                                                    </p>
                                                                    {review.product_variant && (
                                                                        <p className="text-[10px] text-slate-500 mt-0.5">
                                                                            {t('backoffice.review.variant', 'Variant')}: {review.product_variant.name}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Star Rating Column */}
                                                        <td className="px-5 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-0.5 mt-0.5">
                                                                {[1, 2, 3, 4, 5].map((star) => (
                                                                    <Star
                                                                        key={star}
                                                                        size={14}
                                                                        className={star <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </td>

                                                        {/* Review comment Column */}
                                                        <td className="px-5 py-4">
                                                            <p className="text-slate-600 leading-normal max-w-sm whitespace-pre-wrap break-words">
                                                                {review.comment || (
                                                                    <span className="italic text-slate-400 text-[10px]">
                                                                        {t('backoffice.review.no_comment', 'No comment provided.')}
                                                                    </span>
                                                                )}
                                                            </p>
                                                        </td>

                                                        {/* Actions Column */}
                                                        <td className="px-5 py-4 whitespace-nowrap text-center">
                                                            <div className="flex items-center justify-center gap-4">
                                                                {/* Visibility toggle switch */}
                                                                <div className="flex flex-col items-center space-y-1">
                                                                    <button
                                                                        onClick={() => handleToggleVisibility(review.id)}
                                                                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${review.is_visible ? 'bg-blue-900' : 'bg-slate-200'}`}
                                                                    >
                                                                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${review.is_visible ? 'translate-x-4' : 'translate-x-0'}`} />
                                                                    </button>
                                                                    <span className="flex items-center gap-0.5 text-[9px] font-bold text-slate-400">
                                                                        {review.is_visible ? (
                                                                            <>
                                                                                <Eye size={10} className="text-slate-400" />
                                                                                <span>{t('backoffice.review.status_shown', 'Shown')}</span>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <EyeOff size={10} className="text-slate-300" />
                                                                                <span>{t('backoffice.review.status_hidden', 'Hidden')}</span>
                                                                            </>
                                                                        )}
                                                                    </span>
                                                                </div>

                                                                {/* Delete Button */}
                                                                <button
                                                                    onClick={() => handleDeleteReview(review.id)}
                                                                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200"
                                                                    title={t('backoffice.review.delete', 'Hapus Ulasan')}
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
}