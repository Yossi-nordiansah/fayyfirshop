import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, User, Mail, Phone, Calendar, Globe2 } from 'lucide-react';

const getCountryName = (code) => {
    if (!code) return 'Indonesia';
    const upperCode = code.toUpperCase();
    const map = {
        'ID': 'Indonesia',
        'MY': 'Malaysia',
        'SA': 'Arab Saudi',
        'US': 'Amerika Serikat',
        'SG': 'Singapura',
    };
    return map[upperCode] || upperCode;
};

export default function CustomerDetailModal({ show = false, customer, onClose }) {
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
                                    <h3 className="text-lg font-extrabold">Detail Profil Pelanggan</h3>
                                    <p className="text-xs text-blue-200">Informasi lengkap akun customer</p>
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
                                {customer.avatar ? (
                                    <img
                                        src={`/storage/${customer.avatar}`}
                                        alt={customer.name}
                                        className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md animate-in zoom-in-50 duration-200"
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
                                        <span>Akun Aktif</span>
                                    </span>
                                </div>
                            </div>

                            {/* Information Fields */}
                            <div className="space-y-3">
                                <div className="grid grid-cols-3 border-b border-slate-100 pb-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">ID Customer</span>
                                    <span className="text-sm font-semibold text-slate-700 col-span-2">#{customer.id}</span>
                                </div>
                                <div className="grid grid-cols-3 border-b border-slate-100 pb-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Email</span>
                                    <span className="text-sm font-semibold text-slate-700 col-span-2 flex items-center gap-1.5">
                                        <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                                        {customer.email || '-'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 border-b border-slate-100 pb-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Telepon</span>
                                    <span className="text-sm font-semibold text-slate-700 col-span-2 flex items-center gap-1.5">
                                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                                        {customer.phone || '-'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 border-b border-slate-100 pb-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Alamat</span>
                                    <span className="text-sm font-semibold text-slate-600 col-span-2">
                                        Jl. Jenderal Sudirman No. 45, Kebayoran Baru, Jakarta Selatan, 12190
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 border-b border-slate-100 pb-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Negara</span>
                                    <span className="text-sm font-semibold text-slate-700 col-span-2 flex items-center gap-1.5 capitalize">
                                        <Globe2 className="w-4 h-4 text-slate-400 shrink-0" />
                                        <span>{getCountryName(customer.country)}</span>
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 border-b border-slate-100 pb-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Bergabung</span>
                                    <span className="text-sm font-semibold text-slate-700 col-span-2 flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                                        {formatDate(customer.created_at)}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Catatan</span>
                                    <span className="text-xs font-semibold text-slate-500 col-span-2 italic">
                                        Pelanggan prioritas terdaftar dengan aktivitas transaksi belanja berkala di Fayyfir Shop.
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
                                Tutup
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
