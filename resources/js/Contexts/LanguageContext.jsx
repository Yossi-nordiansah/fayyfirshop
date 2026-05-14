import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [locale, setLocale] = useState(localStorage.getItem('locale') || 'indonesia');
    const [translations, setTranslations] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTranslations = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/lang-${locale}.json`);
                const data = await response.json();
                setTranslations(data);
                localStorage.setItem('locale', locale);
                
                // Keep layout LTR for all languages
                document.documentElement.dir = 'ltr';
                document.documentElement.lang = locale === 'arabic' ? 'ar' : locale === 'indonesia' ? 'id' : 'en';
            } catch (error) {
                console.error('Failed to load translations:', error);
            } finally {
                setLoading(false);
            }
        };

        loadTranslations();
    }, [locale]);

    const t = (key) => {
        return translations[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ locale, setLocale, t, loading }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
