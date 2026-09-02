import { Head } from "@inertiajs/react";
import HeroSlider from "./home/Hero";
import UniqueSellingProposition from "./home/UniqueSellingProposition";
import CategorySection from "./home/CategorySection";
import NewProduct from "./home/NewProduct";
import BestSeller from "./home/BestSeller";
import MainLayout from "@/Layouts/MainLayout";
import FeaturedProduct from "./home/FeaturedProduct";
import FeaturedProduct2 from "./home/FeaturedProduct2";
import FeaturedProduct3 from "./home/FeaturedProduct3";
import CustomerRating from "./home/CustomerRating";
import { useLanguage } from "@/Contexts/LanguageContext";

export default function Welcome({ auth, laravelVersion, phpVersion, newProducts = [], bestSellerProducts = [], reviews = [], heroSlides = [], homeCategoryCards = [], featuredProducts = [], featuredProduct2 = [], featuredProduct3 = [], uspItems = [] }) {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen">
            <Head title={`Fayyfir - ${t("nav.home", "Beranda")}`} />
            <MainLayout alwaysSolid={false} showWhatsAppFloatingButton={true}>
                <HeroSlider heroSlides={heroSlides} />
                <CategorySection categoryCards={homeCategoryCards} />
                <FeaturedProduct2 featuredProduct2={featuredProduct2} />
                <NewProduct products={newProducts} />
                <FeaturedProduct3 featuredProduct3={featuredProduct3} />
                <BestSeller products={bestSellerProducts} />
                <FeaturedProduct featuredProducts={featuredProducts} />
                <UniqueSellingProposition uspItems={uspItems} />
                <CustomerRating reviews={reviews} />
            </MainLayout>
        </div>
    );
}
