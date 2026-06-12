import React, { useState } from "react";
import { Link, useForm } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, X } from "lucide-react";

const LoginModal = ({ isOpen, onClose, t }) => {
    const [showPassword, setShowPassword] = useState(false);

    // Inertia form handler untuk proses login balik ke Laravel
    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: true,
    });

    const handleLoginSubmit = (e) => {
        e.preventDefault();
        post(route("login"), {
            onSuccess: () => {
                onClose();
                reset("password");
            },
        });
    };

    return (
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
                            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/70 backdrop-blur-sm">
                                <img src="/images/load.gif" alt="Loading" className="w-24 h-24 object-contain" />
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
    );
};

export default LoginModal;