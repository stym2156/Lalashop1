import React, { useState, useEffect } from "react";
import Head from 'next/head';
import Link from 'next/link';
import { ShoppingCart, Heart, Search } from 'lucide-react';
import { useTranslation } from "react-i18next";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/home/Sidebar";
import HeroBanner from "@/components/home/HeroBanner";
import { apiClient } from "@/services/apiClient";
import { categories } from "@/menu/manu";
import { Product } from "@/types";

interface ShopAdvert {
  productId: string;
  name: string;
  image: string;
}

export default function Home() {
  const { t } = useTranslation("common");
  const [activeCategory, setActiveCategory] = useState("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [adverts, setAdverts] = useState<ShopAdvert[]>([]);
  const [advertIndex, setAdvertIndex] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await apiClient("/products");
        if (response.success && Array.isArray(response.data)) {
          setProducts(response.data);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchAdverts = async () => {
      try {
        const response = await apiClient("/products/adverts");
        if (response.success && Array.isArray(response.data)) {
          setAdverts(response.data);
        }
      } catch (error) {
        // adverts are optional — don't surface
      }
    };

    fetchProducts();
    fetchAdverts();
  }, []);

  useEffect(() => {
    if (adverts.length <= 1) return;
    const id = setInterval(() => {
      setAdvertIndex((i) => (i + 1) % adverts.length);
    }, 5000);
    return () => clearInterval(id);
  }, [adverts.length]);

  // กรองสินค้าตาม slug ของหมวดหมู่ที่เลือก
  const filteredProducts = activeCategory === "all" 
    ? (Array.isArray(products) ? products : []) 
    : (Array.isArray(products) ? products.filter(p => p.category?.toLowerCase().includes(activeCategory.toLowerCase())) : []);

  const hotProducts = Array.isArray(products) ? products.slice(0, 7) : [];
  const newArrivals = Array.isArray(products) ? [...products].reverse().slice(0, 7) : [];

  return (
    <div className="flex-1 flex flex-col">
      <Head>
        <title>{t("app.title", "Lala Shop")}</title>
      </Head>
      <Header />
      <main className="flex-1 bg-gray-50/50">
          <div className="mx-auto max-w-[1440px] px-0 sm:px-4 py-4 md:py-6">
            {/* Main Top Row: Categories | Banner | User */}
            <div className="mb-4 md:mb-8 flex flex-col md:flex-row gap-4 md:gap-6">
              <Sidebar />
              <div className="w-full">
                <HeroBanner />
              </div>
            </div>

            {/* Seller Advertising Banners */}
            {adverts.length > 0 && (
              <div className="mb-4 md:mb-8 rounded-none sm:rounded-2xl overflow-hidden bg-gradient-to-r from-sky-500 to-indigo-500 shadow-sm">
                <div className="relative w-full aspect-[16/6] sm:aspect-[16/4]">
                  {adverts.map((ad, i) => (
                    <Link
                      key={`${ad.productId}-${i}`}
                      href={`/product/${ad.productId}`}
                      className={`absolute inset-0 transition-opacity duration-700 ${
                        i === advertIndex ? "opacity-100" : "opacity-0 pointer-events-none"
                      }`}
                    >
                      <img
                        src={ad.image}
                        alt={ad.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-4 sm:bottom-6 sm:left-8 text-white">
                        <p className="text-[10px] sm:text-xs font-bold tracking-widest opacity-80">
                          {t("product.featured")}
                        </p>
                        <p className="text-sm sm:text-xl font-black drop-shadow-lg line-clamp-1 max-w-md">
                          {ad.name}
                        </p>
                      </div>
                    </Link>
                  ))}
                  {adverts.length > 1 && (
                    <div className="absolute bottom-2 right-3 flex gap-1.5 z-10">
                      {adverts.map((_, i) => (
                        <button
                          key={i}
                          onClick={(e) => {
                            e.preventDefault();
                            setAdvertIndex(i);
                          }}
                          className={`h-1.5 rounded-full transition-all ${
                            i === advertIndex
                              ? "bg-white w-6"
                              : "bg-white/40 w-1.5 hover:bg-white/70"
                          }`}
                          aria-label={`${t("actions.view")} ${i + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Row 3: Product Grid (Selected Goods) */}
            <div className="rounded-none sm:rounded-2xl border-x-0 sm:border border-gray-100 bg-white p-4 md:p-6 shadow-none sm:shadow-sm overflow-hidden text-clip mb-8">
              <div className="mb-6 flex items-center gap-6 md:gap-8 border-b border-gray-100 overflow-x-auto whitespace-nowrap pb-1 scrollbar-hide">
                <button
                  onClick={() => setActiveCategory("all")}
                  className={`relative pb-4 text-sm font-bold transition-all ${activeCategory === "all" ? "border-b-2 border-primary text-primary" : "text-gray-400 hover:text-slate-700"}`}
                >
                  {mounted ? t("product.selectedGoods") : "Selected Goods"}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.slug)}
                    className={`relative pb-4 text-sm font-bold transition-all ${activeCategory === cat.slug ? "border-b-2 border-primary text-primary" : "text-gray-400 hover:text-slate-700"}`}
                  >
                    {mounted ? t(`category.name.${cat.slug}`, cat.name) : cat.name}
                  </button>
                ))}
              </div>
              
              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-7 gap-1 md:gap-1">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <Link 
                        key={product._id} 
                        href={`/product/${product._id}`}
                        className="block text-inherit hover:no-underline h-full"
                      >
                        <div className="group cursor-pointer bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all h-full">
                          <div className="aspect-square relative overflow-hidden bg-gray-100">
                            <img 
                              src={Array.isArray(product.image) ? product.image[0] : product.image} 
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div className="p-3">
                            <h3 className="text-sm font-medium text-gray-800 line-clamp-2 min-h-[40px]">
                              {product.name}
                            </h3>
                            <p className="text-[11px] text-gray-500 line-clamp-2 mt-1">
                              {product.description}
                            </p>
                            <div className="mt-2 flex items-baseline gap-1">
                              <span className="text-xs font-bold text-primary">{mounted ? t("common.currencySymbol", "฿") : "฿"}</span>
                              <span className="text-lg font-bold text-primary">
                                {product.price.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="col-span-full py-20 text-center text-gray-500">
                      {mounted ? t("product.noProducts") : "No Products"}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Hot Sellers Section */}
            <div className="rounded-none sm:rounded-2xl border-x-0 sm:border border-gray-100 bg-white p-30 md:p-5 shadow-none sm:shadow-sm overflow-hidden text-clip mb-8">
              <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <span className="text-red-500">🔥</span> {mounted ? t("product.hotSellers") : "Hot Sellers"}
                </h2>
                <Link href="/products" className="text-xs font-bold text-primary hover:underline">{mounted ? t("actions.viewAll") : "View All"}</Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-7 gap-1 md:gap-1">
                {hotProducts.map((product) => (
                  <Link key={product._id} href={`/product/${product._id}`} className="block text-inherit hover:no-underline">
                    <div className="group cursor-pointer bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-all">
                      <div className="aspect-square relative overflow-hidden bg-gray-100">
                        <img src={Array.isArray(product.image) ? product.image[0] : product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-all" />
                      </div>
                      <div className="p-3">
                        <h3 className="text-xs font-bold text-gray-800 line-clamp-1">{product.name}</h3>
                        <p className="text-[10px] text-gray-400 line-clamp-2 mt-1 min-h-[30px]">{product.description}</p>
                        <p className="text-[14px] font-black text-primary mt-2">{mounted ? t("common.currencySymbol", "฿") : "฿"}{product.price.toLocaleString()}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* New Arrivals Section */}
            <div className="rounded-none sm:rounded-2xl border-x-0 sm:border border-gray-100 bg-white p-4 md:p-6 shadow-none sm:shadow-sm overflow-hidden text-clip mb-8">
              <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <span className="text-blue-500">✨</span> {mounted ? t("header.newArrivals") : "New Arrivals"}
                </h2>
                <Link href="/products" className="text-xs font-bold text-primary hover:underline">{mounted ? t("actions.viewAll") : "View All"}</Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-7 gap-1 md:gap-1">
                {newArrivals.map((product) => (
                  <Link key={product._id} href={`/product/${product._id}`} className="block text-inherit hover:no-underline">
                    <div className="group cursor-pointer bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-all">
                      <div className="aspect-square relative overflow-hidden bg-gray-100">
                        <img src={Array.isArray(product.image) ? product.image[0] : product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-all" />
                      </div>
                      <div className="p-3">
                        <h3 className="text-xs font-bold text-gray-800 line-clamp-1">{product.name}</h3>
                        <p className="text-[10px] text-gray-400 line-clamp-2 mt-1 min-h-[30px]">{product.description}</p>
                        <p className="text-[14px] font-black text-primary mt-2">{mounted ? t("common.currencySymbol", "฿") : "฿"}{product.price.toLocaleString()}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
      </main>
    </div>
  );
}
