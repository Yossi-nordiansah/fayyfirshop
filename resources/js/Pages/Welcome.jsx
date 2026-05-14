import { Head, Link } from '@inertiajs/react';
import HeroSlider from './home/Hero';
import UniqueSellingProposition from './home/UniqueSellingProposition';
import CategorySection from './home/CategorySection';
import Navbar from '@/Components/Navbar';
import NewProduct from './home/NewProduct';
import BestSeller from './home/BestSeller';
import MainLayout from '@/Layouts/MainLayout';

export default function Welcome({ auth, laravelVersion, phpVersion }) {

    return (
        <div className="min-h-screen">
            <Head title="Home" />
            <Navbar />
            <MainLayout>
                <HeroSlider />
                <CategorySection />
                <NewProduct />
                <BestSeller />
                <UniqueSellingProposition />
            </MainLayout>
        </div>
    );
}
