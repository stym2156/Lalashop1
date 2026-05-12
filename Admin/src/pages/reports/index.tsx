import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Eye, Check, X, AlertCircle, ChevronDown } from 'lucide-react';
import {
  fetchAdminReports,
  fetchAdminReportStats,
  updateAdminReport,
  type AdminReportRow,
  type AdminReportStats,
  type ReportReason,
  type ReportStatus,
  type ReportTargetType,
} from '@/services/adminApi';
import { useTranslation } from 'react-i18next';

const reasonBadge: Record<ReportReason, string> = {
  spam: 'bg-orange-50 text-orange-700',
  abuse: 'bg-red-50 text-red-700',
  fraud: 'bg-purple-50 text-purple-700',
  counterfeit: 'bg-amber-50 text-amber-700',
  harassment: 'bg-rose-50 text-rose-700',
  other: 'bg-gray-100 text-gray-600',
};

const statusBadge: Record<ReportStatus, string> = {
  open: 'bg-red-50 text-red-700',
  reviewing: 'bg-orange-50 text-orange-700',
  actioned: 'bg-green-50 text-green-700',
  dismissed: 'bg-gray-100 text-gray-600',
};

const targetLink = (r: AdminReportRow): string => {
  switch (r.targetType) {
    case 'product':
      return `/products/${r.targetId}`;
    case 'shop':
      return `/shops/${r.targetId}`;
    case 'user':
      return `/users/${r.targetId}`;
    default:
      return '#';
  }
};

