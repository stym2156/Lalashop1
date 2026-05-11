import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Crown, Users, Sparkles, Moon, TrendingUp } from "lucide-react";
import { fetchSegmentSummary, type SegmentSummary } from "@/services/sellerApi";

const formatMoney = (n: number): string =>
  Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

interface SegmentDef {
  key: keyof Omit<SegmentSummary, "total" | "totalRevenue">;
  labelKey: string;
  descKey: string;
  ruleKey: string;
  icon: typeof Crown;
  color: string;
}

const SEGMENTS: SegmentDef[] = [
  {
    key: "vip",
    labelKey: "pages.segments.vipLabel",
    descKey: "pages.segments.vipDesc",
    ruleKey: "pages.segments.vipRule",
    icon: Crown,
    color: "from-amber-400 to-orange-500",
  },
  {
    key: "regular",
    labelKey: "pages.segments.regularLabel",
    descKey: "pages.segments.regularDesc",
    ruleKey: "pages.segments.regularRule",
    icon: Users,
    color: "from-blue-400 to-blue-600",
  },
  {
    key: "newCustomers",
    labelKey: "pages.segments.newLabel",
    descKey: "pages.segments.newDesc",
    ruleKey: "pages.segments.newRule",
    icon: Sparkles,
    color: "from-emerald-400 to-emerald-600",
  },
  {
    key: "inactive",
    labelKey: "pages.segments.inactiveLabel",
    descKey: "pages.segments.inactiveDesc",
    ruleKey: "pages.segments.inactiveRule",
    icon: Moon,
    color: "from-gray-400 to-gray-600",
  },
];

const SegmentsPage: React.FC = () => {
  const { t } = useTranslation("common");
  const [data, setData] = useState<SegmentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchSegmentSummary()
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
  }, []);

  return (
    <div className="space-y-4 text-sm">
      <div>
        <h1 className="text-[16px] font-bold text-gray-900">{t('pages.segments.title')}</h1>
        <p className="text-[12px] text-gray-500 mt-0.5">
          {t('pages.segments.subtitle')}
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="py-12 text-center">
          <Loader2 className="w-5 h-5 animate-spin text-gray-300 mx-auto" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-[#00aeff] to-[#0096db] text-white p-5">
              <div className="flex items-center gap-2 text-white/80 text-[11px] font-bold tracking-wide">
                <Users className="w-3.5 h-3.5" /> {t('pages.segments.totalCustomers')}
              </div>
              <p className="text-[28px] font-black tabular-nums mt-2">
                {data?.total?.toLocaleString() || 0}
              </p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white p-5">
              <div className="flex items-center gap-2 text-white/80 text-[11px] font-bold tracking-wide">
                <TrendingUp className="w-3.5 h-3.5" /> {t('pages.segments.lifetimeRevenue')}
              </div>
              <p className="text-[28px] font-black tabular-nums mt-2">
                ฿{formatMoney(data?.totalRevenue || 0)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SEGMENTS.map((s) => {
              const Icon = s.icon;
              const value = data ? Number(data[s.key]) || 0 : 0;
              return (
                <div
                  key={s.key}
                  className="rounded-lg border border-gray-100 p-4 flex gap-4 bg-white"
                >
                  <div
                    className={`w-12 h-12 rounded-md bg-gradient-to-br ${s.color} flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-[13px] font-bold text-gray-900">{t(s.labelKey)}</h3>
                      <span className="text-[20px] font-black tabular-nums text-gray-900">
                        {value.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">{t(s.descKey)}</p>
                    <p className="text-[10px] text-gray-400 mt-1 inline-block bg-gray-50 px-1.5 py-0.5 rounded">
                      {t('pages.segments.rule')} {t(s.ruleKey)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default SegmentsPage;
