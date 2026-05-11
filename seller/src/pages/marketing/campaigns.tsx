import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  Loader2, Tag, Zap, Megaphone, ArrowRight, Calendar, TrendingUp,
} from "lucide-react";
import {
  fetchMyCoupons,
  fetchMyPromotions,
  fetchMyBroadcasts,
  type SellerCoupon,
  type SellerPromotion,
  type SellerBroadcast,
} from "@/services/sellerApi";

const formatMoney = (n: number): string =>
  Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

const formatDate = (s?: string): string => {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

interface CampaignRow {
  id: string;
  type: "coupon" | "promotion" | "broadcast";
  name: string;
  status: string;
  endsAt?: string;
  reach: number;
  revenue: number;
}

const TYPE_META: Record<CampaignRow["type"], { label: string; icon: typeof Tag; color: string }> = {
  coupon: { label: "Coupon", icon: Tag, color: "from-blue-400 to-blue-600" },
  promotion: { label: "Promotion", icon: Zap, color: "from-amber-400 to-orange-500" },
  broadcast: { label: "Broadcast", icon: Megaphone, color: "from-purple-400 to-pink-500" },
};

const statusBadge = (status: string): string => {
  const s = status.toLowerCase();
  if (s === "active" || s === "sent") return "bg-emerald-100 text-emerald-700";
  if (s === "draft") return "bg-gray-100 text-gray-600";
  if (s === "scheduled") return "bg-blue-100 text-blue-700";
  if (s === "paused" || s === "ended" || s === "expired") return "bg-amber-100 text-amber-700";
  return "bg-gray-100 text-gray-600";
};

const CampaignsPage: React.FC = () => {
  const { t } = useTranslation("common");
  const [coupons, setCoupons] = useState<SellerCoupon[]>([]);
  const [promotions, setPromotions] = useState<SellerPromotion[]>([]);
  const [broadcasts, setBroadcasts] = useState<SellerBroadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "coupon" | "promotion" | "broadcast">("all");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([fetchMyCoupons(), fetchMyPromotions(), fetchMyBroadcasts()])
      .then(([c, p, b]) => {
        if (cancelled) return;
        setCoupons(c);
        setPromotions(p);
        setBroadcasts(b);
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

  const rows: CampaignRow[] = useMemo(() => {
    const list: CampaignRow[] = [];
    coupons.forEach((c) =>
      list.push({
        id: `c-${c._id}`,
        type: "coupon",
        name: `${c.code} · ${c.title}`,
        status: c.status,
        endsAt: c.expiresAt,
        reach: c.usedCount,
        revenue: 0,
      })
    );
    promotions.forEach((p) =>
      list.push({
        id: `p-${p._id}`,
        type: "promotion",
        name: p.name,
        status: p.status,
        endsAt: p.endsAt,
        reach: p.orders,
        revenue: p.revenue,
      })
    );
    broadcasts.forEach((b) =>
      list.push({
        id: `b-${b._id}`,
        type: "broadcast",
        name: b.title,
        status: b.status,
        endsAt: b.sentAt,
        reach: b.metrics?.delivered || b.audienceCount || 0,
        revenue: 0,
      })
    );
    return list.sort((a, b) => {
      const ta = a.endsAt ? new Date(a.endsAt).getTime() : 0;
      const tb = b.endsAt ? new Date(b.endsAt).getTime() : 0;
      return tb - ta;
    });
  }, [coupons, promotions, broadcasts]);

  const filtered = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.type === filter)),
    [rows, filter]
  );

  const stats = useMemo(() => {
    const activeCoupons = coupons.filter((c) => c.status === "active").length;
    const activePromos = promotions.filter((p) => p.status === "active").length;
    const sentBroadcasts = broadcasts.filter((b) => b.status === "sent").length;
    const totalRevenue = promotions.reduce((s, p) => s + (p.revenue || 0), 0);
    const totalReach = broadcasts.reduce(
      (s, b) => s + (b.metrics?.delivered || 0),
      0
    );
    return { activeCoupons, activePromos, sentBroadcasts, totalRevenue, totalReach };
  }, [coupons, promotions, broadcasts]);

  return (
    <div className="space-y-4 text-sm">
      <div>
        <h1 className="text-[16px] font-bold text-gray-900">{t('pages.campaignsList.title')}</h1>
        <p className="text-[12px] text-gray-500 mt-0.5">
          {t('pages.campaignsList.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Active coupons" value={stats.activeCoupons.toString()} tone="text-blue-700" icon={Tag} />
        <Stat label="Active promotions" value={stats.activePromos.toString()} tone="text-amber-700" icon={Zap} />
        <Stat label="Broadcasts sent" value={stats.sentBroadcasts.toString()} tone="text-purple-700" icon={Megaphone} />
        <Stat label="Promo revenue" value={`฿${formatMoney(stats.totalRevenue)}`} tone="text-emerald-700" icon={TrendingUp} />
        <Stat label="Total reach" value={stats.totalReach.toLocaleString()} tone="text-[#00aeff]" icon={TrendingUp} />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 bg-gray-100 rounded p-0.5">
          {(["all", "coupon", "promotion", "broadcast"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`px-3 py-1 rounded text-[11px] font-bold capitalize ${
                filter === k ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-black"
              }`}
            >
              {k === "all" ? "All" : k + "s"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/marketing/coupons"
            className="px-3 py-1.5 rounded-md text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 inline-flex items-center"
          >
            <Tag className="w-3 h-3 mr-1" /> New coupon
          </Link>
          <Link
            href="/marketing/promotions"
            className="px-3 py-1.5 rounded-md text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 inline-flex items-center"
          >
            <Zap className="w-3 h-3 mr-1" /> New promotion
          </Link>
          <Link
            href="/marketing/broadcast"
            className="px-3 py-1.5 rounded-md text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 inline-flex items-center"
          >
            <Megaphone className="w-3 h-3 mr-1" /> New broadcast
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="py-12 text-center">
          <Loader2 className="w-5 h-5 animate-spin text-gray-300 mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-[13px] font-bold text-gray-700">No campaigns yet</p>
          <p className="text-[11px] text-gray-500 mt-1">
            Start with a coupon, flash sale promotion, or broadcast announcement.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => {
            const meta = TYPE_META[r.type];
            const Icon = meta.icon;
            const targetHref =
              r.type === "coupon"
                ? "/marketing/coupons"
                : r.type === "promotion"
                ? "/marketing/promotions"
                : "/marketing/broadcast";
            return (
              <Link
                key={r.id}
                href={targetHref}
                className="rounded-lg border border-gray-100 p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
              >
                <div
                  className={`w-10 h-10 rounded-md bg-gradient-to-br ${meta.color} flex items-center justify-center flex-shrink-0`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-[13px] font-bold text-gray-900 truncate">{r.name}</h3>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wide ${statusBadge(r.status)}`}
                    >
                      {r.status}
                    </span>
                    <span className="text-[10px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">
                      {meta.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-1">
                    {r.endsAt && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {r.type === "broadcast" ? "Sent" : "Ends"}: {formatDate(r.endsAt)}
                      </span>
                    )}
                    <span>
                      {r.type === "coupon" && `${r.reach} redemptions`}
                      {r.type === "promotion" && `${r.reach} orders`}
                      {r.type === "broadcast" && `${r.reach.toLocaleString()} reach`}
                    </span>
                    {r.revenue > 0 && (
                      <span className="text-emerald-700 font-bold">
                        ฿{formatMoney(r.revenue)}
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface StatProps {
  label: string;
  value: string;
  tone?: string;
  icon?: typeof Tag;
}

const Stat: React.FC<StatProps> = ({ label, value, tone, icon: Icon }) => (
  <div className="rounded-lg border border-gray-100 px-4 py-3">
    <div className="flex items-center gap-1.5">
      {Icon && <Icon className="w-3 h-3 text-gray-400" />}
      <p className="text-[10px] font-semibold text-gray-500 tracking-wide">{label}</p>
    </div>
    <p className={`text-[18px] font-bold tabular-nums mt-1 ${tone || "text-gray-900"}`}>{value}</p>
  </div>
);

export default CampaignsPage;
