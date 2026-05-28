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
}) {
    return (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="mb-4 border-b border-slate-100 pb-2 text-sm font-black uppercase tracking-wider text-blue-950">
                Klasifikasi & Finansial
            </h3>
            <div className="space-y-4">
                {/* Category */}
                <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-700">
                        Kategori Utama <span className="text-rose-500">*</span>
                    </label>
                    <select
                        value={data.product_category_id}
                        onChange={handleCategoryChange}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-950 focus:bg-white"
                    >
                        <option value="">Pilih Kategori</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                    {errors.product_category_id && (
                        <p className="mt-1 text-xs text-rose-600">{errors.product_category_id}</p>
                    )}
                </div>

                {/* Sub-category */}
                <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-700">Sub Kategori</label>
                    <select
                        value={data.product_sub_category_id}
                        disabled={!data.product_category_id}
                        onChange={e => setData('product_sub_category_id', e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-950 focus:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <option value="">
                            {!data.product_category_id
                                ? 'Pilih kategori dulu'
                                : availableSubCategories.length === 0
                                ? 'Tidak ada sub kategori'
                                : 'Pilih Sub Kategori'}
                        </option>
                        {availableSubCategories.map(sub => (
                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                        ))}
                    </select>
                </div>

                <hr className="border-slate-100" />

                {/* SKU */}
                <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-700">
                        Base SKU <span className="text-rose-500">*</span>
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
                    <label className="mb-1.5 block text-xs font-bold text-slate-700">
                        Harga Dasar (IDR) <span className="text-rose-500">*</span>
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
                        Disimpan dalam IDR. Frontend mengkonversi ke SAR/MYR secara dinamis.
                    </p>
                </div>
            </div>
        </div>
    );
}
