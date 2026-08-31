import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, User as UserIcon, Phone, ShieldCheck, AlertCircle, X, Check } from "lucide-react";
import { useLanguage } from "@/Contexts/LanguageContext";
import AddressModal from "@/Components/edit-profile/AddressModal";
import { router } from "@inertiajs/react";

export default function ShippingAddress({
    t,
    user,
    addressForm,
    setAddressForm,
    addresses = []
}) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const { locale } = useLanguage();

    const handleSaveAddress = async (addressData) => {
        await router.post(route('addresses.store'), addressData, {
            preserveScroll: true,
            onSuccess: () => {
                setIsAddModalOpen(false);
            }
        });
    };

    // Find the currently selected address from the addresses list
    const isSelected = (addr) => {
        if (addressForm.id) {
            return addr.id === addressForm.id;
        }
        return (
            addr.address === addressForm.address &&
            addr.receiver_name === addressForm.receiver_name &&
            addr.phone === addressForm.phone
        );
    };

    const handleSelectAddress = (addr) => {
        setAddressForm({
            id: addr.id,
            receiver_name: addr.receiver_name,
            phone: addr.phone,
            address: addr.address,
            province: addr.province,
            city: addr.city,
            district: addr.district,
            postal_code: addr.postal_code,
            area_id: addr.area_id,
            country: addr.country ?? 'ID',
        });
        setIsModalOpen(false);
    };

    return (
        <>
            <motion.section
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="p-6 bg-white border border-slate-100 shadow-xl shadow-slate-100/40 rounded-3xl backdrop-blur-sm"
            >
                {/* Header Section */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-100">
                    <h2 className="text-sm md:text-base font-extrabold text-slate-900 flex items-center gap-2.5">
                        <div className="p-1.5 bg-amber-50 rounded-xl border border-amber-100">
                            <MapPin className="text-amber-600" size={18} />
                        </div>
                        {t("checkout.address_section", "Alamat Pengiriman")}
                    </h2>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(true)}
                            className="lg:text-xs text-[10px] text-nowrap font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 border border-amber-200/50 hover:border-amber-200 px-3 py-1.5 rounded-xl shadow-sm transition-all duration-300 active:scale-95"
                        >
                            + {t("profile.address.add", "Tambah Alamat")}
                        </button>

                        {addresses.length > 1 && (
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(true)}
                                className="lg:text-xs text-[10px] text-nowrap font-semibold text-slate-600 hover:text-slate-700 bg-slate-50 border border-slate-200/55 hover:border-slate-250 px-3 py-1.5 rounded-xl shadow-sm transition-all duration-300 active:scale-95"
                            >
                                {t("profile.address.other", "Alamat lain")}
                            </button>
                        )}

                        {addressForm.area_id ? (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50/70 px-3 py-1.5 rounded-full border border-emerald-100 shadow-sm transition-all duration-300">
                                <ShieldCheck size={14} className="animate-pulse" />
                                <span>{t("checkout.address_verified", "Terverifikasi")}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50/70 px-3 py-1.5 rounded-full border border-rose-100 shadow-sm transition-all duration-300">
                                <AlertCircle size={14} />
                                <span>{t("checkout.address_unverified", "Alamat Belum Terverifikasi")}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Section */}
                <div className="text-slate-700 space-y-3.5">
                    {/* Receiver Info */}
                    <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm font-bold bg-slate-50/80 p-3 rounded-2xl border border-slate-100/50">
                        <div className="flex items-center gap-1.5 text-slate-800">
                            <UserIcon size={14} className="text-slate-400" />
                            <span>{t("checkout.receiver_label", "Penerima")}: {addressForm.receiver_name}</span>
                        </div>
                        <span className="text-slate-300 hidden sm:inline">|</span>
                        <div className="flex items-center gap-1.5 text-slate-600">
                            <Phone size={14} className="text-slate-400" />
                            <span>{addressForm.phone}</span>
                        </div>
                        {addressForm.area_id && (
                            <ShieldCheck size={16} className="text-emerald-600 ml-auto" />
                        )}
                    </div>

                    {/* Detail Address */}
                    <div className="space-y-1.5 pl-1">
                        <p className="text-sm leading-relaxed font-medium text-slate-600">
                            {addressForm.address}
                        </p>
                        <p className="text-xs font-semibold text-slate-400 tracking-wide">
                            {addressForm.district ? addressForm.district + ', ' : ''}
                            {addressForm.city}, {addressForm.province} {addressForm.postal_code}
                        </p>
                    </div>

                    {/* Logistics Verification Warning */}
                    {!addressForm.area_id && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-1.5 text-[10px] md:text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 border border-rose-200/60 rounded-xl"
                        >
                            <AlertCircle size={12} />
                            <span>{t("checkout.area_logistics_unverified", "Area Belum Terverifikasi (Biteship)")}</span>
                        </motion.div>
                    )}
                </div>
            </motion.section>

            {/* Address Selection Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            onClick={() => setIsModalOpen(false)}
                        />

                        {/* Modal Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="relative w-full max-w-xl max-h-[80vh] overflow-hidden rounded-3xl border border-slate-200 bg-white flex flex-col text-slate-800 shadow-2xl z-10"
                        >
                            {/* Accent Line */}
                            <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />

                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 md:px-8 md:py-5 border-b border-slate-100">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-amber-50 rounded-xl border border-amber-100">
                                        <MapPin className="h-5 w-5 text-amber-600" />
                                    </div>
                                    <h2 className="text-lg font-bold tracking-wide text-slate-900">
                                        {t('checkout.select_address_title', 'Pilih Alamat Pengiriman')}
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* List Container */}
                            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4">
                                {addresses.map((addr) => {
                                    const active = isSelected(addr);
                                    return (
                                        <div
                                            key={addr.id}
                                            onClick={() => handleSelectAddress(addr)}
                                            className={`group relative p-5 rounded-2xl border text-left cursor-pointer transition-all duration-300 flex items-start gap-4 ${active
                                                ? 'border-amber-400 bg-amber-50/10 ring-1 ring-amber-400/20'
                                                : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50/50'
                                                }`}
                                        >
                                            {/* Custom Radio Button */}
                                            <div className="mt-1 flex items-center justify-center shrink-0">
                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${active
                                                    ? 'border-amber-500 bg-amber-500 text-white'
                                                    : 'border-slate-350 bg-white group-hover:border-slate-400'
                                                    }`}>
                                                    {active && <Check size={12} strokeWidth={3} />}
                                                </div>
                                            </div>

                                            {/* Address Details */}
                                            <div className="flex-1">
                                                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                                    <span className="font-bold text-sm text-slate-800">
                                                        {addr.receiver_name}
                                                    </span>
                                                    <span className="text-slate-300">|</span>
                                                    <span className="text-xs text-slate-500 font-medium">
                                                        {addr.phone}
                                                    </span>
                                                    {addr.is_default && (
                                                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-2 py-0.5 rounded-full shadow-sm ml-auto">
                                                            {t("profile.default_badge", "Utama")}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                                    {addr.address}<br />
                                                    {addr.district ? `${addr.district}, ` : ''}
                                                    {addr.city}, {addr.province} {addr.postal_code}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 md:px-8 border-t border-slate-100 bg-slate-50 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-sm"
                                >
                                    {t('auth.password.btn_cancel', 'Batal')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add Address Modal */}
            <AddressModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSave={handleSaveAddress}
                address={null}
                t={t}
                locale={locale}
            />
        </>
    );
}