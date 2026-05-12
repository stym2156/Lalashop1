"use client";
import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Clock, Loader2, Package } from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiClient } from "@/services/apiClient";

interface OrderItem {
  _id?: string;
  name: string;
  qty: number;
  price: number;
  image: string;
  product: string;
  seller: string;
  creator?: string;
  commission?: number;
}

interface CreatorOrder {
  _id: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "canceled";
  isPaid: boolean;
  isDelivered: boolean;
  createdAt: string;
  paidAt?: string;
  deliveredAt?: string;
  orderItems: OrderItem[];
  totalPrice: number;
}

interface OrderCreatorProps {
  onBack: () => void;
}

const STATUS_TABS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Completed" },
  { id: "canceled", label: "Canceled" },
] as const;

const statusBadge = (status: CreatorOrder["status"]): string => {
  switch (status) {
    case "delivered":
      return "text-[#00B67A] bg-emerald-50";
    case "shipped":
      return "text-blue-600 bg-blue-50";
    case "processing":
      return "text-amber-600 bg-amber-50";
    case "canceled":
      return "text-rose-500 bg-rose-50";
    default:
      return "text-slate-500 bg-slate-100";
  }
};

export default function CreatorOrders({ onBack }: OrderCreatorProps) {
  const { t } = useTranslation("common");
  const [orders, setOrders] = useState<CreatorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<(typeof STATUS_TABS)[number]["id"]>("all");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await apiClient("/orders/creator");
      setOrders(res?.data || []);
    } catch (err) {
      console.error("Failed to fetch creator orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filtered = useMemo(() => {
    if (activeStatus === "all") return orders;
    return orders.filter((o) => o.status === activeStatus);
  }, [orders, activeStatus]);

  const summary = useMemo(() => {
    let totalCommission = 0;
    let pending = 0;
    let earned = 0;
    for (const o of orders) {
      for (const item of o.orderItems) {
        const c = item.commission || 0;
        totalCommission += c;
        if (o.status === "delivered") earned += c;
        else if (o.status !== "canceled") pending += c;
      }
    }
    return { totalCommission, pending, earned, count: orders.length };
  }, [orders]);

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#161823] antialiased w-full font-sans">
      <nav className="sticky top-0 z-50 bg-white border-b border-[#EBEBEB] flex items-center justify-between h-[52px] px-4 w-full">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-1 active:opacity-50 transition-opacity">
            <ChevronLeft size={26} strokeWidth={2.5} />
          </button>
          <h1 className="text-[17px] font-bold tracking-tight">{t("pages.creatorOrder.orders")}</h1>
        </div>
        <button onClick={fetchOrders} className="text-[13px] font-bold text-[#161823] active:opacity-50">
          {t("pages.creatorOrder.refresh")}
        </button>
      </nav>

      <main className="w-full">
        <div className="bg-white p-4 mb-2 grid grid-cols-3 border-b border-[#EBEBEB] divide-x divide-[#F1F1F2]">
          <div className="pr-3">
            <p className="text-[10px] font-bold text-[#8A8B91] mb-0.5 tracking-wider">{t("pages.creatorOrder.earned")}</p>
            <p className="text-lg font-black text-[#00B67A]">฿{summary.earned.toFixed(2)}</p>
          </div>
          <div className="px-3">
            <p className="text-[10px] font-bold text-[#8A8B91] mb-0.5 tracking-wider">{t("pages.creatorOrder.pending")}</p>
            <p className="text-lg font-black text-amber-600">฿{summary.pending.toFixed(2)}</p>
          </div>
          <div className="pl-3">
            <p className="text-[10px] font-bold text-[#8A8B91] mb-0.5 tracking-wider">{t("pages.creatorOrder.orders")}</p>
            <p className="text-lg font-black text-[#161823]">{summary.count}</p>
          </div>
        </div>

        <div className="bg-white border-b border-[#EBEBEB] overflow-x-auto">
          <div className="flex px-2 gap-1 min-w-max">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveStatus(tab.id)}
                className={`px-3 py-3 text-[12px] font-bold tracking-wide whitespace-nowrap relative transition-colors ${
                  activeStatus === tab.id ? "text-[#161823]" : "text-[#8A8B91]"
                }`}
              >
                {tab.label}
                {activeStatus === tab.id && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#FE2C55] rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <Loader2 size={28} className="animate-spin text-slate-300" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Package size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-[13px] font-bold text-[#8A8B91] tracking-widest">{t("pages.creatorOrder.noOrders")}</p>
          </div>
        ) : (
          <section className="w-full space-y-2">
            {filtered.map((order) => (
              <div key={order._id} className="bg-white p-4 active:bg-[#F8F8F8] transition-colors relative">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-mono text-[#8A8B91]">#{order._id.slice(-8).toUpperCase()}</span>
                  <span
                    className={`text-[10px] font-bold tracking-wider px-2 py-1 rounded-full ${statusBadge(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="space-y-3">
                  {order.orderItems.map((item, idx) => (
                    <div key={item._id || `${order._id}-${idx}`} className="flex gap-3">
                      <div className="relative w-[72px] h-[72px] bg-[#F1F1F2] rounded-lg overflow-hidden shrink-0">
                        {item.image ? (
                          <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                        ) : (
                          <div className="w-full h-full bg-slate-200" />
                        )}
                      </div>

                      <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                        <h4 className="text-[14px] font-bold leading-[1.2] line-clamp-2 text-[#161823]">
                          {item.name}
                        </h4>
                        <div className="flex justify-between items-end mt-2">
                          <p className="text-[13px] font-medium text-[#8A8B91]">Qty: {item.qty}</p>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-[#8A8B91] leading-none mb-1">Price</p>
                            <p className="text-[15px] font-bold text-[#161823]">
                              ฿{(item.price * item.qty).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-[#F1F1F2] flex justify-between items-center">
                  <div className="flex items-center gap-1 text-[#8A8B91]">
                    <Clock size={12} />
                    <p className="text-[11px] font-bold">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-[#00B67A] tracking-tighter leading-none mb-1">
                      {t("pages.creatorAttr2.commission")}
                    </p>
                    <p className="text-[18px] font-black text-[#00B67A]">
                      ฿
                      {order.orderItems
                        .reduce((s, it) => s + (it.commission || 0), 0)
                        .toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        <div className="p-8 text-center">
          <p className="text-[12px] text-[#8A8B91] font-bold tracking-widest opacity-60">
            Total commission tracked: ฿{summary.totalCommission.toFixed(2)}
          </p>
        </div>
      </main>
    </div>
  );
}
