// import React, { useState, useEffect, useRef } from "react";
// import { Head, Link, useForm } from "@inertiajs/react";
// import { motion } from "framer-motion";
// import {
//     User,
//     Mail,
//     Lock,
//     Phone,
//     MapPin,
//     Compass,
//     Home,
//     Check,
//     Globe,
//     Camera,
//     Eye, EyeOff
// } from "lucide-react";
// import { useLanguage } from "@/Contexts/LanguageContext";
// import axios from "axios";
// import Navbar from "@/Components/Navbar";
// import Footer from "@/Components/Footer";
// import MainLayout from "@/Layouts/MainLayout";
// import BaseRenderInput from "@/Components/register/RenderInput";
// import BaseRenderTextArea from "@/Components/register/RenderTextArea";

// export default function Register() {
//     const { t, locale } = useLanguage();
//     const [clientErrors, setClientErrors] = useState({});
//     const [avatarPreview, setAvatarPreview] = useState('/images/default-profile.png');
//     const avatarInputRef = useRef(null);

//     // Dropdown States untuk Wilayah Indonesia
//     const [provinces, setProvinces] = useState([]);
//     const [cities, setCities] = useState([]);
//     const [districts, setDistricts] = useState([]);
//     const [loadingCities, setLoadingCities] = useState(false);
//     const [loadingDistricts, setLoadingDistricts] = useState(false);
//     const [showPassword, setShowPassword] = useState(false);
//     const [showConfirmPassword, setShowConfirmPassword] = useState(false);

//     const isRtl = locale === 'arabic';

//     const currentTxt = {
//         name_req: t("register.err.name_req", "Nama lengkap wajib diisi"),
//         email_req: t("register.err.email_req", "Email wajib diisi"),
//         email_val: t("register.err.email_val", "Format email tidak valid"),
//         pass_req: t("register.err.pass_req", "Kata sandi wajib diisi"),
//         pass_len: t("register.err.pass_len", "Kata sandi minimal 8 karakter"),
//         confirm_val: t("register.err.confirm_val", "Konfirmasi kata sandi tidak cocok"),
//         phone_req: t("register.err.phone_req", "Nomor telepon/WhatsApp wajib diisi"),
//         country_req: t("register.err.country_req", "Negara wajib diisi"),
//         address_req: t("register.err.address_req", "Alamat lengkap wajib diisi"),
//         province_req: t("register.err.province_req", "Provinsi wajib diisi"),
//         city_req: t("register.err.city_req", "Kota/Kabupaten wajib diisi"),
//         district_req: t("register.err.district_req", "Kecamatan wajib diisi"),
//         postal_req: t("register.err.postal_req", "Kode pos wajib diisi"),
//         placeholder_name: t("register.place.name", "Masukkan nama lengkap Anda"),
//         placeholder_email: t("register.place.email", "Masukkan alamat email Anda"),
//         placeholder_pass: t("register.place.pass", "Minimal 8 karakter"),
//         placeholder_confirm: t("register.place.confirm", "Ulangi kata sandi"),
//         placeholder_phone: t("register.place.phone", "Contoh: 081234567890"),
//         placeholder_address: t("register.place.address", "Nama jalan, RT/RW, nomor rumah, kelurahan/kecamatan"),
//         placeholder_postal: t("register.place.postal", "40123"),
//         placeholder_receiver_name: t("register.placeholder_receiver", "Masukkan nama penerima dari alamat anda"),
//         recipient_name_required: t("validation.checkout.recipient_name_required", "Nama penerima wajib diisi")
//     };

//     const { data, setData, post, processing, errors, reset } = useForm({
//         name: "",
//         email: "",
//         password: "",
//         password_confirmation: "",
//         country: "ID", // Default: Indonesia
//         phone: "",
//         address: "",
//         province: "", // Menyimpan nama provinsi terpilih
//         city: "",     // Menyimpan nama kota terpilih
//         district: "", // Menyimpan nama kecamatan terpilih
//         postal_code: "",
//         receiver_name: "",
//         avatar: null,
//     });

//     const handleAvatarChange = (e) => {
//         const file = e.target.files[0];
//         if (!file) return;
//         setData('avatar', file);
//         const previewUrl = URL.createObjectURL(file);
//         setAvatarPreview(previewUrl);
//     };

//     // Re-validate and re-translate errors when locale or translation function changes
//     useEffect(() => {
//         if (Object.keys(clientErrors).length > 0) {
//             validateForm();
//         }
//     }, [locale, t]);

//     // Mengambil data provinsi ketika user memilih Indonesia
//     useEffect(() => {
//         if (data.country === "ID") {
//             axios.get(route('api.provinces'))
//                 .then((res) => setProvinces(res.data))
//                 .catch((err) => console.error("Error fetching provinces:", err));
//         } else {
//             setProvinces([]);
//             setCities([]);
//             setDistricts([]);
//         }
//     }, [data.country]);

//     // Handler ketika Provinsi berubah (Hanya untuk Indonesia)
//     const handleProvinceChange = (provinceCode, provinceName) => {
//         setData((prev) => ({
//             ...prev,
//             province: provinceCode ? provinceName : "",
//             city: "",
//             district: ""
//         }));
//         setCities([]);
//         setDistricts([]);

//         if (!provinceCode) return;

//         setLoadingCities(true);
//         axios.get(`/api/cities/${provinceCode}`)
//             .then((res) => {
//                 setCities(res.data);
//                 setLoadingCities(false);
//             })
//             .catch(() => setLoadingCities(false));
//     };

