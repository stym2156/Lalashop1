import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Calendar, Clock } from "lucide-react";
import { fetchMyOrders, type SellerOrderRow } from "@/services/sellerApi";

const formatMoney = (n: number): string =>
  Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });

interface DayShift {
  date: string;
  count: number;
  revenue: number;
  items: number;
  firstSale: Date;
  lastSale: Date;
}

const PosShiftsPage: React.FC = () => {
  const { t } = useTranslation("common");
  const [orders, setOrders] = useState<SellerOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Group POS orders by day (YYYY-MM-DD) — each day = one shift summary
  const shifts: DayShift[] = useMemo(() => {
    const posOrders = orders.filter(
      (o) => (o as SellerOrderRow & { channel?: string }).channel === "pos",
    );
    const map = new Map<string, DayShift>();
    for (const o of posOrders) {
      const d = new Date(o.paidAt || o.createdAt);
      if (Number.isNaN(d.getTime())) continue;
      const key = d.toISOString().slice(0, 10);
      const items = o.orderItems.reduce((s, i) => s + i.qty, 0);
      if (!map.has(key)) {
        map.set(key, {
          date: key,
          count: 0,
          revenue: 0,
          items: 0,
          firstSale: d,
          lastSale: d,
        });
      }
      const shift = map.get(key)!;
      shift.count += 1;
      shift.revenue += o.totalPrice;
      shift.items += items;
      if (d < shift.firstSale) shift.firstSale = d;
      if (d > shift.lastSale) shift.lastSale = d;
    }
    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [orders]);

  const formatTime = (d: Date): string => {
    const pad = (x: number) => String(x).padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const duration = (a: Date, b: Date): string => {
    const ms = b.getTime() - a.getTime();
    if (ms < 60000) return "<1m";
    const hours = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-4 text-sm">
      <div>
        <h1 className="text-[16px] font-bold text-gray-900">{t('pages.posShifts.title')}</h1>
        <p className="text-[12px] text-gray-500 mt-0.5">
          {t('pages.posShifts.subtitle')}
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</div>
      )}

      <div className="rounded-lg overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] tabular-nums">
            <thead className="text-[11px] text-gray-500 tracking-wide bg-gray-50/50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">Date</th>
                <th className="px-4 py-2 text-left font-semibold">First sale</th>
                <th className="px-4 py-2 text-left font-semibold">Last sale</th>
                <th className="px-4 py-2 text-left font-semibold">Duration</th>
                <th className="px-4 py-2 text-right font-semibold">Sales</th>
                <th className="px-4 py-2 text-right font-semibold">Items</th>
                <th className="px-4 py-2 text-right font-semibold">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                    <Loader2 className="w-5 h-5 mx-auto animate-spin" />
                  </td>
                </tr>
              )}
              {!loading && shifts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                    <Calendar className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                    No POS shifts recorded yet
                  </td>
                </tr>
              )}
              {!loading &&
                shifts.map((s) => (
                  <tr key={s.date} className="border-t border-gray-50">
                    <td className="px-4 py-2 font-bold text-gray-900">{s.date}</td>
                    <td className="px-4 py-2 text-gray-700 text-[11px]">
                      <Clock className="w-3 h-3 inline mr-1 text-gray-400" />
                      {formatTime(s.firstSale)}
                    </td>
                    <td className="px-4 py-2 text-gray-700 text-[11px]">
                      <Clock className="w-3 h-3 inline mr-1 text-gray-400" />
                      {formatTime(s.lastSale)}
                    </td>
                    <td className="px-4 py-2 text-gray-500 text-[11px]">
                      {duration(s.firstSale, s.lastSale)}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-900">{s.count}</td>
                    <td className="px-4 py-2 text-right text-gray-900">{s.items}</td>
                    <td className="px-4 py-2 text-right font-bold text-emerald-700">
                      ฿{formatMoney(s.revenue)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[11px] text-gray-400">
        Shift = a contiguous business day. First and last sale times come from the actual POS
        transactions (not a manual clock-in/out).
      </p>
    </div>
  );
};

export default PosShiftsPage;
