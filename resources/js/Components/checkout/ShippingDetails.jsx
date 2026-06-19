import React from "react";

export default function ShippingDetails({ selectedBranch, selectedRate, totalWeight, t }) {
    const formatWeight = (grams) => {
        return `${grams} ${t("checkout.summary.grams", "gram")}`;
    };

    if (!selectedBranch && totalWeight <= 0) return null;

    return (
        <div className="py-3.5 border-b border-slate-100 text-[11px] text-slate-500 space-y-2 bg-slate-50/50 p-3 rounded-2xl mt-4">
            {selectedBranch && (
                <div className="flex justify-between items-center">
                    <span className="font-medium">{t("checkout.summary.branch", "Gudang Pengirim:")}</span>
                    <strong className="text-slate-800 font-bold">{selectedBranch.name}</strong>
                </div>
            )}
            {selectedBranch && (
                <div className="flex justify-between items-center">
                    <span className="font-medium">{t("checkout.summary.shipping_method", "Metode Kirim:")}</span>
                    <strong className="text-slate-800 font-bold">
                        {selectedRate ? `${selectedRate.courier_name} (${selectedRate.courier_service_name})` : '-'}
                    </strong>
                </div>
            )}
            {totalWeight > 0 && (
                <div className="flex justify-between items-center">
                    <span className="font-medium">{t("checkout.summary.total_weight", "Total Berat:")}</span>
                    <strong className="text-slate-800 font-bold">{formatWeight(totalWeight)}</strong>
                </div>
            )}
        </div>
    );
}
