import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, X, CreditCard, Wallet, QrCode, Store, Landmark } from "lucide-react";
import LoadingSpinner from "@/Components/LoadingSpinner";

// Logo helper — local to this modal only
const ModalPaymentLogo = ({ logo, name }) => {
    const [hasError, setHasError] = useState(!logo);

    if (hasError) {
        const isOvo = name.toLowerCase() === "ovo";
        const badgeBg = isOvo
            ? "bg-purple-700 text-white border-purple-800"
            : "bg-slate-100 text-slate-700 border-slate-200";
        return (
            <span className={`font-black text-[9px] px-2 py-0.5 rounded-md tracking-wider border select-none ${badgeBg}`}>
                {name}
            </span>
        );
    }

    return (
        <img
            src={logo}
            alt={name}
            onError={() => setHasError(true)}
            className="h-5 sm:h-5.5 max-w-[48px] object-contain shrink-0"
        />
    );
};

const CATEGORY_ICONS = {
    e_wallet: <Wallet className="text-indigo-500" size={14} />,
    qris: <QrCode className="text-teal-500" size={14} />,
    virtual_account: <Landmark className="text-blue-500" size={14} />,
    card: <CreditCard className="text-amber-500" size={14} />,
    retail: <Store className="text-rose-500" size={14} />,
};

export default function ChangeMethodModal({
    isOpen,
    onClose,
    changeCategories,
    loadingChange,
    onMethodChange,
    currentMethod,
    t,
}) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                    {/* Backdrop Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={!loadingChange ? onClose : undefined}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
                    />

                    {/* Modal Content Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden relative z-10"
                    >
                         {/* Modal Header */}
                         <div className="p-2 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
                             <h3 className="font-extrabold text-sm text-blue-950 flex items-center gap-2">
                                 {loadingChange ? (
                                     <LoadingSpinner className="w-5 h-5 shrink-0" />
                                 ) : (
                                     <RefreshCw size={15} className="text-blue-900 shrink-0" />
                                 )}
                                 <span>{t("checkout.modal.title", "Pilih Metode Pembayaran Baru")}</span>
                             </h3>
                             <button
                                 onClick={onClose}
                                 disabled={loadingChange}
                                 className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                                 <X size={16} />
                             </button>
                         </div>
 
                         {/* Modal Body */}
                         <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-white">
                             {loadingChange ? (
                                 <div className="flex flex-col items-center justify-center py-14 space-y-3">
                                     <LoadingSpinner className="w-12 h-12" />
                                     <span className="text-xs text-slate-500 font-bold text-center px-4 max-w-md leading-relaxed">
                                         {t("checkout.modal.loading", "Mengubah metode pembayaran & menghubungi Xendit...")}
                                     </span>
                                 </div>
                             ) : (
                                <div className="space-y-5">
                                    {changeCategories.map((cat) => (
                                        <div key={cat.id} className="space-y-2.5">
                                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-1 mt-2">
                                                {CATEGORY_ICONS[cat.id] ?? null}
                                                <span>{cat.title}</span>
                                            </h4>
                                            <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                                                {cat.methods.map((method) => {
                                                    const isSelected = method.id === currentMethod;
                                                    return (
                                                        <button
                                                            key={method.id}
                                                            type="button"
                                                            disabled={isSelected || loadingChange}
                                                            onClick={() => onMethodChange(method.id)}
                                                            className={`flex items-center gap-2.5 p-2.5 border rounded-xl text-left transition-all ${isSelected
                                                                ? "border-blue-900 bg-blue-50/20 text-blue-950 shadow-xs ring-1 ring-blue-900 cursor-not-allowed opacity-90"
                                                                : "border-slate-150 bg-white text-slate-700 hover:border-slate-350 hover:bg-slate-50/30"
                                                                }`}
                                                        >
                                                            {/* Radio dot */}
                                                            <div
                                                                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${isSelected
                                                                    ? "border-blue-900 bg-blue-900"
                                                                    : "border-slate-300 bg-white"
                                                                    }`}
                                                            >
                                                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                            </div>

                                                            {/* Method info */}
                                                            <div className="flex-1 min-w-0 flex justify-between items-center gap-2">
                                                                <div className="min-w-0">
                                                                    <h5 className="text-[11.5px] font-bold text-slate-800 truncate leading-snug">
                                                                        {method.name}
                                                                    </h5>
                                                                    <p className="text-[9.5px] text-slate-400 mt-0.5 leading-tight truncate">
                                                                        {method.desc}
                                                                    </p>
                                                                </div>
                                                                {/* Logo */}
                                                                <div className="shrink-0 flex items-center">
                                                                    {method.isCard ? (
                                                                        <div className="flex gap-0.5 items-center bg-slate-50 p-0.5 border border-slate-100 rounded-lg shrink-0 scale-90 origin-right">
                                                                            <img src="/images/payment/visa.svg" alt="Visa" className="h-3 object-contain" />
                                                                            <img src="/images/payment/mastercard.svg" alt="MC" className="h-3 object-contain" />
                                                                            <img src="/images/payment/jcb.svg" alt="JCB" className="h-3 object-contain" />
                                                                            <img src="/images/payment/amex.svg" alt="Amex" className="h-3 object-contain" />
                                                                            <img src="/images/payment/unionpay.svg" alt="UP" className="h-3 object-contain" />
                                                                        </div>
                                                                    ) : (
                                                                        <ModalPaymentLogo logo={method.logo} name={method.name} />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}