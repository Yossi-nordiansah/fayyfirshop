import { Link, usePage, router } from '@inertiajs/react';
import { Bell, ChevronDown, Globe, LogOut, User, Package, Languages, ShoppingBag } from 'lucide-react';
import { useLanguage } from '@/Contexts/LanguageContext';
import { useState, useEffect } from 'react';
import AuthStatusModal from '@/Components/AuthStatusModal';
import LogoutConfirmModal from '@/Components/LogoutConfirmModal';

const translateNotification = (notif, locale, t) => {
    if (notif.type === 'stock') {
        const matchPbs = notif.message.match(/Stok produk "(.+)" di cabang (.+) menipis \((\d+) Pcs\)\./);
        if (matchPbs) {
            const [, name, branch, stock] = matchPbs;
            return {
                title: t('notifications.type.stock_low', 'Stok Menipis'),
                message: t('notifications.message.stock_low_branch', 'Stok produk "{name}" di cabang {branch} menipis ({stock} Pcs).')
                    .replace('{name}', name)
                    .replace('{branch}', branch)
                    .replace('{stock}', stock)
            };
        }

        const matchPvbs = notif.message.match(/Stok varian "(.+)" dari produk "(.+)" di cabang (.+) menipis \((\d+) Pcs\)\./);
        if (matchPvbs) {
            const [, variant, product, branch, stock] = matchPvbs;
            return {
                title: t('notifications.type.stock_low', 'Stok Menipis'),
                message: t('notifications.message.stock_low_variant_branch', 'Stok varian "{variant}" dari produk "{product}" di cabang {branch} menipis ({stock} Pcs).')
                    .replace('{variant}', variant)
                    .replace('{product}', product)
                    .replace('{branch}', branch)
                    .replace('{stock}', stock)
            };
        }

        const match = notif.message.match(/Stok produk "(.+)" menipis \((\d+) Pcs\)\./);
        if (match) {
            const [, name, stock] = match;
            return {
                title: t('notifications.type.stock', 'Stok Menipis (<10)'),
                message: t('notifications.message.stock', 'Stok produk "{name}" menipis ({stock} Pcs).')
                    .replace('{name}', name)
                    .replace('{stock}', stock)
            };
        }
    } else if (notif.type === 'translation') {
        const match = notif.message.match(/Produk "(.+)" belum memiliki bahasa: (.+)\./);
        if (match) {
            const [, name, langsStr] = match;
            const mapLangs = (str, targetLocale) => {
                const parts = str.split(', ').map(p => p.trim().toLowerCase());
                const mapped = parts.map(p => {
                    if (p === 'indonesia') {
                        if (targetLocale === 'english') return 'Indonesia';
                        if (targetLocale === 'arabic') return 'الإندونيسية';
                        return 'Indonesia';
                    }
                    if (p === 'english' || p === 'inggris') {
                        if (targetLocale === 'english') return 'English';
                        if (targetLocale === 'arabic') return 'الإنجليزية';
                        return 'Inggris';
                    }
                    if (p === 'arabic' || p === 'arab') {
                        if (targetLocale === 'english') return 'Arabic';
                        if (targetLocale === 'arabic') return 'العربية';
                        return 'Arab';
                    }
                    return p;
                });
                if (targetLocale === 'arabic') {
                    return mapped.join('، ');
                }
                return mapped.join(', ');
            };

            const translatedLangs = mapLangs(langsStr, locale);
            return {
                title: t('notifications.type.translation', 'Translasi Belum Lengkap'),
                message: t('notifications.message.translation', 'Produk "{name}" belum memiliki bahasa: {langsStr}.')
                    .replace('{name}', name)
                    .replace('{langsStr}', translatedLangs)
            };
        }
    } else if (notif.type === 'order_status') {
        const translatedStatus = t(`notifications.order.status.${notif.status}`, notif.status);
        return {
            title: t('notifications.type.order_status', 'Status Pesanan Berubah'),
            message: t('notifications.message.order_status', 'Pesanan {invoice} kini berstatus {status}.')
                .replace('{invoice}', notif.invoice_number)
                .replace('{status}', translatedStatus)
        };
    }
    return { title: notif.title, message: notif.message };
};

const getHeaderSubtitle = (count, locale) => {
    if (locale === 'english') {
        return count > 0 ? `You have ${count} new notifications` : 'All system operations are running smoothly.';
    }
    if (locale === 'arabic') {
        return count > 0 ? `لديك ${count} إشعارات جديدة` : 'جميع عمليات النظام تعمل بسلاسة.';
    }
    return count > 0 ? `Anda memiliki ${count} pemberitahuan baru` : 'Semua operasional sistem berjalan dengan lancar.';
};


