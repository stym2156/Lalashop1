"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Store, Shield, Bell,
  Truck, Save, ChevronRight, CheckCircle, ArrowLeft, FileBadge,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { GeneralSection } from "./GeneralSection";
import { AddressSection } from "./AddressSection";
import { SecuritySection } from "./SecuritySection";
import { ShopDetailSection } from "./ShopDetailSection";
export default function SellerSettings() {
  const { t } = useTranslation("common");
  const [activeSection, setActiveSection] = useState("general");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // All necessary settings menu for store owners. "Shop details (KYC)" is
  // a read-only mirror of the seller's KYC submission so they can review the
  // info they entered when opening the shop without leaving this page.
  // Bank Account / Finance was removed: shop withdrawals are now locked to
  // the bank account captured during KYC, so the standalone Bank section
  // would only confuse sellers (no second source of truth).
  const menuItems = [
    { id: "general", label: t("pages.settings.general"), icon: Store },
    { id: "shop_detail", label: t("pages.settings.shopDetail"), icon: FileBadge },
    { id: "address", label: t("pages.settings.address"), icon: Truck },
    { id: "security", label: t("pages.settings.security"), icon: Shield },
  ];

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-[#1a1a1a] flex flex-col md:flex-row">

      {/* Side Navigation - Easy one-click access */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <Link
            href="/me/me"
            className="flex items-center gap-2 text-gray-500 hover:text-[#00aeff] mb-4 transition-colors group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <h1 className="text-lg font-bold flex items-center gap-2">
              <div className="w-2 h-6 bg-[#00aeff] rounded-full" />
              {t("pages.settings.title")}
            </h1>
          </Link>
          
        </div>
        <nav className="p-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${activeSection === item.id
                ? "text-[#00aeff]"
                : "text-gray-500 hover:bg-gray-50"
                }`}
            >
              <item.icon size={18} />
              {item.label}
              {activeSection === item.id && <ChevronRight size={14} className="ml-auto" />}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 max-w-4xl">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

          {/* Section Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="font-bold text-gray-800  tracking-tight">
              {menuItems.find(i => i.id === activeSection)?.label}
            </h2>
            {success && (
              <span className="text-emerald-600 text-xs font-bold flex items-center gap-1 animate-in fade-in">
                <CheckCircle size={14} /> {t("status.success")}
              </span>
            )}
          </div>

          <div className="p-6">
            {activeSection === "general" && <GeneralSection />}
            {activeSection === "shop_detail" && <ShopDetailSection />}
            {activeSection === "address" && <AddressSection />}
            {activeSection === "security" && <SecuritySection />}
          </div>
        </div>
      </main>
    </div>
  );
}