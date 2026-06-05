import React from "react";
import { AlertCircle, Activity, Check } from "lucide-react";

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
    handlePlaceOrder
}) {
    return (
        <aside className="p-5 border shadow-sm h-fit rounded-3xl border-slate-100 bg-slate-50 lg:sticky lg:top-28">
            <h2 className="font-['Cinzel'] text-lg font-bold text-slate-950 pb-3 border-b border-slate-200/80">
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
            {selectedBranch && (
                <div className="py-3 border-b border-slate-200/80 text-[11px] text-slate-500 space-y-1">
                    <div className="flex justify-between">
                        <span>Gudang Pengirim:</span>
                        <strong className="text-slate-800">{selectedBranch.name}</strong>
                    </div>
                    <div className="flex justify-between">
                        <span>Metode Kirim:</span>
                        <strong className="text-slate-800">{selectedRate ? `${selectedRate.courier_name} (${selectedRate.courier_service_name})` : '-'}</strong>
                    </div>
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
