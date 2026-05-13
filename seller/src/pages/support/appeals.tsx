import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Loader2, AlertCircle, Plus } from "lucide-react";
import { fetchMyTickets, type SellerTicketRow, type TicketStatus } from "@/services/sellerApi";

const statusBadge: Record<TicketStatus, string> = {
  open: "bg-blue-50 text-blue-700",
  in_progress: "bg-amber-50 text-amber-700",
  resolved: "bg-green-50 text-green-700",
  closed: "bg-gray-100 text-gray-600",
};

const formatDate = (s?: string): string => {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
};

// Appeals = subset of tickets with category 'shop' (account/policy escalations)
const AppealsPage: React.FC = () => {
  const { t } = useTranslation("common");
  const [tickets, setTickets] = useState<SellerTicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchMyTickets()
      .then((data) => {
        if (cancelled) return;
        setTickets(data.filter((t) => t.category === "shop" || t.category === "account"));
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

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[16px] font-bold text-gray-900">{t('pages.appeals.title')}</h1>
          <p className="text-[12px] text-gray-500 mt-0.5">
            {t('pages.appeals.subtitle')}
          </p>
        </div>
        <Link
          href="/support/tickets"
          className="bg-[#00aeff] text-white px-3 py-1.5 rounded-md text-xs font-bold inline-flex items-center hover:bg-[#0096db]"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" /> {t('pages.appeals.newAppeal')}
        </Link>
      </div>

      <div className="rounded-md bg-blue-50 px-4 py-2 text-[11px] text-blue-700">
        {t('pages.appeals.info')} <strong>{t('pages.tickets.catAccount').toLowerCase()}</strong> {t('pages.appeals.infoOr')} <strong>{t('pages.tickets.catShop').toLowerCase()}</strong>. {t('pages.appeals.infoEnd')}
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
                <th className="px-4 py-2 text-left font-semibold">{t('pages.appeals.tableSubject')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('pages.appeals.tableCategory')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('pages.appeals.tableStatus')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('pages.appeals.tableCreated')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                    <Loader2 className="w-5 h-5 mx-auto animate-spin" />
                  </td>
                </tr>
              )}
              {!loading && tickets.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                    {t('pages.appeals.noAppeals')}
                  </td>
                </tr>
              )}
              {!loading &&
                tickets.map((ticket) => (
                  <tr key={ticket._id} className="border-t border-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-900">{ticket.subject}</td>
                    <td className="px-4 py-2 text-gray-700 capitalize">{ticket.category}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded capitalize ${statusBadge[ticket.status]}`}
                      >
                        {ticket.status === "in_progress" ? t("status.inProgress") : ticket.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-500 text-[11px]">{formatDate(ticket.createdAt)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AppealsPage;
