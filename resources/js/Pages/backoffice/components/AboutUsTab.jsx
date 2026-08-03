import React, { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import {
    Save,
    Check,
    Globe,
    BookOpen,
    Type,
    AlignLeft,
    Info,
} from 'lucide-react';
import { useLanguage } from '@/Contexts/LanguageContext';

/**
 * Helper: ambil value dari aboutUsSettings berdasarkan key & lang.
 */
function getSetting(settings, key, lang = 'id') {
    const item = settings?.[key];
    if (!item) return '';
    const translations = item.value_translations || {};
    return translations[lang] || item.value || '';
}

export default function AboutUsTab({ aboutUsSettings = {} }) {
    const { t, locale } = useLanguage();
    const [formLangTab, setFormLangTab] = useState('id');

    // Sync dengan global locale
    useEffect(() => {
        if (locale === 'arabic' || locale === 'ar') {
            setFormLangTab('ar');
        } else if (locale === 'english' || locale === 'en') {
            setFormLangTab('en');
        } else {
            setFormLangTab('id');
        }
    }, [locale]);

    const { data, setData, patch, processing, errors, wasSuccessful, reset } = useForm({
        // hero badge
        hero_badge_label_id: getSetting(aboutUsSettings, 'hero_badge_label', 'id'),
        hero_badge_label_en: getSetting(aboutUsSettings, 'hero_badge_label', 'en'),
        hero_badge_label_ar: getSetting(aboutUsSettings, 'hero_badge_label', 'ar'),
        // story title
        story_title_id: getSetting(aboutUsSettings, 'story_title', 'id'),
        story_title_en: getSetting(aboutUsSettings, 'story_title', 'en'),
        story_title_ar: getSetting(aboutUsSettings, 'story_title', 'ar'),
        // story p1
        story_p1_id: getSetting(aboutUsSettings, 'story_p1', 'id'),
        story_p1_en: getSetting(aboutUsSettings, 'story_p1', 'en'),
        story_p1_ar: getSetting(aboutUsSettings, 'story_p1', 'ar'),
        // story p2
        story_p2_id: getSetting(aboutUsSettings, 'story_p2', 'id'),
        story_p2_en: getSetting(aboutUsSettings, 'story_p2', 'en'),
        story_p2_ar: getSetting(aboutUsSettings, 'story_p2', 'ar'),
        // story p3
        story_p3_id: getSetting(aboutUsSettings, 'story_p3', 'id'),
        story_p3_en: getSetting(aboutUsSettings, 'story_p3', 'en'),
        story_p3_ar: getSetting(aboutUsSettings, 'story_p3', 'ar'),
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        patch(route('backoffice.content.about-us.update'));
    };

    const langTabs = [
        { key: 'id', label: 'Indonesia', flag: '🇮🇩' },
        { key: 'en', label: 'English', flag: '🇬🇧' },
        { key: 'ar', label: 'العربية', flag: '🇸🇦' },
    ];

    /** Field definition — urutan tampil di form */
    const fields = [
        {
            key: 'hero_badge_label',
            label: t('backoffice.content.about_us.field.hero_badge_label', 'Badge Label (Hero Banner)'),
            description: t('backoffice.content.about_us.field.hero_badge_label_desc', 'Teks kecil di dalam badge emas pada hero banner halaman Tentang Kami.'),
            icon: <Type className="w-4 h-4" />,
            type: 'input',
        },
        {
            key: 'story_title',
            label: t('backoffice.content.about_us.field.story_title', 'Story Title'),
            description: t('backoffice.content.about_us.field.story_title_desc', 'Judul section "Kisah Alsharif Perfume".'),
            icon: <BookOpen className="w-4 h-4" />,
            type: 'input',
        },
        {
            key: 'story_p1',
            label: t('backoffice.content.about_us.field.story_p1', 'Story Paragraph 1'),
            description: t('backoffice.content.about_us.field.story_p1_desc', 'Paragraf pertama narasi brand story.'),
            icon: <AlignLeft className="w-4 h-4" />,
            type: 'textarea',
            rows: 4,
        },
        {
            key: 'story_p2',
            label: t('backoffice.content.about_us.field.story_p2', 'Story Paragraph 2'),
            description: t('backoffice.content.about_us.field.story_p2_desc', 'Paragraf kedua tentang komitmen kualitas bahan baku.'),
            icon: <AlignLeft className="w-4 h-4" />,
            type: 'textarea',
            rows: 4,
        },
        {
            key: 'story_p3',
            label: t('backoffice.content.about_us.field.story_p3', 'Story Paragraph 3 (Bold)'),
            description: t('backoffice.content.about_us.field.story_p3_desc', 'Paragraf penutup tentang pengalaman toko — ditampilkan tebal.'),
            icon: <AlignLeft className="w-4 h-4" />,
            type: 'textarea',
            rows: 4,
        },
    ];

    const isRtl = formLangTab === 'ar';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h2 className="text-lg font-extrabold text-blue-950 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        {t('backoffice.content.about_us.title', 'Konten Tentang Kami')}
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {t('backoffice.content.about_us.subtitle', 'Edit teks yang tampil di halaman /about pada 3 bahasa.')}
                    </p>
                </div>

                {/* Preview badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-400/50 bg-amber-50 text-amber-700 text-xs font-bold">
                    <span>{t('backoffice.content.about_us.preview_badge', 'Preview badge')}:</span>
                    <span className="italic">
                        {data[`hero_badge_label_${formLangTab}`] || '—'}
                    </span>
                </div>
            </div>

            {/* Info note */}
            <div className="flex gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 text-xs">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                    {t('backoffice.content.about_us.info_note', 'Pilih tab bahasa (ID / EN / AR) untuk mengisi teks masing-masing bahasa. Jika field EN/AR dikosongkan, sistem akan menggunakan teks Indonesia sebagai fallback.')}
                </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Language Tabs */}
                <div className="border-b border-blue-100 flex gap-4">
                    {langTabs.map(({ key, label, flag }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setFormLangTab(key)}
                            className={`pb-2.5 text-sm font-bold transition-all flex items-center gap-1.5 ${
                                formLangTab === key
                                    ? 'text-blue-950 border-b-2 border-blue-950'
                                    : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            <Globe className="w-3.5 h-3.5" />
                            <span>{flag} {label}</span>
                        </button>
                    ))}
                </div>

                {/* Fields */}
                <div className="space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>
                    {fields.map((field) => {
                        const fieldKey = `${field.key}_${formLangTab}`;
                        return (
                            <div key={field.key} className="space-y-1.5">
                                <label
                                    htmlFor={fieldKey}
                                    className="flex items-center gap-1.5 text-sm font-semibold text-slate-700"
                                >
                                    <span className="text-blue-500">{field.icon}</span>
                                    {field.label}
                                    {formLangTab === 'id' && (
                                        <span className="ml-1 text-xs text-rose-500 font-bold">*</span>
                                    )}
                                </label>
                                <p className="text-xs text-slate-400 leading-relaxed">{field.description}</p>

                                {field.type === 'input' ? (
                                    <input
                                        id={fieldKey}
                                        type="text"
                                        value={data[fieldKey] || ''}
                                        onChange={(e) => setData(fieldKey, e.target.value)}
                                        placeholder={`${field.label} (${formLangTab.toUpperCase()})…`}
                                        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm shadow-sm outline-none transition
                                            focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400
                                            ${errors[fieldKey] ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-white'}
                                            ${isRtl ? 'text-right' : 'text-left'}`}
                                    />
                                ) : (
                                    <textarea
                                        id={fieldKey}
                                        rows={field.rows || 3}
                                        value={data[fieldKey] || ''}
                                        onChange={(e) => setData(fieldKey, e.target.value)}
                                        placeholder={`${field.label} (${formLangTab.toUpperCase()})…`}
                                        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm shadow-sm outline-none transition resize-y
                                            focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400
                                            ${errors[fieldKey] ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-white'}
                                            ${isRtl ? 'text-right' : 'text-left'}`}
                                    />
                                )}
                                {errors[fieldKey] && (
                                    <p className="text-xs text-rose-500">{errors[fieldKey]}</p>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Submit */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-950 text-white text-sm font-bold shadow hover:bg-blue-800 active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {processing ? (
                            <>
                                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                {t('backoffice.content.about_us.saving', 'Menyimpan…')}
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                {t('backoffice.content.about_us.save_btn', 'Simpan Perubahan')}
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Live Preview Card */}
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-200 bg-white flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <span className="ml-2 text-xs text-slate-400 font-mono">
                        /about — {t('backoffice.content.about_us.preview_header', 'preview')} ({formLangTab.toUpperCase()})
                    </span>
                </div>
                <div
                    className="p-6 space-y-4 text-center"
                    dir={isRtl ? 'rtl' : 'ltr'}
                >
                    {/* Badge preview */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-600 text-xs font-bold uppercase tracking-widest">
                        ✨ {data[`hero_badge_label_${formLangTab}`] || '—'}
                    </div>
                    {/* Story title preview */}
                    <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        {data[`story_title_${formLangTab}`] || '—'}
                    </h3>
                    <div className="h-0.5 w-12 bg-amber-400 rounded mx-auto" />
                    {/* Paragraphs preview */}
                    {['story_p1', 'story_p2'].map((p) => (
                        <p key={p} className="text-slate-500 text-xs leading-relaxed max-w-xl mx-auto">
                            {data[`${p}_${formLangTab}`] || '—'}
                        </p>
                    ))}
                    <p className="text-slate-700 text-xs font-bold leading-relaxed max-w-xl mx-auto">
                        {data[`story_p3_${formLangTab}`] || '—'}
                    </p>
                </div>
            </div>
        </div>
    );
}
