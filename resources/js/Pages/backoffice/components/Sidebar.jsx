import { Link, usePage } from '@inertiajs/react';
import { useLanguage } from '@/Contexts/LanguageContext';
import { useState, useEffect } from 'react';
import {
    BadgeCheck,
    BarChart3,
    Boxes,
    Building2,
    ClipboardList,
    ContactRound,
    Globe,
    LayoutDashboard,
    MessageSquareText,
    Sparkles,
    Layers,
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
    {
        labelKey: 'backoffice.sidebar.content',
        fallback: 'Content',
        href: '/backoffice/content',
        icon: Layers,
    },
    {
        labelKey: 'backoffice.sidebar.visitor_logs',
        fallback: 'Visitor Logs',
        href: '/backoffice/visitor-logs',
        icon: Globe,
    },
];

export default function Sidebar() {
    const { t } = useLanguage();
    const { auth, notifications = [] } = usePage().props;
    const user = auth?.user;
    const isAdmin = user?.role === 'admin';

    const [readNotifIds, setReadNotifIds] = useState([]);

    useEffect(() => {
        const loadReadIds = () => {
            const stored = JSON.parse(localStorage.getItem('fayyfir_admin_read_notifications') || '[]');
            setReadNotifIds(stored);
        };
        loadReadIds();
        window.addEventListener('admin-notifications-updated', loadReadIds);
        return () => window.removeEventListener('admin-notifications-updated', loadReadIds);
    }, []);

    const unreadNotifications = notifications.filter(n => !readNotifIds.includes(n.id));
    const hasUnreadOrders = unreadNotifications.some(n => n.type === 'order_status');
    const hasUnreadProducts = unreadNotifications.some(n => n.type === 'stock' || n.type === 'translation');

    const currentPath =
        typeof window !== 'undefined' ? window.location.pathname : '';

    const filteredMenuItems = isAdmin
        ? menuItems.filter(item => !['/backoffice/admin', '/backoffice/store-branches', '/backoffice/reports', '/backoffice/visitor-logs'].includes(item.href))
        : menuItems;

    return (
        <aside className="sticky top-0 flex flex-col h-screen max-h-screen px-4 py-6 overflow-y-auto text-white border-r border-blue-800 w-54 bg-gradient-to-b from-blue-950 via-blue-900 to-blue-800">
            <div className="px-3 pb-8">
                <img
                    src="/images/logo-footer.webp"
                    alt="Logo"
                    className="w-auto h-10 mt-4"
                />
            </div>

            <nav className="flex flex-col flex-1 gap-1">
                {filteredMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.checkActive
                        ? item.checkActive(currentPath)
                        : currentPath === item.href ||
                          currentPath.startsWith(item.href + '/');

                    const isOrdersMenu = item.href === '/backoffice/orders';
                    const isProductsMenu = item.href === '/backoffice/product-management';
                    const hasDot = (isOrdersMenu && hasUnreadOrders) || (isProductsMenu && hasUnreadProducts);

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
                            <span className="flex-1 flex items-center justify-between gap-2">
                                <span>{t(item.labelKey, item.fallback)}</span>
                                {hasDot && (
                                    <span className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-sm shadow-amber-400/50" />
                                )}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
