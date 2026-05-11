import React, { useState } from "react";
import { X, Loader2, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiClient } from "@/services/apiClient";

export type ReportTargetType = "user" | "shop" | "product" | "post" | "comment";
export type ReportReason = "spam" | "abuse" | "fraud" | "counterfeit" | "harassment" | "other";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  targetLabel?: string;
}

export default function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetLabel,
}: ReportModalProps) {
  const { t } = useTranslation("common");
  const REASONS: { id: ReportReason; label: string; description: string }[] = [
    { id: "spam", label: t("pages.report.reasons.spam"), description: t("pages.report.reasons.spamDesc") },
    { id: "abuse", label: t("pages.report.reasons.abuse"), description: t("pages.report.reasons.abuseDesc") },
    { id: "fraud", label: t("pages.report.reasons.fraud"), description: t("pages.report.reasons.fraudDesc") },
    { id: "counterfeit", label: t("pages.report.reasons.counterfeit"), description: t("pages.report.reasons.counterfeitDesc") },
    { id: "harassment", label: t("pages.report.reasons.harassment"), description: t("pages.report.reasons.harassmentDesc") },
    { id: "other", label: t("pages.report.reasons.other"), description: t("pages.report.reasons.otherDesc") },
  ];
  const [reason, setReason] = useState<ReportReason>("spam");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setReason("spam");
    setDescription("");
    setSubmitting(false);
    setSuccess(false);
    setError(null);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiClient("/reports", {
        method: "POST",
        body: JSON.stringify({
          targetType,
          targetId,
          reason,
          description: description.trim(),
        }),
      });
      setSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("pages.report.submitFailed");
      if (msg.toLowerCase().includes("authentication")) {
        setError(t("pages.report.loginRequired"));
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="absolute inset-0" onClick={handleClose} />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <h2 className="font-bold text-base text-slate-900">{t("pages.report.title")}</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X size={18} className="text-slate-600" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="font-bold text-slate-900">{t("pages.report.success")}</h3>
            <p className="text-[12px] text-slate-500 mt-1">
              {t("pages.report.successDesc")}
            </p>
            <button
              onClick={handleClose}
              className="mt-5 w-full py-2.5 rounded-xl bg-black text-white font-bold text-sm hover:bg-gray-900 transition-colors"
            >
              {t("actions.done")}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="text-[11px] text-slate-500">
              {t("pages.report.reporting")} <span className="font-bold capitalize text-slate-700">{targetType}</span>
              {targetLabel ? ` — ${targetLabel}` : ""}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 tracking-wide mb-2">
                {t("pages.report.whyReporting")}
              </label>
              <div className="space-y-2">
                {REASONS.map((r) => (
                  <label
                    key={r.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      reason === r.id
                        ? "border-primary bg-primary/5"
                        : "border-gray-100 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r.id}
                      checked={reason === r.id}
                      onChange={() => setReason(r.id)}
                      className="mt-0.5 accent-primary"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900">{r.label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{r.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 tracking-wide mb-2">
                {reason === "other" ? t("pages.report.additionalDetailsRequired") : t("pages.report.additionalDetailsOptional")}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder={t("pages.report.detailsPlaceholder")}
                required={reason === "other"}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-primary resize-none"
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700">
                {error}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold text-sm transition-colors disabled:opacity-50"
              >
                {t("actions.cancel")}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
                {submitting ? t("pages.report.submitting") : t("pages.report.submit")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