//     // Handler ketika Kota berubah (Hanya untuk Indonesia)
//     const handleCityChange = (cityCode, cityName) => {
//         setData((prev) => ({
//             ...prev,
//             city: cityCode ? cityName : "",
//             district: ""
//         }));
//         setDistricts([]);

//         if (!cityCode) return;

//         setLoadingDistricts(true);
//         axios.get(`/api/districts/${cityCode}`)
//             .then((res) => {
//                 setDistricts(res.data);
//                 setLoadingDistricts(false);
//             })
//             .catch(() => setLoadingDistricts(false));
//     };

//     const validateForm = () => {
//         const errs = {};
//         if (!data.name.trim()) errs.name = currentTxt.name_req;
//         if (!data.email.trim()) {
//             errs.email = currentTxt.email_req;
//         } else if (!/\S+@\S+\.\S+/.test(data.email)) {
//             errs.email = currentTxt.email_val;
//         }
//         if (!data.password) {
//             errs.password = currentTxt.pass_req;
//         } else if (data.password.length < 8) {
//             errs.password = currentTxt.pass_len;
//         }
//         if (data.password !== data.password_confirmation) {
//             errs.password_confirmation = currentTxt.confirm_val;
//         }

//         if (!data.phone.trim()) errs.phone = currentTxt.phone_req;
//         if (!data.country) errs.country = currentTxt.country_req;
//         if (!data.address.trim()) errs.address = currentTxt.address_req;
//         if (!data.province.trim()) errs.province = currentTxt.province_req;
//         if (!data.city.trim()) errs.city = currentTxt.city_req;
//         if (data.country === "ID" && !data.district.trim()) errs.district = currentTxt.district_req;
//         if (!data.postal_code.trim()) errs.postal_code = currentTxt.postal_req;
//         if (!data.receiver_name.trim()) errs.receiver_name = currentTxt.recipient_name_required;

//         setClientErrors(errs);
//         return Object.keys(errs).length === 0;
//     };

//     const submit = (e) => {
//         e.preventDefault();

//         if (validateForm()) {
//             post(route("register"), {
//                 forceFormData: true,
//                 onFinish: () => reset("password", "password_confirmation"),
//             });
//         }
//     };

//     console.log(data);

//     return (
//         <div className="min-h-screen font-sans text-slate-900 selection:bg-amber-500 selection:text-white md:pt-16 lg:pt-20">
//             <Head title={t("register.title", "Daftar Akun")} />

//             {/* Full-screen loading overlay */}
//             {processing && (
//                 <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/70 backdrop-blur-sm">
//                     <img src="/images/load.gif" alt="Loading" className="object-contain w-24 h-24" />
//                 </div>
//             )}

//             <Navbar alwaysSolid={true} />

//             <MainLayout>
//                 <div className="relative flex items-center justify-center w-full min-h-screen p-4 pb-12 overflow-hidden bg-transparent select-none md:p-12 pt-28">
//                     <div className="relative z-10 w-full max-w-5xl bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xl py-6 px-3 md:p-12 min-h-[600px] flex flex-col justify-between">

//                         {/* Header Bagian Atas */}
//                         <div className="flex flex-col items-start justify-between gap-4 mb-8 sm:flex-row sm:items-center" dir={isRtl ? "rtl" : "ltr"}>
//                             <div>
//                                 <h1 className="text-2xl md:text-3xl font-['Cinzel'] font-bold text-slate-900 tracking-wide">
//                                     {t("register.title", "Daftar Akun")}
//                                 </h1>
//                                 <p className="mt-1 text-xs text-slate-500">
//                                     {t("register.subtitle", "Silakan lengkapi informasi di bawah untuk mendaftar")}
//                                 </p>
//                             </div>
//                             <div>
//                                 <Link href="/" className="text-xs font-semibold tracking-wider uppercase transition-colors text-slate-500 hover:text-amber-600">
//                                     {t("register.nav_home", "Beranda")}
//                                 </Link>
//                             </div>
//                         </div>

//                         {/* Avatar Upload Section */}
//                         <div className="flex flex-col items-center mb-8">
//                             <div className="relative cursor-pointer group" onClick={() => avatarInputRef.current?.click()}>
//                                 {/* Avatar Circle */}
//                                 <div className="overflow-hidden transition-all duration-300 border-4 border-white rounded-full shadow-lg w-28 h-28 ring-2 ring-amber-400 group-hover:ring-amber-500 group-hover:shadow-xl">
//                                     <img
//                                         src={avatarPreview}
//                                         alt="Profile Preview"
//                                         className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
//                                     />
//                                 </div>
//                                 {/* Camera overlay */}
//                                 <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 rounded-full opacity-0 bg-black/40 group-hover:opacity-100">
//                                     <Camera size={24} className="text-white" />
//                                 </div>
//                                 {/* Badge */}
//                                 <div className="absolute flex items-center justify-center w-8 h-8 border-2 border-white rounded-full shadow-md -bottom-1 -right-1 bg-amber-500">
//                                     <Camera size={13} className="text-white" />
//                                 </div>
//                             </div>

//                             {/* Hidden file input */}
//                             <input
//                                 ref={avatarInputRef}
//                                 type="file"
//                                 accept="image/jpeg,image/jpg,image/png,image/webp"
//                                 className="hidden"
//                                 onChange={handleAvatarChange}
//                             />

