import '../css/app.css';
import './bootstrap';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

import { LanguageProvider } from './Contexts/LanguageContext';
import LoadingOverlay from './Components/LoadingOverlay';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Force page reload if page is restored from browser back-forward cache (bfcache)
if (typeof window !== 'undefined') {
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            window.location.reload();
        }
    });
}

// Handle invalid Inertia responses (session expired / non-Inertia response)
router.on('invalid', (event) => {
    event.preventDefault();
    if (typeof window !== 'undefined') {
        window.location.reload();
    }
});

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <LanguageProvider>
                <App {...props} />
                <LoadingOverlay />
            </LanguageProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});
