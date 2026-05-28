import { Head, Link, router } from '@inertiajs/react';
import { FolderTree, Plus, Search, Eye, Layers, Tag, Package, X, DollarSign, Edit3, Trash2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ConfirmModal from '../components/ConfirmModal';
import { useLanguage } from '@/Contexts/LanguageContext'; // Import hook bahasa

export default function ProductManagement({ products = [] }) {
    const { t } = useLanguage(); // Ambil fungsi t untuk lokalisasi
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [pendingDeleteProduct, setPendingDeleteProduct] = useState(null);

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
                                            <th className="px-6 py-4">{t('backoffice.product.th_product', 'Produk')}</th>
                                            <th className="px-6 py-4">{t('backoffice.product.th_sku', 'SKU Induk')}</th>
                                            <th className="px-6 py-4">{t('backoffice.product.th_classification', 'Klasifikasi')}</th>
                                            <th className="px-6 py-4 text-right">{t('backoffice.product.th_base_price', 'Base Price (IDR)')}</th>
                                            <th className="px-6 py-4">{t('backoffice.product.th_variant', 'Varian')}</th>
                                            <th className="px-6 py-4 text-center">{t('backoffice.product.th_actions', 'Actions')}</th>
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
                                                            <span className="font-bold text-blue-950 text-base">
                                                                {product.name_translations?.indonesia || product.name}
                                                            </span>
                                                            <span className="text-xs text-slate-400 font-normal">
                                                                {product.name_translations?.english || t('backoffice.product.no_translation', 'No English Translation')}
                                                            </span>
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
                                                                {product.category?.name || t('backoffice.product.uncategorized', 'Uncategorized')}
                                                            </span>
                                                            {product.sub_category && (
                                                                <span className="text-[11px] text-slate-400 font-normal">
                                                                    ↳ {product.sub_category.name}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-bold text-slate-900">
                                                        {formatIDR(product.price)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {product.variants && product.variants.length > 0 ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-700 shadow-sm">
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
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedProduct(product)}
                                                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-950 hover:text-blue-950 active:scale-90"
                                                                title={t('backoffice.product.tooltip_view', 'View Product Details')}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </button>

                                                            {/* Action Edit Button */}
                                                            <Link
                                                                href={route('backoffice.products.edit', product.slug)}
                                                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-950 hover:text-blue-950 active:scale-90"
                                                                title={t('backoffice.product.tooltip_edit', 'Edit Product')}
                                                            >
                                                                <Edit3 className="h-4 w-4" />
                                                            </Link>

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

            {/* Premium Detail Drawer / Modal Overlay */}
            <AnimatePresence>
                {selectedProduct && (
                    <>
                        {/* Backdrop Backdrop blur */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedProduct(null)}
                            className="fixed inset-0 z-50 bg-blue-950/40 backdrop-blur-xs"
                        />

                        {/* Modal Content Drawer */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-x-4 bottom-4 top-4 z-50 mx-auto max-w-2xl overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-2xl md:top-12 md:bottom-auto"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-950 text-amber-400 shadow-sm">
                                        <Package className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-blue-950">{t('backoffice.product.title.modal', 'Detail Informasi Produk')}</h2>
                                        <p className="text-xs text-slate-400 font-mono">{selectedProduct.sku}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedProduct(null)}
                                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Modal Body / Tab Konten */}
                            <div className="max-h-[75vh] overflow-y-auto p-6 space-y-6">
                                {/* Tab Bahasa Segment */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                                        <Tag className="h-3 w-3" /> {t('backoffice.product.modal.section_lang', 'Lokalisasi Konten Nama & Deskripsi')}
                                    </h3>
                                    <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-xs font-medium">
                                        <div>
                                            <span className="font-bold text-slate-400 block mb-0.5">🇮🇩 {t('backoffice.product.modal.lang_id', 'Indonesia')}:</span>
                                            <p className="text-blue-950 font-bold text-sm">{selectedProduct.name_translations?.indonesia || selectedProduct.name}</p>
                                            <p className="text-slate-500 mt-1">{selectedProduct.description_translations?.indonesia || selectedProduct.description || '-'}</p>
                                        </div>
                                        <div className="border-t border-slate-100 pt-2">
                                            <span className="font-bold text-slate-400 block mb-0.5">🇸🇦 {t('backoffice.product.modal.lang_ar', 'Arab (العربية)')}:</span>
                                            <p className="text-blue-950 font-bold text-sm" dir="rtl">{selectedProduct.name_translations?.arabic || '-'}</p>
                                            <p className="text-slate-500 mt-1" dir="rtl">{selectedProduct.description_translations?.arabic || '-'}</p>
                                        </div>
                                        <div className="border-t border-slate-100 pt-2">
                                            <span className="font-bold text-slate-400 block mb-0.5">🇬🇧 {t('backoffice.product.modal.lang_en', 'English')}:</span>
                                            <p className="text-blue-950 font-bold text-sm">{selectedProduct.name_translations?.english || '-'}</p>
                                            <p className="text-slate-500 mt-1">{selectedProduct.description_translations?.english || '-'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Kategori & Finansial */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-xl border border-slate-100 p-4 bg-slate-50/20">
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{t('backoffice.product.modal.category_class', 'Klasifikasi Kategori')}</span>
                                        <p className="text-sm font-bold text-blue-950">{selectedProduct.category?.name || t('backoffice.product.uncategorized', 'Uncategorized')}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{selectedProduct.sub_category?.name || t('backoffice.product.modal.no_subcategory', 'Tanpa Sub Kategori')}</p>
                                    </div>
                                    <div className="rounded-xl border border-slate-100 p-4 bg-slate-50/20">
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{t('backoffice.product.modal.centralized_price', 'Centralized Base Price')}</span>
                                        <p className="text-lg font-black text-blue-950">{formatIDR(selectedProduct.price)}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">{t('backoffice.product.modal.price_note', 'Disimpan dalam Rupiah (IDR) dan divalidasi otomatis.')}</p>
                                    </div>
                                </div>

                                {/* Matrix Varian Hub */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                                        <Layers className="h-3 w-3" /> {t('backoffice.product.modal.section_variant', 'Komposisi Varian & SKU Turunan')}
                                    </h3>
                                    {selectedProduct.variants && selectedProduct.variants.length > 0 ? (
                                        <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-white">
                                            {selectedProduct.variants.map((v, idx) => (
                                                <div key={v.id || idx} className="flex items-center justify-between p-3 text-xs">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-blue-950">
                                                            {v.name_translations?.indonesia || v.name}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-mono mt-0.5">{t('backoffice.product.th_sku', 'SKU Induk')}: {v.sku}</span>
                                                    </div>
                                                    <span className="font-bold text-slate-800 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                                                        {v.price ? formatIDR(v.price) : formatIDR(selectedProduct.price)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic bg-slate-50 rounded-xl p-3 border border-slate-100">
                                            {t('backoffice.product.modal.single_note', 'Produk ini dipasarkan sebagai produk tunggal tanpa opsi variasi ukuran atau rasa.')}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex justify-end border-t border-slate-100 bg-slate-50/50 px-6 py-3.5">
                                <button
                                    type="button"
                                    onClick={() => setSelectedProduct(null)}
                                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                                >
                                    {t('backoffice.product.modal.btn_close', 'Tutup Detail')}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}