import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchAdminAuditLogs, type AdminAuditLogRow } from '@/services/adminApi';

const formatDate = (s?: string): string => {
  if (!s) return '—';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '—';
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const AdminAuditTab = () => {
  const [items, setItems] = useState<AdminAuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAdminAuditLogs({ limit: 200 })
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

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 px-4 py-3 bg-gray-50/50 text-[11px]">
        <div>
          <p className="text-gray-500">total events</p>
          <p className="text-base font-bold tabular-nums">{items.length}</p>
        </div>
        <div>
          <p className="text-gray-500">unique admins</p>
          <p className="text-base font-bold tabular-nums">{new Set(items.map((i) => i.admin?._id).filter(Boolean)).size}</p>
        </div>
        <div>
          <p className="text-gray-500">unique actions</p>
          <p className="text-base font-bold tabular-nums">{new Set(items.map((i) => i.action)).size}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[12px] tabular-nums">
          <thead className="text-[11px] text-gray-500 tracking-wide">
            <tr>
              <th className="px-4 py-2 text-left font-semibold">Audit ID</th>
              <th className="px-4 py-2 text-left font-semibold">Admin / IP</th>
              <th className="px-4 py-2 text-left font-semibold">Action</th>
              <th className="px-4 py-2 text-left font-semibold">Target</th>
              <th className="px-4 py-2 text-left font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400 text-[12px]">Loading...</td></tr>
            )}
            {!loading && error && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-red-500 text-[12px]">{error}</td></tr>
            )}
            {!loading && !error && items.map((a) => (
              <tr key={a._id} className="border-t border-gray-50">
                <td className="px-4 py-2 font-mono text-[11px] text-gray-600">{a._id.slice(-8).toUpperCase()}</td>
                <td className="px-4 py-2">
                  <div className="font-mono text-[11px] font-semibold text-gray-900">
                    {a.admin?._id ? (
                      <Link href={`/users/${a.admin._id}`} className="hover:text-primary">
                        @{a.admin?.name || a.admin?.email}
                      </Link>
                    ) : '—'}
                  </div>
                  <div className="font-mono text-[11px] text-gray-500">{a.ip || '—'}</div>
                </td>
                <td className="px-4 py-2 text-gray-700 font-medium font-mono text-[11px]">{a.action}</td>
                <td className="px-4 py-2 text-[11px] text-gray-700 capitalize">
                  {a.targetType ? (
                    <>
                      {a.targetType}
                      {a.targetId && (
                        <span className="font-mono text-gray-500 ml-1">
                          #{a.targetId.slice(-6).toUpperCase()}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="px-4 py-2 text-gray-500 text-[11px]">{formatDate(a.createdAt)}</td>
              </tr>
            ))}
            {!loading && !error && items.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400 text-[12px]">No audit events yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminAuditTab;
