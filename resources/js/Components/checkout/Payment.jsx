import React, { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import axios from "axios";

import PaymentHeader from "@/Components/checkout/payment/PaymentHeader";
import ExpiryBanner from "@/Components/checkout/payment/ExpiryBanner";
import PaymentCodeCard from "@/Components/checkout/payment/PaymentCodeCard";
import PaymentInstructions from "@/Components/checkout/payment/PaymentInstructions";
import OrderSummaryCard from "@/Components/checkout/payment/OrderSummaryCard";
import ActionPanel from "@/Components/checkout/payment/ActionPanel";
import ChangeMethodModal from "@/Components/checkout/payment/ChangeMethodModal";

export default function Payment({ order, midtransClientKey, isProduction, t, locale }) {
    const isRtl = locale === "arabic";

    /* ── UI State ── */
    const [timeLeft, setTimeLeft] = useState(null);
    const [isChangingMethod, setIsChangingMethod] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isPayingCard, setIsPayingCard] = useState(false);
    const [loadingChange, setLoadingChange] = useState(false);
    const [activeAccordion, setActiveAccordion] = useState(null);

    /* ── Credit Card Form State ── */
    const [cardForm, setCardForm] = useState({
        cardNumber: "",
        cardholderName: "",
        expiryMonth: "",
        expiryYear: "",
        cvv: "",
    });

    /* ── OVO State ── */
    const [ovoPhone, setOvoPhone] = useState(() => order.payment_details?.ovo_phone || "");
    const [isPayingOvo, setIsPayingOvo] = useState(false);

    /* ── Derived Data ── */
    const details = order.payment_details || {};
    const qrCodeUrl = details.qr_string
        ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(details.qr_string)}`
        : details.qr_url;

    /* ── Helpers ── */
    const formatPrice = (value) => {
        const currencySymbol = locale === "indonesia" ? "Rp" : "IDR";
        const formattedNumber = new Intl.NumberFormat("id-ID", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value || 0);

        return `${currencySymbol} ${formattedNumber}`;
    };

    const copyText = (text) => {
        navigator.clipboard.writeText(text);
        alert(t("payment.copied", "Berhasil disalin ke clipboard!"));
    };

    /* ── Change Categories (for modal) ── */
    const changeCategories = [
        {
            id: "e_wallet",
            title: t("checkout.payment.e_wallet", "E-Wallet"),
            methods: [
                { id: "gopay", name: "GoPay", desc: "Bayar menggunakan aplikasi Gojek", logo: "/images/payment/gopay.svg" },
                { id: "shopeepay", name: "ShopeePay", desc: "Bayar menggunakan aplikasi Shopee", logo: "/images/payment/shopeepay.svg" },
                { id: "ovo", name: "OVO", desc: "Bayar menggunakan aplikasi OVO", logo: "/images/payment/ovo.svg" },
                { id: "dana", name: "DANA", desc: "Bayar menggunakan aplikasi DANA", logo: "/images/payment/dana.svg" },
            ],
        },
        {
            id: "qris",
            title: t("checkout.payment.qris", "QRIS"),
            methods: [
                { id: "qris", name: "QRIS", desc: "Scan QR menggunakan aplikasi e-wallet", logo: "/images/payment/qris.svg" },
            ],
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
                { id: "saqu_va", name: "Bank Saqu Virtual Account", desc: "Transfer Virtual Account Bank Saqu", logo: "/images/payment/saqu.svg" },
            ],
        },
        {
            id: "card",
            title: t("checkout.payment.credit_card", "Credit / Debit Card"),
            methods: [
                { id: "credit_card", name: "Credit / Debit Card", desc: "Visa • Mastercard • JCB • Amex • UnionPay", isCard: true },
            ],
        },
        {
            id: "retail",
            title: t("checkout.payment.retail", "Retail Outlet / Gerai Retail"),
            methods: [
                { id: "alfamart", name: "Alfamart", desc: "Bayar di gerai Alfamart terdekat", logo: "/images/payment/alfamart.svg" },
                { id: "indomaret", name: "Indomaret", desc: "Bayar di gerai Indomaret terdekat", logo: "/images/payment/indomaret.svg" },
            ],
        },
    ];

    /* ── Effects ── */

    // Countdown timer & Auto-cancel on expiry
    useEffect(() => {
        const handleOrderExpiry = () => {
            if (order.status === "cancelled" || order.payment_status === "expired") return;

            try {
                const url = route("checkout.payment.expire", order.id);
                axios
                    .post(url)
                    .then((res) => {
                        if (res.data.success) {
                            router.reload();
                        }
                    })
                    .catch((err) => {
                        console.error("Failed to expire order:", err);
                    });
            } catch (routeError) {
                console.warn("Ziggy route 'checkout.payment.expire' not found. Falling back to direct URL.");
                axios
                    .post(`/checkout/payment/${order.id}/expire`)
                    .then((res) => {
                        if (res.data.success) {
                            router.reload();
                        }
                    })
                    .catch((err) => {
                        console.error("Failed to expire order via fallback URL:", err);
                    });
            }
        };

        const calculateTimeLeft = () => {
            const expiry = order.payment_details?.expiry_time;
            const target = expiry
                ? new Date(expiry)
                : new Date(new Date(order.created_at).getTime() + 24 * 60 * 60 * 1000);
            const difference = target.getTime() - new Date().getTime();
            if (difference <= 0) return null;
            return {
                hours: Math.floor(difference / (1000 * 60 * 60)),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        };

        const initialLeft = calculateTimeLeft();
        setTimeLeft(initialLeft);
        if (!initialLeft) {
            handleOrderExpiry();
            return;
        }

        const timer = setInterval(() => {
            const left = calculateTimeLeft();
            setTimeLeft(left);
            if (!left) {
                clearInterval(timer);
                handleOrderExpiry();
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [order]);

    // Poll payment status every 5 seconds while unpaid
    useEffect(() => {
        if (order.payment_status !== "unpaid" || order.status !== "pending") return;
        const interval = setInterval(() => router.reload({ only: ["order"] }), 5000);
        return () => clearInterval(interval);
    }, [order.payment_status, order.status]);

    // Auto-redirect when paid
    useEffect(() => {
        if (order.payment_status === "paid") {
            router.visit(route("checkout.success", order.id));
        }
    }, [order.payment_status, order.id]);

    // Load Midtrans SDK for Credit Card
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

    /* ── Handlers ── */

    const handleCardPay = (e) => {
        e.preventDefault();
        if (!window.Midtrans) {
            alert(t("payment.sdk_error", "Midtrans SDK gagal dimuat. Harap periksa koneksi internet Anda."));
            return;
        }
        setIsPayingCard(true);
        window.Midtrans.card.token(
            {
                card_number: cardForm.cardNumber.replace(/\s+/g, ""),
                card_exp_month: cardForm.expiryMonth,
                card_exp_year: "20" + cardForm.expiryYear.slice(-2),
                card_cvv: cardForm.cvv,
                client_key: midtransClientKey,
            },
            {
                onSuccess: (response) => {
                    axios
                        .post(route("checkout.payment.pay-card", order.id), { token_id: response.token_id })
                        .then((res) => {
                            if (res.data.success) {
                                res.data.redirect_url
                                    ? (window.location.href = res.data.redirect_url)
                                    : router.reload();
                            } else {
                                alert(res.data.message || "Pembayaran gagal.");
                            }
                        })
                        .catch((err) => {
                            alert(err.response?.data?.message || "Terjadi kesalahan saat memproses kartu Anda.");
                        })
                        .finally(() => setIsPayingCard(false));
                },
                onFailure: (response) => {
                    alert(t("payment.card_validation_failed", "Validasi kartu gagal: ") + response.validation_messages.join(", "));
                    setIsPayingCard(false);
                },
            }
        );
    };

    const handleOvoPay = (e) => {
        e.preventDefault();
        if (!ovoPhone.trim()) { alert("Nomor HP OVO wajib diisi."); return; }
        setIsPayingOvo(true);
        axios
            .post(route("checkout.payment.change", order.id), { payment_method: "ovo", phone_number: ovoPhone })
            .then((res) => {
                res.data.success ? router.reload() : alert(res.data.message || "Gagal memproses pembayaran OVO.");
            })
            .catch((err) => alert(err.response?.data?.message || "Terjadi kesalahan saat menghubungi OVO."))
            .finally(() => setIsPayingOvo(false));
    };

    const handleMethodChange = (newMethod) => {
        setLoadingChange(true);
        axios
            .post(route("checkout.payment.change", order.id), { payment_method: newMethod })
            .then((res) => {
                if (res.data.success) {
                    setIsChangingMethod(false);
                    router.reload();
                } else {
                    alert(res.data.message || "Gagal mengubah metode pembayaran.");
                }
            })
            .catch((err) => alert(err.response?.data?.message || "Terjadi kesalahan."))
            .finally(() => setLoadingChange(false));
    };

    /* ── Render ── */
    return (
        <div className="max-w-4xl lg:max-w-5xl mx-auto px-4 py-8" dir={isRtl ? "rtl" : "ltr"}>

            <PaymentHeader t={t} isRtl={isRtl} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    <ExpiryBanner order={order} timeLeft={timeLeft} t={t} />

                    <PaymentCodeCard
                        order={order}
                        details={details}
                        qrCodeUrl={qrCodeUrl}
                        cardForm={cardForm}
                        setCardForm={setCardForm}
                        isPayingCard={isPayingCard}
                        isPayingOvo={isPayingOvo}
                        ovoPhone={ovoPhone}
                        setOvoPhone={setOvoPhone}
                        handleCardPay={handleCardPay}
                        handleOvoPay={handleOvoPay}
                        copyText={copyText}
                        t={t}
                    />

                    <PaymentInstructions
                        order={order}
                        activeAccordion={activeAccordion}
                        setActiveAccordion={setActiveAccordion}
                        t={t}
                    />
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    <OrderSummaryCard order={order} formatPrice={formatPrice} t={t} />

                    <ActionPanel
                        order={order}
                        formatPrice={formatPrice}
                        onChangeMethod={() => setIsChangingMethod(true)}
                        timeLeft={timeLeft}
                        t={t}
                    />
                </div>
            </div>

            <ChangeMethodModal
                isOpen={isChangingMethod}
                onClose={() => setIsChangingMethod(false)}
                changeCategories={changeCategories}
                loadingChange={loadingChange}
                onMethodChange={handleMethodChange}
                currentMethod={order.payment_method}
                t={t}
            />
        </div>
    );
}
