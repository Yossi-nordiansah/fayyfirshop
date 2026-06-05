import React from "react";
import { Truck, Activity, AlertCircle } from "lucide-react";

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
        <section className="p-6 bg-white border border-slate-100 shadow-sm rounded-3xl">
            <h2 className="text-base font-extrabold text-slate-900 pb-4 mb-4 border-b border-slate-100 flex items-center gap-2">
                <Truck className="text-amber-500" size={18} />
                {t("checkout.courier_section", "Opsi Jasa Pengiriman")}
            </h2>

            {!areaId ? (
                <div className="flex flex-col items-center justify-center py-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Truck size={28} className="mb-2 opacity-50" />
                    <p className="text-xs">{t("checkout.select_area_first", "Harap tentukan/verifikasi alamat untuk menghitung ongkir.")}</p>
                </div>
            ) : isLoadingRates ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500">
                    <Activity size={24} className="mb-2 animate-spin text-blue-700" />
                    <p className="text-xs">Menghitung tarif pengiriman (Biteship API)...</p>
                </div>
            ) : rates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <AlertCircle size={28} className="mb-2 opacity-50 text-rose-500" />
                    <p className="text-xs">Kurir tidak tersedia untuk rute terpilih.</p>
                </div>
            ) : (
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                    {rates.map((rate, idx) => {
                        const isSelected = selectedRate?.courier_name === rate.courier_name && selectedRate?.courier_service_name === rate.courier_service_name;
                        return (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => setSelectedRate(rate)}
                                className={`p-4 border rounded-2xl text-left transition-all duration-300 ${isSelected
                                    ? 'border-blue-600 bg-blue-50/40 text-blue-900 shadow-sm ring-1 ring-blue-600'
                                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <span className="text-xs font-extrabold uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{rate.courier_name}</span>
                                        <span className="ml-2 text-xs font-bold text-slate-500">{rate.courier_service_name}</span>
                                    </div>
                                    <span className="text-sm font-extrabold text-blue-950">{formatPrice(rate.price)}</span>
                                </div>
                                <p className="mt-2 text-xs text-slate-500">Estimasi Tiba: {rate.duration}</p>
                            </button>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
