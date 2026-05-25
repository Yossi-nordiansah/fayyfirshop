import { Head } from '@inertiajs/react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function Users() {
    return (
        <div className="min-h-screen bg-blue-50">
            <Head title="Users" />

            <div className="flex min-h-screen">
                <Sidebar />

                <main className="flex min-w-0 flex-1 flex-col">
                    <Navbar />

                    <div className="flex-1 p-6">
                        <h1 className="text-3xl font-bold tracking-normal text-blue-950">
                            Users
                        </h1>
                    </div>
                </main>
            </div>
        </div>
    );
}
