import React, { useMemo, useState, useEffect } from "react";
import { X, Minus, Plus, ShieldCheck, ChevronRight, CreditCard, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ProductData } from "../product/types";

interface BuyPopupProps {
    product: ProductData;
    isOpen: boolean;
    onClose: () => void;
    initialQty?: number;
    selectedPrice?: number;
}

interface SelectedVariants {
    [optionName: string]: string;
}

interface ProductTier {
    minQty: number;
    price: number;
    discountPercent?: number;
}

export default function BuyPopup({ product, isOpen, onClose, initialQty = 1 }: BuyPopupProps) {
    const { t } = useTranslation("common");
    const [qty, setQty] = useState(initialQty);
    const [selectedVariants, setSelectedVariants] = useState<SelectedVariants>({});
    const [loading, setLoading] = useState(false);

    const basePrice = typeof product.price === "number" ? product.price : 0;

    // Variant options from product (replaces the hardcoded color/size lists)
    const variantOptions = useMemo<Array<{ name: string; values: string[] }>>(() => {
        const v: any = (product as any).variantOptions;
        if (!Array.isArray(v)) return [];
        return v.filter((opt) => opt?.name && Array.isArray(opt.values) && opt.values.length > 0);
    }, [product]);

    // Bulk-discount tiers from the seller (sorted ascending by minQty)
    const tiers = useMemo<ProductTier[]>(() => {
        const t: any = (product as any).tiers;
        if (!Array.isArray(t)) return [];
        return t
            .map((row): ProductTier => ({
                minQty: Number(row.minQty) || 0,
                price: Number(row.price) || 0,
                discountPercent: Number(row.discountPercent) || 0,
            }))
            .filter((row) => row.minQty > 0)
            .sort((a, b) => a.minQty - b.minQty);
    }, [product]);

    // Compute price for current quantity using tier pricing.
    const calculatePrice = (q: number): number => {
        // Legacy `prices: [{ range, price }]` support, kept for older products
        if (Array.isArray(product.prices) && product.prices.length > 0) {
            const sorted = [...product.prices].sort((a, b) => {
                const valA = parseInt(a.range.replace(/\D/g, "")) || 0;
                const valB = parseInt(b.range.replace(/\D/g, "")) || 0;
                return valB - valA;
            });
            const matched = sorted.find((tier) => {
                const minQty = parseInt(tier.range.replace(/\D/g, "")) || 0;
                return q >= minQty;
            });
            if (matched) return matched.price;
        }

        if (tiers.length > 0) {
            const eligible = [...tiers].reverse().find((t) => q >= t.minQty);
            if (eligible) {
                if (eligible.price > 0) return eligible.price;
                if (eligible.discountPercent && basePrice > 0) {
                    return Math.round(basePrice * (1 - eligible.discountPercent / 100));
                }
            }
        }

        return basePrice;
    };

    const currentPrice = useMemo(() => calculatePrice(qty), [qty, product, tiers]);

    const currentDiscountPct = useMemo(() => {
        if (basePrice <= 0 || currentPrice >= basePrice) return 0;
        return Math.round(((basePrice - currentPrice) / basePrice) * 100);
    }, [basePrice, currentPrice]);

    // Reset state when popup opens
    useEffect(() => {
        if (!isOpen) return;
        setQty(initialQty);
        const initial: SelectedVariants = {};
        variantOptions.forEach((opt) => {
            if (opt.values[0]) initial[opt.name] = opt.values[0];
        });
        setSelectedVariants(initial);
    }, [isOpen, initialQty, variantOptions]);

    if (!isOpen) return null;

    const rating = Number((product as any)?.rating) || 0;
    const numReviews = Number((product as any)?.numReviews) || 0;
    const soldCount = Number((product as any)?.soldCount) || 0;

    const productImage = Array.isArray(product.image) ? product.image[0] : product.image;

    const handleConfirm = async () => {
        setLoading(true);
        await new Promise((r) => setTimeout(r, 600));
        setLoading(false);

        const variantSummary = Object.entries(selectedVariants)
            .map(([k, v]) => `${k}:${v}`)
            .join("|");

        // The /products/:id endpoint populates `seller` into a full user object
        // ({ _id, name, username, profileImage, ... }). Strip down to the raw
        // ObjectId string before stuffing into the URL — otherwise the order
        // POST receives "[object Object]" and Mongoose ObjectId cast fails.
        const sellerRaw: any = (product as any).seller;
        const sellerId =
            typeof sellerRaw === "string"
                ? sellerRaw
                : String(sellerRaw?._id || sellerRaw?.id || "");

        const params = new URLSearchParams({
            id: String(product._id || product.id || ""),
            qty: qty.toString(),
            variants: variantSummary,
            color: selectedVariants["Color"] || "",
            size: selectedVariants["Size"] || "",
            price: currentPrice.toString(),
            name: String(product.name || ""),
            description: String(product.description || ""),
            image: String(productImage || ""),
            category: String(product.category || ""),
            seller: sellerId,
        });
        window.location.href = `/buyproduct/payment?${params.toString()}`;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl overflow-y-auto max-h-[92vh] shadow-2xl border-t border-gray-100 pb-24 sm:pb-0"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50">
                            <div className="flex items-center gap-2.5" />
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                            >
                                <X size={20} className="text-gray-600" />
                            </motion.button>
                        </div>

                        {/* Body */}
                        <div className="px-5 py-5 space-y-6">
                            {/* Product summary */}
                            
                            <div className="flex gap-4 items-start p-3 bg-white  rounded-lg">
                                
                                <div className="w-20 h-20 rounded  flex-shrink-0 overflow-hidden bg-gray-50">
                                    {productImage ? (
                                        <img src={productImage} alt={product.name} className="w-full h-full object-cover" />
                                    ) : null}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-dark text-[14px] line-clamp-2">
                                        {product.name}
                                    </h4>
                                    {/* Rating + sold */}
                                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-semibold">
                                        <span className="flex items-center gap-1 text-[#f59e0b]">
                                            <Star size={11} fill="currentColor" />
                                            <span className="text-slate-700 font-bold">
                                                {rating > 0 ? rating.toFixed(1) : "—"}
                                            </span>
                                        </span>
                                        <span className="text-slate-400">·</span>
                                        <span>{numReviews} review{numReviews === 1 ? "" : "s"}</span>
                                        <span className="text-slate-400">·</span>
                                        <span>{soldCount.toLocaleString()} sold</span>
                                    </div>
                                    
                                    <p className="text-primary font-bold text-[16px] mt-1">
                                        ฿{currentPrice.toLocaleString()}
                                        {currentDiscountPct > 0 && (
                                            <>
                                                <span className="ml-2 text-[12px] text-gray-400 font-medium line-through">
                                                    ฿{basePrice.toLocaleString()}
                                                </span>
                                                <span className="ml-2 inline-flex text-[10px] font-bold text-white bg-rose-500 rounded px-1.5 py-0.5 align-middle">
                                                    -{currentDiscountPct}%
                                                </span>
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Description */}
                            {product.description && (
                                <div>
                                    <span className="text-[13px] font-bold text-gray-500 block mb-1.5">{t("product.description")}</span>
                                    <p className="text-[12px] leading-relaxed text-slate-600 whitespace-pre-line">
                                        {product.description}
                                    </p>
                                </div>
                            )}

                            {/* Variant options driven by seller */}
                            {variantOptions.length > 0 ? (
                                <div className="space-y-5">
                                    {variantOptions.map((opt) => (
                                        <div key={opt.name} className="space-y-3">
                                            <span className="text-[13px] font-bold text-gray-500">
                                                {opt.name}
                                                {selectedVariants[opt.name] && (
                                                    <span className="ml-1.5 text-slate-700 font-semibold">
                                                        : {selectedVariants[opt.name]}
                                                    </span>
                                                )}
                                            </span>
                                            <div className="flex flex-wrap gap-2">
                                                {opt.values.map((value) => {
                                                    const active = selectedVariants[opt.name] === value;
                                                    return (
                                                        <button
                                                            key={value}
                                                            type="button"
                                                            onClick={() =>
                                                                setSelectedVariants((prev) => ({ ...prev, [opt.name]: value }))
                                                            }
                                                            className={`min-w-[48px] px-3 py-1.5 rounded text-[13px] font-bold border transition-all ${
                                                                active
                                                                    ? "border-primary bg-primary text-white"
                                                                    : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white"
                                                            }`}
                                                        >
                                                            {value}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[12px] text-slate-400">
                                    This product has no selectable variants.
                                </p>
                            )}

                            {/* Bulk discount table */}
                            {tiers.length > 0 && basePrice > 0 && (
                                <div className="rounded-lg border border-sky-100 bg-sky-50/40 p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[11px] font-black tracking-widest text-sky-700">
                                            BULK DISCOUNT
                                        </span>
                                        {currentDiscountPct > 0 ? (
                                            <span className="text-[10px] font-bold text-sky-700">
                                                You save {currentDiscountPct}% at this qty
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-medium text-slate-500">
                                                Add more to unlock discounts
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        {tiers.map((t, i) => {
                                            const tierPrice = t.price > 0
                                                ? t.price
                                                : t.discountPercent
                                                    ? Math.round(basePrice * (1 - (t.discountPercent || 0) / 100))
                                                    : basePrice;
                                            const pct = t.discountPercent && t.discountPercent > 0
                                                ? t.discountPercent
                                                : basePrice > 0
                                                    ? Math.max(0, Math.round(((basePrice - tierPrice) / basePrice) * 100))
                                                    : 0;
                                            const reached = qty >= t.minQty;
                                            return (
                                                <div
                                                    key={i}
                                                    className={`flex items-center justify-between text-[12px] font-semibold rounded px-2 py-1.5 ${
                                                        reached ? "bg-white shadow-sm border border-sky-200" : ""
                                                    }`}
                                                >
                                                    <span className="text-slate-700">Buy {t.minQty}+ pcs</span>
                                                    <span className="flex items-center gap-2">
                                                        <span className="line-through text-gray-400 font-medium">
                                                            ฿{basePrice.toLocaleString()}
                                                        </span>
                                                        <span className="text-sky-700 font-black">
                                                            ฿{tierPrice.toLocaleString()}
                                                        </span>
                                                        {pct > 0 && (
                                                            <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white text-[10px] font-bold">
                                                                -{pct}%
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Quantity */}
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-dark text-[14px]">{t("product.quantity")}</span>
                                <div className="flex items-center gap-2">
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setQty(Math.max(1, qty - 1))}
                                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded"
                                    >
                                        <Minus size={14} strokeWidth={3} />
                                    </motion.button>
                                    <div className="min-w-[2rem] flex justify-center items-center">
                                        <AnimatePresence mode="wait">
                                            <motion.span
                                                key={qty}
                                                initial={{ y: 5, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                className="font-bold text-[16px] text-dark"
                                            >
                                                {qty}
                                            </motion.span>
                                        </AnimatePresence>
                                    </div>
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setQty(qty + 1)}
                                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded"
                                    >
                                        <Plus size={14} strokeWidth={3} />
                                    </motion.button>
                                </div>
                            </div>

                            {/* Total */}
                            <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-gray-900">{t("cart.totalAmount")}</span>
                                    <span className="text-[20px] font-bold text-primary">
                                        ฿{(currentPrice * qty).toLocaleString()}
                                    </span>
                                </div>
                                {currentDiscountPct > 0 && (
                                    <div className="text-[11px] text-slate-500 mt-1 text-right">
                                        Saved ฿{((basePrice - currentPrice) * qty).toLocaleString()} on this order
                                    </div>
                                )}
                            </div>

                            {/* Trust */}
                            <div className="flex justify-center border-t border-gray-100 pt-4">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <ShieldCheck size={14} className="text-primary" />
                                    <span className="text-[11px] font-bold">{t("product.qualitySourcing")}</span>
                                </div>
                            </div>
                        </div>

                        {/* Action */}
                        <div className="px-5 pb-8">
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                disabled={loading}
                                className="w-full bg-primary text-white font-bold py-4 rounded-lg shadow-md transition-all text-[16px] flex items-center justify-center gap-2 hover:bg-primary-hover disabled:opacity-70 disabled:cursor-not-allowed"
                                onClick={handleConfirm}
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <CreditCard size={18} />
                                        <span>{t("actions.buy")}</span>
                                        <ChevronRight size={18} strokeWidth={3} />
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
