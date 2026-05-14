import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Zap, Star, Trophy,  } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Product } from "@/types";
import { apiClient } from "@/services/apiClient";

interface Slide {
  image: string;
  title: string;
  sub: string;
  link?: string;
}

export default function HeroBanner() {
  const { t } = useTranslation("common");
  const [current, setCurrent] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannerSlides, setBannerSlides] = useState<Slide[]>([]);

  // Built-in fallback used while the API call is in flight or when the admin
  // hasn't published any banners yet. Once admin-managed banners exist, those
  // replace the defaults entirely.
  const fallbackSlides: Slide[] = [
    { image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop", title: t("product.globalDirectSupply"), sub: t("product.globalDirectSupplyDesc") },
    { image: "https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=2070&auto=format&fit=crop", title: t("product.smartFactorySource"), sub: t("product.smartFactorySourceDesc") },
  ];

  const slides: Slide[] = bannerSlides.length > 0 ? bannerSlides : fallbackSlides;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await apiClient("/products");
        if (response.success && Array.isArray(response.data)) {
          setProducts(response.data);
        }
      } catch (error) {
        console.error("Error fetching products for banner:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchBanners = async () => {
      try {
        const response = await apiClient("/banners");
        if (response.success && Array.isArray(response.data)) {
          const mapped: Slide[] = response.data.map((b: { imageUrl: string; title?: string; subtitle?: string; linkUrl?: string }) => ({
            image: b.imageUrl,
            title: b.title || "",
            sub: b.subtitle || "",
            link: b.linkUrl || undefined,
          }));
          setBannerSlides(mapped);
        }
      } catch {
        // Keep fallback slides — banners API is optional from the homepage's POV.
      }
    };

    void fetchProducts();
    void fetchBanners();
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => setCurrent(s => (s + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Reset index if admin removes/reorders banners while the page is open.
  useEffect(() => {
    if (current >= slides.length) setCurrent(0);
  }, [slides.length, current]);

  const goldProducts = Array.isArray(products) ? products.slice(0, 2) : [];
  const hotProducts = Array.isArray(products) ? products.slice(2, 4) : [];
  const newArrivals = Array.isArray(products) ? [...products].reverse().slice(0, 2) : [];

  const safeMap = (arr: any[], callback: (item: any) => React.ReactNode) => {
    return Array.isArray(arr) ? arr.map(callback) : null;
  };

  if (loading && products.length === 0) {
    return (
      <div className="w-full h-[300px] md:h-[600px] flex items-center justify-center bg-gray-50 rounded-2xl animate-pulse">
        <div className="text-gray-400 font-bold">{t("product.loadingGoods")}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      <div className="w-full h-[220px] md:h-[490px] mb-4 sm:mb-6">
        <div className="relative h-full overflow-hidden group shadow-lg sm:rounded-2xl">
          {slides.map((s, i) => (
            <div
              key={i}
              className={`absolute inset-0 transition-all duration-1000 ${i === current ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
            >
              <img
                src={s.image}
                alt={s.title || "Promotion"}
                className="w-full h-full object-cover"
              />
              {(s.title || s.sub) && (
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/10 to-transparent" />
              )}
              <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10">
                {(s.title || s.sub) && (
                  <div className="max-w-md text-white drop-shadow-lg mb-4 md:mb-6">
                    {s.title && (
                      <h2 className="text-lg md:text-3xl font-black leading-tight">
                        {s.title}
                      </h2>
                    )}
                    {s.sub && (
                      <p className="text-xs md:text-sm font-medium opacity-90 mt-1 md:mt-2 line-clamp-2">
                        {s.sub}
                      </p>
                    )}
                  </div>
                )}
                <div className="absolute right-4 bottom-4 md:right-10 md:bottom-10 z-10">
                  <Link
                    href={s.link || "/products"}
                    className="inline-block bg-white text-slate-900 px-6 py-3 rounded-xl font-extrabold text-sm shadow-xl hover:bg-gray-100 transition-all active:scale-95 leading-none"
                  >
                    {t("product.goToMarket")}
                  </Link>
                </div>
              </div>
            </div>
          ))}

          <button onClick={() => setCurrent(c => (c - 1 + slides.length) % slides.length)} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => setCurrent(c => (c + 1) % slides.length)} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-1 sm:gap-0.5 px-2 sm:px-4 mb-0.2">
        {/* Gold Manufacturing */}
        <div className="bg-white rounded-1xl p-3 sm:p-5 border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-xs sm:text-sm">
              <Trophy size={18} className="text-cyan-400 sm:w-[20px]" />
              <span className="truncate">{t("product.popularProducts")}</span>
            </h3>
            <Link href="/products" className="hidden sm:flex text-[10px] text-gray-400 font-bold items-center gap-1 hover:text-primary transition-colors">
              {t("common.more")} <ChevronRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-auto">
            {goldProducts.map((product) => (
              <Link key={product._id} href={`/product/${product._id}`} className="bg-gray-50 rounded-lg flex flex-row items-center p-2 gap-3 hover:bg-orange-50/50 transition-colors cursor-pointer group">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md overflow-hidden flex-shrink-0 shadow-sm">
                  <img src={Array.isArray(product.image) ? product.image[0] : product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt={product.name} />
                </div>
                <div className="overflow-hidden text-left">
                  <p className="text-[10px] sm:text-[14px] font-bold text-slate-800 line-clamp-1">{product.name}</p>
                  <p className="text-[10px] sm:text-[14px] text-red-500 font-bold whitespace-nowrap">
                    {t("common.currencySymbol", "฿")}{(product.prices && product.prices.length > 0 ? product.prices[0].price : (product.price || 0)).toLocaleString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Hot Sellers */}
        <div className="bg-white rounded-1xl p-3 sm:p-5 border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-xs sm:text-sm">
              <Zap size={18} className="text-primary fill-primary sm:w-[20px]" />
              <span className="truncate">{t("product.hotSellers")}</span>
            </h3>
            <Link href="/products" className="hidden sm:flex text-[10px] text-gray-400 font-bold items-center gap-1 hover:text-primary transition-colors">
              {t("common.more")} <ChevronRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-auto">
            {hotProducts.map((product) => (
              <Link key={product._id} href={`/product/${product._id}`} className="bg-gray-50 rounded-1xl flex flex-row items-center p-2 gap-3 hover:bg-cyan-50/50 transition-colors cursor-pointer group">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md overflow-hidden flex-shrink-0 shadow-sm">
                  <img src={Array.isArray(product.image) ? product.image[0] : product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt={product.name} />
                </div>
                <div className="overflow-hidden text-left">
                  <p className="text-[10px] sm:text-[14px] font-bold text-slate-800 line-clamp-1">{product.name}</p>
                  <p className="text-[10px] sm:text-[14px] text-red-500 font-bold whitespace-nowrap">
                    {t("common.currencySymbol", "฿")}{(product.prices && product.prices.length > 0 ? product.prices[0].price : (product.price || 0)).toLocaleString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* New Arrivals */}
        <div className="hidden lg:flex bg-white rounded-1xl p-3 sm:p-5 border border-gray-100 shadow-sm flex-col">
          <div className="flex items-center justify-between mb-3 sm:mb-0.2">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-xs sm:text-sm">
              <Star size={18} className="text-orange-400 fill-orange-400 sm:w-[20px]" />
              <span className="truncate">{t("header.newArrivals")}</span>
            </h3>
            <Link href="/products" className="hidden sm:flex text-[10px] text-gray-400 font-bold items-center gap-1 hover:text-primary transition-colors">
              {t("common.more")} <ChevronRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-auto">
            {newArrivals.map((product) => (
              <Link key={product._id} href={`/product/${product._id}`} className="bg-gray-50 rounded-lg flex flex-row items-center p-2 gap-3 hover:bg-orange-50/50 transition-colors cursor-pointer group">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md overflow-hidden flex-shrink-0 shadow-sm">
                  <img src={Array.isArray(product.image) ? product.image[0] : product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt={product.name} />
                </div>
                <div className="overflow-hidden text-left">
                  <p className="text-[10px] sm:text-[14px] font-bold text-slate-800 line-clamp-1">{product.name}</p>
                  <p className="text-[10px] sm:text-[14px] text-red-500 font-bold whitespace-nowrap">
                    {t("common.currencySymbol", "฿")}{(product.prices && product.prices.length > 0 ? product.prices[0].price : (product.price || 0)).toLocaleString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
