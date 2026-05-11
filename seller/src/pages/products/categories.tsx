import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, Loader2, Layers, Package } from "lucide-react";
import { fetchMyProducts, type SellerProductRow } from "@/services/sellerApi";

const SellerCategoriesPage: React.FC = () => {
  const { t } = useTranslation("common");
  const [products, setProducts] = useState<SellerProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchMyProducts()
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const groups = useMemo(() => {
    const map = new Map<string, SellerProductRow[]>();
    for (const p of products) {
      const cat = p.category || "Uncategorized";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    }
    return Array.from(map.entries())
      .filter(([cat]) => !q || cat.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => b[1].length - a[1].length);
  }, [products, q]);

  return (
    <div className="space-y-4 text-sm">
      <div>
        <h1 className="text-[16px] font-bold text-gray-900">{t('pages.categoriesPage.title')}</h1>
        <p className="text-[12px] text-gray-500 mt-0.5">
          {t('pages.categoriesPage.subtitle')}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[11px] text-gray-500">
          {t('pages.categoriesPage.summary', { products: products.length, groups: groups.length, count: products.length })}
        </span>
        <div className="ml-auto relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('pages.categoriesPage.searchPlaceholder')}
            className="pl-7 pr-3 py-1 rounded text-[11px] w-64 bg-gray-50 border border-gray-100 focus:border-[#00aeff] outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="py-12 text-center text-gray-400 text-[12px]">
          <Loader2 className="w-5 h-5 mx-auto animate-spin" />
        </div>
      ) : groups.length === 0 ? (
        <div className="py-12 text-center text-gray-400 text-[12px]">
          <Layers className="w-6 h-6 mx-auto mb-2 text-gray-300" />
          {t('pages.categoriesPage.noCategories')}
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map(([cat, list]) => (
            <div key={cat} className="rounded-lg border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#00aeff]" />
                  <h3 className="text-[13px] font-bold text-gray-900">{cat}</h3>
                </div>
                <span className="text-[11px] font-bold text-gray-500">
                  {t('pages.categoriesPage.productCount', { count: list.length })}
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {list.slice(0, 8).map((p) => (
                  <div key={p._id} className="px-4 py-2 flex items-center gap-3">
                    <Package className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                    <p className="text-[12px] text-gray-700 line-clamp-1 flex-1">{p.name}</p>
                    <p className="text-[11px] font-bold text-gray-900 tabular-nums">
                      ฿{Number(p.price || 0).toLocaleString()}
                    </p>
                  </div>
                ))}
                {list.length > 8 && (
                  <div className="px-4 py-2 text-[11px] text-gray-400 italic">
                    {t('pages.categoriesPage.moreItems', { count: list.length - 8 })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerCategoriesPage;
