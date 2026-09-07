import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, User, Mail, Phone, Calendar, Globe2, MapPin } from 'lucide-react';
import { useLanguage } from '@/Contexts/LanguageContext';

const getCountryName = (code, t) => {
    if (!code) return '-';
    const upperCode = code.toUpperCase();
    const map = {
        'ID': t('backoffice.customer.country.id', 'Indonesia'),
        'MY': t('backoffice.customer.country.my', 'Malaysia'),
        'SA': t('backoffice.customer.country.sa', 'Arab Saudi'),
        'US': t('backoffice.customer.country.us', 'Amerika Serikat'),
        'SG': t('backoffice.customer.country.sg', 'Singapura'),
    };
    return map[upperCode] || upperCode;
};

const formatSingleAddress = (addr) => {
    if (!addr) return '-';
    const raw = (addr.address || '').trim();
    if (!raw && !addr.city && !addr.district && !addr.province) {
        return '-';
    }

    const parts = [];
    if (raw) parts.push(raw);
    const lower = raw.toLowerCase();

    if (addr.district) {
        const d = addr.district.trim();
        if (!lower.includes(d.toLowerCase())) {
            parts.push(d.toLowerCase().startsWith('kec') ? d : `Kec. ${d}`);
        }
    }

    if (addr.city) {
        const c = addr.city.trim();
        if (!lower.includes(c.toLowerCase())) {
            parts.push(c);
        }
    }

    if (addr.province) {
        const p = addr.province.trim();
        if (!lower.includes(p.toLowerCase())) {
            parts.push(p);
        }
    }

    if (addr.postal_code) {
        const pc = String(addr.postal_code).trim();
        if (!lower.includes(pc.toLowerCase())) {
            parts.push(pc);
        }
    }

    return parts.length > 0 ? parts.join(', ') : '-';
};

const getCustomerAddress = (customer) => {
    if (!customer) return '-';
    if (customer.formatted_address) return customer.formatted_address;
    if (customer.shipping_address) return customer.shipping_address;

    return formatSingleAddress(customer);
};

