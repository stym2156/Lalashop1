import React, { useEffect, useMemo, useState } from "react";
import {
  Loader2, MessageCircle, Clock, Inbox, TrendingUp, ArrowDownCircle, ArrowUpCircle,
} from "lucide-react";
import { fetchChatAnalytics, type ChatAnalytics } from "@/services/sellerApi";

type RangeKey = "7d" | "30d" | "90d";
const RANGES: { key: RangeKey; label: string; days: number }[] = [
  { key: "7d", label: "7 Days", days: 7 },
  { key: "30d", label: "30 Days", days: 30 },
  { key: "90d", label: "90 Days", days: 90 },
];

const formatDuration = (seconds: number): string => {
  if (!seconds) return "—";
  if (seconds < 60) return `${seconds}s`;
  const min = Math.floor(seconds / 60);
  if (min < 60) return `${min}m ${seconds % 60}s`;
  const hr = Math.floor(min / 60);
  const remMin = min % 60;
  return `${hr}h ${remMin}m`;
};

const ChatAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<ChatAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<RangeKey>("30d");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const days = RANGES.find((r) => r.key === range)?.days || 30;
    fetchChatAnalytics(days)
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

  const maxDayVolume = useMemo(() => {
    if (!data?.dailyVolume?.length) return 1;
    return Math.max(
      1,
      ...data.dailyVolume.map((d) => Math.max(d.inbound, d.outbound))
    );
  }, [data]);

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-[16px] font-bold text-gray-900">Chat analytics</h1>
          <p className="text-[12px] text-gray-500 mt-0.5">
            Response time, message volume, and chat-to-order conversion.
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
          <MessageCircle className="w-7 h-7 mx-auto mb-3 text-gray-300" />
          <p className="text-[12px]">No chat data yet</p>
        </div>
      ) : (
        <>
          {/* Top KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPI
              icon={MessageCircle}
              label="Conversations"
              value={data.totalConversations.toLocaleString()}
              tone="text-[#00aeff]"
            />
            <KPI
              icon={Inbox}
              label="Unread inbound"
              value={data.unreadInbound.toLocaleString()}
              tone="text-rose-700"
            />
            <KPI
              icon={Clock}
              label="Avg response"
              value={formatDuration(data.avgResponseSec)}
              tone="text-amber-700"
              hint={`from ${data.responseSampleSize} replies`}
            />
            <KPI
              icon={TrendingUp}
              label="Chat → order"
              value={`${data.chatConversionRate}%`}
              tone="text-emerald-700"
              hint={`${data.buyersWhoOrdered}/${data.buyersWhoChat} chatters bought`}
            />
          </div>

          {/* Volume + response */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2 rounded-lg border border-gray-100 p-4 bg-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-bold text-gray-900">Daily message volume</h3>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 bg-[#00aeff] rounded-sm" /> Outbound (you)
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 bg-amber-400 rounded-sm" /> Inbound (buyers)
                  </span>
                </div>
              </div>
              <div className="h-[180px] w-full flex items-end gap-px">
                {data.dailyVolume.map((d, i) => {
                  const inH = (d.inbound / maxDayVolume) * 100;
                  const outH = (d.outbound / maxDayVolume) * 100;
                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center justify-end h-full"
                      title={`${d.date}: ${d.inbound} in · ${d.outbound} out`}
                    >
                      <div className="w-full flex gap-px items-end h-full">
                        <div
                          className="flex-1 bg-amber-400 rounded-t-sm"
                          style={{ height: `${inH}%`, minHeight: d.inbound > 0 ? "1px" : 0 }}
                        />
                        <div
                          className="flex-1 bg-[#00aeff] rounded-t-sm"
                          style={{ height: `${outH}%`, minHeight: d.outbound > 0 ? "1px" : 0 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>{data.dailyVolume[0]?.date}</span>
                <span>{data.dailyVolume[data.dailyVolume.length - 1]?.date}</span>
              </div>
            </div>

            <div className="space-y-3">
              <DetailCard
                icon={ArrowDownCircle}
                label="Inbound messages"
                value={data.inboundMessages.toLocaleString()}
                tone="text-amber-700"
              />
              <DetailCard
                icon={ArrowUpCircle}
                label="Outbound messages"
                value={data.outboundMessages.toLocaleString()}
                tone="text-[#00aeff]"
              />
              <div className="rounded-lg border border-gray-100 p-4 bg-white space-y-2">
                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                  Response time distribution
                </h4>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-gray-500">Median (p50)</span>
                  <span className="font-bold tabular-nums">
                    {formatDuration(data.p50ResponseSec)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-gray-500">95th percentile</span>
                  <span className="font-bold tabular-nums">
                    {formatDuration(data.p95ResponseSec)}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 pt-1 border-t">
                  Sample size: {data.responseSampleSize} replies
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

interface KPIProps {
  icon: typeof MessageCircle;
  label: string;
  value: string;
  tone?: string;
  hint?: string;
}

const KPI: React.FC<KPIProps> = ({ icon: Icon, label, value, tone, hint }) => (
  <div className="rounded-lg border border-gray-100 px-4 py-3 bg-white">
    <div className="flex items-center gap-1.5">
      <Icon className="w-3 h-3 text-gray-400" />
      <p className="text-[10px] font-semibold text-gray-500 tracking-wide">{label}</p>
    </div>
    <p className={`text-[20px] font-bold tabular-nums mt-1 ${tone || "text-gray-900"}`}>{value}</p>
    {hint && <p className="text-[10px] text-gray-400 mt-0.5">{hint}</p>}
  </div>
);

const DetailCard: React.FC<{
  icon: typeof ArrowUpCircle;
  label: string;
  value: string;
  tone?: string;
}> = ({ icon: Icon, label, value, tone }) => (
  <div className="rounded-lg border border-gray-100 px-4 py-3 bg-white flex items-center gap-3">
    <Icon className={`w-5 h-5 ${tone || "text-gray-400"}`} />
    <div>
      <p className="text-[10px] font-semibold text-gray-500 tracking-wide">{label}</p>
      <p className="text-[16px] font-bold tabular-nums text-gray-900">{value}</p>
    </div>
  </div>
);

export default ChatAnalyticsPage;
