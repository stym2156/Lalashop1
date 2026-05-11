"use client";
import React, { useEffect, useState } from 'react';
import { Ticket, Info, Clock, ChevronLeft, Gift } from 'lucide-react';
import { useTranslation } from "react-i18next";
import { useLoading } from '../../../../LoadingContext';

interface CouponsPageProps {
  onBack: () => void;
}

const CouponsPage = ({ onBack }: CouponsPageProps) => {
  const { t } = useTranslation("common");
  const { showLoading, hideLoading } = useLoading(); 
  const [coupons, setCoupons] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      showLoading('Fetching your coupons...');
      // Simulate data loading
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCoupons([
        { 
          id: 1, 
          title: '50% Discount', 
          desc: 'Max discount ฿100 with ฿200 min spend', 
          expiry: 'Expires in: 2 days', 
          type: 'DISCOUNT',
          color: 'bg-rose-500' 
        },
        { 
          id: 2, 
          title: 'Free Shipping min 0.-', 
          desc: 'Applicable with Standard Delivery', 
          expiry: 'Expires in: 5 hours', 
          type: 'FREESHIP',
          color: 'bg-emerald-500'
        },
        { 
          id: 3, 
          title: '15% Cashback', 
          desc: 'Get back up to 50 Coins', 
          expiry: 'Valid until: 30 Apr 26', 
          type: 'COIN',
          color: 'bg-amber-500'
        }
      ]);
      hideLoading();
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 flex items-center h-[56px] px-4">
        <button onClick={onBack} className="p-1 -ml-1 active:opacity-50 transition-opacity">
          <ChevronLeft size={24} className="text-slate-800" />
        </button>
        <h1 className="ml-2 text-[17px] font-black text-slate-800  tracking-tight">{t("pages.promo.title")}</h1>
      </nav>

      <main className="p-4 space-y-4">


        {/* Footer Hint */}
        <div className="py-8 text-center">
          <p className="text-[11px] text-slate-400 font-bold  tracking-widest">{t("pages.promo.noPromo")}</p>
        </div>
      </main>
    </div>
  );
};

export default CouponsPage;