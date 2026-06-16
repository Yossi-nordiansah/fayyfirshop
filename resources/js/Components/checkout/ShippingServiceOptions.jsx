import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Truck, Activity, AlertCircle } from "lucide-react";

const getCourierLogo = (courierName) => {
    if (!courierName) return null;
    const name = courierName.toLowerCase();
    if (name.includes("jne")) return "/images/couriers/jne.png";
    if (name.includes("j&t") || name.includes("jnt") || name.includes("j-t") || name.includes("j and t")) return "/images/couriers/jnt.png";
    if (name.includes("sicepat") || name.includes("si cepat")) return "/images/couriers/sicepat.png";
    if (name.includes("pos")) return "/images/couriers/pos.png";
    if (name.includes("anteraja") || name.includes("anter aja")) return "/images/couriers/anteraja.png";
    if (name.includes("tiki")) return "/images/couriers/tiki.png";
    return null;
};

export default function ShippingServiceOptions({
    t,
    areaId,
    isLoadingRates,
    rates,
    selectedRate,
    setSelectedRate,
    formatPrice
}) {
    return (
        <section className="p-6 bg-white border border-slate-100 shadow-xl shadow-slate-100/40 rounded-3xl">
            {/* Header Section */}
            <h2 className="text-sm md:text-base font-extrabold text-slate-900 pb-4 mb-5 border-b border-slate-100 flex items-center gap-2.5">
                <div className="p-1.5 bg-amber-50 rounded-xl border border-amber-100">
                    <Truck className="text-amber-600" size={18} />
                </div>
                {t("checkout.courier_section", "Opsi Jasa Pengiriman")}
            </h2>

            {/* Main Content Area with Micro-animations */}
            <div className="relative overflow-hidden min-h-[120px] flex flex-col justify-center">
                <AnimatePresence mode="wait">
                    {!areaId ? (
                        <motion.div
                            key="no-area"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-8 px-4 text-center text-slate-400 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200"
                        >
                            <Truck size={32} className="mb-2.5 text-slate-300" />
                            <p className="text-xs font-medium leading-relaxed max-w-sm">
                                {t("checkout.select_area_first", "Harap tentukan/verifikasi alamat untuk menghitung ongkir.")}
                            </p>
                        </motion.div>
                    ) : isLoadingRates ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-10 text-center text-slate-500"
                        >
                            <Activity size={26} className="mb-2.5 animate-spin text-blue-700" />
                            <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                                {t("checkout.loading_rates", "Memuat Layanan Pengiriman...")}
                            </p>
                        </motion.div>
                    ) : rates.length === 0 ? (
                        <motion.div
                            key="empty-rates"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-8 px-4 text-center text-slate-400 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200"
                        >
                            <AlertCircle size={32} className="mb-2.5 text-rose-400" />
                            <p className="text-xs font-medium text-rose-600/90">
                                {t("checkout.couriers_not_available", "Kurir tidak tersedia untuk rute terpilih.")}
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="rates-list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid gap-3 grid-cols-1"
                        >
                            {rates.map((rate, idx) => {
                                const isSelected = selectedRate?.courier_name === rate.courier_name &&
                                    selectedRate?.courier_service_name === rate.courier_service_name;
                                const logoPath = getCourierLogo(rate.courier_name);

                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setSelectedRate(rate)}
                                        className={`p-4 border rounded-2xl text-left transition-all duration-300 flex items-center justify-between ${isSelected
                                                ? 'border-blue-600 bg-blue-50/40 text-blue-900 shadow-md ring-1 ring-blue-600/50'
                                                : 'border-slate-100 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/40'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Logo Wrapper */}
                                            {logoPath ? (
                                                <div className="w-14 h-9 flex items-center justify-center bg-white rounded-xl border border-slate-100 p-1.5 shadow-sm flex-shrink-0">
                                                    <img
                                                        src={logoPath}
                                                        alt={rate.courier_name}
                                                        className="max-w-full max-h-full object-contain"
                                                    />
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200/50 flex-shrink-0">
                                                    {rate.courier_name}
                                                </span>
                                            )}

                                            {/* Service Details */}
                                            <div>
                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                                    {logoPath && (
                                                        <span className="text-xs font-extrabold uppercase text-slate-800">{rate.courier_name}</span>
                                                    )}
                                                    <span className="text-xs font-bold text-slate-500 bg-slate-100/60 px-1.5 py-0.5 rounded-md">{rate.courier_service_name}</span>
                                                </div>
                                                <p className="text-[10px] md:text-xs font-medium text-slate-400 mt-1">
                                                    {t("checkout.estimated_arrival", "Estimasi Tiba")}: {rate.duration}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Price Section */}
                                        <span className={`text-sm md:text-base font-black ml-4 flex-shrink-0 ${isSelected ? 'text-blue-900' : 'text-slate-900'
                                            }`}>
                                            {formatPrice(rate.price)}
                                        </span>
                                    </button>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}