import React, { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import axios from "axios";
import {
    Clock, Copy, ExternalLink, RefreshCw, AlertTriangle,
    CheckCircle2, CreditCard, Landmark, QrCode, Store, ShieldAlert,
    HelpCircle, ChevronDown, ChevronUp, Check, X, Wallet, MessageCircle, ArrowLeft
} from "lucide-react";

// Local helper component for showing payment logo in payment method changer popup
const ModalPaymentLogo = ({ logo, name }) => {
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
            alt={name}
            onError={() => setHasError(true)}
            className="h-5 sm:h-5.5 max-w-[48px] object-contain shrink-0"
        />
    );
};

export default function Payment({ order, midtransClientKey, isProduction, t, locale }) {
    const isRtl = locale === 'arabic';
    const [timeLeft, setTimeLeft] = useState(null);
    const [isChangingMethod, setIsChangingMethod] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isPayingCard, setIsPayingCard] = useState(false);
    const [loadingChange, setLoadingChange] = useState(false);

    // Credit card form state
    const [cardForm, setCardForm] = useState({
        cardNumber: "",
        cardholderName: "",
        expiryMonth: "",
        expiryYear: "",
        cvv: ""
    });

    // Instruction accordion state
    const [activeAccordion, setActiveAccordion] = useState(null);

    // OVO phone number state
    const [ovoPhone, setOvoPhone] = useState(() => {
        return order.payment_details?.ovo_phone || "";
    });
    const [isPayingOvo, setIsPayingOvo] = useState(false);

    // Format Financials
    const formatPrice = (value) => {
        const currencyCode = locale === "indonesia" ? "IDR" : "SAR";
        const formatterLocale = locale === "indonesia" ? "id-ID-u-nu-latn" : locale === "arabic" ? "ar-SA-u-nu-latn" : "en-US-u-nu-latn";
        return new Intl.NumberFormat(formatterLocale, {
            style: "currency",
            currency: currencyCode,
            minimumFractionDigits: 0,
        }).format(value || 0);
    };

    // Copy Helper
    const copyText = (text) => {
        navigator.clipboard.writeText(text);
        alert(t("payment.copied", "Berhasil disalin ke clipboard!"));
    };

    // Countdown Timer Effect
    useEffect(() => {
        const calculateTimeLeft = () => {
            const expiry = order.payment_details?.expiry_time;
            const target = expiry
                ? new Date(expiry)
                : new Date(new Date(order.created_at).getTime() + 24 * 60 * 60 * 1000);

            const difference = target.getTime() - new Date().getTime();
            if (difference <= 0) return null;

            const hours = Math.floor(difference / (1000 * 60 * 60));
            const minutes = Math.floor((difference / 1000 / 60) % 60);
            const seconds = Math.floor((difference / 1000) % 60);

            return { hours, minutes, seconds };
        };

        setTimeLeft(calculateTimeLeft());
        const timer = setInterval(() => {
            const left = calculateTimeLeft();
            setTimeLeft(left);
            if (!left) {
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [order]);

    // Polling status pembayaran dari server setiap 5 detik jika statusnya belum dibayar
    useEffect(() => {
        if (order.payment_status !== "unpaid" || order.status !== "pending") {
            return;
        }

        const interval = setInterval(() => {
            router.reload({ only: ["order"] });
        }, 5000);

        return () => clearInterval(interval);
    }, [order.payment_status, order.status]);

    // Redirect otomatis ke halaman sukses jika status berubah menjadi paid
    useEffect(() => {
        if (order.payment_status === "paid") {
            router.visit(route("checkout.success", order.id));
        }
    }, [order.payment_status, order.id]);

    // Load Midtrans JS SDK for Credit Card tokenization
    useEffect(() => {
        if (order.payment_method !== "credit_card") return;
        if (document.getElementById("midtrans-cc-script")) return;

        const script = document.createElement("script");
        script.src = isProduction
            ? "https://api.midtrans.com/v2/assets/js/midtrans-new-3ds.min.js"
            : "https://api.sandbox.midtrans.com/v2/assets/js/midtrans-new-3ds.min.js";
        script.id = "midtrans-cc-script";
        script.setAttribute("data-client-key", midtransClientKey);
        script.async = true;
        document.body.appendChild(script);
    }, [order.payment_method, isProduction, midtransClientKey]);

    // Submit CC Tokenization & Charge
    const handleCardPay = (e) => {
        e.preventDefault();
        if (!window.Midtrans) {
            alert(t("payment.sdk_error", "Midtrans SDK gagal dimuat. Harap periksa koneksi internet Anda."));
            return;
        }

        setIsPayingCard(true);

        window.Midtrans.card.token({
            card_number: cardForm.cardNumber.replace(/\s+/g, ""),
            card_exp_month: cardForm.expiryMonth,
            card_exp_year: "20" + cardForm.expiryYear.slice(-2),
            card_cvv: cardForm.cvv,
            client_key: midtransClientKey
        }, {
            onSuccess: function (response) {
                axios.post(route("checkout.payment.pay-card", order.id), {
                    token_id: response.token_id
                })
                    .then(res => {
                        if (res.data.success) {
                            if (res.data.redirect_url) {
                                // Go to 3D Secure Verification
                                window.location.href = res.data.redirect_url;
                            } else {
                                router.reload();
                            }
                        } else {
                            alert(res.data.message || "Pembayaran gagal.");
                        }
                    })
                    .catch(err => {
                        console.error(err);
                        alert(err.response?.data?.message || "Terjadi kesalahan saat memproses kartu Anda.");
                    })
                    .finally(() => {
                        setIsPayingCard(false);
                    });
            },
            onFailure: function (response) {
                alert(t("payment.card_validation_failed", "Validasi kartu gagal: ") + response.validation_messages.join(", "));
                setIsPayingCard(false);
            }
        });
    };

    // OVO payment request trigger
    const handleOvoPay = (e) => {
        e.preventDefault();
        if (!ovoPhone.trim()) {
            alert("Nomor HP OVO wajib diisi.");
            return;
        }

        setIsPayingOvo(true);
        axios.post(route("checkout.payment.change", order.id), {
            payment_method: "ovo",
            phone_number: ovoPhone
        })
            .then(res => {
                if (res.data.success) {
                    router.reload();
                } else {
                    alert(res.data.message || "Gagal memproses pembayaran OVO.");
                }
            })
            .catch(err => {
                console.error(err);
                alert(err.response?.data?.message || "Terjadi kesalahan saat menghubungi OVO.");
            })
            .finally(() => {
                setIsPayingOvo(false);
            });
    };

    // Change Method Handler
    const handleMethodChange = (newMethod) => {
        setLoadingChange(true);
        axios.post(route("checkout.payment.change", order.id), {
            payment_method: newMethod
        })
            .then(res => {
                if (res.data.success) {
                    setIsChangingMethod(false);
                    router.reload();
                } else {
                    alert(res.data.message || "Gagal mengubah metode pembayaran.");
                }
            })
            .catch(err => {
                console.error(err);
                alert(err.response?.data?.message || "Terjadi kesalahan.");
            })
            .finally(() => {
                setLoadingChange(false);
            });
    };

    // Cancel Order Handler
    const handleCancelOrder = () => {
        if (!confirm(t("payment.cancel_confirm", "Apakah Anda yakin ingin membatalkan pesanan ini? Stok produk akan dikembalikan."))) {
            return;
        }

        setIsCancelling(true);
        axios.post(route("checkout.payment.cancel", order.id))
            .then(res => {
                if (res.data.success) {
                    router.visit(route("orders.index"));
                } else {
                    alert(res.data.message || "Gagal membatalkan pesanan.");
                }
            })
            .catch(err => {
                console.error(err);
                alert(err.response?.data?.message || "Terjadi kesalahan.");
            })
            .finally(() => {
                setIsCancelling(false);
            });
    };

    const details = order.payment_details || {};
    const qrCodeUrl = details.qr_string
        ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(details.qr_string)}`
        : details.qr_url;

    // Available change categories matching selection structure
    const getCategoryIcon = (categoryId) => {
        switch (categoryId) {
            case "e_wallet":
                return <Wallet className="text-indigo-500" size={14} />;
            case "qris":
                return <QrCode className="text-teal-500" size={14} />;
            case "virtual_account":
                return <Landmark className="text-blue-500" size={14} />;
            case "card":
                return <CreditCard className="text-amber-500" size={14} />;
            case "retail":
                return <Store className="text-rose-500" size={14} />;
            default:
                return null;
        }
    };

    // Available change categories matching selection structure
    const changeCategories = [
        {
            id: "e_wallet",
            title: t("checkout.payment.e_wallet", "E-Wallet"),
            methods: [
                { id: "gopay", name: "GoPay", desc: "Bayar menggunakan aplikasi Gojek", logo: "/images/payment/gopay.svg" },
                { id: "shopeepay", name: "ShopeePay", desc: "Bayar menggunakan aplikasi Shopee", logo: "/images/payment/shopeepay.svg" },
                { id: "ovo", name: "OVO", desc: "Bayar menggunakan aplikasi OVO", logo: "/images/payment/ovo.svg" },
                { id: "dana", name: "DANA", desc: "Bayar menggunakan aplikasi DANA", logo: "/images/payment/dana.svg" }
            ]
        },
        {
            id: "qris",
            title: t("checkout.payment.qris", "QRIS"),
            methods: [
                { id: "qris", name: "QRIS", desc: "Scan QR menggunakan aplikasi e-wallet", logo: "/images/payment/qris.svg" }
            ]
        },
        {
            id: "virtual_account",
            title: t("checkout.payment.virtual_account", "Virtual Account (Verifikasi Otomatis)"),
            methods: [
                { id: "bca_va", name: "BCA Virtual Account", desc: "Transfer Virtual Account BCA", logo: "/images/payment/bca.svg" },
                { id: "bri_va", name: "BRI Virtual Account", desc: "Transfer Virtual Account BRI", logo: "/images/payment/bri.svg" },
                { id: "bni_va", name: "BNI Virtual Account", desc: "Transfer Virtual Account BNI", logo: "/images/payment/bni.svg" },
                { id: "mandiri_va", name: "Mandiri Bill Payment", desc: "Transfer Mandiri Bill Payment", logo: "/images/payment/mandiri.svg" },
                { id: "permata_va", name: "Permata Virtual Account", desc: "Transfer Virtual Account Permata", logo: "/images/payment/permata.svg" },
                { id: "cimb_va", name: "CIMB Niaga Virtual Account", desc: "Transfer Virtual Account CIMB Niaga", logo: "/images/payment/cimb.svg" },
                { id: "seabank_va", name: "SeaBank Virtual Account", desc: "Transfer Virtual Account SeaBank", logo: "/images/payment/seabank.svg" },
                { id: "danamon_va", name: "Danamon Virtual Account", desc: "Transfer Virtual Account Danamon", logo: "/images/payment/danamon.svg" },
                { id: "bsi_va", name: "BSI Virtual Account", desc: "Transfer Virtual Account BSI", logo: "/images/payment/bsi.svg" },
                { id: "saqu_va", name: "Bank Saqu Virtual Account", desc: "Transfer Virtual Account Bank Saqu", logo: "/images/payment/saqu.svg" }
            ]
        },
        {
            id: "card",
            title: t("checkout.payment.credit_card", "Credit / Debit Card"),
            methods: [
                {
                    id: "credit_card",
                    name: "Credit / Debit Card",
                    desc: "Visa • Mastercard • JCB • Amex • UnionPay",
                    isCard: true
                }
            ]
        },
        {
            id: "retail",
            title: t("checkout.payment.retail", "Retail Outlet / Gerai Retail"),
            methods: [
                { id: "alfamart", name: "Alfamart", desc: "Bayar di gerai Alfamart terdekat", logo: "/images/payment/alfamart.svg" },
                { id: "indomaret", name: "Indomaret", desc: "Bayar di gerai Indomaret terdekat", logo: "/images/payment/indomaret.svg" }
            ]
        }
    ];

    return (
        <div className="max-w-4xl mx-auto px-4 py-8" dir={isRtl ? "rtl" : "ltr"}>
            {/* Header with Back Button */}
            <div className="flex items-center gap-3 pb-6 mb-8 border-b border-slate-200/60">
                <button
                    onClick={() => router.visit(route('orders.index'))}
                    className="flex items-center justify-center w-10 h-10 transition-colors bg-white border rounded-full text-slate-500 hover:text-blue-700 border-slate-200 shadow-xs shrink-0"
                >
                    <ArrowLeft size={18} className={isRtl ? "rotate-180" : ""} />
                </button>
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-wide text-slate-900 md:text-3xl">
                        {t("payment.title", "Detail Pembayaran")}
                    </h1>
                    <p className="mt-1 text-[10px] sm:text-xs text-slate-500">
                        {t("payment.subtitle", "Selesaikan transaksi Anda menggunakan metode pembayaran yang dipilih.")}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Payment Summary Cards */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Expiry Banner */}
                    {order.payment_status === "unpaid" && order.status === "pending" && (
                        <div className="p-4 sm:p-5 md:p-6 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50 rounded-2xl sm:rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                            <div className="flex items-center gap-2.5 sm:gap-3">
                                <Clock className="text-amber-600 animate-pulse shrink-0 w-5 h-5 sm:w-6 sm:h-6" />
                                <div>
                                    <h3 className="font-extrabold text-amber-950 text-xs sm:text-sm">
                                        {t("payment.expiry_title", "Batas Waktu Pembayaran")}
                                    </h3>
                                    <p className="text-[10px] sm:text-xs text-amber-800/80 mt-0.5">
                                        {t("payment.expiry_desc", "Selesaikan pembayaran Anda sebelum waktu habis.")}
                                    </p>
                                </div>
                            </div>

                            <div className="text-right self-end sm:self-auto">
                                {timeLeft ? (
                                    <div className="flex gap-0.5 sm:gap-1 text-xs sm:text-sm font-black text-amber-950">
                                        <span className="bg-amber-950 text-amber-100 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg">
                                            {String(timeLeft.hours).padStart(2, "0")}
                                        </span>
                                        <span>:</span>
                                        <span className="bg-amber-950 text-amber-100 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg">
                                            {String(timeLeft.minutes).padStart(2, "0")}
                                        </span>
                                        <span>:</span>
                                        <span className="bg-amber-950 text-amber-100 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg">
                                            {String(timeLeft.seconds).padStart(2, "0")}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-xs font-bold text-rose-600">{t("payment.expired", "Kedaluwarsa")}</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Main Code Card */}
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl space-y-6">
                        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                            <div>
                                <h2 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider">
                                    {t("payment.method", "Metode Pembayaran")}
                                </h2>
                                <p className="text-base font-black text-slate-900 mt-1 uppercase">
                                    {order.payment_method.replace("_", " ")}
                                </p>
                            </div>

                            <div className="bg-blue-50 border border-blue-100 px-3.5 py-1.5 rounded-xl font-mono text-xs font-extrabold text-blue-950">
                                {order.invoice_number}
                            </div>
                        </div>

                        {/* RENDERERS DYNAMICALLY BASED ON METHOD */}

                        {/* 1. Virtual Account */}
                        {["bca_va", "bri_va", "bni_va", "permata_va", "cimb_va", "seabank_va", "danamon_va", "bsi_va", "saqu_va"].includes(order.payment_method) && details.va_number && (
                            <div className="space-y-4 text-center">
                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl inline-block max-w-sm w-full mx-auto">
                                    <span className="text-xs text-slate-400 font-bold tracking-wider block uppercase">NOMOR VIRTUAL ACCOUNT</span>
                                    <span className="lg:text-2xl font-black text-blue-950 font-mono tracking-wider block mt-2 select-all">
                                        {details.va_number}
                                    </span>
                                </div>
                                <button
                                    onClick={() => copyText(details.va_number)}
                                    className="inline-flex items-center gap-1.5 text-xs font-black text-blue-900 hover:text-blue-950 border border-blue-200 hover:border-blue-300 px-4 py-2 rounded-xl transition"
                                >
                                    <Copy size={14} />
                                    <span>Salin VA Number</span>
                                </button>
                            </div>
                        )}

                        {/* 2. Mandiri Bill Payment */}
                        {order.payment_method === "mandiri_va" && details.bill_key && details.biller_code && (
                            <div className="space-y-4 text-center">
                                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                        <span className="text-xs text-slate-400 font-bold block">BILLER CODE</span>
                                        <span className="text-xl font-black text-blue-950 font-mono tracking-wider block mt-1 select-all">
                                            {details.biller_code}
                                        </span>
                                    </div>
                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                        <span className="text-xs text-slate-400 font-bold block">BILL KEY</span>
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
                                        <span>Salin Biller</span>
                                    </button>
                                    <button
                                        onClick={() => copyText(details.bill_key)}
                                        className="inline-flex items-center gap-1.5 text-xs font-black text-blue-900 border border-blue-200 px-3.5 py-2 rounded-xl hover:bg-slate-50"
                                    >
                                        <Copy size={12} />
                                        <span>Salin Bill Key</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 3. QRIS */}
                        {order.payment_method === "qris" && qrCodeUrl && (
                            <div className="flex flex-col items-center space-y-4">
                                <span className="text-xs text-slate-400 font-extrabold tracking-wider block uppercase">SCAN QRIS UNTUK MEMBAYAR</span>
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
                                        <span>Buka Aplikasi E-Wallet / QRIS</span>
                                        <ExternalLink size={16} />
                                    </a>
                                )}

                                <div className="flex items-center gap-2 text-[10px] font-extrabold bg-slate-50 border border-slate-100 px-3.5 py-1.5 rounded-full text-slate-500">
                                    <QrCode size={12} />
                                    <span>Mendukung Gopay, ShopeePay, OVO, Dana, LinkAja, & Mobile Banking</span>
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

                                {order.payment_method === "ovo" && (
                                    <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                                        {details.ovo_phone ? (
                                            <div className="p-4 bg-purple-50 border border-purple-100 rounded-2xl text-center w-full">
                                                <span className="font-bold text-purple-950 text-xs block">
                                                    Push Notification OVO Terkirim ke {details.ovo_phone}
                                                </span>
                                                <p className="text-[11px] text-purple-800 mt-1 leading-normal font-medium">
                                                    Silakan buka aplikasi OVO di ponsel Anda dan konfirmasikan pembayaran dalam waktu 30 detik.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-950 text-xs font-semibold rounded-2xl text-center w-full">
                                                Notifikasi belum dikirim. Silakan masukkan nomor OVO Anda di bawah ini.
                                            </div>
                                        )}

                                        <form onSubmit={handleOvoPay} className="w-full bg-slate-50 p-4 border border-slate-100 rounded-2xl space-y-3">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                                                    Nomor HP Akun OVO
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="Contoh: 08123456789"
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
                                                        <span>Mengirim Notifikasi...</span>
                                                    </>
                                                ) : (
                                                    <span>{details.ovo_phone ? "Kirim Ulang Notifikasi" : "Kirim Notifikasi OVO"}</span>
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
                                                ? "Buka Aplikasi DANA"
                                                : order.payment_method === "gopay"
                                                    ? "Buka Aplikasi GoPay / Gojek"
                                                    : order.payment_method === "shopeepay"
                                                        ? "Buka Aplikasi Shopee"
                                                        : "Buka Aplikasi E-Wallet"}
                                        </span>
                                        <ExternalLink size={16} />
                                    </a>
                                )}
                            </div>
                        )}

                        {/* 5. Retail Outlets (Alfamart / Indomaret) */}
                        {["alfamart", "indomaret"].includes(order.payment_method) && details.payment_code && (
                            <div className="space-y-4 text-center">
                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl inline-block max-w-sm w-full mx-auto">
                                    <span className="text-xs text-slate-400 font-bold tracking-wider block uppercase">KODE PEMBAYARAN KASIR</span>
                                    <span className="text-2xl font-black text-blue-950 font-mono tracking-wider block mt-2 select-all">
                                        {details.payment_code}
                                    </span>
                                </div>
                                <button
                                    onClick={() => copyText(details.payment_code)}
                                    className="inline-flex items-center gap-1.5 text-xs font-black text-blue-900 border border-blue-200 px-4 py-2 rounded-xl hover:bg-slate-50"
                                >
                                    <Copy size={14} />
                                    <span>Salin Kode Pembayaran</span>
                                </button>
                            </div>
                        )}

                        {/* 6. Credit Card Form (Only for waiting CC payment) */}
                        {order.payment_method === "credit_card" && order.payment_status === "unpaid" && (
                            <form onSubmit={handleCardPay} className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                                    <CreditCard size={14} className="text-blue-900" />
                                    <span>Detail Pembayaran Kartu Kredit / Debit</span>
                                </h3>

                                <div className="flex gap-2 items-center bg-white px-3 py-1.5 border border-slate-200/60 rounded-xl w-fit">
                                    <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mr-1 select-none">Menerima:</span>
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
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Nomor Kartu</label>
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
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Nama Pemegang Kartu</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Contoh: YOSSI NORDIANSAH"
                                            value={cardForm.cardholderName}
                                            onChange={(e) => setCardForm({ ...cardForm, cardholderName: e.target.value.toUpperCase() })}
                                            className="w-full text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-900"
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Bulan Exp</label>
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
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Tahun Exp</label>
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
                                            <span>Memproses Pembayaran...</span>
                                        </>
                                    ) : (
                                        <span>Proses Bayar Sekarang</span>
                                    )}
                                </button>
                            </form>
                        )}

                        {/* CC Status if paid */}
                        {order.payment_method === "credit_card" && order.payment_status === "paid" && (
                            <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2">
                                <CheckCircle2 size={16} className="text-emerald-600" />
                                <span>Status Transaksi Kartu Kredit / Debit: SUKSES & SELESAI</span>
                            </div>
                        )}

                    </div>

                    {/* Step-by-Step Payment Instructions */}
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl space-y-4">
                        <h3 className="text-sm font-extrabold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                            <HelpCircle className="text-blue-900" size={18} />
                            <span>Cara Pembayaran</span>
                        </h3>

                        {/* Instructions Render */}
                        {(["bca_va", "bri_va", "bni_va", "permata_va", "cimb_va", "seabank_va", "danamon_va", "bsi_va", "saqu_va"].includes(order.payment_method) || order.payment_method === "mandiri_va") && (
                            <div className="space-y-2">
                                {[
                                    {
                                        title: "Via Mobile Banking",
                                        steps: [
                                            "Buka aplikasi mobile banking Anda.",
                                            "Pilih menu 'Transfer' lalu pilih 'Virtual Account' atau 'E-Billing'.",
                                            "Masukkan nomor Virtual Account atau Kode Bayar yang tertera di atas.",
                                            "Masukkan jumlah pembayaran sesuai dengan Grand Total.",
                                            "Masukkan PIN Anda dan selesaikan transaksi."
                                        ]
                                    },
                                    {
                                        title: "Via ATM",
                                        steps: [
                                            "Masukkan kartu ATM dan PIN Anda.",
                                            "Pilih menu 'Transaksi Lainnya' > 'Transfer' > 'Virtual Account' atau 'Ke Rekening Bank'.",
                                            "Masukkan nomor Virtual Account.",
                                            "Pastikan jumlah bayar dan nama penerima sudah sesuai.",
                                            "Tekan Ya/Benar untuk membayar."
                                        ]
                                    }
                                ].map((group, idx) => (
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

                        {order.payment_method === "qris" && (
                            <ol className="list-decimal list-inside text-xs text-slate-500 space-y-2 leading-relaxed">
                                <li>Buka aplikasi e-wallet Anda (Gojek, Shopee, OVO, Dana, LinkAja) atau aplikasi M-Banking.</li>
                                <li>Pilih opsi 'Scan QR' atau 'Bayar'.</li>
                                <li>Arahkan kamera ke QR Code yang tertera di layar Anda.</li>
                                <li>Konfirmasikan detail pembayaran di aplikasi dan masukkan PIN Anda.</li>
                                <li>Tunggu hingga transaksi selesai dikonfirmasi otomatis.</li>
                            </ol>
                        )}

                        {["gopay", "shopeepay", "ovo", "dana"].includes(order.payment_method) && (
                            <ol className="list-decimal list-inside text-xs text-slate-500 space-y-2 leading-relaxed">
                                {order.payment_method === "ovo" ? (
                                    <>
                                        <li>Buka aplikasi OVO di ponsel Anda.</li>
                                        <li>Cek halaman notifikasi atau notifikasi push yang muncul.</li>
                                        <li>Setujui transaksi dan masukkan PIN OVO Anda.</li>
                                    </>
                                ) : (
                                    <>
                                        <li>Buka link aplikasi di ponsel Anda atau pindai kode QR yang muncul.</li>
                                        <li>Aplikasi dompet digital Anda akan terbuka otomatis.</li>
                                        <li>Periksa jumlah tagihan dan pastikan saldo Anda mencukupi.</li>
                                        <li>Lakukan otentikasi pembayaran menggunakan PIN atau Dompet digital.</li>
                                    </>
                                )}
                            </ol>
                        )}

                        {["alfamart", "indomaret"].includes(order.payment_method) && (
                            <ol className="list-decimal list-inside text-xs text-slate-500 space-y-2 leading-relaxed">
                                <li>Kunjungi gerai retail terdekat.</li>
                                <li>Katakan pada kasir bahwa Anda ingin melakukan pembayaran merchant Midtrans/Fayyfir Shop.</li>
                                <li>Tunjukkan Kode Pembayaran yang tertera di atas kepada kasir.</li>
                                <li>Lakukan pembayaran tunai/debit sejumlah Grand Total transaksi.</li>
                                <li>Simpan struk pembayaran sebagai bukti transaksi.</li>
                            </ol>
                        )}
                    </div>
                </div>

                {/* Right Column: Order Info, Payment Status, Sidebar Actions */}
                <div className="space-y-6">

                    {/* Invoice Info Card */}
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl space-y-5">
                        <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-extrabold text-sm text-slate-900">Rincian Pembayaran</h3>
                            <span className={`px-2.5 py-0.5 text-[9px] font-black tracking-wider border rounded-full uppercase ${order.payment_status === "paid"
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                : "bg-amber-50 text-amber-600 border-amber-100"
                                }`}>
                                {order.payment_status}
                            </span>
                        </div>

                        <div className="space-y-3.5 text-xs text-slate-500 font-medium">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span className="font-bold text-slate-800">{formatPrice(order.subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Ongkir ({order.shipping_courier})</span>
                                <span className="font-bold text-slate-800">{formatPrice(order.shipping_cost)}</span>
                            </div>
                            {order.discount_amount > 0 && (
                                <div className="flex justify-between text-emerald-600 font-bold">
                                    <span>Kupon / Diskon</span>
                                    <span>-{formatPrice(order.discount_amount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between pt-3 border-t border-slate-100 text-sm font-extrabold text-slate-900">
                                <span>Total Pembayaran</span>
                                <span className="text-blue-900 font-black text-base">{formatPrice(order.total_amount)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Panel */}
                    <div className="space-y-2.5">

                        {/* Change Method Action */}
                        {order.payment_status === "unpaid" && order.status === "pending" && (
                            <button
                                onClick={() => setIsChangingMethod(true)}
                                className="w-full py-3 border border-dashed border-blue-900/40 text-blue-950 font-bold text-xs rounded-xl hover:bg-blue-50/50 hover:border-blue-900 transition flex items-center justify-center gap-1.5 shadow-xs"
                            >
                                <RefreshCw size={13} className="text-blue-900" />
                                <span>Ubah Metode Pembayaran</span>
                            </button>
                        )}

                        {/* WhatsApp Support Action */}
                        <a
                            href={`https://wa.me/6281234567890?text=${encodeURIComponent(
                                `Halo Admin Fayyfir Shop, saya mengalami kendala pembayaran untuk nomor invoice ${order.invoice_number} sebesar ${formatPrice(order.total_amount)}.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-3 border border-emerald-100 bg-emerald-50/20 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 transition font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
                        >
                            <img src="/images/icons/whatsapp.svg" alt="WhatsApp" className="w-3.5 h-3.5 object-contain shrink-0" />
                            <span>Butuh Bantuan? Hubungi Admin</span>
                        </a>
                    </div>
                </div>

            </div>

            {/* PAYMENT METHOD SWITCHER MODAL / SIDEBAR DRAWER */}
            {isChangingMethod && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                        {/* Modal Header */}
                        <div className="p-4.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
                            <h3 className="font-extrabold text-sm text-blue-950 flex items-center gap-2">
                                <RefreshCw size={15} className="text-blue-900 animate-spin duration-1000" />
                                <span>Pilih Metode Pembayaran Baru</span>
                            </h3>
                            <button
                                onClick={() => setIsChangingMethod(false)}
                                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Modal Content - Methods List */}
                        <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-white">
                            {loadingChange ? (
                                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                                    <RefreshCw className="animate-spin text-blue-900" size={32} />
                                    <span className="text-xs text-slate-500 font-bold">Mengubah metode pembayaran & menghubungi Midtrans...</span>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    {changeCategories.map((cat) => {
                                        return (
                                            <div key={cat.id} className="space-y-2.5">
                                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-1 mt-2">
                                                    {getCategoryIcon(cat.id)}
                                                    <span>{cat.title}</span>
                                                </h4>
                                                <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                                                    {cat.methods.map((method) => {
                                                        const isSelected = method.id === order.payment_method;
                                                        return (
                                                            <button
                                                                key={method.id}
                                                                type="button"
                                                                disabled={isSelected || loadingChange}
                                                                onClick={() => handleMethodChange(method.id)}
                                                                className={`flex items-center gap-2.5 p-2.5 border rounded-xl text-left transition-all ${isSelected
                                                                    ? "border-blue-900 bg-blue-50/20 text-blue-950 shadow-xs ring-1 ring-blue-900 cursor-not-allowed opacity-90"
                                                                    : "border-slate-150 bg-white text-slate-700 hover:border-slate-350 hover:bg-slate-50/30"
                                                                    }`}
                                                            >
                                                                {/* Radio Checklist style */}
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
                                                                        <h5 className="text-[11.5px] font-bold text-slate-800 truncate leading-snug">
                                                                            {method.name}
                                                                        </h5>
                                                                        <p className="text-[9.5px] text-slate-400 mt-0.5 leading-tight truncate">
                                                                            {method.desc}
                                                                        </p>
                                                                    </div>

                                                                    <div className="shrink-0 flex items-center">
                                                                        {method.isCard ? (
                                                                            <div className="flex gap-0.5 items-center bg-slate-50 p-0.5 border border-slate-100 rounded-lg shrink-0 scale-90 origin-right">
                                                                                <img src="/images/payment/visa.svg" alt="Visa" className="h-3 object-contain" />
                                                                                <img src="/images/payment/mastercard.svg" alt="MC" className="h-3 object-contain" />
                                                                                <img src="/images/payment/jcb.svg" alt="JCB" className="h-3 object-contain" />
                                                                                <img src="/images/payment/amex.svg" alt="Amex" className="h-3 object-contain" />
                                                                                <img src="/images/payment/unionpay.svg" alt="UP" className="h-3 object-contain" />
                                                                            </div>
                                                                        ) : (
                                                                            <ModalPaymentLogo logo={method.logo} name={method.name} />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
