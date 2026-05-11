"use client";
import React from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { useTranslation } from "react-i18next";
import { categories } from "@/menu/manu";
import {
  Monitor, Home, Shirt, Wrench, Car,
  Sparkles, Building, Dumbbell, ChevronRight
} from "lucide-react";

const iconMap: Record<string, any> = {
  Monitor, Home, Shirt, Wrench, Car, Sparkles, Building, Dumbbell
};

export default function CategoryOverviewPage() {
  const { t } = useTranslation("common");
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50/50">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-black text-slate-800 mb-4">{t("header.categories")}</h1>
          <p className="text-slate-500 max-w-2xl mx-auto">
            {t("pages.category.title")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => {
            const Icon = iconMap[cat.icon] || Monitor;
            return (
              <Link 
                key={cat.id} 
                href={`/category/${cat.slug}`}
                className="group bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors mb-6">
                  <Icon size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2 truncate w-full">
                  {cat.name}
                </h2>
                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all">
                  {t("actions.viewMore")} <ChevronRight size={14} />
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
