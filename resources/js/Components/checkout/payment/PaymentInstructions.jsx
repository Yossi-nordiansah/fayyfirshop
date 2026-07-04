import React from "react";
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react";

export default function PaymentInstructions({ order, activeAccordion, setActiveAccordion, t }) {
    const vaGroups = [
        {
            title: t("instructions.va.mbanking_title", "Via Mobile Banking"),
            steps: [
                t("instructions.va.mbanking_step1", "Buka aplikasi mobile banking Anda."),
                t("instructions.va.mbanking_step2", "Pilih menu 'Transfer' lalu pilih 'Virtual Account' atau 'E-Billing'."),
                t("instructions.va.mbanking_step3", "Masukkan nomor Virtual Account atau Kode Bayar yang tertera di atas."),
                t("instructions.va.mbanking_step4", "Masukkan jumlah pembayaran sesuai dengan Grand Total."),
                t("instructions.va.mbanking_step5", "Masukkan PIN Anda dan selesaikan transaksi."),
            ],
        },
        {
            title: t("instructions.va.atm_title", "Via ATM"),
            steps: [
                t("instructions.va.atm_step1", "Masukkan kartu ATM dan PIN Anda."),
                t("instructions.va.atm_step2", "Pilih menu 'Transaksi Lainnya' > 'Transfer' > 'Virtual Account' atau 'Ke Rekening Bank'."),
                t("instructions.va.atm_step3", "Masukkan nomor Virtual Account."),
                t("instructions.va.atm_step4", "Pastikan jumlah bayar dan nama penerima sudah sesuai."),
                t("instructions.va.atm_step5", "Tekan Ya/Benar untuk membayar."),
            ],
        },
    ];

    const isVA = [
        "bca_va", "bri_va", "bni_va", "permata_va", "cimb_va",
        "seabank_va", "danamon_va", "bsi_va", "saqu_va", "mandiri_va",
    ].includes(order.payment_method);

    const isQris = order.payment_method === "qris";
    const isEWallet = ["gopay", "shopeepay", "ovo", "dana"].includes(order.payment_method);
    const isRetail = ["alfamart", "indomaret"].includes(order.payment_method);

    if (!isVA && !isQris && !isEWallet && !isRetail) return null;

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                <HelpCircle className="text-blue-900" size={18} />
                <span>{t("instructions.title", "Cara Pembayaran")}</span>
            </h3>

            {/* Virtual Account / Mandiri */}
            {isVA && (
                <div className="space-y-2">
                    {vaGroups.map((group, idx) => (
                        <div key={idx} className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
                            <button
                                type="button"
                                onClick={() => setActiveAccordion(activeAccordion === idx ? null : idx)}
                                className="w-full px-4 py-3 flex justify-between items-center text-xs font-bold text-slate-700 bg-white"
                            >
                                <span>{group.title}</span>
                                {activeAccordion === idx ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                            {activeAccordion === idx && (
                                <ol className="p-4 space-y-1.5 list-decimal list-inside text-[11px] text-slate-500 bg-slate-50/50">
                                    {group.steps.map((step, sidx) => (
                                        <li key={sidx} className="leading-relaxed">{step}</li>
                                    ))}
                                </ol>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* QRIS */}
            {isQris && (
                <ol className="list-decimal list-inside text-xs text-slate-500 space-y-2 leading-relaxed">
                    <li>{t("instructions.qris.step1", "Buka aplikasi e-wallet Anda (Gojek, Shopee, OVO, Dana, LinkAja) atau aplikasi M-Banking.")}</li>
                    <li>{t("instructions.qris.step2", "Pilih opsi 'Scan QR' atau 'Bayar'.")}</li>
                    <li>{t("instructions.qris.step3", "Arahkan kamera ke QR Code yang tertera di layar Anda.")}</li>
                    <li>{t("instructions.qris.step4", "Konfirmasikan detail pembayaran di aplikasi dan masukkan PIN Anda.")}</li>
                    <li>{t("instructions.qris.step5", "Tunggu hingga transaksi selesai dikonfirmasi otomatis.")}</li>
                </ol>
            )}

            {/* E-Wallet */}
            {isEWallet && (
                <ol className="list-decimal list-inside text-xs text-slate-500 space-y-2 leading-relaxed">
                    {order.payment_method === "ovo" ? (
                        <>
                            <li>{t("instructions.ovo.step1", "Buka aplikasi OVO di ponsel Anda.")}</li>
                            <li>{t("instructions.ovo.step2", "Cek halaman notifikasi atau notifikasi push yang muncul.")}</li>
                            <li>{t("instructions.ovo.step3", "Setujui transaksi dan masukkan PIN OVO Anda.")}</li>
                        </>
                    ) : (
                        <>
                            <li>{t("instructions.wallet.step1", "Buka link aplikasi di ponsel Anda atau pindai kode QR yang muncul.")}</li>
                            <li>{t("instructions.wallet.step2", "Aplikasi dompet digital Anda akan terbuka otomatis.")}</li>
                            <li>{t("instructions.wallet.step3", "Periksa jumlah tagihan dan pastikan saldo Anda mencukupi.")}</li>
                            <li>{t("instructions.wallet.step4", "Lakukan otentikasi pembayaran menggunakan PIN atau Dompet digital.")}</li>
                        </>
                    )}
                </ol>
            )}

            {/* Retail */}
            {isRetail && (
                <ol className="list-decimal list-inside text-xs text-slate-500 space-y-2 leading-relaxed">
                    <li>{t("instructions.retail.step1", "Kunjungi gerai retail terdekat.")}</li>
                    <li>{t("instructions.retail.step2", "Katakan pada kasir bahwa Anda ingin melakukan pembayaran merchant Midtrans/Online Shop.")}</li>
                    <li>{t("instructions.retail.step3", "Tunjukkan Kode Pembayaran yang tertera di atas kepada kasir.")}</li>
                    <li>{t("instructions.retail.step4", "Lakukan pembayaran tunai/debit sejumlah Grand Total transaksi.")}</li>
                    <li>{t("instructions.retail.step5", "Simpan struk pembayaran sebagai bukti transaksi.")}</li>
                </ol>
            )}
        </div>
    );
}