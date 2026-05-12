import React, { useState, useEffect } from "react";
import {
  Search, ShoppingBag, Grid, List, Star, Plus, Store
} from "lucide-react";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";

interface MyShopProps {
  isSeller?: boolean;
}

export default function TikTokStyleProducts({ isSeller = false }: MyShopProps) {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyProducts = async () => {
      if (!isSeller) {
        setLoading(false);
        return;
      }
      try {
        const token = localStorage.getItem("token");
        // storefrontOnly hides products the seller marked "store only" so this
        // tab matches what public visitors see on the shop page.
        const res = await fetch("/api/products/my?storefrontOnly=true", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (data.success) {
          setProducts(data.data);
        }
      } catch (e) {
        console.error("Error fetching my products:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchMyProducts();
  }, [isSeller]);

  // If not a seller, show nothing or an "Open Shop" prompt
  if (!isSeller) {
    return (
      <div className="bg-white p-12 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
          <Store size={32} />
        </div>
        <div className="space-y-1">
          <h3 className="font-black text-slate-800 tracking-tight">{t("pages.myshopPanel.notOpen")}</h3>
          <p className="text-xs text-slate-400 font-medium">{t("pages.myshopPanel.openToday")}</p>
        </div>
        <button
          onClick={() => router.push("/me/opensho/openshop")}
          className="bg-[#00aeff] text-white px-8 py-2.5 rounded-full text-[11px] font-black tracking-widest shadow-lg shadow-[#00aeff]/20 active:scale-95 transition-all"
        >
          {t("pages.myshopPanel2.openShopNow")}
        </button>
      </div>
    );
  }

  // Filter products based on search query
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="bg-white p-12 flex justify-center">
        <div className="w-6 h-6 border-2 border-[#EEEEEE] border-t-[#00aeff] animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white min-h-[400px]">
      {/* ... styles and search/tabs header ... */}
      <style jsx>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up {
          animation: fade-up 0.4s ease-out forwards;
          opacity: 0;
        }
        .d-tabs { animation-delay: 0.1s; }
      `}</style>

      {/* Search Bar */}
      <div className="px-4 py-3 bg-white sticky top-0 z-30 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder={t("pages.myshopPanel2.searchProductsStore")}
            className="w-full bg-slate-100 rounded-full py-2 pl-10 pr-4 text-xs outline-none focus:ring-1 focus:ring-[#00aeff] transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          onClick={() => router.push("/me/products/add")}
          className="w-9 h-9 bg-[#00aeff] text-white rounded-full flex items-center justify-center shadow-lg shadow-[#00aeff]/20 active:scale-90 transition-all"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 px-2 sticky top-[52px] bg-white z-20 fade-up d-tabs">
        {['all', 'popular', 'new', 'price'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-[11px] font-black  tracking-widest transition-colors ${activeTab === tab ? "text-[#00aeff] border-b-2 border-[#00aeff]" : "text-slate-400"}`}
          >
            {tab === 'all' && 'All'}
            {tab === 'popular' && 'Popular'}
            {tab === 'new' && 'New'}
            {tab === 'price' && 'Price'}
          </button>
        ))}
        <button
          onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          className="px-4 text-slate-400 border-l border-slate-50 my-2"
        >
          {viewMode === "grid" ? <List size={18} /> : <Grid size={18} />}
        </button>
      </div>

      {/* Empty State */}
      {products.length === 0 && (
        <div className="py-20 flex flex-col items-center justify-center text-slate-300">
          <ShoppingBag size={48} strokeWidth={1} />
          <p className="mt-4 text-[11px] font-bold tracking-widest">{t("pages.myshopPanel.noProductsYet")}</p>
        </div>
      )}

      {/* Product List */}
      <div className={`p-2 ${viewMode === "grid"
        ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 md:gap-3"
        : "flex flex-col gap-2"
        }`}>
        {filteredProducts.map((product, index) => {
          const cover = Array.isArray(product.images) && product.images.length
            ? product.images[0]
            : Array.isArray(product.image) ? product.image[0] : product.image;
          return (
            <button
              key={product._id}
              type="button"
              onClick={() => router.push(`/me/products/${product._id}`)}
              className={`text-left bg-white overflow-hidden fade-up active:scale-[0.98] transition-transform ${viewMode === "list"
                  ? "flex gap-3 p-2 border-b border-slate-50"
                  : "flex flex-col border border-slate-100 rounded-lg shadow-sm"
                }`}
              style={{ animationDelay: `${0.2 + index * 0.05}s` }}
            >
              {/* Image */}
              <div className={`relative bg-slate-50 ${viewMode === "grid" ? "aspect-[4/5] sm:aspect-square" : "w-24 h-24 flex-shrink-0"}`}>
                <div className="w-full aspect-square overflow-hidden rounded-lg bg-gray-100">
                  <img
                    src={cover}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>                {product.status && product.status !== "Active" && (
                  <span className="absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white">
                    {product.status}
                  </span>
                )}
                {product.freeShipping && (
                  <span className="absolute bottom-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-600 text-white">
                    {t("pages.myshopPanel2.freeShip")}
                  </span>
                )}
              </div>

              {/* Product Info */}
              <div className={`flex flex-col justify-between ${viewMode === "grid" ? "p-1.5" : "flex-1 py-1"}`}>
                <div>
                  <h3 className="text-[10px] lg:text-[12px] text-slate-800 line-clamp-2 leading-tight mb-1">
                    {product.name}
                  </h3>

                  {product.description && (
                    <p
                      className={`text-[9px] lg:text-[10px] text-slate-500 leading-snug mb-1 ${
                        viewMode === "grid" ? "line-clamp-2" : "line-clamp-3"
                      }`}
                    >
                      {product.description}
                    </p>
                  )}

                  <div className="flex items-center gap-1 mb-1">
                    <div className="flex items-center text-[#ffab00]">
                      <Star size={8} fill="currentColor" />
                      <span className="ml-0.5 text-[9px] font-bold">{product.rating || 0}</span>
                    </div>
                    <span className="text-[9px] text-slate-400">Stock {product.countInStock}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-baseline">
                    <span className="text-[#00aeff] text-[9px] font-bold">฿</span>
                    <span className="text-[#00aeff] text-xs lg:text-base font-extrabold">
                      {product.price.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Floating Add Product Button */}
      <button
        onClick={() => router.push("/me/products/add")}
        className="fixed bottom-24 right-6 w-14 h-14 bg-[#00aeff] text-white rounded-full flex items-center justify-center shadow-2xl shadow-[#00aeff]/40 active:scale-90 transition-all z-50"
      >
        <Plus size={28} strokeWidth={3} />
      </button>
    </div>
  );
}