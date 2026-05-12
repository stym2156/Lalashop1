"use client";
import React, { useEffect, useState } from "react";
import { ChevronRight, Check, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiClient } from "@/services/apiClient";

interface AddToStoreProps {
  onBack?: () => void;
}

interface RecommendedProduct {
  _id: string;
  name: string;
  price: number;
  compareAt?: number;
  image: string | string[];
  images?: string[];
  commissionType?: "percent" | "fixed";
  commissionValue?: number;
  rating?: number;
  soldCount?: number;
  freeShipping?: boolean;
}

const resolveImage = (p: RecommendedProduct): string => {
  if (Array.isArray(p.images) && p.images.length) return p.images[0];
  if (Array.isArray(p.image)) return p.image[0];
  return (p.image as string) || "";
};

const computeEarn = (p: RecommendedProduct): number => {
  const v = p.commissionValue || 0;
  if (!v) return 0;
  if (p.commissionType === "fixed") return v;
  return (p.price * v) / 100;
};

export default function AddToStore({ onBack: _onBack }: AddToStoreProps) {
  const { t } = useTranslation("common");
  const [products, setProducts] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());

  const fetchRecommended = async () => {
    setLoading(true);
    try {
      const res = await apiClient("/creator-products/recommended");
      setProducts(res?.data || []);
    } catch (err) {
      console.error("Failed to load recommended products", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommended();
  }, []);

  const handleAdd = async (id: string) => {
    setAdding(id);
    try {
      const res = await apiClient("/creator-products", {
        method: "POST",
        body: JSON.stringify({ productId: id }),
      });
      if (res?.success) {
        setAdded((prev) => new Set(prev).add(id));
        setTimeout(() => {
          setProducts((prev) => prev.filter((p) => p._id !== id));
        }, 1200);
      }
    } catch (err: any) {
      alert(err?.message || t("pages.creatorAddToStore2.failedAdd"));
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      <style jsx>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .item-fade-up {
          animation: fade-up 0.4s ease-out forwards;
          opacity: 0;
        }
      `}</style>

      <div className="space-y-1 pt-1">
        <div className="flex justify-between items-center px-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <h3 className="font-black text-lg text-slate-900 tracking-tighter">{t("pages.creatorAddToStore.recommendedProducts")}</h3>
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
            {t("pages.creatorAddToStore2.marketplace")} <ChevronRight size={12} />
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <Loader2 size={28} className="animate-spin text-slate-300" />
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm font-medium">
            {t("pages.creatorAddToStore2.noNewProducts")}
          </div>
        ) : (
          <div className="grid grid-cols-4 md:grid-cols-4 lg:grid-cols-7 gap-1 pb-8">
            {products.map((p, i) => {
              const earn = computeEarn(p);
              const img = resolveImage(p);
              const isAdded = added.has(p._id);
              const isAdding = adding === p._id;
              return (
                <div
                  key={p._id}
                  className="bg-white rounded-0xl shadow-sm overflow-hidden border border-slate-100 flex flex-col group cursor-pointer transition-all hover:shadow-md item-fade-up"
                  style={{ animationDelay: `${(i % 7) * 0.05}s` }}
                >
                  <div className="aspect-[4/5] bg-slate-100 relative overflow-hidden">
                    {img ? (
                      <img
                        src={img}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-200" />
                    )}
                  </div>
                  <div className="p-1 space-y-1 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-[9px] font-black text-slate-900 line-clamp-1 leading-tight tracking-tighter mb-1">
                        {p.name}
                      </p>

                      <div className="flex items-center gap-0.5 text-[7px] text-slate-400 font-bold mb-1">
                        <span className="text-amber-500">★</span>{" "}
                        {(p.rating || 0).toFixed(1)} | Sold {p.soldCount || 0}
                      </div>

                      {p.freeShipping && (
                        <div className="inline-block bg-slate-100 text-slate-600 text-[7px] font-black px-1 py-0.5 rounded mb-1">
                          {t("pages.creatorAddToStore2.freeShip")}
                        </div>
                      )}

                      <div className="border-t border-slate-50 pt-1.5 space-y-0.5">
                        {earn > 0 && (
                          <p className="text-[8px] font-black text-rose-500 tracking-tight">
                            Earn ฿{earn.toFixed(2)}
                          </p>
                        )}
                        <p className="text-[10px] font-black text-slate-900 tracking-tighter">
                          ฿{p.price.toLocaleString()}
                        </p>
                        {p.compareAt && p.compareAt > p.price && (
                          <div className="flex items-center gap-1.5">
                            <p className="text-[7px] text-slate-300 line-through">
                              ฿{p.compareAt.toLocaleString()}
                            </p>
                            <p className="text-[8px] font-black text-slate-400">
                              -{Math.round(((p.compareAt - p.price) / p.compareAt) * 100)}%
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleAdd(p._id)}
                      disabled={isAdding || isAdded}
                      className={`w-[95%] mx-auto py-1.5 text-white text-[8px] font-black rounded-xl mt-1 active:scale-95 transition-all tracking-widest shadow-lg flex items-center justify-center gap-1 ${
                        isAdded
                          ? "bg-emerald-500 shadow-emerald-500/20"
                          : "bg-primary shadow-primary/20"
                      } disabled:opacity-60`}
                    >
                      {isAdded ? (
                        <>
                          <Check size={10} /> Added
                        </>
                      ) : isAdding ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        "Add +"
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
