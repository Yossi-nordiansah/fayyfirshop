import React from "react";
import { Head } from "@inertiajs/react";
import MainLayout from "@/Layouts/MainLayout";
import Payment from "@/Components/checkout/Payment";
import { useLanguage } from "@/Contexts/LanguageContext";

export default function PaymentPage({ order, midtransClientKey, isProduction }) {
    const { t, locale } = useLanguage();

    return (
        <MainLayout>
            <Head title={`${t("payment.page_title", "Detail Pembayaran")} - Fayyfir Shop`} />

            <div className="min-h-screen bg-slate-50 pb-20 pt-28">
                <Payment
                    order={order}
                    midtransClientKey={midtransClientKey}
                    isProduction={isProduction}
                    t={t}
                    locale={locale}
                />
            </div>
        </MainLayout>
    );
}
