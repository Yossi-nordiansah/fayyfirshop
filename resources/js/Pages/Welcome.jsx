import { Head, Link } from "@inertiajs/react";
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
export default function Welcome({ auth, laravelVersion, phpVersion, newProducts = [], bestSellerProducts = [] }) {
    return (
         <div className="min-h-screen">
             <Head title="Home" />
             <Navbar />
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
