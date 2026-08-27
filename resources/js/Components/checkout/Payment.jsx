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
import Toast from "@/Components/Toast";

export default function Payment({ order, xenditPublicKey, isProduction, t, locale }) {
    const isRtl = locale === "arabic";

    /* ── UI State ── */
    const [timeLeft, setTimeLeft] = useState(null);
    const [isChangingMethod, setIsChangingMethod] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isPayingCard, setIsPayingCard] = useState(false);
    const [loadingChange, setLoadingChange] = useState(false);
    const [activeAccordion, setActiveAccordion] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");

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
    const derivedQrString = details.qr_string || details.deeplink || details.qr_url;
    const qrCodeUrl = derivedQrString
        ? (details.qr_url && (details.qr_url.endsWith(".png") || details.qr_url.endsWith(".jpg") || details.qr_url.endsWith(".svg") || details.qr_url.includes("qr")))
            ? details.qr_url
            : `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(derivedQrString)}`
        : null;

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
        setToastMessage(t("payment.copied", "Berhasil disalin ke clipboard!"));
        setShowToast(true);
    };

    // Auto-dismiss toast
    useEffect(() => {
        if (showToast) {
            const timer = setTimeout(() => {
                setShowToast(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [showToast]);

    /* ── Change Categories (for modal) ── */
    const changeCategories = [
        {
            id: "e_wallet",
            title: t("checkout.payment.e_wallet", "E-Wallet"),
            methods: [
                // { id: "gopay", name: "GoPay", desc: t("checkout.payment.desc.gopay", "Bayar menggunakan aplikasi Gojek"), logo: "/images/payment/gopay.svg" },
                { id: "shopeepay", name: "ShopeePay", desc: t("checkout.payment.desc.shopeepay", "Bayar menggunakan aplikasi Shopee"), logo: "/images/payment/shopeepay.svg" },
                // { id: "dana", name: "DANA", desc: t("checkout.payment.desc.dana", "Bayar menggunakan aplikasi DANA"), logo: "/images/payment/dana.svg" },
                { id: "linkaja", name: "LinkAja", desc: t("checkout.payment.desc.linkaja", "Bayar menggunakan aplikasi LinkAja"), logo: "/images/payment/link-aja.svg" },
            ],
        },
        {
            id: "qris",
            title: t("checkout.payment.qris", "QRIS"),
            methods: [
                { id: "qris", name: "QRIS", desc: t("checkout.payment.desc.qris", "Scan QR menggunakan aplikasi e-wallet"), logo: "/images/payment/qris.svg" },
            ],
        },
        {
            id: "virtual_account",
            title: t("checkout.payment.virtual_account", "Virtual Account (Verifikasi Otomatis)"),
            methods: [
                { id: "bca_va", name: "BCA Virtual Account", desc: t("checkout.payment.desc.bca_va", "Transfer Virtual Account BCA"), logo: "/images/payment/bca.svg" },
                { id: "bri_va", name: "BRI Virtual Account", desc: t("checkout.payment.desc.bri_va", "Transfer Virtual Account BRI"), logo: "/images/payment/bri.svg" },
                { id: "bni_va", name: "BNI Virtual Account", desc: t("checkout.payment.desc.bni_va", "Transfer Virtual Account BNI"), logo: "/images/payment/bni.svg" },
                { id: "mandiri_va", name: "Mandiri Bill Payment", desc: t("checkout.payment.desc.mandiri_va", "Transfer Mandiri Bill Payment"), logo: "/images/payment/mandiri.svg" },
                { id: "permata_va", name: "Permata Virtual Account", desc: t("checkout.payment.desc.permata_va", "Transfer Virtual Account Permata"), logo: "/images/payment/permata.svg" },
                { id: "cimb_va", name: "CIMB Niaga Virtual Account", desc: t("checkout.payment.desc.cimb_va", "Transfer Virtual Account CIMB Niaga"), logo: "/images/payment/cimb.svg" },
                // { id: "seabank_va", name: "SeaBank Virtual Account", desc: t("checkout.payment.desc.seabank_va", "Transfer Virtual Account SeaBank"), logo: "/images/payment/seabank.svg" },  // SEMENTARA DINONAKTIFKAN
                // { id: "danamon_va", name: "Danamon Virtual Account", desc: t("checkout.payment.desc.danamon_va", "Transfer Virtual Account Danamon"), logo: "/images/payment/danamon.svg" },  // SEMENTARA DINONAKTIFKAN
                { id: "bsi_va", name: "BSI Virtual Account", desc: t("checkout.payment.desc.bsi_va", "Transfer Virtual Account BSI"), logo: "/images/payment/bsi.svg" },
                // { id: "saqu_va", name: "Bank Saqu Virtual Account", desc: t("checkout.payment.desc.saqu_va", "Transfer Virtual Account Bank Saqu"), logo: "/images/payment/saqu.svg" },  // SEMENTARA DINONAKTIFKAN
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
                { id: "alfamart", name: "Alfamart", desc: t("checkout.payment.desc.alfamart", "Bayar di gerai Alfamart terdekat"), logo: "/images/payment/alfamart.svg" },
                { id: "indomaret", name: "Indomaret", desc: t("checkout.payment.desc.indomaret", "Bayar di gerai Indomaret terdekat"), logo: "/images/payment/indomaret.svg" },
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
                ? new Date(expiry.includes("T") ? expiry : expiry.replace(" ", "T") + "+07:00")
                : new Date(new Date(order.created_at).getTime() + 24 * 60 * 60 * 1000);

            let difference = target.getTime() - new Date().getTime();

            if (isNaN(difference)) {
                const fallbackTarget = new Date(new Date(order.created_at).getTime() + 24 * 60 * 60 * 1000);
                difference = fallbackTarget.getTime() - new Date().getTime();
            }

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

    // Polling status pembayaran secara berkala dan otomatis redirect ke halaman sukses saat lunas
    useEffect(() => {
        if (order.payment_status === "paid") {
            router.visit(route("checkout.success", order.id), { replace: true });
            return;
        }

        if (order.payment_status !== "unpaid" || order.status === "cancelled") {
            return;
        }

        const pollStatus = () => {
            axios
                .get(route("checkout.payment.status", order.id))
                .then((res) => {
                    if (res.data && res.data.payment_status === "paid") {
                        router.visit(route("checkout.success", order.id), { replace: true });
                    } else if (res.data && (res.data.payment_status === "expired" || res.data.status === "cancelled")) {
                        router.reload();
                    }
                })
                .catch((err) => {
                    console.error("Failed to check payment status:", err);
                });
        };

        const interval = setInterval(pollStatus, 2500);
        return () => clearInterval(interval);
    }, [order.id, order.payment_status, order.status]);

    /* ── Handlers ── */

    const handleCardPay = (e) => {
        e.preventDefault();
        setIsPayingCard(true);
        if (details.invoice_url) {
            window.location.href = details.invoice_url;
            return;
        }
        axios
            .post(route("checkout.payment.pay-card", order.id))
            .then((res) => {
                if (res.data.success && res.data.redirect_url) {
                    window.location.href = res.data.redirect_url;
                } else {
                    alert(res.data.message || "Pembayaran gagal.");
                }
            })
            .catch((err) => {
                alert(err.response?.data?.message || "Terjadi kesalahan saat memproses pembayaran kartu.");
            })
            .finally(() => setIsPayingCard(false));
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

    const [isSimulating, setIsSimulating] = useState(false);

    const handleSimulatePayment = () => {
        setIsSimulating(true);
        axios
            .post(route("checkout.payment.simulate", order.id))
            .then((res) => {
                if (res.data.success) {
                    router.visit(route("checkout.success", order.id), { replace: true });
                } else {
                    alert(res.data.message || "Gagal mensimulasikan pembayaran.");
                }
            })
            .catch((err) => {
                alert(err.response?.data?.message || "Terjadi kesalahan saat memproses simulasi.");
            })
            .finally(() => setIsSimulating(false));
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
        <div className="max-w-4xl lg:max-w-5xl mx-auto px-1 md:px-4 py-2" dir={isRtl ? "rtl" : "ltr"}>

            <PaymentHeader t={t} isRtl={isRtl} />

            <div className="bg-transparent border border-slate-100 rounded-3xl overflow-hidden flex flex-col lg:grid lg:grid-cols-3 lg:divide-x lg:divide-slate-100 divide-y lg:divide-y-0 divide-slate-100">

                {/* Left Column Wrapper */}
                <div className="contents lg:flex lg:flex-col lg:col-span-2 lg:divide-y lg:divide-slate-100">

                    {/* Batas Waktu */}
                    <div className="order-2 lg:order-none p-5 sm:p-6 bg-gradient-to-br from-amber-50/40 to-orange-50/40">
                        <ExpiryBanner order={order} timeLeft={timeLeft} t={t} />
                    </div>

                    {/* Kode Pembayaran */}
                    <div className="order-3 lg:order-none p-5 sm:p-6">
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
                            isProduction={isProduction}
                            isSimulating={isSimulating}
                            handleSimulatePayment={handleSimulatePayment}
                            t={t}
                        />
                    </div>

                    {/* Cara Pembayaran */}
                    <div className="order-4 lg:order-none p-5 sm:p-6">
                        <PaymentInstructions
                            order={order}
                            activeAccordion={activeAccordion}
                            setActiveAccordion={setActiveAccordion}
                            t={t}
                        />
                    </div>
                </div>

                {/* Right Column Wrapper */}
                <div className="contents lg:flex lg:flex-col lg:col-span-1 lg:divide-y lg:divide-slate-100 bg-slate-50/[0.15]">

                    {/* Total Pembayaran (Rincian) */}
                    <div className="order-1 lg:order-none p-5 sm:p-6">
                        <OrderSummaryCard order={order} formatPrice={formatPrice} t={t} />
                    </div>

                    {/* Action Panel (Ubah Metode & Help Admin) */}
                    <div className="order-5 lg:order-none p-5 sm:p-6 bg-slate-50/30 lg:bg-transparent">
                        <ActionPanel
                            order={order}
                            formatPrice={formatPrice}
                            onChangeMethod={() => setIsChangingMethod(true)}
                            timeLeft={timeLeft}
                            t={t}
                        />
                    </div>
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

            {/* Toast Notification */}
            <Toast
                show={showToast}
                message={toastMessage}
                onClose={() => setShowToast(false)}
            />
        </div>
    );
}
