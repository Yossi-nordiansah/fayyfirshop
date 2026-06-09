import React, { useRef } from 'react';
import { Package, List, ListOrdered } from 'lucide-react';

// ─── ToolBtn ─────────────────────────────────────────────────────────────────
function ToolBtn({ onClick, title, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-blue-950 active:scale-95"
        >
            {children}
        </button>
    );
}

// ─── RichTextArea ─────────────────────────────────────────────────────────────
function RichTextArea({ value = '', onChange, placeholder = '', dir = 'ltr', rows = 6, t }) {
    const taRef = useRef(null);

    const applyInline = (wrap) => {
        const ta = taRef.current;
        if (!ta) return;
        const { selectionStart: s, selectionEnd: e } = ta;
        const selected = value.slice(s, e);
        const next = value.slice(0, s) + wrap + selected + wrap + value.slice(e);
        onChange(next);
        requestAnimationFrame(() => {
            ta.focus();
            ta.selectionStart = s + wrap.length;
            ta.selectionEnd = e + wrap.length;
        });
    };

    const toggleLinePrefix = (prefix) => {
        const ta = taRef.current;
        if (!ta) return;
        const { selectionStart: s } = ta;
        const lineStart = value.lastIndexOf('\n', s - 1) + 1;
        const hasPrefix = value.slice(lineStart).startsWith(prefix);
        let next, cursor;
        if (hasPrefix) {
            next = value.slice(0, lineStart) + value.slice(lineStart + prefix.length);
            cursor = Math.max(lineStart, s - prefix.length);
        } else {
            next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
            cursor = s + prefix.length;
        }
        onChange(next);
        requestAnimationFrame(() => {
            ta.focus();
            ta.selectionStart = ta.selectionEnd = cursor;
        });
    };

    const handleKeyDown = (e) => {
        if (e.ctrlKey && e.key === 'b') { e.preventDefault(); applyInline('**'); return; }
        if (e.ctrlKey && e.key === 'i') { e.preventDefault(); applyInline('_'); return; }
        if (e.key !== 'Enter') return;

        const ta = taRef.current;
        const { selectionStart: s } = ta;
        const lineStart = value.lastIndexOf('\n', s - 1) + 1;
        const currentLine = value.slice(lineStart, s);

        // Bullet list continuation
        if (currentLine.startsWith('• ')) {
            e.preventDefault();
            if (currentLine.trimEnd() === '•') {
                onChange(value.slice(0, lineStart) + value.slice(s));
                requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = lineStart; });
            } else {
                const next = value.slice(0, s) + '\n• ' + value.slice(s);
                onChange(next);
                requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = s + 3; });
            }
            return;
        }

        // Numbered list continuation
        const numMatch = currentLine.match(/^(\d+)\.\s/);
        if (numMatch) {
            e.preventDefault();
            if (currentLine.trim() === `${numMatch[1]}.`) {
                onChange(value.slice(0, lineStart) + value.slice(s));
                requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = lineStart; });
            } else {
                const nextNum = +numMatch[1] + 1;
                const insert = `\n${nextNum}. `;
                const next = value.slice(0, s) + insert + value.slice(s);
                onChange(next);
                requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = s + insert.length; });
            }
        }
    };

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 transition focus-within:border-blue-950 focus-within:ring-4 focus-within:ring-blue-950/5">
            {/* Toolbar */}
            <div className="flex items-center gap-0.5 border-b border-slate-100 bg-slate-50 px-2 py-1.5">
                <ToolBtn title={t('backoffice.product.form.rich.bold', 'Bold (Ctrl+B)')} onClick={() => applyInline('**')}>
                    <span className="text-xs font-black">B</span>
                </ToolBtn>
                <ToolBtn title={t('backoffice.product.form.rich.italic', 'Italic (Ctrl+I)')} onClick={() => applyInline('_')}>
                    <span className="text-xs font-bold italic">I</span>
                </ToolBtn>
                <div className="mx-1 h-4 w-px bg-slate-200" />
                <ToolBtn title={t('backoffice.product.form.rich.bullet_list', 'Bullet List')} onClick={() => toggleLinePrefix('• ')}>
                    <List className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn title={t('backoffice.product.form.rich.numbered_list', 'Numbered List')} onClick={() => toggleLinePrefix('1. ')}>
                    <ListOrdered className="h-3.5 w-3.5" />
                </ToolBtn>
                <span className="ml-2 text-[10px] text-slate-400 select-none">
                    {t('backoffice.product.form.rich.hint', '**tebal** · _miring_ · Enter = baris baru')}
                </span>
            </div>
            <textarea
                ref={taRef}
                value={value}
                onChange={e => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={rows}
                dir={dir}
                placeholder={placeholder}
                className="w-full resize-none bg-white px-4 py-3 font-mono text-sm leading-relaxed text-slate-800 outline-none"
            />
        </div>
    );
}

