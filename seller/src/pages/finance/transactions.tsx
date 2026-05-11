import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Loader2, ArrowDownCircle, ArrowUpCircle, RotateCcw, Receipt,
  Search,
} from "lucide-react";
import { fetchTransactions, type SellerTransaction } from "@/services/sellerApi";

const formatMoney = (n: number): string =>
  Number(Math.abs(n) || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (s: string): string => {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const TYPE_META: Record<
  SellerTransaction["type"],
  { label: string; icon: typeof Receipt; color: string }
> = {
  income: { label: "Income", icon: ArrowDownCircle, color: "text-emerald-600" },
  withdrawal: { label: "Withdrawal", icon: ArrowUpCircle, color: "text-blue-600" },
  refund: { label: "Refund", icon: RotateCcw, color: "text-rose-600" },
  fee: { label: "Fee", icon: Receipt, color: "text-amber-600" },
};

const TransactionsPage: React.FC = () => {
  const { t } = useTranslation("common");
  const [items, setItems] = useState<SellerTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | SellerTransaction["type"]>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchTransactions(300)
      .then((list) => {
        if (!cancelled) setItems(list);
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((t) => {
      if (filter !== "all" && t.type !== filter) return false;
      if (q && !t.description.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, filter, search]);

  const totals = useMemo(() => {
    const inflow = items.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const outflow = items.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    return { inflow, outflow, net: inflow - outflow };
  }, [items]);

  return (
    <div className="space-y-4 text-sm">
      <div>
        <h1 className="text-[16px] font-bold text-gray-900">{t('pages.transactions.title')}</h1>
        <p className="text-[12px] text-gray-500 mt-0.5">
          {t('pages.transactions.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label={t('pages.transactions.totalInflow')} value={`฿${formatMoney(totals.inflow)}`} tone="text-emerald-700" />
        <Stat label={t('pages.transactions.totalOutflow')} value={`฿${formatMoney(totals.outflow)}`} tone="text-rose-700" />
        <Stat label={t('pages.transactions.net')} value={`฿${formatMoney(totals.net)}`} tone="text-[#00aeff]" />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 bg-gray-100 rounded p-0.5">
          {(["all", "income", "withdrawal", "refund", "fee"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`px-3 py-1 rounded text-[11px] font-bold capitalize ${
                filter === k ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-black"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('pages.transactions.searchPlaceholder')}
            className="bg-gray-50 border border-gray-100 focus:bg-white focus:border-gray-200 outline-none rounded-md pl-8 pr-3 py-1.5 text-xs w-64"
          />
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
          <Receipt className="w-8 h-8 mx-auto mb-3 text-gray-300" />
          <p className="text-[13px] font-bold text-gray-700">
            {items.length === 0 ? t('pages.transactions.noTransactions') : t('common.noMatches')}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-100 overflow-hidden bg-white divide-y divide-gray-50">
          {filtered.map((t) => {
            const meta = TYPE_META[t.type];
            const Icon = meta.icon;
            const positive = t.amount >= 0;
            return (
              <div key={t._id} className="px-4 py-3 flex items-center gap-3">
                <Icon className={`w-5 h-5 flex-shrink-0 ${meta.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-gray-900 truncate">
                    {t.description}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {meta.label} · {formatDate(t.createdAt)}
                  </p>
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wide bg-gray-100 text-gray-600`}
                >
                  {t.status}
                </span>
                <p
                  className={`text-[14px] font-black tabular-nums w-28 text-right ${
                    positive ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {positive ? "+" : "−"}฿{formatMoney(t.amount)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string; tone?: string }> = ({ label, value, tone }) => (
  <div className="rounded-lg border border-gray-100 px-4 py-3">
    <p className="text-[11px] font-semibold text-gray-500 tracking-wide">{label}</p>
    <p className={`text-[20px] font-bold tabular-nums mt-1 ${tone || "text-gray-900"}`}>{value}</p>
  </div>
);

export default TransactionsPage;
