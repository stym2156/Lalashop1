"use client";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiClient } from "@/services/apiClient";

interface Order {
  _id: string;
  orderItems: Array<{ name: string; image: string; qty: number; price: number }>;
  totalPrice: number;
  isPaid: boolean;
  isDelivered: boolean;
  status: string;
  createdAt: string;
}

const formatMoney = (n: number): string =>
  Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });

export default function Shipped() {
  const { t } = useTranslation("common");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient("/orders/mine")
      .then((res) => {
        if (cancelled) return;
        const all = (res?.orders ?? res?.data ?? []) as Order[];
        setOrders(all.filter((o) => o.status === "shipped" || (o.isDelivered && !o.isPaid)));
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <div className="p-6 text-center text-gray-400 text-[13px]">{t("pages.ordermeShipped.loading")}</div>;
  if (error) return <div className="p-6 text-center text-red-500 text-[13px]">{error}</div>;
  if (orders.length === 0)
    return <div className="p-6 text-center text-gray-400 text-[13px]">{t("pages.ordermeShipped.noOrders")}</div>;

  return (
    <div className="flex flex-col gap-2">
      {orders.map((o) => {
        const first = o.orderItems[0];
        return (
          <div key={o._id} className="bg-white p-4 border-y border-[#EEEEEE] flex flex-col gap-3">
            <div className="flex justify-between items-center pb-2 border-b border-[#F8F8F8]">
              <span className="text-[13px] font-bold text-gray-500 italic">
                #{o._id.slice(-8).toUpperCase()}
              </span>
              <span className="text-[13px] font-medium text-[#00aeff]">{t("pages.ordermeShipped.label")}</span>
            </div>
            {first && (
              <div className="flex gap-3">
                <div className="w-16 h-16 bg-[#F8F8F8] rounded-md overflow-hidden flex-shrink-0">
                  {first.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={first.image} className="w-full h-full object-cover" alt={first.name} />
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <h4 className="text-[14px] font-medium text-[#111111] line-clamp-1">
                    {first.name}
                  </h4>
                  <div className="flex justify-between items-end">
                    <span className="text-[12px] text-[#888888]">
                      {o.orderItems.length > 1 ? `${o.orderItems.length} items` : `Quantity: ${first.qty}`}
                    </span>
                    <span className="text-[14px] font-bold">฿{formatMoney(o.totalPrice)}</span>
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2 border-t border-[#F8F8F8]">
              <button className="w-full py-2 border border-[#00aeff] text-[#00aeff] rounded-full text-[13px] font-medium active:bg-blue-50">
                {t("pages.ordermeShipped.checkDelivery")}
              </button>
              <button className="w-full py-2 border border-[#DDDDDD] rounded-full text-[13px] font-medium active:bg-gray-50 text-gray-600">
                {t("pages.ordermeShipped.details")}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
