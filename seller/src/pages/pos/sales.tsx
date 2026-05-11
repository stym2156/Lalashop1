import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Receipt, ScanBarcode, TrendingUp } from "lucide-react";
import { fetchMyOrders, type SellerOrderRow } from "@/services/sellerApi";

const formatMoney = (n: number): string =>
  Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (s?: string): string => {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const PosSalesPage: React.FC = () => {
  const { t } = useTranslation("common");
  const [orders, setOrders] = useState<SellerOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<"today" | "7d" | "30d" | "all">("today");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchMyOrders()
      .then((data) => {
        if (!cancelled) setOrders(data);
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

  const cutoff = useMemo(() => {
    const d = new Date();
    if (range === "today") d.setHours(0, 0, 0, 0);
    else if (range === "7d") d.setDate(d.getDate() - 7);
    else if (range === "30d") d.setDate(d.getDate() - 30);
    else return new Date(0);
    return d;
  }, [range]);

  const posSales = useMemo(() => {
    return orders.filter((o) => {
      const isPos = (o as SellerOrderRow & { channel?: string }).channel === "pos";
      if (!isPos) return false;
      const d = new Date(o.paidAt || o.createdAt);
      return !Number.isNaN(d.getTime()) && d >= cutoff;
    });
  }, [orders, cutoff]);

  const stats = useMemo(() => {
    const revenue = posSales.reduce((s, o) => s + o.totalPrice, 0);
    const items = posSales.reduce(
      (s, o) => s + o.orderItems.reduce((s2, i) => s2 + i.qty, 0),
      0,
    );
    const avg = posSales.length > 0 ? revenue / posSales.length : 0;
    return { count: posSales.length, revenue, items, avg };
  }, [posSales]);

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-[16px] font-bold text-gray-900">{t('pages.posSales.title')}</h1>
          <p className="text-[12px] text-gray-500 mt-0.5">
            {t('pages.posSales.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-gray-100 rounded p-0.5">
          {(["today", "7d", "30d", "all"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 rounded text-[11px] font-bold transition-all ${
                range === r ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-black"
              }`}
            >
              {r === "today" ? t('ranges.today') : r === "7d" ? t('ranges.7d') : r === "30d" ? t('ranges.30d') : t('ranges.all')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label={t('pages.posSales.salesCount')} value={stats.count.toLocaleString()} tone="text-blue-700" />
        <KPI label={t('pages.posSales.itemsSold')} value={stats.items.toLocaleString()} tone="text-purple-700" />
        <KPI label={t('pages.posSales.revenue')} value={`฿${formatMoney(stats.revenue)}`} tone="text-emerald-700" />
        <KPI label={t('pages.posSales.avgTicket')} value={`฿${formatMoney(stats.avg)}`} tone="text-black" />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</div>
      )}

      <div className="rounded-lg overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] tabular-nums">
            <thead className="text-[11px] text-gray-500 tracking-wide bg-gray-50/50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">Receipt</th>
                <th className="px-4 py-2 text-right font-semibold">Items</th>
                <th className="px-4 py-2 text-left font-semibold">Method</th>
                <th className="px-4 py-2 text-left font-semibold">Terminal</th>
                <th className="px-4 py-2 text-right font-semibold">Total</th>
                <th className="px-4 py-2 text-left font-semibold">Time</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                    <Loader2 className="w-5 h-5 mx-auto animate-spin" />
                  </td>
                </tr>
              )}
              {!loading && posSales.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                    <ScanBarcode className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                    No POS sales in this range
                  </td>
                </tr>
              )}
              {!loading &&
                posSales.map((o) => {
                  const itemCount = o.orderItems.reduce((s, i) => s + i.qty, 0);
                  const terminal = (o as SellerOrderRow & { posTerminal?: string }).posTerminal || "—";
                  return (
                    <tr key={o._id} className="border-t border-gray-50">
                      <td className="px-4 py-2 font-mono text-[11px] text-gray-600">
                        <Receipt className="w-3 h-3 inline mr-1 text-emerald-600" />
                        {o._id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-900">{itemCount}</td>
                      <td className="px-4 py-2 text-gray-700">{o.paymentMethod}</td>
                      <td className="px-4 py-2 text-gray-500 text-[11px]">{terminal}</td>
                      <td className="px-4 py-2 text-right font-semibold text-emerald-700">
                        ฿{formatMoney(o.totalPrice)}
                      </td>
                      <td className="px-4 py-2 text-gray-500 text-[11px]">
                        {formatDate(o.paidAt || o.createdAt)}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const KPI: React.FC<{ label: string; value: string; tone: string }> = ({ label, value, tone }) => (
  <div className="rounded-lg border border-gray-100 px-4 py-3">
    <p className="text-[11px] font-semibold text-gray-500 tracking-wide">{label}</p>
    <p className={`text-[20px] font-bold tabular-nums mt-1 ${tone}`}>{value}</p>
  </div>
);

export default PosSalesPage;
