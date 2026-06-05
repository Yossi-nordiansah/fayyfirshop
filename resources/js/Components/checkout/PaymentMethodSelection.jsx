import React from "react";
import { CreditCard } from "lucide-react";

export default function PaymentMethodSelection({
    t,
    paymentMethod,
    setPaymentMethod
}) {
    return (
        <section className="p-6 bg-white border border-slate-100 shadow-sm rounded-3xl">
            <h2 className="text-base font-extrabold text-slate-900 pb-4 mb-4 border-b border-slate-100 flex items-center gap-2">
                <CreditCard className="text-amber-500" size={18} />
                {t("checkout.payment_section", "Metode Pembayaran")}
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
                <button
                    type="button"
                    onClick={() => setPaymentMethod("bank_transfer")}
                    className={`flex items-center gap-3 p-4 border rounded-2xl text-left transition-all ${paymentMethod === 'bank_transfer'
                        ? 'border-blue-600 bg-blue-50/40 text-blue-900 shadow-sm ring-1 ring-blue-600'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${paymentMethod === 'bank_transfer' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                        {paymentMethod === 'bank_transfer' && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div>
                        <h3 className="text-sm font-bold">Transfer Bank Manual</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Konfirmasi manual lewat WhatsApp</p>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => setPaymentMethod("cod")}
                    className={`flex items-center gap-3 p-4 border rounded-2xl text-left transition-all ${paymentMethod === 'cod'
                        ? 'border-blue-600 bg-blue-50/40 text-blue-900 shadow-sm ring-1 ring-blue-600'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${paymentMethod === 'cod' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                        {paymentMethod === 'cod' && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div>
                        <h3 className="text-sm font-bold">Cash on Delivery (COD)</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Bayar tunai di tempat saat barang sampai</p>
                    </div>
                </button>
            </div>
        </section>
    );
}