//                             <p className="mt-3 text-xs text-slate-500">
//                                 {t("register.avatar_hint", "Klik foto untuk mengganti (opsional, maks. 2MB)")}
//                             </p>
//                             {data.avatar && (
//                                 <motion.div
//                                     initial={{ opacity: 0, y: -4 }}
//                                     animate={{ opacity: 1, y: 0 }}
//                                     className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600 font-medium"
//                                 >
//                                     <Check size={13} />
//                                     <span>{data.avatar.name}</span>
//                                 </motion.div>
//                             )}
//                         </div>

//                         {/* Form Section */}
//                         <form onSubmit={submit} className="flex flex-col">
//                             <div className="grid grid-cols-1 gap-6 md:gap-8">
//                                 {/* Left Column: Account Information */}
//                                 <div className="space-y-1">
//                                     <h2 className="pb-2 mb-4 text-sm font-bold tracking-wider uppercase border-b text-amber-600 border-slate-100">
//                                         {t("register.account_info", "Informasi Akun")}
//                                     </h2>
//                                     <BaseRenderInput
//                                         label={t("register.name", "Nama Lengkap")}
//                                         id="name"
//                                         placeholder={currentTxt.placeholder_name}
//                                         icon={User}
//                                         data={data}
//                                         setData={setData}
//                                         errors={errors}
//                                         clientErrors={clientErrors}
//                                         isRtl={isRtl}
//                                     />

//                                     <BaseRenderInput
//                                         label={t("register.email", "Alamat Email")}
//                                         id="email"
//                                         type="email"
//                                         placeholder={currentTxt.placeholder_email}
//                                         icon={Mail}
//                                         data={data}
//                                         setData={setData}
//                                         errors={errors}
//                                         clientErrors={clientErrors}
//                                         isRtl={isRtl}
//                                     />

//                                     <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//                                         {/* Input Password */}
//                                         <div className="w-full">
//                                             <label htmlFor="password" className="block mb-1 text-sm font-medium text-zinc-700">
//                                                 {t("register.password", "Kata Sandi")}
//                                             </label>
//                                             <div className="relative rounded-md shadow-sm">
//                                                 <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-400">
//                                                     <Lock size={18} />
//                                                 </div>
//                                                 <input
//                                                     type={showPassword ? "text" : "password"}
//                                                     id="password"
//                                                     value={data.password}
//                                                     onChange={(e) => setData("password", e.target.value)}
//                                                     placeholder={currentTxt.placeholder_pass}
//                                                     className={`block w-full rounded-lg border bg-white pl-10 pr-10 py-2.5 text-zinc-900 text-sm outline-none transition-all duration-300 ${(clientErrors.password || errors.password)
//                                                         ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
//                                                         : "border-zinc-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 hover:border-zinc-400"
//                                                         }`}
//                                                 />
//                                                 <button
//                                                     type="button"
//                                                     onClick={() => setShowPassword(!showPassword)}
//                                                     className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-600"
//                                                 >
//                                                     {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//                                                 </button>
//                                             </div>
//                                             {(clientErrors.password || errors.password) && (
//                                                 <motion.p
//                                                     initial={{ opacity: 0, y: -5 }}
//                                                     animate={{ opacity: 1, y: 0 }}
//                                                     className="px-1 mt-1 text-xs text-red-500"
//                                                 >
//                                                     {clientErrors.password || errors.password}
//                                                 </motion.p>
//                                             )}
//                                         </div>

//                                         {/* Input Konfirmasi Password */}
//                                         <div className="w-full">
//                                             <label htmlFor="password_confirmation" className="block mb-1 text-sm font-medium text-zinc-700">
//                                                 {t("register.password_confirm", "Konfirmasi Sandi")}
//                                             </label>
//                                             <div className="relative rounded-md shadow-sm">
//                                                 <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-400">
//                                                     <Lock size={18} />
//                                                 </div>
//                                                 <input
//                                                     type={showConfirmPassword ? "text" : "password"}
//                                                     id="password_confirmation"
//                                                     value={data.password_confirmation}
//                                                     onChange={(e) => setData("password_confirmation", e.target.value)}
//                                                     placeholder={currentTxt.placeholder_confirm}
//                                                     className={`block w-full rounded-lg border bg-white pl-10 pr-10 py-2.5 text-zinc-900 text-sm outline-none transition-all duration-300 ${(clientErrors.password_confirmation || errors.password_confirmation)
//                                                         ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
//                                                         : "border-zinc-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 hover:border-zinc-400"
//                                                         }`}
//                                                 />
//                                                 <button
//                                                     type="button"
//                                                     onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                                                     className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-600"
//                                                 >
//                                                     {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//                                                 </button>
//                                             </div>
//                                             {(clientErrors.password_confirmation || errors.password_confirmation) && (
//                                                 <motion.p
//                                                     initial={{ opacity: 0, y: -5 }}
//                                                     animate={{ opacity: 1, y: 0 }}
//                                                     className="px-1 mt-1 text-xs text-red-500"
//                                                 >
//                                                     {clientErrors.password_confirmation || errors.password_confirmation}
//                                                 </motion.p>
//                                             )}
//                                         </div>
//                                     </div>
//                                 </div>

