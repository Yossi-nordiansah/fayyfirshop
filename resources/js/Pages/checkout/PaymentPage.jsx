import React, { useEffect } from "react";
import { Head, router } from "@inertiajs/react";
import MainLayout from "@/Layouts/MainLayout";
import Payment from "@/Components/checkout/Payment";
import { useLanguage } from "@/Contexts/LanguageContext";

export default function PaymentPage({ order, xenditPublicKey, isProduction }) {
    const { t, locale } = useLanguage();

    useEffect(() => {
        // Push a state into history so browser back button triggers popstate
        window.history.pushState(null, "", window.location.href);

        const handlePopState = () => {
            router.visit(route("orders.index"), { data: { tab: "unpaid" }, replace: true });
        };

        window.addEventListener("popstate", handlePopState);
        return () => {
            window.removeEventListener("popstate", handlePopState);
        };
    }, []);

    return (
        <MainLayout>
            <Head title={`Fayyfir - ${t("payment.page_title", "Detail Pembayaran")}`} />

            <div className="min-h-screen bg-slate-50 pb-8 pt-24">
                <Payment
                    order={order}
                    xenditPublicKey={xenditPublicKey}
                    isProduction={isProduction}
                    t={t}
                    locale={locale}
                />
            </div>
        </MainLayout>
    );
}
