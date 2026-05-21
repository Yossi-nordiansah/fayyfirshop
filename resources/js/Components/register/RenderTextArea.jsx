import React from "react";
import { motion } from "framer-motion";

const RenderTextArea = ({
    label,
    id,
    placeholder,
    icon: IconComponent,
    required = true,
    data,
    setData,
    errors = {},
    clientErrors = {},
    isRtl = false
}) => {
    const errorMsg = clientErrors[id] || errors[id];
    return (
        <div className="relative mb-5" dir={isRtl ? "rtl" : "ltr"}>
            <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 px-1">
                {label} {required && <span className="text-amber-600">*</span>}
            </label>
            <div className="relative">
                <div className={`absolute top-3 ${isRtl ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-start pointer-events-none text-slate-400`}>
                    {IconComponent && <IconComponent size={18} className="opacity-70 mt-0.5" />}
                </div>
                <textarea
                    id={id}
                    value={data[id]}
                    onChange={(e) => setData(id, e.target.value)}
                    placeholder={placeholder}
                    rows="3"
                    className={`w-full bg-slate-50 text-slate-900 placeholder-slate-400 ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 rounded-xl border transition-all duration-300 outline-none resize-none ${errorMsg
                        ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        : "border-slate-200 hover:border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50"
                        }`}
                    required={required}
                />
            </div>
            {errorMsg && (
                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-500 mt-1 px-1">
                    {errorMsg}
                </motion.p>
            )}
        </div>
    );
};

export default RenderTextArea;
