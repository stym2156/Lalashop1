import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Loader2, RotateCcw, CheckCircle2, XCircle, AlertCircle, X,
} from "lucide-react";
import {
  fetchRefunds,
  decideRefund,
  type SellerRefund,
  type RefundStatus,
} from "@/services/sellerApi";

const formatMoney = (n: number): string =>
  Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });

const formatDate = (s?: string): string => {
  if (!s) return "—";
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

const STATUS_BADGE: Record<RefundStatus, string> = {
  requested: "bg-amber-100 text-amber-700",
  approved: "bg-blue-100 text-blue-700",
  rejected: "bg-red-100 text-red-700",
  completed: "bg-emerald-100 text-emerald-700",
};

const REASON_KEY: Record<string, string> = {
  not_received: "pages.refunds.reasonNotReceived",
  damaged: "pages.refunds.reasonDamaged",
  wrong_item: "pages.refunds.reasonWrongItem",
  not_as_described: "pages.refunds.reasonNotAsDescribed",
  changed_mind: "pages.refunds.reasonChangedMind",
  other: "pages.refunds.reasonOther",
};

const RefundsPage: React.FC = () => {
  const { t } = useTranslation("common");
  const [items, setItems] = useState<SellerRefund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | RefundStatus>("all");
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [noteFor, setNoteFor] = useState<{ id: string; action: "approve" | "reject" | "complete" } | null>(null);
  const [note, setNote] = useState("");

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchRefunds();
      setItems(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("pages.refunds.errLoadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((r) => r.status === filter)),
    [items, filter]
  );

  const stats = useMemo(() => {
    const requested = items.filter((r) => r.status === "requested").length;
    const refundedAmount = items
      .filter((r) => r.status === "approved" || r.status === "completed")
      .reduce((s, r) => s + r.amount, 0);
    return { total: items.length, requested, refundedAmount };
  }, [items]);

  const submitDecision = async () => {
    if (!noteFor) return;
    setDecidingId(noteFor.id);
    try {
      await decideRefund(noteFor.id, noteFor.action, note);
      setNoteFor(null);
      setNote("");
      await reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : t("pages.refunds.errDecisionFailed"));
    } finally {
      setDecidingId(null);
    }
  };

  return (
    <div className="space-y-4 text-sm">
      <div>
        <h1 className="text-[16px] font-bold text-gray-900">{t('pages.refunds.title')}</h1>
        <p className="text-[12px] text-gray-500 mt-0.5">
          {t('pages.refunds.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label={t('pages.refunds.totalRefunds')} value={stats.total.toString()} />
        <Stat label={t('pages.refunds.awaitingDecision')} value={stats.requested.toString()} tone="text-amber-700" />
        <Stat
          label={t('pages.refunds.totalRefunded')}
          value={`฿${formatMoney(stats.refundedAmount)}`}
          tone="text-rose-700"
        />
      </div>

      <div className="flex items-center gap-1.5 bg-gray-100 rounded p-0.5 w-fit">
        {(["all", "requested", "approved", "rejected", "completed"] as const).map((k) => (
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

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="py-12 text-center">
          <Loader2 className="w-5 h-5 animate-spin text-gray-300 mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <RotateCcw className="w-8 h-8 mx-auto mb-3 text-gray-300" />
          <p className="text-[13px] font-bold text-gray-700">
            {items.length === 0 ? t('pages.refunds.noRefundRequests') : t('common.noMatches')}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <div key={r._id} className="rounded-lg border border-gray-100 p-4 bg-white">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-bold text-gray-900">
                      {r.customer?.name || r.customer?.username || t('orders.customer')}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wide ${STATUS_BADGE[r.status]}`}
                    >
                      {r.status}
                    </span>
                    <span className="text-[10px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">
                      {REASON_KEY[r.reason] ? t(REASON_KEY[r.reason]) : r.reason}
                    </span>
                  </div>
                  <p className="text-[12px] text-gray-600 mt-1">
                    {r.description || <span className="italic text-gray-400">{t('common.noDescription')}</span>}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    {t('pages.refunds.orderLine', { id: r.order?._id.slice(-8).toUpperCase(), date: formatDate(r.createdAt) })}
                  </p>
                  {r.resolutionNote && (
                    <p className="text-[11px] text-gray-700 mt-2 bg-gray-50 px-2 py-1 rounded">
                      {t('pages.refunds.resolutionLabel')} {r.resolutionNote}
                    </p>
                  )}
                  {r.evidenceImages?.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {r.evidenceImages.map((url, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={i}
                          src={url}
                          alt=""
                          className="w-12 h-12 rounded object-cover border border-gray-200"
                        />
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[18px] font-black text-rose-700 tabular-nums">
                    ฿{formatMoney(r.amount)}
                  </p>
                  {r.status === "requested" && (
                    <div className="flex gap-1.5 mt-2">
                      <button
                        onClick={() => {
                          setNoteFor({ id: r._id, action: "approve" });
                          setNote("");
                        }}
                        disabled={decidingId === r._id}
                        className="px-3 py-1.5 rounded-md text-[10px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" /> {t('pages.refunds.approve')}
                      </button>
                      <button
                        onClick={() => {
                          setNoteFor({ id: r._id, action: "reject" });
                          setNote("");
                        }}
                        disabled={decidingId === r._id}
                        className="px-3 py-1.5 rounded-md text-[10px] font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 inline-flex items-center"
                      >
                        <XCircle className="w-3 h-3 mr-1" /> {t('pages.refunds.reject')}
                      </button>
                    </div>
                  )}
                  {r.status === "approved" && (
                    <button
                      onClick={() => {
                        setNoteFor({ id: r._id, action: "complete" });
                        setNote("");
                      }}
                      disabled={decidingId === r._id}
                      className="mt-2 px-3 py-1.5 rounded-md text-[10px] font-bold bg-[#00aeff] text-white hover:bg-[#0096db] disabled:opacity-50"
                    >
                      {t('pages.refunds.markRefunded')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {noteFor && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-bold text-gray-900">
                {noteFor.action === "approve" && t('pages.refunds.approveRefund')}
                {noteFor.action === "reject" && t('pages.refunds.rejectRefund')}
                {noteFor.action === "complete" && t('pages.refunds.markAsRefunded')}
              </h2>
              <button onClick={() => setNoteFor(null)} className="text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-gray-500">
              {noteFor.action === "approve" && t('pages.refunds.approveDesc')}
              {noteFor.action === "reject" && t('pages.refunds.rejectDesc')}
              {noteFor.action === "complete" && t('pages.refunds.completeDesc')}
            </p>
            <textarea
              className="w-full bg-gray-50 border border-gray-100 focus:bg-white focus:border-gray-200 outline-none rounded p-2 text-xs"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('pages.refunds.notePlaceholder')}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setNoteFor(null)}
                className="px-3 py-1.5 rounded border text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                {t('actions.cancel')}
              </button>
              <button
                onClick={submitDecision}
                disabled={decidingId === noteFor.id}
                className="px-4 py-1.5 rounded bg-[#00aeff] text-white text-xs font-bold hover:bg-[#0096db] disabled:opacity-50"
              >
                {decidingId === noteFor.id ? t('actions.saving') : t('actions.confirm')}
              </button>
            </div>
          </div>
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

export default RefundsPage;
