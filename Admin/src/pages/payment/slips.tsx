import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Loader2, AlertCircle, CheckCircle2, XCircle, ZoomIn, X, Receipt,
} from "lucide-react";
import {
  fetchAdminSlips,
  fetchAdminSlipStats,
  reviewAdminSlip,
  type AdminPaymentSlip,
  type PaymentSlipStatus,
  type SlipStats,
} from "@/services/adminApi";

const formatMoney = (n: number): string =>
  Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });

const formatDateTime = (s?: string): string => {
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

const STATUS_BADGE: Record<PaymentSlipStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  verified: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

const TABS: Array<{ key: PaymentSlipStatus | "all"; label: string }> = [
  { key: "pending", label: "Pending" },
  { key: "verified", label: "Verified" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

const initial = (name?: string): string =>
  (name || "?").trim().charAt(0).toUpperCase() || "?";

const SlipsPage: React.FC = () => {
  const [items, setItems] = useState<AdminPaymentSlip[]>([]);
  const [stats, setStats] = useState<SlipStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<PaymentSlipStatus | "all">("pending");
  const [reviewing, setReviewing] = useState<{
    slip: AdminPaymentSlip;
    action: "verify" | "reject";
  } | null>(null);
  const [reason, setReason] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, st] = await Promise.all([fetchAdminSlips(tab), fetchAdminSlipStats()]);
      setItems(list.data ?? []);
      setStats(st.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load slips");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const submitReview = async () => {
    if (!reviewing) return;
    if (reviewing.action === "reject" && !reason.trim()) {
      alert("Please enter a rejection reason");
      return;
    }
    setReviewBusy(true);
    try {
      await reviewAdminSlip(reviewing.slip._id, {
        action: reviewing.action,
        reason: reason.trim(),
      });
      setReviewing(null);
      setReason("");
      await reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Review failed");
    } finally {
      setReviewBusy(false);
    }
  };

  const totals = useMemo(() => {
    if (!stats)
      return { pending: 0, verified: 0, rejected: 0, pendingAmount: 0, verifiedAmount: 0 };
    return {
      pending: stats.pending.count,
      verified: stats.verified.count,
      rejected: stats.rejected.count,
      pendingAmount: stats.pending.total,
      verifiedAmount: stats.verified.total,
    };
  }, [stats]);

  return (
    <div className="space-y-4 text-sm">
      <div>
        <h1 className="text-[16px] font-bold text-gray-900">Payment slips</h1>
        <p className="text-[12px] text-gray-500 mt-0.5">
          Verify customer transfer slips. Verifying marks the order as paid and credits the seller.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat
          label="Pending review"
          value={totals.pending.toString()}
          tone="text-amber-700"
          hint={`฿${formatMoney(totals.pendingAmount)} awaiting`}
        />
        <Stat label="Verified" value={totals.verified.toString()} tone="text-emerald-700" hint={`฿${formatMoney(totals.verifiedAmount)} confirmed`} />
        <Stat label="Rejected" value={totals.rejected.toString()} tone="text-rose-700" />
        <Stat
          label="Total slips"
          value={(totals.pending + totals.verified + totals.rejected).toString()}
        />
      </div>

      <div className="flex items-center gap-1.5 bg-gray-100 rounded p-0.5 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1 rounded text-[11px] font-bold capitalize ${
              tab === t.key ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-black"
            }`}
          >
            {t.label}
          </button>
        ))}
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
      ) : items.length === 0 ? (
        <div className="py-16 text-center">
          <Receipt className="w-8 h-8 mx-auto mb-3 text-gray-300" />
          <p className="text-[13px] font-bold text-gray-700">No {tab !== "all" ? tab : ""} slips</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((s) => (
            <div key={s._id} className="rounded-lg border border-gray-100 p-4 bg-white">
              <div className="flex items-start gap-4 flex-wrap">
                {/* Slip image thumbnail */}
                <button
                  onClick={() => setZoomImage(s.slipImageUrl)}
                  className="relative w-24 h-24 rounded-md bg-gray-100 overflow-hidden flex-shrink-0 group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.slipImageUrl}
                    alt="Slip"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn className="w-5 h-5 text-white" />
                  </div>
                </button>

                {/* Slip details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide ${STATUS_BADGE[s.status]}`}
                    >
                      {s.status}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {formatDateTime(s.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-[14px] font-black text-gray-900 tabular-nums">
                      ฿{formatMoney(s.transferAmount)}
                    </p>
                    {s.order && (
                      <span
                        className={`text-[10px] tabular-nums ${
                          Math.abs(s.transferAmount - s.order.totalPrice) < 0.01
                            ? "text-emerald-600"
                            : "text-rose-600 font-bold"
                        }`}
                      >
                        {Math.abs(s.transferAmount - s.order.totalPrice) < 0.01
                          ? "✓ matches order"
                          : `≠ order total ฿${formatMoney(s.order.totalPrice)}`}
                      </span>
                    )}
                  </div>

                  {/* User + order */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded bg-gray-50 px-2 py-1.5">
                      <p className="text-[9px] font-bold text-gray-500 uppercase">Customer</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {s.user?.profileImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={s.user.profileImage}
                            alt=""
                            className="w-5 h-5 rounded-full"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#00aeff] to-[#0096db] text-white text-[9px] font-bold flex items-center justify-center">
                            {initial(s.user?.name || s.user?.email)}
                          </div>
                        )}
                        <Link
                          href={`/users/${s.user?._id}`}
                          className="font-bold text-gray-900 hover:text-[#00aeff] truncate"
                        >
                          {s.user?.name || s.user?.email || "—"}
                        </Link>
                      </div>
                      <p className="text-[9px] text-gray-400 truncate">
                        {s.user?.email}
                      </p>
                    </div>
                    <div className="rounded bg-gray-50 px-2 py-1.5">
                      <p className="text-[9px] font-bold text-gray-500 uppercase">Order</p>
                      {s.order ? (
                        <Link
                          href={`/orders/${s.order._id}`}
                          className="font-mono font-bold text-gray-900 hover:text-[#00aeff]"
                        >
                          #{s.order._id.slice(-8).toUpperCase()}
                        </Link>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                      <p className="text-[9px] text-gray-400">
                        Method: {s.paymentMethod?.label || "—"}
                      </p>
                    </div>
                  </div>

                  {(s.transferRef || s.transferredAt || s.buyerNote) && (
                    <div className="mt-2 text-[11px] space-y-0.5">
                      {s.transferRef && (
                        <p>
                          <span className="text-gray-500">Ref:</span>{" "}
                          <span className="font-mono">{s.transferRef}</span>
                        </p>
                      )}
                      {s.transferredAt && (
                        <p>
                          <span className="text-gray-500">Transferred:</span>{" "}
                          {formatDateTime(s.transferredAt)}
                        </p>
                      )}
                      {s.buyerNote && (
                        <p className="text-gray-700 italic">&ldquo;{s.buyerNote}&rdquo;</p>
                      )}
                    </div>
                  )}

                  {s.status === "rejected" && s.rejectionReason && (
                    <div className="mt-2 rounded bg-rose-50 px-2 py-1 text-[10px] text-rose-700">
                      <strong>Rejected:</strong> {s.rejectionReason}
                    </div>
                  )}
                  {s.reviewedBy && s.reviewedAt && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      Reviewed by {s.reviewedBy.name || s.reviewedBy.email} ·{" "}
                      {formatDateTime(s.reviewedAt)}
                    </p>
                  )}
                </div>

                {/* Actions */}
                {s.status === "pending" && (
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => {
                        setReviewing({ slip: s, action: "verify" });
                        setReason("");
                      }}
                      className="px-3 py-1.5 rounded-md text-[11px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 inline-flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Verify
                    </button>
                    <button
                      onClick={() => {
                        setReviewing({ slip: s, action: "reject" });
                        setReason("");
                      }}
                      className="px-3 py-1.5 rounded-md text-[11px] font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1"
                    >
                      <XCircle className="w-3 h-3" /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image zoom modal */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-6"
          onClick={() => setZoomImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white p-2 rounded-full bg-black/50"
            onClick={() => setZoomImage(null)}
          >
            <X className="w-5 h-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoomImage} alt="Slip" className="max-w-full max-h-full object-contain rounded" />
        </div>
      )}

      {/* Review modal */}
      {reviewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-5 space-y-3">
            <h2 className="text-[14px] font-bold text-gray-900">
              {reviewing.action === "verify" ? "Verify payment slip" : "Reject payment slip"}
            </h2>
            <p className="text-[11px] text-gray-500">
              Customer:{" "}
              <strong>{reviewing.slip.user?.name || reviewing.slip.user?.email}</strong> ·
              Amount: <strong>฿{formatMoney(reviewing.slip.transferAmount)}</strong>
            </p>
            {reviewing.action === "verify" ? (
              <div className="rounded-md bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
                ✓ The order will be marked as paid, seller balance credited, and the customer
                notified.
              </div>
            ) : (
              <>
                <div className="rounded-md bg-rose-50 px-3 py-2 text-[11px] text-rose-800">
                  ✗ The customer will be notified to re-upload a corrected slip.
                </div>
                <textarea
                  className="w-full bg-gray-50 border border-gray-100 focus:bg-white focus:border-gray-200 outline-none rounded p-2 text-xs"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason (e.g. amount doesn't match, blurry image, wrong account)"
                  required
                />
              </>
            )}
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setReviewing(null)}
                disabled={reviewBusy}
                className="px-3 py-1.5 rounded text-[11px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={submitReview}
                disabled={reviewBusy}
                className={`px-4 py-1.5 rounded text-[11px] font-bold text-white disabled:opacity-50 inline-flex items-center gap-1.5 ${
                  reviewing.action === "verify"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {reviewBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {reviewBusy ? "Processing…" : reviewing.action === "verify" ? "Confirm verify" : "Confirm reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string; tone?: string; hint?: string }> = ({
  label,
  value,
  tone,
  hint,
}) => (
  <div className="rounded-lg border border-gray-100 px-4 py-3 bg-white">
    <p className="text-[10px] font-semibold text-gray-500 tracking-wide">{label}</p>
    <p className={`text-[20px] font-bold tabular-nums mt-1 ${tone || "text-gray-900"}`}>{value}</p>
    {hint && <p className="text-[10px] text-gray-400 mt-0.5">{hint}</p>}
  </div>
);

export default SlipsPage;
