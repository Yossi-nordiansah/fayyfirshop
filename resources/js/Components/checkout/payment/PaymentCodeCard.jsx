import React from "react";
import {
    Copy, ExternalLink, RefreshCw, CheckCircle2, CreditCard, QrCode, AlertCircle
} from "lucide-react";

export default function PaymentCodeCard({
    order,
    details,
    qrCodeUrl,
    cardForm,
    setCardForm,
    isPayingCard,
    isPayingOvo,
    ovoPhone,
    setOvoPhone,
    handleCardPay,
    handleOvoPay,
    copyText,
    t,
}) {
    // Helper to dynamic translate raw payment method key
    const getPaymentMethodName = (method) => {
        if (!method) return "";
        const cleanKey = method.toLowerCase();
        return t(`payment.method.${cleanKey}`, method.replace("_", " "));
    };

    return (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl space-y-6">
            {/* Card Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div>
                    <h2 className="text-xs lg:text-sm font-extrabold text-slate-400 uppercase tracking-wider">
                        {t("payment.method_title", "Metode Pembayaran")}
                    </h2>
                    <p className="text-xs lg:text-sm font-black text-slate-900 mt-1 uppercase">
                        {getPaymentMethodName(order.payment_method)}
                    </p>
                </div>
                <div className="bg-blue-50 border border-blue-100 px-3.5 py-1.5 rounded-xl font-mono text-[10px] lg:text-xs font-extrabold text-blue-950">
                    {order.invoice_number}
                </div>
            </div>

            {/* 1. Virtual Account (non-mandiri) */}
            {["bca_va", "bri_va", "bni_va", "permata_va", "cimb_va", "seabank_va", "danamon_va", "bsi_va", "saqu_va"].includes(order.payment_method) && details.va_number && (
                <div className="space-y-4 text-center">
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl max-w-sm w-full mx-auto">
                        <span className="text-xs text-slate-400 font-bold tracking-wider block uppercase">
                            {t("payment.va.label", "NOMOR VIRTUAL ACCOUNT")}
                        </span>
                        <span className="lg:text-2xl font-black text-blue-950 font-mono tracking-wider block mt-2 select-all">
                            {details.va_number}
                        </span>
                    </div>
                    <button
                        onClick={() => copyText(details.va_number)}
                        className="inline-flex items-center gap-1.5 text-xs font-black text-blue-900 hover:text-blue-950 border border-blue-200 hover:border-blue-300 px-4 py-2 rounded-xl transition"
                    >
                        <Copy size={14} />
                        <span>{t("payment.va.copy", "Salin VA Number")}</span>
                    </button>
                </div>
            )}

            {/* 2. Mandiri Bill Payment */}
            {order.payment_method === "mandiri_va" && details.bill_key && details.biller_code && (
                <div className="space-y-4 text-center">
                    <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                            <span className="text-xs text-slate-400 font-bold block">
                                {t("payment.mandiri.biller", "BILLER CODE")}
                            </span>
                            <span className="text-xl font-black text-blue-950 font-mono tracking-wider block mt-1 select-all">
                                {details.biller_code}
                            </span>
                        </div>
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                            <span className="text-xs text-slate-400 font-bold block">
                                {t("payment.mandiri.bill_key", "BILL KEY")}
                            </span>
                            <span className="text-xl font-black text-blue-950 font-mono tracking-wider block mt-1 select-all">
                                {details.bill_key}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2 justify-center">
                        <button
                            onClick={() => copyText(details.biller_code)}
                            className="inline-flex items-center gap-1.5 text-xs font-black text-blue-900 border border-blue-200 px-3.5 py-2 rounded-xl hover:bg-slate-50"
                        >
                            <Copy size={12} />
                            <span>{t("payment.mandiri.copy_biller", "Salin Biller")}</span>
                        </button>
                        <button
                            onClick={() => copyText(details.bill_key)}
                            className="inline-flex items-center gap-1.5 text-xs font-black text-blue-900 border border-blue-200 px-3.5 py-2 rounded-xl hover:bg-slate-50"
                        >
                            <Copy size={12} />
                            <span>{t("payment.mandiri.copy_key", "Salin Bill Key")}</span>
                        </button>
                    </div>
                </div>
            )}

            {/* 3. QRIS */}
            {order.payment_method === "qris" && qrCodeUrl && (
                <div className="flex flex-col items-center space-y-4">
                    <span className="text-xs text-slate-400 font-extrabold tracking-wider block uppercase">
                        {t("payment.qris.scan_title", "SCAN QRIS UNTUK MEMBAYAR")}
                    </span>
                    <div className="p-4 border-2 border-slate-100 rounded-3xl shadow-sm bg-white shrink-0">
                        <img src={qrCodeUrl} alt="QRIS Code" className="w-56 h-56 object-contain" />
                    </div>
                    {details.deeplink && (
                        <a
                            href={details.deeplink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-black text-white bg-blue-950 px-6 py-3.5 rounded-2xl shadow-md hover:bg-blue-900 transition active:scale-[0.98]"
                        >
                            <span>{t("payment.qris.open_app", "Buka Aplikasi E-Wallet / QRIS")}</span>
                            <ExternalLink size={16} />
                        </a>
                    )}
                    <div className="flex items-center gap-2 text-[10px] font-extrabold bg-slate-50 border border-slate-100 px-3.5 py-1.5 rounded-full text-slate-500">
                        <QrCode size={12} />
                        <span>{t("payment.qris.support_desc", "Mendukung Gopay, ShopeePay, OVO, Dana, LinkAja, & Mobile Banking")}</span>
                    </div>
                </div>
            )}

            {/* 4. E-Wallet (GoPay, ShopeePay, OVO, DANA) */}
            {["gopay", "shopeepay", "ovo", "dana"].includes(order.payment_method) && (
                <div className="flex flex-col items-center space-y-5">
                    {qrCodeUrl && (
                        <div className="p-4 border-2 border-slate-100 rounded-3xl shadow-sm bg-white shrink-0 flex flex-col items-center space-y-2">
                            <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 object-contain" />
                            <span className="text-[10px] text-slate-400 font-bold">{t("payment.scan_to_pay", "Scan QR Code")}</span>
                        </div>
                    )}

                    {/* OVO Phone Form */}
                    {order.payment_method === "ovo" && (
                        <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                            {details.ovo_phone ? (
                                <div className="p-4 bg-purple-50 border border-purple-100 rounded-2xl text-center w-full">
                                    <span className="font-bold text-purple-950 text-xs block">
                                        {t("payment.ovo.notif_sent", "Push Notification OVO Terkirim ke")} {details.ovo_phone}
                                    </span>
                                    <p className="text-[11px] text-purple-800 mt-1 leading-normal font-medium">
                                        {t("payment.ovo.confirm_instruction", "Silakan buka aplikasi OVO di ponsel Anda dan konfirmasikan pembayaran dalam waktu 30 detik.")}
                                    </p>
                                </div>
                            ) : (
                                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-950 text-xs font-semibold rounded-2xl text-center w-full">
                                    {t("payment.ovo.not_sent", "Notifikasi belum dikirim. Silakan masukkan nomor OVO Anda di bawah ini.")}
                                </div>
                            )}
                            <form onSubmit={handleOvoPay} className="w-full bg-slate-50 p-4 border border-slate-100 rounded-2xl space-y-3">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                                        {t("payment.ovo.phone_label", "Nomor HP Akun OVO")}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder={t("payment.ovo.phone_placeholder", "Contoh: 08123456789")}
                                        value={ovoPhone}
                                        onChange={(e) => setOvoPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
                                        className="w-full text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-900"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isPayingOvo}
                                    className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2"
                                >
                                    {isPayingOvo ? (
                                        <>
                                            <RefreshCw size={13} className="animate-spin" />
                                            <span>{t("payment.ovo.sending", "Mengirim Notifikasi...")}</span>
                                        </>
                                    ) : (
                                        <span>
                                            {details.ovo_phone
                                                ? t("payment.ovo.btn_resend", "Kirim Ulang Notifikasi")
                                                : t("payment.ovo.btn_send", "Kirim Notifikasi OVO")}
                                        </span>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}

                    {details.deeplink && (
                        <a
                            href={details.deeplink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-black text-white bg-blue-950 px-6 py-3.5 rounded-2xl shadow-md hover:bg-blue-900 transition active:scale-[0.98]"
                        >
                            <span>
                                {order.payment_method === "dana"
                                    ? t("payment.wallet.open_dana", "Buka Aplikasi DANA")
                                    : order.payment_method === "gopay"
                                        ? t("payment.wallet.open_gopay", "Buka Aplikasi GoPay / Gojek")
                                        : order.payment_method === "shopeepay"
                                            ? t("payment.wallet.open_shopeepay", "Buka Aplikasi Shopee")
                                            : t("payment.wallet.open_generic", "Buka Aplikasi E-Wallet")}
                            </span>
                            <ExternalLink size={16} />
                        </a>
                    )}
                </div>
            )}

            {/* 5. Retail Outlets (Alfamart / Indomaret) */}
            {["alfamart", "indomaret"].includes(order.payment_method) && details.payment_code && (
                <div className="space-y-4 flex flex-col text-center">
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl inline-block max-w-sm w-full mx-auto">
                        <span className="text-xs text-slate-400 font-bold tracking-wider block uppercase">
                            {t("payment.retail.code_label", "KODE PEMBAYARAN KASIR")}
                        </span>
                        <span className="text-2xl font-black text-blue-950 font-mono tracking-wider block mt-2 select-all">
                            {details.payment_code}
                        </span>
                    </div>

                    <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl max-w-xl w-full mx-auto text-left flex items-start gap-2.5">
                        <AlertCircle className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                        <div>
                            <span className="text-xs font-black text-blue-950 block">
                                {t("payment.retail.midtrans_notice_title", "Pemberitahuan Kasir")}
                            </span>
                            <span className="text-[11px] text-blue-800 font-medium leading-normal block mt-1">
                                {t("payment.retail.midtrans_notice_desc", "Harap beri tahu kasir bahwa Anda ingin melakukan pembayaran merchant Midtrans / Online Shop.")}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() => copyText(details.payment_code)}
                        className="w-fit mx-auto inline-flex items-center gap-1.5 text-xs font-black text-blue-900 border border-blue-200 px-4 py-2 rounded-xl hover:bg-slate-50"
                    >
                        <Copy size={14} />
                        <span>{t("payment.retail.copy", "Salin Kode Pembayaran")}</span>
                    </button>
                </div>
            )}

            {/* 6. Credit Card Form (unpaid) */}
            {order.payment_method === "credit_card" && order.payment_status === "unpaid" && (
                <form onSubmit={handleCardPay} className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <CreditCard size={14} className="text-blue-900" />
                        <span>{t("payment.cc.form_title", "Detail Pembayaran Kartu Kredit / Debit")}</span>
                    </h3>
                    <div className="flex gap-2 items-center bg-white px-3 py-1.5 border border-slate-200/60 rounded-xl w-fit">
                        <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mr-1 select-none">
                            {t("payment.cc.accept", "Menerima:")}
                        </span>
                        <div className="flex gap-2 items-center">
                            <img src="/images/payment/visa.svg" alt="Visa" className="h-4 object-contain" />
                            <img src="/images/payment/mastercard.svg" alt="Mastercard" className="h-4 object-contain" />
                            <img src="/images/payment/jcb.svg" alt="JCB" className="h-4 object-contain" />
                            <img src="/images/payment/amex.svg" alt="Amex" className="h-4 object-contain" />
                            <img src="/images/payment/unionpay.svg" alt="UnionPay" className="h-4 object-contain" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                                {t("payment.cc.card_number", "Nomor Kartu")}
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="XXXX XXXX XXXX XXXX"
                                value={cardForm.cardNumber}
                                onChange={(e) => setCardForm({ ...cardForm, cardNumber: e.target.value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19) })}
                                className="w-full text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-900"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                                {t("payment.cc.cardholder_name", "Nama Pemegang Kartu")}
                            </label>
                            <input
                                type="text"
                                required
                                placeholder={t("payment.cc.name_placeholder", "Contoh: YOSSI NORDIANSAH")}
                                value={cardForm.cardholderName}
                                onChange={(e) => setCardForm({ ...cardForm, cardholderName: e.target.value.toUpperCase() })}
                                className="w-full text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-900"
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                                    {t("payment.cc.exp_month", "Bulan Exp")}
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="MM"
                                    maxLength="2"
                                    value={cardForm.expiryMonth}
                                    onChange={(e) => setCardForm({ ...cardForm, expiryMonth: e.target.value.replace(/\D/g, "").slice(0, 2) })}
                                    className="w-full text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-center focus:outline-none focus:border-blue-900"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                                    {t("payment.cc.exp_year", "Tahun Exp")}
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="YY"
                                    maxLength="2"
                                    value={cardForm.expiryYear}
                                    onChange={(e) => setCardForm({ ...cardForm, expiryYear: e.target.value.replace(/\D/g, "").slice(0, 2) })}
                                    className="w-full text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-center focus:outline-none focus:border-blue-900"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">CVV</label>
                                <input
                                    type="password"
                                    required
                                    placeholder="123"
                                    maxLength="4"
                                    value={cardForm.cvv}
                                    onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                                    className="w-full text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-center focus:outline-none focus:border-blue-900"
                                />
                            </div>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isPayingCard}
                        className="w-full py-3 bg-blue-950 text-white font-bold text-xs rounded-xl shadow hover:bg-blue-900 transition flex items-center justify-center gap-2"
                    >
                        {isPayingCard ? (
                            <>
                                <RefreshCw size={14} className="animate-spin" />
                                <span>{t("payment.cc.processing", "Memproses Pembayaran...")}</span>
                            </>
                        ) : (
                            <span>{t("payment.cc.btn_pay", "Proses Bayar Sekarang")}</span>
                        )}
                    </button>
                </form>
            )}

            {/* CC Status if paid */}
            {order.payment_method === "credit_card" && order.payment_status === "paid" && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>{t("payment.cc.success_status", "Status Transaksi Kartu Kredit / Debit: SUKSES & SELESAI")}</span>
                </div>
            )}
        </div>
    );
}