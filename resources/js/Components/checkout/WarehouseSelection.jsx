import React from "react";
import { Store } from "lucide-react";

export default function WarehouseSelection({
    t,
    storeBranches,
    selectedBranchId,
    setSelectedBranchId,
    stocksData,
    cartItems,
    userCountry
}) {
    // Filter out branches outside Indonesia if user is from Indonesia
    const filteredBranches = storeBranches.filter(branch => {
        if (userCountry === 'ID') {
            return branch.country_code === 'ID';
        }
        return true;
    });

    if (userCountry === 'ID') {
        const branch = filteredBranches[0];
        if (!branch) return null;

        const branchStocks = stocksData[branch.id] || [];
        const hasAllStock = cartItems.every(item => {
            const stockItem = branchStocks.find(s => s.id === item.id && s.variantId === item.variantId);
            return stockItem && stockItem.stock >= item.quantity;
        });

        const fullAddress = [
            branch.detail_address || branch.street,
            branch.district,
            branch.city,
            branch.province,
            branch.postal_code,
            branch.country_name
        ].filter(Boolean).join(", ");

        return (
            <section className="p-6 bg-white border border-slate-100 shadow-sm rounded-3xl">
                <h2 className="text-base font-extrabold text-slate-900 pb-4 mb-4 border-b border-slate-100 flex items-center gap-2">
                    <Store className="text-amber-500" size={18} />
                    {t("checkout.warehouse_section", "Gudang Pengirim")}
                </h2>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                {branch.code} {t("checkout.warehouse.label", "Gudang")}
                            </span>
                            <span className={`inline-block w-2 h-2 rounded-full ${hasAllStock ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                        </div>
                        <h3 className="mt-1 text-sm font-bold text-slate-800">{branch.name}</h3>
                        <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed">{fullAddress}</p>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold self-start md:self-auto">
                        {hasAllStock ? (
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-1 border border-emerald-200 rounded-full">
                                {t("checkout.warehouse.stock_ok", "Stok Cukup")}
                            </span>
                        ) : (
                            <span className="text-amber-700 bg-amber-50 px-2 py-1 border border-amber-200 rounded-full">
                                {t("checkout.warehouse.stock_partial", "Sebagian Kosong")}
                            </span>
                        )}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="p-6 bg-white border border-slate-100 shadow-sm rounded-3xl">
            <h2 className="text-base font-extrabold text-slate-900 pb-4 mb-4 border-b border-slate-100 flex items-center gap-2">
                <Store className="text-amber-500" size={18} />
                {t("checkout.warehouse_section_multi", "Gudang Pengirim (Multi-Warehouse)")}
            </h2>
            <p className="mb-4 text-xs text-slate-500 leading-relaxed">
                {t("checkout.warehouse.subtitle", "Secara default dikirim dari cabang terdekat negara Anda. Anda bisa memindahkan cabang jika stok kosong.")}
            </p>

            <div className="grid gap-3 md:grid-cols-3">
                {filteredBranches.map(branch => {
                    const isSelected = selectedBranchId === branch.id;
                    const branchStocks = stocksData[branch.id] || [];
                    const hasAllStock = cartItems.every(item => {
                        const stockItem = branchStocks.find(s => s.id === item.id && s.variantId === item.variantId);
                        return stockItem && stockItem.stock >= item.quantity;
                    });

                    const fullAddress = [
                        branch.detail_address || branch.street,
                        branch.district,
                        branch.city,
                        branch.province,
                        branch.postal_code,
                        branch.country_name
                    ].filter(Boolean).join(", ");

                    return (
                        <button
                            key={branch.id}
                            type="button"
                            onClick={() => setSelectedBranchId(branch.id)}
                            className={`p-4 border rounded-2xl text-left transition-all duration-300 flex flex-col justify-between h-full ${isSelected
                                    ? 'border-blue-600 bg-blue-50/40 text-blue-900 shadow-sm ring-1 ring-blue-600'
                                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                }`}
                        >
                            <div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                        {branch.code} {t("checkout.warehouse.label", "Gudang")}
                                    </span>
                                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${hasAllStock ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                                </div>
                                <h3 className="mt-2 text-sm font-bold">{branch.name}</h3>
                                <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">{fullAddress}</p>
                            </div>
                            <div className="mt-4 flex items-center gap-1 text-[10px] font-bold">
                                {hasAllStock ? (
                                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200 rounded-full">
                                        {t("checkout.warehouse.stock_ok", "Stok Cukup")}
                                    </span>
                                ) : (
                                    <span className="text-amber-700 bg-amber-50 px-2 py-0.5 border border-amber-200 rounded-full">
                                        {t("checkout.warehouse.stock_partial", "Sebagian Kosong")}
                                    </span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}