import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  Users, Store, ShoppingBag, CreditCard, Bell, Layers,
  DollarSign, Package, MessageSquare, Flag, BadgeCheck, Wallet,
  Loader2, ArrowUpRight, ArrowDownRight, TrendingUp, Activity,
  AlertTriangle, ChevronRight,
} from "lucide-react";
import {
  fetchDashboardStats,
  fetchRecentActivity,
  type DashboardStats,
  type RecentActivity,
} from "@/services/adminApi";

const formatNumber = (n: number): string =>
  new Intl.NumberFormat("en-US").format(n);
const formatCurrency = (n: number): string =>
  `฿${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n)}`;
const formatDate = (s: string): string => {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const formatRelativeTime = (iso: string, t: (k: string, v?: Record<string, unknown>) => string): string => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(Math.floor(diffMs / 60000), 0);
  if (minutes < 1) return t("dashboard.justNow");
  if (minutes < 60) return t("dashboard.minutesAgo", { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("dashboard.hoursAgo", { count: hours });
  const days = Math.floor(hours / 24);
  return t("dashboard.daysAgo", { count: days });
};

const statusBadge = (status: string, isPaid: boolean): string => {
  if (status === "delivered") return "bg-emerald-50 text-emerald-700";
  if (status === "shipping") return "bg-purple-50 text-purple-700";
  if (status === "canceled" || status === "cancelled") return "bg-rose-50 text-rose-700";
  if (status === "returned") return "bg-amber-50 text-amber-700";
  if (isPaid) return "bg-blue-50 text-blue-700";
  return "bg-gray-100 text-gray-600";
};

const initial = (name?: string): string =>
  (name || "?").trim().charAt(0).toUpperCase() || "?";

interface QueueDef {
  labelKey: string;
  href: string;
  icon: typeof BadgeCheck;
  tone: string;
  bg: string;
  key: keyof NonNullable<DashboardStats["queues"]>;
}

const QUEUES: QueueDef[] = [
  { labelKey: "dashboard.pendingKyc", href: "/kyc", icon: BadgeCheck, tone: "text-amber-700", bg: "bg-amber-50", key: "pendingKyc" },
  { labelKey: "dashboard.pendingWithdrawals", href: "/withdrawpage/Seller/SellerWithdrawals", icon: Wallet, tone: "text-blue-700", bg: "bg-blue-50", key: "pendingWithdrawals" },
  { labelKey: "dashboard.openReports", href: "/reports", icon: Flag, tone: "text-rose-700", bg: "bg-rose-50", key: "openReports" },
  { labelKey: "dashboard.openTickets", href: "/support", icon: MessageSquare, tone: "text-purple-700", bg: "bg-purple-50", key: "openTickets" },
  { labelKey: "dashboard.pendingOrders", href: "/orders", icon: ShoppingBag, tone: "text-orange-700", bg: "bg-orange-50", key: "pendingOrders" },
];

const QUICK_LINKS = [
  { titleKey: "nav.allUsers", icon: Users, href: "/users/alluser" },
  { titleKey: "dashboard.sellers", icon: Store, href: "/users/alluser?role=seller" },
  { titleKey: "dashboard.shopCenterLink", icon: ShoppingBag, href: "/shops/shopcenter" },
  { titleKey: "nav.categories", icon: Layers, href: "/categories" },
  { titleKey: "nav.notifications", icon: Bell, href: "/notifications" },
  { titleKey: "nav.auditLog", href: "/admins/audit", icon: Activity },
];

const Dashboard: React.FC = () => {
  const { t } = useTranslation("common");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [statsRes, activityRes] = await Promise.all([
          fetchDashboardStats(),
          fetchRecentActivity(),
        ]);
        if (cancelled) return;
        setStats(statsRes.data ?? null);
        setActivity(activityRes.data ?? []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : t("dashboard.failedToLoad"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const totals = stats?.totals;
  const period = stats?.period;
  const queues = stats?.queues;

  const trendMax = useMemo(() => {
    if (!stats?.revenueTrend?.length) return 1;
    return Math.max(1, ...stats.revenueTrend.map((d) => d.revenue));
  }, [stats]);

  const totalQueueCount = useMemo(() => {
    if (!queues) return 0;
    return Object.values(queues).reduce((s, n) => s + (n || 0), 0);
  }, [queues]);

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-[18px] font-black text-gray-900">{t("dashboard.title")}</h1>
          <p className="text-[12px] text-gray-500 mt-0.5">
            {t("dashboard.subtitle")}
          </p>
        </div>
        {totalQueueCount > 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-100 text-[12px] font-bold text-rose-700">
            <AlertTriangle className="w-3.5 h-3.5" />
            {t("dashboard.needAttention", { count: totalQueueCount })}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-300 mx-auto" />
        </div>
      ) : (
        <>
          {/* Operational queues */}
          <div>
            <h2 className="text-[11px] font-bold text-gray-500 tracking-widest mb-2">
              {t("dashboard.actionQueue")}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {QUEUES.map((q) => {
                const value = queues?.[q.key] ?? 0;
                const Icon = q.icon;
                return (
                  <Link
                    key={q.key}
                    href={q.href}
                    className={`rounded-lg border border-gray-100 p-3 hover:shadow-sm transition-all ${value > 0 ? "bg-white" : "bg-white"} block`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-7 h-7 rounded-md ${q.bg} ${q.tone} inline-flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-[10px] font-semibold text-gray-500 tracking-wide truncate">
                        {t(q.labelKey)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-[22px] font-black tabular-nums ${value > 0 ? q.tone : "text-gray-400"}`}>
                        {formatNumber(value)}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Primary KPI strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPI
              label={t("dashboard.totalRevenue")}
              value={totals ? formatCurrency(totals.revenue, t) : "—"}
              hint={t("dashboard.lifetimeAllPaidOrders")}
              icon={DollarSign}
              tone="text-emerald-700"
              change={period?.revenueChangePct}
            />
            <KPI
              label={t("dashboard.totalUsers")}
              value={totals ? formatNumber(totals.users) : "—"}
              hint={period ? t("dashboard.newLast30", { count: period.newUsers30 }) : ""}
              icon={Users}
              tone="text-[#00aeff]"
              change={period?.newUsersChangePct}
            />
            <KPI
              label={t("dashboard.activeShops")}
              value={totals ? formatNumber(totals.activeShops) : "—"}
              hint={t("dashboard.sellersApprovedKyc")}
              icon={Store}
              tone="text-purple-700"
            />
            <KPI
              label={t("dashboard.totalProducts")}
              value={totals ? formatNumber(totals.products) : "—"}
              hint={t("dashboard.acrossAllShops")}
              icon={Package}
              tone="text-amber-700"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Revenue trend */}
            <div className="lg:col-span-2 rounded-lg border border-gray-100 p-4 bg-white">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-[13px] font-bold text-gray-900">{t("dashboard.revenue30Days")}</h3>
                  <p className="text-[10px] text-gray-500">
                    {t("dashboard.thisPeriod", { value: period ? formatCurrency(period.revenue30, t) : "—" })}
                    {period && (
                      <span className={`ml-2 inline-flex items-center text-[10px] font-bold ${period.revenueChangePct >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {period.revenueChangePct >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(period.revenueChangePct)}{t("dashboard.vsPrev30d")}
                      </span>
                    )}
                  </p>
                </div>
                <TrendingUp className="w-4 h-4 text-gray-300" />
              </div>
              <div className="h-[180px] w-full flex items-end gap-px">
                {stats?.revenueTrend?.map((d, i) => {
                  const h = (d.revenue / trendMax) * 100;
                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center justify-end h-full group"
                      title={`${d.date}: ${formatCurrency(d.revenue, t)} · ${d.orders} orders`}
                    >
                      <div
                        className="w-full bg-[#00aeff] hover:bg-[#0096db] rounded-t-sm transition-colors"
                        style={{ height: `${h}%`, minHeight: d.revenue > 0 ? "2px" : 0 }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>{stats?.revenueTrend?.[0]?.date}</span>
                <span>{stats?.revenueTrend?.[stats.revenueTrend.length - 1]?.date}</span>
              </div>
            </div>

            {/* Top shops */}
            <div className="rounded-lg border border-gray-100 bg-white">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-[13px] font-bold text-gray-900">{t("dashboard.topShopsLifetime")}</h3>
                <Link href="/shops/shopcenter" className="text-[10px] font-bold text-[#00aeff] hover:underline">
                  {t("dashboard.all")} →
                </Link>
              </div>
              {!stats?.topShops?.length ? (
                <p className="py-8 text-center text-[11px] text-gray-400">{t("dashboard.noShopRevenue")}</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {stats.topShops.map((s, i) => (
                    <Link
                      key={s._id}
                      href={`/shops/${s._id}`}
                      className="px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-[10px] font-bold text-gray-400 w-4">{i + 1}</span>
                      {s.profileImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.profileImage} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00aeff] to-[#0096db] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                          {initial(s.name)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-gray-900 truncate">{s.name || "—"}</p>
                        <p className="text-[10px] text-gray-500">
                          {t("dashboard.orderCount", { count: s.orderCount })}
                        </p>
                      </div>
                      <p className="text-[12px] font-black text-emerald-700 tabular-nums">
                        {formatCurrency(s.revenue, t)}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Recent orders */}
            <div className="lg:col-span-2 rounded-lg border border-gray-100 bg-white">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-[13px] font-bold text-gray-900">{t("dashboard.recentOrders")}</h3>
                <Link href="/orders" className="text-[10px] font-bold text-[#00aeff] hover:underline">
                  {t("dashboard.allOrders")} →
                </Link>
              </div>
              {!stats?.recentOrders?.length ? (
                <p className="py-8 text-center text-[11px] text-gray-400">{t("dashboard.noOrders")}</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {stats.recentOrders.map((o) => (
                    <Link
                      key={o._id}
                      href={`/orders/${o._id}`}
                      className="px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                    >
                      <p className="text-[11px] font-mono text-gray-700 w-20">
                        #{o._id.slice(-6).toUpperCase()}
                      </p>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-gray-900 truncate">
                          {o.user?.name || o.user?.email || "—"}
                        </p>
                        <p className="text-[10px] text-gray-500">{formatDate(o.createdAt)}</p>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wide ${statusBadge(o.status, o.isPaid)}`}>
                        {t(`status.${o.status || (o.isPaid ? "paid" : "pending")}`, o.status || (o.isPaid ? "paid" : "pending"))}
                      </span>
                      <p className="text-[12px] font-black text-gray-900 tabular-nums w-24 text-right">
                        {formatCurrency(o.totalPrice, t)}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Activity feed */}
            <div className="rounded-lg border border-gray-100 bg-white">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-[13px] font-bold text-gray-900">{t("dashboard.activity")}</h3>
                <Link href="/history/history" className="text-[10px] font-bold text-[#00aeff] hover:underline">
                  {t("dashboard.history")} →
                </Link>
              </div>
              {!activity.length ? (
                <p className="py-8 text-center text-[11px] text-gray-400">{t("dashboard.noActivity")}</p>
              ) : (
                <div className="divide-y divide-gray-50 max-h-[420px] overflow-y-auto">
                  {activity.map((a) => (
                    <div key={a.id} className="px-4 py-2.5">
                      <p className="text-[11px] text-gray-700 leading-snug">{a.text}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{formatRelativeTime(a.at, t)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h2 className="text-[11px] font-bold text-gray-500 tracking-widest mb-2">
              {t("dashboard.quickAccess")}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {QUICK_LINKS.map((l) => (
                <Link
                  key={l.titleKey}
                  href={l.href}
                  className="rounded-lg border border-gray-100 px-3 py-2.5 flex items-center gap-2 hover:bg-gray-50 transition-colors"
                >
                  <l.icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="text-[12px] font-bold text-gray-700 truncate">{t(l.titleKey)}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Footer counters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <SmallStat
              label={t("dashboard.activeToday")}
              value={formatNumber(stats?.secondary.activeUsersToday ?? 0)}
              hint={t("dashboard.updated24h")}
            />
            <SmallStat
              label={t("dashboard.pendingOrders")}
              value={formatNumber(stats?.secondary.pendingOrders ?? 0)}
            />
            <SmallStat
              label={t("dashboard.completedOrders")}
              value={formatNumber(stats?.secondary.completedOrders ?? 0)}
            />
            <SmallStat
              label={t("dashboard.totalPosts")}
              value={formatNumber(totals?.posts ?? 0)}
            />
          </div>
        </>
      )}
    </div>
  );
};

interface KPIProps {
  label: string;
  value: string;
  hint?: string;
  icon: typeof DollarSign;
  tone?: string;
  change?: number;
}

const KPI: React.FC<KPIProps> = ({ label, value, hint, icon: Icon, tone, change }) => (
  <div className="rounded-lg border border-gray-100 px-4 py-3 bg-white">
    <div className="flex items-center justify-between">
      <p className="text-[10px] font-semibold text-gray-500 tracking-wide">{label}</p>
      <Icon className="w-3 h-3 text-gray-400" />
    </div>
    <p className={`text-[24px] font-black tabular-nums mt-1 ${tone || "text-gray-900"}`}>{value}</p>
    <div className="flex items-center justify-between mt-1">
      {hint && <p className="text-[10px] text-gray-400 truncate">{hint}</p>}
      {typeof change === "number" && (
        <span
          className={`text-[10px] font-bold inline-flex items-center ${
            change >= 0 ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(change)}%
        </span>
      )}
    </div>
  </div>
);

const SmallStat: React.FC<{ label: string; value: string; hint?: string }> = ({ label, value, hint }) => (
  <div className="rounded-lg bg-gray-50 px-3 py-2">
    <p className="text-[10px] font-semibold text-gray-500 tracking-wide">{label}</p>
    <p className="text-[16px] font-bold tabular-nums text-gray-900">{value}</p>
    {hint && <p className="text-[10px] text-gray-400 mt-0.5">{hint}</p>}
  </div>
);

export default Dashboard;
