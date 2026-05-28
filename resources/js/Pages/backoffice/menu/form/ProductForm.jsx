import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Globe } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import ConfirmModal from '../../components/ConfirmModal';
import SuccessModal from '../../components/SuccessModal';

// Import modular components
import ProductInfoSection from './components/ProductInfoSection';
import ProductGallerySection from './components/ProductGallerySection';
import ProductVariantsSection from './components/ProductVariantsSection';
import ProductClassificationSection from './components/ProductClassificationSection';
import ProductFormActions from './components/ProductFormActions';


// ─── ProductForm (main) ───────────────────────────────────────────────────────
export default function ProductForm({
    product = null,
    categories = [],
    storeBranches = [],
    units = [],
    productNameTranslations = null,
    productDescTranslations = null,
    productVariants = [],
    initialStocks = [],
    productImages = [],
    status,
    statusAction,
}) {
    const isEditing = Boolean(product);

    const languageTabs = useMemo(() => [
        { id: 'indonesia', label: 'Indonesia' },
        { id: 'arabic',    label: 'Arab (العربية)' },
        { id: 'english',   label: 'English' },
    ], []);

    // ── local UI state ────────────────────────────────────────────────────────
    const [activeLang,          setActiveLang]          = useState('indonesia');
    const [selectedCategory,    setSelectedCategory]    = useState(product?.product_category_id ?? '');
    const [pendingDeleteVariant, setPendingDeleteVariant] = useState(null);
    const [showSuccessModal,    setShowSuccessModal]    = useState(
        (statusAction === 'created' || statusAction === 'updated') && Boolean(status),
    );

    // Image previews (existing first, then new uploads)
    const [imagePreviews, setImagePreviews] = useState(() =>
        productImages.map(img => `/storage/${img.image_path}`),
    );

    // Variant type selector
    const [pendingType,     setPendingType]     = useState('');
    const [showCustomType,  setShowCustomType]  = useState(false);
    const [customTypeValue, setCustomTypeValue] = useState('');
    const typeSelectRef = useRef(null);

    // ── derived data ──────────────────────────────────────────────────────────
    const availableSubCategories = useMemo(() => {
        const cat = categories.find(c => c.id === Number(selectedCategory));
        return cat?.subCategories ?? cat?.sub_categories ?? [];
    }, [selectedCategory, categories]);

    useEffect(() => {
        setShowSuccessModal((statusAction === 'created' || statusAction === 'updated') && Boolean(status));
    }, [status, statusAction]);

    const isEmpty = v => typeof v !== 'string' || v.trim() === '';

    const isLangMissing = (langKey) => {
        if (isEmpty(form.data.name_translations?.[langKey] ?? '')) return true;
        if (isEmpty(form.data.description_translations?.[langKey] ?? '')) return true;
        if (form.data.has_variants && form.data.variants.length > 0) {
            return form.data.variants.some(v => isEmpty(v.name_translations?.[langKey] ?? ''));
        }
        return false;
    };

    // ── form state ────────────────────────────────────────────────────────────
    const form = useForm({
        name_translations:        productNameTranslations ?? { indonesia: '', arabic: '', english: '' },
        description_translations: productDescTranslations ?? { indonesia: '', arabic: '', english: '' },
        product_category_id:      product?.product_category_id ?? '',
        product_sub_category_id:  product?.product_sub_category_id ?? '',
        sku:   product?.sku ?? '',
        price: product?.price ?? '',
        has_variants: productVariants.length > 0,

        // Gallery images
        images:               [],   // new File uploads
        primary_image_index:  productImages.findIndex(i => i.is_primary) >= 0
                                  ? productImages.findIndex(i => i.is_primary)
                                  : 0,
        existing_image_ids:   productImages.map(i => i.id),

        // Standard stock (no-variant mode)
        branch_stocks: storeBranches.map(branch => {
            const existing = initialStocks.find(s => s.store_branch_id === branch.id);
            return {
                store_branch_id: branch.id,
                branch_name: branch.name,
                country_code: branch.country_code,
                stock: existing?.stock ?? 0
            };
        }),

        // Variants
        variants: productVariants.map(v => {
            const parsedSubSize = v.unit_id ? (v.name_translations?.indonesia || v.name || '').match(/(\d+)/)?.[0] ?? '' : '';
            return {
                id:               v.id ?? null,
                type:             v.type ?? '',
                sku:              v.sku ?? '',
                price:            v.price ?? '',
                unit_id:          v.unit_id ?? '',
                image:            null,
                imagePreview:     v.image ? `/storage/${v.image}` : null,
                name_translations: v.name_translations ?? { indonesia: v.name ?? '', arabic: '', english: '' },
                has_sub_size:     v.unit_id ? true : false,
                sub_size:         parsedSubSize,
                branch_stocks:    storeBranches.map(branch => {
                    const existing = v.stocks?.find(s => s.store_branch_id === branch.id);
                    return {
                        store_branch_id: branch.id,
                        branch_name: branch.name,
                        country_code: branch.country_code,
                        stock: existing?.stock ?? 0
                    };
                }),
            };
        }),
    });

    // ── image handlers ────────────────────────────────────────────────────────
    const handleAddImages = (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        form.setData('images', [...form.data.images, ...files]);
        const newPreviews = files.map(f => URL.createObjectURL(f));
        setImagePreviews(prev => [...prev, ...newPreviews]);
        e.target.value = '';
    };

    const handleRemoveImage = (idx) => {
        const existingCount = form.data.existing_image_ids.length;
        if (idx < existingCount) {
            const newIds = [...form.data.existing_image_ids];
            newIds.splice(idx, 1);
            form.setData('existing_image_ids', newIds);
        } else {
            const newIdx = idx - existingCount;
            const newFiles = [...form.data.images];
            URL.revokeObjectURL(imagePreviews[idx]);
            newFiles.splice(newIdx, 1);
            form.setData('images', newFiles);
        }
        setImagePreviews(prev => {
            const next = [...prev];
            next.splice(idx, 1);
            return next;
        });
        if (form.data.primary_image_index >= idx && form.data.primary_image_index > 0) {
            form.setData('primary_image_index', form.data.primary_image_index - 1);
        }
    };

    const handleSetPrimary = (idx) => form.setData('primary_image_index', idx);

    // ── variant type handlers ─────────────────────────────────────────────────
    const handleTypeSelect = (e) => {
        const val = e.target.value;
        if (val === '__new__') {
            setShowCustomType(true);
            setPendingType('');
        } else {
            setShowCustomType(false);
            setPendingType(val);
        }
    };

    const addVariant = (type) => {
        if (!type.trim()) return;
        form.setData(data => ({
            ...data,
            has_variants: true,
            variants: [
                ...data.variants,
                {
                    id: null, type: type.trim(),
                    sku: '', price: '', unit_id: '',
                    image: null, imagePreview: null,
                    name_translations: { indonesia: '', arabic: '', english: '' },
                    has_sub_size: false,
                    sub_size: '',
                    branch_stocks: storeBranches.map(b => ({
                        store_branch_id: b.id,
                        branch_name: b.name,
                        country_code: b.country_code,
                        stock: 0,
                    })),
                },
            ],
        }));
        setPendingType('');
        setShowCustomType(false);
        setCustomTypeValue('');
        if (typeSelectRef.current) typeSelectRef.current.value = '';
    };

    // ── variant field updaters ────────────────────────────────────────────────
    const updateVariantField = (idx, field, value) => {
        const updated = [...form.data.variants];
        updated[idx] = { ...updated[idx], [field]: value };
        form.setData('variants', updated);
    };

    const updateVariantLang = (vIdx, langKey, value) => {
        const updated = [...form.data.variants];
        updated[vIdx] = {
            ...updated[vIdx],
            name_translations: { ...updated[vIdx].name_translations, [langKey]: value },
        };
        form.setData('variants', updated);
    };

    const updateVariantStock = (vIdx, bIdx, value) => {
        const updated = [...form.data.variants];
        updated[vIdx].branch_stocks[bIdx].stock = value === '' ? '' : (parseInt(value) >= 0 ? parseInt(value) : 0);
        form.setData('variants', updated);
    };

    const updateStandardStock = (bIdx, value) => {
        const updated = [...form.data.branch_stocks];
        updated[bIdx].stock = value === '' ? '' : (parseInt(value) >= 0 ? parseInt(value) : 0);
        form.setData('branch_stocks', updated);
    };

    const handleVariantImage = (vIdx, file) => {
        const updated = [...form.data.variants];
        if (updated[vIdx].image) URL.revokeObjectURL(updated[vIdx].imagePreview ?? '');
        updated[vIdx] = {
            ...updated[vIdx],
            image:        file,
            imagePreview: file ? URL.createObjectURL(file) : null,
        };
        form.setData('variants', updated);
    };

    const removeVariant   = (idx) => setPendingDeleteVariant(idx);

    const confirmRemoveVariant = () => {
        if (pendingDeleteVariant === null) return;
        const updated = form.data.variants.filter((_, i) => i !== pendingDeleteVariant);
        form.setData(data => ({ ...data, variants: updated, has_variants: updated.length > 0 }));
        setPendingDeleteVariant(null);
    };

    // ── category handler ──────────────────────────────────────────────────────
    const handleCategoryChange = (e) => {
        const value = e.target.value;
        setSelectedCategory(value);
        form.setData(data => ({ ...data, product_category_id: value, product_sub_category_id: '' }));
    };

    // ── submit ────────────────────────────────────────────────────────────────
    const submit = (e) => {
        e.preventDefault();

        // Transform data before sending
        form.transform((data) => {
            const cleanedBranchStocks = data.branch_stocks.map(bs => ({
                ...bs,
                stock: bs.stock === '' ? 0 : bs.stock
            }));

            const transformedVariants = data.variants.map((v) => {
                let nameTranslations = { ...v.name_translations };
                let varName = v.name_translations?.indonesia || '';

                if (v.type !== 'Ukuran' && v.has_sub_size && v.sub_size) {
                    const unitObj = units.find(u => Number(u.id) === Number(v.unit_id));
                    const unitName = unitObj ? unitObj.name : '';
                    const suffix = ` (${v.sub_size} ${unitName})`.trim();

                    const appendSuffix = (val) => {
                        if (!val) return '';
                        const cleanVal = val.replace(/\s*\(\d+\s*\w*\)\s*$/, '').replace(/\s*-\s*\d+\s*\w*\s*$/, '');
                        return `${cleanVal} ${suffix}`.trim();
                    };

                    nameTranslations = {
                        indonesia: appendSuffix(v.name_translations?.indonesia),
                        arabic:    appendSuffix(v.name_translations?.arabic),
                        english:   appendSuffix(v.name_translations?.english),
                    };
                    varName = nameTranslations.indonesia;
                }

                const cleanedVariantStocks = v.branch_stocks.map(bs => ({
                    ...bs,
                    stock: bs.stock === '' ? 0 : bs.stock
                }));

                return {
                    ...v,
                    name: varName,
                    name_translations: nameTranslations,
                    branch_stocks: cleanedVariantStocks
                };
            });

            return {
                ...data,
                branch_stocks: cleanedBranchStocks,
                variants: transformedVariants
            };
        });

        if (isEditing) {
            form.patch(route('backoffice.products.update', product.slug), { preserveScroll: true });
        } else {
            form.post(route('backoffice.products.store'), { preserveScroll: true });
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-950 selection:text-white">
            <Head title={isEditing ? 'Edit Produk — Fayyfir' : 'Tambah Produk — Fayyfir'} />

            <ConfirmModal
                show={pendingDeleteVariant !== null}
                title="Hapus Varian"
                message={`Hapus varian #${pendingDeleteVariant !== null ? pendingDeleteVariant + 1 : ''}? Stok cabang terkait juga akan dihapus.`}
                confirmLabel="Hapus"
                cancelLabel="Batal"
                onConfirm={confirmRemoveVariant}
                onCancel={() => setPendingDeleteVariant(null)}
            />
            <SuccessModal
                show={showSuccessModal}
                title={statusAction === 'updated' ? 'Produk Diperbarui' : 'Produk Ditambahkan'}
                message={status ?? ''}
                btnLabel="Selesai"
                onClose={() => setShowSuccessModal(false)}
            />

            <div className="flex min-h-screen">
                <Sidebar />
                <main className="flex min-w-0 flex-1 flex-col">
                    <Navbar />
                    <div className="flex-1 space-y-6 p-6 lg:p-8">

                        {/* ── Header ─────────────────────────────────────── */}
                        <section className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
                            <div>
                                <span className="text-xs font-bold uppercase tracking-widest text-amber-600">Fayyfir Management Suite</span>
                                <h1 className="mt-1 text-3xl font-black tracking-tight text-blue-950 lg:text-4xl">
                                    {isEditing ? 'Edit Premium Product' : 'Create Luxury Product'}
                                </h1>
                            </div>
                            <Link
                                href={route('backoffice.products.index')}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-blue-950 active:scale-95"
                            >
                                <ArrowLeft className="h-4 w-4" /> Kembali
                            </Link>
                        </section>

                        {/* ── Language Tabs ────────────────────────────── */}
                        <div className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/50 p-3 shadow-inner">
                            <div className="flex items-center gap-2 text-blue-950">
                                <Globe className="h-4 w-4 text-amber-500" />
                                <span className="text-xs font-bold uppercase tracking-wider">Lokalisasi Konten</span>
                            </div>
                            <div className="inline-flex gap-2 rounded-xl bg-white p-1.5 shadow-sm">
                                {languageTabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveLang(tab.id)}
                                        className={`relative rounded-lg px-4 py-2 text-xs font-black transition-all duration-300 ${
                                            activeLang === tab.id
                                                ? 'bg-blue-950 text-white shadow-md'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-blue-950'
                                        }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            {tab.label}
                                            {isLangMissing(tab.id) && (
                                                <span className="h-2 w-2 rounded-full bg-rose-500 ring-4 ring-rose-500/20" />
                                            )}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ── Form Grid ────────────────────────────────── */}
                        <form onSubmit={submit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">

                            {/* LEFT COLUMN */}
                            <div className="space-y-6 lg:col-span-2">
                                <ProductInfoSection
                                    activeLang={activeLang}
                                    data={form.data}
                                    setData={form.setData}
                                    errors={form.errors}
                                />

                                <ProductGallerySection
                                    previews={imagePreviews}
                                    primaryIndex={form.data.primary_image_index}
                                    onAdd={handleAddImages}
                                    onRemove={handleRemoveImage}
                                    onSetPrimary={handleSetPrimary}
                                />

                                <ProductVariantsSection
                                    data={form.data}
                                    setData={form.setData}
                                    units={units}
                                    activeLang={activeLang}
                                    storeBranches={storeBranches}
                                    pendingType={pendingType}
                                    setPendingType={setPendingType}
                                    showCustomType={showCustomType}
                                    setShowCustomType={setShowCustomType}
                                    customTypeValue={customTypeValue}
                                    setCustomTypeValue={setCustomTypeValue}
                                    typeSelectRef={typeSelectRef}
                                    handleTypeSelect={handleTypeSelect}
                                    addVariant={addVariant}
                                    removeVariant={removeVariant}
                                    updateVariantField={updateVariantField}
                                    updateVariantLang={updateVariantLang}
                                    updateVariantStock={updateVariantStock}
                                    updateStandardStock={updateStandardStock}
                                    handleVariantImage={handleVariantImage}
                                />
                            </div>

                            {/* RIGHT COLUMN (Sticky Sidebar Layout) */}
                            <div className="space-y-6 lg:sticky lg:top-24 self-start max-h-[calc(100vh-8rem)] overflow-y-auto pr-1">
                                <ProductClassificationSection
                                    data={form.data}
                                    setData={form.setData}
                                    errors={form.errors}
                                    categories={categories}
                                    availableSubCategories={availableSubCategories}
                                    handleCategoryChange={handleCategoryChange}
                                />

                                <ProductFormActions
                                    processing={form.processing}
                                    isEditing={isEditing}
                                />
                            </div>

                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
}