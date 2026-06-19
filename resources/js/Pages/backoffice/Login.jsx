import { Head, useForm } from '@inertiajs/react';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import AuthStatusModal from '@/Components/AuthStatusModal';
import { useLanguage } from '@/Contexts/LanguageContext';

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
        <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700 px-4 py-10">
            <Head title="Backoffice Login" />

            <AuthStatusModal
                isOpen={showFailureModal}
                onClose={() => setShowFailureModal(false)}
                type="error"
                isAdmin={true}
                title={t('auth.status.login_fail_title', 'Login Gagal')}
                message={t('auth.status.login_fail_message', 'Email atau password salah. Silakan periksa kembali detail login Anda.')}
            />

            {/* This will automatically pick up flash.logout_status and show the logout success modal */}
            <AuthStatusModal />

            <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
                <div className="w-full max-w-md rounded-lg border border-white/15 bg-white p-8 shadow-2xl shadow-blue-950/30">
                    <div className="mb-8 text-center">
                        <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-600">
                            Backoffice
                        </p>
                        <h1 className="mt-3 text-3xl font-bold tracking-normal text-blue-950">
                            Dashboard Admin Indonesia
                        </h1>
                        <p className="mt-2 text-sm text-blue-700/70">
                            Sign in untuk mengakses panel administrasi.
                        </p>
                    </div>

                    {status && (
                        <div className="mb-5 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                            {status}
                        </div>
                    )}

                    <form className="space-y-5" onSubmit={submit}>
                        <div>
                            <label
                                htmlFor="email"
                                className="mb-2 block text-xs font-bold uppercase tracking-wider text-blue-950"
                            >
                                Email
                            </label>
                            <div className="relative">
                                <Mail
                                    className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-blue-500"
                                    aria-hidden="true"
                                />
                                <input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(event) =>
                                        setData('email', event.target.value)
                                    }
                                    className="w-full rounded-lg border border-blue-100 bg-blue-50/60 py-3 pl-12 pr-4 text-sm text-blue-950 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                                    autoComplete="username"
                                    autoFocus
                                    required
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-2 text-xs font-medium text-red-600">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="mb-2 block text-xs font-bold uppercase tracking-wider text-blue-950"
                            >
                                Password
                            </label>
                            <div className="relative">
                                <Lock
                                    className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-blue-500"
                                    aria-hidden="true"
                                />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={data.password}
                                    onChange={(event) =>
                                        setData('password', event.target.value)
                                    }
                                    className="w-full rounded-lg border border-blue-100 bg-blue-50/60 py-3 pl-12 pr-12 text-sm text-blue-950 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                                    autoComplete="current-password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((value) => !value)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 transition hover:text-blue-800"
                                    aria-label={
                                        showPassword
                                            ? 'Hide password'
                                            : 'Show password'
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
                                <p className="mt-2 text-xs font-medium text-red-600">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <label className="flex items-center gap-3 text-sm font-medium text-blue-900">
                            <input
                                type="checkbox"
                                checked={data.remember}
                                onChange={(event) =>
                                    setData('remember', event.target.checked)
                                }
                                className="rounded border-blue-200 text-blue-700 focus:ring-blue-500"
                            />
                            Remember me
                        </label>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full rounded-lg bg-blue-950 px-4 py-3 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Sign In
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
