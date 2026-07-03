import { Head, useForm } from '@inertiajs/react';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import AuthStatusModal from '@/Components/AuthStatusModal';
import { useLanguage } from '@/Contexts/LanguageContext';
import { motion } from 'framer-motion';

export default function Login({ status }) {
    const { t } = useLanguage();
    const [showPassword, setShowPassword] = useState(false);
    const [showFailureModal, setShowFailureModal] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: true,
    });

    const submit = (event) => {
        event.preventDefault();

        post(route('backoffice.login.store'), {
            onFinish: () => reset('password'),
            onError: () => {
                setShowFailureModal(true);
            }
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-4 py-10 flex items-center justify-center relative overflow-hidden">
            {/* Ambient Premium Glow Decoration */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

            <Head title={t('backoffice.login.tab_title', 'Backoffice Login')} />

            <AuthStatusModal
                isOpen={showFailureModal}
                onClose={() => setShowFailureModal(false)}
                type="error"
                isAdmin={true}
                title={t('auth.status.login_fail_title', 'Login Gagal')}
                message={t('auth.status.login_fail_message', 'Email atau password salah. Silakan periksa kembali detail login Anda.')}
            />

            <AuthStatusModal />

            <div className="w-full max-w-md relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl p-8 shadow-2xl shadow-black/50"
                >
                    <div className="mb-8 text-center">
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.6 }}
                            transition={{ delay: 0.2 }}
                            className="text-xs font-bold uppercase tracking-[0.24em] text-amber-400"
                        >
                            {t('backoffice.login.top_tag', 'Backoffice')}
                        </motion.p>
                        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white bg-gradient-to-r from-white via-slate-200 to-amber-200 bg-clip-text text-transparent">
                            {t('backoffice.login.title', 'Dashboard Admin')}
                        </h1>
                        <p className="mt-2 text-sm text-slate-400">
                            {t('backoffice.login.subtitle', 'Sign in untuk mengakses panel administrasi.')}
                        </p>
                    </div>

                    {status && (
                        <div className="mb-5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm font-medium text-emerald-400">
                            {status}
                        </div>
                    )}

                    <form className="space-y-5" onSubmit={submit}>
                        <div>
                            <label
                                htmlFor="email"
                                className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-300"
                            >
                                {t('backoffice.login.label_email', 'Email')}
                            </label>
                            <div className="relative">
                                <Mail
                                    className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 transition-colors"
                                    aria-hidden="true"
                                />
                                <input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(event) =>
                                        setData('email', event.target.value)
                                    }
                                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-sm text-white outline-none transition focus:border-amber-500 focus:bg-slate-900/60 focus:ring-2 focus:ring-amber-500/10"
                                    autoComplete="username"
                                    autoFocus
                                    required
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-2 text-xs font-medium text-red-400">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-300"
                            >
                                {t('backoffice.login.label_password', 'Password')}
                            </label>
                            <div className="relative">
                                <Lock
                                    className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 transition-colors"
                                    aria-hidden="true"
                                />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={data.password}
                                    onChange={(event) =>
                                        setData('password', event.target.value)
                                    }
                                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-12 text-sm text-white outline-none transition focus:border-amber-500 focus:bg-slate-900/60 focus:ring-2 focus:ring-amber-500/10"
                                    autoComplete="current-password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((value) => !value)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
                                    aria-label={
                                        showPassword
                                            ? t('backoffice.login.hide_password', 'Hide password')
                                            : t('backoffice.login.show_password', 'Show password')
                                    }
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-2 text-xs font-medium text-red-400">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <label className="flex items-center gap-3 text-sm font-medium text-slate-300 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={data.remember}
                                onChange={(event) =>
                                    setData('remember', event.target.checked)
                                }
                                className="rounded border-white/10 bg-white/5 text-amber-500 focus:ring-amber-500/20 focus:ring-offset-slate-900"
                            />
                            {t('backoffice.login.remember_me', 'Remember me')}
                        </label>

                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            type="submit"
                            disabled={processing}
                            className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-sm font-bold uppercase tracking-widest text-slate-950 transition hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {t('backoffice.login.btn_submit', 'Sign In')}
                        </motion.button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}