//                                 {/* Right Column: Address & Contact Info */}
//                                 <div className="space-y-1">
//                                     <h2 className="pb-2 mb-4 text-sm font-bold tracking-wider uppercase border-b text-amber-600 border-slate-100">
//                                         {t("register.address_info", "Alamat & Kontak")}
//                                     </h2>
//                                     <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//                                         {/* Dropdown Pilihan Wilayah Registrasi (Negara) */}
//                                         <div className="relative mb-5" dir={isRtl ? "rtl" : "ltr"}>
//                                             <label htmlFor="country" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 px-1">
//                                                 {t("register.country", "Wilayah Registrasi")} <span className="text-amber-600">*</span>
//                                             </label>
//                                             <div className="relative">
//                                                 <div className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none text-slate-400`}>
//                                                     <Globe size={18} className="opacity-70" />
//                                                 </div>
//                                                 <select
//                                                     id="country"
//                                                     value={data.country}
//                                                     onChange={(e) => {
//                                                         setData((prev) => ({
//                                                             ...prev,
//                                                             country: e.target.value,
//                                                             province: "",
//                                                             city: "",
//                                                             district: "",
//                                                             address: "",
//                                                             postal_code: ""
//                                                         }));
//                                                         setClientErrors({});
//                                                     }}
//                                                     className={`w-full bg-slate-50 text-slate-900 appearance-none ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all duration-300`}
//                                                 >
//                                                     <option value="ID">{t("register.type_indonesia", "User Indonesia")}</option>
//                                                     <option value="SA">{t("register.type_international", "User International / Saudi Arabia")}</option>
//                                                 </select>
//                                             </div>
//                                         </div>

//                                         <BaseRenderInput
//                                             label={t("register.phone", "Nomor Telepon / WhatsApp")}
//                                             id="phone"
//                                             type="tel"
//                                             placeholder={currentTxt.placeholder_phone}
//                                             icon={Phone}
//                                             data={data}
//                                             setData={setData}
//                                             errors={errors}
//                                             clientErrors={clientErrors}
//                                             isRtl={isRtl}
//                                         />
//                                     </div>

//                                     {/* DYNAMIC FORM BERDASARKAN NEGARA */}
//                                     {data.country === "ID" ? (
//                                         /* STRUKTUR REGISTRASI INDONESIA */
//                                         <div className="space-y-1">
//                                             <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//                                                 {/* Dropdown Provinsi */}
//                                                 <div className="mb-5">
//                                                     <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 px-1">
//                                                         {t("register.province", "Provinsi")} <span className="text-amber-600">*</span>
//                                                     </label>
//                                                     <div className="relative">
//                                                         <div className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none text-slate-400`}>
//                                                             <Compass size={18} className="opacity-70" />
//                                                         </div>
//                                                         <select
//                                                             value={provinces.find(p => p.name === data.province)?.code || ""}
//                                                             onChange={(e) => {
//                                                                 const selectedOption = e.target.options[e.target.selectedIndex];
//                                                                 handleProvinceChange(e.target.value, selectedOption ? selectedOption.text : "");
//                                                             }}
//                                                             className={`w-full bg-slate-50 text-slate-900 appearance-none ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 rounded-xl border outline-none transition-all duration-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 ${(clientErrors.province || errors.province) ? 'border-red-500' : 'border-slate-200 hover:border-slate-300'}`}
//                                                         >
//                                                             <option value="">-- {t("register.select_province", "Pilih Provinsi")} --</option>
//                                                             {provinces.map((p) => (
//                                                                 <option key={p.code} value={p.code}>{p.name}</option>
//                                                             ))}
//                                                         </select>
//                                                     </div>
//                                                     {(clientErrors.province || errors.province) && (
//                                                         <p className="px-1 mt-1 text-xs text-red-500">{clientErrors.province || errors.province}</p>
//                                                     )}
//                                                 </div>

//                                                 {/* Dropdown Kota / Kabupaten */}
//                                                 <div className="mb-5">
//                                                     <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 px-1">
//                                                         {t("register.city", "Kota / Kabupaten")} {loadingCities && <img src="/images/load.gif" alt="Loading" className="inline-block w-4 h-4 ml-1 align-middle" />} <span className="text-amber-600">*</span>
//                                                     </label>
//                                                     <div className="relative">
//                                                         <div className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none text-slate-400`}>
//                                                             <Home size={18} className="opacity-70" />
//                                                         </div>
//                                                         <select
//                                                             value={cities.find(c => c.name === data.city)?.code || ""}
//                                                             disabled={loadingCities || cities.length === 0}
//                                                             onChange={(e) => {
//                                                                 const selectedOption = e.target.options[e.target.selectedIndex];
//                                                                 handleCityChange(e.target.value, selectedOption ? selectedOption.text : "");
//                                                             }}
//                                                             className={`w-full bg-slate-50 text-slate-900 appearance-none ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 rounded-xl border outline-none transition-all duration-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 disabled:opacity-60 ${(clientErrors.city || errors.city) ? 'border-red-500' : 'border-slate-200 hover:border-slate-300'}`}
//                                                         >
//                                                             <option value="">-- {t("register.select_city", "Pilih Kota")} --</option>
//                                                             {cities.map((c) => (
//                                                                 <option key={c.code} value={c.code}>{c.name}</option>
//                                                             ))}
//                                                         </select>
//                                                     </div>
//                                                     {(clientErrors.city || errors.city) && (
//                                                         <p className="px-1 mt-1 text-xs text-red-500">{clientErrors.city || errors.city}</p>
//                                                     )}
//                                                 </div>
//                                             </div>

