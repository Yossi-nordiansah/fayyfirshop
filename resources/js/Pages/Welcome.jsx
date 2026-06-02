import { Head, Link } from "@inertiajs/react";
import { useEffect, useState } from "react";
import HeroSlider from "./home/Hero";
import UniqueSellingProposition from "./home/UniqueSellingProposition";
import CategorySection from "./home/CategorySection";
import Navbar from "@/Components/Navbar";
import NewProduct from "./home/NewProduct";
import BestSeller from "./home/BestSeller";
import MainLayout from "@/Layouts/MainLayout";
import FeaturedProduct from "./home/FeaturedProduct";
import CustomerRating from "./home/CustomerRating";
import Footer from "@/Components/Footer";
import TopVerticalTicker from "./home/TopVerticalTicker";

export default function Welcome({ auth, laravelVersion, phpVersion, newProducts = [], bestSellerProducts = [] }) {
    const tickerHeight = 36;
    const [navbarOffset, setNavbarOffset] = useState(tickerHeight);

    useEffect(() => {
        const updateNavbarOffset = () => {
            setNavbarOffset(Math.max(tickerHeight - window.scrollY, 0));
        };

        updateNavbarOffset();
        window.addEventListener("scroll", updateNavbarOffset, { passive: true });
        return () => window.removeEventListener("scroll", updateNavbarOffset);
    }, []);

    return (
        <div className="min-h-screen">
            <Head title="Home" />
            <TopVerticalTicker />
            <Navbar topOffset={navbarOffset} />
            <MainLayout>
                <HeroSlider />
                <CategorySection />
                <NewProduct products={newProducts} />
                <BestSeller products={bestSellerProducts} />
                <FeaturedProduct />
                <UniqueSellingProposition />
                <CustomerRating />
                <Footer />
            </MainLayout>
        </div>
    );
}
