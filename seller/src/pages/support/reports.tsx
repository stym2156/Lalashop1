import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { AlertCircle, Loader2, Flag } from "lucide-react";
import { apiClient } from "@/services/apiClient";
import { useCurrentSeller } from "@/services/useCurrentSeller";

interface ReportRow {
  _id: string;
  targetType: string;
  targetId: string;
  reason: string;
  description?: string;
  status: "open" | "reviewing" | "actioned" | "dismissed";
  createdAt: string;
}

const statusBadge: Record<string, string> = {
  open: "bg-red-50 text-red-700",
  reviewing: "bg-orange-50 text-orange-700",
  actioned: "bg-green-50 text-green-700",
  dismissed: "bg-gray-100 text-gray-600",
};

const reasonBadge: Record<string, string> = {
  spam: "bg-orange-50 text-orange-700",
  abuse: "bg-red-50 text-red-700",
  fraud: "bg-purple-50 text-purple-700",
  counterfeit: "bg-amber-50 text-amber-700",
  harassment: "bg-rose-50 text-rose-700",
  other: "bg-gray-100 text-gray-600",
};

const formatDate = (s?: string): string => {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
};

const SellerReportsPage: React.FC = () => {
  const { t } = useTranslation("common");
  const { seller } = useCurrentSeller();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!seller?._id) return;
    let cancelled = false;
    setLoading(true);
    // Reports filed against THIS seller's products / shop / posts
    apiClient<{ success: boolean; data?: ReportRow[] }>(
      `/admin/reports?targetId=${seller._id}`,
    )
      .then((res) => {
        if (cancelled) return;
        setReports(res.data ?? []);
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
  }, [seller?._id]);

  return (
    <div className="space-y-4 text-sm">
      <div>
        <h1 className="text-[16px] font-bold text-gray-900">{t('pages.supportReports.title')}</h1>
        <p className="text-[12px] text-gray-500 mt-0.5">
          {t('pages.supportReports.subtitle')}
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700 inline-flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </div>
      )}

      <div className="rounded-lg overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] tabular-nums">
            <thead className="text-[11px] text-gray-500 tracking-wide bg-gray-50/50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">Report</th>
                <th className="px-4 py-2 text-left font-semibold">Target</th>
                <th className="px-4 py-2 text-left font-semibold">Reason</th>
                <th className="px-4 py-2 text-left font-semibold">Description</th>
                <th className="px-4 py-2 text-left font-semibold">Status</th>
                <th className="px-4 py-2 text-left font-semibold">Filed</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                    <Loader2 className="w-5 h-5 mx-auto animate-spin" />
                  </td>
                </tr>
              )}
              {!loading && reports.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                    <Flag className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                    No reports filed against your shop. Keep it up!
                  </td>
                </tr>
              )}
              {!loading &&
                reports.map((r) => (
                  <tr key={r._id} className="border-t border-gray-50">
                    <td className="px-4 py-2 font-mono text-[11px] text-gray-600">
                      RPT-{r._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-4 py-2 text-gray-700 capitalize">{r.targetType}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded capitalize ${reasonBadge[r.reason] || "bg-gray-100 text-gray-600"}`}
                      >
                        {r.reason}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-700">
                      <p className="line-clamp-1 max-w-xs">{r.description || "—"}</p>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded capitalize ${statusBadge[r.status]}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-500 text-[11px]">{formatDate(r.createdAt)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[11px] text-gray-400">
        If you believe a report is incorrect, file an{" "}
        <Link href="/support/tickets" className="text-[#00aeff] hover:underline font-bold">
          appeal
        </Link>
        .
      </p>
    </div>
  );
};

export default SellerReportsPage;
