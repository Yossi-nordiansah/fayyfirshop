import React from 'react';

// Helper to format price with thousands separator
const formatPriceInput = (value) => {
    if (value === undefined || value === null || value === '') return '';
    const clean = String(value).replace(/\D/g, '');
    if (!clean) return '';
    return new Intl.NumberFormat('id-ID').format(parseInt(clean, 10));
};

const parsePriceInput = (value) => {
    if (value === undefined || value === null || value === '') return '';
    const clean = String(value).replace(/\D/g, '');
    return clean ? parseInt(clean, 10) : '';
};

// ─── Component 4: Klasifikasi & Finansial ─────────────────────────────────────
export default function ProductClassificationSection({
    data,
    setData,
    errors,
    categories,
    availableSubCategories,
    handleCategoryChange,
    hasWeightVariant = false,
    t,
    locale,
}) {
    return (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="mb-4 border-b border-slate-100 pb-2 text-sm font-black uppercase tracking-wider text-blue-950">
                {t('backoffice.product.form.classification_title', 'Klasifikasi & Finansial')}
            </h3>
            <div className="space-y-4">
                {/* Category */}
                <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-700">
                        {t('backoffice.product.form.main_category', 'Kategori Utama')} <span className="text-rose-500">*</span>
                    </label>
                    <select
                        value={data.product_category_id}
                        onChange={handleCategoryChange}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-950 focus:bg-white"
                    >
                        <option value="">{t('backoffice.product.form.select_category', 'Pilih Kategori')}</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name_translations?.[locale] || cat.name}
                            </option>
                        ))}
                    </select>
                    {errors.product_category_id && (
                        <p className="mt-1 text-xs text-rose-600">{errors.product_category_id}</p>
                    )}
                </div>

                {/* Sub-category */}
                <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-700">{t('backoffice.product.form.sub_category', 'Sub Kategori')}</label>
                    <select
                        value={data.product_sub_category_id}
                        disabled={!data.product_category_id}
                        onChange={e => setData('product_sub_category_id', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-950 focus:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <option value="">
                            {!data.product_category_id
                                ? t('backoffice.product.form.select_cat_first', 'Pilih kategori dulu')
                                : availableSubCategories.length === 0
                                    ? t('backoffice.product.modal.no_subcategory', 'Tanpa Sub Kategori')
                                    : t('backoffice.product.form.select_sub_cat', 'Pilih Sub Kategori')}
                        </option>
                        {availableSubCategories.map(sub => (
                            <option key={sub.id} value={sub.id}>
                                {sub.name_translations?.[locale] || sub.name}
                            </option>
                        ))}
                    </select>
                </div>

                <hr className="border-slate-100" />

                {/* SKU */}
                <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-700">
                        {t('backoffice.product.th_sku', 'SKU Induk')} <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={data.sku}
                        onChange={e => setData('sku', e.target.value)}
                        placeholder="FYF-PERF-001"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-950 focus:bg-white"
                    />
                    {errors.sku && (
                        <p className="mt-1 text-xs text-rose-600">{errors.sku}</p>
                    )}
                </div>

                {/* Price */}
                <div>
                    <label className="mb-1.5 block text-nowrap text-xs font-bold text-slate-700">
                        {t('backoffice.product.th_base_price', 'Harga (IDR)')} {!data.has_variants && <span className="text-rose-500">*</span>}
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                        <input
                            type="text"
                            value={formatPriceInput(data.price)}
                            onChange={e => setData('price', parsePriceInput(e.target.value))}
                            placeholder="0"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm font-semibold outline-none focus:border-blue-950 focus:bg-white"
                        />
                    </div>
                    {errors.price && (
                        <p className="mt-1 text-xs text-rose-600">{errors.price}</p>
                    )}
                    <p className="mt-1 text-[10px] text-slate-400">
                        {data.has_variants
                            ? t('backoffice.product.form.price_hint_variants', 'Jika field input ini tidak di isi, maka akan mengambil data harga dari variant/sub variant yang termurah')
                            : t('backoffice.product.modal.price_note', 'Disimpan dalam Rupiah (IDR) dan divalidasi otomatis.')}
                    </p>
                </div>

                {/* Discount Price */}
                <div>
                    <label className="mb-1.5 block text-nowrap text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <span>{t('backoffice.product.discount_price', 'Harga Diskon (IDR)')}</span>
                        <span className="inline-flex items-center rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-500 uppercase tracking-wide">Opsional</span>
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-rose-400">Rp</span>
                        <input
                            type="text"
                            value={formatPriceInput(data.discount_price)}
                            onChange={e => setData('discount_price', parsePriceInput(e.target.value))}
                            placeholder="0"
                            className="w-full rounded-xl border border-rose-200 bg-rose-50/40 py-2.5 pl-9 pr-3 text-sm font-semibold text-rose-700 outline-none transition focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-100"
                        />
                        {data.discount_price ? (
                            <button
                                type="button"
                                onClick={() => setData('discount_price', '')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-400 hover:text-rose-600 transition"
                                title="Hapus harga diskon"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </button>
                        ) : null}
                    </div>
                    {errors.discount_price && (
                        <p className="mt-1 text-xs text-rose-600">{errors.discount_price}</p>
                    )}
                    <p className="mt-1 text-[10px] text-slate-400">
                        {t('backoffice.product.discount_price_hint', 'Jika diisi, harga asli akan dicoret dan digantikan harga diskon ini di tampilan produk.')}
                    </p>
                    {data.discount_price && data.price && Number(data.discount_price) >= Number(data.price) && (
                        <p className="mt-1 text-[10px] font-semibold text-amber-600">
                            ⚠️ Harga diskon lebih besar atau sama dengan harga asli. Pastikan harga diskon lebih kecil.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
