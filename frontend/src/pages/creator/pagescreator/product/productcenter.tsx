"use client";
import React, { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ShoppingBag, Search, Filter, Sparkles, Star } from "lucide-react";
import { Product } from "@/types";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";

interface ToolkitProps {
    onBack: () => void;
}

const CATEGORIES = ["ALL", "ELECTRONICS", "FASHION", "BEAUTY", "HOME", "KITCHEN"];

export default function Marketplace({ onBack }: ToolkitProps) {
    const { t } = useTranslation("common");
    const router = useRouter();
    const [activeCategory, setActiveCategory] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [allProducts, setAllProducts] = useState<Product[]>([]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const { apiClient } = await import("@/services/apiClient");
                const data = await apiClient("/products");
                setAllProducts(Array.isArray(data) ? data : (data.data || []));
            } catch (error) {
                console.error("Error fetching products for marketplace:", error);
            }
        };

        fetchProducts();
    }, []);

    const filteredProducts = useMemo(() => {
        return allProducts.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
            if (activeCategory === "ALL") return matchesSearch;
            const categoryMap: { [key: string]: string[] } = {
                "ELECTRONICS": ["Electronics"],
                "FASHION": ["Apparel"],
                "BEAUTY": ["Beauty"],
                "HOME": ["Home"],
                "KITCHEN": ["Home"],
            };
            const targetCategories = categoryMap[activeCategory] || [];
            return matchesSearch && targetCategories.some(cat => product.category?.includes(cat));
        });
    }, [activeCategory, searchQuery, allProducts]);

    return (
        <div className="min-h-screen bg-[#F8F8F8] text-slate-900 antialiased w-full overflow-x-hidden">
            {/* Header */}
            <nav className="sticky top-0 z-50 bg-white border-b border-[#EEEEEE] w-full">
                <div className="flex items-center justify-between h-[60px] px-4">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-1 hover:bg-slate-100 rounded-full transition-all">
                            <ChevronLeft size={24} strokeWidth={2.5} className="text-slate-900" />
                        </button>
                        <h1 className="text-lg font-black tracking-tighter">{t("pages.creatorProductCenter.productDetail")}</h1>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl">
                        <ShoppingBag size={20} className="text-slate-900" />
                    </div>
                </div>

                <div className="px-4 pb-4">
                    <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-2.5 border border-slate-100 group focus-within:border-sky-500/50 focus-within:ring-4 focus-within:ring-sky-500/5 transition-all">
                        <Search size={18} className="text-slate-400 group-focus-within:text-sky-500" />
                        <input
                            type="text"
                            placeholder="SEARCH PRODUCTS..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent outline-none flex-1 text-[13px] font-bold py-1 placeholder:font-normal placeholder:text-slate-400"
                        />
                        <Filter size={18} className="text-slate-400 hover:text-sky-500 cursor-pointer transition-colors" />
                    </div>
                </div>
            </nav>

            <main className="w-full pb-20">
                {/* Categories */}
                <div className="bg-white border-b border-[#EEEEEE] flex gap-2 overflow-x-auto py-3 px-4 scrollbar-hide w-full">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-5 py-2 rounded-xl text-[10px] font-black whitespace-nowrap transition-all border ${activeCategory === cat
                                    ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200"
                                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="px-4 py-6 flex items-center justify-between bg-white">
                    <h2 className="text-xs font-black text-slate-900 flex items-center gap-2 tracking-[0.1em]">
                        <Sparkles size={14} className="text-amber-400 fill-amber-400" />
                        {activeCategory === "ALL" ? "TRENDING FOR YOU" : `${activeCategory} SELECTIONS`}
                    </h2>
                    <span className="text-[10px] font-bold text-slate-400">{filteredProducts.length} PRODUCTS</span>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-1 md:gap-3 px-1 md:px-4 w-full">
                    {filteredProducts.map((product) => {
                        const displayPrice = product.prices && product.prices.length > 0 
                            ? product.prices[0].price 
                            : (product.price || 0);
                        return (
                        <div
                            key={product._id}
                            onClick={() => router.push(`/product/${product._id}`)}
                            className="bg-white rounded-xl md:rounded-2xl border border-slate-100 flex flex-col group active:opacity-90 transition-all hover:shadow-xl hover:shadow-slate-200/50 overflow-hidden cursor-pointer"
                        >
                            {/* Image */}
                            <div className="aspect-[4/5] bg-slate-50 relative overflow-hidden">
                                <img
                                    src={Array.isArray(product.image) ? product.image[0] : product.image}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    alt={product.name}
                                />
                                {product.badge && (
                                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-[7px] font-black text-slate-900 tracking-tighter shadow-sm">
                                        {product.badge}
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="p-2 md:p-3 flex flex-col flex-1 justify-between gap-1.5">
                                <div className="space-y-1">
                                    <h3 className="text-[9px] md:text-[11px] font-black text-slate-900 line-clamp-1 leading-tight tracking-tighter">
                                        {product.name}
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-[7px] md:text-[8px] font-bold text-slate-400">
                                        <div className="flex items-center text-amber-400">
                                            <Star size={8} fill="currentColor" />
                                            <span className="ml-0.5 text-slate-600">4.8</span>
                                        </div>
                                        <span>|</span>
                                        <span>{product.salesVolume || "100+"} sold</span>
                                    </div>
                                    <div className="pt-1.5 border-t border-slate-50 space-y-0.5">
                                        <p className="text-[8px] md:text-[10px] font-black text-rose-500 tracking-tighter leading-none">
                                            Earn ฿{(displayPrice * 0.15).toFixed(2)}
                                        </p>
                                        <p className="text-[10px] md:text-[13px] font-black text-slate-900 tracking-tight leading-none">
                                            ฿{displayPrice.toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation(); // prevent card click when tapping Add
                                        // your add-to-cart logic here
                                    }}
                                    className="w-full py-1.5 md:py-2 bg-primary text-white text-[10px] md:text-[9px] font-black rounded-lg md:rounded-xl active:scale-95 transition-all  tracking-widest shadow-lg shadow-primary/20"
                                >
                                    Add +
                                </button>
                            </div>
                        </div>
                        );
                    })}
                </div>

                {filteredProducts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <Search size={24} className="text-slate-300" />
                        </div>
                        <h3 className="text-sm font-black text-slate-900">{t("pages.creatorProductCenter.noProductsFound")}</h3>
                        <p className="text-[11px] text-slate-500 mt-1">{t("pages.creatorProductCenter.trySearching")}</p>
                    </div>
                )}
            </main>
        </div>
    );
}