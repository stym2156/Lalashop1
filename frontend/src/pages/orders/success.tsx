"use client";
import React from "react";
import Header from "@/components/layout/Header";
import { CheckCircle, Package, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function OrderSuccessPage() {
  const { t } = useTranslation("common");
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 antialiased">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/50 text-center animate-in zoom-in duration-500">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">{t("order.successTitle")}</h1>
          <p className="text-slate-500 font-medium mb-8">
            {t("order.successMessage")}
          </p>

          <div className="space-y-3">
            <Link
              href="/orders/orders"
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/10"
            >
              <Package size={18} />
              {t("actions.viewOrders")}
            </Link>
            <Link
              href="/"
              className="w-full bg-white border border-gray-200 text-slate-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-all active:scale-95"
            >
              {t("actions.continueShopping")}
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
