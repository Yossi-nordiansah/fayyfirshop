import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import LoadingSpinner from './LoadingSpinner';
import { useLanguage } from '@/Contexts/LanguageContext';

export default function LoadingOverlay() {
    const [loading, setLoading] = useState(false);
    const { t } = useLanguage();

    useEffect(() => {
        let timeoutId = null;

        const startListener = () => {
            if (timeoutId) clearTimeout(timeoutId);
            // 200ms delay to prevent flickering on ultra-fast requests
            timeoutId = setTimeout(() => {
                setLoading(true);
            }, 200);
        };

        const finishListener = () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
            setLoading(false);
        };

        const unbindStart = router.on('start', startListener);
        const unbindFinish = router.on('finish', finishListener);

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            unbindStart();
            unbindFinish();
        };
    }, []);

    if (!loading) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/20 backdrop-blur-[1px] transition-all duration-300">
            <LoadingSpinner className="h-20 w-20" />
        </div>
    );
}
