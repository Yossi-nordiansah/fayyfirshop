import { usePage } from '@inertiajs/react';
import { Bell, ChevronDown, Globe, User } from 'lucide-react';
import { useLanguage } from '@/Contexts/LanguageContext';

export default function Navbar() {
    const { auth } = usePage().props;
    const { locale, setLocale } = useLanguage();
    const user = auth?.user;
    const avatarSrc = user?.avatar
        ? user.avatar.startsWith('http') || user.avatar.startsWith('/')
            ? user.avatar
            : `/storage/${user.avatar}`
        : '/images/default-profile.png';
    const languages = [
        { code: 'indonesia', label: 'Indonesia', flag: 'ID' },
        { code: 'english', label: 'English', flag: 'EN' },
        { code: 'arabic', label: 'Arabic', flag: 'AR' },
    ];
    const activeLanguage =
        languages.find((language) => language.code === locale) ?? languages[0];

    return (
        <header className="flex h-20 items-center justify-between border-b border-blue-900/10 bg-white px-6 shadow-sm">
            <div>
                <p className="text-sm font-medium text-blue-600">
                    Backoffice
                </p>
                <h2 className="text-2xl font-bold tracking-normal text-blue-950">
                    Dashboard Admin Indonesia
                </h2>
            </div>

            <div className="flex items-center gap-3">
                <div className="group relative py-2">
                    <button
                        type="button"
                        className="flex h-11 items-center gap-2 rounded-lg border border-blue-100 px-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                        aria-label="Change language"
                    >
                        <Globe className="h-5 w-5" aria-hidden="true" />
                        <span>{activeLanguage.label}</span>
                        <ChevronDown
                            className="h-4 w-4 transition group-hover:rotate-180"
                            aria-hidden="true"
                        />
                    </button>

                    <div className="invisible absolute right-0 top-full z-50 pt-3 opacity-0 transition group-hover:visible group-hover:opacity-100">
                        <div className="w-40 overflow-hidden rounded-lg border border-blue-100 bg-white shadow-xl shadow-blue-950/10">
                            {languages.map((language) => (
                                <button
                                    key={language.code}
                                    type="button"
                                    onClick={() => setLocale(language.code)}
                                    className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition ${
                                        locale === language.code
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
                    className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-blue-100 text-blue-700 transition hover:bg-blue-50"
                    aria-label="Notifications"
                >
                    <Bell className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                    type="button"
                    className="relative inline-flex h-11 w-11 items-center justify-center rounded-lg bg-blue-950 text-white transition hover:bg-blue-800"
                    aria-label="Account"
                >
                    {user ? (
                        <img
                            src={avatarSrc}
                            alt={user.name}
                            className="h-8 w-8 rounded-full border border-white/20 object-cover"
                        />
                    ) : (
                        <User className="h-5 w-5" aria-hidden="true" />
                    )}
                </button>
            </div>
        </header>
    );
}
