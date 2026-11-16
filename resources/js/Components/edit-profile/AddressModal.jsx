import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Compass, Home, Phone, User, Globe, Loader2, Check, ChevronDown } from 'lucide-react';

function AutocompleteInput({
    id,
    label,
    value,
    onChange,
    options = [],
    placeholder = '',
    disabled = false,
    loading = false,
    error = null,
    icon: Icon = MapPin,
    noOptionsText = '',
    required = false,
    disabledPlaceholder = '',
    showProvinceBadge = false,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(value || '');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const listRef = useRef(null);

    // Sinkronkan input ketika value dari parent berubah
    useEffect(() => {
        setSearchTerm(value || '');
    }, [value]);

    // Filter daftar opsi sesuai teks pencarian
    const filteredOptions = useMemo(() => {
        if (!searchTerm || !searchTerm.trim()) return options;
        const q = searchTerm.toLowerCase().trim();
        // Bersihkan prefix umum Indonesia dari kata kunci pencarian
        const cleanQ = q.replace(/^(kota|kabupaten|kab\.|kecamatan|kec\.|provinsi|prov\.)\s+/i, '');

        return options.filter((opt) => {
            if (!opt.name) return false;
            const optNameLower = opt.name.toLowerCase();
            const optClean = optNameLower.replace(/^(kota|kabupaten|kab\.|kecamatan|kec\.|provinsi|prov\.)\s+/i, '');
            const provNameLower = opt.province?.name?.toLowerCase() || '';

            return (
                optNameLower.includes(q) ||
                optClean.includes(cleanQ) ||
                provNameLower.includes(q)
            );
        });
    }, [options, searchTerm]);

    // Reset highlighted index ketika daftar filter berubah
    useEffect(() => {
        setHighlightedIndex(-1);
    }, [filteredOptions]);

    // Auto-scroll item terpilih ke view
    useEffect(() => {
        if (highlightedIndex >= 0 && listRef.current) {
            const items = listRef.current.querySelectorAll('[data-option-item]');
            if (items[highlightedIndex]) {
                items[highlightedIndex].scrollIntoView({ block: 'nearest' });
            }
        }
    }, [highlightedIndex]);

    const resolveSelectionOnBlur = () => {
        if (!searchTerm || !searchTerm.trim()) {
            onChange(null);
            setSearchTerm('');
            return;
        }

        const q = searchTerm.trim().toLowerCase();
        const cleanQ = q.replace(/^(kota|kabupaten|kab\.|kecamatan|kec\.|provinsi|prov\.)\s+/i, '');

        // 1. Exact match
        let match = options.find(opt => opt.name && opt.name.toLowerCase() === q);

        // 2. Prefix-cleaned match (contoh user ketik "surabaya", cocok dengan "KOTA SURABAYA")
        if (!match) {
            match = options.find(opt => {
                if (!opt.name) return false;
                const optClean = opt.name.toLowerCase().replace(/^(kota|kabupaten|kab\.|kecamatan|kec\.|provinsi|prov\.)\s+/i, '');
                return optClean === cleanQ || optClean === q;
            });
        }

        // 3. Jika hanya tersisa 1 opsi hasil pencarian
        if (!match && filteredOptions.length === 1) {
            match = filteredOptions[0];
        }

        if (match) {
            onChange(match);
            setSearchTerm(match.name);
        } else if (value) {
            // Pulihkan nilai valid sebelumnya jika user mengetik yang tidak valid
            setSearchTerm(value);
        } else {
            onChange(null);
            setSearchTerm('');
        }
    };

    // Handle klik di luar dropdown untuk menutup menu
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                if (isOpen) {
                    setIsOpen(false);
                    resolveSelectionOnBlur();
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, options, filteredOptions, searchTerm, value]);

    const handleInputChange = (e) => {
        setSearchTerm(e.target.value);
        if (!isOpen) setIsOpen(true);
    };

    const handleSelect = (opt) => {
        onChange(opt);
        setSearchTerm(opt.name);
        setIsOpen(false);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange(null);
        setSearchTerm('');
        setIsOpen(false);
        if (inputRef.current) inputRef.current.focus();
    };

    const handleFocus = () => {
        if (!disabled) {
            setIsOpen(true);
        }
    };

    const handleKeyDown = (e) => {
        if (disabled) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!isOpen) {
                setIsOpen(true);
            } else {
                setHighlightedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (isOpen) {
                setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
            }
        } else if (e.key === 'Enter') {
            // PENTING: Cegah form submit saat menekan Enter di input autocomplete
            e.preventDefault();
            if (isOpen && filteredOptions.length > 0) {
                const targetOpt = highlightedIndex >= 0 && highlightedIndex < filteredOptions.length
                    ? filteredOptions[highlightedIndex]
                    : filteredOptions[0];
                handleSelect(targetOpt);
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        } else if (e.key === 'Tab') {
            if (isOpen && filteredOptions.length === 1) {
                handleSelect(filteredOptions[0]);
            } else if (isOpen) {
                setIsOpen(false);
                resolveSelectionOnBlur();
            }
        }
    };

    return (
        <div className="space-y-1.5" ref={containerRef}>
            <label htmlFor={id} className="text-xs font-bold uppercase tracking-wider text-slate-600 px-1 flex items-center justify-between">
                <span>
                    {label} {required && <span className="text-amber-600">*</span>}
                </span>
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />}
            </label>

            <div className="relative">
                {/* Icon Kiri */}
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Icon size={18} />
                </div>

                {/* Text Input Autocomplete */}
                <input
                    ref={inputRef}
                    id={id}
                    type="text"
                    value={searchTerm}
                    onChange={handleInputChange}
                    onFocus={handleFocus}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    autoComplete="off"
                    placeholder={disabled && disabledPlaceholder ? disabledPlaceholder : placeholder}
                    className={`w-full bg-slate-50 text-slate-900 py-3 pl-10 pr-16 rounded-xl border outline-none transition-all focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 disabled:opacity-60 disabled:cursor-not-allowed ${
                        error ? 'border-red-500' : 'border-slate-200'
                    }`}
                />

                {/* Tombol Clear & Chevron Kanan */}
                <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1">
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-amber-500 mr-1" />
                    ) : (
                        <>
                            {searchTerm && !disabled && (
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
                                    tabIndex={-1}
                                    title="Hapus"
                                >
                                    <X size={14} />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => !disabled && setIsOpen(prev => !prev)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
                                tabIndex={-1}
                                disabled={disabled}
                            >
                                <ChevronDown
                                    size={16}
                                    className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-amber-600' : ''}`}
                                />
                            </button>
                        </>
                    )}
                </div>

                {/* Dropdown Hasil Autocomplete */}
                <AnimatePresence>
                    {isOpen && !disabled && (
                        <motion.div
                            ref={listRef}
                            initial={{ opacity: 0, y: -4, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-0 right-0 top-full mt-1.5 z-[100] max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10"
                        >
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((opt, idx) => {
                                    const isSelected = value && value.toLowerCase() === opt.name.toLowerCase();
                                    const isHighlighted = idx === highlightedIndex;

                                    return (
                                        <button
                                            key={opt.code || opt.id || opt.name}
                                            type="button"
                                            data-option-item
                                            onClick={() => handleSelect(opt)}
                                            onMouseEnter={() => setHighlightedIndex(idx)}
                                            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl text-left transition-colors ${
                                                isSelected
                                                    ? 'bg-amber-50 text-amber-900 font-bold'
                                                    : isHighlighted
                                                    ? 'bg-slate-100 text-slate-900'
                                                    : 'text-slate-700 hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className="flex flex-col truncate pr-2">
                                                <span className="truncate">{opt.name}</span>
                                                {showProvinceBadge && opt.province?.name && (
                                                    <span className="text-[10px] text-slate-400 font-normal">
                                                        {opt.province.name}
                                                    </span>
                                                )}
                                            </div>
                                            {isSelected && <Check size={14} className="text-amber-600 shrink-0 ml-2" />}
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="py-3 px-3 text-center text-xs text-slate-400">
                                    {noOptionsText || 'Tidak ditemukan pilihan'}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {error && <p className="text-xs text-red-500 px-1">{error}</p>}
        </div>
    );
}

export default function AddressModal({ isOpen, onClose, onSave, address = null, t, locale }) {
    const isRtl = locale === 'arabic' || locale === 'ar';

    const [receiverName, setReceiverName] = useState('');
    const [phone, setPhone] = useState('');
    const [country, setCountry] = useState('ID');
    const [province, setProvince] = useState('');
    const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
    const [city, setCity] = useState('');
    const [selectedCityCode, setSelectedCityCode] = useState('');
    const [district, setDistrict] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [detailAddress, setDetailAddress] = useState('');

    // Dynamic Lists & Loaders for Indonesia
    const [provinces, setProvinces] = useState([]);
    const [allCities, setAllCities] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);
    const [loadingDistricts, setLoadingDistricts] = useState(false);
    const [loadingPostalCode, setLoadingPostalCode] = useState(false);

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
                setSelectedProvinceCode('');
                setCity('');
                setSelectedCityCode('');
                setDistrict('');
                setDistricts([]);
                setPostalCode('');
                setDetailAddress('');
            }
        }
    }, [isOpen, address]);

    const loadDistricts = (cityCode, currentDistrictName = '') => {
        if (!cityCode) return;
        setLoadingDistricts(true);
        axios.get(`/api/districts/${cityCode}`)
            .then((res) => {
                const list = res.data || [];
                setDistricts(list);
                setLoadingDistricts(false);

                if (currentDistrictName) {
                    const targetDist = currentDistrictName.trim().toLowerCase();
                    const cleanTargetDist = targetDist.replace(/^(kecamatan|kec\.)\s+/i, '');
                    const matchedDist = list.find(d => {
                        if (!d.name) return false;
                        const dLower = d.name.trim().toLowerCase();
                        const dClean = dLower.replace(/^(kecamatan|kec\.)\s+/i, '');
                        return dLower === targetDist || dClean === cleanTargetDist;
                    });
                    if (matchedDist) {
                        setDistrict(matchedDist.name);
                    }
                }
            })
            .catch(() => setLoadingDistricts(false));
    };

    // Load regions when modal opens
    useEffect(() => {
        if (!isOpen) return;

        if (country === 'ID') {
            setLoadingProvinces(true);
            setLoadingCities(true);

            Promise.all([
                axios.get('/api/provinces'),
                axios.get('/api/cities')
            ])
            .then(([provRes, cityRes]) => {
                const provList = provRes.data || [];
                const cityList = cityRes.data || [];
                setProvinces(provList);
                setAllCities(cityList);
                setLoadingProvinces(false);
                setLoadingCities(false);

                // Hydrate existing address cities/districts if editing
                if (address && address.country === 'ID') {
                    let matchedProv = null;
                    if (address.province) {
                        const targetProv = address.province.trim().toLowerCase();
                        matchedProv = provList.find(p => p.name && p.name.trim().toLowerCase() === targetProv);
                        if (matchedProv) {
                            setSelectedProvinceCode(matchedProv.code);
                        }
                    }

                    if (address.city) {
                        const targetCity = address.city.trim().toLowerCase();
                        const cleanTargetCity = targetCity.replace(/^(kota|kabupaten|kab\.)\s+/i, '');

                        const matchedCity = cityList.find(c => {
                            if (!c.name) return false;
                            const cLower = c.name.trim().toLowerCase();
                            const cClean = cLower.replace(/^(kota|kabupaten|kab\.)\s+/i, '');
                            return cLower === targetCity || cClean === cleanTargetCity;
                        });

                        if (matchedCity) {
                            setSelectedCityCode(matchedCity.code);
                            if (!matchedProv && matchedCity.province_code) {
                                setSelectedProvinceCode(matchedCity.province_code);
                                const foundProv = provList.find(p => String(p.code) === String(matchedCity.province_code));
                                if (foundProv) setProvince(foundProv.name);
                            }
                            loadDistricts(matchedCity.code, address.district);
                        }
                    }
                }
            })
            .catch((err) => {
                console.error("Error loading Indonesia regions:", err);
                setLoadingProvinces(false);
                setLoadingCities(false);
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

    // Opsi Kota yang tersedia: jika provinsi dipilih, filter berdasarkan provinsi tsb. Jika belum, tampilkan semua kota!
    const availableCities = useMemo(() => {
        if (selectedProvinceCode) {
            return allCities.filter(c => String(c.province_code) === String(selectedProvinceCode));
        }
        return allCities;
    }, [allCities, selectedProvinceCode]);

    const handleProvinceSelect = (selectedProv) => {
        if (!selectedProv) {
            setProvince('');
            setSelectedProvinceCode('');
            return;
        }

        setProvince(selectedProv.name);
        setSelectedProvinceCode(selectedProv.code);

        // Jika kota yang sudah dipilih sebelumnya bukan dari provinsi ini, reset kota & kecamatan
        if (city && selectedCityCode) {
            const cityBelongs = allCities.some(
                c => String(c.code) === String(selectedCityCode) && String(c.province_code) === String(selectedProv.code)
            );
            if (!cityBelongs) {
                setCity('');
                setSelectedCityCode('');
                setDistrict('');
                setDistricts([]);
            }
        }
    };

    const handleCitySelect = (selectedCity) => {
        if (!selectedCity) {
            setCity('');
            setSelectedCityCode('');
            setDistrict('');
            setDistricts([]);
            return;
        }

        setCity(selectedCity.name);
        setSelectedCityCode(selectedCity.code);
        setDistrict('');
        setDistricts([]);

        // Otomatis sinkronkan provinsi jika belum dipilih atau berbeda
        if (selectedCity.province_code) {
            setSelectedProvinceCode(selectedCity.province_code);
            const provObj = provinces.find(p => String(p.code) === String(selectedCity.province_code));
            if (provObj) {
                setProvince(provObj.name);
            } else if (selectedCity.province?.name) {
                setProvince(selectedCity.province.name);
            }
        }

        // Muat kecamatan untuk kota terpilih
        loadDistricts(selectedCity.code);
    };

    const fetchPostalCode = (districtName, cityName, provinceName) => {
        const d = districtName || district || '';
        const c = cityName || city || '';
        const p = provinceName || province || '';

        if (!d && !c) return;
        setLoadingPostalCode(true);
        axios.get('/api/postal-code', {
            params: {
                district: d,
                city: c,
                province: p,
            }
        })
        .then((res) => {
            if (res.data?.success && res.data?.postal_code) {
                setPostalCode(String(res.data.postal_code));
            }
        })
        .catch((err) => {
            console.error("Error auto-fetching postal code:", err);
        })
        .finally(() => {
            setLoadingPostalCode(false);
        });
    };

    const handleDistrictSelect = (selectedDistrict) => {
        if (!selectedDistrict) {
            setDistrict('');
            return;
        }
        setDistrict(selectedDistrict.name);

        // Otomatis deteksi kode pos dari Biteship berdasarkan kecamatan, kota, provinsi
        fetchPostalCode(selectedDistrict.name, city, province);
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
                                        <AutocompleteInput
                                            id="province"
                                            label={t('register.province', 'Provinsi')}
                                            value={province}
                                            onChange={handleProvinceSelect}
                                            options={provinces}
                                            placeholder={t('register.search_province', 'Ketik atau pilih provinsi...')}
                                            loading={loadingProvinces}
                                            error={errors.province}
                                            icon={Compass}
                                            required
                                            noOptionsText={t('register.no_options_found', 'Provinsi tidak ditemukan')}
                                        />

                                        {/* City */}
                                        <AutocompleteInput
                                            id="city"
                                            label={t('register.city', 'Kota / Kabupaten')}
                                            value={city}
                                            onChange={handleCitySelect}
                                            options={availableCities}
                                            placeholder={t('register.search_city', 'Ketik atau pilih kota / kabupaten...')}
                                            disabled={loadingCities}
                                            loading={loadingCities}
                                            error={errors.city}
                                            icon={Home}
                                            required
                                            showProvinceBadge={!selectedProvinceCode}
                                            noOptionsText={t('register.no_options_found', 'Kota / Kabupaten tidak ditemukan')}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* District */}
                                        <AutocompleteInput
                                            id="district"
                                            label={t('register.district', 'Kecamatan')}
                                            value={district}
                                            onChange={handleDistrictSelect}
                                            options={districts}
                                            placeholder={t('register.search_district', 'Ketik atau pilih kecamatan...')}
                                            disabled={!selectedCityCode || loadingDistricts}
                                            disabledPlaceholder={!selectedCityCode ? t('register.select_city_first', 'Pilih kota terlebih dahulu') : ''}
                                            loading={loadingDistricts}
                                            error={errors.district}
                                            icon={MapPin}
                                            required
                                            noOptionsText={t('register.no_options_found', 'Kecamatan tidak ditemukan')}
                                        />

                                        {/* Postal Code */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 px-1 flex items-center justify-between">
                                                <span>
                                                    {t('register.postal_code', 'Kode Pos')} <span className="text-amber-600">*</span>
                                                </span>
                                                {loadingPostalCode && (
                                                    <span className="flex items-center gap-1 text-[11px] text-amber-600 font-semibold lowercase">
                                                        <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                                                        <span>{t('register.auto_detecting_postal', 'mencari kode pos otomatis...')}</span>
                                                    </span>
                                                )}
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
                                                    placeholder={loadingPostalCode ? t('register.auto_detecting_postal', 'Mencari kode pos otomatis...') : "Contoh: 40123"}
                                                    className={`w-full bg-slate-50 text-slate-900 py-3 pl-10 pr-16 rounded-xl border outline-none transition-all duration-300 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 ${errors.postal_code ? 'border-red-500' : 'border-slate-200'}`}
                                                />
                                                {loadingPostalCode ? (
                                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                        <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                                                    </div>
                                                ) : (
                                                    (district || city) && (
                                                        <button
                                                            type="button"
                                                            onClick={() => fetchPostalCode(district, city, province)}
                                                            title="Deteksi ulang kode pos otomatis dari Biteship"
                                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                                                        >
                                                            <span className="text-[11px] bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-amber-700 px-2 py-0.5 rounded-lg active:scale-95 transition-all">
                                                                Auto
                                                            </span>
                                                        </button>
                                                    )
                                                )}
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
