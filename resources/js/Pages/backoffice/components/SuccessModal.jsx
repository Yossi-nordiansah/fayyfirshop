import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, X } from 'lucide-react';
import { useLanguage } from '@/Contexts/LanguageContext';

/**
 * Reusable success feedback modal for the backoffice.
 *
 * Props:
 *  - show      {boolean}   Whether the modal is visible
 *  - title     {string}    Heading text
 *  - message   {string}    Body / detail text
 *  - btnLabel  {string}    Confirm / close button label  (default: "OK")
 *  - onClose   {function}  Called when user closes the modal
 */
const statusTranslationMap = {
    'Produk berhasil ditambahkan.': 'status.product.created',
    'Produk berhasil diperbarui.': 'status.product.updated',
    'Produk berhasil dihapus.': 'status.product.deleted',
    'Store branch created successfully.': 'status.branch.created',
    'Store branch updated successfully.': 'status.branch.updated',
    'Store branch deleted successfully.': 'status.branch.deleted',
    'Category created successfully.': 'status.category.created',
    'Category updated successfully.': 'status.category.updated',
    'Category deleted successfully.': 'status.category.deleted',
    'Admin created successfully.': 'status.admin.created',
    'Admin updated successfully.': 'status.admin.updated',
    'Admin deleted successfully.': 'status.admin.deleted',
    'You cannot delete the currently signed-in admin.': 'status.admin.delete_self_error',
};

export default function SuccessModal({
    show = false,
    title,
    message = '',
    btnLabel,
    onClose,
}) {
    const { t } = useLanguage();
    const resolvedTitle = title ?? t('common.success_modal.title', 'Berhasil!');
    const resolvedBtnLabel = btnLabel ?? t('common.success_modal.btn_label', 'OK');

    const translationKey = statusTranslationMap[message];
    const resolvedMessage = translationKey ? t(translationKey, message) : message;

    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-blue-950/40 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97, y: 10 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="w-full max-w-md rounded-xl border border-blue-50 bg-white p-6 shadow-2xl"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-600">
                                    <CheckCircle2 className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-blue-950">{resolvedTitle}</h2>
                                    {resolvedMessage && (
                                        <p className="mt-1 text-sm text-slate-600">{resolvedMessage}</p>
                                    )}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                                aria-label="Close"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-lg border border-amber-500/20 bg-blue-950 px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-blue-900 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-800 focus:ring-offset-1"
                            >
                                {resolvedBtnLabel}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

