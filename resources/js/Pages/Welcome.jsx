import { Head } from "@inertiajs/react";
import HeroSlider from "./home/Hero";
import UniqueSellingProposition from "./home/UniqueSellingProposition";
import CategorySection from "./home/CategorySection";
import NewProduct from "./home/NewProduct";
import BestSeller from "./home/BestSeller";
import MainLayout from "@/Layouts/MainLayout";
import FeaturedProduct from "./home/FeaturedProduct";
import CustomerRating from "./home/CustomerRating";
export default function Welcome({ auth, laravelVersion, phpVersion, newProducts = [], bestSellerProducts = [], reviews = [] }) {
    return (
        <div className="min-h-screen">
            <Head title="Home" />
            <MainLayout alwaysSolid={false} showWhatsAppFloatingButton={true}>
                <HeroSlider />
                <CategorySection />
                <NewProduct products={newProducts} />
                <BestSeller products={bestSellerProducts} />
                <FeaturedProduct />
                <UniqueSellingProposition />
                <CustomerRating reviews={reviews} />
            </MainLayout>
        </div>
    );
}
