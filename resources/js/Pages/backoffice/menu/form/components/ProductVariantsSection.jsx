import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Layers, Plus, Trash2, Upload, X } from 'lucide-react';

const PRESET_TYPES = ['Ukuran', 'Warna', 'Rasa', 'Model', 'Bahan'];

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

// ─── Component 3: Varian & Inventaris ─────────────────────────────────────────
export default function ProductVariantsSection({
    data,
    setData,
    units,
    activeLang,
    storeBranches,
    pendingType,
    setPendingType,
    showCustomType,
    setShowCustomType,
    customTypeValue,
    setCustomTypeValue,
    typeSelectRef,
    handleTypeSelect,
    addVariant,
    removeVariant,
    updateVariantField,
    updateVariantLang,
    updateVariantStock,
    updateStandardStock,
    handleVariantImage,
}) {
    return (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                    <Layers className="h-5 w-5 text-amber-500" />
                    <div>
                        <h3 className="text-base font-bold text-blue-950">Varian & Inventaris</h3>
                        <p className="text-xs text-slate-400">Tambahkan varian ukuran, warna, rasa, dll.</p>
                    </div>
                </div>
            </div>

            {/* Variant type selector */}
            <div className="mb-5 space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Tambah Tipe Varian Baru</p>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                        <select
                            ref={typeSelectRef}
                            defaultValue=""
                            onChange={handleTypeSelect}
                            className="h-10 w-52 cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-sm font-medium text-slate-700 outline-none focus:border-blue-950 focus:ring-2 focus:ring-blue-950/5"
                        >
                            <option value="" disabled>Pilih tipe varian...</option>
                            {PRESET_TYPES.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                            <option value="__new__">+ Tipe Baru...</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>

                    {pendingType && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            type="button"
                            onClick={() => addVariant(pendingType)}
                            className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-950 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-blue-900 active:scale-95"
                        >
                            <Plus className="h-4 w-4" />
                            Tambah Varian {pendingType}
                        </motion.button>
                    )}
                </div>

                {/* Custom type input */}
                <AnimatePresence>
                    {showCustomType && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="text"
                                    value={customTypeValue}
                                    onChange={e => setCustomTypeValue(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addVariant(customTypeValue);
                                        }
                                    }}
                                    placeholder="Nama tipe varian baru..."
                                    className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-950"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => addVariant(customTypeValue)}
                                    disabled={!customTypeValue.trim()}
                                    className="h-10 rounded-xl bg-blue-950 px-4 text-sm font-bold text-white transition disabled:opacity-40 hover:bg-blue-900"
                                >
                                    Tambah
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCustomType(false);
                                        setCustomTypeValue('');
                                        if (typeSelectRef.current) typeSelectRef.current.value = '';
                                    }}
                                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Standard stock (no variants) */}
            {!data.has_variants && (
                <div className="space-y-4">
                    <span className="block rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-600">
                        💡 Mode Produk Tunggal — Kelola stok langsung per cabang gudang.
                    </span>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {data.branch_stocks.map((bs, bIdx) => (
                            <div key={bs.store_branch_id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                                <label className="mb-2 block truncate text-xs font-black uppercase text-slate-700">Cabang {bs.country_code || bs.branch_name}</label>
                                <input
                                    type="number" min="0"
                                    value={bs.stock}
                                    onChange={e => updateStandardStock(bIdx, e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-sm font-semibold text-slate-800 outline-none focus:border-blue-950"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Variant cards */}
            {data.has_variants && (
                <div className="space-y-4">
                    <AnimatePresence initial={false}>
                        {data.variants.map((variant, vIdx) => (
                            <motion.div
                                key={`${variant.type}-${vIdx}`}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.96 }}
                                className="relative rounded-2xl border border-blue-50 bg-slate-50/40 p-5 shadow-sm transition hover:border-blue-100"
                            >
                                {/* Variant header */}
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-950 text-[11px] font-black text-white shadow">
                                            #{vIdx + 1}
                                        </span>
                                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-950">
                                            {variant.type || 'Varian'}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeVariant(vIdx)}
                                        className="text-slate-400 transition hover:text-rose-500"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Variant fields grid */}
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {/* Name (translated) */}
                                    <div>
                                        <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">
                                            Nilai {variant.type} ({activeLang})
                                        </label>
                                        <input
                                            type="text"
                                            dir={activeLang === 'arabic' ? 'rtl' : 'ltr'}
                                            value={variant.name_translations?.[activeLang] ?? ''}
                                            onChange={e => updateVariantLang(vIdx, activeLang, e.target.value)}
                                            placeholder={
                                                variant.type === 'Ukuran' ? '100ml / Large'
                                                : variant.type === 'Warna' ? 'Merah / Rouge'
                                                : 'Contoh nilai...'
                                            }
                                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-950"
                                        />
                                    </div>

                                    {/* SKU */}
                                    <div>
                                        <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">SKU Varian</label>
                                        <input
                                            type="text"
                                            value={variant.sku}
                                            onChange={e => updateVariantField(vIdx, 'sku', e.target.value)}
                                            placeholder="FYF-VAR-01"
                                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-950"
                                        />
                                    </div>

                                    {/* Price */}
                                    <div>
                                        <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">
                                            Harga (IDR) <span className="font-normal normal-case text-slate-400">— opsional</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formatPriceInput(variant.price)}
                                            onChange={e => updateVariantField(vIdx, 'price', parsePriceInput(e.target.value))}
                                            placeholder="Kosong = ikut harga induk"
                                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-blue-950"
                                        />
                                    </div>

                                    {/* Unit */}
                                    <div>
                                        <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">Satuan (Unit)</label>
                                        <select
                                            value={variant.unit_id}
                                            onChange={e => updateVariantField(vIdx, 'unit_id', e.target.value)}
                                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-950"
                                        >
                                            <option value="">Pilih satuan...</option>
                                            {units.map(u => (
                                                <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Sub-Varian Ukuran (jika bukan Ukuran utama) */}
                                    {variant.type !== 'Ukuran' && (
                                        <div className="sm:col-span-3 border-t border-slate-100 pt-3">
                                            {!variant.has_sub_size ? (
                                                <button
                                                    type="button"
                                                    onClick={() => updateVariantField(vIdx, 'has_sub_size', true)}
                                                    className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-2 text-xs font-bold text-blue-950 transition hover:bg-blue-100 hover:text-blue-900 active:scale-95 shadow-sm"
                                                >
                                                    <Plus className="h-3.5 w-3.5" /> Tambah Sub-Varian Ukuran
                                                </button>
                                            ) : (
                                                <div className="rounded-xl border border-amber-100 bg-amber-50/30 p-4 space-y-3 shadow-inner">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                                                            <Layers className="h-3.5 w-3.5 text-amber-500" />
                                                            Opsi Sub-Varian Ukuran & Satuan
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                updateVariantField(vIdx, 'has_sub_size', false);
                                                                updateVariantField(vIdx, 'sub_size', '');
                                                                updateVariantField(vIdx, 'unit_id', '');
                                                            }}
                                                            className="text-xs font-bold text-rose-500 hover:underline"
                                                        >
                                                            Hapus Ukuran
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                        <div>
                                                            <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Nilai Ukuran</label>
                                                            <input
                                                                type="text"
                                                                value={variant.sub_size || ''}
                                                                onChange={e => updateVariantField(vIdx, 'sub_size', e.target.value)}
                                                                placeholder="Contoh: 200, 500, dll."
                                                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-950"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Satuan (Unit)</label>
                                                            <select
                                                                value={variant.unit_id || ''}
                                                                onChange={e => updateVariantField(vIdx, 'unit_id', e.target.value)}
                                                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-950"
                                                            >
                                                                <option value="">Pilih satuan...</option>
                                                                {units.map(u => (
                                                                    <option key={u.id} value={u.id}>{u.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Variant Image */}
                                    <div className="sm:col-span-2">
                                        <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">Gambar Varian</label>
                                        <div className="flex items-center gap-3">
                                            {variant.imagePreview && (
                                                <div className="relative h-16 w-16 flex-shrink-0">
                                                    <img
                                                        src={variant.imagePreview}
                                                        alt="variant"
                                                        className="h-16 w-16 rounded-xl border border-slate-200 object-cover"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleVariantImage(vIdx, null)}
                                                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white shadow"
                                                    >
                                                        <X className="h-2.5 w-2.5" />
                                                    </button>
                                                </div>
                                            )}
                                            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-500 transition hover:border-blue-300 hover:text-blue-950">
                                                <Upload className="h-3.5 w-3.5" />
                                                {variant.imagePreview ? 'Ganti Gambar' : 'Upload Gambar'}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={e => {
                                                        const file = e.target.files[0];
                                                        if (file) handleVariantImage(vIdx, file);
                                                        e.target.value = '';
                                                    }}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Branch stocks */}
                                <div className="mt-4 border-t border-dashed border-slate-200 pt-3">
                                    <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                        Alokasi Stok Gudang Cabang
                                    </p>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                        {variant.branch_stocks.map((bStock, bIdx) => (
                                            <div
                                                key={bStock.store_branch_id}
                                                className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white p-2"
                                            >
                                                <span className="max-w-[80px] truncate text-[10px] font-bold text-slate-600">
                                                    Cabang {bStock.country_code || bStock.branch_name}
                                                </span>
                                                <input
                                                    type="number" min="0"
                                                    value={bStock.stock}
                                                    onChange={e => updateVariantStock(vIdx, bIdx, e.target.value)}
                                                    className="w-full rounded bg-slate-50 border px-1.5 py-1 text-center text-xs font-semibold outline-none focus:border-blue-950"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {data.variants.length === 0 && (
                        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-10 text-slate-400">
                            <Layers className="h-8 w-8 stroke-[1.5]" />
                            <p className="text-sm">Belum ada varian. Pilih tipe varian di atas untuk menambah.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
