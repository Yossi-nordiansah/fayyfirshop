import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    Plus,
    Search,
    Edit3,
    Trash2,
    Users,
    BarChart3,
    X,
    Check
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import { useLanguage } from '@/Contexts/LanguageContext';

export default function ReferralsTab({ referrals = [] }) {
    const { t } = useLanguage();

    // Search filter
    const [searchReferral, setSearchReferral] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');

    // Form fields state
    const [referralFields, setReferralFields] = useState({
        id: null,
        name: '',
        code: '',
        type: 'fixed',
        value: 0,
        countries: ['Indonesia'],
        commission_percentage: 10,
        min_spending: 0,
        total_quota: 100,
        start_date: '',
        end_date: '',
        is_active: true
    });

    // Delete state
    const [pendingDelete, setPendingDelete] = useState(null);

    const formatInputDate = (dStr) => {
        if (!dStr) return '';
        if (typeof dStr === 'string' && (dStr.endsWith('Z') || dStr.includes('+'))) {
            const d = new Date(dStr);
            if (!isNaN(d.getTime())) {
                const pad = (n) => String(n).padStart(2, '0');
                return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
            }
        }
        return dStr.substring(0, 16).replace(' ', 'T');
    };

    const getLocalNowString = (offsetDays = 0) => {
        const d = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const openAddModal = () => {
        setModalMode('add');
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
            start_date: getLocalNowString(0),
            end_date: getLocalNowString(7),
            is_active: true
        });
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setModalMode('edit');
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
        setIsModalOpen(true);
    };

    const saveForm = (e) => {
        e.preventDefault();
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
    };

    const toggleActive = (item) => {
        router.put(route('backoffice.promotion.referral.update', item.id), {
            ...item,
            start_date: formatInputDate(item.start_date),
            end_date: formatInputDate(item.end_date),
            is_active: !item.is_active
        });
    };

    const initiateDelete = (item) => {
        setPendingDelete(item);
    };

    const confirmDelete = () => {
        if (!pendingDelete) return;
        router.delete(route('backoffice.promotion.referral.destroy', pendingDelete.id), {
            onSuccess: () => setPendingDelete(null)
        });
    };

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

    const filteredReferrals = referrals.filter(item =>
        item.code.toLowerCase().includes(searchReferral.toLowerCase()) ||
        item.name.toLowerCase().includes(searchReferral.toLowerCase())
    );

    const formatCurrency = (val) => {
        if (val === null || val === undefined) return '-';
        return 'Rp ' + Number(val).toLocaleString('id-ID');
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const cleanStr = typeof dateStr === 'string' ? dateStr.replace(' ', 'T') : dateStr;
        const d = new Date(cleanStr);
        if (isNaN(d.getTime())) return '-';
        return d.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    return (
        <div className="">
            {/* Delete Confirmation Modal */}
            <ConfirmModal
                show={Boolean(pendingDelete)}
                title={t('backoffice.promotion.confirm.delete_title', 'Confirm Delete')}
                message={`${t('backoffice.promotion.confirm.delete_message', 'Are you sure you want to delete')} "${pendingDelete?.name || pendingDelete?.code}"?`}
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
                        placeholder={t('backoffice.promotion.referral.search_placeholder', 'Cari referral...')}
                        value={searchReferral}
                        onChange={(e) => setSearchReferral(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-900"
                    />
                </div>
                <button
                    onClick={openAddModal}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-800"
                >
                    <Plus className="w-4 h-4" />
                    {t('backoffice.promotion.referral.add_button', 'Add Referral')}
                </button>
            </div>

            {/* Referral Table */}
            <div className="overflow-x-auto border border-blue-50 rounded-lg">
                <table className="min-w-full divide-y divide-blue-100">
                    <thead className="bg-blue-50/70">
                        <tr className="text-xs font-bold tracking-wider text-left text-blue-800 uppercase">
                            <th className="px-5 py-3">{t('backoffice.promotion.referral.table.owner_info', 'Owner / Info')}</th>
                            <th className="px-5 py-3">{t('backoffice.promotion.referral.table.code', 'Code')}</th>
                            <th className="px-5 py-3">{t('backoffice.promotion.referral.table.type', 'Type')}</th>
                            <th className="px-5 py-3">{t('backoffice.promotion.referral.table.value', 'Diskon / Value')}</th>
                            <th className="px-5 py-3">{t('backoffice.promotion.referral.table.min_spending', 'Min Spending')}</th>
                            <th className="px-5 py-3">{t('backoffice.promotion.referral.table.quota', 'Quota (Used)')}</th>
                            <th className="px-5 py-3">{t('backoffice.promotion.referral.table.validity', 'Validity Duration')}</th>
                            <th className="px-5 py-3">{t('backoffice.promotion.referral.table.status', 'Status')}</th>
                            <th className="px-5 py-3 text-right">{t('backoffice.promotion.referral.table.action', 'Action')}</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-blue-50 text-slate-700">
                        {filteredReferrals.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-5 py-12 text-center text-slate-400 font-medium bg-slate-50/10">
                                    {t('backoffice.promotion.referral.empty_state', 'Data kosong. Belum ada referral.')}
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
                                                        {t('backoffice.promotion.referral.table.commission', 'Komisi: {percentage}%').replace('{percentage}', item.commission_percentage || 0)}
                                                    </span>
                                                    <span className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded">
                                                        {item.countries?.map(c => t(`backoffice.promotion.referral.country.${c.toLowerCase().replace(' ', '_')}`, c)).join(', ') || '-'}
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
                                            {item.type === 'percentage' ? t('backoffice.promotion.referral.type.percentage', 'Percentage') : t('backoffice.promotion.referral.type.fixed', 'Fixed')}
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
                                            <span className="font-semibold text-blue-900">{t('backoffice.promotion.referral.table.start', 'Start:')}</span>
                                            <span>{formatDate(item.start_date)}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-600">
                                            <span className="font-semibold text-rose-800">{t('backoffice.promotion.referral.table.end', 'End:')}</span>
                                            <span>{formatDate(item.end_date)}</span>
                                        </div>
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
                                                onClick={() => router.visit(route('backoffice.promotion.referral.statistics', item.id))}
                                                className="inline-flex items-center justify-center text-indigo-700 transition border border-indigo-100 rounded-lg h-9 w-9 hover:bg-indigo-50"
                                                title={t('backoffice.promotion.referral.table.view_stats_tooltip', 'Lihat Statistik')}
                                            >
                                                <BarChart3 className="w-4 h-4" />
                                            </button>
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

            {/* Referral Form Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                    <form
                        onSubmit={saveForm}
                        className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-blue-50 flex flex-col max-h-[90vh]"
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-blue-100">
                            <div>
                                <h2 className="text-xl font-extrabold text-blue-950">
                                    {modalMode === 'add'
                                        ? t('backoffice.promotion.referral.modal.add_title', 'Tambah Referral Baru')
                                        : t('backoffice.promotion.referral.modal.edit_title', 'Edit Referral')}
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {t('backoffice.promotion.referral.modal.breadcrumbs', 'Menu / Promotion / REFERRAL')}
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
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">{t('backoffice.promotion.referral.form.owner_name', 'Nama Pemilik Referral')}</label>
                                    <input
                                        type="text"
                                        value={referralFields.name}
                                        onChange={(e) => setReferralFields({ ...referralFields, name: e.target.value })}
                                        placeholder={t('backoffice.promotion.referral.form.placeholder_owner_name', 'Contoh: Yossi Nordiansah')}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-950 font-bold"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">{t('backoffice.promotion.referral.form.code', 'Kode Referral (Unique)')}</label>
                                    <input
                                        type="text"
                                        value={referralFields.code}
                                        onChange={(e) => setReferralFields({ ...referralFields, code: e.target.value })}
                                        placeholder={t('backoffice.promotion.referral.form.placeholder_code', 'Contoh: YOSSI50')}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-950 font-bold uppercase"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">{t('backoffice.promotion.referral.form.discount_type', 'Tipe Diskon')}</label>
                                    <select
                                        value={referralFields.type}
                                        onChange={(e) => setReferralFields({ ...referralFields, type: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-blue-950"
                                    >
                                        <option value="fixed">{t('backoffice.promotion.referral.form.option_fixed', 'Fixed (Potongan Nominal)')}</option>
                                        <option value="percentage">{t('backoffice.promotion.referral.form.option_percentage', 'Percentage (Persentase %)')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                        {t('backoffice.promotion.referral.form.discount_value_label', 'Nilai Diskon ({unit})').replace('{unit}', referralFields.type === 'percentage' ? '%' : t('backoffice.promotion.referral.form.currency_name', 'Rupiah'))}
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
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">{t('backoffice.promotion.referral.form.min_spending', 'Minimal Belanja (Rp)')}</label>
                                    <input
                                        type="number"
                                        value={referralFields.min_spending}
                                        onChange={(e) => setReferralFields({ ...referralFields, min_spending: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-950"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">{t('backoffice.promotion.referral.form.total_quota', 'Kuota Penggunaan')}</label>
                                    <input
                                        type="number"
                                        value={referralFields.total_quota}
                                        onChange={(e) => setReferralFields({ ...referralFields, total_quota: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-950 font-semibold text-emerald-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">{t('backoffice.promotion.referral.form.commission', 'Keuntungan Owner (%)')}</label>
                                    <input
                                        type="number"
                                        value={referralFields.commission_percentage}
                                        onChange={(e) => setReferralFields({ ...referralFields, commission_percentage: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-950 font-semibold text-blue-900"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Country multi-selection */}
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">{t('backoffice.promotion.referral.form.applicable_countries', 'Berlaku di Negara')}</label>
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
                                            {t(`backoffice.promotion.referral.country.${country.toLowerCase().replace(' ', '_')}`, country)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">{t('backoffice.promotion.referral.form.start_date', 'Mulai Berlaku (DateTime)')}</label>
                                    <input
                                        type="datetime-local"
                                        value={referralFields.start_date}
                                        onChange={(e) => setReferralFields({ ...referralFields, start_date: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-950"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">{t('backoffice.promotion.referral.form.end_date', 'Berakhir Berlaku (DateTime)')}</label>
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
                                <label htmlFor="referral_active" className="text-sm font-bold text-slate-707 select-none">
                                    {t('backoffice.promotion.referral.form.is_active', 'Status Referral Aktif')}
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