//                                             <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//                                                 {/* Dropdown Kecamatan */}
//                                                 <div className="mb-5">
//                                                     <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 px-1">
//                                                         {t("register.district", "Kecamatan")} {loadingDistricts && <img src="/images/load.gif" alt="Loading" className="inline-block w-4 h-4 ml-1 align-middle" />} <span className="text-amber-600">*</span>
//                                                     </label>
//                                                     <div className="relative">
//                                                         <div className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none text-slate-400`}>
//                                                             <MapPin size={18} className="opacity-70" />
//                                                         </div>
//                                                         <select
//                                                             value={data.district}
//                                                             disabled={loadingDistricts || districts.length === 0}
//                                                             onChange={(e) => {
//                                                                 setData("district", e.target.value);
//                                                             }}
//                                                             className={`w-full bg-slate-50 text-slate-900 appearance-none ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 rounded-xl border outline-none transition-all duration-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 disabled:opacity-60 ${(clientErrors.district || errors.district) ? 'border-red-500' : 'border-slate-200 hover:border-slate-300'}`}
//                                                         >
//                                                             <option value="">-- {t("register.select_district", "Pilih Kecamatan")} --</option>
//                                                             {districts.map((d) => (
//                                                                 <option key={d.code} value={d.name}>{d.name}</option>
//                                                             ))}
//                                                         </select>
//                                                     </div>
//                                                     {(clientErrors.district || errors.district) && (
//                                                         <p className="px-1 mt-1 text-xs text-red-500">{clientErrors.district || errors.district}</p>
//                                                     )}
//                                                 </div>

//                                                 {/* Input Kode Pos */}
//                                                 <BaseRenderInput
//                                                     label={t("register.postal_code", "Kode Pos")}
//                                                     id="postal_code"
//                                                     placeholder={currentTxt.placeholder_postal}
//                                                     icon={Home}
//                                                     data={data}
//                                                     setData={setData}
//                                                     errors={errors}
//                                                     clientErrors={clientErrors}
//                                                     isRtl={isRtl}
//                                                 />
//                                             </div>
//                                         </div>
//                                     ) : (
//                                         /* STRUKTUR REGISTRASI INTERNATIONAL / SAUDI ARABIA */
//                                         <div className="grid grid-cols-1 gap-1 mb-5 sm:grid-cols-3">
//                                             <BaseRenderInput
//                                                 label={t("register.sa_region", "Wilayah / Provinsi (Region)")}
//                                                 id="province"
//                                                 placeholder={t("register.place.sa_region", "Misal: Makkah Region")}
//                                                 icon={Compass}
//                                                 data={data}
//                                                 setData={setData}
//                                                 errors={errors}
//                                                 clientErrors={clientErrors}
//                                                 isRtl={isRtl}
//                                             />

//                                             <BaseRenderInput
//                                                 label={t("register.sa_city", "Kota (City)")}
//                                                 id="city"
//                                                 placeholder={t("register.place.sa_city", "Misal: Jeddah / Mecca")}
//                                                 icon={Home}
//                                                 data={data}
//                                                 setData={setData}
//                                                 errors={errors}
//                                                 clientErrors={clientErrors}
//                                                 isRtl={isRtl}
//                                             />

//                                             <BaseRenderInput
//                                                 label={t("register.sa_postal", "Kode Pos / ZIP (5 Digit)")}
//                                                 id="postal_code"
//                                                 placeholder="21577"
//                                                 icon={Home}
//                                                 data={data}
//                                                 setData={setData}
//                                                 errors={errors}
//                                                 clientErrors={clientErrors}
//                                                 isRtl={isRtl}
//                                             />
//                                         </div>
//                                     )}

//                                     <BaseRenderInput
//                                         label={t("register.receiver_name", "Nama Penerima")}
//                                         id="receiver_name"
//                                         placeholder={currentTxt.placeholder_receiver_name}
//                                         icon={User}
//                                         data={data}
//                                         setData={setData}
//                                         errors={errors}
//                                         clientErrors={clientErrors}
//                                         isRtl={isRtl}
//                                     />

//                                     <BaseRenderTextArea
//                                         label={data.country === "ID" ? t("register.address", "Alamat Lengkap Pengiriman") : t("register.sa_address", "Detail Alamat / Nama Jalan / No. Bangunan")}
//                                         id="address"
//                                         placeholder={data.country === "ID" ? currentTxt.placeholder_address : t("register.place.sa_address", "Nama jalan, nomor bangunan (4 digit), atau distrik")}
//                                         icon={MapPin}
//                                         data={data}
//                                         setData={setData}
//                                         errors={errors}
//                                         clientErrors={clientErrors}
//                                         isRtl={isRtl}
//                                     />
//                                 </div>
//                             </div>

//                             {/* Navigation Buttons */}
//                             <div className="flex flex-col items-center justify-between gap-2 pt-6 border-t md:mt-8 sm:flex-row md:gap-4 border-slate-100" dir={isRtl ? "rtl" : "ltr"}>
//                                 <div className="text-center sm:text-left">
//                                     <Link href={route("login")} className="inline-flex items-center gap-1 text-xs font-medium transition-colors text-slate-500 hover:text-amber-600 group">
//                                         {t("register.have_account", "Sudah memiliki akun?")}
//                                         <span className="font-bold text-amber-600 group-hover:underline pl-0.5">
//                                             {t("register.login_here", "Masuk Di Sini")}
//                                         </span>
//                                     </Link>
//                                 </div>

