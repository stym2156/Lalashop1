import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Banknote, Calendar, ChevronDown, ChevronRight } from "lucide-react";
import { fetchSettlements, type SellerSettlement } from "@/services/sellerApi";

const formatMoney = (n: number): string =>
  Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatPeriod = (period: string, startDate: string): string => {
  const d = new Date(startDate);
  if (period.includes("W")) {
    return `Week of ${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
  }
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
};

const SettlementsPage: React.FC = () => {
  const { t } = useTranslation("common");
  const [items, setItems] = useState<SellerSettlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"week" | "month">("month");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchSettlements(period)
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
  }, [period]);

  const totals = useMemo(() => {
    const gross = items.reduce((s, x) => s + x.gross, 0);
    const fees = items.reduce((s, x) => s + x.fees, 0);
    const net = items.reduce((s, x) => s + x.net, 0);
    const count = items.reduce((s, x) => s + x.count, 0);
    return { gross, fees, net, count };
  }, [items]);

  return (
    <div className="space-y-4 text-sm">
      <div>
        <h1 className="text-[16px] font-bold text-gray-900">{t('pages.settlements.title')}</h1>
        <p className="text-[12px] text-gray-500 mt-0.5">
          {t('pages.settlements.subtitle', { period: period === 'week' ? t('pages.settlements.periodWeek') : t('pages.settlements.periodMonth') })}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Stat label={t('pages.settlements.periods')} value={items.length.toString()} />
        <Stat label={t('pages.settlements.grossPaidOut')} value={`฿${formatMoney(totals.gross)}`} />
        <Stat label={t('pages.settlements.fees')} value={`฿${formatMoney(totals.fees)}`} tone="text-rose-700" />
        <Stat label={t('pages.settlements.netToBank')} value={`฿${formatMoney(totals.net)}`} tone="text-emerald-700" />
      </div>

      <div className="flex items-center gap-1.5 bg-gray-100 rounded p-0.5 w-fit">
        {(["week", "month"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setPeriod(k)}
            className={`px-3 py-1 rounded text-[11px] font-bold capitalize ${
              period === k ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-black"
            }`}
          >
            {k === 'week' ? t('pages.settlements.byWeek') : t('pages.settlements.byMonth')}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="py-12 text-center">
          <Loader2 className="w-5 h-5 animate-spin text-gray-300 mx-auto" />
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center">
          <Banknote className="w-8 h-8 mx-auto mb-3 text-gray-300" />
          <p className="text-[13px] font-bold text-gray-700">{t('pages.settlements.noSettlements')}</p>
          <p className="text-[11px] text-gray-500 mt-1">
            {t('pages.settlements.noSettlementsDesc')}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-100 overflow-hidden bg-white">
          {items.map((s) => {
            const isOpen = expanded === s.period;
            return (
              <div key={s.period} className="border-b border-gray-50 last:border-b-0">
                <button
                  onClick={() => setExpanded(isOpen ? null : s.period)}
                  className="w-full px-4 py-3 flex items-center gap-4 text-left hover:bg-gray-50 transition-colors"
                >
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-gray-900">
                      {formatPeriod(s.period, s.startDate)}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {s.count} withdrawal{s.count === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[14px] font-black tabular-nums text-emerald-700">
                      ฿{formatMoney(s.net)}
                    </p>
                    <p className="text-[10px] text-gray-500 tabular-nums">
                      Gross ฿{formatMoney(s.gross)} · Fee ฿{formatMoney(s.fees)}
                    </p>
                  </div>
                </button>

                {isOpen && (
                  <div className="bg-gray-50/50 px-4 py-2 space-y-1">
                    {s.withdrawals.map((w) => (
                      <div
                        key={w._id}
                        className="flex items-center gap-3 py-1.5 text-[11px]"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-gray-700">
                            {w.bankAccount?.bankName || "—"} ····{w.bankAccount?.accountNumber.slice(-4)}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {new Date(w.processedAt || w.createdAt).toLocaleString("en-GB")}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            w.status === "completed"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {w.status}
                        </span>
                        <p className="font-black text-emerald-700 tabular-nums w-24 text-right">
                          ฿{formatMoney(w.netAmount)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
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
    <p className={`text-[18px] font-bold tabular-nums mt-1 ${tone || "text-gray-900"}`}>{value}</p>
  </div>
);

export default SettlementsPage;
