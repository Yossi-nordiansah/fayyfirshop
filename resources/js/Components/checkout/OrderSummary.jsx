import React from "react";
import { AlertCircle, Activity, Check, Ticket } from "lucide-react";

export default function OrderSummary({
    t,
    cartItems,
    selectedBranch,
    selectedRate,
    subtotal,
    shippingCost,
    grandTotal,
    errorMsg,
    isPlacingOrder,
    formatPrice,
    formatNumber,
    handlePlaceOrder,
    userVouchers = [],
    voucherCode = "",
    setVoucherCode,
    appliedManualVoucher = null,
    appliedEventVoucher = null,
    manualDiscount = 0,
    eventDiscount = 0,
    applyManualVoucher,
    applyEventVoucher,
    removeManualVoucher,
    removeEventVoucher,
    voucherError = "",
    voucherSuccess = "",
    isApplyingVoucher = false,
    totalWeight = 0,
    appliedReferral = null,
    referralDiscount = 0,
    removeReferral,
}) {
    const formatWeight = (grams) => {
        return `${grams} gram`;
    };
    return (
        <aside className="p-5 border shadow-sm h-fit rounded-3xl border-slate-100 bg-slate-50 lg:sticky lg:top-28">
            <h2 className="text-lg font-bold text-slate-950 pb-3 border-b border-slate-200/80">
                {t("cart.summary", "Ringkasan Pesanan")}
            </h2>

            {/* Items List */}
            <div className="py-4 space-y-3 border-b border-slate-200/80 max-h-60 overflow-y-auto">
                {cartItems.map(item => (
                    <div key={`${item.id}-${item.variantId ?? 'base'}`} className="flex gap-3 text-xs">
                        <img src={item.image} alt={item.title} className="w-10 h-10 object-cover rounded bg-white border border-slate-200" />
                        <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-slate-900 truncate">{item.title}</h4>
                            <p className="text-[10px] text-slate-500 truncate">
                                {item.size ? `${item.size} ` : ''}
                                {item.color ? `| Color: ${item.color} ` : ''}
                                x {formatNumber(item.quantity)}
                            </p>
                        </div>
                        <span className="font-bold text-slate-900 text-right">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                ))}
            </div>

            {/* Shipping point details */}
            {(selectedBranch || totalWeight > 0) && (
                <div className="py-3 border-b border-slate-200/80 text-[11px] text-slate-500 space-y-1">
                    {selectedBranch && (
                        <div className="flex justify-between">
                            <span>Gudang Pengirim:</span>
                            <strong className="text-slate-800">{selectedBranch.name}</strong>
                        </div>
                    )}
                    {selectedBranch && (
                        <div className="flex justify-between">
                            <span>Metode Kirim:</span>
                            <strong className="text-slate-800">{selectedRate ? `${selectedRate.courier_name} (${selectedRate.courier_service_name})` : '-'}</strong>
                        </div>
                    )}
                    {totalWeight > 0 && (
                        <div className="flex justify-between">
                            <span>Total Berat:</span>
                            <strong className="text-slate-800">{formatWeight(totalWeight)}</strong>
                        </div>
                    )}
                </div>
            )}

            {/* Financial breakdown */}
            <div className="py-4 space-y-2 border-b border-slate-200/80 text-sm">
                <div className="flex justify-between text-slate-600">
                    <span>{t("cart.subtotal", "Subtotal")}</span>
                    <span className="font-bold text-slate-900">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                    <span>{t("checkout.shipping_fee", "Ongkos Kirim")}</span>
                    <span className="font-bold text-slate-900">{selectedRate ? formatPrice(shippingCost) : '-'}</span>
                </div>
                {appliedManualVoucher && (
                    <div className="flex justify-between text-emerald-650 font-semibold animate-fade-in">
                        <span>{appliedManualVoucher.name}</span>
                        <span>-{formatPrice(manualDiscount)}</span>
                    </div>
                )}
                {appliedEventVoucher && (
                    <div className="flex justify-between text-emerald-650 font-semibold animate-fade-in">
                        <span>{appliedEventVoucher.name}</span>
                        <span>-{formatPrice(eventDiscount)}</span>
                    </div>
                )}
                {appliedReferral && (
                    <div className="flex justify-between text-emerald-650 font-semibold animate-fade-in">
                        <span>Referral ({appliedReferral.code})</span>
                        <span>-{formatPrice(referralDiscount)}</span>
                    </div>
                )}
            </div>

            {/* Voucher Section */}
            <div className="py-4 border-b border-slate-200/80 space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    {t("checkout.voucher.title", "Kupon / Voucher Belanja")}
                </h3>

                {/* 1. Manual Voucher Slot */}
                {appliedManualVoucher ? (
                    <div className="p-3 bg-emerald-50/30 border-2 border-dashed border-emerald-250/80 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-800 animate-fade-in">
                        <div className="flex gap-2.5 items-start min-w-0">
                            <Ticket className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                                <span className="font-extrabold uppercase bg-emerald-100 px-2 py-0.5 rounded text-[10px] tracking-wide block w-fit mb-1 border border-emerald-250">
                                    {appliedManualVoucher.name}
                                </span>
                                <span className="font-bold block truncate text-[11.5px] text-slate-800">{appliedManualVoucher.name}</span>
                                <span className="text-[10px] text-emerald-650 font-bold block mt-0.5">
                                    Diskon {formatPrice(manualDiscount)}
                                </span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={removeManualVoucher}
                            className="text-xs font-bold text-rose-600 hover:text-rose-800 shrink-0 px-2 py-1 rounded-lg hover:bg-rose-50 transition"
                        >
                            Hapus
                        </button>
                    </div>
                ) : (
                    userVouchers.length > 0 && (
                        <div className="space-y-1 animate-fade-in">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                                {t("checkout.voucher.ready_to_use", "Gunakan Voucher Anda")}
                            </label>
                            <div className="relative">
                                <select
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            applyManualVoucher(e.target.value);
                                        }
                                    }}
                                    defaultValue=""
                                    className="w-full text-xs font-semibold text-slate-700 bg-white border border-slate-250 rounded-xl px-3 py-2.5 pr-8 focus:outline-none focus:border-blue-900 transition"
                                >
                                    <option value="">-- Pilih Voucher --</option>
                                    {userVouchers.map(v => (
                                        <option key={v.id} value={v.id}>
                                            {v.code} - {v.name} ({v.type === 'percentage' ? `${parseFloat(v.value)}%` : formatPrice(v.value)})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )
                )}

                {/* 2. Event Voucher / Referral Code Slot */}
                {appliedEventVoucher ? (
                    <div className="p-3 bg-emerald-50/30 border-2 border-dashed border-emerald-250/80 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-800 animate-fade-in">
                        <div className="flex gap-2.5 items-start min-w-0">
                            <Ticket className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                                <span className="font-extrabold uppercase bg-emerald-100 px-2 py-0.5 rounded text-[10px] tracking-wide block w-fit mb-1 border border-emerald-250">
                                    {appliedEventVoucher.code} (Event)
                                </span>
                                <span className="font-bold block truncate text-[11.5px] text-slate-800">{appliedEventVoucher.name}</span>
                                <span className="text-[10px] text-emerald-650 font-bold block mt-0.5">
                                    Diskon {formatPrice(eventDiscount)}
                                </span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={removeEventVoucher}
                            className="text-xs font-bold text-rose-600 hover:text-rose-800 shrink-0 px-2 py-1 rounded-lg hover:bg-rose-50 transition"
                        >
                            Hapus
                        </button>
                    </div>
                ) : appliedReferral ? (
                    <div className="p-3 bg-indigo-50/30 border-2 border-dashed border-indigo-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-indigo-850 animate-fade-in">
                        <div className="flex gap-2.5 items-start min-w-0">
                            <Ticket className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                                <span className="font-extrabold uppercase bg-indigo-100 px-2 py-0.5 rounded text-[10px] tracking-wide block w-fit mb-1 border border-indigo-200">
                                    {appliedReferral.code} (Referral)
                                </span>
                                <span className="font-bold block truncate text-[11.5px] text-slate-800">{appliedReferral.name}</span>
                                <span className="text-[10px] text-indigo-600 font-bold block mt-0.5">
                                    Diskon {formatPrice(referralDiscount)}
                                </span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={removeReferral}
                            className="text-xs font-bold text-rose-600 hover:text-rose-800 shrink-0 px-2 py-1 rounded-lg hover:bg-rose-50 transition"
                        >
                            Hapus
                        </button>
                    </div>
                ) : (
                    <div className="space-y-1 animate-fade-in">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                            {t("checkout.voucher.input_code", "Punya Kode Promo / Referral?")}
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Contoh: RAMADAN15 atau REFXXXX"
                                value={voucherCode}
                                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                                className="flex-1 text-xs font-semibold text-slate-755 bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-900 transition uppercase"
                            />
                            <button
                                type="button"
                                onClick={() => applyEventVoucher(voucherCode)}
                                disabled={isApplyingVoucher || !voucherCode.trim()}
                                className="px-4 py-2.5 bg-blue-950 text-white text-xs font-bold rounded-xl hover:bg-blue-900 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                            >
                                {isApplyingVoucher ? t("common.loading", "Loading...") : t("checkout.voucher.apply", "Terapkan")}
                            </button>
                        </div>
                    </div>
                )}

                {/* Feedback error messages */}
                {voucherError && (
                    <div className="p-2.5 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-100 rounded-xl flex gap-1.5 items-center">
                        <AlertCircle size={12} className="flex-shrink-0" />
                        <span>{voucherError}</span>
                    </div>
                )}
                {voucherSuccess && !voucherError && (
                    <div className="p-2.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl flex gap-1.5 items-center animate-pulse">
                        <Check size={12} className="flex-shrink-0 text-emerald-600" />
                        <span>{voucherSuccess}</span>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between py-4 mb-4">
                <span className="text-base font-extrabold text-slate-900">{t("cart.total", "Total")}</span>
                <span className="text-xl font-black text-blue-900">{formatPrice(grandTotal)}</span>
            </div>

            {errorMsg && (
                <div className="p-3 mb-4 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex gap-1.5 items-center">
                    <AlertCircle size={14} className="flex-shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}

            <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder || cartItems.length === 0}
                className="w-full py-4 bg-gradient-to-r from-blue-900 to-blue-800 text-white text-sm font-bold rounded-2xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed hover:from-blue-800 hover:to-blue-700 flex items-center justify-center gap-2"
            >
                {isPlacingOrder ? (
                    <>
                        <Activity size={16} className="animate-spin" />
                        <span>Memproses Pesanan...</span>
                    </>
                ) : (
                    <>
                        <Check size={16} />
                        <span>Buat Pesanan & Bayar</span>
                    </>
                )}
            </button>

            <p className="mt-3 text-[10px] text-center text-slate-400 leading-normal">
                Dengan menekan tombol di atas, Anda menyetujui transaksi pembelian & pengiriman barang sesuai ketentuan toko.
            </p>
        </aside>
    );
}
