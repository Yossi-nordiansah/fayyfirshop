import { Head, Link } from '@inertiajs/react';
import { FolderTree } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function ProductManagement() {
    return (
        <div className="min-h-screen bg-blue-50">
            <Head title="Product Management" />

            <div className="flex min-h-screen">
                <Sidebar />

                <main className="flex flex-col flex-1 min-w-0">
                    <Navbar />

                    <div className="flex-1 p-6 space-y-6">
                        <section className="flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold tracking-normal text-blue-950">
                                    Product Management
                                </h1>
                                <p className="mt-1 text-sm text-slate-500">
                                    Manage products and product categories.
                                </p>
                            </div>

                            <Link
                                href={route('backoffice.product-categories.index')}
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800"
                            >
                                <FolderTree className="w-4 h-4" />
                                Category Product
                            </Link>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
}
