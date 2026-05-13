import React, { useState } from "react";
import {
  Home, ShoppingBag,  Wallet, Eye, EyeOff, 
  RotateCw, Package, Gift, ChevronRight
} from "lucide-react";
import AttrGMV from "./Attr/Attr";
import ItemsSold from "./orderpage/order";
import Marketplace from "./pagescreator/product/productcenter";
import AddTostore from "./AddTostore";
import CreatorProduct from "./creator_prodcut/creator_prodcut";
import Header from "@/components/layout/Header";
import Earnings from "./pagescreator/window/withdraw";
import { useTranslation } from "react-i18next";

type SubView = "none" | "gmv" | "items" | "commission" | "promote" | "marketplace" | "showcase" | "earnings" | "samples" | "add_to_store" | "Myshop";

export default function TikTokCreatorCenter() {
  const { t } = useTranslation("common");
  const [subView, setSubView] = useState<SubView>("none");
  const [showEarnings, setShowEarnings] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (subView === "gmv") return <AttrGMV onBack={() => setSubView("none")} />;
  if (subView === "items") return <ItemsSold onBack={() => setSubView("none")} />;
  if (subView === "marketplace") return <Marketplace onBack={() => setSubView("none")} />;
  if (subView === "Myshop") return <CreatorProduct onBack={() => setSubView("none")} />;
  if (subView === "earnings") return <Earnings onBack={() => setSubView("none")} />;

  return (
    <div className="flex-1 flex flex-col bg-[#F8F8F8]">
      <Header />
      
      <style jsx>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .item-fade-up {
          animation: fade-up 0.4s ease-out forwards;
          opacity: 0;
        }
      `}</style>

      <div className="w-full">
        {/* --- Today's Data Section: Edge-to-edge layout --- */}
        <section className="bg-white border-b border-[#EEEEEE] w-full item-fade-up" style={{ animationDelay: '0s' }}>
          <div className="px-5 py-6 flex justify-between items-center">
            <h2 className="text-[17px] font-bold tracking-tight">{t("pages.creator.todaysData").toLowerCase()}</h2>
            <div className="flex gap-6 items-center text-[#86878B]">
              <button onClick={() => setShowEarnings(!showEarnings)} className="active:text-black">
                {showEarnings ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
              <button 
                onClick={() => {setIsRefreshing(true); setTimeout(()=>setIsRefreshing(false),800)}}
                className="active:text-black"
              >
                <RotateCw size={18} className={isRefreshing ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {/* Grid data into 3 parts: Full width with subtle dividers */}
          <div className="flex w-full pb-8 border-t border-[#FBFBFB]">
            <div className="flex-1 pt-4 text-center border-r border-[#F5F5F5] cursor-pointer active:bg-gray-50" onClick={() => setSubView("gmv")}>
              <p className="text-[11px] text-[#86878B] mb-2 tracking-wider font-medium">{t("pages.creator.sales").toLowerCase()}</p>
              <p className={`text-[18px] font-bold ${!showEarnings ? "blur-md opacity-20" : ""}`}>฿0.00</p>
            </div>
            <div className="flex-1 pt-4 text-center border-r border-[#F5F5F5] cursor-pointer active:bg-gray-50" onClick={() => setSubView("items")}>
              <p className="text-[11px] text-[#86878B] mb-2 tracking-wider font-medium">{t("pages.creator.orders").toLowerCase()}</p>
              <p className="text-[18px] font-bold">0</p>
            </div>
          </div>
        </section>

        {/* --- List Menu Section: 100% full width, no rounded corners --- */}
        <section className="bg-white border-y border-[#EEEEEE] w-full mt-2 item-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex flex-col">
            {[
              { label: t("pages.creator.productCreator"), icon: Home, view: "Myshop" },
              { label: t("pages.creator.productDetail"), icon: ShoppingBag, view: "marketplace" },
              { label: t("pages.creator.withdraw"), icon: Wallet, view: "earnings" },
            ].map((item, i, arr) => (
              <button
                key={i}
                onClick={() => setSubView(item.view as SubView)}
                className={`w-full px-5 py-5 flex items-center justify-between active:bg-[#F9F9F9] transition-colors relative ${i !== arr.length - 1 ? 'border-b border-[#F5F5F5]' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <item.icon size={20} strokeWidth={1.8} className="text-[#121212]" />
                  <span className="text-[15px] font-medium text-[#222222]">{item.label.toLowerCase()}</span>
                </div>
                <ChevronRight size={18} className="text-[#C8C9CC]" />
              </button>
            ))}
          </div>
        </section>

        {/* --- Add To Store Section: Bottom full width --- */}
        <div className="w-full mt-2 bg-white border-y border-[#EEEEEE] overflow-hidden item-fade-up" style={{ animationDelay: '0.2s' }}>
          <AddTostore />
        </div>

      </div>
    </div>
  );
}