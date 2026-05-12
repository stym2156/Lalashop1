import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, ShieldCheck, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  fetchAdminAuditLogs,
  fetchAdminAuditStats,
  type AdminAuditLogRow,
  type AdminAuditStats,
} from '@/services/adminApi';

const formatDate = (s?: string): string => {
  if (!s) return '—';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '—';
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const targetTypeOptions = ['all', 'user', 'shop', 'product', 'order', 'withdrawal', 'kyc', 'report', 'category', 'notification', 'setting', 'admin', 'invite', 'other'];

const AdminAuditPage = () => {
  const { t } = useTranslation('common');
  const [items, setItems] = useState<AdminAuditLogRow[]>([]);
  const [stats, setStats] = useState<AdminAuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [targetType, setTargetType] = useState<string>('all');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchAdminAuditLogs({
        targetType: targetType === 'all' ? undefined : targetType,
        search: q || undefined,
        limit: 200,
      }),
      fetchAdminAuditStats().catch(() => null),
    ])
      .then(([listRes, statsRes]) => {
        if (cancelled) return;
        setItems(listRes.data ?? []);
        if (statsRes) setStats(statsRes.data ?? null);
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
  }, [q, targetType]);

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center gap-2">
        <Link
          href="/admins"
          className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 inline-flex items-center hover:bg-gray-100"
        >
          ← {t('common.backToAdmins')}
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label={t('admins.audit.stats.totalEvents')} value={stats ? stats.total.toLocaleString() : '—'} tone="text-black" />
        <KPI label={t('admins.audit.stats.last7d')} value={stats ? stats.last7d.toLocaleString() : '—'} tone="text-blue-700" />
        <KPI label={t('admins.audit.stats.activeAdmins')} value={stats ? stats.byAdmin.length.toLocaleString() : '—'} tone="text-green-700" />
        <KPI label={t('admins.audit.stats.distinctActions')} value={stats ? stats.byAction.length.toLocaleString() : '—'} tone="text-purple-700" />
      </div>

      <div className="rounded-lg px-3 py-2 flex flex-wrap items-center gap-2">
        <div className="relative">
          <select
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
            className="bg-gray-100 rounded text-[11px] font-semibold text-gray-700 px-3 py-1 pr-7 min-w-[110px] outline-none cursor-pointer appearance-none"
          >
            {targetTypeOptions.map((opt) => (
              <option key={opt} value={opt}>{opt === 'all' ? t('pages.admins.audit.allTargets') : opt}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
        </div>

        <div className="ml-auto relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="text"
            placeholder={t('admins.audit.searchPlaceholder')}
            className="pl-7 pr-3 py-1 rounded text-[11px] w-64 bg-gray-50 border border-gray-100 focus:border-primary outline-none"
          />
        </div>
      </div>

      <div className="rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] tabular-nums">
            <thead className="text-[11px] text-gray-500 tracking-wide bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold uppercase">{t('admins.audit.table.time')}</th>
                <th className="px-4 py-2 text-left font-semibold uppercase">{t('common.admin')}</th>
                <th className="px-4 py-2 text-left font-semibold uppercase">{t('admins.audit.table.action')}</th>
                <th className="px-4 py-2 text-left font-semibold uppercase">{t('admins.audit.table.target')}</th>
                <th className="px-4 py-2 text-left font-semibold uppercase">{t('common.lastIp')}</th>
                <th className="px-4 py-2 text-left font-semibold uppercase">{t('admins.audit.table.changes')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                    {t('admins.audit.loading')}
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-red-500 text-[12px]">{error}</td>
                </tr>
              )}
              {!loading && !error && items.map((log) => (
                <tr key={log._id} className="border-t border-gray-50">
                  <td className="px-4 py-2 text-gray-500 text-[11px]">{formatDate(log.createdAt)}</td>
                  <td className="px-4 py-2">
                    {log.admin?._id ? (
                      <Link href={`/users/${log.admin._id}`} className="hover:text-primary transition-colors font-medium text-gray-900">
                        @{log.admin.name || log.admin.email}
                      </Link>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2 font-mono text-[11px] text-gray-700">{log.action}</td>
                  <td className="px-4 py-2 text-gray-700 text-[11px]">
                    {log.targetType ? (
                      <span>
                        <span className="capitalize">{log.targetType}</span>
                        {log.targetId && (
                          <span className="font-mono text-gray-500 ml-1">
                            #{log.targetId.slice(-6).toUpperCase()}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2 font-mono text-[11px] text-gray-500">{log.ip || '—'}</td>
                  <td className="px-4 py-2 text-[11px] text-gray-600">
                    {log.before || log.after ? (
                      <details className="cursor-pointer">
                        <summary className="text-primary hover:underline">{t('admins.audit.viewDiff')}</summary>
                        <div className="mt-1 p-2 bg-gray-50 rounded font-mono text-[10px] whitespace-pre-wrap">
                          {log.before && <div>{t('admins.audit.before')}: {JSON.stringify(log.before)}</div>}
                          {log.after && <div className="text-green-700">{t('admins.audit.after')}: {JSON.stringify(log.after)}</div>}
                          {log.metadata && <div className="text-gray-500">{t('common.message')}: {JSON.stringify(log.metadata)}</div>}
                        </div>
                      </details>
                    ) : log.metadata ? (
                      <span className="text-gray-500 truncate inline-block max-w-xs">
                        {JSON.stringify(log.metadata)}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && !error && items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                    {t('admins.audit.noLogs')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const KPI = ({ label, value, tone }: { label: string; value: string; tone: string }) => (
  <div className="rounded-lg px-4 py-3">
    <p className="text-[11px] font-semibold text-gray-500 tracking-wide">{label}</p>
    <p className={`text-xl font-bold tabular-nums mt-1 ${tone}`}>{value}</p>
  </div>
);

export default AdminAuditPage;
