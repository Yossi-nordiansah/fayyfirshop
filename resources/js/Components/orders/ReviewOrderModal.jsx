import React, { useEffect } from "react";
import { useForm } from "@inertiajs/react";
import { motion } from "framer-motion";
import { X, Star } from "lucide-react";
import { useLanguage } from "@/Contexts/LanguageContext";

export default function ReviewOrderModal({ isOpen, onClose, order }) {
    const { t } = useLanguage();

    const { data, setData, post, processing, reset, errors } = useForm({
        reviews: []
    });

    useEffect(() => {
        if (isOpen && order && order.items) {
            setData("reviews", order.items.map(item => ({
                product_id: item.product_id,
                product_variant_id: item.product_variant_id || null,
                title: item.product?.title || "Product",
                image: item.variant?.image || 
                       item.product?.images?.find(img => !!img.is_primary && img.is_primary !== '0' && img.is_primary !== 0)?.image_path ||
                       item.product?.images?.[0]?.image_path || 
                       item.product?.image || 
                       null,
                variantName: item.variant?.name || null,
                rating: 5,
                comment: ""
            })));
        }
    }, [isOpen, order]);

    if (!isOpen || !order) return null;

    const handleRatingChange = (index, ratingValue) => {
        const updated = [...data.reviews];
        updated[index].rating = ratingValue;
        setData("reviews", updated);
    };

    const handleCommentChange = (index, commentValue) => {
        const updated = [...data.reviews];
        updated[index].comment = commentValue;
        setData("reviews", updated);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("orders.reviews.store", order.id), {
            onSuccess: () => {
                reset();
                onClose();
            }
        });
    };

    return (
        <div onClick={(e) => e.stopPropagation()} className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-white border border-slate-100 rounded-3xl shadow-xl w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="font-bold text-base text-slate-950">
                        {t("orders.review_modal_title", "Nilai Produk")}
                    </h3>
                    <button
                        onClick={onClose}
                        type="button"
                        className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-6">
                    <p className="text-xs text-slate-500">
                        {t("orders.review_modal_desc", "Bagikan pengalaman Anda tentang produk yang dibeli agar membantu pelanggan lainnya.")}
                    </p>

                    <div className="space-y-6 divide-y divide-slate-100">
                        {data.reviews.map((reviewItem, index) => {
                            const imageSrc = reviewItem.image
                                ? reviewItem.image.startsWith("http") || reviewItem.image.startsWith("/")
                                    ? reviewItem.image
                                    : `/storage/${reviewItem.image}`
                                : null;

                            return (
                                <div key={index} className={`space-y-4 ${index > 0 ? "pt-5" : ""}`}>
                                    {/* Product Brief */}
                                    <div className="flex gap-3 items-center">
                                        <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            {imageSrc ? (
                                                <img
                                                    src={imageSrc}
                                                    alt={reviewItem.title}
                                                    className="max-w-full max-h-full object-contain rounded-lg"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-slate-200 rounded-lg" />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-800 line-clamp-1">
                                                {reviewItem.title}
                                            </h4>
                                            {reviewItem.variantName && (
                                                <p className="text-[10px] text-slate-500 mt-0.5">
                                                    {t("orders.variant")}: {reviewItem.variantName}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Star Rating Input */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                            {t("orders.review_rating_label", "Kualitas Produk")}
                                        </label>
                                        <div className="flex items-center gap-1.5">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => handleRatingChange(index, star)}
                                                    className="transition transform active:scale-90"
                                                >
                                                    <Star
                                                        size={24}
                                                        className={`${
                                                            star <= reviewItem.rating
                                                                ? "text-amber-400 fill-amber-400"
                                                                : "text-zinc-200"
                                                        } transition-colors duration-150`}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Review Text Comment Input */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                            {t("orders.review_comment_label", "Ulasan Anda (Opsional)")}
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={reviewItem.comment}
                                            onChange={(e) => handleCommentChange(index, e.target.value)}
                                            placeholder={t("orders.review_comment_placeholder", "Ceritakan detail produk (misal: wangi tahan lama, packing rapi, dll.)")}
                                            className="w-full border border-slate-200 rounded-2xl text-xs outline-none p-3 focus:border-blue-500 bg-slate-50/30 focus:bg-white transition"
                                            maxLength={1000}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-2xl text-xs transition"
                        >
                            {t("common.cancel", "Batal")}
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 py-3.5 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white font-bold rounded-2xl text-xs transition shadow-md"
                        >
                            {processing ? t("common.submitting", "Mengirim...") : t("orders.review_submit", "Kirim Penilaian")}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
