import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, TrendingUp, ShoppingBag, DollarSign, Calendar } from "lucide-react";
import { fetchMyOrders, type SellerOrderRow } from "@/services/sellerApi";

type RangeKey = "7d" | "30d" | "90d";

const RANGES: { key: RangeKey; label: string; days: number }[] = [
  { key: "7d", label: "7 Days", days: 7 },
  { key: "30d", label: "30 Days", days: 30 },
  { key: "90d", label: "90 Days", days: 90 },
];

const formatMoney = (n: number): string =>
  Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

const SalesAnalyticsPage: React.FC = () => {
  const { t } = useTranslation("common");
  const [orders, setOrders] = useState<SellerOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<RangeKey>("30d");

  useEffect(() => {
    let cancelled = false;
    fetchMyOrders()
      .then((data) => {
        if (!cancelled) setOrders(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const days = RANGES.find((r) => r.key === range)!.days;
  const cutoff = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - days + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [days]);

  const chartData = useMemo(() => {
    const buckets = new Array(days).fill(0).map((_, i) => {
      const d = new Date(cutoff);
      d.setDate(d.getDate() + i);
      return {
        name: `${d.getMonth() + 1}/${d.getDate()}`,
        key: d.toDateString(),
        revenue: 0,
        orders: 0,
      };
    });
    const indexByKey = new Map(buckets.map((b, i) => [b.key, i]));
    for (const o of orders) {
      if (!o.isPaid) continue;
      const d = new Date(o.paidAt || o.createdAt);
      const idx = indexByKey.get(d.toDateString());
      if (idx === undefined) continue;
      buckets[idx].revenue += o.totalPrice;
      buckets[idx].orders += 1;
    }
    return buckets.map(({ name, revenue, orders }) => ({ name, revenue, orders }));
  }, [orders, days, cutoff]);

  const totals = useMemo(() => {
    const inRange = orders.filter((o) => new Date(o.paidAt || o.createdAt) >= cutoff && o.isPaid);
    const revenue = inRange.reduce((s, o) => s + o.totalPrice, 0);
    const count = inRange.length;
    const aov = count > 0 ? revenue / count : 0;
    return { revenue, count, aov };
  }, [orders, cutoff]);

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-[16px] font-bold text-gray-900">{t('pages.salesAnalytics.title')}</h1>
          <p className="text-[12px] text-gray-500 mt-0.5">{t('pages.salesAnalytics.subtitle')}</p>
        </div>
        <div className="flex items-center gap-1.5 bg-gray-100 rounded p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`px-3 py-1 rounded text-[11px] font-bold ${
                range === r.key ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-black"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <KPI icon={DollarSign} label={t('pages.salesAnalytics.revenue')} value={loading ? "—" : `฿${formatMoney(totals.revenue)}`} tone="text-emerald-700" />
        <KPI icon={ShoppingBag} label={t('pages.salesAnalytics.orders')} value={loading ? "—" : totals.count.toLocaleString()} tone="text-blue-700" />
        <KPI icon={TrendingUp} label={t('pages.salesAnalytics.avgOrderValue')} value={loading ? "—" : `฿${formatMoney(totals.aov)}`} tone="text-purple-700" />
      </div>

      <div className="rounded-lg border border-gray-100 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          <h3 className="text-[12px] font-bold text-gray-700">{t('pages.salesAnalytics.revenueTrend')}</h3>
        </div>
        <BarChart data={chartData} />
      </div>

      {loading && (
        <div className="py-8 text-center text-gray-400 text-[12px]">
          <Loader2 className="w-5 h-5 mx-auto animate-spin" />
        </div>
      )}
    </div>
  );
};

interface BarChartProps {
  data: Array<{ name: string; revenue: number; orders: number }>;
}

// Lightweight inline chart (no extra dependency)
const BarChart: React.FC<BarChartProps> = ({ data }) => {
  const max = Math.max(1, ...data.map((d) => d.revenue));
  return (
    <div className="space-y-2">
      <div className="h-[180px] w-full flex items-end gap-px bg-gradient-to-t from-gray-50 to-transparent rounded-md p-2">
        {data.map((d, i) => {
          const heightPct = (d.revenue / max) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
              <div
                className="w-full bg-[#00aeff] rounded-t hover:bg-[#0096db] transition-colors"
                style={{ height: `${heightPct}%`, minHeight: d.revenue > 0 ? "2px" : "0" }}
                title={`${d.name}: ฿${d.revenue.toLocaleString()} · ${d.orders} order${d.orders === 1 ? "" : "s"}`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-gray-400 px-2">
        {data.length > 0 && (
          <>
            <span>{data[0].name}</span>
            {data.length > 8 && <span>{data[Math.floor(data.length / 2)].name}</span>}
            <span>{data[data.length - 1].name}</span>
          </>
        )}
      </div>
    </div>
  );
};

const KPI: React.FC<{ icon: typeof DollarSign; label: string; value: string; tone: string }> = ({
  icon: Icon, label, value, tone,
}) => (
  <div className="rounded-lg border border-gray-100 px-4 py-3">
    <div className="flex items-center gap-1.5">
      <Icon className="w-3 h-3 text-gray-400" />
      <p className="text-[11px] font-semibold text-gray-500 tracking-wide">{label}</p>
    </div>
    <p className={`text-[20px] font-bold tabular-nums mt-1 ${tone}`}>{value}</p>
  </div>
);

export default SalesAnalyticsPage;
