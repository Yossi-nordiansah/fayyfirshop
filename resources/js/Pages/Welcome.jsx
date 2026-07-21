import { Head } from "@inertiajs/react";
import HeroSlider from "./home/Hero";
import UniqueSellingProposition from "./home/UniqueSellingProposition";
import CategorySection from "./home/CategorySection";
import NewProduct from "./home/NewProduct";
import BestSeller from "./home/BestSeller";
import MainLayout from "@/Layouts/MainLayout";
import FeaturedProduct from "./home/FeaturedProduct";
import CustomerRating from "./home/CustomerRating";
import { useLanguage } from "@/Contexts/LanguageContext";

export default function Welcome({ auth, laravelVersion, phpVersion, newProducts = [], bestSellerProducts = [], reviews = [], heroSlides = [], homeCategoryCards = [], featuredProducts = [], uspItems = [] }) {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen">
            <Head title={`Fayyfir - ${t("nav.home", "Beranda")}`} />
            <MainLayout alwaysSolid={false} showWhatsAppFloatingButton={true}>
                <HeroSlider heroSlides={heroSlides} />
                <CategorySection categoryCards={homeCategoryCards} />
                <NewProduct products={newProducts} />
                <BestSeller products={bestSellerProducts} />
                <FeaturedProduct featuredProducts={featuredProducts} />
                <UniqueSellingProposition uspItems={uspItems} />
                <CustomerRating reviews={reviews} />
            </MainLayout>
        </div>
    );
}
