import React, { useState, useEffect } from "react";
import { Link, useForm } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, X } from "lucide-react";
import AuthStatusModal from "@/Components/AuthStatusModal";
import LoadingSpinner from "@/Components/LoadingSpinner";

const LoginModal = ({ isOpen, onClose, t }) => {
    const [showPassword, setShowPassword] = useState(false);
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

    // Inertia form handler untuk proses login balik ke Laravel
    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: true,
        redirect: typeof window !== "undefined" ? window.location.href : "",
    });

    // Countdown effect for resending OTP
    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    // Reset states when modal is closed
    useEffect(() => {
        if (!isOpen) {
            setLoginMethod('password');
            setWaPhone('');
            setCountryCode('62');
            setWaOtp('');
            setWaStep(1);
            setWaError('');
            setCountdown(0);
        }
    }, [isOpen]);

    const handleLoginSubmit = (e) => {
        e.preventDefault();
        post(route("login"), {
            onSuccess: () => {
                onClose();
                reset("password");
            },
            onError: () => {
                setShowFailureModal(true);
            }
        });
    };

    // Build a clean redirect URL — strip ?login=1 and error params so they
    // don't get stored as the intended destination after Google OAuth.
    const getCleanRedirectUrl = () => {
        if (typeof window === 'undefined') return '';
        try {
            const url = new URL(window.location.href);
            url.searchParams.delete('login');
            url.searchParams.delete('error');
            return url.toString();
        } catch {
            return window.location.href;
        }
    };

    // Navigate to Google OAuth using window.location.href instead of <a href>
    // so mobile browsers don't treat it as a popup and block the redirect.
    const handleGoogleLogin = () => {
        const cleanRedirect = getCleanRedirectUrl();
        window.location.href = route('auth.google', { redirect: cleanRedirect });
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
            redirect: typeof window !== "undefined" ? window.location.href : "",
        })
        .then((response) => {
            setWaLoading(false);
            onClose();
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

    const handleResendOtp = () => {
        handleRequestOtp();
    };

    return (
        <>
            <AuthStatusModal
                isOpen={showFailureModal}
                onClose={() => setShowFailureModal(false)}
                type="error"
                title={t("auth.status.login_fail_title", "Login Gagal")}
                message={t("auth.status.login_fail_message", "Email atau password salah. Silakan periksa kembali detail login Anda.")}
            />

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="absolute inset-0 bg-zinc-950/10 backdrop-blur-sm"
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", duration: 0.5 }}
                            className="relative w-full max-w-md bg-slate-100 border border-white/10 rounded-2xl shadow-2xl p-8 overflow-hidden backdrop-blur-lg"
                        >
                            {/* Full-screen loading overlay */}
                            {processing && (
                                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/45 backdrop-blur-[3px]">
                                    <div className="flex flex-col items-center gap-4 rounded-2xl bg-white/90 p-8 shadow-2xl border border-white/20">
                                        <LoadingSpinner className="w-16 h-16 animate-pulse" />
                                        <span className="text-sm font-semibold tracking-wide text-slate-700 animate-pulse">{t('processing', 'Processing...')}</span>
                                    </div>
                                </div>
                            )}
                            <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
                            >
                                <X size={20} className="text-red-500" />
                            </button>

                            <div className="text-center mb-6">
                                <h3 className="text-2xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600 mb-2">
                                    {t("auth.modal.title", "Welcome Back")}
                                </h3>
                                <p className="text-xs text-zinc-800">
                                    {t("auth.modal.subtitle", "Please sign in to your Fayyfir account")}
                                </p>
                            </div>

                            {loginMethod === 'password' ? (
                                <>
                                    {/* Google Sign In */}
                                    <div className="mb-4 space-y-2">
                                        {/* Google Sign In — button + window.location.href to avoid mobile popup blocking */}
                                        <button
                                            type="button"
                                            onClick={handleGoogleLogin}
                                            className="flex items-center justify-center gap-3 w-full px-6 py-3 text-xs font-bold tracking-widest text-slate-700 uppercase transition-all duration-300 shadow-sm border border-slate-200 hover:bg-slate-50 rounded-xl hover:shadow active:scale-95 bg-white"
                                        >
                                            <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                                            </svg>
                                            {t("auth.modal.btnGoogle", "Sign in with Google")}
                                        </button>

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
                                            {t("auth.login_with_whatsapp", "Sign in with WhatsApp")}
                                        </button> */}

                                        <div className="flex items-center justify-center my-4">
                                            <span className="h-px bg-slate-200 grow"></span>
                                            <span className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{t("auth.modal.or_divider", "or")}</span>
                                            <span className="h-px bg-slate-200 grow"></span>
                                        </div>
                                    </div>

                                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-medium tracking-wider text-zinc-800 uppercase mb-2">
                                                {t("auth.modal.email", "Email Address")}
                                            </label>
                                            <div className="relative">
                                                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-800" />
                                                <input
                                                    type="email"
                                                    value={data.email}
                                                    onChange={(e) => setData("email", e.target.value)}
                                                    placeholder={t("auth.modal.placeholder.email", "Enter your email")}
                                                    className="w-full border rounded-xl pl-12 pr-4 py-3 text-sm placeholder-zinc-600 outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30 transition-all"
                                                    required
                                                />
                                            </div>
                                            {errors.email && (
                                                <p className="text-red-400 text-xs mt-1">{errors.email}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium tracking-wider text-zinc-800 uppercase mb-2">
                                                {t("auth.modal.password", "Password")}
                                            </label>
                                            <div className="relative">
                                                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-900" />
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    value={data.password}
                                                    onChange={(e) => setData("password", e.target.value)}
                                                    placeholder={t("auth.modal.placeholder.password", "Enter your password")}
                                                    className="w-full border rounded-xl pl-12 pr-12 py-3 text-sm placeholder-zinc-600 outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30 transition-all"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                                >
                                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                            {errors.password && (
                                                <p className="text-red-400 text-xs mt-1">{errors.password}</p>
                                            )}
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="w-full bg-gradient-to-t from-blue-500 to-blue-800 hover:from-blue-400 hover:to-blue-500 text-zinc-100 text-xs font-bold tracking-widest uppercase py-4 rounded-xl transition-all duration-300 transform hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-50"
                                        >
                                            {t("auth.modal.btnSubmit", "Sign In")}
                                        </button>
                                    </form>
                                </>
                            ) : (
                                <div className="transition-all duration-300 space-y-4">
                                    <div className="text-center mb-2">
                                        <h4 className="text-sm font-bold text-slate-800">
                                            {t("auth.whatsapp.title", "Masuk via WhatsApp")}
                                        </h4>
                                    </div>

                                    {waStep === 1 ? (
                                        <form onSubmit={handleRequestOtp} className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-medium tracking-wider text-zinc-800 uppercase mb-2">
                                                    {t("auth.whatsapp.phone_label", "Nomor WhatsApp")}
                                                </label>
                                                <div className="flex gap-2">
                                                    <select
                                                        value={countryCode}
                                                        onChange={(e) => setCountryCode(e.target.value)}
                                                        className="border rounded-xl px-3 py-3 text-sm bg-white outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30 transition-all"
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
                                                    <input
                                                        type="tel"
                                                        value={waPhone}
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
                                                        placeholder="8xxxxxxxx"
                                                        className="w-full border rounded-xl px-4 py-3 text-sm placeholder-zinc-600 outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30 transition-all grow"
                                                        required
                                                    />
                                                </div>
                                                {waError && (
                                                    <p className="text-red-500 text-xs mt-1">{waError}</p>
                                                )}
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <button
                                                    type="submit"
                                                    disabled={waLoading}
                                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-zinc-100 text-xs font-bold tracking-widest uppercase py-3 rounded-xl transition-all duration-300 disabled:opacity-50"
                                                >
                                                    {waLoading ? t("auth.whatsapp.sending", "Mengirim...") : t("auth.whatsapp.send_otp", "Kirim Kode OTP")}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setLoginMethod('password');
                                                        setWaError('');
                                                    }}
                                                    className="text-xs text-zinc-500 underline hover:text-zinc-800 text-center py-2"
                                                >
                                                    {t("auth.login_with_password", "Masuk dengan Email & Password")}
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                                            <div className="text-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                                <p className="text-[11px] text-slate-500">
                                                    {t("auth.whatsapp.otp_sent_to", "Kode OTP telah dikirim ke WhatsApp")}
                                                </p>
                                                <p className="font-bold text-xs text-slate-800 mt-1">{maskedPhone}</p>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium tracking-wider text-zinc-800 uppercase mb-2 text-center">
                                                    {t("auth.whatsapp.otp_label", "Masukkan Kode OTP")}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={waOtp}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, '');
                                                        setWaOtp(val);
                                                    }}
                                                    placeholder="••••••"
                                                    maxLength={6}
                                                    className="w-full border rounded-xl py-3 text-center text-xl tracking-[0.5em] font-mono font-bold placeholder-zinc-400 outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30 transition-all"
                                                    required
                                                />
                                                {waError && (
                                                    <p className="text-red-500 text-xs mt-1 text-center">{waError}</p>
                                                )}
                                            </div>

                                            <div className="flex flex-col gap-3">
                                                <button
                                                    type="submit"
                                                    disabled={waLoading || waOtp.length !== 6}
                                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-zinc-100 text-xs font-bold tracking-widest uppercase py-3 rounded-xl transition-all duration-300 disabled:opacity-50"
                                                >
                                                    {waLoading ? t("auth.whatsapp.verifying", "Memverifikasi...") : t("auth.whatsapp.verify_otp", "Verifikasi & Masuk")}
                                                </button>

                                                <div className="flex justify-between items-center text-[10px] px-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setWaStep(1);
                                                            setWaOtp('');
                                                            setWaError('');
                                                        }}
                                                        className="text-zinc-500 hover:text-zinc-800 underline"
                                                    >
                                                        {t("auth.whatsapp.change_phone", "Ganti Nomor")}
                                                    </button>

                                                    {countdown > 0 ? (
                                                        <span className="text-zinc-400">
                                                            {t("auth.whatsapp.resend_in", "Kirim ulang dalam")} {countdown}s
                                                        </span>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={handleResendOtp}
                                                            className="text-emerald-600 hover:text-emerald-700 font-semibold underline"
                                                        >
                                                            {t("auth.whatsapp.resend_otp", "Kirim Ulang Kode")}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            )}

                            <div className="mt-6 text-center text-xs text-zinc-500">
                                {t("auth.modal.noAccount", "Don't have an account?")}{" "}
                                <Link
                                    href="/register"
                                    onClick={onClose}
                                    className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-4 transition-colors"
                                >
                                    {t("auth.modal.register", "Register Now")}
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default LoginModal;