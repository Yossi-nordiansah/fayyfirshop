import React, { useState, useEffect } from "react";
import { MapPin, User as UserIcon, Phone, ShieldCheck, AlertCircle } from "lucide-react";
import axios from "axios";

export default function ShippingAddress({
    t,
    user,
    addressForm,
    setAddressForm
}) {
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Handle Biteship Area Autocomplete Search
    useEffect(() => {
        if (searchQuery.trim().length < 3) {
            setSearchResults([]);
            return;
        }

        const delayDebounce = setTimeout(() => {
            setIsSearching(true);
            axios.get(route('checkout.search-area'), {
                params: {
                    input: searchQuery,
                    countries: user?.country ?? 'ID'
                }
            })
            .then(res => {
                if (res.data && res.data.areas) {
                    setSearchResults(res.data.areas);
                } else {
                    setSearchResults([]);
                }
            })
            .catch(err => {
                console.error(err);
            })
            .finally(() => {
                setIsSearching(false);
            });
        }, 600);

        return () => clearTimeout(delayDebounce);
    }, [searchQuery]);

    const handleSelectArea = (area) => {
        setAddressForm(prev => ({
            ...prev,
            area_id: area.id,
            city: area.administrative_division_level_2_name || '',
            district: area.administrative_division_level_3_name || '',
            province: area.administrative_division_level_1_name || '',
            postal_code: String(area.postal_code || ''),
        }));
        setSearchQuery(area.name);
        setSearchResults([]);
    };

    return (
        <section className="p-6 bg-white border border-slate-100 shadow-sm rounded-3xl">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <MapPin className="text-amber-500" size={18} />
                    {t("checkout.address_section", "Alamat Pengiriman")}
                </h2>
                <button
                    type="button"
                    onClick={() => setIsEditingAddress(!isEditingAddress)}
                    className="text-xs font-bold text-blue-700 hover:underline"
                >
                    {isEditingAddress ? t("checkout.address.save_edit", "Selesai Mengedit") : t("checkout.address.edit", "Ubah Alamat")}
                </button>
            </div>

            {!isEditingAddress ? (
                <div className="text-slate-700 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-bold">
                        <UserIcon size={14} className="text-slate-400" />
                        <span>Penerima: {addressForm.receiver_name}</span>
                        <span className="text-slate-300">|</span>
                        <Phone size={14} className="text-slate-400" />
                        <span>{addressForm.phone}</span>
                        {addressForm.area_id && (
                            <ShieldCheck size={16} className="text-emerald-600 ml-1" />
                        )}
                    </div>
                    <p className="text-sm leading-relaxed pl-6 text-slate-600">
                        {addressForm.address}
                    </p>
                    <p className="text-xs pl-6 font-semibold text-slate-500">
                        {addressForm.district ? addressForm.district + ', ' : ''}
                        {addressForm.city}, {addressForm.province} {addressForm.postal_code}
                    </p>
                    {!addressForm.area_id && (
                        <div className="inline-flex items-center gap-1.5 mt-2 ml-6 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 border border-rose-200 rounded-full">
                            <AlertCircle size={11} />
                            <span>{t("checkout.area_unverified", "Area Belum Terverifikasi (Biteship)")}</span>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="block mb-1.5 text-xs font-semibold text-slate-600">{t("register.receiver_name", "Nama Penerima")}</label>
                            <input
                                type="text"
                                value={addressForm.receiver_name}
                                onChange={e => setAddressForm({...addressForm, receiver_name: e.target.value})}
                                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 focus:bg-white"
                            />
                        </div>
                        <div>
                            <label className="block mb-1.5 text-xs font-semibold text-slate-600">{t("register.phone", "Nomor Telepon")}</label>
                            <input
                                type="text"
                                value={addressForm.phone}
                                onChange={e => setAddressForm({...addressForm, phone: e.target.value})}
                                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 focus:bg-white"
                            />
                        </div>
                    </div>

                    {user?.country === 'ID' && (
                        <div className="relative">
                            <label className="block mb-1.5 text-xs font-semibold text-slate-600">{t("checkout.search_area", "Cari Kelurahan, Kecamatan, atau Kota (Biteship)")}</label>
                            <input
                                type="text"
                                placeholder="Ketik min. 3 karakter (contoh: Pesanggrahan)..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 focus:bg-white"
                            />
                            {isSearching && <div className="absolute right-3 top-9 text-xs text-slate-400">Searching...</div>}
                            {searchResults.length > 0 && (
                                <ul className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto divide-y divide-slate-100">
                                    {searchResults.map(area => (
                                        <li key={area.id}>
                                            <button
                                                type="button"
                                                onClick={() => handleSelectArea(area)}
                                                className="w-full px-4 py-2 text-left text-xs hover:bg-blue-50 text-slate-700 transition"
                                            >
                                                <span className="font-semibold block text-slate-900">{area.name}</span>
                                                <span className="text-[10px] text-slate-400">ID: {area.id}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    <div>
                        <label className="block mb-1.5 text-xs font-semibold text-slate-600">{t("register.address", "Detail Alamat / Nama Jalan / No. Rumah")}</label>
                        <textarea
                            rows={2}
                            value={addressForm.address}
                            onChange={e => setAddressForm({...addressForm, address: e.target.value})}
                            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 focus:bg-white"
                        />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-4">
                        <div>
                            <label className="block mb-1.5 text-xs font-semibold text-slate-600">Provinsi</label>
                            <input
                                type="text"
                                value={addressForm.province}
                                onChange={e => setAddressForm({...addressForm, province: e.target.value})}
                                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 focus:bg-white"
                            />
                        </div>
                        <div>
                            <label className="block mb-1.5 text-xs font-semibold text-slate-600">Kota/Kab</label>
                            <input
                                type="text"
                                value={addressForm.city}
                                onChange={e => setAddressForm({...addressForm, city: e.target.value})}
                                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 focus:bg-white"
                            />
                        </div>
                        <div>
                            <label className="block mb-1.5 text-xs font-semibold text-slate-600">Kecamatan</label>
                            <input
                                type="text"
                                value={addressForm.district}
                                onChange={e => setAddressForm({...addressForm, district: e.target.value})}
                                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 focus:bg-white"
                            />
                        </div>
                        <div>
                            <label className="block mb-1.5 text-xs font-semibold text-slate-600">Kode Pos</label>
                            <input
                                type="text"
                                value={addressForm.postal_code}
                                onChange={e => setAddressForm({...addressForm, postal_code: e.target.value})}
                                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 focus:bg-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block mb-1.5 text-[10px] font-bold text-slate-500">BITESHIP AREA ID (READ-ONLY)</label>
                        <input
                            type="text"
                            readOnly
                            disabled
                            value={addressForm.area_id}
                            placeholder="Pencarian area di atas akan mengisi kode Biteship secara otomatis"
                            className="w-full text-xs bg-slate-100 border border-slate-200 text-slate-500 rounded-xl px-3 py-2.5 outline-none"
                        />
                    </div>
                </div>
            )}
        </section>
    );
}