export default function CustomerDetailModal({ show = false, customer, onClose }) {
    const { t } = useLanguage();
    const [avatarError, setAvatarError] = useState(false);

    useEffect(() => {
        setAvatarError(false);
    }, [customer?.id, customer?.avatar]);

    if (!customer) return null;

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const mainAddress = getCustomerAddress(customer);
    const hasAddress = mainAddress && mainAddress !== '-';
    const addressesList = Array.isArray(customer.addresses) ? customer.addresses : [];

    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-blue-950/40 backdrop-blur-sm" onClick={onClose}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97, y: 10 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="w-full max-h-[90vh] max-w-xl rounded-xl border border-blue-50 bg-white shadow-2xl overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-950 to-blue-900 px-6 py-4 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3">
                                <User className="w-6 h-6" />
                                <div>
                                    <h3 className="text-lg font-extrabold">{t('backoffice.customer.detail_modal.title', 'Detail Profil Pelanggan')}</h3>
                                    <p className="text-xs text-blue-200">{t('backoffice.customer.detail_modal.subtitle', 'Informasi lengkap akun customer')}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-5 overflow-y-auto">
                            {/* Profile Card Section */}
                            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 shrink-0">
                                {customer.avatar && !avatarError ? (
                                    <img
                                        src={customer.avatar.startsWith('http') || customer.avatar.startsWith('/') ? customer.avatar : `/storage/${customer.avatar}`}
                                        alt={customer.name}
                                        className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md animate-in zoom-in-50 duration-200"
                                        referrerPolicy="no-referrer"
                                        onError={() => setAvatarError(true)}
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-800 font-extrabold border border-blue-200 flex items-center justify-center text-xl uppercase shadow-sm">
                                        {(customer.name || 'C').substring(0, 2)}
                                    </div>
                                )}
                                <div className="space-y-0.5">
                                    <h4 className="text-lg font-black text-blue-950 leading-tight">{customer.name}</h4>
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-0.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        <span>{t('backoffice.customer.detail_modal.active_account', 'Akun Aktif')}</span>
                                    </span>
                                </div>
                            </div>

                            {/* Information Fields */}
                            <div className="space-y-3">
                                <div className="grid grid-cols-3 border-b border-slate-100 pb-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{t('backoffice.customer.detail_modal.customer_id', 'ID Customer')}</span>
                                    <span className="text-sm font-semibold text-slate-700 col-span-2">#{customer.id}</span>
                                </div>
                                <div className="grid grid-cols-3 border-b border-slate-100 pb-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{t('backoffice.customer.detail_modal.email', 'Email')}</span>
                                    <span className="text-sm font-semibold text-slate-700 col-span-2 flex items-center gap-1.5">
                                        <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                                        {customer.email || '-'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 border-b border-slate-100 pb-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{t('backoffice.customer.detail_modal.phone', 'Telepon')}</span>
                                    <span className="text-sm font-semibold text-slate-700 col-span-2 flex items-center gap-1.5">
                                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                                        {customer.phone || '-'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 border-b border-slate-100 pb-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{t('backoffice.customer.detail_modal.address', 'Alamat')}</span>
                                    <div className="col-span-2 space-y-2">
                                        <span className={`text-sm font-semibold block leading-relaxed ${hasAddress ? 'text-slate-700' : 'text-slate-400'}`}>
                                            {mainAddress}
                                        </span>

                                        {/* If customer registered multiple addresses */}
                                        {addressesList.length > 1 && (
                                            <div className="mt-2 pt-2 border-t border-dashed border-slate-200">
                                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                                                    {t('backoffice.customer.detail_modal.other_addresses', 'Daftar Alamat Tersimpan ({count})').replace('{count}', addressesList.length)}
                                                </span>
                                                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                                    {addressesList.map((addr, idx) => (
                                                        <div
                                                            key={addr.id || idx}
                                                            className={`text-xs p-2 rounded-lg border ${
                                                                addr.is_default
                                                                    ? 'bg-blue-50/60 border-blue-200 text-blue-950 font-medium'
                                                                    : 'bg-slate-50 border-slate-200 text-slate-600'
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-between gap-1 mb-0.5">
                                                                <span className="font-bold text-slate-800">
                                                                    {addr.receiver_name || customer.name}
                                                                    {addr.phone && <span className="font-normal text-slate-500 ml-1">({addr.phone})</span>}
                                                                </span>
                                                                {addr.is_default && (
                                                                    <span className="text-[10px] bg-blue-600 text-white font-bold px-1.5 py-0.2 rounded shrink-0">
                                                                        {t('backoffice.customer.detail_modal.default_address_badge', 'Utama')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-[11px] leading-snug">
                                                                {formatSingleAddress(addr)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 border-b border-slate-100 pb-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{t('backoffice.customer.detail_modal.country', 'Negara')}</span>
                                    <span className="text-sm font-semibold text-slate-700 col-span-2 flex items-center gap-1.5 capitalize">
                                        <Globe2 className="w-4 h-4 text-slate-400 shrink-0" />
                                        <span>{getCountryName(customer.country, t)}</span>
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 border-b border-slate-100 pb-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{t('backoffice.customer.detail_modal.joined', 'Bergabung')}</span>
                                    <span className="text-sm font-semibold text-slate-700 col-span-2 flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                                        {formatDate(customer.created_at)}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{t('backoffice.customer.detail_modal.notes', 'Catatan')}</span>
                                    <span className="text-xs font-semibold text-slate-500 col-span-2 italic">
                                        {t('backoffice.customer.detail_modal.priority_notes', 'Pelanggan prioritas terdaftar dengan aktivitas transaksi belanja berkala di Fayyfir Shop.')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-slate-50 px-6 py-4 flex justify-end border-t border-slate-100 shrink-0">
                            <button
                                onClick={onClose}
                                className="rounded-lg bg-blue-950 hover:bg-blue-900 text-white font-bold px-5 py-2.5 text-sm active:scale-[0.98] transition shadow-md"
                            >
                                {t('backoffice.customer.button.close', 'Tutup')}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
