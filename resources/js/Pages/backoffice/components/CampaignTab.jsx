import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    Plus,
    Search,
    Edit3,
    Trash2,
    Sparkles,
    ExternalLink,
    X,
    Megaphone,
    Check
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import { useLanguage } from '@/Contexts/LanguageContext';

export default function CampaignTab({ tickers = [] }) {
    const { t } = useLanguage();

    // Search filter
    const [searchTicker, setSearchTicker] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'

    // Form fields state
    const [tickerFields, setTickerFields] = useState({
        id: null,
        key: '',
        translation_id: '',
        translation_en: '',
        translation_ar: '',
        iconFile: null,
        icon: '', // existing path
        link: '',
        sort_order: 0,
        is_active: true
    });

    // Delete state
    const [pendingDelete, setPendingDelete] = useState(null);

    const openAddModal = () => {
        setModalMode('add');
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
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setModalMode('edit');
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
        setIsModalOpen(true);
    };

    const saveForm = (e) => {
        e.preventDefault();
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
    };

    const toggleActive = (item) => {
        router.post(route('backoffice.promotion.ticker.update', item.id), {
            key: item.key,
            translation_id: item.text_translations?.id,
            translation_en: item.text_translations?.en,
            translation_ar: item.text_translations?.ar,
            link: item.link,
            sort_order: item.sort_order,
            is_active: item.is_active ? 0 : 1
        });
    };

    const initiateDelete = (item) => {
        setPendingDelete(item);
    };

    const confirmDelete = () => {
        if (!pendingDelete) return;
        router.delete(route('backoffice.promotion.ticker.destroy', pendingDelete.id), {
            onSuccess: () => setPendingDelete(null)
        });
    };

    const filteredTickers = tickers.filter(item =>
        (item.text_translations?.id || '').toLowerCase().includes(searchTicker.toLowerCase()) ||
        (item.text_translations?.en || '').toLowerCase().includes(searchTicker.toLowerCase()) ||
        (item.key || '').toLowerCase().includes(searchTicker.toLowerCase())
    );

    return (
        <div className="">
            {/* Delete Confirmation Modal */}
            <ConfirmModal
                show={Boolean(pendingDelete)}
                title={t('backoffice.promotion.confirm.delete_title', 'Confirm Delete')}
                message={`${t('backoffice.promotion.confirm.delete_message', 'Are you sure you want to delete')} "${pendingDelete?.text_translations?.id || pendingDelete?.text_translations?.en || pendingDelete?.key}"?`}
                confirmLabel={t('backoffice.promotion.button.delete', 'Hapus')}
                cancelLabel={t('backoffice.promotion.button.cancel', 'Batal')}
                onConfirm={confirmDelete}
                onCancel={() => setPendingDelete(null)}
            />

            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder={t('backoffice.promotion.campaign.search_placeholder', 'Cari promo ticker...')}
                        value={searchTicker}
                        onChange={(e) => setSearchTicker(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-900"
                    />
                </div>
                <button
                    onClick={openAddModal}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-800"
                >
                    <Plus className="w-4 h-4" />
                    {t('backoffice.promotion.campaign.add_button', 'Add Ticker Promo')}
                </button>
            </div>

            {/* Campaign Ticker Table */}
            <div className="overflow-x-auto border border-blue-50 rounded-lg">
                <table className="min-w-full divide-y divide-blue-100">
                    <thead className="bg-blue-50/70">
                        <tr className="text-xs font-bold tracking-wider text-left text-blue-800 uppercase">
                            <th className="px-5 py-3">{t('backoffice.promotion.campaign.table.order', 'Order')}</th>
                            <th className="px-5 py-3">{t('backoffice.promotion.campaign.table.icon', 'Icon')}</th>
                            <th className="px-5 py-3">{t('backoffice.promotion.campaign.table.key', 'Key')}</th>
                            <th className="px-5 py-3">{t('backoffice.promotion.campaign.table.translations_preview', 'Translations Preview')}</th>
                            <th className="px-5 py-3">{t('backoffice.promotion.campaign.table.link', 'Link')}</th>
                            <th className="px-5 py-3">{t('backoffice.promotion.campaign.table.status', 'Status')}</th>
                            <th className="px-5 py-3 text-right">{t('backoffice.promotion.campaign.table.action', 'Action')}</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-blue-50 text-slate-700">
                        {filteredTickers.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-5 py-12 text-center text-slate-400 font-medium bg-slate-50/10">
                                    {t('backoffice.promotion.campaign.empty_state', 'Data kosong. Belum ada ticker campaign.')}
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
                                            onClick={() => toggleActive(item)}
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
                                                onClick={() => openEditModal(item)}
                                                className="inline-flex items-center justify-center text-blue-700 transition border border-blue-100 rounded-lg h-9 w-9 hover:bg-blue-50"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => initiateDelete(item)}
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

            {/* Form Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                    <form
                        onSubmit={saveForm}
                        className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-blue-50 flex flex-col max-h-[90vh] overflow-hidden"
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-blue-100">
                            <div>
                                <h2 className="text-xl font-extrabold text-blue-950">
                                    {modalMode === 'add' ? t('backoffice.promotion.campaign.modal.add_title', 'Tambah Data Baru') : t('backoffice.promotion.campaign.modal.edit_title', 'Edit Data')}
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {t('backoffice.promotion.campaign.modal.breadcrumbs', 'Menu / Promotion / CAMPAIGN TICKER')}
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

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">{t('backoffice.promotion.campaign.form.key_id', 'Key Identification')}</label>
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
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">{t('backoffice.promotion.campaign.form.sort_order', 'Urutan Tampilan (Sort Order)')}</label>
                                    <input
                                        type="number"
                                        value={tickerFields.sort_order}
                                        onChange={(e) => setTickerFields({ ...tickerFields, sort_order: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-950"
                                    />
                                </div>
                            </div>

                            <div className="border border-blue-50 rounded-lg p-4 bg-blue-50/20 space-y-3">
                                <h3 className="text-xs font-extrabold text-blue-950 uppercase tracking-wide">{t('backoffice.promotion.campaign.form.dynamic_translations', 'Teks Terjemahan Dinamis (JSON)')}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">{t('backoffice.promotion.campaign.form.lang_indonesia', 'Bahasa Indonesia')}</label>
                                        <input
                                            type="text"
                                            value={tickerFields.translation_id}
                                            onChange={(e) => setTickerFields({ ...tickerFields, translation_id: e.target.value })}
                                            placeholder={t('backoffice.promotion.campaign.form.placeholder_id', 'Teks versi Indonesia')}
                                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-950"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">{t('backoffice.promotion.campaign.form.lang_english', 'English')}</label>
                                        <input
                                            type="text"
                                            value={tickerFields.translation_en}
                                            onChange={(e) => setTickerFields({ ...tickerFields, translation_en: e.target.value })}
                                            placeholder={t('backoffice.promotion.campaign.form.placeholder_en', 'Text version in English')}
                                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-950"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">{t('backoffice.promotion.campaign.form.lang_arabic', 'Arabic (العربية)')}</label>
                                        <input
                                            type="text"
                                            value={tickerFields.translation_ar}
                                            onChange={(e) => setTickerFields({ ...tickerFields, translation_ar: e.target.value })}
                                            placeholder={t('backoffice.promotion.campaign.form.placeholder_ar', 'النص باللغة العربية')}
                                            dir="rtl"
                                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-950 text-right font-medium"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">{t('backoffice.promotion.campaign.form.link_url', 'Link URL Tujuan Campaign')}</label>
                                <input
                                    type="text"
                                    value={tickerFields.link}
                                    onChange={(e) => setTickerFields({ ...tickerFields, link: e.target.value })}
                                    placeholder={t('backoffice.promotion.campaign.form.placeholder_link', 'Contoh: https://fayyfirshop.com/catalog')}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-950 font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">{t('backoffice.promotion.campaign.form.upload_icon', 'Upload Icon File (PNG, SVG, JPG)')}</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setTickerFields({ ...tickerFields, iconFile: e.target.files[0] })}
                                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-950 hover:file:bg-blue-100"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">{t('backoffice.promotion.campaign.form.upload_hint', 'Uploaded files are stored securely in `storage/app/public/icons/campaign`.')}</p>

                                {tickerFields.icon && (
                                    <div className="mt-3 flex items-center gap-2 border border-slate-100 rounded-lg p-2 bg-slate-50 w-fit">
                                        <span className="text-xs font-bold text-slate-500">{t('backoffice.promotion.campaign.form.current_icon', 'Current Icon:')}</span>
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
                                    {t('backoffice.promotion.campaign.form.toggle_active', 'Aktifkan / Tampilkan Ticker Ini')}
                                </label>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-blue-100 flex justify-end gap-3 bg-blue-50/30">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-sm font-bold text-slate-600 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 transition"
                            >
                                {t('backoffice.promotion.button.cancel', 'Batal')}
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 text-sm font-bold text-white bg-blue-950 hover:bg-blue-800 rounded-lg transition"
                            >
                                {t('backoffice.promotion.button.save', 'Simpan')}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
