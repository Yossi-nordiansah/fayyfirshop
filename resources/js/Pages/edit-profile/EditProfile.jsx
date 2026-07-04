import React, { useState, useEffect, useRef } from "react";
import { Head, Link, useForm, router } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import {
    User,
    Mail,
    Phone,
    MapPin,
    Check,
    Camera,
    Plus,
    Trash2,
    Edit,
    ShieldCheck
} from "lucide-react";
import { useLanguage } from "@/Contexts/LanguageContext";
import MainLayout from "@/Layouts/MainLayout";
import BaseRenderInput from "@/Components/register/RenderInput";
import ChangePasswordModal from "@/Components/edit-profile/ChangePasswordModal";
import AddressModal from "@/Components/edit-profile/AddressModal";

export default function EditProfile({ auth, mustVerifyEmail, status, flash, addresses = [] }) {
    const { t, locale } = useLanguage();
    const [clientErrors, setClientErrors] = useState({});
    const isRtl = locale === 'ar' || locale === 'arabic';
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);

    // Helper for avatar URL resolution
    const getAvatarUrl = () => {
        if (!auth.user.avatar) return '/images/default-profile.png';
        if (auth.user.avatar.startsWith('http') || auth.user.avatar.startsWith('/')) {
            return auth.user.avatar;
        }
        return `/storage/${auth.user.avatar}`;
    };

    const [avatarPreview, setAvatarPreview] = useState(getAvatarUrl());
    const avatarInputRef = useRef(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const currentTxt = {
        name_req: t("register.err.name_req", "Nama lengkap wajib diisi"),
        email_req: t("register.err.email_req", "Email wajib diisi"),
        email_val: t("register.err.email_val", "Format email tidak valid"),
        phone_req: t("register.err.phone_req", "Nomor telepon/WhatsApp wajib diisi"),
        placeholder_name: t("register.place.name", "Masukkan nama lengkap Anda"),
        placeholder_email: t("register.place.email", "Masukkan alamat email Anda"),
        placeholder_phone: t("register.place.phone", "Contoh: 081234567890"),
    };

    const { data, setData, post, processing, errors, reset } = useForm({
        name: auth.user.name || "",
        email: auth.user.email || "",
        phone: auth.user.phone || "",
        avatar: null,
        _method: "patch" // standard Laravel workaround for sending files via PATCH
    });

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setData('avatar', file);
        const previewUrl = URL.createObjectURL(file);
        setAvatarPreview(previewUrl);
    };

    // Handle profile update status message
    useEffect(() => {
        if (status === 'profile-updated') {
            setShowSuccess(true);
            const timer = setTimeout(() => setShowSuccess(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    const validateForm = () => {
        const errs = {};
        if (!data.name.trim()) errs.name = currentTxt.name_req;
        if (!data.email.trim()) {
            errs.email = currentTxt.email_req;
        } else if (!/\S+@\S+\.\S+/.test(data.email)) {
            errs.email = currentTxt.email_val;
        }
        if (!data.phone.trim()) errs.phone = currentTxt.phone_req;

        setClientErrors(errs);

        if (Object.keys(errs).length > 0) {
            const firstErrorKey = Object.keys(errs)[0];
            const element = document.getElementById(firstErrorKey);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.focus();
            }
        }

        return Object.keys(errs).length === 0;
    };

    const submit = (e) => {
        e.preventDefault();

        if (validateForm()) {
            post(route("profile.update"), {
                forceFormData: true,
                onSuccess: () => {
                    reset("password");
                },
                onFinish: () => reset("password"),
            });
        }
    };

    // Address Action Handlers
    const handleSaveAddress = async (addressData) => {
        if (addressData.id) {
            // Update existing
            await router.patch(route('addresses.update', addressData.id), addressData, {
                preserveScroll: true
            });
        } else {
            // Create new
            await router.post(route('addresses.store'), addressData, {
                preserveScroll: true
            });
        }
    };

    const handleDeleteAddress = (id) => {
        if (confirm(t('profile.confirm_delete_address', 'Apakah Anda yakin ingin menghapus alamat ini?'))) {
            router.delete(route('addresses.destroy', id), {
                preserveScroll: true
            });
        }
    };

    const handleSetDefaultAddress = (id) => {
        router.patch(route('addresses.set-default', id), {}, {
            preserveScroll: true
        });
    };

    const openAddAddressModal = () => {
        setEditingAddress(null);
        setIsAddressModalOpen(true);
    };

    const openEditAddressModal = (address) => {
        setEditingAddress(address);
        setIsAddressModalOpen(true);
    };

    return (
        <div className="min-h-screen text-slate-900 font-sans selection:bg-amber-500 selection:text-white lg:pt-20">
            <Head title={`Fayyfir - ${t("nav.account.profile", "Edit Profil")}`} />

            {/* Full-screen loading overlay */}
            {processing && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/70 backdrop-blur-sm">
                    <img src="/images/load.gif" alt="Loading" className="w-24 h-24 object-contain" />
                </div>
            )}

            <MainLayout>
                <div className="relative min-h-screen w-full flex items-center justify-center p-4 md:p-12 overflow-hidden bg-transparent select-none pt-28 pb-12">
                    <div className="relative z-10 w-full max-w-5xl bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xl p-6 md:p-12 min-h-[600px] flex flex-col justify-between">

                        {/* Success Message Banner */}
                        <AnimatePresence>
                            {(showSuccess || flash?.success) && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2 shadow-sm"
                                    dir={isRtl ? "rtl" : "ltr"}
                                >
                                    <Check size={18} className="text-emerald-600 shrink-0" />
                                    <span>{flash?.success || t("profile.success_message", "Profil Anda telah berhasil diperbarui.")}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Error/Warning Message Banner */}
                        {flash?.error && (
                            <div
                                className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium flex items-start gap-2 shadow-sm"
                                dir={isRtl ? "rtl" : "ltr"}
                            >
                                <span className="text-rose-600 shrink-0 mt-0.5">⚠️</span>
                                <span>{t(flash.error, flash.error)}</span>
                            </div>
                        )}

                        {/* Header Bagian Atas */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8" dir={isRtl ? "rtl" : "ltr"}>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-wide">
                                    {t("nav.account.profile", "Edit Profil")}
                                </h1>
                                <p className="text-xs text-slate-500 mt-1">
                                    {t("profile.subtitle", "Perbarui informasi profil dan detail kontak Anda")}
                                </p>
                            </div>
                            <div>
                                <Link href="/" className="text-xs text-slate-500 hover:text-amber-600 transition-colors uppercase tracking-wider font-semibold">
                                    {t("register.nav_home", "Beranda")}
                                </Link>
                            </div>
                        </div>

                        {/* Avatar Upload Section */}
                        <div className="flex flex-col items-center mb-8">
                            <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                                {/* Avatar Circle */}
                                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg ring-2 ring-amber-400 transition-all duration-300 group-hover:ring-amber-500 group-hover:shadow-xl">
                                    <img
                                        src={avatarPreview}
                                        alt="Profile Preview"
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                        referrerPolicy="no-referrer"
                                    />
                                </div>
                                {/* Camera overlay */}
                                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <Camera size={24} className="text-white" />
                                </div>
                                {/* Badge */}
                                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center shadow-md">
                                    <Camera size={13} className="text-white" />
                                </div>
                            </div>

                            {/* Hidden file input */}
                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                className="hidden"
                                onChange={handleAvatarChange}
                            />

                            <p className="mt-3 text-xs text-slate-500">
                                {t("register.avatar_hint", "Klik foto untuk mengganti (opsional, maks. 2MB)")}
                            </p>
                            {data.avatar && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600 font-medium"
                                >
                                    <Check size={13} />
                                    <span>{data.avatar.name}</span>
                                </motion.div>
                            )}
                        </div>

                        {/* Form Section */}
                        <form onSubmit={submit} className="flex flex-col mb-12">
                            <div className="grid grid-cols-1 gap-6 md:gap-8">
                                {/* Account Information */}
                                <div className="space-y-1">
                                    <h2 className="text-sm font-bold uppercase tracking-wider text-amber-600 mb-4 border-b border-slate-100 pb-2">
                                        {t("register.account_info", "Informasi Akun")}
                                    </h2>
                                    <BaseRenderInput
                                        label={t("register.name", "Nama Lengkap")}
                                        id="name"
                                        placeholder={currentTxt.placeholder_name}
                                        icon={User}
                                        data={data}
                                        setData={setData}
                                        errors={errors}
                                        clientErrors={clientErrors}
                                        isRtl={isRtl}
                                    />

                                    <BaseRenderInput
                                        label={t("register.email", "Alamat Email")}
                                        id="email"
                                        type="email"
                                        placeholder={currentTxt.placeholder_email}
                                        icon={Mail}
                                        data={data}
                                        setData={setData}
                                        errors={errors}
                                        clientErrors={clientErrors}
                                        isRtl={isRtl}
                                    />

                                    <BaseRenderInput
                                        label={t("register.phone", "Nomor Telepon / WhatsApp")}
                                        id="phone"
                                        type="tel"
                                        placeholder={currentTxt.placeholder_phone}
                                        icon={Phone}
                                        data={data}
                                        setData={setData}
                                        errors={errors}
                                        clientErrors={clientErrors}
                                        isRtl={isRtl}
                                    />

                                    <div className="pt-2">
                                        <button type="button" onClick={() => setIsPasswordModalOpen(true)} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs font-bold uppercase tracking-wider">
                                            {t("profile.button.change_password", "Ubah Kata Sandi")}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Submit Profile General Info Button */}
                            <div className="mt-8 flex justify-end items-center border-t border-slate-100 pt-6">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-slate-300 disabled:to-slate-400 text-white text-xs font-bold uppercase tracking-widest shadow-md hover:shadow-lg active:scale-95 transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                    {processing ? (
                                        t("register.btn_processing", "Memproses...")
                                    ) : (
                                        <>
                                            {t("profile.btn_submit", "Simpan Informasi Akun")}
                                            <Check size={14} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                        {/* Addresses Section */}
                        <div className="border-t border-slate-100 pt-8" dir={isRtl ? "rtl" : "ltr"}>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 tracking-wide">
                                        {t("profile.shipping_addresses", "Alamat Pengiriman")}
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {t("profile.shipping_addresses_subtitle", "Kelola alamat pengiriman pesanan Anda")}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={openAddAddressModal}
                                    className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95"
                                >
                                    <Plus size={16} />
                                    {t("profile.add_address", "Tambah Alamat")}
                                </button>
                            </div>

                            {/* Addresses List */}
                            {addresses.length === 0 ? (
                                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
                                    <MapPin className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                    <p className="text-sm text-slate-500 font-medium">
                                        {t("profile.no_addresses", "Belum ada alamat pengiriman.")}
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4 w-full">
                                    {addresses.map((addr) => (
                                        <div
                                            key={addr.id}
                                            className={`relative p-5 rounded-2xl border bg-white shadow-sm flex flex-col justify-between transition-all duration-300 ${
                                                addr.is_default
                                                    ? 'border-amber-400 ring-1 ring-amber-400/30 bg-amber-50/10'
                                                    : 'border-slate-100 hover:border-slate-200'
                                            }`}
                                        >
                                            <div>
                                                {/* Header card */}
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm text-slate-800">
                                                            {addr.receiver_name}
                                                        </span>
                                                        <span className="text-xs text-slate-500 font-medium mt-0.5">
                                                            {addr.phone}
                                                        </span>
                                                    </div>
                                                    {addr.is_default && (
                                                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-2.5 py-1 rounded-full shadow-sm">
                                                            <ShieldCheck size={12} />
                                                            {t("profile.default_badge", "Utama")}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Address Details */}
                                                <p className="text-xs text-slate-600 leading-relaxed font-medium mb-4">
                                                    {addr.address}<br />
                                                    {addr.district ? `${addr.district}, ` : ''}
                                                    {addr.city}, {addr.province} {addr.postal_code}
                                                </p>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-2 mt-auto pt-3 border-t border-slate-50">
                                                {!addr.is_default && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSetDefaultAddress(addr.id)}
                                                        className="text-[10px] font-bold text-slate-600 hover:text-amber-600 bg-slate-50 hover:bg-amber-50 border border-slate-100 hover:border-amber-100 px-3 py-1.5 rounded-lg transition-colors"
                                                    >
                                                        {t("profile.set_default", "Jadikan Utama")}
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => openEditAddressModal(addr)}
                                                    className="flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                                                >
                                                    <Edit size={12} />
                                                    {t("profile.edit_button", "Ubah")}
                                                </button>
                                                {!addr.is_default && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteAddress(addr.id)}
                                                        className="flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-100 hover:border-rose-100 px-3 py-1.5 rounded-lg transition-colors ml-auto"
                                                    >
                                                        <Trash2 size={12} />
                                                        {t("profile.delete_button", "Hapus")}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                </div>

            </MainLayout>
            <ChangePasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
            />
            <AddressModal
                isOpen={isAddressModalOpen}
                onClose={() => setIsAddressModalOpen(false)}
                onSave={handleSaveAddress}
                address={editingAddress}
                t={t}
                locale={locale}
            />
        </div>
    );
}