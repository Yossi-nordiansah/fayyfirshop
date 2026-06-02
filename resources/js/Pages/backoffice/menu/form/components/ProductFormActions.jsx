import React from 'react';
import { Link } from '@inertiajs/react';
import { Check } from 'lucide-react';

// ─── Component 5: Button Submit dan Cancel ────────────────────────────────────
export default function ProductFormActions({ processing, isEditing, t }) {
    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <button
                type="submit"
                disabled={processing}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-950 to-blue-900 px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-950/10 transition hover:opacity-95 disabled:opacity-50 active:scale-[0.98]"
            >
                <Check className="h-4 w-4" />
                {processing
                    ? t('backoffice.product.form.saving', 'Menyimpan...')
                    : isEditing
                        ? t('backoffice.product.form.btn_submit_edit', 'Simpan Perubahan')
                        : t('backoffice.product.form.btn_submit_create', 'Publish Produk')}
            </button>
            <Link
                href={route('backoffice.products.index')}
                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100"
            >
                {t('backoffice.product.btn_cancel', 'Batal')}
            </Link>
        </div>
    );
}
