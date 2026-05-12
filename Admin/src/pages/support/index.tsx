import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search, Loader2, AlertCircle, MessageSquare, ArrowRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  fetchAdminTickets,
  fetchAdminTicketStats,
  type AdminTicketRow,
  type AdminTicketStats,
  type TicketStatus,
  type TicketCategory,
  type TicketPriority,
} from "@/services/adminApi";

const formatDate = (s?: string): string => {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const STATUS_BADGE: Record<TicketStatus, string> = {
  open: "bg-blue-50 text-blue-700",
  in_progress: "bg-amber-50 text-amber-700",
  resolved: "bg-green-50 text-green-700",
  closed: "bg-gray-100 text-gray-600",
};

const PRIORITY_BADGE: Record<TicketPriority, string> = {
  low: "bg-gray-100 text-gray-600",
  normal: "bg-blue-50 text-blue-700",
  high: "bg-amber-50 text-amber-700",
  urgent: "bg-red-50 text-red-700",
};

const CATEGORIES: Array<TicketCategory | "all"> = [
  "all",
  "payments",
  "orders",
  "account",
  "products",
  "shop",
  "other",
];

const SupportListPage: React.FC = () => {
  const { t } = useTranslation('common');
  const STATUS_TABS: Array<{ key: TicketStatus | "all"; label: string }> = [
    { key: "all", label: t('pages.support.filters.all') },
    { key: "open", label: t('pages.support.filters.open') },
    { key: "in_progress", label: t('pages.support.inProgress') },
    { key: "resolved", label: t('pages.support.filters.resolved') },
    { key: "closed", label: t('pages.support.filters.closed') },
  ];
  const [items, setItems] = useState<AdminTicketRow[]>([]);
  const [stats, setStats] = useState<AdminTicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<TicketStatus | "all">("all");
  const [category, setCategory] = useState<TicketCategory | "all">("all");
  const [search, setSearch] = useState("");

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, st] = await Promise.all([
        fetchAdminTickets({ status, category, search, limit: 200 }),
        fetchAdminTicketStats(),
      ]);
      setItems(list.data ?? []);
      setStats(st.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pages.support.loading'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, category]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.subject.toLowerCase().includes(q) ||
        item.user?.email?.toLowerCase().includes(q) ||
        item.user?.name?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q)
    );
  }, [items, search]);

  return (
    <div className="space-y-4 text-sm">
      <div>
        <h1 className="text-[16px] font-bold text-gray-900">{t('pages.support.title')}</h1>
        <p className="text-[12px] text-gray-500 mt-0.5">
          {t('pages.support.headerDesc')}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label={t('pages.support.kpi.total')} value={stats?.total?.toLocaleString() ?? "—"} />
        <Stat label={t('pages.support.kpi.open')} value={stats?.open?.toLocaleString() ?? "—"} tone="text-blue-700" />
        <Stat label={t('pages.support.kpi.inProgress')} value={stats?.inProgress?.toLocaleString() ?? "—"} tone="text-amber-700" />
        <Stat label={t('pages.support.kpi.resolved')} value={stats?.resolved?.toLocaleString() ?? "—"} tone="text-emerald-700" />
        <Stat label={t('pages.support.kpi.closed')} value={stats?.closed?.toLocaleString() ?? "—"} tone="text-gray-700" />
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 bg-gray-100 rounded p-0.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatus(tab.key)}
              className={`px-3 py-1 rounded text-[11px] font-bold ${
                status === tab.key
                  ? "bg-white text-black shadow-sm"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as TicketCategory | "all")}
            className="bg-gray-50 border border-gray-100 focus:bg-white focus:border-gray-200 outline-none rounded px-2 py-1.5 text-xs"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? t('pages.support.filters.all') : c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('pages.support.searchPlaceholder')}
              className="bg-gray-50 border border-gray-100 focus:bg-white focus:border-gray-200 outline-none rounded pl-8 pr-3 py-1.5 text-xs w-64"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700 inline-flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center">
          <Loader2 className="w-5 h-5 animate-spin text-gray-300 mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <MessageSquare className="w-8 h-8 mx-auto mb-3 text-gray-300" />
          <p className="text-[13px] font-bold text-gray-700">
            {items.length === 0 ? t('pages.support.noTicketsYet') : t('pages.support.noMatches')}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-100 overflow-hidden bg-white">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 tracking-wider">
              <tr>
                <th className="px-4 py-2 text-left">{t('pages.support.table.subject')}</th>
                <th className="px-4 py-2 text-left">{t('pages.support.table.user')}</th>
                <th className="px-4 py-2 text-left">{t('pages.support.table.category')}</th>
                <th className="px-4 py-2 text-left">{t('pages.support.table.priority')}</th>
                <th className="px-4 py-2 text-left">{t('pages.support.table.status')}</th>
                <th className="px-4 py-2 text-left">{t('pages.support.table.updated')}</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((tk) => (
                <tr key={tk._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-bold text-gray-900 truncate max-w-xs">{tk.subject}</p>
                    <p className="text-[10px] text-gray-500 truncate max-w-xs">
                      {tk.replies.length} {tk.replies.length === 1 ? t('pages.support.table.reply') : t('pages.support.table.replies')}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-900 truncate max-w-[160px]">
                      {tk.user?.name || tk.user?.email || "—"}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate max-w-[160px]">
                      {tk.user?.customId || "—"}
                    </p>
                  </td>
                  <td className="px-4 py-3 capitalize">{tk.category}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wide ${PRIORITY_BADGE[tk.priority]}`}
                    >
                      {tk.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wide ${STATUS_BADGE[tk.status]}`}
                    >
                      {tk.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-gray-500">{formatDate(tk.updatedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/support/${tk._id}`}
                      className="text-[11px] font-bold text-[#00aeff] hover:underline inline-flex items-center"
                    >
                      {t('pages.support.table.openLink')} <ArrowRight className="w-3 h-3 ml-0.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string; tone?: string }> = ({ label, value, tone }) => (
  <div className="rounded-lg border border-gray-100 px-4 py-3 bg-white">
    <p className="text-[10px] font-semibold text-gray-500 tracking-wide">{label}</p>
    <p className={`text-[20px] font-bold tabular-nums mt-1 ${tone || "text-gray-900"}`}>{value}</p>
  </div>
);

export default SupportListPage;