//                                 <div className="flex w-full gap-3 sm:w-auto">
//                                     <button
//                                         type="submit"
//                                         disabled={processing}
//                                         className="flex items-center justify-center w-full gap-2 px-8 py-3 text-xs font-bold tracking-widest text-white uppercase transition-all duration-300 shadow-md sm:w-auto rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-slate-300 disabled:to-slate-400 hover:shadow-lg active:scale-95"
//                                     >
//                                         {processing ? (
//                                             t("register.btn_processing", "Memproses...")
//                                         ) : (
//                                             <>
//                                                 {t("register.btn_submit", "Daftar Sekarang")}
//                                                 <Check size={14} />
//                                             </>
//                                         )}
//                                     </button>
//                                 </div>
//                             </div>
//                         </form>
//                     </div>
//                 </div>

//                 <Footer />
//             </MainLayout>
//         </div>
//     );
// }

import React, { useState, useEffect, useRef } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import { motion } from "framer-motion";
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
    Eye, EyeOff
} from "lucide-react";
import { useLanguage } from "@/Contexts/LanguageContext";
import axios from "axios";
import Navbar from "@/Components/Navbar";
import Footer from "@/Components/Footer";
import MainLayout from "@/Layouts/MainLayout";
import BaseRenderInput from "@/Components/register/RenderInput";
import BaseRenderTextArea from "@/Components/register/RenderTextArea";

