import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, MousePointer, ShoppingCart, TrendingUp, Award } from "lucide-react";
import { fetchAffiliateSummary, type AffiliateSummary } from "@/services/sellerApi";

const formatMoney = (n: number): string =>
  Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });

const PerformancePage: React.FC = () => {
  const { t } = useTranslation("common");
  const [data, setData] = useState<AffiliateSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAffiliateSummary()
      .then((res) => {
        if (!cancelled) setData(res);
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

  if (loading) {
    return <div className="py-12 text-center"><Loader2 className="w-5 h-5 mx-auto animate-spin text-gray-400" /></div>;
  }
  if (error || !data) {
    return <div className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700">{error || t("status.empty")}</div>;
  }

  const conversion =
    data.totals.totalClicks > 0
      ? ((data.creators.reduce((s, c) => s + c.ordersCount, 0) / data.totals.totalClicks) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="space-y-4 text-sm">
      <div>
        <h1 className="text-[16px] font-bold text-gray-900">{t('pages.performance.title')}</h1>
        <p className="text-[12px] text-gray-500 mt-0.5">
          {t('pages.performance.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI icon={MousePointer} label={t('pages.performance.totalClicks')} value={data.totals.totalClicks.toLocaleString()} tone="text-amber-700" />
        <KPI icon={ShoppingCart} label={t('pages.performance.affiliateOrders')} value={data.creators.reduce((s, c) => s + c.ordersCount, 0).toLocaleString()} tone="text-blue-700" />
        <KPI icon={TrendingUp} label={t('pages.performance.conversion')} value={`${conversion}%`} tone="text-purple-700" />
        <KPI icon={Award} label={t('pages.performance.affiliateRevenue')} value={`฿${formatMoney(data.totals.totalAffiliateRevenue)}`} tone="text-emerald-700" />
      </div>

      <div className="rounded-lg overflow-hidden border border-gray-100">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-[13px] font-bold text-gray-900">{t("pages.performance.topCreators")}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] tabular-nums">
            <thead className="text-[11px] text-gray-500 tracking-wide bg-gray-50/50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">#</th>
                <th className="px-4 py-2 text-left font-semibold">{t("pages.performance.tableCreator")}</th>
                <th className="px-4 py-2 text-right font-semibold">{t("pages.performance.tableClicks")}</th>
                <th className="px-4 py-2 text-right font-semibold">{t("pages.performance.tableOrders")}</th>
                <th className="px-4 py-2 text-right font-semibold">{t("pages.performance.tableConv")}</th>
                <th className="px-4 py-2 text-right font-semibold">{t("pages.performance.tableRevenue")}</th>
                <th className="px-4 py-2 text-right font-semibold">{t("pages.performance.tableYouPaid")}</th>
              </tr>
            </thead>
            <tbody>
              {data.creators.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                    {t("pages.performance.noActivity")}
                  </td>
                </tr>
              )}
              {[...data.creators]
                .sort((a, b) => b.totalRevenue - a.totalRevenue)
                .map((c, i) => {
                  const conv =
                    c.clicks > 0 ? ((c.ordersCount / c.clicks) * 100).toFixed(1) : "0.0";
                  return (
                    <tr key={c.creator._id} className="border-t border-gray-50">
                      <td className="px-4 py-2 text-gray-500">{i + 1}</td>
                      <td className="px-4 py-2 font-medium text-gray-900">
                        {c.creator.name || c.creator.username}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-700">{c.clicks.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right text-gray-700">{c.ordersCount}</td>
                      <td className="px-4 py-2 text-right text-purple-700 font-bold">{conv}%</td>
                      <td className="px-4 py-2 text-right font-bold text-gray-900">
                        ฿{formatMoney(c.totalRevenue)}
                      </td>
                      <td className="px-4 py-2 text-right text-emerald-700">
                        ฿{formatMoney(c.totalCommission)}
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

const KPI: React.FC<{ icon: typeof Award; label: string; value: string; tone: string }> = ({
  icon: Icon,
  label,
  value,
  tone,
}) => (
  <div className="rounded-lg border border-gray-100 px-4 py-3">
    <div className="flex items-center gap-1.5">
      <Icon className="w-3 h-3 text-gray-400" />
      <p className="text-[11px] font-semibold text-gray-500 tracking-wide">{label}</p>
    </div>
    <p className={`text-[20px] font-bold tabular-nums mt-1 ${tone}`}>{value}</p>
  </div>
);

export default PerformancePage;
