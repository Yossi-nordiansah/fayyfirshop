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
    Camera,
    Eye,
    EyeOff,
    Plus,
    Trash2,
    ShieldCheck
} from "lucide-react";
import { useLanguage } from "@/Contexts/LanguageContext";
import axios from "axios";
import MainLayout from "@/Layouts/MainLayout";
import BaseRenderInput from "@/Components/register/RenderInput";

export default function Register({ auth, flash }) {
    const { t, locale } = useLanguage();
    const [clientErrors, setClientErrors] = useState({});
    const isRtl = locale === 'arabic';

    const user = auth?.user;
    const getAvatarUrl = () => {
        if (!user?.avatar) return '/images/default-profile.png';
        if (user.avatar.startsWith('http') || user.avatar.startsWith('/')) {
            return user.avatar;
        }
        return `/storage/${user.avatar}`;
    };

    const [avatarPreview, setAvatarPreview] = useState(getAvatarUrl());
    const avatarInputRef = useRef(null);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // regional dropdown states by index
    const [provinces, setProvinces] = useState([]);
    const [citiesForIndex, setCitiesForIndex] = useState({});
    const [districtsForIndex, setDistrictsForIndex] = useState({});
    const [loadingCities, setLoadingCities] = useState({});
    const [loadingDistricts, setLoadingDistricts] = useState({});

    // international country list
    const [countries, setCountries] = useState([]);
    const [loadingCountries, setLoadingCountries] = useState(false);

    const currentTxt = {
        name_req: t("register.err.name_req", "Nama lengkap wajib diisi"),
        email_req: t("register.err.email_req", "Email wajib diisi"),
        email_val: t("register.err.email_val", "Format email tidak valid"),
        pass_req: t("register.err.pass_req", "Kata sandi wajib diisi"),
        pass_len: t("register.err.pass_len", "Kata sandi minimal 8 karakter"),
        confirm_val: t("register.err.confirm_val", "Konfirmasi kata sandi tidak cocok"),
        phone_req: t("register.err.phone_req", "Nomor telepon/WhatsApp wajib diisi"),
        placeholder_name: t("register.place.name", "Masukkan nama lengkap Anda"),
        placeholder_email: t("register.place.email", "Masukkan alamat email Anda"),
        placeholder_pass: t("register.place.pass", "Minimal 8 karakter"),
        placeholder_confirm: t("register.place.confirm", "Ulangi kata sandi"),
        placeholder_phone: t("register.place.phone", "Contoh: 081234567890"),
        address_missing: t("register.err.address_missing", "Mohon tambahkan setidaknya 1 alamat pengiriman."),
    };

    // Prepopulate addresses array. Starts with 1 empty form initially if not logged in.
    const initialAddresses = user?.address ? [{
        id: 'initial',
        receiver_name: user.receiver_name || user.name || "",
        phone: user.phone || "",
        country: user.country || "ID",
        province: user.province || "",
        city: user.city || "",
        district: user.district || "",
        postal_code: user.postal_code || "",
        address: user.address || "",
        is_default: true,
    }] : [{
        id: 'initial-' + Date.now(),
        receiver_name: "",
        phone: "",
        country: "ID",
        province: "",
        city: "",
        district: "",
        postal_code: "",
        address: "",
        is_default: true,
    }];

    const { data, setData, post, processing, errors, reset } = useForm({
        name: user?.name || "",
        email: user?.email || "",
        password: "",
        password_confirmation: "",
        phone: user?.phone || "",
        avatar: null,
        addresses: initialAddresses,
    });

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setData('avatar', file);
        const previewUrl = URL.createObjectURL(file);
        setAvatarPreview(previewUrl);
    };

    // Load provinces and countries on mount
    useEffect(() => {
        axios.get(route('api.provinces'))
            .then((res) => setProvinces(res.data))
            .catch((err) => console.error("Error fetching provinces:", err));

        setLoadingCountries(true);
        axios.get('/api/countries')
            .then((res) => {
                setCountries(res.data);
                setLoadingCountries(false);
            })
            .catch((err) => {
                console.error("Error fetching countries:", err);
                setLoadingCountries(false);
            });
    }, []);

    // Hydrate existing cities & districts for index on load if country === 'ID'
    useEffect(() => {
        if (provinces.length === 0) return;

        data.addresses.forEach((addr, index) => {
            if (addr.country === 'ID' && addr.province) {
                const matchedProv = provinces.find(p => p.name === addr.province);
                if (matchedProv && !citiesForIndex[index]) {
                    setLoadingCities(prev => ({ ...prev, [index]: true }));
                    axios.get(`/api/cities/${matchedProv.code}`)
                        .then(cRes => {
                            setCitiesForIndex(prev => ({ ...prev, [index]: cRes.data }));
                            setLoadingCities(prev => ({ ...prev, [index]: false }));

                            if (addr.city) {
                                const matchedCity = cRes.data.find(c => c.name === addr.city);
                                if (matchedCity && !districtsForIndex[index]) {
                                    setLoadingDistricts(prev => ({ ...prev, [index]: true }));
                                    axios.get(`/api/districts/${matchedCity.code}`)
                                        .then(dRes => {
                                            setDistrictsForIndex(prev => ({ ...prev, [index]: dRes.data }));
                                            setLoadingDistricts(prev => ({ ...prev, [index]: false }));
                                        })
                                        .catch(() => setLoadingDistricts(prev => ({ ...prev, [index]: false })));
                                }
                            }
                        })
                        .catch(() => setLoadingCities(prev => ({ ...prev, [index]: false })));
                }
            }
        });
    }, [provinces, data.addresses]);

    const handleProvinceChange = (index, provinceCode, provinceName) => {
        const updated = [...data.addresses];
        updated[index].province = provinceCode ? provinceName : "";
        updated[index].city = "";
        updated[index].district = "";
        setData('addresses', updated);

        setCitiesForIndex(prev => ({ ...prev, [index]: [] }));
        setDistrictsForIndex(prev => ({ ...prev, [index]: [] }));

        if (!provinceCode) return;

        setLoadingCities(prev => ({ ...prev, [index]: true }));
        axios.get(`/api/cities/${provinceCode}`)
            .then((res) => {
                setCitiesForIndex(prev => ({ ...prev, [index]: res.data }));
                setLoadingCities(prev => ({ ...prev, [index]: false }));
            })
            .catch(() => setLoadingCities(prev => ({ ...prev, [index]: false })));
    };

    const handleCityChange = (index, cityCode, cityName) => {
        const updated = [...data.addresses];
        updated[index].city = cityCode ? cityName : "";
        updated[index].district = "";
        setData('addresses', updated);

        setDistrictsForIndex(prev => ({ ...prev, [index]: [] }));

        if (!cityCode) return;

        setLoadingDistricts(prev => ({ ...prev, [index]: true }));
        axios.get(`/api/districts/${cityCode}`)
            .then((res) => {
                setDistrictsForIndex(prev => ({ ...prev, [index]: res.data }));
                setLoadingDistricts(prev => ({ ...prev, [index]: false }));
            })
            .catch(() => setLoadingDistricts(prev => ({ ...prev, [index]: false })));
    };

    const handleAddressFieldChange = (index, field, value) => {
        const updated = [...data.addresses];
        updated[index][field] = value;
        setData('addresses', updated);
    };

    const handleAddAddress = () => {
        const newAddress = {
            id: 'new-' + Date.now() + Math.random(),
            receiver_name: "",
            phone: "",
            country: "ID",
            province: "",
            city: "",
            district: "",
            postal_code: "",
            address: "",
            is_default: false,
        };
        setData('addresses', [...data.addresses, newAddress]);
    };

    const handleDeleteAddress = (id) => {
        const remaining = data.addresses.filter(a => a.id !== id);
        if (remaining.length > 0 && !remaining.some(a => a.is_default)) {
            remaining[0].is_default = true;
        }
        setData('addresses', remaining);
    };

    const handleSetDefaultAddress = (index) => {
        setData('addresses', data.addresses.map((a, i) => ({ ...a, is_default: i === index })));
    };

    const validateForm = () => {
        const errs = {};
        if (!data.name.trim()) errs.name = currentTxt.name_req;
        if (!data.email.trim()) {
            errs.email = currentTxt.email_req;
        } else if (!/\S+@\S+\.\S+/.test(data.email)) {
            errs.email = currentTxt.email_val;
        }
        if (!user) {
            if (!data.password) {
                errs.password = currentTxt.pass_req;
            } else if (data.password.length < 8) {
                errs.password = currentTxt.pass_len;
            }
            if (data.password !== data.password_confirmation) {
                errs.password_confirmation = currentTxt.confirm_val;
            }
        }

        if (!data.phone.trim()) errs.phone = currentTxt.phone_req;

        if (data.addresses.length === 0) {
            errs.addresses = currentTxt.address_missing;
        } else {
            data.addresses.forEach((addr, idx) => {
                if (!addr.receiver_name.trim()) {
                    errs[`address_receiver_name_${idx}`] = t("validation.checkout.recipient_name_required", "Nama penerima wajib diisi");
                }
                if (!addr.phone.trim()) {
                    errs[`address_phone_${idx}`] = t("register.err.phone_req", "Nomor telepon/WhatsApp wajib diisi");
                }
                if (!addr.address.trim()) {
                    errs[`address_address_${idx}`] = t("register.err.address_req", "Alamat lengkap wajib diisi");
                }
                if (!addr.postal_code.trim()) {
                    errs[`address_postal_code_${idx}`] = t("register.err.postal_req", "Kode pos wajib diisi");
                }
                if (addr.country === "ID") {
                    if (!addr.province) errs[`address_province_${idx}`] = t("register.err.province_req", "Provinsi wajib diisi");
                    if (!addr.city) errs[`address_city_${idx}`] = t("register.err.city_req", "Kota/Kabupaten wajib diisi");
                    if (!addr.district) errs[`address_district_${idx}`] = t("register.err.district_req", "Kecamatan wajib diisi");
                } else {
                    if (!addr.country) errs[`address_country_${idx}`] = t("register.err.country_req", "Negara wajib diisi");
                    if (!addr.city) errs[`address_city_${idx}`] = t("register.err.city_req", "Kota wajib diisi");
                }
            });
        }

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
            post(route("register"), {
                forceFormData: true,
                onFinish: () => reset("password", "password_confirmation"),
            });
        }
    };

    return (
        <div className="min-h-screen font-sans text-slate-900 selection:bg-amber-500 selection:text-white md:pt-16 lg:pt-20">
            <Head title={`Fayyfir - ${user ? t("register.complete_title", "Lengkapi Pendaftaran") : t("register.title", "Daftar Akun")}`} />

            {processing && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/70 backdrop-blur-sm">
                    <img src="/images/load.gif" alt="Loading" className="object-contain w-24 h-24" />
                </div>
            )}

            <MainLayout>
                <div className="relative flex items-center justify-center w-full min-h-screen p-4 pb-12 overflow-hidden bg-transparent select-none md:p-12 pt-28">
                    <div className="relative z-10 w-full max-w-5xl bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xl py-6 px-3 md:p-12 min-h-[600px] flex flex-col justify-between">

                         <div className="flex flex-col items-start justify-between gap-4 mb-8 sm:flex-row sm:items-center" dir={isRtl ? "rtl" : "ltr"}>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-wide">
                                    {user ? t("register.complete_title", "Lengkapi Pendaftaran") : t("register.title", "Daftar Akun")}
                                </h1>
                                <p className="mt-1 text-xs text-slate-500">
                                    {user ? t("register.complete_subtitle", "Silakan lengkapi informasi profil Anda untuk melanjutkan pembelian") : t("register.subtitle", "Silakan lengkapi informasi di bawah untuk mendaftar")}
                                </p>
                            </div>
                            <div>
                                <Link href="/" className="text-xs font-semibold tracking-wider uppercase transition-colors text-slate-500 hover:text-amber-600">
                                    {t("register.nav_home", "Beranda")}
                                </Link>
                            </div>
                        </div>

                        {/* Quick Register / Login with Google */}
                        {!user && (
                            <div className="mb-6 flex flex-col items-center">
                                <a
                                    href={route('auth.google', { redirect: typeof window !== 'undefined' ? window.location.href : '' })}
                                    className="flex items-center justify-center gap-3 w-full max-w-md px-6 py-3 text-xs font-bold tracking-widest text-slate-700 uppercase transition-all duration-300 shadow-sm border border-slate-200 hover:bg-slate-50 rounded-xl hover:shadow active:scale-95 bg-white"
                                >
                                    <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                                    </svg>
                                    {t("register.btn_google", "Daftar dengan Google")}
                                </a>
                                <div className="w-full max-w-md flex items-center justify-center my-4">
                                    <span className="h-px bg-slate-200 grow"></span>
                                    <span className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("register.or_divider", "atau")}</span>
                                    <span className="h-px bg-slate-200 grow"></span>
                                </div>
                            </div>
                        )}

                        {/* Error/Warning Message Banner */}
                        {flash?.error && (
                            <div
                                className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium flex items-start gap-2 shadow-sm max-w-md mx-auto w-full"
                                dir={isRtl ? "rtl" : "ltr"}
                            >
                                <span className="text-rose-600 shrink-0 mt-0.5">⚠️</span>
                                <span>{t(flash.error, flash.error)}</span>
                            </div>
                        )}

                        {/* Avatar Upload */}
                        <div className="flex flex-col items-center mb-8">
                            <div className="relative cursor-pointer group" onClick={() => avatarInputRef.current?.click()}>
                                <div className="overflow-hidden transition-all duration-300 border-4 border-white rounded-full shadow-lg w-28 h-28 ring-2 ring-amber-400 group-hover:ring-amber-500 group-hover:shadow-xl">
                                    <img src={avatarPreview} alt="Profile Preview" className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110" referrerPolicy="no-referrer" />
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 rounded-full opacity-0 bg-black/40 group-hover:opacity-100">
                                    <Camera size={24} className="text-white" />
                                </div>
                                <div className="absolute flex items-center justify-center w-8 h-8 border-2 border-white rounded-full shadow-md -bottom-1 -right-1 bg-amber-500">
                                    <Camera size={13} className="text-white" />
                                </div>
                            </div>
                            <input ref={avatarInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
                            <p className="mt-3 text-xs text-slate-500">{t("register.avatar_hint", "Klik foto untuk mengganti (opsional, maks. 2MB)")}</p>
                            {data.avatar && (
                                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                                    <Check size={13} />
                                    <span>{data.avatar.name}</span>
                                </motion.div>
                            )}
                        </div>

                        <form onSubmit={submit} className="flex flex-col">
                            <div className="grid grid-cols-1 gap-6 md:gap-8">
                                <div className="space-y-1">
                                    <h2 className="pb-2 mb-4 text-sm font-bold tracking-wider uppercase border-b text-amber-600 border-slate-100">
                                        {t("register.account_info", "Informasi Akun")}
                                    </h2>
                                    <BaseRenderInput label={t("register.name", "Nama Lengkap")} id="name" placeholder={currentTxt.placeholder_name} icon={User} data={data} setData={setData} errors={errors} clientErrors={clientErrors} isRtl={isRtl} disabled={!!user} />
                                    <BaseRenderInput label={t("register.email", "Alamat Email")} id="email" type="email" placeholder={currentTxt.placeholder_email} icon={Mail} data={data} setData={setData} errors={errors} clientErrors={clientErrors} isRtl={isRtl} disabled={!!user} />
                                    <BaseRenderInput label={t("register.phone", "Nomor Telepon / WhatsApp")} id="phone" type="tel" placeholder={currentTxt.placeholder_phone} icon={Phone} data={data} setData={setData} errors={errors} clientErrors={clientErrors} isRtl={isRtl} />

                                    {!user && (
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div className="w-full">
                                                <label htmlFor="password" className="block mb-1 text-sm font-medium text-zinc-700">{t("register.password", "Kata Sandi")}</label>
                                                <div className="relative rounded-md shadow-sm">
                                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-400"><Lock size={18} /></div>
                                                    <input type={showPassword ? "text" : "password"} id="password" value={data.password} onChange={(e) => setData("password", e.target.value)} placeholder={currentTxt.placeholder_pass} className={`block w-full rounded-lg border bg-white pl-10 pr-10 py-2.5 text-zinc-900 text-sm outline-none transition-all duration-300 ${(clientErrors.password || errors.password) ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500" : "border-zinc-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 hover:border-zinc-400"}`} />
                                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-600">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                                                </div>
                                                {(clientErrors.password || errors.password) && <p className="px-1 mt-1 text-xs text-red-500">{clientErrors.password || errors.password}</p>}
                                            </div>

                                            <div className="w-full">
                                                <label htmlFor="password_confirmation" className="block mb-1 text-sm font-medium text-zinc-700">{t("register.password_confirm", "Konfirmasi Sandi")}</label>
                                                <div className="relative rounded-md shadow-sm">
                                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-400"><Lock size={18} /></div>
                                                    <input type={showConfirmPassword ? "text" : "password"} id="password_confirmation" value={data.password_confirmation} onChange={(e) => setData("password_confirmation", e.target.value)} placeholder={currentTxt.placeholder_confirm} className={`block w-full rounded-lg border bg-white pl-10 pr-10 py-2.5 text-zinc-900 text-sm outline-none transition-all duration-300 ${(clientErrors.password_confirmation || errors.password_confirmation) ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500" : "border-zinc-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 hover:border-zinc-400"}`} />
                                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-600">{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                                                </div>
                                                {(clientErrors.password_confirmation || errors.password_confirmation) && <p className="px-1 mt-1 text-xs text-red-500">{clientErrors.password_confirmation || errors.password_confirmation}</p>}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Addresses List Section - Stacked vertically at full width */}
                                <div className="space-y-6 mt-6" dir={isRtl ? "rtl" : "ltr"}>
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-2">
                                        <h2 className="text-sm font-bold tracking-wider uppercase text-amber-600">
                                            {t("profile.shipping_addresses", "Alamat Pengiriman")}
                                        </h2>
                                    </div>

                                    {clientErrors.addresses && (
                                        <p className="text-xs text-red-500 font-bold mb-3">{clientErrors.addresses}</p>
                                    )}
                                    {errors.addresses && (
                                        <p className="text-xs text-red-500 font-bold mb-3">{errors.addresses}</p>
                                    )}

                                    <div className="flex flex-col gap-6 w-full">
                                        {data.addresses.map((address, index) => (
                                            <div
                                                key={address.id}
                                                className={`relative p-6 rounded-2xl border bg-white shadow-sm flex flex-col gap-5 transition-all duration-300 ${
                                                    address.is_default
                                                        ? 'border-amber-400 ring-1 ring-amber-400/20 bg-amber-50/5'
                                                        : 'border-slate-100 hover:border-slate-200'
                                                }`}
                                            >
                                                {/* Address Header */}
                                                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                                            {index === 0 ? t("profile.primary_address", "Alamat Utama") : `${t("profile.additional_address", "Alamat Tambahan")} #${index}`}
                                                        </h3>
                                                        {address.is_default && (
                                                            <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-2 py-0.5 rounded-full shadow-sm">
                                                                <ShieldCheck size={10} />
                                                                {t("profile.default_badge", "Utama")}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        {index > 0 && !address.is_default && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSetDefaultAddress(index)}
                                                                className="text-[10px] font-bold text-slate-600 hover:text-amber-600 bg-slate-50 hover:bg-amber-50 border border-slate-150 px-2.5 py-1.5 rounded-lg transition-colors"
                                                            >
                                                                {t("profile.set_default", "Jadikan Utama")}
                                                            </button>
                                                        )}
                                                        {index > 0 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteAddress(address.id)}
                                                                className="flex items-center gap-1 text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-150 px-2.5 py-1.5 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 size={13} />
                                                                {t("profile.delete_button", "Hapus Alamat")}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Address Form Inputs */}
                                                <div className="space-y-4 text-left">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        {/* Receiver Name */}
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 px-1">
                                                                {t('register.receiver_name', 'Nama Penerima')} <span className="text-amber-600">*</span>
                                                            </label>
                                                            <div className="relative">
                                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                                                    <User size={18} />
                                                                </div>
                                                                <input
                                                                    id={`address_receiver_name_${index}`}
                                                                    type="text"
                                                                    value={address.receiver_name}
                                                                    onChange={e => handleAddressFieldChange(index, 'receiver_name', e.target.value)}
                                                                    placeholder={t('register.placeholder_receiver', 'Masukkan nama penerima')}
                                                                    className={`w-full bg-slate-50 text-slate-900 py-3 pl-10 pr-4 rounded-xl border outline-none transition-all duration-300 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 ${clientErrors[`address_receiver_name_${index}`] || errors[`addresses.${index}.receiver_name`] ? 'border-red-500' : 'border-slate-200'}`}
                                                                />
                                                            </div>
                                                            {(clientErrors[`address_receiver_name_${index}`] || errors[`addresses.${index}.receiver_name`]) && (
                                                                <p className="text-xs text-red-500 px-1">{clientErrors[`address_receiver_name_${index}`] || errors[`addresses.${index}.receiver_name`]}</p>
                                                            )}
                                                        </div>

                                                        {/* Phone */}
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 px-1">
                                                                {t('register.phone', 'Nomor Telepon / WhatsApp')} <span className="text-amber-600">*</span>
                                                            </label>
                                                            <div className="relative">
                                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                                                    <Phone size={18} />
                                                                </div>
                                                                <input
                                                                    id={`address_phone_${index}`}
                                                                    type="tel"
                                                                    value={address.phone}
                                                                    onChange={e => handleAddressFieldChange(index, 'phone', e.target.value)}
                                                                    placeholder={currentTxt.placeholder_phone}
                                                                    className={`w-full bg-slate-50 text-slate-900 py-3 pl-10 pr-4 rounded-xl border outline-none transition-all duration-300 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 ${clientErrors[`address_phone_${index}`] || errors[`addresses.${index}.phone`] ? 'border-red-500' : 'border-slate-200'}`}
                                                                />
                                                            </div>
                                                            {(clientErrors[`address_phone_${index}`] || errors[`addresses.${index}.phone`]) && (
                                                                <p className="text-xs text-red-500 px-1">{clientErrors[`address_phone_${index}`] || errors[`addresses.${index}.phone`]}</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        {/* Country Type Selection */}
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 px-1">
                                                                {t('register.country', 'Wilayah / Negara')} <span className="text-amber-600">*</span>
                                                            </label>
                                                            <div className="relative">
                                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                                                    <Globe size={18} />
                                                                </div>
                                                                <select
                                                                    value={address.country === 'ID' ? 'ID' : 'INTL'}
                                                                    onChange={e => {
                                                                        const val = e.target.value;
                                                                        handleAddressFieldChange(index, 'country', val === 'ID' ? 'ID' : '');
                                                                        handleProvinceChange(index, '', '');
                                                                    }}
                                                                    className="w-full bg-slate-50 text-slate-900 appearance-none py-3 pl-10 pr-8 rounded-xl border border-slate-200 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all"
                                                                >
                                                                    <option value="ID">{t('register.type_indonesia', 'User Indonesia')}</option>
                                                                    <option value="INTL">{t('register.type_international', 'User Internasional')}</option>
                                                                </select>
                                                            </div>
                                                        </div>

                                                        {/* International Country Select */}
                                                        {address.country !== 'ID' && (
                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 px-1">
                                                                    {t('register.country_label', 'Negara (Country)')} <span className="text-amber-600">*</span>
                                                                </label>
                                                                <div className="relative">
                                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                                                        <Globe size={18} />
                                                                    </div>
                                                                    <select
                                                                        id={`address_country_${index}`}
                                                                        value={address.country}
                                                                        onChange={e => handleAddressFieldChange(index, 'country', e.target.value)}
                                                                        className={`w-full bg-slate-50 text-slate-900 appearance-none py-3 pl-10 pr-8 rounded-xl border outline-none transition-all focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 ${clientErrors[`address_country_${index}`] || errors[`addresses.${index}.country`] ? 'border-red-500' : 'border-slate-200'}`}
                                                                        disabled={loadingCountries}
                                                                    >
                                                                        <option value="">-- {t('register.select_country', 'Pilih Negara')} --</option>
                                                                        {countries.map(c => (
                                                                            <option key={c.code} value={c.code}>{c.name}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                {(clientErrors[`address_country_${index}`] || errors[`addresses.${index}.country`]) && (
                                                                    <p className="text-xs text-red-500 px-1">{clientErrors[`address_country_${index}`] || errors[`addresses.${index}.country`]}</p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Regional Dropdowns (Indonesia) */}
                                                    {address.country === 'ID' ? (
                                                        <div className="space-y-4">
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                {/* Province */}
                                                                <div className="space-y-1.5">
                                                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 px-1">
                                                                        {t('register.province', 'Provinsi')} <span className="text-amber-600">*</span>
                                                                    </label>
                                                                    <div className="relative">
                                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                                                            <Compass size={18} />
                                                                        </div>
                                                                        <select
                                                                            id={`address_province_${index}`}
                                                                            value={provinces.find(p => p.name === address.province)?.code || ''}
                                                                            onChange={e => {
                                                                                const selectedOption = e.target.options[e.target.selectedIndex];
                                                                                handleProvinceChange(index, e.target.value, selectedOption ? selectedOption.text : "");
                                                                            }}
                                                                            className={`w-full bg-slate-50 text-slate-900 appearance-none py-3 pl-10 pr-8 rounded-xl border outline-none transition-all focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 ${clientErrors[`address_province_${index}`] || errors[`addresses.${index}.province`] ? 'border-red-500' : 'border-slate-200'}`}
                                                                        >
                                                                            <option value="">-- {t('register.select_province', 'Pilih Provinsi')} --</option>
                                                                            {provinces.map(p => (
                                                                                <option key={p.code} value={p.code}>{p.name}</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                    {(clientErrors[`address_province_${index}`] || errors[`addresses.${index}.province`]) && (
                                                                        <p className="text-xs text-red-500 px-1">{clientErrors[`address_province_${index}`] || errors[`addresses.${index}.province`]}</p>
                                                                    )}
                                                                </div>

                                                                {/* City */}
                                                                <div className="space-y-1.5">
                                                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 px-1">
                                                                        {t('register.city', 'Kota / Kabupaten')} {loadingCities[index] && <Check className="inline-block w-4 h-4 ml-1 animate-spin text-amber-500" />} <span className="text-amber-600">*</span>
                                                                    </label>
                                                                    <div className="relative">
                                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                                                            <Home size={18} />
                                                                        </div>
                                                                        <select
                                                                            id={`address_city_${index}`}
                                                                            value={(citiesForIndex[index] || []).find(c => c.name === address.city)?.code || ''}
                                                                            onChange={e => {
                                                                                const selectedOption = e.target.options[e.target.selectedIndex];
                                                                                handleCityChange(index, e.target.value, selectedOption ? selectedOption.text : "");
                                                                            }}
                                                                            disabled={loadingCities[index] || !(citiesForIndex[index] && citiesForIndex[index].length > 0)}
                                                                            className={`w-full bg-slate-50 text-slate-900 appearance-none py-3 pl-10 pr-8 rounded-xl border outline-none transition-all focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 disabled:opacity-60 ${clientErrors[`address_city_${index}`] || errors[`addresses.${index}.city`] ? 'border-red-500' : 'border-slate-200'}`}
                                                                        >
                                                                            <option value="">-- {t('register.select_city', 'Pilih Kota')} --</option>
                                                                            {(citiesForIndex[index] || []).map(c => (
                                                                                <option key={c.code} value={c.code}>{c.name}</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                    {(clientErrors[`address_city_${index}`] || errors[`addresses.${index}.city`]) && (
                                                                        <p className="text-xs text-red-500 px-1">{clientErrors[`address_city_${index}`] || errors[`addresses.${index}.city`]}</p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                {/* District */}
                                                                <div className="space-y-1.5">
                                                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 px-1">
                                                                        {t('register.district', 'Kecamatan')} {loadingDistricts[index] && <Check className="inline-block w-4 h-4 ml-1 animate-spin text-amber-500" />} <span className="text-amber-600">*</span>
                                                                    </label>
                                                                    <div className="relative">
                                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                                                            <MapPin size={18} />
                                                                        </div>
                                                                        <select
                                                                            id={`address_district_${index}`}
                                                                            value={address.district}
                                                                            onChange={e => handleAddressFieldChange(index, 'district', e.target.value)}
                                                                            disabled={loadingDistricts[index] || !(districtsForIndex[index] && districtsForIndex[index].length > 0)}
                                                                            className={`w-full bg-slate-50 text-slate-900 appearance-none py-3 pl-10 pr-8 rounded-xl border outline-none transition-all focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 disabled:opacity-60 ${clientErrors[`address_district_${index}`] || errors[`addresses.${index}.district`] ? 'border-red-500' : 'border-slate-200'}`}
                                                                        >
                                                                            <option value="">-- {t('register.select_district', 'Pilih Kecamatan')} --</option>
                                                                            {(districtsForIndex[index] || []).map(d => (
                                                                                <option key={d.code} value={d.name}>{d.name}</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                    {(clientErrors[`address_district_${index}`] || errors[`addresses.${index}.district`]) && (
                                                                        <p className="text-xs text-red-500 px-1">{clientErrors[`address_district_${index}`] || errors[`addresses.${index}.district`]}</p>
                                                                    )}
                                                                </div>

                                                                {/* Postal Code */}
                                                                <div className="space-y-1.5">
                                                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 px-1">
                                                                        {t('register.postal_code', 'Kode Pos')} <span className="text-amber-600">*</span>
                                                                    </label>
                                                                    <div className="relative">
                                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                                                            <Home size={18} />
                                                                        </div>
                                                                        <input
                                                                            id={`address_postal_code_${index}`}
                                                                            type="text"
                                                                            value={address.postal_code}
                                                                            onChange={e => handleAddressFieldChange(index, 'postal_code', e.target.value)}
                                                                            placeholder="Contoh: 40123"
                                                                            className={`w-full bg-slate-50 text-slate-900 py-3 pl-10 pr-4 rounded-xl border outline-none transition-all duration-300 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 ${clientErrors[`address_postal_code_${index}`] || errors[`addresses.${index}.postal_code`] ? 'border-red-500' : 'border-slate-200'}`}
                                                                        />
                                                                    </div>
                                                                    {(clientErrors[`address_postal_code_${index}`] || errors[`addresses.${index}.postal_code`]) && (
                                                                        <p className="text-xs text-red-500 px-1">{clientErrors[`address_postal_code_${index}`] || errors[`addresses.${index}.postal_code`]}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        /* Regional Input (International) */
                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                            {/* Region / Province */}
                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 px-1">
                                                                    {t('register.sa_region', 'Wilayah / Provinsi')}
                                                                </label>
                                                                <div className="relative">
                                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                                                        <Compass size={18} />
                                                                    </div>
                                                                    <input
                                                                        type="text"
                                                                        value={address.province}
                                                                        onChange={e => handleAddressFieldChange(index, 'province', e.target.value)}
                                                                        placeholder="Misal: Makkah Region"
                                                                        className="w-full bg-slate-50 text-slate-900 py-3 pl-10 pr-4 rounded-xl border border-slate-200 outline-none transition-all focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50"
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* City */}
                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 px-1">
                                                                    {t('register.sa_city', 'Kota (City)')} <span className="text-amber-600">*</span>
                                                                </label>
                                                                <div className="relative">
                                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                                                        <Home size={18} />
                                                                    </div>
                                                                    <input
                                                                        id={`address_city_${index}`}
                                                                        type="text"
                                                                        value={address.city}
                                                                        onChange={e => handleAddressFieldChange(index, 'city', e.target.value)}
                                                                        placeholder="Misal: Jeddah / Mecca"
                                                                        className={`w-full bg-slate-50 text-slate-900 py-3 pl-10 pr-4 rounded-xl border outline-none transition-all focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 ${clientErrors[`address_city_${index}`] || errors[`addresses.${index}.city`] ? 'border-red-500' : 'border-slate-200'}`}
                                                                    />
                                                                </div>
                                                                {(clientErrors[`address_city_${index}`] || errors[`addresses.${index}.city`]) && (
                                                                    <p className="text-xs text-red-500 px-1">{clientErrors[`address_city_${index}`] || errors[`addresses.${index}.city`]}</p>
                                                                )}
                                                            </div>

                                                            {/* Postal Code */}
                                                            <div className="space-y-1.5">
                                                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 px-1">
                                                                    {t('register.sa_postal', 'Kode Pos / ZIP')} <span className="text-amber-600">*</span>
                                                                </label>
                                                                <div className="relative">
                                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                                                        <Home size={18} />
                                                                    </div>
                                                                    <input
                                                                        id={`address_postal_code_${index}`}
                                                                        type="text"
                                                                        value={address.postal_code}
                                                                        onChange={e => handleAddressFieldChange(index, 'postal_code', e.target.value)}
                                                                        placeholder="Contoh: 21577"
                                                                        className={`w-full bg-slate-50 text-slate-900 py-3 pl-10 pr-4 rounded-xl border outline-none transition-all focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 ${clientErrors[`address_postal_code_${index}`] || errors[`addresses.${index}.postal_code`] ? 'border-red-500' : 'border-slate-200'}`}
                                                                    />
                                                                </div>
                                                                {(clientErrors[`address_postal_code_${index}`] || errors[`addresses.${index}.postal_code`]) && (
                                                                    <p className="text-xs text-red-500 px-1">{clientErrors[`address_postal_code_${index}`] || errors[`addresses.${index}.postal_code`]}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Detailed Address Textarea */}
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 px-1">
                                                            {address.country === 'ID'
                                                                ? t('register.address', 'Alamat Lengkap Pengiriman')
                                                                : t('register.sa_address', 'Detail Alamat / Nama Jalan / No. Bangunan')}{' '}
                                                            <span className="text-amber-600">*</span>
                                                        </label>
                                                        <div className="relative">
                                                            <div className="absolute top-3 left-3 text-slate-400 pointer-events-none">
                                                                <MapPin size={18} />
                                                            </div>
                                                            <textarea
                                                                id={`address_address_${index}`}
                                                                rows={3}
                                                                value={address.address}
                                                                onChange={e => handleAddressFieldChange(index, 'address', e.target.value)}
                                                                placeholder={
                                                                    address.country === 'ID'
                                                                        ? currentTxt.placeholder_address
                                                                        : t('register.place.sa_address', 'Nama jalan, nomor bangunan, atau distrik')
                                                                }
                                                                className={`w-full bg-slate-50 text-slate-900 py-3 pl-10 pr-4 rounded-xl border outline-none transition-all duration-300 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 ${clientErrors[`address_address_${index}`] || errors[`addresses.${index}.address`] ? 'border-red-500' : 'border-slate-200'}`}
                                                            />
                                                        </div>
                                                        {(clientErrors[`address_address_${index}`] || errors[`addresses.${index}.address`]) && (
                                                            <p className="text-xs text-red-500 px-1">{clientErrors[`address_address_${index}`] || errors[`addresses.${index}.address`]}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-between gap-2 pt-6 border-t md:mt-8 sm:flex-row md:gap-4 border-slate-100" dir={isRtl ? "rtl" : "ltr"}>
                                <div className="text-center sm:text-left">
                                    <Link href={route("login")} className="inline-flex items-center gap-1 text-xs font-medium transition-colors text-slate-500 hover:text-amber-600 group">
                                        {t("register.have_account", "Sudah memiliki akun?")}
                                        <span className="font-bold text-amber-600 group-hover:underline pl-0.5">{t("register.login_here", "Masuk Di Sini")}</span>
                                    </Link>
                                </div>

                                <div className="flex w-full gap-3 sm:w-auto">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex items-center justify-center w-full gap-2 px-8 py-3 text-xs font-bold tracking-widest text-white uppercase transition-all duration-300 shadow-md sm:w-auto rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-slate-300 disabled:to-slate-400 hover:shadow-lg active:scale-95"
                                    >
                                        {processing ? t("register.btn_processing", "Memproses...") : <>{t("register.btn_submit", "Daftar Sekarang")}<Check size={14} /></>}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

            </MainLayout>
        </div>
    );
}
