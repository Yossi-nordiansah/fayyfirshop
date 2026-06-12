import React from "react";
import { MapPin, User as UserIcon, Phone, ShieldCheck, AlertCircle } from "lucide-react";

export default function ShippingAddress({
    t,
    user,
    addressForm,
    setAddressForm
}) {
    return (
        <section className="p-6 bg-white border border-slate-100 shadow-sm rounded-3xl">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <MapPin className="text-amber-500" size={18} />
                    {t("checkout.address_section", "Alamat Pengiriman")}
                </h2>
                {addressForm.area_id ? (
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 shadow-sm">
                        <ShieldCheck size={14} />
                        <span>Alamat Terverifikasi</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-100 shadow-sm">
                        <AlertCircle size={14} />
                        <span>Alamat Belum Terverifikasi</span>
                    </div>
                )}
            </div>

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
        </section>
    );
}
