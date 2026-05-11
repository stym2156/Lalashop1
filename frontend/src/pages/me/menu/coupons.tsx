"use client";
import React from 'react';
import { ChevronLeft, Ticket } from 'lucide-react';
import { useTranslation } from "react-i18next";

interface CouponsPageProps {
  onBack: () => void;
}

const CouponsPage = ({ onBack }: CouponsPageProps) => {
  const { t } = useTranslation("common");
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 flex items-center h-[56px] px-4">
        <button onClick={onBack} className="p-1 -ml-1 active:opacity-50 transition-opacity">
          <ChevronLeft size={24} className="text-slate-800" />
        </button>
        <h1 className="ml-2 text-[17px] font-black text-slate-800 tracking-tight">{t("pages.coupons.title")}</h1>
      </nav>

      <main className="p-4">
        <div className="bg-white rounded-2xl px-6 py-12 text-center">
          <Ticket className="w-7 h-7 text-gray-300 mx-auto mb-3" />
          <h2 className="text-[14px] font-bold text-slate-700">{t("pages.coupons.noCoupons")}</h2>
          <p className="text-[12px] text-slate-500 mt-1 max-w-xs mx-auto">
            {t("pages.coupons.noCoupons")}
          </p>
        </div>
      </main>
    </div>
  );
};

export default CouponsPage;
