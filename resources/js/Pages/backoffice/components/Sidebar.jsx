import { Link } from '@inertiajs/react';
import {
    BarChart3,
    Boxes,
    ClipboardList,
    LayoutDashboard,
    MessageSquareText,
    Users,
} from 'lucide-react';

const menuItems = [
    {
        label: 'Dashboard',
        href: '/backoffice/dashboard',
        icon: LayoutDashboard,
    },
    {
        label: 'Product Management',
        href: '/backoffice/product-management',
        icon: Boxes,
    },
    {
        label: 'Orders',
        href: '/backoffice/orders',
        icon: ClipboardList,
    },
    {
        label: 'Review',
        href: '/backoffice/review',
        icon: MessageSquareText,
    },
    {
        label: 'Users',
        href: '/backoffice/users',
        icon: Users,
    },
    {
        label: 'Reports',
        href: '/backoffice/reports',
        icon: BarChart3,
    },
];

export default function Sidebar() {
    const currentPath =
        typeof window !== 'undefined' ? window.location.pathname : '';

    return (
        <aside className="sticky top-0 flex flex-col h-screen max-h-screen px-4 py-6 overflow-y-auto text-white border-r border-blue-800 w-72 bg-gradient-to-b from-blue-950 via-blue-900 to-blue-800">
            <div className="px-3 pb-8">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-200">
                    Backoffice
                </p>
                <img src="/images/logo-footer.png" alt="Logo" className="w-auto h-10 mt-4" />
            </div>

            <nav className="flex flex-col flex-1 gap-1">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPath === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${isActive
                                ? 'bg-white text-blue-950 shadow-sm'
                                : 'text-blue-100 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <Icon className="w-5 h-5" aria-hidden="true" />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
