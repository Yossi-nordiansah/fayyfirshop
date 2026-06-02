import React, { useRef } from 'react';
import { ImageIcon, Upload, X, Star } from 'lucide-react';

// ─── ImageUploadZone ──────────────────────────────────────────────────────────
function ImageUploadZone({ previews = [], primaryIndex = 0, onAdd, onRemove, onSetPrimary, t }) {
    const inputRef = useRef(null);

    return (
        <div className="space-y-3">
            <div
                onClick={() => inputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-8 text-slate-400 transition hover:border-blue-300 hover:bg-blue-50/30 hover:text-blue-950"
            >
                <Upload className="h-7 w-7 stroke-[1.5]" />
                <div className="text-center">
                    <p className="text-sm font-bold">{t('backoffice.product.form.gallery_click_upload', 'Klik untuk upload foto produk')}</p>
                    <p className="text-xs">{t('backoffice.product.form.gallery_types', 'JPG, PNG, WEBP — bisa pilih beberapa sekaligus')}</p>
                </div>
                <input ref={inputRef} type="file" multiple accept="image/*" className="hidden" onChange={onAdd} />
            </div>

            {previews.length > 0 && (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                    {previews.map((src, idx) => (
                        <div key={idx} className="group relative aspect-square">
                            <img
                                src={src}
                                alt={t('backoffice.product.form.gallery_photo_alt', 'Foto {number}').replace('{number}', idx + 1)}
                                className={`h-full w-full rounded-xl object-cover border-2 transition ${
                                    idx === primaryIndex
                                        ? 'border-amber-400 ring-2 ring-amber-400/30'
                                        : 'border-slate-100'
                                }`}
                            />
                            {idx === primaryIndex && (
                                <div className="absolute left-1.5 top-1.5 flex items-center gap-0.5 rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-black text-white shadow">
                                    <Star className="h-2 w-2" /> {t('backoffice.product.form.gallery_main_badge', 'Main')}
                                </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center gap-1.5 rounded-xl bg-blue-950/60 opacity-0 transition group-hover:opacity-100">
                                {idx !== primaryIndex && (
                                    <button
                                        type="button"
                                        onClick={() => onSetPrimary(idx)}
                                        title={t('backoffice.product.form.gallery_set_primary', 'Jadikan foto utama')}
                                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400 text-white shadow"
                                    >
                                        <Star className="h-3.5 w-3.5" />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => onRemove(idx)}
                                    title={t('backoffice.product.form.gallery_remove_photo', 'Hapus foto')}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500 text-white shadow"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Component 2: Galeri Produk ───────────────────────────────────────────────
export default function ProductGallerySection({ previews, primaryIndex, onAdd, onRemove, onSetPrimary, t }) {
    return (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-3">
                <ImageIcon className="h-5 w-5 text-amber-500" />
                <h3 className="text-base font-bold text-blue-950">{t('backoffice.product.form.gallery_title', 'Galeri Produk')}</h3>
                <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-500">
                    {t('backoffice.product.form.gallery_photo_count', '{count} foto').replace('{count}', previews.length)}
                </span>
            </div>
            <ImageUploadZone
                previews={previews}
                primaryIndex={primaryIndex}
                onAdd={onAdd}
                onRemove={onRemove}
                onSetPrimary={onSetPrimary}
                t={t}
            />
        </div>
    );
}
