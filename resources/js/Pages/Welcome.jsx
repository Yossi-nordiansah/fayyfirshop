import { Head, Link } from '@inertiajs/react';
import HeroSlider from './home/Hero';
import UniqueSellingProposition from './home/UniqueSellingProposition';
import CategorySection from './home/CategorySection';
import Navbar from '@/Components/Navbar';
import NewProduct from './home/NewProduct';

export default function Welcome({ auth, laravelVersion, phpVersion }) {

    return (
        <div className="bg-zinc-950 min-h-screen">
            <Head title="Home" />
            <Navbar />
            <main>
                <HeroSlider />
                <CategorySection />
                <NewProduct />
                <UniqueSellingProposition />
            </main>
        </div>
    );
}
