import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Search, Calendar, Check, X, ChevronDown, MoreHorizontal } from 'lucide-react';
import {
  fetchAdminWithdrawals,
  processAdminWithdrawal,
  type AdminWithdrawRow,
  type WithdrawStatus,
  type ListWithdrawalsParams,
} from '@/services/adminApi';

const statusBadge: Record<WithdrawStatus, string> = {
  pending: 'text-yellow-700',
  approved: 'text-blue-700',
  completed: 'text-green-700',
  rejected: 'text-red-700',
  failed: 'text-rose-700',
};

const statusLabelKey: Record<WithdrawStatus, string> = {
  pending: 'status.pending',
  approved: 'status.approved',
  completed: 'status.completed',
  rejected: 'status.rejected',
  failed: 'status.failed',
};

const formatMoney = (n: number): string =>
  Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

const formatDate = (s?: string): string => {
  if (!s) return '—';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '—';
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

interface WithdrawalsTableProps {
  role?: 'seller' | 'creator' | 'all';
  paymentMode?: boolean;
  defaultStatus?: WithdrawStatus | 'all';
}

const WithdrawalsTable: React.FC<WithdrawalsTableProps> = ({
  role = 'all',
  paymentMode = false,
  defaultStatus = 'all',
}) => {
  const { t } = useTranslation('common');
  const [filter, setFilter] = useState<'all' | WithdrawStatus>(defaultStatus);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AdminWithdrawRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: ListWithdrawalsParams = {
        role,
        status: filter === 'all' ? undefined : filter,
        search: q || undefined,
        limit: 100,
      };
      const res = await fetchAdminWithdrawals(params);
      setItems(res.data ?? []);
      setTotal(res.meta?.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('withdraw.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await load();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, q, role]);

  const tabs: ('all' | WithdrawStatus)[] = paymentMode
    ? ['all', 'approved', 'completed', 'failed']
    : ['all', 'pending', 'approved', 'completed', 'rejected', 'failed'];

  const onProcess = async (
    id: string,
    decision: 'approve' | 'reject' | 'complete' | 'fail',
  ) => {
    setBusyId(id);
    try {
      await processAdminWithdrawal(id, { decision });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('withdraw.actionFailed'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div className="rounded-lg px-3 py-2 flex flex-wrap items-center gap-2">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 min-w-[100px] justify-between"
          >
            <span>{filter === 'all' ? t('common.all') : t(statusLabelKey[filter as WithdrawStatus])}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          {open && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-100 rounded-md shadow-md py-1 z-10 min-w-[120px]">
              {tabs.map((tabKey) => (
                <button
                  key={tabKey}
                  onClick={() => { setFilter(tabKey); setOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-[11px] font-semibold transition-colors ${filter === tabKey
                      ? 'bg-gray-50 text-black'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-black'
                    }`}
                >
                  {tabKey === 'all' ? t('common.all') : t(statusLabelKey[tabKey as WithdrawStatus])}
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="inline-flex items-center text-[11px] font-medium text-gray-700 px-2 py-1 rounded">
          <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-400" /> {t('table.dateRange')}
        </button>
        <div className="ml-auto relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="text"
            placeholder={t('withdraw.searchPlaceholder')}
            className="pl-7 pr-3 py-1 rounded text-[11px] w-64 bg-gray-50 border border-gray-100 focus:border-primary outline-none"
          />
        </div>
      </div>

      <div className="rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] tabular-nums">
            <thead className="text-[11px] text-gray-500 tracking-wide">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">{t('table.requested')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('table.transactionId')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('table.user')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('table.shop')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('table.bank')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('table.account')}</th>
                <th className="px-4 py-2 text-right font-semibold">{t('table.amountKip')}</th>
                <th className="px-4 py-2 text-right font-semibold">{t('table.netKip')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('table.status')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('table.processedBy')}</th>
                <th className="px-4 py-2 text-right font-semibold">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                    {t('withdraw.loading')}
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-red-500 text-[12px]">{error}</td>
                </tr>
              )}
              {!loading && !error && items.map((w) => (
                <tr key={w._id}>
                  <td className="px-4 py-2 text-gray-500 text-[11px]">{formatDate(w.createdAt)}</td>
                  <td className="px-4 py-2 font-mono text-[11px] text-gray-600">
                    <Link href={`/withdrawpage/${w._id}`} className="hover:text-primary transition-colors">
                      {w._id.slice(-8).toUpperCase()}
                    </Link>
                  </td>
                  <td className="px-4 py-2 font-medium text-gray-900">
                    {w.user?._id ? (
                      <Link href={`/users/${w.user._id}`} className="hover:text-primary transition-colors">
                        {w.user?.name || w.user?.email || '—'}
                      </Link>
                    ) : (
                      <span>{w.user?.name || w.user?.email || '—'}</span>
                    )}
                    {w.user?.customId && (
                      <span className="text-gray-400 text-[11px] ml-1">{w.user.customId}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {/* Shop column — clickable to /shops/{userId}. Falls back */}
                    {/* to the user's display name when KYC shop name isn't set. */}
                    {w.user?._id && (w.user?.isSeller || w.shopName) ? (
                      <Link
                        href={`/shops/${w.user._id}`}
                        className="text-gray-700 hover:text-primary transition-colors inline-flex items-center gap-1.5"
                      >
                        {w.shopName || w.user?.name || t('withdraw.shopFallback')}
                      </Link>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-gray-700">{w.bankAccount?.bankName || '—'}</td>
                  <td className="px-4 py-2 text-gray-700">{w.bankAccount?.accountNumber || '—'}</td>
                  <td className="px-4 py-2 text-right font-semibold text-gray-900">{formatMoney(w.amount)}</td>
                  <td className="px-4 py-2 text-right text-gray-700">{formatMoney(w.netAmount)}</td>
                  <td className="px-4 py-2">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${statusBadge[w.status]}`}>
                      {t(statusLabelKey[w.status])}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {/* Processed-by column — clickable to /users/{adminId} so */}
                    {/* finance can audit which admin took the action. */}
                    {w.processedBy?._id ? (
                      <Link
                        href={`/users/${w.processedBy._id}`}
                        className="text-gray-700 hover:text-primary transition-colors text-[11px]"
                      >
                        {w.processedBy.name || w.processedBy.email || w.processedBy.customId || t('withdraw.adminFallback')}
                      </Link>
                    ) : (
                      <span className="text-gray-400 text-[11px]">—</span>
                    )}
                    {w.processedAt && (
                      <p className="text-gray-400 text-[10px] tabular-nums">
                        {formatDate(w.processedAt)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="inline-flex items-center justify-end gap-0.5">
                      {!paymentMode && w.status === 'pending' && (
                        <>
                          <button
                            disabled={busyId === w._id}
                            onClick={() => onProcess(w._id, 'approve')}
                            title={t('withdraw.approveTitle')}
                            className="text-gray-500 hover:text-green-700 hover:bg-gray-100 rounded p-1 disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={busyId === w._id}
                            onClick={() => onProcess(w._id, 'reject')}
                            title={t('withdraw.rejectTitle')}
                            className="text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded p-1 disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      {paymentMode && w.status === 'approved' && (
                        <>
                          <button
                            disabled={busyId === w._id}
                            onClick={() => onProcess(w._id, 'complete')}
                            title={t('withdraw.markPaidTitle')}
                            className="text-gray-500 hover:text-green-700 hover:bg-gray-100 rounded p-1 disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={busyId === w._id}
                            onClick={() => onProcess(w._id, 'fail')}
                            title={t('withdraw.markFailedTitle')}
                            className="text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded p-1 disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <Link
                        href={`/withdrawpage/${w._id}`}
                        title={t('withdraw.detailTitle')}
                        className="text-gray-500 hover:text-black hover:bg-gray-100 rounded p-1 inline-flex"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && !error && items.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                    {t('withdraw.noMatch')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-2.5 text-[11px] text-gray-500">
          <span>{t('withdraw.showing', { shown: items.length, total })}</span>
        </div>
      </div>
    </>
  );
};

export default WithdrawalsTable;
