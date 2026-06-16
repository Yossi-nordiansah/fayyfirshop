import React from "react";
import { useLanguage } from "@/Contexts/LanguageContext";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";

export default function OrderNotes({ notes, setNotes }) {
    const { t } = useLanguage();

    return (
        <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="p-6 bg-white border border-slate-100 shadow-sm rounded-3xl"
        >
            <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-50">
                <FileText className="w-4 h-4 text-amber-500" />
                <h2 className="text-base font-extrabold text-slate-900">
                    {t("checkout.notes_label", "Catatan Tambahan (Opsional)")}
                </h2>
            </div>

            <textarea
                rows={3}
                placeholder={t("checkout.notes_placeholder", "Instruksi pengiriman (contoh: pagar hitam, taruh di pos satpam)...")}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600/20 transition-all duration-300 resize-none layout-arabic-right"
            />
        </motion.section>
    );
}