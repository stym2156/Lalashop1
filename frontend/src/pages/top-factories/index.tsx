import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import MainSidebar from "@/components/layout/MainSidebar";
import { Trophy, ShieldCheck, Factory, Award, ArrowRight, Star } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Product } from "@/types";

export default function TopFactoriesPage() {
  const { t } = useTranslation("common");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchTopProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/products");
        const data = await response.json();
        if (cancelled) return;
        const list = Array.isArray(data) ? data : data?.data ?? [];
        setProducts(list);
      } catch (error) {
        console.error("Error fetching top products:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchTopProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <MainSidebar />
      <div className="flex min-h-screen flex-1 flex-col lg:pl-16">
        <Header />

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-12">
          {/* Banner Section */}
          <div className="bg-[#111111] rounded-3xl p-10 md:p-20 text-white mb-16 relative overflow-hidden group shadow-2xl flex flex-col md:flex-row items-center justify-between">
             <div className="relative z-10 max-w-xl">
                <div className="bg-[#00a699]/20 backdrop-blur-md rounded-full px-6 py-2 mb-8 border border-[#00a699]/20 inline-block">
                   <p className="text-[#00a699] text-[10px] font-extrabold tracking-[0.2em] flex items-center gap-2">
                      <Trophy size={16} fill="currentColor" />
                      Elite Tier Manufacturers
                   </p>
                </div>
                <h1 className="text-3xl md:text-5xl font-extrabold mb-8 leading-tight">{t("pages.topFactories.title")}</h1>
                <p className="text-white/40 text-lg font-medium mb-12 leading-relaxed">
                   {t("pages.topFactories.subtitle")}
                </p>
             </div>
             
             <div className="relative z-10 hidden xl:block">
                <div className="w-80 h-80 bg-white/5 rounded-3xl p-8 border border-white/5 backdrop-blur-sm -rotate-6 flex flex-col items-center text-center">
                   <Award size={80} className="text-[#00a699] mb-8 animate-pulse" />
                   <h2 className="text-xl font-bold mb-4">Quality Verified</h2>
                   <p className="text-xs text-white/40 font-medium">Platform-wide standard for <br /> tier-one manufacturing partners.</p>
                </div>
             </div>
          </div>

          {/* Categories Bar */}
          <div className="flex items-center gap-6 mb-12 overflow-x-auto pb-4 scrollbar-hide">
             {["All Factories", "Electronics", "Industrial", "Apparel", "Home & Garden", "Automotive"].map((cat, i) => (
               <button key={i} className={`px-8 py-3 rounded-full text-xs font-bold whitespace-nowrap transition-all ${i === 0 ? "bg-[#00a699] text-white shadow-xl shadow-[#00a699]/20" : "bg-white text-slate-500 border border-gray-100 hover:border-[#00a699] hover:text-[#00a699]"}`}>
                  {cat}
               </button>
             ))}
          </div>

          {/* Factory Product Showcase */}
          <h2 className="text-2xl font-black text-slate-800 mb-8">{t("product.popularProducts")}</h2>
          
          {loading ? (
             <div className="flex justify-center py-20 w-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a699]"></div>
             </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-16">
               {products.map((product) => (
                 <Link key={product._id} href={`/product/${product._id}`} className="group">
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all flex flex-col gap-6 relative overflow-hidden h-full">
                       <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden relative">
                          <img 
                            src={Array.isArray(product.image) ? product.image[0] : product.image} 
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute top-3 left-3 bg-[#00a699] text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg">
                             FACTORY
                          </div>
                       </div>
                       
                       <div className="flex flex-col flex-1">
                          <h3 className="text-lg font-extrabold text-[#111111] mb-2 leading-tight group-hover:text-[#00a699] transition-colors line-clamp-2">
                             {product.name}
                          </h3>
                          <div className="mt-auto">
                             <p className="text-[10px] text-gray-400 font-bold flex items-center gap-2 mb-3">
                                <ShieldCheck size={14} className="text-[#00a699]" />
                                Verified Source • CN
                             </p>
                             <div className="flex items-center justify-between">
                                <span className="text-xl font-black text-[#00a699]">฿{product.price.toLocaleString()}</span>
                                <div className="flex text-cyan-400 gap-0.5">
                                   <Star size={10} fill="currentColor" />
                                   <span className="text-[10px] font-black ml-1">5.0</span>
                                </div>
                             </div>
                          </div>
                       </div>
                       
                       <button className="w-full py-3 bg-[#111111] group-hover:bg-[#00a699] text-white font-extrabold text-[10px] tracking-widest rounded-xl transition-all flex items-center justify-center gap-2">
                          {t("actions.buyNow")} <ArrowRight size={12} />
                       </button>
                    </div>
                 </Link>
               ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
