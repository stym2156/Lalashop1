import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchAdminTickets, type AdminTicketRow, type TicketStatus } from '@/services/adminApi';

const statusBadge: Record<TicketStatus, string> = {
  open: 'bg-blue-50 text-blue-700',
  in_progress: 'bg-amber-50 text-amber-700',
  resolved: 'bg-green-50 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
};

const formatDate = (s?: string): string => {
  if (!s) return '—';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '—';
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const SupportTab = () => {
  const [items, setItems] = useState<AdminTicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAdminTickets({ limit: 100 })
      .then((res) => {
        if (cancelled) return;
        setItems(res.data ?? []);
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

  const counts = items.reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 px-4 py-3 bg-gray-50/50 text-[11px]">
        <div>
          <p className="text-gray-500">total tickets</p>
          <p className="text-base font-bold tabular-nums">{items.length}</p>
        </div>
        <div>
          <p className="text-gray-500">open / in progress</p>
          <p className="text-base font-bold tabular-nums text-amber-700">{(counts.open || 0) + (counts.in_progress || 0)}</p>
        </div>
        <div>
          <p className="text-gray-500">resolved</p>
          <p className="text-base font-bold tabular-nums text-green-700">{counts.resolved || 0}</p>
        </div>
        <div>
          <p className="text-gray-500">closed</p>
          <p className="text-base font-bold tabular-nums text-gray-500">{counts.closed || 0}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[12px] tabular-nums">
          <thead className="text-[11px] text-gray-500 tracking-wide">
            <tr>
              <th className="px-4 py-2 text-left font-semibold">Ticket ID</th>
              <th className="px-4 py-2 text-left font-semibold">Subject</th>
              <th className="px-4 py-2 text-left font-semibold">User</th>
              <th className="px-4 py-2 text-left font-semibold">Category</th>
              <th className="px-4 py-2 text-left font-semibold">Status</th>
              <th className="px-4 py-2 text-left font-semibold">Created</th>
              <th className="px-4 py-2 text-left font-semibold">Updated</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-[12px]">Loading...</td></tr>
            )}
            {!loading && error && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-red-500 text-[12px]">{error}</td></tr>
            )}
            {!loading && !error && items.map((t) => (
              <tr key={t._id} className="border-t border-gray-50">
                <td className="px-4 py-2 font-mono text-[11px] text-gray-600">
                  <Link href={`/users/${t.user?._id || ''}`} className="hover:text-primary">
                    TKT-{t._id.slice(-6).toUpperCase()}
                  </Link>
                </td>
                <td className="px-4 py-2 text-gray-900 font-medium">
                  <p className="line-clamp-1 max-w-xs">{t.subject}</p>
                </td>
                <td className="px-4 py-2 text-gray-700">
                  {t.user?.name || t.user?.email || '—'}
                </td>
                <td className="px-4 py-2 text-gray-700 capitalize">{t.category}</td>
                <td className="px-4 py-2">
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${statusBadge[t.status]}`}>
                    {t.status === 'in_progress' ? 'in progress' : t.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-500 text-[11px]">{formatDate(t.createdAt)}</td>
                <td className="px-4 py-2 text-gray-500 text-[11px]">{formatDate(t.updatedAt)}</td>
              </tr>
            ))}
            {!loading && !error && items.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-[12px]">No support tickets yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SupportTab;
