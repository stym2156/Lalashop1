import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Loader2, Users, Eye, Smartphone, Monitor, Tablet, Globe,
} from "lucide-react";
import { fetchTrafficAnalytics, type TrafficAnalytics } from "@/services/sellerApi";

type RangeKey = "7d" | "30d" | "90d";
const RANGES: { key: RangeKey; label: string; days: number }[] = [
  { key: "7d", label: "7 Days", days: 7 },
  { key: "30d", label: "30 Days", days: 30 },
  { key: "90d", label: "90 Days", days: 90 },
];

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  direct: { label: "Direct", color: "bg-gray-400" },
  search: { label: "Search engines", color: "bg-blue-400" },
  social: { label: "Social media", color: "bg-purple-400" },
  referral: { label: "Other websites", color: "bg-emerald-400" },
  internal: { label: "Internal", color: "bg-amber-400" },
};

const DEVICE_ICONS: Record<string, typeof Smartphone> = {
  mobile: Smartphone,
  desktop: Monitor,
  tablet: Tablet,
  unknown: Globe,
};

const TrafficPage: React.FC = () => {
  const { t } = useTranslation("common");
  const [data, setData] = useState<TrafficAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<RangeKey>("30d");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const days = RANGES.find((r) => r.key === range)?.days || 30;
    fetchTrafficAnalytics(days)
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

  const maxDayViews = useMemo(() => {
    if (!data?.daily?.length) return 1;
    return Math.max(1, ...data.daily.map((d) => d.views));
  }, [data]);

  const totalSourceCount = useMemo(() => {
    if (!data) return 0;
    return Object.values(data.bySource).reduce((s, n) => s + n, 0);
  }, [data]);

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-[16px] font-bold text-gray-900">{t('pages.traffic.title')}</h1>
          <p className="text-[12px] text-gray-500 mt-0.5">
            {t('pages.traffic.subtitle')}
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
          <Globe className="w-7 h-7 mx-auto mb-3 text-gray-300" />
          <p className="text-[12px]">No traffic data yet</p>
        </div>
      ) : (
        <>
          {/* KPI bar */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <KPI icon={Eye} label={t('pages.traffic.totalViews')} value={data.totalViews.toLocaleString()} tone="text-[#00aeff]" />
            <KPI icon={Users} label={t('pages.traffic.uniqueSessions')} value={data.uniqueSessions.toLocaleString()} tone="text-emerald-700" />
            <KPI
              icon={Eye}
              label={t('pages.traffic.viewsPerSession')}
              value={
                data.uniqueSessions > 0
                  ? (data.totalViews / data.uniqueSessions).toFixed(1)
                  : "0"
              }
              tone="text-purple-700"
            />
          </div>

          {/* Daily trend */}
          <div className="rounded-lg border border-gray-100 p-4 bg-white">
            <h3 className="text-[13px] font-bold text-gray-900 mb-3">Daily traffic</h3>
            <div className="h-[160px] w-full flex items-end gap-px">
              {data.daily.map((d, i) => {
                const h = (d.views / maxDayViews) * 100;
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center justify-end h-full"
                    title={`${d.date}: ${d.views} views · ${d.sessions} sessions`}
                  >
                    <div
                      className="w-full bg-[#00aeff] hover:bg-[#0096db] rounded-t-sm transition-colors"
                      style={{ height: `${h}%`, minHeight: d.views > 0 ? "2px" : 0 }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-1">
              <span>{data.daily[0]?.date}</span>
              <span>{data.daily[data.daily.length - 1]?.date}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Sources */}
            <div className="rounded-lg border border-gray-100 p-4 bg-white">
              <h3 className="text-[13px] font-bold text-gray-900 mb-3">Traffic sources</h3>
              {totalSourceCount === 0 ? (
                <p className="text-[11px] text-gray-400 text-center py-6">No data</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(data.bySource)
                    .sort((a, b) => b[1] - a[1])
                    .map(([key, count]) => {
                      const meta = SOURCE_LABELS[key] || { label: key, color: "bg-gray-300" };
                      const pct =
                        totalSourceCount > 0 ? (count / totalSourceCount) * 100 : 0;
                      return (
                        <div key={key}>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-gray-700 font-bold">{meta.label}</span>
                            <span className="text-gray-500 tabular-nums">
                              {count.toLocaleString()} ({pct.toFixed(0)}%)
                            </span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-1">
                            <div
                              className={`h-full rounded-full ${meta.color}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Devices */}
            <div className="rounded-lg border border-gray-100 p-4 bg-white">
              <h3 className="text-[13px] font-bold text-gray-900 mb-3">Devices</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(data.byDevice).map(([key, count]) => {
                  const Icon = DEVICE_ICONS[key] || Globe;
                  const pct =
                    data.totalViews > 0 ? (count / data.totalViews) * 100 : 0;
                  return (
                    <div
                      key={key}
                      className="rounded-md bg-gray-50 px-3 py-2 flex items-center gap-2"
                    >
                      <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-gray-500 tracking-wide">
                          {key}
                        </p>
                        <p className="text-[14px] font-bold tabular-nums text-gray-900">
                          {count.toLocaleString()}
                          <span className="text-[10px] text-gray-400 font-normal ml-1">
                            ({pct.toFixed(0)}%)
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Top pages */}
            <div className="rounded-lg border border-gray-100 bg-white">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-[13px] font-bold text-gray-900">Top pages</h3>
              </div>
              {data.topPages.length === 0 ? (
                <p className="py-8 text-center text-[11px] text-gray-400">No pages tracked yet</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {data.topPages.map((p, i) => (
                    <div key={i} className="px-4 py-2 flex items-center justify-between gap-2">
                      <p className="text-[11px] font-mono text-gray-700 truncate flex-1 min-w-0">
                        {p.path}
                      </p>
                      <p className="text-[11px] tabular-nums text-gray-900 font-bold flex-shrink-0">
                        {p.views.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-gray-400 tabular-nums w-16 text-right">
                        {p.uniqueSessions} sess
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top referrers */}
            <div className="rounded-lg border border-gray-100 bg-white">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-[13px] font-bold text-gray-900">Top referrers</h3>
              </div>
              {data.topReferrers.length === 0 ? (
                <p className="py-8 text-center text-[11px] text-gray-400">
                  All traffic is direct or internal
                </p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {data.topReferrers.map((r, i) => (
                    <div key={i} className="px-4 py-2 flex items-center justify-between">
                      <p className="text-[11px] text-gray-700 truncate flex-1 min-w-0">
                        {r.host}
                      </p>
                      <p className="text-[11px] tabular-nums text-gray-900 font-bold">
                        {r.count.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const KPI: React.FC<{
  icon: typeof Eye;
  label: string;
  value: string;
  tone?: string;
}> = ({ icon: Icon, label, value, tone }) => (
  <div className="rounded-lg border border-gray-100 px-4 py-3 bg-white">
    <div className="flex items-center gap-1.5">
      <Icon className="w-3 h-3 text-gray-400" />
      <p className="text-[10px] font-semibold text-gray-500 tracking-wide">{label}</p>
    </div>
    <p className={`text-[22px] font-bold tabular-nums mt-1 ${tone || "text-gray-900"}`}>{value}</p>
  </div>
);

export default TrafficPage;