const formatDate = (s?: string): string => {
  if (!s) return '—';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '—';
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const ReportsPage = () => {
  const { t } = useTranslation();
  const reasonLabel = (r: ReportReason) => t(`pages.reports.reasonLabel.${r}`);
  const statusLabel = (s: ReportStatus) => t(`pages.reports.statusLabel.${s}`);
  const [stats, setStats] = useState<AdminReportStats | null>(null);
  const [items, setItems] = useState<AdminReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | ReportStatus>('all');
  const [reasonFilter, setReasonFilter] = useState<'all' | ReportReason>('all');
  const [targetFilter, setTargetFilter] = useState<'all' | ReportTargetType>('all');
  const [q, setQ] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, statsRes] = await Promise.all([
        fetchAdminReports({
          status: filter === 'all' ? undefined : filter,
          reason: reasonFilter === 'all' ? undefined : reasonFilter,
          targetType: targetFilter === 'all' ? undefined : targetFilter,
          search: q || undefined,
          limit: 100,
        }),
        fetchAdminReportStats().catch(() => null),
      ]);
      setItems(listRes.data ?? []);
      if (statsRes) setStats(statsRes.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, reasonFilter, targetFilter, q]);

  const onAction = async (id: string, status: ReportStatus, actionTaken?: 'remove' | 'ban' | 'warn' | 'none') => {
    setBusyId(id);
    try {
      await updateAdminReport(id, { status, ...(actionTaken ? { actionTaken } : {}) });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  const tabs: ('all' | ReportStatus)[] = ['all', 'open', 'reviewing', 'actioned', 'dismissed'];
  const reasons: ('all' | ReportReason)[] = ['all', 'spam', 'abuse', 'fraud', 'counterfeit', 'harassment', 'other'];
  const targets: ('all' | ReportTargetType)[] = ['all', 'user', 'shop', 'product', 'post', 'comment'];

  return (
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KPI label={t('pages.reports.kpi.total')} value={stats ? stats.total.toLocaleString() : '—'} tone="text-black" />
        <KPI label={t('pages.reports.kpi.open')} value={stats ? stats.open.toLocaleString() : '—'} tone="text-red-700" />
        <KPI label={t('pages.reports.kpi.reviewing')} value={stats ? stats.reviewing.toLocaleString() : '—'} tone="text-orange-700" />
        <KPI label={t('pages.reports.kpi.actioned')} value={stats ? stats.actioned.toLocaleString() : '—'} tone="text-green-700" />
        <KPI label={t('pages.reports.kpi.dismissed')} value={stats ? stats.dismissed.toLocaleString() : '—'} tone="text-gray-500" />
      </div>

      <div className="rounded-lg px-3 py-2 flex flex-wrap items-center gap-2">
        <Dropdown label={t('pages.reports.filterLabel.status')} value={filter} options={tabs} onChange={(v) => setFilter(v as any)} format={(v) => (v === 'all' ? t('pages.reports.filterLabel.all') : statusLabel(v as ReportStatus))} />
        <Dropdown label={t('pages.reports.filterLabel.reason')} value={reasonFilter} options={reasons} onChange={(v) => setReasonFilter(v as any)} format={(v) => (v === 'all' ? t('pages.reports.filterLabel.all') : reasonLabel(v as ReportReason))} />
        <Dropdown label={t('pages.reports.filterLabel.target')} value={targetFilter} options={targets} onChange={(v) => setTargetFilter(v as any)} format={(v) => (v === 'all' ? t('pages.reports.filterLabel.all') : v.charAt(0).toUpperCase() + v.slice(1))} />

        <div className="ml-auto relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="text"
            placeholder={t('pages.reports.searchPlaceholder')}
            className="pl-7 pr-3 py-1 rounded text-[11px] w-64 bg-gray-50 border border-gray-100 focus:border-primary outline-none"
          />
        </div>
      </div>

      <div className="rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] tabular-nums">
            <thead className="text-[11px] text-gray-500 tracking-wide">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">{t('pages.reports.table.reportId')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('pages.reports.table.reason')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('pages.reports.table.target')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('pages.reports.table.reportedBy')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('pages.reports.table.description')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('pages.reports.table.reported')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('pages.reports.table.status')}</th>
                <th className="px-4 py-2 text-right font-semibold">{t('pages.reports.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                    {t('pages.reports.loading')}
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-red-500 text-[12px]">{error}</td>
                </tr>
              )}
              {!loading && !error && items.map((r) => (
                <tr key={r._id}>
                  <td className="px-4 py-2 font-mono text-[11px] text-gray-600">
                    <Link href={`/reports/${r._id}`} className="hover:text-primary transition-colors">
                      RPT-{r._id.slice(-6).toUpperCase()}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${reasonBadge[r.reason]}`}>
                      {reasonLabel(r.reason)}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <Link href={targetLink(r)} className="hover:text-primary transition-colors">
                      <span className="font-mono text-[11px] text-gray-700">{r.targetId.slice(-8).toUpperCase()}</span>
                      <span className="text-[10px] text-gray-400 capitalize ml-1.5">{r.targetType}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-2 font-medium text-gray-900">
                    {r.reportedBy?._id ? (
                      <Link href={`/users/${r.reportedBy._id}`} className="hover:text-primary transition-colors">
                        {r.reportedBy?.name || r.reportedBy?.email || '—'}
                      </Link>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-2 text-gray-700">
                    <p className="line-clamp-1 max-w-xs">{r.description || <span className="text-gray-300">—</span>}</p>
                  </td>
                  <td className="px-4 py-2 text-gray-500 text-[11px]">{formatDate(r.createdAt)}</td>
                  <td className="px-4 py-2">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${statusBadge[r.status]}`}>
                      {statusLabel(r.status)}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      <Link href={`/reports/${r._id}`} title="View" className="text-gray-500 hover:text-black hover:bg-gray-100 rounded p-1">
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      {r.status === 'open' && (
                        <button
                          disabled={busyId === r._id}
                          onClick={() => onAction(r._id, 'reviewing')}
                          title="Start reviewing"
                          className="text-gray-500 hover:text-orange-600 hover:bg-gray-100 rounded p-1 disabled:opacity-50"
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {(r.status === 'open' || r.status === 'reviewing') && (
                        <>
                          <button
                            disabled={busyId === r._id}
                            onClick={() => onAction(r._id, 'actioned', 'remove')}
                            title="Action"
                            className="text-gray-500 hover:text-green-700 hover:bg-gray-100 rounded p-1 disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={busyId === r._id}
                            onClick={() => onAction(r._id, 'dismissed', 'none')}
                            title="Dismiss"
                            className="text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded p-1 disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !error && items.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                    {t('pages.reports.noMatch')}
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

interface DropdownProps {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  format: (v: string) => string;
}

const Dropdown: React.FC<DropdownProps> = ({ label, value, options, onChange, format }) => {
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 min-w-[110px] justify-between"
      >
        <span><span className="text-gray-400 mr-1">{label}:</span>{format(value)}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-100 rounded-md shadow-md py-1 z-10 min-w-[140px]">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                value === opt ? 'bg-gray-50 text-black' : 'text-gray-600 hover:bg-gray-50 hover:text-black'
              }`}
            >
              {format(opt)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
