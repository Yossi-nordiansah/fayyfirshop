import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/Contexts/LanguageContext';

/**
 * Reusable confirmation dialog for the backoffice.
 *
 * Props:
 *  - show        {boolean}   Whether the modal is visible
 *  - title       {string}    Modal heading
 *  - message     {string}    Body text / question
 *  - confirmLabel {string}   Label for the confirm button  (default: "Delete")
 *  - cancelLabel  {string}   Label for the cancel button   (default: "Cancel")
 *  - variant     {string}    "danger" | "warning" | "info"  (default: "danger")
 *  - onConfirm   {function}  Called when user clicks confirm
 *  - onCancel    {function}  Called when user clicks cancel / backdrop
 */
export default function ConfirmModal({
    show = false,
    title,
    message,
    confirmLabel,
    cancelLabel,
    variant = 'danger',
    onConfirm,
    onCancel,
}) {
    const { t } = useLanguage();

    const resolvedTitle = title ?? t('common.confirm_modal.title', 'Konfirmasi');
    const resolvedMessage = message ?? t('common.confirm_modal.message', 'Apakah Anda yakin?');
    const resolvedConfirmLabel = confirmLabel ?? t('common.confirm_modal.confirm', 'Hapus');
    const resolvedCancelLabel = cancelLabel ?? t('common.confirm_modal.cancel', 'Batal');

    const variantMap = {
        danger: {
            icon: 'bg-rose-50 text-rose-600 border-rose-100',
            confirm: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500',
        },
        warning: {
            icon: 'bg-amber-50 text-amber-600 border-amber-100',
            confirm: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-400',
        },
        info: {
            icon: 'bg-blue-50 text-blue-700 border-blue-100',
            confirm: 'bg-blue-950 hover:bg-blue-900 focus:ring-blue-800',
        },
    };

    const colors = variantMap[variant] ?? variantMap.danger;

    return (
        <AnimatePresence>
            {show && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-blue-950/40 backdrop-blur-sm"
                    onClick={onCancel}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97, y: 10 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="w-full max-w-md rounded-xl border border-blue-50 bg-white p-6 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start gap-4">
                            <div className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${colors.icon}`}>
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-base font-bold text-blue-950">{resolvedTitle}</h3>
                                <p className="mt-1.5 text-sm text-slate-600">{resolvedMessage}</p>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
                            >
                                {resolvedCancelLabel}
                            </button>
                            <button
                                type="button"
                                onClick={onConfirm}
                                className={`rounded-lg px-4 py-2.5 text-sm font-bold text-white transition focus:outline-none focus:ring-2 focus:ring-offset-1 ${colors.confirm}`}
                            >
                                {resolvedConfirmLabel}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

