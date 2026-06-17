import React from "react";

export default function SummaryItem({ item, locale, formatNumber, formatPrice, t }) {
    return (
        <div className="flex gap-3 text-xs items-center">
            <img
                src={item.image}
                alt={item.title}
                className="w-12 h-12 object-cover rounded-xl bg-slate-50 border border-slate-100 shrink-0 shadow-sm"
            />
            <div className="min-w-0 flex-1">
                <h4 className="font-bold text-slate-900 truncate">
                    {item.title_translations?.[locale] || item.title}
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate font-medium">
                    {item.variantNameTranslations?.[locale] || item.variantName ? (
                        `${item.variantNameTranslations?.[locale] || item.variantName}`
                    ) : (
                        item.color ? `${t("product.color", "Color")}: ${item.color}` : ''
                    )}
                    {item.subVariantNameTranslations?.[locale] || item.subVariantName ? (
                        ` | ${t("product.size", "Size")}: ${item.subVariantNameTranslations?.[locale] || item.subVariantName}`
                    ) : (
                        item.size ? ` | ${item.size}` : ''
                    )}
                    <span className="text-amber-600 font-bold ml-1">
                        {` x ${formatNumber(item.quantity)}`}
                    </span>
                </p>
            </div>
            <span className="font-extrabold text-slate-900 text-right shrink-0">
                {formatPrice(item.price * item.quantity)}
            </span>
        </div>
    );
}
