import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Wallet, Search, ChevronDown } from 'lucide-react';
import {
  fetchMyWithdrawals,
  type SellerWithdrawalRow,
  type WithdrawStatus,
} from '@/services/sellerApi';

const statusBadge: Record<WithdrawStatus, string> = {
  pending: 'bg-orange-50 text-orange-700',
  approved: 'bg-blue-50 text-blue-700',
  completed: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
  failed: 'bg-red-50 text-red-700',
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

const WithdrawalsPage = () => {
  const { t } = useTranslation('common');
  const [items, setItems] = useState<SellerWithdrawalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | WithdrawStatus>('all');
  const [q, setQ] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchMyWithdrawals()
      .then((res) => {
        if (!cancelled) setItems(res);
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

  const filtered = items.filter((w) => {
    if (filter !== 'all' && w.status !== filter) return false;
    if (!q) return true;
    return (
      w._id.toLowerCase().includes(q.toLowerCase()) ||
      (w.bankAccount?.accountNumber?.includes(q) ?? false)
    );
  });

  const counts = {
    all: items.length,
    pending: items.filter((w) => w.status === 'pending').length,
    approved: items.filter((w) => w.status === 'approved').length,
    completed: items.filter((w) => w.status === 'completed').length,
    rejected: items.filter((w) => w.status === 'rejected').length,
    failed: items.filter((w) => w.status === 'failed').length,
  };

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between">
        <h1 className="text-[16px] font-bold text-gray-900">{t('pages.withdrawals.title')}</h1>
      </div>

      <div className="rounded-lg px-3 py-2 flex flex-wrap items-center gap-2">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as 'all' | WithdrawStatus)}
          className="bg-gray-100 rounded text-[11px] font-semibold text-gray-700 px-3 py-1 outline-none cursor-pointer"
        >
          <option value="all">{t('pages.withdrawals.filterAll')} ({counts.all})</option>
          <option value="pending">{t('pages.withdrawals.filterPending')} ({counts.pending})</option>
          <option value="approved">{t('pages.withdrawals.filterApproved')} ({counts.approved})</option>
          <option value="completed">{t('pages.withdrawals.filterCompleted')} ({counts.completed})</option>
          <option value="rejected">{t('pages.withdrawals.filterRejected')} ({counts.rejected})</option>
          <option value="failed">{t('pages.withdrawals.filterFailed')} ({counts.failed})</option>
        </select>

        <div className="ml-auto relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="text"
            placeholder={t('pages.withdrawals.searchPlaceholder')}
            className="pl-7 pr-3 py-1 rounded text-[11px] w-64 bg-gray-50 border border-gray-100 focus:border-[#00aeff] outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-2 text-[12px] text-red-700">{error}</div>
      )}

      <div className="rounded-lg overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] tabular-nums">
            <thead className="text-[11px] text-gray-500 tracking-wide bg-gray-50/50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">{t('pages.withdrawals.tableReference')}</th>
                <th className="px-4 py-2 text-right font-semibold">{t('pages.withdrawals.tableAmount')}</th>
                <th className="px-4 py-2 text-right font-semibold">{t('pages.withdrawals.tableFee')}</th>
                <th className="px-4 py-2 text-right font-semibold">{t('pages.withdrawals.tableNet')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('pages.withdrawals.tableBank')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('pages.withdrawals.tableStatus')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('pages.withdrawals.tableRequested')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('pages.withdrawals.tableProcessed')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('pages.withdrawals.tableNote')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400 text-[12px]">{t('status.loading')}</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                    <Wallet className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                    {t('pages.withdrawals.noItems')}
                  </td>
                </tr>
              )}
              {!loading && filtered.map((w) => (
                <tr key={w._id} className="border-t border-gray-50">
                  <td className="px-4 py-2 font-mono text-[11px] text-gray-600">
                    WD-{w._id.slice(-6).toUpperCase()}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-900">฿{formatMoney(w.amount)}</td>
                  <td className="px-4 py-2 text-right text-gray-700">฿{formatMoney(w.fee)}</td>
                  <td className="px-4 py-2 text-right font-semibold text-gray-900">฿{formatMoney(w.netAmount)}</td>
                  <td className="px-4 py-2 text-gray-700 text-[11px]">
                    {w.bankAccount?.bankName || '—'}
                    {w.bankAccount?.accountNumber && (
                      <span className="block font-mono text-gray-400">{w.bankAccount.accountNumber}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded capitalize ${statusBadge[w.status]}`}>
                      {w.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-500 text-[11px]">{formatDate(w.createdAt)}</td>
                  <td className="px-4 py-2 text-gray-500 text-[11px]">{formatDate(w.processedAt)}</td>
                  <td className="px-4 py-2 text-[11px] text-gray-600">
                    {w.adminNote || <span className="text-gray-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalsPage;
