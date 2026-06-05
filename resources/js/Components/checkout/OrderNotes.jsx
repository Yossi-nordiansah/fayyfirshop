import React from "react";

export default function OrderNotes({
    t,
    notes,
    setNotes
}) {
    return (
        <section className="p-6 bg-white border border-slate-100 shadow-sm rounded-3xl">
            <h2 className="text-base font-extrabold text-slate-900 pb-2 mb-2">
                {t("checkout.notes_label", "Catatan Tambahan (Opsional)")}
            </h2>
            <textarea
                rows={2}
                placeholder="Instruksi pengiriman (contoh: pagar hitam, taruh di pos satpam)..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
        </section>
    );
}