// ─── Component 1: Informasi Detail Produk ─────────────────────────────────────
export default function ProductInfoSection({ activeLang, data, setData, errors, t }) {
    let activeLangLabel = activeLang;
    if (activeLang === 'indonesia') activeLangLabel = t('backoffice.product.modal.lang_id', 'Indonesia');
    else if (activeLang === 'arabic') activeLangLabel = t('backoffice.product.modal.lang_ar', 'Arab (العربية)');
    else if (activeLang === 'english') activeLangLabel = t('backoffice.product.modal.lang_en', 'Inggris');

    const namePlaceholder = t('backoffice.product.form.placeholders.name', 'Nama produk dalam bahasa {lang}...').replace('{lang}', activeLangLabel);
    const descPlaceholder = t('backoffice.product.form.placeholders.desc', 'Tulis deskripsi produk dalam bahasa {lang}... (Enter = baris baru, • list didukung)').replace('{lang}', activeLangLabel);

    return (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-3">
                <Package className="h-5 w-5 text-amber-500" />
                <h3 className="text-base font-bold text-blue-950">{t('backoffice.product.title', 'Informasi Detail Produk')}</h3>
            </div>
            <div className="space-y-5">
                {/* Name */}
                <div>
                    <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-700">
                        {t('backoffice.product.name', 'Nama Produk')} ({activeLangLabel}) <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="text"
                        dir={activeLang === 'arabic' ? 'rtl' : 'ltr'}
                        value={data.name_translations?.[activeLang] ?? ''}
                        onChange={e => setData('name_translations', {
                            ...data.name_translations,
                            [activeLang]: e.target.value,
                        })}
                        placeholder={namePlaceholder}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-950 focus:bg-white focus:ring-4 focus:ring-blue-950/5"
                    />
                    {errors[`name_translations.${activeLang}`] && (
                        <p className="mt-1.5 text-xs font-medium text-rose-600">
                            {errors[`name_translations.${activeLang}`]}
                        </p>
                    )}
                </div>
                {/* Description */}
                <div>
                    <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-700">
                        {t('backoffice.product.desc', 'Deskripsi Produk')} ({activeLangLabel}) <span className="text-rose-500">*</span>
                    </label>
                    <RichTextArea
                        value={data.description_translations?.[activeLang] ?? ''}
                        onChange={val => setData('description_translations', {
                            ...data.description_translations,
                            [activeLang]: val,
                        })}
                        placeholder={descPlaceholder}
                        dir={activeLang === 'arabic' ? 'rtl' : 'ltr'}
                        t={t}
                    />
                </div>

                <hr className="border-slate-100" />

                {/* Additional Classification Flags */}
                <div className="space-y-3">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                        {t('backoffice.product.form.classification_flags', 'Klasifikasi Tambahan')}
                    </label>
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                        {/* Checkbox New */}
                        <label className="flex items-start gap-3 cursor-pointer select-none group flex-1">
                            <div className="relative flex items-center mt-0.5">
                                <input
                                    type="checkbox"
                                    checked={data.is_new}
                                    onChange={e => setData('is_new', e.target.checked)}
                                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 bg-white checked:border-blue-950 checked:bg-blue-950 focus:outline-none transition-all"
                                />
                                <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </span>
                            </div>
                            <div className="text-sm">
                                <span className="font-semibold text-slate-700 group-hover:text-blue-950 transition-colors">
                                    {t('product.badge.new', 'Baru')}
                                </span>
                                <span className="block text-[10px] text-slate-400">
                                    {t('backoffice.product.form.is_new_hint', 'Tampilkan label produk baru')}
                                </span>
                            </div>
                        </label>

                        {/* Checkbox Best Seller */}
                        <label className="flex items-start gap-3 cursor-pointer select-none group flex-1">
                            <div className="relative flex items-center mt-0.5">
                                <input
                                    type="checkbox"
                                    checked={data.is_best_seller}
                                    onChange={e => setData('is_best_seller', e.target.checked)}
                                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 bg-white checked:border-blue-950 checked:bg-blue-950 focus:outline-none transition-all"
                                />
                                <span className="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </span>
                            </div>
                            <div className="text-sm">
                                <span className="font-semibold text-slate-700 group-hover:text-blue-950 transition-colors">
                                    {t('product.badge.best_seller', 'Terlaris')}
                                </span>
                                <span className="block text-[10px] text-slate-400">
                                    {t('backoffice.product.form.is_best_seller_hint', 'Tampilkan label produk terlaris')}
                                </span>
                            </div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}
