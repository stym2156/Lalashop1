import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, DollarSign, Package } from "lucide-react";
import { fetchAffiliateSummary, type AffiliateSummary } from "@/services/sellerApi";

const formatMoney = (n: number): string =>
  Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });

const productImage = (p: AffiliateSummary["products"][0]): string => {
  if (Array.isArray(p.images) && p.images.length > 0) return p.images[0];
  if (typeof p.image === "string") return p.image;
  if (Array.isArray(p.image) && p.image.length > 0) return p.image[0];
  return "";
};

const CommissionPage: React.FC = () => {
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

  return (
    <div className="space-y-4 text-sm">
      <div>
        <h1 className="text-[16px] font-bold text-gray-900">{t('pages.commission.title')}</h1>
        <p className="text-[12px] text-gray-500 mt-0.5">
          {t('pages.commission.subtitle')}
        </p>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white p-6">
        <div className="flex items-center gap-2 text-white/80 text-[11px] font-bold tracking-wide">
          <DollarSign className="w-3.5 h-3.5" /> {t("pages.commission.totalCommissionPaid")}
        </div>
        <p className="text-[36px] font-black tabular-nums mt-2">
          ฿{formatMoney(data.totals.totalCommissionPaid)}
        </p>
        <div className="text-[11px] text-white/80 mt-2">
          across {data.totals.activeCreators} creator{data.totals.activeCreators === 1 ? "" : "s"} ·{" "}
          {data.totals.activeProducts} product{data.totals.activeProducts === 1 ? "" : "s"} enabled
        </div>
      </div>

      <div className="rounded-lg overflow-hidden border border-gray-100">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-[13px] font-bold text-gray-900">{t("pages.commission.productsEnabled")}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] tabular-nums">
            <thead className="text-[11px] text-gray-500 tracking-wide bg-gray-50/50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">{t("pages.commission.tableProduct")}</th>
                <th className="px-4 py-2 text-right font-semibold">{t("pages.commission.tablePrice")}</th>
                <th className="px-4 py-2 text-left font-semibold">{t("pages.commission.tableSetup")}</th>
              </tr>
            </thead>
            <tbody>
              {data.products.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                    <Package className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                    {t("pages.commission.noProducts")}
                  </td>
                </tr>
              )}
              {data.products.map((p) => {
                const cover = productImage(p);
                return (
                  <tr key={p._id} className="border-t border-gray-50">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-gray-50 overflow-hidden flex-shrink-0">
                          {cover && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={cover} alt={p.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <p className="text-[12px] font-medium text-gray-900 line-clamp-1">{p.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right text-gray-900">฿{formatMoney(p.price)}</td>
                    <td className="px-4 py-2 text-gray-700">
                      {p.commissionType === "fixed"
                        ? `฿${formatMoney(p.commissionValue ?? 0)} per sale`
                        : `${p.commissionValue ?? 0}% per sale`}
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

export default CommissionPage;
