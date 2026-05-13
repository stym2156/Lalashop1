"use client";
import Header from "@/components/layout/Header";
import Link from "next/link";
import {
  Truck, ArrowRight, ShieldCheck, Clock, Archive, Globe, ChevronLeft,
  MapPin, CheckCircle2, TrendingUp, Hand
} from "lucide-react";
import { useTranslation } from "react-i18next";

export default function DistPage() {
  const { t } = useTranslation("common");
  const hubs = [
    { label: t("components.truck.europeanHub"), country: t("components.truck.countryGermany"), id: "DE" },
    { label: t("components.truck.aseanHub"), country: t("components.truck.countryThailand"), id: "TH" },
    { label: t("components.truck.naHub"), country: t("components.truck.countryUsa"), id: "US" },
  ];

  const steps = [
    { icon: Archive, label: t("components.truck.warehouseSourcing"), sub: t("components.truck.warehouseSourcingDesc") },
    { icon: Hand, label: t("components.truck.pickPack"), sub: t("components.truck.pickPackDesc") },
    { icon: Truck, label: t("components.truck.localDelivery"), sub: t("components.truck.localDeliveryDesc") },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50/50">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-12 md:py-20">
        {/* Back to Home Button */}
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-[#00a699] transition-all mb-8 group font-bold">
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm tracking-widest">{t("components.truck.backToHome")}</span>
        </Link>

        {/* Hero Section */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00a699]/10 text-[#00a699] text-xs font-black tracking-widest">
            <Globe size={14} /> {t("components.truck.globalLogisticsNetwork")}
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-black text-[#111111] leading-tight">
            {t("components.truck.heroTitlePart1")} <br className="hidden md:block" /><span className="text-[#00a699]">{t("components.truck.heroTitleReliable")}</span> {t("components.truck.heroTitlePart2")}
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg font-medium">
            {t("components.truck.heroSubtitle")}
          </p>
        </div>

        {/* Hubs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
           {/* Hubs Grid */}
           {hubs.map((hub, i) => (
             <div key={i} className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden flex flex-col items-center text-center">
                <div className="relative z-10 space-y-6 h-full flex flex-col items-center">
                   <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-[#111111] group-hover:bg-[#00a699] group-hover:text-white transition-all duration-500 rotate-3 group-hover:rotate-0 shadow-sm">
                      <MapPin size={24} />
                   </div>
                   <div>
                    <h3 className="text-xl font-black text-[#111111] tracking-tight mb-1">{hub.label}</h3>
                    <p className="text-sm text-slate-400 font-bold tracking-widest">{hub.country}</p>
                   </div>
                   <div className="mt-auto">
                    <button className="px-6 py-3 rounded-full bg-slate-50 text-[#111111] text-[11px] font-black group-hover:bg-[#111111] group-hover:text-white transition-all tracking-widest flex items-center gap-2">
                      {t("components.truck.exploreHub")} <ArrowRight size={14} />
                    </button>
                   </div>
                </div>
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/20 transition-all"></div>
             </div>
           ))}
        </div>

        {/* Process Section */}
        <div className="bg-[#111111] rounded-[3rem] p-12 md:p-20 text-white mb-20 shadow-2xl relative overflow-hidden group">
           <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-12">
              {steps.map((step, i) => (
                <div key={i} className="flex flex-col items-center text-center gap-8 relative group/step">
                   <div className="w-24 h-24 bg-white/5 p-6 rounded-[2rem] group-hover/step:scale-110 group-hover/step:bg-[#00a699] transition-all duration-500 backdrop-blur-md border border-white/10 shadow-2xl flex items-center justify-center relative">
                      <span className="absolute -top-2 -right-2 w-8 h-8 bg-white text-[#111111] rounded-full flex items-center justify-center text-sm font-black shadow-lg leading-none">0{i+1}</span>
                      <step.icon size={32} className="text-[#00a699]" />
                   </div>
                   <div className="space-y-3">
                      <h4 className="text-xl font-bold tracking-tight">{step.label}</h4>
                      <p className="text-sm text-white/40 font-medium leading-relaxed max-w-[200px] mx-auto">{step.sub}</p>
                   </div>
                </div>
              ))}
           </div>
           <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(0,196,255,0.1),transparent)] pointer-events-none"></div>
        </div>

        {/* Features Split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
           <div className="bg-white rounded-[2.5rem] p-12 border border-slate-100 shadow-sm flex flex-col justify-center hover:shadow-xl transition-all duration-500">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-[#00a699]/10 text-[#00a699] rounded-2xl flex items-center justify-center shadow-inner">
                   <ShieldCheck size={32} />
                </div>
                <div>
                  <h3 className="text-[10px] font-black text-[#00a699] tracking-[0.2em]">{t("components.truck.protection")}</h3>
                  <h2 className="text-2xl font-black text-[#111111] leading-tight">{t("components.truck.tradeAssurance")}</h2>
                </div>
              </div>

              <p className="text-slate-400 text-sm font-medium mb-8 leading-relaxed">
                {t("components.truck.tradeAssuranceDesc")}
              </p>

              <div className="grid grid-cols-1 gap-4">
                 {[
                   t("components.truck.paymentProtection"),
                   t("components.truck.qualitySafeguard"),
                   t("components.truck.onTimeShipment")
                 ].map(item => (
                   <div key={item} className="flex items-center gap-3 text-xs font-black text-[#111111] bg-slate-50 p-4 rounded-xl border border-slate-100/50">
                      <CheckCircle2 size={18} className="text-emerald-500" strokeWidth={2.5} />
                      {item}
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-white rounded-[2.5rem] p-12 border border-slate-100 shadow-sm flex flex-col group overflow-hidden relative">
              <div className="flex items-center justify-between mb-10 relative z-10">
                 <h3 className="text-xs font-black text-slate-400 tracking-widest">{t("components.truck.liveNetworkStatus")}</h3>
                 <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    {t("components.truck.operational")}
                 </div>
              </div>
              
              <div className="space-y-4 relative z-10">
                 {[
                   { label: t("components.truck.bangkokHub"), sub: t("components.truck.bangkokHubSub"), icon: Clock },
                   { label: t("components.truck.networkLoad"), sub: t("components.truck.networkLoadSub"), icon: TrendingUp },
                   { label: t("components.truck.transitStatus"), sub: t("components.truck.transitStatusSub"), icon: Truck }
                 ].map((stat, i) => (
                  <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl hover:bg-white hover:shadow-xl hover:shadow-[#111111]/5 transition-all duration-300 border border-transparent hover:border-slate-100 group/item cursor-pointer">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#111111] shadow-sm group-hover/item:text-[#00a699] transition-colors"><stat.icon size={18} /></div>
                       <div>
                          <p className="text-sm font-black text-[#111111]">{stat.label}</p>
                          <p className="text-[10px] text-slate-400 font-bold tracking-tight">{stat.sub}</p>
                       </div>
                    </div>
                    <ArrowRight size={16} className="text-slate-300 group-hover/item:text-[#00a699] group-hover/item:translate-x-1 transition-all" />
                  </div>
                 ))}
              </div>
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-slate-50 rounded-full blur-3xl opacity-50 group-hover:bg-primary/5 transition-all"></div>
           </div>
        </div>
      </main>
    </div>
  );
}
