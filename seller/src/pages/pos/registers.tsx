import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Loader2, Monitor, ArrowRight } from "lucide-react";
import { fetchMyOrders, type SellerOrderRow } from "@/services/sellerApi";

const formatMoney = (n: number): string =>
  Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });

const formatDate = (s?: string | Date): string => {
  if (!s) return "—";
  const d = s instanceof Date ? s : new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

interface RegisterRow {
  id: string;
  count: number;
  revenue: number;
  lastSale: Date | null;
}

const RegistersPage: React.FC = () => {
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

  const registers: RegisterRow[] = useMemo(() => {
    const map = new Map<string, RegisterRow>();
    for (const o of orders) {
      const ext = o as SellerOrderRow & { channel?: string; posTerminal?: string };
      if (ext.channel !== "pos") continue;
      const id = ext.posTerminal || "default";
      if (!map.has(id)) map.set(id, { id, count: 0, revenue: 0, lastSale: null });
      const r = map.get(id)!;
      r.count += 1;
      r.revenue += o.totalPrice;
      const d = new Date(o.paidAt || o.createdAt);
      if (!Number.isNaN(d.getTime()) && (!r.lastSale || d > r.lastSale)) r.lastSale = d;
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [orders]);

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[16px] font-bold text-gray-900">{t('pages.registers.title')}</h1>
          <p className="text-[12px] text-gray-500 mt-0.5">
            {t('pages.registers.subtitle')}
          </p>
        </div>
        <Link
          href="/pos/terminal"
          className="bg-emerald-600 text-white px-3 py-1.5 rounded-md text-xs font-bold inline-flex items-center hover:bg-emerald-700"
        >
          {t('pages.registers.openTerminal')} <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
        </Link>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="py-12 text-center text-gray-400 text-[12px]">
          <Loader2 className="w-5 h-5 mx-auto animate-spin" />
        </div>
      ) : registers.length === 0 ? (
        <div className="py-16 text-center">
          <Monitor className="w-8 h-8 mx-auto mb-3 text-gray-300" />
          <p className="text-[13px] font-bold text-gray-700">No registers yet</p>
          <p className="text-[11px] text-gray-500 mt-1">
            Ring up your first sale at the{" "}
            <Link href="/pos/terminal" className="text-emerald-600 font-bold hover:underline">
              POS terminal
            </Link>{" "}
            to register one.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {registers.map((r) => (
            <div key={r.id} className="rounded-lg border border-gray-100 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-emerald-600" />
                <h3 className="text-[13px] font-black text-gray-900 font-mono">{r.id}</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <p className="text-gray-500">Sales</p>
                  <p className="text-[16px] font-bold text-gray-900 tabular-nums">{r.count}</p>
                </div>
                <div>
                  <p className="text-gray-500">Revenue</p>
                  <p className="text-[16px] font-bold text-emerald-700 tabular-nums">
                    ฿{formatMoney(r.revenue)}
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-gray-400">Last sale: {formatDate(r.lastSale ?? undefined)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RegistersPage;
