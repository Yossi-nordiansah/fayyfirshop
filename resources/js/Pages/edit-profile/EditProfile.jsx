import React, { useState, useEffect, useRef } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import {
    User,
    Mail,
    Lock,
    Phone,
    MapPin,
    Compass,
    Home,
    Check,
    Globe,
    Camera
} from "lucide-react";
import { useLanguage } from "@/Contexts/LanguageContext";
import axios from "axios";
import Navbar from "@/Components/Navbar";
import Footer from "@/Components/Footer";
import MainLayout from "@/Layouts/MainLayout";
import BaseRenderInput from "@/Components/register/RenderInput";
import BaseRenderTextArea from "@/Components/register/RenderTextArea";
import ChangePasswordModal from "@/Components/edit-profile/ChangePasswordModal";

export default function EditProfile({ auth, mustVerifyEmail, status }) {
    const { t, locale } = useLanguage();
    const [clientErrors, setClientErrors] = useState({});
    const isRtl = locale === 'ar';
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

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

    // Dropdown States untuk Wilayah Indonesia
    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [loadingCities, setLoadingCities] = useState(false);
    const [loadingDistricts, setLoadingDistricts] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Initial country selection based on whether user has an Indonesian district
    const initialCountry = auth.user.district ? "ID" : (auth.user.province ? "SA" : "ID");

    const currentTxt = {
        name_req: t("register.err.name_req", "Nama lengkap wajib diisi"),
        email_req: t("register.err.email_req", "Email wajib diisi"),
        email_val: t("register.err.email_val", "Format email tidak valid"),
        pass_len: t("register.err.pass_len", "Kata sandi minimal 8 karakter"),
        confirm_val: t("register.err.confirm_val", "Konfirmasi kata sandi tidak cocok"),
        phone_req: t("register.err.phone_req", "Nomor telepon/WhatsApp wajib diisi"),
        country_req: t("register.err.country_req", "Negara wajib diisi"),
        address_req: t("register.err.address_req", "Alamat lengkap wajib diisi"),
        province_req: t("register.err.province_req", "Provinsi wajib diisi"),
        city_req: t("register.err.city_req", "Kota/Kabupaten wajib diisi"),
        district_req: t("register.err.district_req", "Kecamatan wajib diisi"),
        postal_req: t("register.err.postal_req", "Kode pos wajib diisi"),

        placeholder_name: t("register.place.name", "Masukkan nama lengkap Anda"),
        placeholder_email: t("register.place.email", "Masukkan alamat email Anda"),
        placeholder_pass: t("register.place.pass", "Kosongkan jika tidak ingin mengubah"),
        placeholder_confirm: t("register.place.confirm", "Kosongkan jika tidak ingin mengubah"),
        placeholder_phone: t("register.place.phone", "Contoh: 081234567890"),
        placeholder_address: t("register.place.address", "Nama jalan, RT/RW, nomor rumah, kelurahan/kecamatan"),
        placeholder_postal: t("register.place.postal", "40123"),
    };

    const { data, setData, post, processing, errors, reset } = useForm({
        name: auth.user.name || "",
        email: auth.user.email || "",
        password: "",
        country: initialCountry,
        phone: auth.user.phone || "",
        address: auth.user.address || "",
        province: auth.user.province || "",
        city: auth.user.city || "",
        district: auth.user.district || "",
        postal_code: auth.user.postal_code || "",
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

    // Hydrate address lists on mount for existing Indonesian users
    useEffect(() => {
        if (data.country === "ID") {
            axios.get(route('api.provinces'))
                .then((res) => {
                    setProvinces(res.data);

                    // Auto-hydrate cities if user has an existing province
                    const userProv = res.data.find(p => p.name === auth.user.province);
                    if (userProv) {
                        setLoadingCities(true);
                        axios.get(`/api/cities/${userProv.code}`)
                            .then((cRes) => {
                                setCities(cRes.data);
                                setLoadingCities(false);

                                // Auto-hydrate districts if user has an existing city
                                const userCity = cRes.data.find(c => c.name === auth.user.city);
                                if (userCity) {
                                    setLoadingDistricts(true);
                                    axios.get(`/api/districts/${userCity.code}`)
                                        .then((dRes) => {
                                            setDistricts(dRes.data);
                                            setLoadingDistricts(false);
                                        })
                                        .catch(() => setLoadingDistricts(false));
                                }
                            })
                            .catch(() => setLoadingCities(false));
                    }
                })
                .catch((err) => console.error("Error fetching provinces:", err));
        } else {
            setProvinces([]);
            setCities([]);
            setDistricts([]);
        }
    }, [data.country]);

    // Handle profile update status message
    useEffect(() => {
        if (status === 'profile-updated') {
            setShowSuccess(true);
            const timer = setTimeout(() => setShowSuccess(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    // Handler ketika Provinsi berubah (Hanya untuk Indonesia)
    const handleProvinceChange = (provinceCode, provinceName) => {
        setData((prev) => ({
            ...prev,
            province: provinceCode ? provinceName : "",
            city: "",
            district: ""
        }));
        setCities([]);
        setDistricts([]);

        if (!provinceCode) return;

        setLoadingCities(true);
        axios.get(`/api/cities/${provinceCode}`)
            .then((res) => {
                setCities(res.data);
                setLoadingCities(false);
            })
            .catch(() => setLoadingCities(false));
    };

    // Handler ketika Kota berubah (Hanya untuk Indonesia)
    const handleCityChange = (cityCode, cityName) => {
        setData((prev) => ({
            ...prev,
            city: cityCode ? cityName : "",
            district: ""
        }));
        setDistricts([]);

        if (!cityCode) return;

        setLoadingDistricts(true);
        axios.get(`/api/districts/${cityCode}`)
            .then((res) => {
                setDistricts(res.data);
                setLoadingDistricts(false);
            })
            .catch(() => setLoadingDistricts(false));
    };

    const validateForm = () => {
        const errs = {};
        if (!data.name.trim()) errs.name = currentTxt.name_req;
        if (!data.email.trim()) {
            errs.email = currentTxt.email_req;
        } else if (!/\S+@\S+\.\S+/.test(data.email)) {
            errs.email = currentTxt.email_val;
        }

        if (!data.phone.trim()) errs.phone = currentTxt.phone_req;
        if (!data.country) errs.country = currentTxt.country_req;
        if (!data.address.trim()) errs.address = currentTxt.address_req;
        if (!data.province.trim()) errs.province = currentTxt.province_req;
        if (!data.city.trim()) errs.city = currentTxt.city_req;
        if (data.country === "ID" && !data.district.trim()) errs.district = currentTxt.district_req;
        if (!data.postal_code.trim()) errs.postal_code = currentTxt.postal_req;

        setClientErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const submit = (e) => {
        e.preventDefault();

        if (validateForm()) {
            // Must use post to standard patch endpoint to support files via _method patch payload
            post(route("profile.update"), {
                forceFormData: true,
                onSuccess: () => {
                    reset("password");
                },
                onFinish: () => reset("password"),
            });
        }
    };

    return (
        <div className="min-h-screen text-slate-900 font-sans selection:bg-amber-500 selection:text-white lg:pt-20">
            <Head title={t("nav.account.profile", "Edit Profil")} />

            {/* Full-screen loading overlay */}
            {processing && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/70 backdrop-blur-sm">
                    <img src="/images/load.gif" alt="Loading" className="w-24 h-24 object-contain" />
                </div>
            )}

            <Navbar alwaysSolid={true} />

            <MainLayout>
                <div className="relative min-h-screen w-full flex items-center justify-center p-4 md:p-12 overflow-hidden bg-transparent select-none pt-28 pb-12">
                    <div className="relative z-10 w-full max-w-5xl bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xl p-6 md:p-12 min-h-[600px] flex flex-col justify-between">

                        {/* Success Message Banner */}
                        <AnimatePresence>
                            {showSuccess && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2 shadow-sm"
                                    dir={isRtl ? "rtl" : "ltr"}
                                >
                                    <Check size={18} className="text-emerald-600 shrink-0" />
                                    <span>{t("profile.success_message", "Profil Anda telah berhasil diperbarui.")}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Header Bagian Atas */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8" dir={isRtl ? "rtl" : "ltr"}>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-['Cinzel'] font-bold text-slate-900 tracking-wide">
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
                        <form onSubmit={submit} className="flex flex-col">
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

                                    <button type="button" onClick={() => setIsPasswordModalOpen(true)} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                                        {t("profile.button.change_password", "Ubah Kata Sandi")}
                                    </button>
                                </div>

                                {/* Address & Contact Info */}
                                <div className="space-y-1">
                                    <h2 className="text-sm font-bold uppercase tracking-wider text-amber-600 mb-4 border-b border-slate-100 pb-2">
                                        {t("register.address_info", "Alamat & Kontak")}
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Country Selection */}
                                        <div className="relative mb-5" dir={isRtl ? "rtl" : "ltr"}>
                                            <label htmlFor="country" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 px-1">
                                                {t("register.country", "Wilayah Registrasi")} <span className="text-amber-600">*</span>
                                            </label>
                                            <div className="relative">
                                                <div className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none text-slate-400`}>
                                                    <Globe size={18} className="opacity-70" />
                                                </div>
                                                <select
                                                    id="country"
                                                    value={data.country}
                                                    onChange={(e) => {
                                                        setData((prev) => ({
                                                            ...prev,
                                                            country: e.target.value,
                                                            province: "",
                                                            city: "",
                                                            district: "",
                                                            address: "",
                                                            postal_code: ""
                                                        }));
                                                        setClientErrors({});
                                                    }}
                                                    className={`w-full bg-slate-50 text-slate-900 appearance-none ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all duration-300`}
                                                >
                                                    <option value="ID">{t("register.type_indonesia", "User Indonesia")}</option>
                                                    <option value="SA">{t("register.type_international", "User International / Saudi Arabia")}</option>
                                                </select>
                                            </div>
                                        </div>

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
                                    </div>

                                    {/* DYNAMIC REGIONAL FORM */}
                                    {data.country === "ID" ? (
                                        <div className="space-y-1">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {/* Provinsi */}
                                                <div className="mb-5">
                                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 px-1">
                                                        {t("register.province", "Provinsi")} <span className="text-amber-600">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <div className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none text-slate-400`}>
                                                            <Compass size={18} className="opacity-70" />
                                                        </div>
                                                        <select
                                                            value={provinces.find(p => p.name === data.province)?.code || ""}
                                                            onChange={(e) => {
                                                                const selectedOption = e.target.options[e.target.selectedIndex];
                                                                handleProvinceChange(e.target.value, selectedOption ? selectedOption.text : "");
                                                            }}
                                                            className={`w-full bg-slate-50 text-slate-900 appearance-none ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 rounded-xl border outline-none transition-all duration-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 ${(clientErrors.province || errors.province) ? 'border-red-500' : 'border-slate-200 hover:border-slate-300'}`}
                                                        >
                                                            <option value="">-- {t("register.select_province", "Pilih Provinsi")} --</option>
                                                            {provinces.map((p) => (
                                                                <option key={p.code} value={p.code}>{p.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    {(clientErrors.province || errors.province) && (
                                                        <p className="text-xs text-red-500 mt-1 px-1">{clientErrors.province || errors.province}</p>
                                                    )}
                                                </div>

                                                {/* Kota / Kabupaten */}
                                                <div className="mb-5">
                                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 px-1">
                                                        {t("register.city", "Kota / Kabupaten")} {loadingCities && <img src="/images/load.gif" alt="Loading" className="inline-block w-4 h-4 ml-1 align-middle" />} <span className="text-amber-600">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <div className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none text-slate-400`}>
                                                            <Home size={18} className="opacity-70" />
                                                        </div>
                                                        <select
                                                            value={cities.find(c => c.name === data.city)?.code || ""}
                                                            disabled={loadingCities || cities.length === 0}
                                                            onChange={(e) => {
                                                                const selectedOption = e.target.options[e.target.selectedIndex];
                                                                handleCityChange(e.target.value, selectedOption ? selectedOption.text : "");
                                                            }}
                                                            className={`w-full bg-slate-50 text-slate-900 appearance-none ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 rounded-xl border outline-none transition-all duration-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 disabled:opacity-60 ${(clientErrors.city || errors.city) ? 'border-red-500' : 'border-slate-200 hover:border-slate-300'}`}
                                                        >
                                                            <option value="">-- {t("register.select_city", "Pilih Kota")} --</option>
                                                            {cities.map((c) => (
                                                                <option key={c.code} value={c.code}>{c.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    {(clientErrors.city || errors.city) && (
                                                        <p className="text-xs text-red-500 mt-1 px-1">{clientErrors.city || errors.city}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {/* Kecamatan */}
                                                <div className="mb-5">
                                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 px-1">
                                                        {t("register.district", "Kecamatan")} {loadingDistricts && <img src="/images/load.gif" alt="Loading" className="inline-block w-4 h-4 ml-1 align-middle" />} <span className="text-amber-600">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <div className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none text-slate-400`}>
                                                            <MapPin size={18} className="opacity-70" />
                                                        </div>
                                                        <select
                                                            value={data.district}
                                                            disabled={loadingDistricts || districts.length === 0}
                                                            onChange={(e) => {
                                                                setData("district", e.target.value);
                                                            }}
                                                            className={`w-full bg-slate-50 text-slate-900 appearance-none ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 rounded-xl border outline-none transition-all duration-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 disabled:opacity-60 ${(clientErrors.district || errors.district) ? 'border-red-500' : 'border-slate-200 hover:border-slate-300'}`}
                                                        >
                                                            <option value="">-- {t("register.select_district", "Pilih Kecamatan")} --</option>
                                                            {districts.map((d) => (
                                                                <option key={d.code} value={d.name}>{d.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    {(clientErrors.district || errors.district) && (
                                                        <p className="text-xs text-red-500 mt-1 px-1">{clientErrors.district || errors.district}</p>
                                                    )}
                                                </div>

                                                {/* Kode Pos */}
                                                <BaseRenderInput
                                                    label={t("register.postal_code", "Kode Pos")}
                                                    id="postal_code"
                                                    placeholder={currentTxt.placeholder_postal}
                                                    icon={Home}
                                                    data={data}
                                                    setData={setData}
                                                    errors={errors}
                                                    clientErrors={clientErrors}
                                                    isRtl={isRtl}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        /* International (Saudi Arabia) */
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                                            <BaseRenderInput
                                                label={t("register.sa_region", "Wilayah / Provinsi (Region)")}
                                                id="province"
                                                placeholder={t("register.place.sa_region", "Misal: Makkah Region")}
                                                icon={Compass}
                                                data={data}
                                                setData={setData}
                                                errors={errors}
                                                clientErrors={clientErrors}
                                                isRtl={isRtl}
                                            />

                                            <BaseRenderInput
                                                label={t("register.sa_city", "Kota (City)")}
                                                id="city"
                                                placeholder={t("register.place.sa_city", "Misal: Jeddah / Mecca")}
                                                icon={Home}
                                                data={data}
                                                setData={setData}
                                                errors={errors}
                                                clientErrors={clientErrors}
                                                isRtl={isRtl}
                                            />

                                            <BaseRenderInput
                                                label={t("register.sa_postal", "Kode Pos / ZIP (5 Digit)")}
                                                id="postal_code"
                                                placeholder="21577"
                                                icon={Home}
                                                data={data}
                                                setData={setData}
                                                errors={errors}
                                                clientErrors={clientErrors}
                                                isRtl={isRtl}
                                            />
                                        </div>
                                    )}

                                    <BaseRenderTextArea
                                        label={data.country === "ID" ? t("register.address", "Alamat Lengkap Pengiriman") : t("register.sa_address", "Detail Alamat / Nama Jalan / No. Bangunan")}
                                        id="address"
                                        placeholder={data.country === "ID" ? currentTxt.placeholder_address : t("register.place.sa_address", "Nama jalan, nomor bangunan (4 digit), atau distrik")}
                                        icon={MapPin}
                                        data={data}
                                        setData={setData}
                                        errors={errors}
                                        clientErrors={clientErrors}
                                        isRtl={isRtl}
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
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
                                            {t("profile.btn_submit", "Simpan Perubahan")}
                                            <Check size={14} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <Footer />
            </MainLayout>
            <ChangePasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
            />
        </div>
    );
}