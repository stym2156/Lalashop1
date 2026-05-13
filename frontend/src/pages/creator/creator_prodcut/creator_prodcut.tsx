import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  Search,
  Copy,
  Share2,
  ExternalLink,
  LayoutGrid,
  List,
  CheckCircle2,
  Package,
  Trash2,
  Loader2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { categories } from "@/menu/manu";
import { apiClient } from "@/services/apiClient";

interface ProductRef {
  _id: string;
  name: string;
  price: number;
  image: string | string[];
  images?: string[];
  category: string;
  countInStock: number;
  soldCount?: number;
  commissionType?: "percent" | "fixed";
  commissionValue?: number;
}

interface CreatorProductRow {
  _id: string;
  affiliateCode: string;
  clicks: number;
  conversions: number;
  totalEarned: number;
  product: ProductRef;
}

interface CreatorProductProps {
  onBack: () => void;
}

const resolveImage = (p?: ProductRef): string => {
  if (!p) return "";
  if (Array.isArray(p.images) && p.images.length) return p.images[0];
  if (Array.isArray(p.image)) return p.image[0];
  return (p.image as string) || "";
};

const computeCommission = (p?: ProductRef): number => {
  if (!p) return 0;
  const v = p.commissionValue || 0;
  if (!v) return 0;
  if (p.commissionType === "fixed") return v;
  return (p.price * v) / 100;
};

