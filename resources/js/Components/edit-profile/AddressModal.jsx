import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Compass, Home, Phone, User, Globe, Loader2, Check } from 'lucide-react';

export default function AddressModal({ isOpen, onClose, onSave, address = null, t, locale }) {
    const isRtl = locale === 'arabic' || locale === 'ar';

    const [receiverName, setReceiverName] = useState('');
    const [phone, setPhone] = useState('');
    const [country, setCountry] = useState('ID');
    const [province, setProvince] = useState('');
    const [city, setCity] = useState('');
    const [district, setDistrict] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [detailAddress, setDetailAddress] = useState('');

    // Dynamic Lists & Loaders for Indonesia
    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);
    const [loadingDistricts, setLoadingDistricts] = useState(false);

    // International Countries List
    const [countries, setCountries] = useState([]);
    const [loadingCountries, setLoadingCountries] = useState(false);

    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    // Hydrate form when modal opens / address prop changes
    useEffect(() => {
        if (isOpen) {
            setErrors({});
            if (address) {
                setReceiverName(address.receiver_name || '');
                setPhone(address.phone || '');
                setCountry(address.country || 'ID');
                setProvince(address.province || '');
                setCity(address.city || '');
                setDistrict(address.district || '');
                setPostalCode(address.postal_code || '');
                setDetailAddress(address.address || '');
            } else {
                setReceiverName('');
                setPhone('');
                setCountry('ID');
                setProvince('');
                setCity('');
                setDistrict('');
                setPostalCode('');
                setDetailAddress('');
            }
        }
    }, [isOpen, address]);

    // Load countries on mount or registration type change
    useEffect(() => {
        if (!isOpen) return;

        if (country === 'ID') {
            setLoadingProvinces(true);
            axios.get(route('api.provinces'))
                .then((res) => {
                    setProvinces(res.data);
                    setLoadingProvinces(false);

                    // Hydrate existing address cities/districts if editing
                    if (address && address.country === 'ID' && address.province) {
                        const matchedProv = res.data.find(p => p.name === address.province);
                        if (matchedProv) {
                            loadCities(matchedProv.code, address.city);
                        }
                    }
                })
                .catch((err) => {
                    console.error("Error loading provinces:", err);
                    setLoadingProvinces(false);
                });
        } else {
            setLoadingCountries(true);
            axios.get('/api/countries')
                .then((res) => {
                    setCountries(res.data);
                    setLoadingCountries(false);
                })
                .catch((err) => {
                    console.error("Error loading countries:", err);
                    setLoadingCountries(false);
                });
        }
    }, [isOpen, country]);

    const loadCities = (provCode, currentCityName = '') => {
        setLoadingCities(true);
        axios.get(`/api/cities/${provCode}`)
            .then((res) => {
                setCities(res.data);
                setLoadingCities(false);

                if (currentCityName) {
                    const matchedCity = res.data.find(c => c.name === currentCityName);
                    if (matchedCity) {
                        loadDistricts(matchedCity.code);
                    }
                }
            })
            .catch(() => setLoadingCities(false));
    };

    const loadDistricts = (cityCode) => {
        setLoadingDistricts(true);
        axios.get(`/api/districts/${cityCode}`)
            .then((res) => {
                setDistricts(res.data);
                setLoadingDistricts(false);
            })
            .catch(() => setLoadingDistricts(false));
    };

    const handleProvinceChange = (e) => {
        const provCode = e.target.value;
        const selectedOption = e.target.options[e.target.selectedIndex];
        const provName = selectedOption ? selectedOption.text : '';

        setProvince(provCode ? provName : '');
        setCity('');
        setDistrict('');
        setCities([]);
        setDistricts([]);

        if (provCode) {
            loadCities(provCode);
        }
    };

    const handleCityChange = (e) => {
        const cityCode = e.target.value;
        const selectedOption = e.target.options[e.target.selectedIndex];
        const cityName = selectedOption ? selectedOption.text : '';

        setCity(cityCode ? cityName : '');
        setDistrict('');
        setDistricts([]);

        if (cityCode) {
            loadDistricts(cityCode);
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!receiverName.trim()) newErrors.receiver_name = t('validation.checkout.recipient_name_required', 'Nama penerima wajib diisi');
        if (!phone.trim()) newErrors.phone = t('register.err.phone_req', 'Nomor telepon/WhatsApp wajib diisi');
        if (!country) newErrors.country = t('register.err.country_req', 'Negara wajib diisi');
        if (!postalCode.trim()) newErrors.postal_code = t('register.err.postal_req', 'Kode pos wajib diisi');
        if (!detailAddress.trim()) newErrors.address = t('register.err.address_req', 'Alamat lengkap wajib diisi');

        if (country === 'ID') {
            if (!province) newErrors.province = t('register.err.province_req', 'Provinsi wajib diisi');
            if (!city) newErrors.city = t('register.err.city_req', 'Kota/Kabupaten wajib diisi');
            if (!district) newErrors.district = t('register.err.district_req', 'Kecamatan wajib diisi');
        } else {
            if (!city) newErrors.city = t('register.err.city_req', 'Kota wajib diisi');
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            const firstErrorKey = Object.keys(newErrors)[0];
            const element = document.getElementById(firstErrorKey);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.focus();
            }
        }

        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setSaving(true);
        try {
            const data = {
                id: address?.id || null,
                receiver_name: receiverName,
                phone: phone,
                country: country,
                province: province,
                city: city,
                district: country === 'ID' ? district : '',
                postal_code: postalCode,
                address: detailAddress,
            };
            await onSave(data);
            onClose();
        } catch (err) {
            console.error("Error saving address:", err);
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 md:p-8 text-slate-800 shadow-2xl z-10"
                        dir={isRtl ? 'rtl' : 'ltr'}
                    >
                        {/* Header Highlight Line */}
                        <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />

                        {/* Header */}
                        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-amber-50 rounded-xl border border-amber-100">
                                    <MapPin className="h-5 w-5 text-amber-600" />
                                </div>
                                <h2 className="text-xl font-bold tracking-wide text-slate-900">
                                    {address ? t('profile.edit_address', 'Ubah Alamat') : t('profile.add_address', 'Tambah Alamat')}
                                </h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSave} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                            id="receiver_name"
                                            type="text"
                                            value={receiverName}
                                            onChange={e => setReceiverName(e.target.value)}
                                            placeholder={t('register.placeholder_receiver', 'Masukkan nama penerima')}
                                            className={`w-full bg-slate-50 text-slate-900 py-3 pl-10 pr-4 rounded-xl border outline-none transition-all duration-300 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 ${errors.receiver_name ? 'border-red-500' : 'border-slate-200'}`}
                                        />
                                    </div>
                                    {errors.receiver_name && <p className="text-xs text-red-500 px-1">{errors.receiver_name}</p>}
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
                                            id="phone"
                                            type="tel"
                                            value={phone}
                                            onChange={e => setPhone(e.target.value)}
                                            placeholder="Contoh: 081234567890"
                                            className={`w-full bg-slate-50 text-slate-900 py-3 pl-10 pr-4 rounded-xl border outline-none transition-all duration-300 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 ${errors.phone ? 'border-red-500' : 'border-slate-200'}`}
                                        />
                                    </div>
                                    {errors.phone && <p className="text-xs text-red-500 px-1">{errors.phone}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Registration Country Type */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 px-1">
                                        {t('register.country', 'Wilayah / Negara')} <span className="text-amber-600">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                            <Globe size={18} />
                                        </div>
                                        <select
                                            value={country === 'ID' ? 'ID' : 'INTL'}
                                            onChange={e => {
                                                const val = e.target.value;
                                                setCountry(val === 'ID' ? 'ID' : '');
                                                setProvince('');
                                                setCity('');
                                                setDistrict('');
                                                setCities([]);
                                                setDistricts([]);
                                            }}
                                            className="w-full bg-slate-50 text-slate-900 appearance-none py-3 pl-10 pr-8 rounded-xl border border-slate-200 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all"
                                        >
                                            <option value="ID">{t('register.type_indonesia', 'User Indonesia')}</option>
                                            <option value="INTL">{t('register.type_international', 'User Internasional')}</option>
                                        </select>
                                    </div>
                                </div>

                                {/* International Country Selection */}
                                {country !== 'ID' && (
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 px-1">
                                            {t('register.country_label', 'Negara (Country)')} <span className="text-amber-600">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                                <Globe size={18} />
                                            </div>
                                            <select
                                                id="country"
                                                value={country}
                                                onChange={e => setCountry(e.target.value)}
                                                className={`w-full bg-slate-50 text-slate-900 appearance-none py-3 pl-10 pr-8 rounded-xl border outline-none transition-all focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 ${errors.country ? 'border-red-500' : 'border-slate-200'}`}
                                                disabled={loadingCountries}
                                            >
                                                <option value="">-- {t('register.select_country', 'Pilih Negara')} --</option>
                                                {countries.map(c => (
                                                    <option key={c.code} value={c.code}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        {errors.country && <p className="text-xs text-red-500 px-1">{errors.country}</p>}
                                    </div>
                                )}
                            </div>

                            {/* Domestic Region (Indonesia) Form */}
                            {country === 'ID' ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                                    id="province"
                                                    value={provinces.find(p => p.name === province)?.code || ''}
                                                    onChange={handleProvinceChange}
                                                    className={`w-full bg-slate-50 text-slate-900 appearance-none py-3 pl-10 pr-8 rounded-xl border outline-none transition-all focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 ${errors.province ? 'border-red-500' : 'border-slate-200'}`}
                                                    disabled={loadingProvinces}
                                                >
                                                    <option value="">-- {t('register.select_province', 'Pilih Provinsi')} --</option>
                                                    {provinces.map(p => (
                                                        <option key={p.code} value={p.code}>{p.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            {errors.province && <p className="text-xs text-red-500 px-1">{errors.province}</p>}
                                        </div>

                                        {/* City */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 px-1">
                                                {t('register.city', 'Kota / Kabupaten')} {loadingCities && <Loader2 className="inline-block w-4 h-4 ml-1 animate-spin text-amber-500" />} <span className="text-amber-600">*</span>
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                                    <Home size={18} />
                                                </div>
                                                <select
                                                    id="city"
                                                    value={cities.find(c => c.name === city)?.code || ''}
                                                    onChange={handleCityChange}
                                                    disabled={loadingCities || cities.length === 0}
                                                    className={`w-full bg-slate-50 text-slate-900 appearance-none py-3 pl-10 pr-8 rounded-xl border outline-none transition-all focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 disabled:opacity-60 ${errors.city ? 'border-red-500' : 'border-slate-200'}`}
                                                >
                                                    <option value="">-- {t('register.select_city', 'Pilih Kota')} --</option>
                                                    {cities.map(c => (
                                                        <option key={c.code} value={c.code}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            {errors.city && <p className="text-xs text-red-500 px-1">{errors.city}</p>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* District */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 px-1">
                                                {t('register.district', 'Kecamatan')} {loadingDistricts && <Loader2 className="inline-block w-4 h-4 ml-1 animate-spin text-amber-500" />} <span className="text-amber-600">*</span>
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                                    <MapPin size={18} />
                                                </div>
                                                <select
                                                    id="district"
                                                    value={district}
                                                    onChange={e => setDistrict(e.target.value)}
                                                    disabled={loadingDistricts || districts.length === 0}
                                                    className={`w-full bg-slate-50 text-slate-900 appearance-none py-3 pl-10 pr-8 rounded-xl border outline-none transition-all focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 disabled:opacity-60 ${errors.district ? 'border-red-500' : 'border-slate-200'}`}
                                                >
                                                    <option value="">-- {t('register.select_district', 'Pilih Kecamatan')} --</option>
                                                    {districts.map(d => (
                                                        <option key={d.code} value={d.name}>{d.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            {errors.district && <p className="text-xs text-red-500 px-1">{errors.district}</p>}
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
                                                    id="postal_code"
                                                    type="text"
                                                    value={postalCode}
                                                    onChange={e => setPostalCode(e.target.value)}
                                                    placeholder="Contoh: 40123"
                                                    className={`w-full bg-slate-50 text-slate-900 py-3 pl-10 pr-4 rounded-xl border outline-none transition-all duration-300 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 ${errors.postal_code ? 'border-red-500' : 'border-slate-200'}`}
                                                />
                                            </div>
                                            {errors.postal_code && <p className="text-xs text-red-500 px-1">{errors.postal_code}</p>}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* International Region Form */
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Province / Region */}
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
                                                value={province}
                                                onChange={e => setProvince(e.target.value)}
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
                                                id="city"
                                                type="text"
                                                value={city}
                                                onChange={e => setCity(e.target.value)}
                                                placeholder="Misal: Jeddah / Mecca"
                                                className={`w-full bg-slate-50 text-slate-900 py-3 pl-10 pr-4 rounded-xl border outline-none transition-all focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 ${errors.city ? 'border-red-500' : 'border-slate-200'}`}
                                            />
                                        </div>
                                        {errors.city && <p className="text-xs text-red-500 px-1">{errors.city}</p>}
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
                                                id="postal_code"
                                                type="text"
                                                value={postalCode}
                                                onChange={e => setPostalCode(e.target.value)}
                                                placeholder="Contoh: 21577"
                                                className={`w-full bg-slate-50 text-slate-900 py-3 pl-10 pr-4 rounded-xl border outline-none transition-all focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 ${errors.postal_code ? 'border-red-500' : 'border-slate-200'}`}
                                            />
                                        </div>
                                        {errors.postal_code && <p className="text-xs text-red-500 px-1">{errors.postal_code}</p>}
                                    </div>
                                </div>
                            )}

                            {/* Detailed Address */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 px-1">
                                    {country === 'ID'
                                        ? t('register.address', 'Alamat Lengkap Pengiriman')
                                        : t('register.sa_address', 'Detail Alamat / Nama Jalan / No. Bangunan')}{' '}
                                    <span className="text-amber-600">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute top-3 left-3 text-slate-400 pointer-events-none">
                                        <MapPin size={18} />
                                    </div>
                                    <textarea
                                        id="address"
                                        rows={3}
                                        value={detailAddress}
                                        onChange={e => setDetailAddress(e.target.value)}
                                        placeholder={
                                            country === 'ID'
                                                ? t('register.place.address', 'Nama jalan, RT/RW, nomor rumah, kelurahan/kecamatan')
                                                : t('register.place.sa_address', 'Nama jalan, nomor bangunan, atau distrik')
                                        }
                                        className={`w-full bg-slate-50 text-slate-900 py-3 pl-10 pr-4 rounded-xl border outline-none transition-all duration-300 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 ${errors.address ? 'border-red-500' : 'border-slate-200'}`}
                                    />
                                </div>
                                {errors.address && <p className="text-xs text-red-500 px-1">{errors.address}</p>}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={saving}
                                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors disabled:opacity-50"
                                >
                                    {t('auth.password.btn_cancel', 'Batal')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-md shadow-amber-500/10 transition-all active:scale-[0.98] disabled:opacity-50"
                                >
                                    {saving ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Check className="h-4 w-4" />
                                    )}
                                    {t('profile.btn_submit', 'Simpan')}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
