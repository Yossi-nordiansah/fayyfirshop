import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Wallet, QrCode, Store, Landmark, Info, ChevronDown, ChevronUp } from "lucide-react";

// Robust Logo Component with elegant fallback
const PaymentLogo = ({ logo, name, altText }) => {
    const [hasError, setHasError] = useState(!logo);

    if (hasError) {
        const isOvo = name.toLowerCase() === "ovo";
        const badgeBg = isOvo
            ? "bg-purple-700 text-white border-purple-800"
            : "bg-slate-100 text-slate-700 border-slate-200";
        return (
            <span className={`font-black text-[9px] px-2 py-0.5 rounded-md tracking-wider border select-none ${badgeBg}`}>
                {name}
            </span>
        );
    }

    return (
        <img
            src={logo}
            alt={altText || name}
            onError={() => setHasError(true)}
            className="h-5 sm:h-5.5 max-w-[48px] object-contain shrink-0"
        />
    );
};

export default function PaymentMethodSelection({
    t,
    paymentMethod,
    setPaymentMethod
}) {
    const categories = [
        {
            id: "e_wallet",
            title: t("checkout.payment.e_wallet", "E-Wallet"),
            icon: <Wallet className="text-indigo-500" size={15} />,
            methods: [
                // { id: "gopay", name: "GoPay", desc: t("checkout.payment.desc.gopay", "Bayar menggunakan aplikasi Gojek"), logo: "/images/payment/gopay.svg" },
                { id: "shopeepay", name: "ShopeePay", desc: t("checkout.payment.desc.shopeepay", "Bayar menggunakan aplikasi Shopee"), logo: "/images/payment/shopeepay.svg" },
                // { id: "dana", name: "DANA", desc: t("checkout.payment.desc.dana", "Bayar menggunakan aplikasi DANA"), logo: "/images/payment/dana.svg" },
                { id: "linkaja", name: "LinkAja", desc: t("checkout.payment.desc.linkaja", "Bayar menggunakan aplikasi LinkAja"), logo: "/images/payment/link-aja.svg" }
            ]
        },
        {
            id: "qris",
            title: t("checkout.payment.qris", "QRIS"),
            icon: <QrCode className="text-teal-500" size={15} />,
            methods: [
                { id: "qris", name: "QRIS", desc: t("checkout.payment.desc.qris", "Scan QR menggunakan aplikasi e-wallet"), logo: "/images/payment/qris.svg" }
            ]
        },
        {
            id: "virtual_account",
            title: t("checkout.payment.virtual_account", "Virtual Account (Verifikasi Otomatis)"),
            icon: <Landmark className="text-blue-500" size={15} />,
            methods: [
                { id: "bca_va", name: "BCA Virtual Account", desc: t("checkout.payment.desc.bca", "Transfer Virtual Account BCA"), logo: "/images/payment/bca.svg" },
                { id: "bri_va", name: "BRI Virtual Account", desc: t("checkout.payment.desc.bri", "Transfer Virtual Account BRI"), logo: "/images/payment/bri.svg" },
                { id: "bni_va", name: "BNI Virtual Account", desc: t("checkout.payment.desc.bni", "Transfer Virtual Account BNI"), logo: "/images/payment/bni.svg" },
                { id: "mandiri_va", name: "Mandiri Bill Payment", desc: t("checkout.payment.desc.mandiri", "Transfer Mandiri Bill Payment"), logo: "/images/payment/mandiri.svg" },
                { id: "permata_va", name: "Permata Virtual Account", desc: t("checkout.payment.desc.permata", "Transfer Virtual Account Permata"), logo: "/images/payment/permata.svg" },
                { id: "cimb_va", name: "CIMB Niaga Virtual Account", desc: t("checkout.payment.desc.cimb", "Transfer Virtual Account CIMB Niaga"), logo: "/images/payment/cimb.svg" },
                // { id: "seabank_va", name: "SeaBank Virtual Account", desc: t("checkout.payment.desc.seabank", "Transfer Virtual Account SeaBank"), logo: "/images/payment/seabank.svg" },  // SEMENTARA DINONAKTIFKAN
                // { id: "danamon_va", name: "Danamon Virtual Account", desc: t("checkout.payment.desc.danamon", "Transfer Virtual Account Danamon"), logo: "/images/payment/danamon.svg" },  // SEMENTARA DINONAKTIFKAN
                { id: "bsi_va", name: "BSI Virtual Account", desc: t("checkout.payment.desc.bsi", "Transfer Virtual Account BSI"), logo: "/images/payment/bsi.svg" },
                // { id: "saqu_va", name: "Bank Saqu Virtual Account", desc: t("checkout.payment.desc.saqu", "Transfer Virtual Account Bank Saqu"), logo: "/images/payment/saqu.svg" }  // SEMENTARA DINONAKTIFKAN
            ]
        },
        {
            id: "card",
            title: t("checkout.payment.credit_card", "Credit / Debit Card"),
            icon: <CreditCard className="text-amber-500" size={15} />,
            methods: [
                {
                    id: "credit_card",
                    name: t("checkout.payment.credit_card", "Credit / Debit Card"),
                    desc: t("checkout.payment.desc.card", "Visa • Mastercard • JCB • Amex • UnionPay"),
                    isCard: true
                }
            ]
        },
        {
            id: "retail",
            title: t("checkout.payment.retail", "Retail Outlet / Gerai Retail"),
            icon: <Store className="text-rose-500" size={15} />,
            methods: [
                { id: "alfamart", name: "Alfamart", desc: t("checkout.payment.desc.alfamart", "Bayar di gerai Alfamart terdekat"), logo: "/images/payment/alfamart.svg" },
                { id: "indomaret", name: "Indomaret", desc: t("checkout.payment.desc.indomaret", "Bayar di gerai Indomaret terdekat"), logo: "/images/payment/indomaret.svg" }
            ]
        }
    ];

    const [expandedCategory, setExpandedCategory] = useState(() => {
        for (const cat of categories) {
            if (cat.methods.some(m => m.id === paymentMethod)) {
                return cat.id;
            }
        }
        return "virtual_account";
    });

    const toggleCategory = (catId) => {
        setExpandedCategory(prev => prev === catId ? null : catId);
    };

    useEffect(() => {
        for (const cat of categories) {
            if (cat.methods.some(m => m.id === paymentMethod)) {
                if (expandedCategory !== cat.id) {
                    setExpandedCategory(cat.id);
                }
                break;
            }
        }
    }, [paymentMethod]);

    return (
        <section className="p-4 bg-white border border-slate-100 shadow-sm rounded-3xl space-y-3">
            <h2 className="text-xs font-extrabold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
                <CreditCard className="text-blue-900" size={16} />
                {t("checkout.payment_section", "Pilih Metode Pembayaran")}
            </h2>

            <div className="space-y-2.5">
                {categories.map((category) => {
                    const isExpanded = expandedCategory === category.id;
                    return (
                        <div key={category.id} className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/10">
                            {/* Accordion Trigger Header */}
                            <button
                                type="button"
                                onClick={() => toggleCategory(category.id)}
                                className="w-full px-3.5 py-2.5 flex justify-between items-center bg-white hover:bg-slate-50/30 border-b border-slate-100 transition-colors"
                            >
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    {category.icon}
                                    <span>{category.title}</span>
                                </span>
                                {isExpanded ? (
                                    <ChevronUp size={13} className="text-slate-400" />
                                ) : (
                                    <ChevronDown size={13} className="text-slate-400" />
                                )}
                            </button>

                            {/* Dropdown Content with Smooth Framer Motion Accordion */}
                            <AnimatePresence initial={false}>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.25, ease: "easeInOut" }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-2.5 bg-white grid gap-2 sm:grid-cols-2">
                                            {category.methods.map((method) => {
                                                const isSelected = paymentMethod === method.id;
                                                return (
                                                    <button
                                                        key={method.id}
                                                        type="button"
                                                        onClick={() => setPaymentMethod(method.id)}
                                                        className={`flex items-center gap-2.5 p-2 border rounded-xl text-left transition-all ${isSelected
                                                                ? "border-blue-900 bg-blue-50/20 text-blue-950 shadow-xs ring-1 ring-blue-900"
                                                                : "border-slate-150 bg-white text-slate-700 hover:border-slate-350 hover:bg-slate-50/30"
                                                            }`}
                                                    >
                                                        {/* Smaller Radio Checklist */}
                                                        <div
                                                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${isSelected
                                                                    ? "border-blue-900 bg-blue-900"
                                                                    : "border-slate-300 bg-white"
                                                                }`}
                                                        >
                                                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                        </div>

                                                        <div className="flex-1 min-w-0 flex justify-between items-center gap-2">
                                                            <div className="min-w-0">
                                                                <h4 className="text-[11.5px] font-bold text-slate-800 truncate leading-snug">
                                                                    {method.name}
                                                                </h4>
                                                                <p className="text-[9.5px] text-slate-400 mt-0.5 leading-tight truncate">
                                                                    {method.desc}
                                                                </p>
                                                            </div>

                                                            {/* Method Logo with Fallback */}
                                                            <div className="shrink-0">
                                                                {method.isCard ? (
                                                                    <div className="flex gap-0.5 items-center bg-slate-50 p-0.5 border border-slate-100 rounded-lg shrink-0 scale-90 origin-right">
                                                                        <img src="/images/payment/visa.svg" alt="Visa" className="h-3 object-contain" />
                                                                        <img src="/images/payment/mastercard.svg" alt="MC" className="h-3 object-contain" />
                                                                        <img src="/images/payment/jcb.svg" alt="JCB" className="h-3 object-contain" />
                                                                        <img src="/images/payment/amex.svg" alt="Amex" className="h-3 object-contain" />
                                                                        <img src="/images/payment/unionpay.svg" alt="UP" className="h-3 object-contain" />
                                                                    </div>
                                                                ) : (
                                                                    <PaymentLogo logo={method.logo} name={method.name} />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-2xl flex gap-2 text-[9.5px] text-slate-500 leading-normal font-medium">
                <Info size={13} className="text-blue-900 shrink-0 mt-0.5" />
                <p>
                    {t(
                        "checkout.payment.info",
                        "Untuk kartu kredit/debit, detail kartu dimasukkan dengan aman di halaman pembayaran setelah Anda menekan tombol 'Buat Pesanan'."
                    )}
                </p>
            </div>
        </section>
    );
}