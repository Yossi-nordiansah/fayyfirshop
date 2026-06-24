import React, { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    Plus,
    Search,
    Edit3,
    Trash2,
    Ticket,
    X,
    Check
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import { useLanguage } from '@/Contexts/LanguageContext';

export default function VouchersTab({ vouchers = [] }) {
    const { t } = useLanguage();
    const { errors: pageErrors = {} } = usePage().props;

    // Search filter
    const [searchVoucher, setSearchVoucher] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');

    // Validation errors state
    const [localErrors, setLocalErrors] = useState({});

    // Sync page errors to local state when page errors change
    useEffect(() => {
        if (pageErrors && Object.keys(pageErrors).length > 0) {
            setLocalErrors(pageErrors);
        } else {
            setLocalErrors({});
        }
    }, [pageErrors]);

    // Form fields state
    const [voucherFields, setVoucherFields] = useState({
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
        start_date: '',
        end_date: '',
        is_active: true,
        distribution_type: 'event'
    });

    // Delete state
    const [pendingDelete, setPendingDelete] = useState(null);

    const formatInputDate = (dStr) => {
        if (!dStr) return '';
        return dStr.substring(0, 16).replace(' ', 'T');
    };

    const openAddModal = () => {
        setLocalErrors({});
        setModalMode('add');
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
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setLocalErrors({});
        setModalMode('edit');
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
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setLocalErrors({});
        setIsModalOpen(false);
    };

    const saveForm = (e) => {
        e.preventDefault();
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
                onSuccess: () => closeModal()
            });
        } else {
            router.put(route('backoffice.promotion.voucher.update', voucherFields.id), data, {
                onSuccess: () => closeModal()
            });
        }
    };

    const toggleActive = (item) => {
        router.put(route('backoffice.promotion.voucher.update', item.id), {
            ...item,
            is_active: !item.is_active
        });
    };

    const initiateDelete = (item) => {
        setPendingDelete(item);
    };

    const confirmDelete = () => {
        if (!pendingDelete) return;
        router.delete(route('backoffice.promotion.voucher.destroy', pendingDelete.id), {
            onSuccess: () => setPendingDelete(null)
        });
    };

    const filteredVouchers = vouchers.filter(item =>
        item.code.toLowerCase().includes(searchVoucher.toLowerCase()) ||
        item.name.toLowerCase().includes(searchVoucher.toLowerCase())
    );

    const formatCurrency = (val) => {
        if (val === null || val === undefined) return '-';
        return 'Rp ' + Number(val).toLocaleString('id-ID');
    };

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
                        placeholder={t('backoffice.promotion.voucher.search_placeholder', 'Cari voucher...')}
                        value={searchVoucher}
                        onChange={(e) => setSearchVoucher(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-900"
                    />
                </div>
                <button
                    onClick={openAddModal}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-800"
                >
                    <Plus className="w-4 h-4" />
                    {t('backoffice.promotion.voucher.add_button', 'Add Voucher')}
                </button>
            </div>

            {/* Voucher Table */}
            <div className="overflow-x-auto border border-blue-50 rounded-lg">
                <table className="min-w-full divide-y divide-blue-100">
                    <thead className="bg-blue-50/70">
                        <tr className="text-xs font-bold tracking-wider text-left text-blue-800 uppercase">
                            <th className="px-5 py-3">{t('backoffice.promotion.voucher.table.info', 'Voucher Info')}</th>
                            <th className="px-5 py-3">{t('backoffice.promotion.voucher.table.distribution', 'Distribusi')}</th>
                            <th className="px-5 py-3">{t('backoffice.promotion.voucher.table.type', 'Type')}</th>
                            <th className="px-5 py-3">{t('backoffice.promotion.voucher.table.value', 'Diskon / Value')}</th>
                            <th className="px-5 py-3">{t('backoffice.promotion.voucher.table.min_spending', 'Min Spending')}</th>
                            <th className="px-5 py-3">{t('backoffice.promotion.voucher.table.quota', 'Quota (Used)')}</th>
                            <th className="px-5 py-3">{t('backoffice.promotion.voucher.table.validity', 'Validity Duration')}</th>
                            <th className="px-5 py-3">{t('backoffice.promotion.voucher.table.status', 'Status')}</th>
                            <th className="px-5 py-3 text-right">{t('backoffice.promotion.voucher.table.action', 'Action')}</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-blue-50 text-slate-700">
                        {filteredVouchers.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-5 py-12 text-center text-slate-400 font-medium bg-slate-50/10">
                                    {t('backoffice.promotion.voucher.empty_state', 'Data kosong. Belum ada voucher.')}
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
                                            {item.distribution_type === 'manual'
                                                ? t('backoffice.promotion.voucher.distribution.manual', 'Manual')
                                                : t('backoffice.promotion.voucher.distribution.event', 'Event')}
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
                                                {t('backoffice.promotion.voucher.table.max', 'Max:')} {formatCurrency(item.max_discount)}
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
                                            <span className="font-semibold text-blue-900">{t('backoffice.promotion.voucher.table.start', 'Start:')}</span>
                                            <span>{formatDate(item.start_date)}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-600">
                                            <span className="font-semibold text-rose-800">{t('backoffice.promotion.voucher.table.end', 'End:')}</span>
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

            {/* Voucher Form Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                    <form
                        onSubmit={saveForm}
                        className="w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-blue-50 flex flex-col max-h-[90vh]"
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-blue-100">
                            <div>
                                <h2 className="text-xl font-extrabold text-blue-950">
                                    {modalMode === 'add'
                                        ? t('backoffice.promotion.voucher.modal.add_title', 'Tambah Voucher Baru')
                                        : t('backoffice.promotion.voucher.modal.edit_title', 'Edit Voucher')}
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {t('backoffice.promotion.voucher.modal.breadcrumbs', 'Menu / Promotion / VOUCHER')}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">{t('backoffice.promotion.voucher.form.name', 'Nama Voucher')}</label>
                                    <input
                                        type="text"
                                        value={voucherFields.name}
                                        onChange={(e) => setVoucherFields({ ...voucherFields, name: e.target.value })}
                                        placeholder={t('backoffice.promotion.voucher.form.placeholder_name', 'Contoh: Diskon Mudik Ramadan')}
                                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-950 ${localErrors.name ? 'border-rose-500' : 'border-slate-200'}`}
                                        required
                                    />
                                    {localErrors.name && (
                                        <p className="text-rose-600 text-xs mt-1 font-semibold">{localErrors.name}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">{t('backoffice.promotion.voucher.form.distribution_type', 'Tipe Distribusi Voucher')}</label>
                                    <select
                                        value={voucherFields.distribution_type}
                                        onChange={(e) => setVoucherFields({ ...voucherFields, distribution_type: e.target.value })}
                                        className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:border-blue-950 font-semibold text-slate-800 ${localErrors.distribution_type ? 'border-rose-500' : 'border-slate-200'}`}
                                    >
                                        <option value="event">{t('backoffice.promotion.voucher.form.option_event', 'Voucher Event (Gunakan Kode)')}</option>
                                        <option value="manual">{t('backoffice.promotion.voucher.form.option_manual', 'Voucher Manual (Diberikan ke Customer)')}</option>
                                    </select>
                                    {localErrors.distribution_type && (
                                        <p className="text-rose-600 text-xs mt-1 font-semibold">{localErrors.distribution_type}</p>
                                    )}
                                </div>
                            </div>

                            {voucherFields.distribution_type === 'event' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">{t('backoffice.promotion.voucher.form.code', 'Kode Voucher (Unique)')}</label>
                                    <input
                                        type="text"
                                        value={voucherFields.code}
                                        onChange={(e) => setVoucherFields({ ...voucherFields, code: e.target.value })}
                                        placeholder={t('backoffice.promotion.voucher.form.placeholder_code', 'Contoh: RAMADAN15')}
                                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-950 font-bold uppercase ${localErrors.code ? 'border-rose-500' : 'border-slate-200'}`}
                                        required={voucherFields.distribution_type === 'event'}
                                    />
                                    {localErrors.code && (
                                        <p className="text-rose-600 text-xs mt-1 font-semibold">{localErrors.code}</p>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">{t('backoffice.promotion.voucher.form.description', 'Deskripsi Voucher')}</label>
                                <textarea
                                    value={voucherFields.description}
                                    onChange={(e) => setVoucherFields({ ...voucherFields, description: e.target.value })}
                                    placeholder={t('backoffice.promotion.voucher.form.placeholder_description', 'Keterangan mengenai voucher...')}
                                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-950 h-16 ${localErrors.description ? 'border-rose-500' : 'border-slate-200'}`}
                                />
                                {localErrors.description && (
                                    <p className="text-rose-600 text-xs mt-1 font-semibold">{localErrors.description}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">{t('backoffice.promotion.voucher.form.type', 'Tipe Voucher')}</label>
                                    <select
                                        value={voucherFields.type}
                                        onChange={(e) => setVoucherFields({ ...voucherFields, type: e.target.value })}
                                        className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:border-blue-950 ${localErrors.type ? 'border-rose-500' : 'border-slate-200'}`}
                                    >
                                        <option value="fixed">{t('backoffice.promotion.voucher.form.option_fixed', 'Fixed (Potongan Nominal)')}</option>
                                        <option value="percentage">{t('backoffice.promotion.voucher.form.option_percentage', 'Percentage (Persentase %)')}</option>
                                    </select>
                                    {localErrors.type && (
                                        <p className="text-rose-600 text-xs mt-1 font-semibold">{localErrors.type}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                                        {t('backoffice.promotion.voucher.form.value', 'Nilai')} ({voucherFields.type === 'percentage' ? '%' : t('backoffice.promotion.voucher.form.currency_name', 'Rupiah')})
                                    </label>
                                    <input
                                        type="number"
                                        value={voucherFields.value}
                                        onChange={(e) => setVoucherFields({ ...voucherFields, value: e.target.value })}
                                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-950 font-bold ${localErrors.value ? 'border-rose-500' : 'border-slate-200'}`}
                                        required
                                    />
                                    {localErrors.value && (
                                        <p className="text-rose-600 text-xs mt-1 font-semibold">{localErrors.value}</p>
                                    )}
                                </div>
                            </div>

                            <div className={`grid grid-cols-1 ${voucherFields.distribution_type === 'event' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
                                {voucherFields.distribution_type === 'event' && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">{t('backoffice.promotion.voucher.form.min_spending', 'Minimal Belanja (Rp)')}</label>
                                        <input
                                            type="number"
                                            value={voucherFields.min_spending}
                                            onChange={(e) => setVoucherFields({ ...voucherFields, min_spending: e.target.value })}
                                            className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-950 ${localErrors.min_spending ? 'border-rose-500' : 'border-slate-200'}`}
                                        />
                                        {localErrors.min_spending && (
                                            <p className="text-rose-600 text-xs mt-1 font-semibold">{localErrors.min_spending}</p>
                                        )}
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">{t('backoffice.promotion.voucher.form.total_quota', 'Total Kuota (Voucher)')}</label>
                                    <input
                                        type="number"
                                        value={voucherFields.total_quota}
                                        onChange={(e) => setVoucherFields({ ...voucherFields, total_quota: e.target.value })}
                                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-950 font-semibold text-emerald-800 ${localErrors.total_quota ? 'border-rose-500' : 'border-slate-200'}`}
                                    />
                                    {localErrors.total_quota && (
                                        <p className="text-rose-600 text-xs mt-1 font-semibold">{localErrors.total_quota}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">{t('backoffice.promotion.voucher.form.max_use_per_user', 'Batas Pakai / User')}</label>
                                    <input
                                        type="number"
                                        value={voucherFields.max_use_per_user}
                                        onChange={(e) => setVoucherFields({ ...voucherFields, max_use_per_user: e.target.value })}
                                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-950 ${localErrors.max_use_per_user ? 'border-rose-500' : 'border-slate-200'}`}
                                    />
                                    {localErrors.max_use_per_user && (
                                        <p className="text-rose-600 text-xs mt-1 font-semibold">{localErrors.max_use_per_user}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">{t('backoffice.promotion.voucher.form.start_date', 'Mulai Berlaku (DateTime)')}</label>
                                    <input
                                        type="datetime-local"
                                        value={voucherFields.start_date}
                                        onChange={(e) => setVoucherFields({ ...voucherFields, start_date: e.target.value })}
                                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-950 ${localErrors.start_date ? 'border-rose-500' : 'border-slate-200'}`}
                                        required
                                    />
                                    {localErrors.start_date && (
                                        <p className="text-rose-600 text-xs mt-1 font-semibold">{localErrors.start_date}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">{t('backoffice.promotion.voucher.form.end_date', 'Berakhir Berlaku (DateTime)')}</label>
                                    <input
                                        type="datetime-local"
                                        value={voucherFields.end_date}
                                        onChange={(e) => setVoucherFields({ ...voucherFields, end_date: e.target.value })}
                                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-blue-950 ${localErrors.end_date ? 'border-rose-500' : 'border-slate-200'}`}
                                        required
                                    />
                                    {localErrors.end_date && (
                                        <p className="text-rose-600 text-xs mt-1 font-semibold">{localErrors.end_date}</p>
                                    )}
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
                                <label htmlFor="voucher_active" className="text-sm font-bold text-slate-707 select-none">
                                    {t('backoffice.promotion.voucher.form.is_active', 'Status Voucher Aktif')}
                                </label>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-blue-100 flex justify-end gap-3 bg-blue-50/30">
                            <button
                                type="button"
                                onClick={closeModal}
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
