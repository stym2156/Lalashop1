import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, DollarSign, Globe, Scan } from "lucide-react";
import { fetchMyOrders, type SellerOrderRow } from "@/services/sellerApi";
import { useCurrentSeller } from "@/services/useCurrentSeller";

const formatMoney = (n: number): string =>
  Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const RevenueDashboardPage: React.FC = () => {
  const { t } = useTranslation("common");
  const { seller } = useCurrentSeller();
  const [orders, setOrders] = useState<SellerOrderRow[]>([]);
  const [loading, setLoading] = useState(true);

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

  const split = useMemo(() => {
    const paid = orders.filter((o) => o.isPaid);
    const web = paid.filter((o) => (o as SellerOrderRow & { channel?: string }).channel !== "pos");
    const pos = paid.filter((o) => (o as SellerOrderRow & { channel?: string }).channel === "pos");
    return {
      web: { count: web.length, revenue: web.reduce((s, o) => s + o.totalPrice, 0) },
      pos: { count: pos.length, revenue: pos.reduce((s, o) => s + o.totalPrice, 0) },
    };
  }, [orders]);

  const total = split.web.revenue + split.pos.revenue;
  const webShare = total > 0 ? (split.web.revenue / total) * 100 : 0;
  const posShare = total > 0 ? (split.pos.revenue / total) * 100 : 0;

  return (
    <div className="space-y-4 text-sm">
      <div>
        <h1 className="text-[16px] font-bold text-gray-900">{t('pages.revenueDashboard.title')}</h1>
        <p className="text-[12px] text-gray-500 mt-0.5">
          {t('pages.revenueDashboard.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-[#00aeff] to-[#0096db] text-white p-5">
          <div className="flex items-center gap-2 text-white/80 text-[11px] font-bold tracking-wide">
            <Globe className="w-3.5 h-3.5" /> {t('pages.revenueDashboard.webRevenue')}
          </div>
          <p className="text-[28px] font-black tabular-nums mt-2">
            {loading ? "—" : `฿${formatMoney(split.web.revenue)}`}
          </p>
          <p className="text-[11px] text-white/80 mt-1">
            {t('pages.revenueDashboard.orders', { count: split.web.count })}
          </p>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white p-5">
          <div className="flex items-center gap-2 text-white/80 text-[11px] font-bold tracking-wide">
            <Scan className="w-3.5 h-3.5" /> {t('pages.revenueDashboard.posRevenue')}
          </div>
          <p className="text-[28px] font-black tabular-nums mt-2">
            {loading ? "—" : `฿${formatMoney(split.pos.revenue)}`}
          </p>
          <p className="text-[11px] text-white/80 mt-1">
            {t('pages.revenueDashboard.sales', { count: split.pos.count })}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-100 p-4 space-y-3">
        <h3 className="text-[12px] font-bold text-gray-700 tracking-wide">{t('pages.revenueDashboard.distribution')}</h3>
        <div className="flex h-3 rounded overflow-hidden">
          <div className="bg-[#00aeff]" style={{ width: `${webShare}%` }} />
          <div className="bg-emerald-600" style={{ width: `${posShare}%` }} />
        </div>
        <div className="grid grid-cols-2 gap-3 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-[#00aeff] rounded-sm" />
            <span className="text-gray-700">{t('pages.revenueDashboard.web')} {webShare.toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-emerald-600 rounded-sm" />
            <span className="text-gray-700">{t('pages.revenueDashboard.pos')} {posShare.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat
          label={t('pages.revenueDashboard.withdrawableBalance')}
          value={loading ? "—" : `฿${formatMoney(seller?.balance ?? 0)}`}
          tone="text-[#00aeff]"
          desc={t('pages.revenueDashboard.withdrawableDesc')}
        />
        <Stat
          label={t('pages.revenueDashboard.posLifetime')}
          value={loading ? "—" : `฿${formatMoney(((seller as { posRevenue?: number })?.posRevenue) ?? split.pos.revenue)}`}
          tone="text-emerald-600"
          desc={t('pages.revenueDashboard.posLifetimeDesc')}
        />
      </div>

      {loading && (
        <div className="py-8 text-center text-gray-400 text-[12px]">
          <Loader2 className="w-5 h-5 mx-auto animate-spin" />
        </div>
      )}
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string; tone: string; desc: string }> = ({
  label, value, tone, desc,
}) => (
  <div className="rounded-lg border border-gray-100 p-4">
    <p className="text-[11px] font-semibold text-gray-500 tracking-wide">{label}</p>
    <p className={`text-[22px] font-black tabular-nums mt-1 ${tone}`}>{value}</p>
    <p className="text-[10px] text-gray-400 mt-1">{desc}</p>
  </div>
);

export default RevenueDashboardPage;