export default function Navbar() {
    const { auth, notifications = [] } = usePage().props;
    const { locale, setLocale, t } = useLanguage();
    const user = auth?.user;
    const [showAccountDropdown, setShowAccountDropdown] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

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

    const handleMarkAsRead = (id) => {
        const stored = JSON.parse(localStorage.getItem('fayyfir_admin_read_notifications') || '[]');
        if (!stored.includes(id)) {
            stored.push(id);
            localStorage.setItem('fayyfir_admin_read_notifications', JSON.stringify(stored));
            window.dispatchEvent(new Event('admin-notifications-updated'));
        }
    };

    const handleMarkAllAsRead = () => {
        const stored = JSON.parse(localStorage.getItem('fayyfir_admin_read_notifications') || '[]');
        notifications.forEach(n => {
            if (!stored.includes(n.id)) {
                stored.push(n.id);
            }
        });
        localStorage.setItem('fayyfir_admin_read_notifications', JSON.stringify(stored));
        window.dispatchEvent(new Event('admin-notifications-updated'));
    };

    useEffect(() => {
        let timeoutId;
        const INACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours in ms

        const resetTimer = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(logoutUser, INACTIVITY_TIMEOUT);
        };

        const logoutUser = () => {
            router.post(route('logout'));
        };

        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        events.forEach((event) => {
            window.addEventListener(event, resetTimer);
        });

        resetTimer();

        return () => {
            clearTimeout(timeoutId);
            events.forEach((event) => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, []);

    const avatarSrc = user?.avatar
        ? user.avatar.startsWith('http') || user.avatar.startsWith('/')
            ? user.avatar
            : `/storage/${user.avatar}`
        : '/images/default-profile.png';

    const languages = [
        { code: 'indonesia', label: 'Indonesia', flag: 'ID' },
        { code: 'english', label: 'English', flag: 'EN' },
        { code: 'arabic', label: 'العربية', flag: 'AR' },
    ];

    const activeLanguage =
        languages.find((language) => language.code === locale) ?? languages[0];

    return (
        <>
        <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-6 bg-white/95 backdrop-blur-md border-b shadow-sm border-blue-900/10">
            <div>
                <p className="text-sm font-medium text-blue-600">
                    {t('backoffice.navbar.section', 'Backoffice')}
                </p>
                <h2 className="text-2xl font-bold tracking-normal text-blue-950">
                    {user?.name || t('backoffice.navbar.title', 'Dashboard Admin')}
                </h2>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative py-2 group">
                    <button
                        type="button"
                        className="flex items-center gap-2 px-3 text-sm font-semibold text-blue-700 transition border border-blue-100 rounded-lg h-11 hover:bg-blue-50"
                        aria-label={t('backoffice.navbar.aria.change_language', 'Change language')}
                    >
                        <Globe className="w-5 h-5" aria-hidden="true" />
                        <span>{activeLanguage.label}</span>
                        <ChevronDown
                            className="w-4 h-4 transition group-hover:rotate-180"
                            aria-hidden="true"
                        />
                    </button>

                    <div className="absolute right-0 z-50 invisible pt-3 transition opacity-0 top-full group-hover:visible group-hover:opacity-100">
                        <div className="w-40 overflow-hidden bg-white border border-blue-100 rounded-lg shadow-xl shadow-blue-950/10">
                            {languages.map((language) => (
                                <button
                                    key={language.code}
                                    type="button"
                                    onClick={() => setLocale(language.code)}
                                    className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition ${locale === language.code
                                        ? 'bg-blue-50 font-bold text-blue-700'
                                        : 'text-blue-950 hover:bg-blue-50'
                                        }`}
                                >
                                    <span>{language.label}</span>
                                    <span className="text-xs font-bold text-blue-400">
                                        {language.flag}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div
                    className="relative py-2"
                    onMouseEnter={() => setShowNotificationDropdown(true)}
                    onMouseLeave={() => setShowNotificationDropdown(false)}
                >
                    <button
                        type="button"
                        onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                        className="relative inline-flex items-center justify-center text-blue-700 transition border border-blue-100 rounded-lg h-11 w-11 hover:bg-blue-50"
                        aria-label={t('backoffice.navbar.aria.notifications', 'Notifications')}
                    >
                        <Bell className="w-5 h-5" aria-hidden="true" />
                        {unreadNotifications.length > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                                {unreadNotifications.length}
                            </span>
                        )}
                    </button>

                    {showNotificationDropdown && (
                        <div className="absolute right-0 z-[120] w-96 pt-4 top-full">
                            <div className="overflow-hidden bg-white border border-blue-900/10 rounded-2xl shadow-2xl shadow-blue-950/10">
                                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-blue-950">
                                            {t('notifications.title', 'Notifications')}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {getHeaderSubtitle(unreadNotifications.length, locale)}
                                        </p>
                                    </div>
                                    {unreadNotifications.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={handleMarkAllAsRead}
                                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
                                        >
                                            {t('notifications.mark_read', 'Tandai semua dibaca')}
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
                                    {unreadNotifications.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 text-slate-400 mb-3 border border-slate-100">
                                                <Bell className="w-5 h-5" aria-hidden="true" />
                                            </div>
                                            <p className="text-sm font-semibold text-slate-700">
                                                {t('notifications.empty', 'Tidak ada notifikasi baru')}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                                                {locale === 'english'
                                                    ? 'All system operations are running smoothly.'
                                                    : locale === 'arabic'
                                                        ? 'جميع عمليات النظام تعمل بسلاسة.'
                                                        : 'Semua operasional sistem berjalan dengan lancar.'}
                                            </p>
                                        </div>
                                    ) : (
                                        unreadNotifications.map((notif) => {
                                            const { title, message } = translateNotification(notif, locale, t);
                                            const isStock = notif.type === 'stock';
                                            const isOrderStatus = notif.type === 'order_status';
                                            return (
                                                <Link
                                                    key={notif.id}
                                                    href={notif.link}
                                                    className="flex gap-3 px-5 py-4 hover:bg-slate-50/70 transition-colors duration-200 text-left"
                                                    onClick={() => {
                                                        handleMarkAsRead(notif.id);
                                                        setShowNotificationDropdown(false);
                                                    }}
                                                >
                                                    <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl border ${
                                                            isStock
                                                                ? 'bg-amber-50 text-amber-600 border-amber-100'
                                                                : isOrderStatus
                                                                    ? 'bg-blue-50 text-blue-600 border-blue-100'
                                                                    : 'bg-rose-50 text-rose-600 border-rose-100'
                                                        }`}>
                                                        {isStock ? (
                                                            <Package className="w-5 h-5" aria-hidden="true" />
                                                        ) : isOrderStatus ? (
                                                            <ShoppingBag className="w-5 h-5" aria-hidden="true" />
                                                        ) : (
                                                            <Languages className="w-5 h-5" aria-hidden="true" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <p className="text-xs font-bold text-slate-900 truncate">
                                                                {title}
                                                            </p>
                                                            <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                                                                    isStock
                                                                        ? 'bg-amber-500'
                                                                        : isOrderStatus
                                                                            ? 'bg-blue-500'
                                                                            : 'bg-rose-500'
                                                                }`} />
                                                        </div>
                                                        <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">
                                                            {message}
                                                        </p>
                                                    </div>
                                                </Link>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div
                    className="relative py-2"
                    onMouseEnter={() => setShowAccountDropdown(true)}
                    onMouseLeave={() => setShowAccountDropdown(false)}
                >
                    <button
                        type="button"
                        className="relative inline-flex items-center justify-center text-white transition rounded-lg h-11 w-11 bg-blue-950 hover:bg-blue-800"
                        aria-label={t('backoffice.navbar.aria.account', 'Account')}
                    >
                        {user ? (
                            <img
                                src={avatarSrc}
                                alt={user.name}
                                className="object-cover w-8 h-8 border rounded-full border-white/20"
                            />
                        ) : (
                            <User className="w-5 h-5" aria-hidden="true" />
                        )}
                    </button>

                    {showAccountDropdown && user && (
                        <div className="absolute right-0 z-[120] w-52 pt-4 top-full">
                            <div className="overflow-hidden bg-white border rounded-xl shadow-2xl border-zinc-100">
                                <div className="px-4 py-3 border-b border-zinc-100">
                                    <p className="text-sm font-semibold truncate text-zinc-800">
                                        {user.name}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowAccountDropdown(false);
                                        setShowLogoutConfirm(true);
                                    }}
                                    className="flex items-center w-full gap-3 px-4 py-3 text-sm text-left text-red-600 transition-all duration-200 hover:bg-red-50"
                                >
                                    <LogOut className="w-4 h-4" />
                                    {t('nav.account.logout', 'Sign Out')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
        <AuthStatusModal />
        <LogoutConfirmModal
            isOpen={showLogoutConfirm}
            onClose={() => setShowLogoutConfirm(false)}
            t={t}
            isAdmin={true}
        />
        </>
    );
}
