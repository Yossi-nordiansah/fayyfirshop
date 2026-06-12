import { Link } from '@inertiajs/react';
import { useLanguage } from '@/Contexts/LanguageContext';
import {
    BadgeCheck,
    BarChart3,
    Boxes,
    Building2,
    ClipboardList,
    ContactRound,
    LayoutDashboard,
    MessageSquareText,
    Sparkles,
} from 'lucide-react';

const menuItems = [
    {
        labelKey: 'backoffice.sidebar.dashboard',
        fallback: 'Dashboard',
        href: '/backoffice/dashboard',
        icon: LayoutDashboard,
    },
    {
        labelKey: 'backoffice.sidebar.product_management',
        fallback: 'Product Management',
        href: '/backoffice/product-management',
        icon: Boxes,
        checkActive: (path) =>
            path === '/backoffice/product-management' ||
            path.startsWith('/backoffice/products') ||
            path.startsWith('/backoffice/product-categories'),
    },
    {
        labelKey: 'backoffice.sidebar.orders',
        fallback: 'Orders',
        href: '/backoffice/orders',
        icon: ClipboardList,
    },
    {
        labelKey: 'backoffice.sidebar.review',
        fallback: 'Review',
        href: '/backoffice/review',
        icon: MessageSquareText,
    },
    {
        labelKey: 'backoffice.sidebar.admin',
        fallback: 'Admin',
        href: '/backoffice/admin',
        icon: BadgeCheck,
    },
    {
        labelKey: 'backoffice.sidebar.customer',
        fallback: 'Customer',
        href: '/backoffice/customer',
        icon: ContactRound,
    },
    {
        labelKey: 'backoffice.sidebar.store_branches',
        fallback: 'Store Branches',
        href: '/backoffice/store-branches',
        icon: Building2,
    },
    {
        labelKey: 'backoffice.sidebar.reports',
        fallback: 'Reports',
        href: '/backoffice/reports',
        icon: BarChart3,
    },
    {
        labelKey: 'backoffice.sidebar.promotion',
        fallback: 'Promotion',
        href: '/backoffice/promotion',
        icon: Sparkles,
    },
];

export default function Sidebar() {
    const { t } = useLanguage();
    const currentPath =
        typeof window !== 'undefined' ? window.location.pathname : '';

    return (
        <aside className="sticky top-0 flex flex-col h-screen max-h-screen px-4 py-6 overflow-y-auto text-white border-r border-blue-800 w-54 bg-gradient-to-b from-blue-950 via-blue-900 to-blue-800">
            <div className="px-3 pb-8">
                <img
                    src="/images/logo-footer.png"
                    alt="Logo"
                    className="w-auto h-10 mt-4"
                />
            </div>

            <nav className="flex flex-col flex-1 gap-1">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.checkActive
                        ? item.checkActive(currentPath)
                        : currentPath === item.href ||
                          currentPath.startsWith(item.href + '/');

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
                            <span>{t(item.labelKey, item.fallback)}</span>
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
