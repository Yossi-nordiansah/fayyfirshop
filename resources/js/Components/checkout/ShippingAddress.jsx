import React from "react";
import { motion } from "framer-motion";
import { MapPin, User as UserIcon, Phone, ShieldCheck, AlertCircle } from "lucide-react";

export default function ShippingAddress({
    t,
    user,
    addressForm,
    setAddressForm
}) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="p-6 bg-white border border-slate-100 shadow-xl shadow-slate-100/40 rounded-3xl backdrop-blur-sm"
        >
            {/* Header Section */}
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
                <h2 className="text-sm md:text-base font-extrabold text-slate-900 flex items-center gap-2.5">
                    <div className="p-1.5 bg-amber-50 rounded-xl border border-amber-100">
                        <MapPin className="text-amber-600" size={18} />
                    </div>
                    {t("checkout.address_section", "Alamat Pengiriman")}
                </h2>

                {addressForm.area_id ? (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50/70 px-3 py-1.5 rounded-full border border-emerald-100 shadow-sm transition-all duration-300">
                        <ShieldCheck size={14} className="animate-pulse" />
                        <span>{t("checkout.address_verified", "Alamat Terverifikasi")}</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50/70 px-3 py-1.5 rounded-full border border-rose-100 shadow-sm transition-all duration-300">
                        <AlertCircle size={14} />
                        <span>{t("checkout.address_unverified", "Alamat Belum Terverifikasi")}</span>
                    </div>
                )}
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
    );
}