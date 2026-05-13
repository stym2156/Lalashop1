"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import Header from "@/components/layout/Header";
import { categories } from "@/menu/manu";
import { Filter, LayoutGrid, List, LucideIcon } from "lucide-react";
import { Product } from "@/types";
import { apiClient } from "@/services/apiClient";

interface CategoryTemplateProps {
  slug: string;
  Icon: LucideIcon;
}

export default function CategoryTemplate({ slug, Icon }: CategoryTemplateProps): JSX.Element {
  const { t } = useTranslation("common");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const category = categories?.find(c => c.slug === slug);
  const categoryName = category ? t(`pages.category.name.${category.slug}`, category.name) : t("nav.products");
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await apiClient("/products");
        
        // Filter products that match the current category slug or include the category name
        const allProducts = response.success && Array.isArray(response.data) ? response.data : [];
        const filtered = allProducts.filter((p: any) => {
          const productCat = p.category?.toLowerCase() || "";
          const targetSlug = slug.toLowerCase();
          const targetName = categoryName.toLowerCase();
          
          return productCat.includes(targetSlug) || targetSlug.includes(productCat) || productCat.includes(targetName);
        });
        
        setProducts(filtered);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [slug, categoryName]);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-transparent">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-1xl h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-1">
            {products.length > 0 ? (
              products.map((product) => (
                <Link 
                  key={product._id} 
                  href={`/product/${product._id}`}
                  className="block text-inherit hover:no-underline h-full"
                >
                  <div className="group cursor-pointer bg-white rounded-1xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                    <div className="aspect-square relative overflow-hidden bg-gray-50">
                      <img 
                        src={Array.isArray(product.image) ? product.image[0] : product.image} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="text-sm font-bold text-slate-800 line-clamp-2 min-h-[40px] group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-[11px] text-gray-400 line-clamp-2 mt-2 font-medium">
                        {product.description}
                      </p>
                      <div className="mt-auto pt-4 flex items-center justify-between">
                        <div className="flex items-baseline gap-1">
                          <span className="text-xs font-bold text-primary">฿</span>
                          <span className="text-xl font-black text-primary">
                            {product.price.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                          {t("product.stock")}: {product.countInStock}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full py-32 text-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
                <div className="text-4xl mb-4 opacity-20">📦</div>
                <h3 className="text-lg font-bold text-slate-400">{t("category.noProducts", { category: categoryName })}</h3>
                <p className="text-sm text-slate-300 mt-1">{t("pages.categoryPage.checkBackLater")}</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
