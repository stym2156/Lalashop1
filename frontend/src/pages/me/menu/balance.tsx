"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Info, ChevronLeft, ChevronRight } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTranslation } from "react-i18next";
import { apiClient } from "@/services/apiClient";

interface OrderItem {
  product?: string;
  name: string;
  image: string;
  qty: number;
  price: number;
  seller?: string;
}

interface OrderRow {
  _id: string;
  orderItems: OrderItem[];
  totalPrice: number;
  isPaid: boolean;
  isDelivered: boolean;
  paidAt?: string;
  createdAt: string;
}

interface ProductRow {
  _id: string;
  name: string;
  image: string | string[];
  images?: string[];
  price: number;
  soldCount?: number;
}

interface MeResponse {
  balance?: number;
  isSeller?: boolean;
  orderCount?: number;
}

type RangeKey = "today" | "7d" | "30d" | "custom";

const rangeStart = (range: RangeKey): Date => {
  const now = new Date();
  if (range === "today") {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (range === "7d") {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (range === "30d") {
    const d = new Date(now);
    d.setDate(d.getDate() - 29);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return new Date(0);
};

const bucketLabel = (d: Date, range: RangeKey): string => {
  if (range === "today") {
    return `${String(d.getHours()).padStart(2, "0")}:00`;
  }
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

const formatCurrency = (n: number): string =>
  Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

const productImage = (p: ProductRow): string => {
  if (Array.isArray(p.images) && p.images.length > 0) return p.images[0];
  if (typeof p.image === "string") return p.image;
  if (Array.isArray(p.image) && p.image.length > 0) return p.image[0];
  return "";
};

export default function AttrView({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation("common");
  const [timeRange, setTimeRange] = useState<RangeKey>("today");
  const [balance, setBalance] = useState<number | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      apiClient("/auth/me").catch(() => null),
      apiClient("/orders/seller").catch(() => null),
      apiClient("/products/my").catch(() => null),
    ])
      .then(([meRes, ordersRes, productsRes]) => {
        if (cancelled) return;
        const me = (meRes ?? {}) as MeResponse;
        setBalance(typeof me.balance === "number" ? me.balance : 0);
        const orderList = (ordersRes?.orders ?? ordersRes?.data ?? []) as OrderRow[];
        setOrders(Array.isArray(orderList) ? orderList : []);
        const productList = (productsRes?.data ?? productsRes ?? []) as ProductRow[];
        setProducts(Array.isArray(productList) ? productList : []);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const inRangeOrders = useMemo(() => {
    const start = rangeStart(timeRange);
    return orders.filter((o) => {
      const d = new Date(o.paidAt || o.createdAt);
      return !Number.isNaN(d.getTime()) && d >= start;
    });
  }, [orders, timeRange]);

  const totalRevenue = useMemo(
    () => inRangeOrders.filter((o) => o.isPaid).reduce((s, o) => s + (o.totalPrice || 0), 0),
    [inRangeOrders]
  );

  const ordersCount = inRangeOrders.length;

  const productCount = products.length;

  const conversionRate = useMemo(() => {
    if (productCount === 0) return "0%";
    return `${((ordersCount / productCount) * 100).toFixed(1)}%`;
  }, [ordersCount, productCount]);

  const chartData = useMemo(() => {
    if (timeRange === "today") {
      const buckets = new Array(24).fill(0).map((_, h) => ({
        name: `${String(h).padStart(2, "0")}:00`,
        value: 0,
      }));
      for (const o of inRangeOrders) {
        if (!o.isPaid) continue;
        const d = new Date(o.paidAt || o.createdAt);
        const h = d.getHours();
        if (Number.isFinite(h)) buckets[h].value += o.totalPrice || 0;
      }
      return buckets;
    }
    const days = timeRange === "7d" ? 7 : 30;
    const start = rangeStart(timeRange);
    const buckets = new Array(days).fill(0).map((_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return { name: bucketLabel(d, timeRange), value: 0, key: d.toDateString() };
    });
    const indexByKey = new Map(buckets.map((b, i) => [b.key, i]));
    for (const o of inRangeOrders) {
      if (!o.isPaid) continue;
      const d = new Date(o.paidAt || o.createdAt);
      const k = d.toDateString();
      const idx = indexByKey.get(k);
      if (idx !== undefined) buckets[idx].value += o.totalPrice || 0;
    }
    return buckets.map(({ name, value }) => ({ name, value }));
  }, [inRangeOrders, timeRange]);

  // Best sellers — derived from actual order items in the selected range so
  // the list reflects real sales, not the stale `soldCount` counter that
  // historically wasn't always written.
  const bestSellers = useMemo(() => {
    const units = new Map<string, number>();
    const revenue = new Map<string, number>();
    for (const o of inRangeOrders) {
      if (!o.isPaid) continue;
      for (const it of o.orderItems || []) {
        const pid = String(it.product || "");
        if (!pid) continue;
        units.set(pid, (units.get(pid) || 0) + (it.qty || 0));
        revenue.set(pid, (revenue.get(pid) || 0) + (it.qty || 0) * (it.price || 0));
      }
    }
    return [...products]
      .map((p) => ({
        ...p,
        unitsSold: units.get(p._id) || 0,
        revenue: revenue.get(p._id) || 0,
      }))
      .filter((p) => p.unitsSold > 0)
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 3);
  }, [products, inRangeOrders]);

  return (
    <div className="min-h-screen bg-[#F8F8F8] text-[#121212] antialiased">
      <nav className="sticky top-0 z-50 bg-white border-b border-[#EEEEEE] flex items-center justify-between h-[52px] px-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="active:opacity-50 transition-opacity -ml-1">
            <ChevronLeft size={26} strokeWidth={2.5} />
          </button>
          <h1 className="text-[17px] font-bold tracking-tight">{t("pages.balance.title")}</h1>
        </div>
      </nav>

      <main className="w-full pb-20">
        <div className="bg-white px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar border-b border-[#EEEEEE]">
          {(["today", "7d", "30d", "custom"] as RangeKey[]).map((id) => (
            <button
              key={id}
              onClick={() => setTimeRange(id)}
              className={`px-5 py-2 text-[13px] rounded-2xl font-bold transition-all shrink-0 ${
                timeRange === id
                  ? "bg-black text-white border border-black"
                  : "bg-white text-[#86878B] border border-[#EEEEEE]"
              }`}
            >
              {id === "today" ? t("pages.creatorAttr2.today") : id === "7d" ? t("pages.creatorAttr2.sevenDays") : id === "30d" ? t("pages.creatorAttr2.thirtyDays") : t("pages.balancePanel.custom")}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-rose-50 px-4 py-2 text-[12px] text-rose-700">{error}</div>
        )}

        <div className="bg-white grid grid-cols-2 border-b border-[#EEEEEE]">
          <MetricItem
            title={t("pages.balancePanel.currentBalance")}
            value={balance == null ? "—" : `฿${formatCurrency(balance)}`}
            isFirst
          />
          <MetricItem
            title={t("pages.balancePanel.revenueInRange")}
            value={`฿${formatCurrency(totalRevenue)}`}
          />
          <MetricItem title={t("pages.balancePanel.ordersInRange")} value={ordersCount.toLocaleString()} isFirst />
          <MetricItem title={t("pages.balancePanel.totalProducts")} value={productCount.toLocaleString()} />
        </div>

        <div className="bg-white mt-2 border-y border-[#EEEEEE] py-6 px-4">
          <div className="flex justify-between items-center mb-6 px-1">
            <div>
              <h3 className="text-[14px] font-bold">{t("pages.balancePanel.revenueTrend")}</h3>
              <p className="text-[11px] text-[#86878B]">
                {loading ? t("pages.balancePanel.loadingShort") : t("pages.balancePanel.basedOnOrders", { count: ordersCount })}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#00aeff]">
              <div className="w-2 h-2 rounded-full bg-[#00aeff] animate-pulse"></div>
              {t("pages.balancePanel.live")}
            </div>
          </div>

          <div className="h-[220px] w-full -ml-4">
            <ResponsiveContainer width="110%" height="100%">
              <AreaChart data={chartData} margin={{ left: 0, right: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00aeff" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#00aeff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F1F1" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#86878B" }}
                />
                <YAxis hide />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#00aeff"
                  strokeWidth={2}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white mt-2 border-y border-[#EEEEEE]">
          <div className="px-5 py-4 border-b border-[#F8F8F8] flex justify-between items-center">
            <h3 className="text-[14px] font-bold tracking-tight">{t("pages.balancePanel.bestSellers")}</h3>
            <ChevronRight size={18} className="text-[#C8C9CC]" />
          </div>
          <div className="divide-y divide-[#F8F8F8]">
            {loading ? (
              <div className="px-5 py-8 text-center text-[13px] text-[#86878B]">{t("status.loading")}</div>
            ) : bestSellers.length === 0 ? (
              <div className="px-5 py-8 text-center text-[13px] text-[#86878B]">
                {t("pages.balancePanel.noProductsYet")}
              </div>
            ) : (
              bestSellers.map((p) => {
                const img = productImage(p);
                return (
                  <div
                    key={p._id}
                    className="px-5 py-5 flex items-center justify-between active:bg-[#FAFAFA]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-[#F5F5F5] flex-shrink-0 overflow-hidden">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={img}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="space-y-1 min-w-0">
                        <p className="text-[14px] font-bold line-clamp-1">{p.name}</p>
                        <p className="text-[12px] text-[#86878B]">
                          {t("pages.balancePanel.soldEa", { count: p.unitsSold, price: formatCurrency(p.price) })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-bold tabular-nums">
                        ฿{formatCurrency(p.revenue)}
                      </p>
                      <p className="text-[10px] text-[#86878B]">{t("pages.balancePanel.revenueLabel")}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

interface MetricItemProps {
  title: string;
  value: string;
  isFirst?: boolean;
}

function MetricItem({ title, value, isFirst }: MetricItemProps) {
  return (
    <div className={`p-5 space-y-2 ${isFirst ? "border-r border-[#EEEEEE]" : ""}`}>
      <div className="flex items-center gap-1.5">
        <span className="text-[12px] font-medium text-[#86878B] tracking-wider">{title}</span>
        <Info size={13} className="text-[#C8C9CC]" />
      </div>
      <div className="flex flex-col">
        <span className="text-[24px] font-bold leading-tight">{value}</span>
      </div>
    </div>
  );
}
