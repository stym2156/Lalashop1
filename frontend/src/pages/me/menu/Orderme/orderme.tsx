"use client";
import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ShoppingBag,
  MoreHorizontal
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface OrderCreatorProps {
  onBack: () => void;
}

export default function CreatorOrders({ onBack }: OrderCreatorProps) {
  const { t } = useTranslation("common");
  const [activeTab, setActiveTab] = useState("ALL");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/orders/seller", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setOrders(data.orders);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(o => {
    if (activeTab === "ALL") return true;
    if (activeTab === "TO_SHIP") return !o.isDelivered && o.isPaid;
    if (activeTab === "SHIPPED") return o.isDelivered && !o.isPaid; // Adjust logic as needed
    if (activeTab === "COMPLETED") return o.isDelivered && o.isPaid;
    return true;
  });

  const tabs = [
    { id: "ALL", label: t("pages.orderme.all"), count: orders.length },
    { id: "TO_SHIP", label: t("pages.orderme.toShip"), count: orders.filter(o => !o.isDelivered && o.isPaid).length },
    { id: "SHIPPED", label: t("pages.orderme.shipped"), count: orders.filter(o => o.isDelivered && !o.isPaid).length },
    { id: "COMPLETED", label: t("pages.orderme.completed"), count: orders.filter(o => o.isDelivered && o.isPaid).length },
  ];

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-white"><div className="w-6 h-6 border-2 border-t-[#00aeff] animate-spin rounded-full" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-[#111111] antialiased w-full">
      <nav className="sticky top-0 z-50 bg-white border-b border-[#EEEEEE] flex items-center justify-between h-[56px] px-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="active:opacity-50 transition-opacity -ml-1">
            <ChevronLeft size={24} strokeWidth={2} />
          </button>
          <h1 className="text-[17px] font-bold"> {t("pages.orderme.title")}</h1>
        </div>
      </nav>

      <div className="bg-white border-b border-[#EEEEEE] sticky top-[56px] z-40 overflow-x-auto no-scrollbar">
        <div className="flex px-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-4 py-3 text-[14px] font-medium relative transition-colors ${
                activeTab === tab.id ? "text-[#00aeff]" : "text-[#666666]"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1 bg-[#00aeff] text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00aeff] mx-4" />
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="w-full pb-20 mt-2">
        {filteredOrders.length > 0 ? (
          <div className="flex flex-col gap-2">
            {filteredOrders.map(order => (
              <div key={order._id} className="bg-white p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[11px] font-bold text-gray-400">#{order._id.slice(-8).toUpperCase()}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded ${order.isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                    {order.isPaid ? 'Paid' : 'Pending'}
                  </span>
                </div>
                {order.orderItems.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-3 mb-3">
                    <img src={item.image} className="w-16 h-16 object-cover rounded-lg border border-gray-50" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{item.name}</p>
                      <p className="text-xs text-gray-500 mt-1">Qty: {item.qty} x ฿{item.price.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                <div className="border-t border-dashed border-gray-100 pt-3 flex justify-between items-center">
                  <span className="text-xs text-gray-500">Order Income</span>
                  <span className="text-sm font-black text-[#00aeff]">฿{order.orderItems.reduce((acc: number, item: any) => acc + (item.price * item.qty), 0).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-[#CCCCCC]">
            <ShoppingBag size={48} strokeWidth={1} />
            <p className="mt-2 text-[14px]">No orders found</p>
          </div>
        )}
      </main>

      <div className="fixed bottom-6 right-6">
        <button className="w-12 h-12 bg-white shadow-xl rounded-full flex items-center justify-center border border-[#EEEEEE]">
          <MoreHorizontal size={24} />
        </button>
      </div>
    </div>
  );
}
