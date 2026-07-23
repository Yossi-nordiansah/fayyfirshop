import { Head, Link, router } from '@inertiajs/react';
import { FolderTree, Plus, Search, Eye, Layers, Package, Edit3, Trash2, Power } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ConfirmModal from '../components/ConfirmModal';
import SuccessModal from '../components/SuccessModal';
import { useLanguage } from '@/Contexts/LanguageContext'; // Import hook bahasa

export default function ProductManagement({ products = [], status, statusAction }) {
    const { t, locale } = useLanguage(); // Ambil fungsi t dan locale untuk lokalisasi
    const [searchQuery, setSearchQuery] = useState('');
    const [pendingDeleteProduct, setPendingDeleteProduct] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(Boolean(status));

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const searchParam = params.get('search');
        if (searchParam) {
            setSearchQuery(searchParam);
        }
    }, []);

    const removeProduct = (product) => {
        setPendingDeleteProduct(product);
    };

    const confirmRemoveProduct = () => {
        if (!pendingDeleteProduct) return;
        router.delete(route('backoffice.products.destroy', pendingDeleteProduct.slug), {
            preserveScroll: true,
        });
        setPendingDeleteProduct(null);
    };

    const toggleActive = (product) => {
        router.patch(route('backoffice.products.toggle-active', product.slug), {}, {
            preserveScroll: true,
        });
    };

    // Filter produk reaktif berdasarkan pencarian SKU atau nama (default Indonesia)
    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const nameMatch = product.name_translations?.indonesia
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase()) ??
                product.name?.toLowerCase().includes(searchQuery.toLowerCase());

            const skuMatch = product.sku?.toLowerCase().includes(searchQuery.toLowerCase());
            return nameMatch || skuMatch;
        });
    }, [searchQuery, products]);

    // Helper format mata uang rupiah sesuai aturan database (IDR Centralized)
    const formatIDR = (value) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(value);
    };

    // Helper to determine lowest price if variants exist, otherwise use base price
    const getDisplayPrice = (product) => {
        const variants = product.variants;
        const price = product.price;
        if (variants && variants.length > 0) {
            const hasChildren = variants.some(v => v.parent_id !== null && v.parent_id !== undefined);
            const targetVariants = hasChildren
                ? variants.filter(v => v.parent_id !== null && v.parent_id !== undefined)
                : variants;

            const prices = targetVariants
                .map(v => v.price)
                .filter(p => typeof p === 'number' && p > 0);

            if (prices.length > 0) {
                return Math.min(...prices);
            }
        }
        return price;
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-950 selection:text-white">
            <Head title={t('backoffice.product.title.page', 'Product Management')} />

            <ConfirmModal
                show={Boolean(pendingDeleteProduct)}
                title={t('backoffice.product.delete.title', 'Hapus Produk Premium')}
                message={`${t('backoffice.product.delete.confirm', 'Apakah Anda yakin ingin menghapus produk')} "${pendingDeleteProduct?.name_translations?.indonesia || pendingDeleteProduct?.title}"? ${t('backoffice.product.delete.message', 'Semua varian dan alokasi stok cabang terkait juga akan dihapus secara permanen.')}`}
                confirmLabel={t('backoffice.product.delete.btn_confirm', 'Hapus Produk')}
                cancelLabel={t('backoffice.product.btn_cancel', 'Batal')}
                onConfirm={confirmRemoveProduct}
                onCancel={() => setPendingDeleteProduct(null)}
            />

            <SuccessModal
                show={showSuccessModal}
                title={
                    statusAction === 'created'
                        ? t('backoffice.product.success.created', 'Produk Ditambahkan')
                        : statusAction === 'updated'
                            ? t('backoffice.product.success.updated', 'Produk Diperbarui')
                            : statusAction === 'deleted'
                                ? t('backoffice.product.success.deleted', 'Produk Dihapus')
                                : t('backoffice.product.success.generic', 'Berhasil')
                }
                message={status}
                btnLabel={t('backoffice.product.success.btn_ok', 'Selesai')}
                onClose={() => setShowSuccessModal(false)}
            />

            <div className="flex min-h-screen">
                <Sidebar />

                <main className="flex flex-col flex-1 min-w-0">
                    <Navbar />

                    <div className="flex-1 p-6 space-y-6 lg:p-8">
                        {/* Header Section */}
                        <section className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
                            <div>
                                <span className="text-xs font-bold uppercase tracking-widest text-amber-600">
                                    {t('backoffice.product.suite', 'Fayyfir Inventory Suite')}
                                </span>
                                <h1 className="text-3xl font-black tracking-tight text-blue-950 lg:text-4xl mt-1">
                                    {t('backoffice.product.title.page', 'Product Management')}
                                </h1>
                                <p className="mt-1 text-sm text-slate-500">
                                    {t('backoffice.product.subtitle', 'Kelola katalog produk, harga sentralisasi, kategori, dan struktur varian multi-bahasa.')}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <Link
                                    href={route('backoffice.product-categories.index')}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
                                >
                                    <FolderTree className="w-4 h-4 text-amber-500" />
                                    {t('backoffice.product.btn_category', 'Category Product')}
                                </Link>

                                {/* Button Add Product */}
                                <Link
                                    href={route('backoffice.products.create')}
                                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-950 to-blue-900 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-950/10 transition hover:opacity-95 active:scale-95"
                                >
                                    <Plus className="w-4 h-4 text-amber-400" />
                                    {t('backoffice.product.btn_add', 'Add Product')}
                                </Link>
                            </div>
                        </section>

                        {/* Search & Statistics Bar */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                            <div className="relative w-full md:max-w-md">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder={t('backoffice.product.search_placeholder', 'Cari berdasarkan nama produk atau SKU...')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-950 focus:bg-white focus:ring-4 focus:ring-blue-950/5"
                                />
                            </div>
                            <div className="text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                                {t('backoffice.product.total_data', 'Total Data')}: <span className="font-bold text-blue-950">{filteredProducts.length}</span> {t('backoffice.product.total_suffix', 'Produk')}
                            </div>
                        </div>

                        {/* Table Product Section */}
                        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left text-sm text-slate-600">
                                    <thead className="bg-slate-50/70 text-xs font-black uppercase tracking-wider text-blue-950 border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-4 text-nowrap">{t('backoffice.product.th_product', 'Produk')}</th>
                                            <th className="px-6 py-4 text-nowrap">{t('backoffice.product.th_sku', 'SKU Induk')}</th>
                                            <th className="px-6 py-4 text-nowrap">{t('backoffice.product.th_classification', 'Klasifikasi')}</th>
                                            <th className="px-6 py-4 text-nowrap text-right">{t('backoffice.product.th_base_price', 'Base Price (IDR)')}</th>
                                            <th className="px-6 py-4 text-nowrap">{t('backoffice.product.th_variant', 'Varian')}</th>
                                            <th className="px-6 py-4 text-nowrap text-center">{t('backoffice.product.th_actions', 'Actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                        {filteredProducts.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                                                    <div className="flex flex-col items-center justify-center gap-2">
                                                        <Package className="h-8 w-8 text-slate-300 stroke-[1.5]" />
                                                        <p className="text-sm font-medium">{t('backoffice.product.empty_state', 'Belum ada data produk atau pencarian tidak ditemukan.')}</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredProducts.map((product) => (
                                                <tr key={product.id} className="hover:bg-slate-50/50 transition duration-150">
                                                    <td className="px-6 py-4">
                                                         <div className="flex flex-col">
                                                             <div className="flex items-center flex-wrap gap-2">
                                                                 {product.name_translations?.[locale]?.trim() ? (
                                                                     <span className="font-bold text-blue-950 text-base">
                                                                         {product.name_translations[locale]}
                                                                     </span>
                                                                 ) : (
                                                                     <div className="flex flex-col">
                                                                         <span className="font-bold text-rose-600 text-sm italic">
                                                                             {locale === 'english'
                                                                                 ? '(no title in English)'
                                                                                 : locale === 'arabic'
                                                                                 ? '(لا يوجد عنوان باللغة العربية)'
                                                                                 : '(tidak ada judul di bahasa Indonesia)'}
                                                                         </span>
                                                                         <span className="text-xs text-slate-400 font-normal">
                                                                             Fallback: {product.name_translations?.indonesia || product.title || 'Unnamed Product'}
                                                                         </span>
                                                                     </div>
                                                                 )}
                                                                 {product.is_active ? (
                                                                     <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                                                                         {t('backoffice.product.active', 'Aktif')}
                                                                     </span>
                                                                 ) : (
                                                                     <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 ring-1 ring-inset ring-slate-500/10">
                                                                         {t('backoffice.product.inactive', 'Nonaktif')}
                                                                     </span>
                                                                 )}
                                                             </div>
                                                         </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700 font-mono">
                                                            {product.sku}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                         <div className="flex flex-col gap-0.5">
                                                             <span className="text-xs font-bold text-slate-800">
                                                                 {product.category?.name_translations?.[locale] || product.category?.name || t('backoffice.product.uncategorized', 'Uncategorized')}
                                                             </span>
                                                             {product.sub_category && (
                                                                 <span className="text-[11px] text-slate-400 font-normal">
                                                                     ↳ {product.sub_category.name_translations?.[locale] || product.sub_category.name}
                                                                 </span>
                                                             )}
                                                         </div>
                                                     </td>
                                                    <td className="px-6 py-4 text-right font-bold text-slate-900">
                                                         {formatIDR(getDisplayPrice(product))}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {product.variants && product.variants.length > 0 ? (
                                                            <span className="inline-flex text-nowrap items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-700 shadow-sm">
                                                                <Layers className="h-3 w-3" />
                                                                {product.variants.length} {t('backoffice.product.variant_suffix', 'Varian')}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-slate-400 italic">{t('backoffice.product.single_product', 'Tunggal')}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                         <div className="flex justify-center gap-2">
                                                             {/* Action View Button */}
                                                             <Link
                                                                 href={route('backoffice.products.show', product.slug)}
                                                                 className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-950 hover:text-blue-950 active:scale-90"
                                                                 title={t('backoffice.product.tooltip_view', 'View Product Details')}
                                                             >
                                                                 <Eye className="h-4 w-4" />
                                                             </Link>

                                                             {/* Action Edit Button */}
                                                             <Link
                                                                 href={route('backoffice.products.edit', product.slug)}
                                                                 className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-950 hover:text-blue-950 active:scale-90"
                                                                 title={t('backoffice.product.tooltip_edit', 'Edit Product')}
                                                             >
                                                                 <Edit3 className="h-4 w-4" />
                                                             </Link>

                                                             {/* Action Toggle Active Button */}
                                                             <button
                                                                 type="button"
                                                                 onClick={() => toggleActive(product)}
                                                                 className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border shadow-sm transition active:scale-90 ${
                                                                     product.is_active
                                                                         ? 'border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white hover:border-emerald-600'
                                                                         : 'border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600'
                                                                 }`}
                                                                 title={
                                                                     product.is_active
                                                                         ? t('backoffice.product.tooltip_deactivate', 'Deactivate Product')
                                                                         : t('backoffice.product.tooltip_activate', 'Activate Product')
                                                                 }
                                                             >
                                                                 <Power className="h-4 w-4" />
                                                             </button>

                                                             {/* Action Delete Button */}
                                                             <button
                                                                 type="button"
                                                                 onClick={() => removeProduct(product)}
                                                                 className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-100 bg-white text-rose-600 shadow-sm transition hover:border-rose-600 hover:text-white hover:bg-rose-600 active:scale-90"
                                                                 title={t('backoffice.product.tooltip_delete', 'Delete Product')}
                                                             >
                                                                 <Trash2 className="h-4 w-4" />
                                                             </button>
                                                         </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}