export default function CreatorProduct({ onBack }: CreatorProductProps) {
  const { t } = useTranslation("common");
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [rows, setRows] = useState<CreatorProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMine = async () => {
    setLoading(true);
    try {
      const res = await apiClient("/creator-products/me");
      setRows(res?.data || []);
    } catch (err) {
      console.error("Failed to load creator products", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMine();
  }, []);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const p = r.product;
      if (!p) return false;
      const matchesCategory = activeCategory === "all" || p.category === activeCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [rows, activeCategory, searchQuery]);

  const buildAffiliateLink = (code: string): string => {
    if (typeof window === "undefined") return `/r/${code}`;
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") || "http://localhost:5000";
    return `${apiBase}/r/${code}`;
  };

  const copyToClipboard = (row: CreatorProductRow) => {
    const url = buildAffiliateLink(row.affiliateCode);
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(row._id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const shareLink = async (row: CreatorProductRow) => {
    const url = buildAffiliateLink(row.affiliateCode);
    const title = row.product?.name || t("pages.creatorProducts2.checkThis");
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title, url });
        return;
      } catch {
        /* user canceled */
      }
    }
    copyToClipboard(row);
  };

  const removeRow = async (row: CreatorProductRow) => {
    if (!confirm(t("pages.creatorProducts2.removeConfirm"))) return;
    try {
      await apiClient(`/creator-products/${row._id}`, { method: "DELETE" });
      setRows((prev) => prev.filter((r) => r._id !== row._id));
    } catch (err: any) {
      alert(err?.message || t("pages.creatorProducts2.failedRemove"));
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col">
      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        .animate-slide-up { animation: slideUp 0.4s ease-out forwards; }
      `}</style>

      <header className="bg-white border-b border-[#EEEEEE] px-4 py-4 flex items-center gap-4 sticky top-0 z-20">
        <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft size={24} className="text-slate-800" />
        </button>
        <h1 className="text-lg font-black text-slate-900 flex-1">{t("pages.creatorProducts.myProducts")}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
          >
            {viewMode === "grid" ? <List size={20} /> : <LayoutGrid size={20} />}
          </button>
        </div>
      </header>

      <div className="bg-white border-b border-[#EEEEEE] sticky top-[65px] z-10">
        <div className="px-4 py-3">
          <div className="relative group">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors"
              size={18}
            />
            <input
              type="text"
              placeholder={t("pages.creatorProducts2.searchProducts")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all"
            />
          </div>
        </div>

        <div className="flex overflow-x-auto px-4 pb-2 scrollbar-hide gap-2">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
              activeCategory === "all"
                ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200"
                : "bg-white border-gray-200 text-slate-500 hover:border-slate-300"
            }`}
          >
            {t("pages.creatorProducts2.allProducts", { count: rows.length })}
          </button>
          {categories.map((cat) => {
            const count = rows.filter((r) => r.product?.category === cat.slug).length;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.slug)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
                  activeCategory === cat.slug
                    ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200"
                    : "bg-white border-gray-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <main className="flex-1 p-2 md:p-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-slate-300" />
          </div>
        ) : filteredRows.length > 0 ? (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-1 md:gap-3"
                : "flex flex-col gap-3"
            }
          >
            {filteredRows.map((row, i) => {
              const p = row.product;
              const earn = computeCommission(p);
              const img = resolveImage(p);
              return (
                <div
                  key={row._id}
                  className="bg-white rounded-xl md:rounded-2xl border border-gray-100 overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all animate-slide-up"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className={viewMode === "grid" ? "flex flex-col" : "flex gap-4 p-3"}>
                    <div
                      className={`${
                        viewMode === "grid" ? "aspect-[4/5] w-full" : "w-24 h-24 flex-shrink-0"
                      } relative overflow-hidden bg-slate-50`}
                    >
                      {img ? (
                        <img
                          src={img}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-200" />
                      )}
                      <div className="absolute top-1 right-1 md:top-2 md:right-2 flex gap-1">
                        <button
                          onClick={() => copyToClipboard(row)}
                          className={`p-1.5 md:p-2 rounded-lg md:rounded-xl shadow-lg transition-all active:scale-90 ${
                            copiedId === row._id
                              ? "bg-green-500 text-white"
                              : "bg-white/90 backdrop-blur-sm text-slate-700 hover:bg-white"
                          }`}
                        >
                          {copiedId === row._id ? (
                            <CheckCircle2 size={12} className="md:w-4 md:h-4" />
                          ) : (
                            <Copy size={12} className="md:w-4 md:h-4" />
                          )}
                        </button>
                      </div>
                      {viewMode === "grid" && (
                        <div className="absolute bottom-1 left-1 bg-slate-900/80 backdrop-blur-sm text-white text-[7px] md:text-[9px] font-black px-1.5 py-0.5 rounded-md tracking-tight">
                          {p.category}
                        </div>
                      )}
                    </div>

                    <div
                      className={`p-2 md:p-3 flex-1 flex flex-col justify-between ${
                        viewMode === "list" ? "py-1" : ""
                      }`}
                    >
                      <div>
                        <h3 className="text-[9px] md:text-[11px] font-black text-slate-900 line-clamp-1 leading-tight mb-1 tracking-tighter">
                          {p.name}
                        </h3>

                        <div className="flex flex-col md:flex-row md:items-center gap-0.5 md:gap-3 mb-1.5 md:mb-3">
                          <div className="flex flex-col">
                            <span className="text-[7px] md:text-[9px] font-bold text-slate-400 tracking-widest leading-none">
                              {t("pages.creatorProducts2.price")}
                            </span>
                            <span className="text-[9px] md:text-[12px] font-black text-slate-900">
                              ฿{p.price.toLocaleString()}
                            </span>
                          </div>
                          <div className="hidden md:block w-px h-6 bg-slate-100" />
                          <div className="flex flex-col">
                            <span className="text-[7px] md:text-[9px] font-bold text-rose-400 tracking-widest leading-none">
                              {t("pages.creatorProducts2.earn")}
                            </span>
                            <span className="text-[9px] md:text-[12px] font-black text-rose-500">
                              ฿{earn.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 md:gap-3 text-[7px] md:text-[9px] font-bold text-slate-300">
                          <span className="flex items-center gap-0.5">
                            <Package size={8} className="md:w-3 md:h-3" /> {p.countInStock}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <ExternalLink size={8} className="md:w-3 md:h-3" /> {row.clicks}
                          </span>
                          <span className="flex items-center gap-0.5 text-emerald-500">
                            ✓ {row.conversions}
                          </span>
                        </div>

                        <div className="mt-1 text-[8px] md:text-[10px] font-mono text-slate-400 truncate">
                          /r/{row.affiliateCode}
                        </div>
                      </div>

                      <div className="mt-2 md:mt-3 pt-2 border-t border-slate-50 flex gap-1 md:gap-2">
                        <button
                          onClick={() => copyToClipboard(row)}
                          className="flex-1 bg-slate-900 text-white text-[7px] md:text-[9px] font-black py-1.5 md:py-2 rounded-lg md:rounded-xl tracking-widest active:scale-95 transition-all flex items-center justify-center gap-1"
                        >
                          <Copy size={10} className="md:w-3 md:h-3" />{" "}
                          {copiedId === row._id ? t("pages.creatorProducts2.done") : t("pages.creatorProducts2.link")}
                        </button>
                        <button
                          onClick={() => shareLink(row)}
                          className="p-1.5 md:p-2 bg-gray-50 text-slate-400 hover:text-slate-900 rounded-lg md:rounded-xl transition-all"
                          title={t("pages.creatorProducts2.share")}
                        >
                          <Share2 size={10} className="md:w-3 md:h-3" />
                        </button>
                        <button
                          onClick={() => removeRow(row)}
                          className="p-1.5 md:p-2 bg-gray-50 text-slate-400 hover:text-rose-500 rounded-lg md:rounded-xl transition-all"
                          title={t("pages.creatorProducts2.remove")}
                        >
                          <Trash2 size={10} className="md:w-3 md:h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl shadow-slate-100 mb-6">
              <Package size={40} className="text-slate-200" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">{t("pages.creatorProducts.noProductsYet")}</h3>
            <p className="text-sm text-slate-400 text-center max-w-[240px] font-medium">
              {t("pages.creatorProducts.addHint")}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