export default function Register() {
    const { t, locale } = useLanguage();
    const [clientErrors, setClientErrors] = useState({});
    const [avatarPreview, setAvatarPreview] = useState('/images/default-profile.png');
    const avatarInputRef = useRef(null);

    // Dropdown States untuk Wilayah Indonesia
    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [loadingCities, setLoadingCities] = useState(false);
    const [loadingDistricts, setLoadingDistricts] = useState(false);

    // Dropdown States untuk Wilayah Internasional (Seluruh Dunia)
    const [countries, setCountries] = useState([]);
    const [loadingCountries, setLoadingCountries] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Mengontrol UI: "ID" untuk Domestik Indonesia, "INTL" untuk Luar Negeri
    const [registrationType, setRegistrationType] = useState("ID");

    const isRtl = locale === 'arabic';

    const currentTxt = {
        name_req: t("register.err.name_req", "Nama lengkap wajib diisi"),
        email_req: t("register.err.email_req", "Email wajib diisi"),
        email_val: t("register.err.email_val", "Format email tidak valid"),
        pass_req: t("register.err.pass_req", "Kata sandi wajib diisi"),
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
        placeholder_pass: t("register.place.pass", "Minimal 8 karakter"),
        placeholder_confirm: t("register.place.confirm", "Ulangi kata sandi"),
        placeholder_phone: t("register.place.phone", "Contoh: 081234567890"),
        placeholder_address: t("register.place.address", "Nama jalan, RT/RW, nomor rumah, kelurahan/kecamatan"),
        placeholder_postal: t("register.place.postal", "40123"),
        placeholder_intl_postal: t("register.place.intl_postal", "Contoh: 21577"),
        placeholder_receiver_name: t("register.placeholder_receiver", "Masukkan nama penerima dari alamat anda"),
        recipient_name_required: t("validation.checkout.recipient_name_required", "Nama penerima wajib diisi")
    };

    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        country: "ID",
        phone: "",
        address: "",
        province: "",
        city: "",
        district: "",
        postal_code: "",
        receiver_name: "",
        avatar: null,
    });

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setData('avatar', file);
        const previewUrl = URL.createObjectURL(file);
        setAvatarPreview(previewUrl);
    };

    // Validasi ulang otomatis ketika bahasa berubah
    useEffect(() => {
        if (Object.keys(clientErrors).length > 0) {
            validateForm();
        }
    }, [locale, t]);

    // Efek untuk memuat data wilayah berdasarkan tipe registrasi secara dinamis
    useEffect(() => {
        if (registrationType === "ID") {
            axios.get(route('api.provinces'))
                .then((res) => setProvinces(res.data))
                .catch((err) => console.error("Error fetching provinces:", err));

            setCountries([]);
        } else {
            // Memanggil endpoint internal Laravel yang baru saja kita buat
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

            setProvinces([]);
            setCities([]);
            setDistricts([]);
        }
    }, [registrationType]);

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
        if (!data.password) {
            errs.password = currentTxt.pass_req;
        } else if (data.password.length < 8) {
            errs.password = currentTxt.pass_len;
        }
        if (data.password !== data.password_confirmation) {
            errs.password_confirmation = currentTxt.confirm_val;
        }

        if (!data.phone.trim()) errs.phone = currentTxt.phone_req;
        if (!data.country) errs.country = currentTxt.country_req;
        if (!data.address.trim()) errs.address = currentTxt.address_req;
        if (!data.postal_code.trim()) errs.postal_code = currentTxt.postal_req;
        if (!data.receiver_name.trim()) errs.receiver_name = currentTxt.recipient_name_required;

        if (registrationType === "ID") {
            if (!data.province.trim()) errs.province = currentTxt.province_req;
            if (!data.city.trim()) errs.city = currentTxt.city_req;
            if (!data.district.trim()) errs.district = currentTxt.district_req;
        } else {
            if (!data.city.trim()) errs.city = currentTxt.city_req;
            if (data.country === "ID") errs.country = currentTxt.country_req;
        }

        setClientErrors(errs);
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
            <Head title={t("register.title", "Daftar Akun")} />

            {processing && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/70 backdrop-blur-sm">
                    <img src="/images/load.gif" alt="Loading" className="object-contain w-24 h-24" />
                </div>
            )}

            <Navbar alwaysSolid={true} />

            <MainLayout>
                <div className="relative flex items-center justify-center w-full min-h-screen p-4 pb-12 overflow-hidden bg-transparent select-none md:p-12 pt-28">
                    <div className="relative z-10 w-full max-w-5xl bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xl py-6 px-3 md:p-12 min-h-[600px] flex flex-col justify-between">

                        <div className="flex flex-col items-start justify-between gap-4 mb-8 sm:flex-row sm:items-center" dir={isRtl ? "rtl" : "ltr"}>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-['Cinzel'] font-bold text-slate-900 tracking-wide">
                                    {t("register.title", "Daftar Akun")}
                                </h1>
                                <p className="mt-1 text-xs text-slate-500">
                                    {t("register.subtitle", "Silakan lengkapi informasi di bawah untuk mendaftar")}
                                </p>
                            </div>
                            <div>
                                <Link href="/" className="text-xs font-semibold tracking-wider uppercase transition-colors text-slate-500 hover:text-amber-600">
                                    {t("register.nav_home", "Beranda")}
                                </Link>
                            </div>
                        </div>

                        {/* Avatar Upload */}
                        <div className="flex flex-col items-center mb-8">
                            <div className="relative cursor-pointer group" onClick={() => avatarInputRef.current?.click()}>
                                <div className="overflow-hidden transition-all duration-300 border-4 border-white rounded-full shadow-lg w-28 h-28 ring-2 ring-amber-400 group-hover:ring-amber-500 group-hover:shadow-xl">
                                    <img src={avatarPreview} alt="Profile Preview" className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110" />
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
                                    <BaseRenderInput label={t("register.name", "Nama Lengkap")} id="name" placeholder={currentTxt.placeholder_name} icon={User} data={data} setData={setData} errors={errors} clientErrors={clientErrors} isRtl={isRtl} />
                                    <BaseRenderInput label={t("register.email", "Alamat Email")} id="email" type="email" placeholder={currentTxt.placeholder_email} icon={Mail} data={data} setData={setData} errors={errors} clientErrors={clientErrors} isRtl={isRtl} />

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
                                </div>

                                <div className="space-y-1">
                                    <h2 className="pb-2 mb-4 text-sm font-bold tracking-wider uppercase border-b text-amber-600 border-slate-100">
                                        {t("register.address_info", "Alamat & Kontak")}
                                    </h2>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        {/* Pilihan Wilayah Registrasi */}
                                        <div className="relative mb-5" dir={isRtl ? "rtl" : "ltr"}>
                                            <label htmlFor="registration_type" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 px-1">
                                                {t("register.country", "Wilayah Registrasi")} <span className="text-amber-600">*</span>
                                            </label>
                                            <div className="relative">
                                                <div className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none text-slate-400`}><Globe size={18} className="opacity-70" /></div>
                                                <select
                                                    id="registration_type"
                                                    value={registrationType}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setRegistrationType(val);
                                                        setData((prev) => ({
                                                            ...prev,
                                                            country: val === "ID" ? "ID" : "",
                                                            province: "", city: "", district: "", address: "", postal_code: ""
                                                        }));
                                                        setClientErrors({});
                                                    }}
                                                    className={`w-full bg-slate-50 text-slate-900 appearance-none ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all duration-300`}
                                                >
                                                    <option value="ID">{currentTxt.type_indonesia || t("register.type_indonesia", "User Indonesia")}</option>
                                                    <option value="INTL">{currentTxt.type_international || t("register.type_international", "User Internasional")}</option>
                                                </select>
                                            </div>
                                        </div>

                                        <BaseRenderInput label={t("register.phone", "Nomor Telepon / WhatsApp")} id="phone" type="tel" placeholder={currentTxt.placeholder_phone} icon={Phone} data={data} setData={setData} errors={errors} clientErrors={clientErrors} isRtl={isRtl} />
                                    </div>

                                    {/* FORM CONDITIONAL RENDERING */}
                                    {registrationType === "ID" ? (
                                        <div className="space-y-1">
                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                {/* Dropdown Provinsi */}
                                                <div className="mb-5">
                                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 px-1">{t("register.province", "Provinsi")} <span className="text-amber-600">*</span></label>
                                                    <div className="relative">
                                                        <div className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none text-slate-400`}><Compass size={18} className="opacity-70" /></div>
                                                        <select
                                                            value={provinces.find(p => p.name === data.province)?.code || ""}
                                                            onChange={(e) => {
                                                                const selectedOption = e.target.options[e.target.selectedIndex];
                                                                handleProvinceChange(e.target.value, selectedOption ? selectedOption.text : "");
                                                            }}
                                                            className={`w-full bg-slate-50 text-slate-900 appearance-none ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 rounded-xl border outline-none transition-all duration-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 ${(clientErrors.province || errors.province) ? 'border-red-500' : 'border-slate-200 hover:border-slate-300'}`}
                                                        >
                                                            <option value="">-- {t("register.select_province", "Pilih Provinsi")} --</option>
                                                            {provinces.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
                                                        </select>
                                                    </div>
                                                    {(clientErrors.province || errors.province) && <p className="px-1 mt-1 text-xs text-red-500">{clientErrors.province || errors.province}</p>}
                                                </div>

                                                {/* Dropdown Kota */}
                                                <div className="mb-5">
                                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 px-1">
                                                        {t("register.city", "Kota / Kabupaten")} {loadingCities && <img src="/images/load.gif" alt="Loading" className="inline-block w-4 h-4 ml-1 align-middle" />} <span className="text-amber-600">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <div className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none text-slate-400`}><Home size={18} className="opacity-70" /></div>
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
                                                            {cities.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                                                        </select>
                                                    </div>
                                                    {(clientErrors.city || errors.city) && <p className="px-1 mt-1 text-xs text-red-500">{clientErrors.city || errors.city}</p>}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                {/* Dropdown Kecamatan */}
                                                <div className="mb-5">
                                                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 px-1">
                                                        {t("register.district", "Kecamatan")} {loadingDistricts && <img src="/images/load.gif" alt="Loading" className="inline-block w-4 h-4 ml-1 align-middle" />} <span className="text-amber-600">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <div className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none text-slate-400`}><MapPin size={18} className="opacity-70" /></div>
                                                        <select
                                                            value={data.district}
                                                            disabled={loadingDistricts || districts.length === 0}
                                                            onChange={(e) => setData("district", e.target.value)}
                                                            className={`w-full bg-slate-50 text-slate-900 appearance-none ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 rounded-xl border outline-none transition-all duration-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 disabled:opacity-60 ${(clientErrors.district || errors.district) ? 'border-red-500' : 'border-slate-200 hover:border-slate-300'}`}
                                                        >
                                                            <option value="">-- {t("register.select_district", "Pilih Kecamatan")} --</option>
                                                            {districts.map((d) => <option key={d.code} value={d.name}>{d.name}</option>)}
                                                        </select>
                                                    </div>
                                                    {(clientErrors.district || errors.district) && <p className="px-1 mt-1 text-xs text-red-500">{clientErrors.district || errors.district}</p>}
                                                </div>

                                                <BaseRenderInput label={t("register.postal_code", "Kode Pos")} id="postal_code" placeholder={currentTxt.placeholder_postal} icon={Home} data={data} setData={setData} errors={errors} clientErrors={clientErrors} isRtl={isRtl} />
                                            </div>
                                        </div>
                                    ) : (
                                        /* STRUKTUR INTERNASIONAL DENGAN DAFTAR LENGKAP NEGARA DUNIA DARI LOCAL API */
                                        <div className="grid grid-cols-1 gap-4 mb-5 sm:grid-cols-3">
                                            <div>
                                                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 px-1">
                                                    {t("register.country_label", "Negara (Country)")}{" "}
                                                    {loadingCountries && <img src="/images/load.gif" alt="Loading" className="inline-block w-4 h-4 ml-1 align-middle" />}
                                                    <span className="text-amber-600">*</span>
                                                </label>
                                                <div className="relative">
                                                    <div className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none text-slate-400`}><Globe size={18} className="opacity-70" /></div>
                                                    <select
                                                        value={data.country}
                                                        disabled={loadingCountries || countries.length === 0}
                                                        onChange={(e) => setData("country", e.target.value)}
                                                        className={`w-full bg-slate-50 text-slate-900 appearance-none ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 rounded-xl border outline-none transition-all duration-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 disabled:opacity-60 ${(clientErrors.country || errors.country) ? 'border-red-500' : 'border-slate-200 hover:border-slate-300'}`}
                                                    >
                                                        <option value="">
                                                            {loadingCountries ? `-- ${t("register.loading_countries", "Memuat daftar negara...")} --` : `-- ${t("register.select_country", "Pilih Negara")} --`}
                                                        </option>
                                                        {countries.map((c) => (
                                                            <option key={c.code} value={c.code}>{c.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                {(clientErrors.country || errors.country) && <p className="px-1 mt-1 text-xs text-red-500">{clientErrors.country || errors.country}</p>}
                                            </div>

                                            <BaseRenderInput label={t("register.sa_city", "Kota (City)")} id="city" placeholder={t("register.place.sa_city", "Misal: Jeddah / Makkah")} icon={Home} data={data} setData={setData} errors={errors} clientErrors={clientErrors} isRtl={isRtl} />
                                            <BaseRenderInput label={t("register.sa_postal", "Kode Pos / ZIP")} id="postal_code" placeholder={currentTxt.placeholder_intl_postal} icon={Home} data={data} setData={setData} errors={errors} clientErrors={clientErrors} isRtl={isRtl} />
                                        </div>
                                    )}

                                    <BaseRenderInput label={t("register.receiver_name", "Nama Penerima")} id="receiver_name" placeholder={currentTxt.placeholder_receiver_name} icon={User} data={data} setData={setData} errors={errors} clientErrors={clientErrors} isRtl={isRtl} />
                                    <BaseRenderTextArea
                                        label={registrationType === "ID" ? t("register.address", "Alamat Lengkap Pengiriman") : t("register.sa_address", "Detail Alamat / Nama Jalan / No. Bangunan")}
                                        id="address"
                                        placeholder={registrationType === "ID" ? currentTxt.placeholder_address : t("register.place.sa_address", "Nama jalan, nomor bangunan, atau nama distrik")}
                                        icon={MapPin} data={data} setData={setData} errors={errors} clientErrors={clientErrors} isRtl={isRtl}
                                    />
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

                <Footer />
            </MainLayout>
        </div>
    );
}
