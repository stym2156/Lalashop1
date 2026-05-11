import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Loader2, TrendingUp, Eye, ShoppingCart, CreditCard, ChevronRight,
} from "lucide-react";
import { fetchConversionFunnel, type ConversionFunnel } from "@/services/sellerApi";

type RangeKey = "7d" | "30d" | "90d";
const RANGES: { key: RangeKey; label: string; days: number }[] = [
  { key: "7d", label: "7 Days", days: 7 },
  { key: "30d", label: "30 Days", days: 30 },
  { key: "90d", label: "90 Days", days: 90 },
];

const formatMoney = (n: number): string =>
  Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

const ConversionPage: React.FC = () => {
  const { t } = useTranslation("common");
  const [data, setData] = useState<ConversionFunnel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<RangeKey>("30d");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const days = RANGES.find((r) => r.key === range)?.days || 30;
    fetchConversionFunnel(days)
      .then((d) => {
        if (!cancelled) setData(d);
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
  }, [range]);

  // Funnel bar widths — anchor to the largest stage so smaller stages render
  // proportionally. Avoid divide-by-zero when there are no views yet.
  const max = Math.max(
    data?.productViewers || 0,
    data?.cartUsers || 0,
    data?.orderUsers || 0,
    1
  );

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-[16px] font-bold text-gray-900">{t('pages.conversion.title')}</h1>
          <p className="text-[12px] text-gray-500 mt-0.5">
            {t('pages.conversion.subtitle')}
          </p>
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

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="py-12 text-center">
          <Loader2 className="w-5 h-5 animate-spin text-gray-300 mx-auto" />
        </div>
      ) : !data ? (
        <div className="py-16 text-center text-gray-400">
          <TrendingUp className="w-7 h-7 mx-auto mb-3 text-gray-300" />
          <p className="text-[12px]">{t('pages.conversion.noData')}</p>
        </div>
      ) : (
        <>
          {/* KPI bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPI label={t('pages.conversion.viewToCart')} value={`${data.viewToCartRate}%`} tone="text-blue-700" />
            <KPI label={t('pages.conversion.viewToOrder')} value={`${data.viewToOrderRate}%`} tone="text-emerald-700" />
            <KPI label={t('pages.conversion.cartToOrder')} value={`${data.cartToOrderRate}%`} tone="text-purple-700" />
            <KPI
              label={t('pages.conversion.paidRevenue')}
              value={`฿${formatMoney(data.paidRevenue)}`}
              tone="text-[#00aeff]"
            />
          </div>

          {/* Funnel */}
          <div className="rounded-lg border border-gray-100 p-5 bg-white space-y-3">
            <h3 className="text-[13px] font-bold text-gray-900">{t('pages.conversion.funnel')}</h3>

            <FunnelStage
              icon={Eye}
              label={t('pages.conversion.productViewers')}
              value={data.productViewers}
              widthPct={(data.productViewers / max) * 100}
              tone="bg-blue-100 text-blue-700"
              barTone="bg-blue-400"
              hint={data.productViewers !== data.productViewSessions
                ? t('pages.conversion.sessionsLoggedOutHint', { count: data.productViewSessions })
                : t('pages.conversion.sessionsHint', { count: data.productViewSessions })}
            />
            <FunnelStage
              icon={ShoppingCart}
              label={t('pages.conversion.addedToCart')}
              value={data.cartUsers}
              widthPct={(data.cartUsers / max) * 100}
              tone="bg-amber-100 text-amber-700"
              barTone="bg-amber-400"
              hint={t('pages.conversion.viewersHint', { rate: data.viewToCartRate })}
              arrow
            />
            <FunnelStage
              icon={CreditCard}
              label={t('pages.conversion.placedOrder')}
              value={data.orderUsers}
              widthPct={(data.orderUsers / max) * 100}
              tone="bg-emerald-100 text-emerald-700"
              barTone="bg-emerald-500"
              hint={t('pages.conversion.cartUsersHint', { rate: data.cartToOrderRate, paid: data.paidOrders })}
              arrow
            />
          </div>

          <div className="rounded-lg bg-gray-50 px-4 py-3 text-[11px] text-gray-500 leading-relaxed">
            <strong className="text-gray-700">{t('pages.conversion.note')}</strong> {t('pages.conversion.noteText')}
          </div>
        </>
      )}
    </div>
  );
};

interface FunnelStageProps {
  icon: typeof Eye;
  label: string;
  value: number;
  widthPct: number;
  tone: string;
  barTone: string;
  hint?: string;
  arrow?: boolean;
}

const FunnelStage: React.FC<FunnelStageProps> = ({
  icon: Icon, label, value, widthPct, tone, barTone, hint, arrow,
}) => (
  <div>
    {arrow && (
      <div className="flex justify-center my-1">
        <ChevronRight className="w-4 h-4 text-gray-300 rotate-90" />
      </div>
    )}
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 ${tone}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[12px] font-bold text-gray-900">{label}</p>
          <p className="text-[16px] font-black tabular-nums text-gray-900">
            {value.toLocaleString()}
          </p>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-1">
          <div
            className={`h-full rounded-full ${barTone} transition-all`}
            style={{ width: `${Math.max(2, widthPct)}%` }}
          />
        </div>
        {hint && <p className="text-[10px] text-gray-500 mt-0.5">{hint}</p>}
      </div>
    </div>
  </div>
);

const KPI: React.FC<{ label: string; value: string; tone?: string }> = ({ label, value, tone }) => (
  <div className="rounded-lg border border-gray-100 px-4 py-3 bg-white">
    <p className="text-[10px] font-semibold text-gray-500 tracking-wide">{label}</p>
    <p className={`text-[22px] font-bold tabular-nums mt-1 ${tone || "text-gray-900"}`}>{value}</p>
  </div>
);

export default ConversionPage;
