import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import AuthStatusModal from '@/Components/AuthStatusModal';
import { useLanguage } from '@/Contexts/LanguageContext';

export default function Login({ status, canResetPassword }) {
    const { t } = useLanguage();
    const [showFailureModal, setShowFailureModal] = useState(false);
    
    // Auth method state: 'password' | 'whatsapp'
    const [loginMethod, setLoginMethod] = useState('password');
    
    // WhatsApp states
    const [waPhone, setWaPhone] = useState('');
    const [countryCode, setCountryCode] = useState('62');
    const [waOtp, setWaOtp] = useState('');
    const [waStep, setWaStep] = useState(1); // 1: input phone, 2: input OTP
    const [waLoading, setWaLoading] = useState(false);
    const [waError, setWaError] = useState('');
    const [maskedPhone, setMaskedPhone] = useState('');
    const [countdown, setCountdown] = useState(0);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
        redirect: typeof window !== 'undefined' ? (document.referrer && !document.referrer.includes('/login') ? document.referrer : '') : '',
    });

    // Countdown effect for resending OTP
    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
            onError: () => {
                setShowFailureModal(true);
            }
        });
    };

    const handleRequestOtp = (e) => {
        if (e) e.preventDefault();
        if (!waPhone) {
            setWaError(t('auth.whatsapp.phone_required', 'Nomor WhatsApp wajib diisi.'));
            return;
        }
        setWaLoading(true);
        setWaError('');

        const fullPhone = countryCode + waPhone;

        window.axios.post(route('auth.whatsapp.request-otp'), {
            phone: fullPhone
        })
        .then((response) => {
            setWaLoading(false);
            setMaskedPhone(response.data.phone);
            setWaStep(2);
            setCountdown(60);
        })
        .catch((error) => {
            setWaLoading(false);
            if (error.response && error.response.data && error.response.data.message) {
                setWaError(error.response.data.message);
            } else {
                setWaError(t('auth.whatsapp.request_failed', 'Gagal mengirim kode OTP. Pastikan nomor WhatsApp Anda aktif dan coba lagi.'));
            }
        });
    };

    const handleVerifyOtp = (e) => {
        if (e) e.preventDefault();
        if (!waOtp || waOtp.length !== 6) {
            setWaError(t('auth.whatsapp.otp_required', 'Kode OTP harus 6 digit.'));
            return;
        }
        setWaLoading(true);
        setWaError('');

        const fullPhone = countryCode + waPhone;

        window.axios.post(route('auth.whatsapp.verify-otp'), {
            phone: fullPhone,
            otp: waOtp,
            redirect: typeof window !== 'undefined' ? (document.referrer && !document.referrer.includes('/login') ? document.referrer : '') : '',
        })
        .then((response) => {
            setWaLoading(false);
            window.location.href = response.data.redirect;
        })
        .catch((error) => {
            setWaLoading(false);
            if (error.response && error.response.data && error.response.data.message) {
                setWaError(error.response.data.message);
            } else {
                setWaError(t('auth.whatsapp.verify_failed', 'Verifikasi OTP gagal. Silakan coba lagi.'));
            }
        });
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            <AuthStatusModal
                isOpen={showFailureModal}
                onClose={() => setShowFailureModal(false)}
                type="error"
                title={t('auth.status.login_fail_title', 'Login Gagal')}
                message={t('auth.status.login_fail_message', 'Email atau password salah. Silakan periksa kembali detail login Anda.')}
            />

            {status && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            {loginMethod === 'password' ? (
                <>
                    {/* Google & WhatsApp Login Buttons */}
                    <div className="mb-6 space-y-3">
                        <a
                            href={route('auth.google', { redirect: typeof window !== 'undefined' ? (document.referrer && !document.referrer.includes('/login') ? document.referrer : window.location.href) : '' })}
                            className="flex items-center justify-center gap-3 w-full px-6 py-3 text-xs font-bold tracking-widest text-slate-700 uppercase transition-all duration-300 shadow-sm border border-slate-200 hover:bg-slate-50 rounded-xl hover:shadow active:scale-95 bg-white"
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                            </svg>
                            {t('auth.login_with_google', 'Masuk dengan Google')}
                        </a>

                        {/* <button
                            type="button"
                            onClick={() => {
                                setLoginMethod('whatsapp');
                                setWaError('');
                                setWaStep(1);
                            }}
                            className="flex items-center justify-center gap-3 w-full px-6 py-3 text-xs font-bold tracking-widest text-emerald-600 hover:text-white uppercase transition-all duration-300 shadow-sm border border-emerald-200 hover:bg-emerald-600 rounded-xl hover:shadow active:scale-95 bg-white"
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.456L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.97C16.53 2.01 14.09 1.02 11.999 1.02 6.562 1.02 2.137 5.39 2.134 10.82c0 1.693.456 3.344 1.321 4.793l-.974 3.559 3.68-.965zm12.35-7.399c-.3-.15-1.77-.875-2.04-.975-.27-.1-.47-.15-.67.15-.2.3-.77.975-.94 1.175-.17.2-.35.225-.65.075-.3-.15-1.265-.467-2.41-1.485-.89-.795-1.49-1.775-1.665-2.075-.175-.3-.02-.462.13-.611.135-.135.3-.35.45-.525.15-.175.2-.3.3-.5s.05-.375-.025-.525c-.075-.15-.67-1.625-.92-2.225-.24-.58-.485-.5-.67-.51-.175-.01-.375-.01-.575-.01-.2 0-.525.075-.8.375-.275.3-1.05 1.025-1.05 2.5s1.075 2.9 1.225 3.1c.15.2 2.11 3.224 5.11 4.522.714.308 1.272.492 1.707.63.717.228 1.37.195 1.887.118.575-.085 1.77-.725 2.02-1.425.25-.7.25-1.3 0-1.425-.075-.125-.275-.2-.575-.35z"/>
                            </svg>
                            {t('auth.login_with_whatsapp', 'Masuk dengan WhatsApp')}
                        </button> */}

                        <div className="flex items-center justify-center my-4">
                            <span className="h-px bg-slate-200 grow"></span>
                            <span className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('auth.or_divider', 'atau')}</span>
                            <span className="h-px bg-slate-200 grow"></span>
                        </div>
                    </div>

                    <form onSubmit={submit}>
                        <div>
                            <InputLabel htmlFor="email" value="Email" />

                            <TextInput
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="mt-1 block w-full"
                                autoComplete="username"
                                isFocused={true}
                                onChange={(e) => setData('email', e.target.value)}
                            />

                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        <div className="mt-4">
                            <InputLabel htmlFor="password" value="Password" />

                            <TextInput
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                className="mt-1 block w-full"
                                autoComplete="current-password"
                                onChange={(e) => setData('password', e.target.value)}
                            />

                            <InputError message={errors.password} className="mt-2" />
                        </div>

                        <div className="mt-4 block">
                            <label className="flex items-center">
                                <Checkbox
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) =>
                                        setData('remember', e.target.checked)
                                    }
                                />
                                <span className="ms-2 text-sm text-gray-600">
                                    Remember me
                                </span>
                            </label>
                        </div>

                        <div className="mt-4 flex items-center justify-end">
                            {canResetPassword && (
                                <Link
                                    href={route('password.request')}
                                    className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                >
                                    Forgot your password?
                                </Link>
                            )}

                            <PrimaryButton className="ms-4" disabled={processing}>
                                Log in
                            </PrimaryButton>
                        </div>
                    </form>
                </>
            ) : (
                <div className="transition-all duration-300">
                    <div className="mb-6 text-center">
                        <h2 className="text-lg font-bold text-slate-800">
                            {t('auth.whatsapp.title', 'Masuk via WhatsApp')}
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                            {t('auth.whatsapp.subtitle', 'Metode login cepat menggunakan kode verifikasi WhatsApp')}
                        </p>
                    </div>

                    {waStep === 1 ? (
                        <form onSubmit={handleRequestOtp}>
                            <div>
                                <InputLabel htmlFor="waPhone" value={t('auth.whatsapp.phone_label', 'Nomor WhatsApp')} />
                                <div className="flex gap-2 mt-1">
                                    <select
                                        value={countryCode}
                                        onChange={(e) => setCountryCode(e.target.value)}
                                        className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm bg-white text-sm"
                                    >
                                        <option value="62">🇮🇩 +62</option>
                                        <option value="60">🇲🇾 +60</option>
                                        <option value="65">🇸🇬 +65</option>
                                        <option value="61">🇦🇺 +61</option>
                                        <option value="1">🇺🇸 +1</option>
                                        <option value="44">🇬🇧 +44</option>
                                        <option value="966">🇸🇦 +966</option>
                                        <option value="81">🇯🇵 +81</option>
                                        <option value="82">🇰🇷 +82</option>
                                        <option value="86">🇨🇳 +86</option>
                                    </select>
                                    <TextInput
                                        id="waPhone"
                                        type="tel"
                                        name="waPhone"
                                        value={waPhone}
                                        className="block w-full grow"
                                        placeholder="8xxxxxxxx"
                                        isFocused={loginMethod === 'whatsapp' && waStep === 1}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            if (val.startsWith(countryCode)) {
                                                setWaPhone(val.substring(countryCode.length));
                                            } else if (val.startsWith('0')) {
                                                setWaPhone(val.substring(1));
                                            } else {
                                                setWaPhone(val);
                                            }
                                        }}
                                    />
                                </div>
                                {waError && <InputError message={waError} className="mt-2" />}
                            </div>

                            <div className="mt-6 flex flex-col gap-3">
                                <PrimaryButton className="w-full justify-center py-3 bg-emerald-600 hover:bg-emerald-700 focus:bg-emerald-700 focus:ring-emerald-500 active:bg-emerald-800" disabled={waLoading}>
                                    {waLoading ? t('auth.whatsapp.sending', 'Mengirim...') : t('auth.whatsapp.send_otp', 'Kirim Kode OTP')}
                                </PrimaryButton>
                                
                                <button
                                    type="button"
                                    onClick={() => {
                                        setLoginMethod('password');
                                        setWaError('');
                                    }}
                                    className="text-sm text-gray-600 underline hover:text-gray-900 text-center py-2"
                                >
                                    {t('auth.login_with_password', 'Masuk dengan Email & Password')}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp}>
                            <div className="text-center mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <p className="text-xs text-slate-500">
                                    {t('auth.whatsapp.otp_sent_to', 'Kode OTP telah dikirim ke WhatsApp')}
                                </p>
                                <p className="font-bold text-sm text-slate-800 mt-1">{maskedPhone}</p>
                            </div>

                            <div>
                                <InputLabel htmlFor="waOtp" value={t('auth.whatsapp.otp_label', 'Masukkan Kode OTP')} className="text-center" />
                                <TextInput
                                    id="waOtp"
                                    type="text"
                                    name="waOtp"
                                    value={waOtp}
                                    className="mt-2 block w-full text-center text-2xl tracking-[0.5em] font-mono font-bold"
                                    maxLength={6}
                                    placeholder="••••••"
                                    isFocused={loginMethod === 'whatsapp' && waStep === 2}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        setWaOtp(val);
                                    }}
                                />
                                {waError && <InputError message={waError} className="mt-2 text-center" />}
                            </div>

                            <div className="mt-6 flex flex-col gap-4">
                                <PrimaryButton className="w-full justify-center py-3 bg-emerald-600 hover:bg-emerald-700 focus:bg-emerald-700 focus:ring-emerald-500 active:bg-emerald-800" disabled={waLoading || waOtp.length !== 6}>
                                    {waLoading ? t('auth.whatsapp.verifying', 'Memverifikasi...') : t('auth.whatsapp.verify_otp', 'Verifikasi & Masuk')}
                                </PrimaryButton>

                                <div className="flex justify-between items-center text-xs px-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setWaStep(1);
                                            setWaOtp('');
                                            setWaError('');
                                        }}
                                        className="text-gray-500 hover:text-gray-800 underline"
                                    >
                                        {t('auth.whatsapp.change_phone', 'Ganti Nomor')}
                                    </button>

                                    {countdown > 0 ? (
                                        <span className="text-gray-400">
                                            {t('auth.whatsapp.resend_in', 'Kirim ulang dalam')} {countdown}s
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleResendOtp}
                                            className="text-emerald-600 hover:text-emerald-700 font-semibold underline"
                                        >
                                            {t('auth.whatsapp.resend_otp', 'Kirim Ulang Kode')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            )}
        </GuestLayout>
    );
}
