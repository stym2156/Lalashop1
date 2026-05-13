import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Users, MousePointer, DollarSign, Package } from "lucide-react";
import { fetchAffiliateSummary, type AffiliateSummary } from "@/services/sellerApi";

const formatMoney = (n: number): string =>
  Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });

const CreatorsPage: React.FC = () => {
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
    return (
      <div className="py-12 text-center text-gray-400 text-[12px]">
        <Loader2 className="w-5 h-5 mx-auto animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700">
        {error || t("status.empty")}
      </div>
    );
  }

  return (
    <div className="space-y-4 text-sm">
      <div>
        <h1 className="text-[16px] font-bold text-gray-900">{t('pages.creators.title')}</h1>
        <p className="text-[12px] text-gray-500 mt-0.5">
          {t('pages.creators.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI icon={Users} label={t('pages.creators.activeCreators')} value={data.totals.activeCreators.toLocaleString()} tone="text-blue-700" />
        <KPI icon={Package} label={t('pages.creators.activeProducts')} value={data.totals.activeProducts.toLocaleString()} tone="text-purple-700" />
        <KPI icon={MousePointer} label={t('pages.creators.totalClicks')} value={data.totals.totalClicks.toLocaleString()} tone="text-amber-700" />
        <KPI icon={DollarSign} label={t('pages.creators.commissionPaid')} value={`฿${formatMoney(data.totals.totalCommissionPaid)}`} tone="text-emerald-700" />
      </div>

      <div className="rounded-lg overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] tabular-nums">
            <thead className="text-[11px] text-gray-500 tracking-wide bg-gray-50/50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">{t("pages.creators.tableCreator")}</th>
                <th className="px-4 py-2 text-right font-semibold">{t("pages.creators.tableProducts")}</th>
                <th className="px-4 py-2 text-right font-semibold">{t("pages.creators.tableClicks")}</th>
                <th className="px-4 py-2 text-right font-semibold">{t("pages.creators.tableOrders")}</th>
                <th className="px-4 py-2 text-right font-semibold">{t("pages.creators.tableRevenue")}</th>
                <th className="px-4 py-2 text-right font-semibold">{t("pages.creators.tableCommission")}</th>
              </tr>
            </thead>
            <tbody>
              {data.creators.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                    <Users className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                    {t("pages.creators.noCreators")}
                  </td>
                </tr>
              )}
              {data.creators.map((c) => (
                <tr key={c.creator._id} className="border-t border-gray-50">
                  <td className="px-4 py-2">
                    <p className="font-bold text-gray-900">{c.creator.name || c.creator.username || "—"}</p>
                    <p className="text-[10px] text-gray-500">{c.creator.email}</p>
                  </td>
                  <td className="px-4 py-2 text-right text-gray-900">{c.products.length}</td>
                  <td className="px-4 py-2 text-right text-gray-900">{c.clicks.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right text-gray-900">{c.ordersCount}</td>
                  <td className="px-4 py-2 text-right text-gray-700">฿{formatMoney(c.totalRevenue)}</td>
                  <td className="px-4 py-2 text-right font-bold text-emerald-700">
                    ฿{formatMoney(c.totalCommission)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const KPI: React.FC<{ icon: typeof Users; label: string; value: string; tone: string }> = ({
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

export default CreatorsPage;
