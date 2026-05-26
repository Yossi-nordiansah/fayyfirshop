// import { usePage } from '@inertiajs/react';
// import { Bell, ChevronDown, Globe, User } from 'lucide-react';
// import { useLanguage } from '@/Contexts/LanguageContext';

// export default function Navbar() {
//     const { auth } = usePage().props;
//     const { locale, setLocale } = useLanguage();
//     const user = auth?.user;
//     const avatarSrc = user?.avatar
//         ? user.avatar.startsWith('http') || user.avatar.startsWith('/')
//             ? user.avatar
//             : `/storage/${user.avatar}`
//         : '/images/default-profile.png';
//     const languages = [
//         { code: 'indonesia', label: 'Indonesia', flag: 'ID' },
//         { code: 'english', label: 'English', flag: 'EN' },
//         { code: 'arabic', label: 'Arabic', flag: 'AR' },
//     ];
//     const activeLanguage =
//         languages.find((language) => language.code === locale) ?? languages[0];

//     return (
//         <header className="flex items-center justify-between h-20 px-6 bg-white border-b shadow-sm border-blue-900/10">
//             <div>
//                 <p className="text-sm font-medium text-blue-600">
//                     Backoffice
//                 </p>
//                 <h2 className="text-2xl font-bold tracking-normal text-blue-950">
//                     Dashboard Admin Indonesia
//                 </h2>
//             </div>

//             <div className="flex items-center gap-3">
//                 <div className="relative py-2 group">
//                     <button
//                         type="button"
//                         className="flex items-center gap-2 px-3 text-sm font-semibold text-blue-700 transition border border-blue-100 rounded-lg h-11 hover:bg-blue-50"
//                         aria-label="Change language"
//                     >
//                         <Globe className="w-5 h-5" aria-hidden="true" />
//                         <span>{activeLanguage.label}</span>
//                         <ChevronDown
//                             className="w-4 h-4 transition group-hover:rotate-180"
//                             aria-hidden="true"
//                         />
//                     </button>

//                     <div className="absolute right-0 z-50 invisible pt-3 transition opacity-0 top-full group-hover:visible group-hover:opacity-100">
//                         <div className="w-40 overflow-hidden bg-white border border-blue-100 rounded-lg shadow-xl shadow-blue-950/10">
//                             {languages.map((language) => (
//                                 <button
//                                     key={language.code}
//                                     type="button"
//                                     onClick={() => setLocale(language.code)}
//                                     className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition ${
//                                         locale === language.code
//                                             ? 'bg-blue-50 font-bold text-blue-700'
//                                             : 'text-blue-950 hover:bg-blue-50'
//                                     }`}
//                                 >
//                                     <span>{language.label}</span>
//                                     <span className="text-xs font-bold text-blue-400">
//                                         {language.flag}
//                                     </span>
//                                 </button>
//                             ))}
//                         </div>
//                     </div>
//                 </div>

//                 <button
//                     type="button"
//                     className="inline-flex items-center justify-center text-blue-700 transition border border-blue-100 rounded-lg h-11 w-11 hover:bg-blue-50"
//                     aria-label="Notifications"
//                 >
//                     <Bell className="w-5 h-5" aria-hidden="true" />
//                 </button>
//                 <button
//                     type="button"
//                     className="relative inline-flex items-center justify-center text-white transition rounded-lg h-11 w-11 bg-blue-950 hover:bg-blue-800"
//                     aria-label="Account"
//                 >
//                     {user ? (
//                         <img
//                             src={avatarSrc}
//                             alt={user.name}
//                             className="object-cover w-8 h-8 border rounded-full border-white/20"
//                         />
//                     ) : (
//                         <User className="w-5 h-5" aria-hidden="true" />
//                     )}
//                 </button>
//             </div>
//         </header>
//     );
// }

import { Link, usePage } from '@inertiajs/react';
import { Bell, ChevronDown, Globe, LogOut, User } from 'lucide-react';
import { useLanguage } from '@/Contexts/LanguageContext';
import { useState } from 'react';

export default function Navbar() {
    const { auth } = usePage().props;
    const { locale, setLocale, t } = useLanguage();
    const user = auth?.user;
    const [showAccountDropdown, setShowAccountDropdown] = useState(false);

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
        <header className="flex items-center justify-between h-20 px-6 bg-white border-b shadow-sm border-blue-900/10">
            <div>
                <p className="text-sm font-medium text-blue-600">
                    {t('backoffice.navbar.section', 'Backoffice')}
                </p>
                <h2 className="text-2xl font-bold tracking-normal text-blue-950">
                    {t('backoffice.navbar.title', 'Dashboard Admin')}
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

                <button
                    type="button"
                    className="inline-flex items-center justify-center text-blue-700 transition border border-blue-100 rounded-lg h-11 w-11 hover:bg-blue-50"
                    aria-label={t('backoffice.navbar.aria.notifications', 'Notifications')}
                >
                    <Bell className="w-5 h-5" aria-hidden="true" />
                </button>

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
                                <Link
                                    href="/logout"
                                    method="post"
                                    as="button"
                                    className="flex items-center w-full gap-3 px-4 py-3 text-sm text-left text-red-600 transition-all duration-200 hover:bg-red-50"
                                >
                                    <LogOut className="w-4 h-4" />
                                    {t('nav.account.logout', 'Sign Out')}
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
