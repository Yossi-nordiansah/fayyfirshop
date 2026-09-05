import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    Plus,
    Search,
    Edit3,
    Trash2,
    Calendar,
    MapPin,
    Ticket,
    X,
    Check,
    Percent,
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import { useLanguage } from '@/Contexts/LanguageContext';

export default function EventsTab({ events = [], vouchers = [] }) {
    const { t } = useLanguage();

    // Search filter
    const [searchEvent, setSearchEvent] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');

    // Form fields state
    const [eventFields, setEventFields] = useState({
        id: null,
        name: '',
        start_date: '',
        end_date: '',
        countries: [], // array string
        imageFile: null,
        image_path: '', // existing path
        is_active: true,
        discount_type: 'voucher', // 'voucher' | 'all_products'
        discount_percentage: '',
        vouchers: [] // array voucher_id
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
        setEventFields({
            id: null,
            name: '',
            start_date: getLocalNowString(0),
            end_date: getLocalNowString(7),
            countries: ['Indonesia'],
            imageFile: null,
            image_path: '',
            is_active: true,
            discount_type: 'voucher',
            discount_percentage: '',
            vouchers: []
        });
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setModalMode('edit');
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
            discount_type: item.discount_type || 'voucher',
            discount_percentage: item.discount_percentage !== null && item.discount_percentage !== undefined ? item.discount_percentage : '',
            vouchers: voucherIds
        });
        setIsModalOpen(true);
    };

    const saveForm = (e) => {
        e.preventDefault();
        const data = {
            name: eventFields.name,
            start_date: eventFields.start_date,
            end_date: eventFields.end_date,
            countries: eventFields.countries,
            is_active: eventFields.is_active ? 1 : 0,
            discount_type: eventFields.discount_type || 'voucher',
            discount_percentage: eventFields.discount_type === 'all_products' ? eventFields.discount_percentage : null,
            vouchers: eventFields.discount_type === 'voucher' ? eventFields.vouchers : []
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
    };

    const toggleActive = (item) => {
        const voucherIds = item.vouchers ? item.vouchers.map(v => v.id) : [];
        router.post(route('backoffice.promotion.event.update', item.id), {
            name: item.name,
            start_date: formatInputDate(item.start_date),
            end_date: formatInputDate(item.end_date),
            countries: item.countries,
            discount_type: item.discount_type || 'voucher',
            discount_percentage: item.discount_percentage,
            vouchers: item.discount_type === 'voucher' ? voucherIds : [],
            is_active: item.is_active ? 0 : 1
        });
    };

    const initiateDelete = (item) => {
        setPendingDelete(item);
    };

    const confirmDelete = () => {
        if (!pendingDelete) return;
        router.delete(route('backoffice.promotion.event.destroy', pendingDelete.id), {
            onSuccess: () => setPendingDelete(null)
        });
    };

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

    const filteredEvents = events.filter(item =>
        item.name.toLowerCase().includes(searchEvent.toLowerCase())
    );

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
                message={`${t('backoffice.promotion.confirm.delete_message', 'Are you sure you want to delete')} "${pendingDelete?.name}"?`}
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
                        placeholder={t('backoffice.promotion.event.search_placeholder', 'Cari event...')}
                        value={searchEvent}
                        onChange={(e) => setSearchEvent(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-900"
                    />
                </div>
                <button
                    onClick={openAddModal}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-800"
                >
                    <Plus className="w-4 h-4" />
                    {t('backoffice.promotion.event.add_button', 'Add Event')}
                </button>
            </div>

            {/* Events Grid layout */}
            {filteredEvents.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-medium border border-blue-50 rounded-lg bg-slate-50/10">
                    {t('backoffice.promotion.event.empty_state', 'Data kosong. Belum ada event.')}
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

                                        {item.image_path && (
                                            <a
                                                href={item.image_path}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-16 h-12 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden shrink-0 block hover:opacity-85 transition"
                                                title={t('backoffice.promotion.event.card.view_banner_tooltip', 'Lihat Banner Penuh')}
                                            >
                                                <img src={item.image_path} alt="Banner" className="w-full h-full object-cover" />
                                            </a>
                                        )}
                                    </div>

                                    {/* Country badges */}
                                    <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 w-fit">
                                        <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                        <span className="font-bold text-slate-700">{t('backoffice.promotion.event.card.applicable_in', 'Berlaku di:')}</span>
                                        <span>{item.countries?.map(c => t(`backoffice.promotion.event.country.${c.toLowerCase()}`, c)).join(', ') || '-'}</span>
                                    </div>
                                </div>

                                {/* Associated Vouchers or All Products Discount */}
                                <div>
                                    {item.discount_type === 'all_products' ? (
                                        <div>
                                            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                                                {t('backoffice.promotion.event.card.promo_type', 'Tipe Promosi')}
                                            </h4>
                                            <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 text-xs font-black uppercase px-3 py-1 rounded-lg border border-rose-200 shadow-xs">
                                                <Percent className="w-3.5 h-3.5 text-rose-600" />
                                                {t('backoffice.promotion.event.card.discount_all_badge', 'Diskon Semua Produk: {percent}%').replace('{percent}', item.discount_percentage || 0)}
                                            </span>
                                        </div>
                                    ) : (
                                        <div>
                                            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                                                {t('backoffice.promotion.event.card.linked_vouchers', 'Linked Vouchers ({count})').replace('{count}', linkedVouchersList.length)}
                                            </h4>
                                            {linkedVouchersList.length === 0 ? (
                                                <span className="text-xs text-slate-400 italic">{t('backoffice.promotion.event.card.no_vouchers_linked', 'No vouchers linked')}</span>
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
                                    )}
                                </div>

                                {/* Actions & Status row */}
                                <div className="flex items-center justify-between pt-3 border-t border-blue-50">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-500">{t('backoffice.promotion.event.card.status', 'Status:')}</span>
                                        <button
                                            onClick={() => toggleActive(item)}
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
                                            onClick={() => openEditModal(item)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50 border border-blue-100 rounded-lg transition"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                            {t('backoffice.promotion.event.card.edit', 'Edit')}
                                        </button>
                                        <button
                                            onClick={() => initiateDelete(item)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-100 rounded-lg transition"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            {t('backoffice.promotion.event.card.delete', 'Delete')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Event Form Modal Overlay */}
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
                                        ? t('backoffice.promotion.event.modal.add_title', 'Tambah Event Baru')
                                        : t('backoffice.promotion.event.modal.edit_title', 'Edit Event')}
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {t('backoffice.promotion.event.modal.breadcrumbs', 'Menu / Promotion / EVENT')}
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
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">{t('backoffice.promotion.event.form.name', 'Nama Event / Acara')}</label>
                                <input
                                    type="text"
                                    value={eventFields.name}
                                    onChange={(e) => setEventFields({ ...eventFields, name: e.target.value })}
                                    placeholder={t('backoffice.promotion.event.form.placeholder_name', 'Contoh: Kemerdekaan RI Ke-81')}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-950 font-bold"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">{t('backoffice.promotion.event.form.start_date', 'Tanggal Mulai Event')}</label>
                                    <input
                                        type="datetime-local"
                                        value={eventFields.start_date}
                                        onChange={(e) => setEventFields({ ...eventFields, start_date: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-950"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">{t('backoffice.promotion.event.form.end_date', 'Tanggal Berakhir Event')}</label>
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
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">{t('backoffice.promotion.event.form.applicable_countries', 'Berlaku di Negara')}</label>
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
                                            {t(`backoffice.promotion.event.country.${country.toLowerCase()}`, country)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Event Banner image upload */}
                            <div>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">{t('backoffice.promotion.event.form.banner_image', 'Gambar Event (Pop up Banner)')}</label>
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
                                    {t('backoffice.promotion.event.form.banner_hint', '*Gambar ini nantinya akan ditampilkan dalam format pop-up diskon saat pertama kali user masuk ke website Fayyfir Shop.')}
                                </p>
                            </div>

                            {/* Mode Promosi Event: Gunakan Voucher ATAU Discount Semua Product */}
                            <div className="border border-blue-100 rounded-xl p-4 bg-blue-50/30 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                                        {t('backoffice.promotion.event.form.promo_type_label', 'Pilihan Promosi Event')}
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setEventFields({ ...eventFields, discount_type: 'voucher' })}
                                            className={`p-3 rounded-xl border text-left flex items-start gap-3 transition cursor-pointer ${
                                                eventFields.discount_type === 'voucher'
                                                    ? 'bg-blue-950 border-blue-950 text-white shadow-md'
                                                    : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className={`p-2 rounded-lg ${eventFields.discount_type === 'voucher' ? 'bg-white/10 text-amber-300' : 'bg-blue-50 text-blue-950'}`}>
                                                <Ticket className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <span className="font-extrabold text-sm block">
                                                    {t('backoffice.promotion.event.form.use_voucher', 'Gunakan Voucher')}
                                                </span>
                                                <span className={`text-[11px] block mt-0.5 ${eventFields.discount_type === 'voucher' ? 'text-slate-300' : 'text-slate-400'}`}>
                                                    {t('backoffice.promotion.event.form.use_voucher_desc', 'Hubungkan satu atau beberapa voucher khusus.')}
                                                </span>
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setEventFields({ ...eventFields, discount_type: 'all_products' })}
                                            className={`p-3 rounded-xl border text-left flex items-start gap-3 transition cursor-pointer ${
                                                eventFields.discount_type === 'all_products'
                                                    ? 'bg-rose-700 border-rose-700 text-white shadow-md'
                                                    : 'bg-white border-slate-200 text-slate-700 hover:border-rose-300 hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className={`p-2 rounded-lg ${eventFields.discount_type === 'all_products' ? 'bg-white/10 text-white' : 'bg-rose-50 text-rose-600'}`}>
                                                <Percent className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <span className="font-extrabold text-sm block">
                                                    {t('backoffice.promotion.event.form.discount_all', 'Discount Semua Product')}
                                                </span>
                                                <span className={`text-[11px] block mt-0.5 ${eventFields.discount_type === 'all_products' ? 'text-rose-100' : 'text-slate-400'}`}>
                                                    {t('backoffice.promotion.event.form.discount_all_desc', 'Diskon otomatis semua produk tanpa terkecuali.')}
                                                </span>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* Content if Discount Semua Product */}
                                {eventFields.discount_type === 'all_products' ? (
                                    <div className="bg-white rounded-xl p-4 border border-rose-200 shadow-xs space-y-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                                {t('backoffice.promotion.event.form.percentage_label', 'Jumlah Persentase Discount (%)')}
                                            </label>
                                            <div className="relative max-w-xs">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="100"
                                                    step="0.1"
                                                    required={eventFields.discount_type === 'all_products'}
                                                    value={eventFields.discount_percentage}
                                                    onChange={(e) => setEventFields({ ...eventFields, discount_percentage: e.target.value })}
                                                    placeholder="Contoh: 15"
                                                    className="w-full px-3 py-2 pr-8 border border-rose-300 rounded-lg text-sm font-black text-rose-700 focus:outline-none focus:border-rose-600"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-black text-rose-500">%</span>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-rose-50/60 rounded-lg border border-rose-100 text-xs text-rose-800 space-y-1">
                                            <p className="font-bold">
                                                💡 {t('backoffice.promotion.event.form.percentage_hint_title', 'Ketentuan Diskon Semua Produk:')}
                                            </p>
                                            <p className="text-[11px] leading-relaxed text-rose-700">
                                                {t('backoffice.promotion.event.form.percentage_hint_desc', 'Seluruh produk dan varian akan otomatis terpotong sebesar persentase ini selama event aktif. Jika waktu event habis, harga otomatis kembali normal tanpa terkecuali.')}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    /* Content if Gunakan Voucher */
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-slate-700 uppercase">
                                            {t('backoffice.promotion.event.form.linked_vouchers_section', 'Pilih Voucher Terkait:')}
                                        </h4>
                                        {vouchers.length === 0 ? (
                                            <p className="text-xs text-slate-400 italic">{t('backoffice.promotion.event.form.no_vouchers_warning', 'Belum ada data voucher, buat voucher terlebih dahulu.')}</p>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-40 overflow-y-auto pr-1">
                                                {vouchers.map((v) => (
                                                    <button
                                                        type="button"
                                                        key={v.id}
                                                        onClick={() => toggleEventVoucher(v.id)}
                                                        className={`p-2.5 rounded-lg border text-left flex items-center justify-between text-xs transition cursor-pointer ${eventFields.vouchers.includes(v.id)
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
                                <label htmlFor="event_active" className="text-sm font-bold text-slate-707 select-none">
                                    {t('backoffice.promotion.event.form.is_active', 'Status Event Aktif')}
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
