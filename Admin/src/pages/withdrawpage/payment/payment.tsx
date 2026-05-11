import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import WithdrawalsTable from '@/components/Withdrawals/WithdrawalsTable';
import { fetchAdminWithdrawStats, type AdminWithdrawStats } from '@/services/adminApi';

const formatMoney = (n: number): string =>
  Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

const PaymentPage = () => {
  const { t } = useTranslation('common');
  const [stats, setStats] = useState<AdminWithdrawStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAdminWithdrawStats()
      .then((res) => {
        if (cancelled) return;
        setStats(res.data ?? null);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4 text-sm">
      <h2 className="text-[14px] font-semibold text-gray-900">{t('withdraw.paymentTitle')}</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label={t('status.pending')} value={stats ? stats.pending.toLocaleString() : '—'} tone="text-orange-700" />
        <KPI label={t('status.approved')} value={stats ? stats.approved.toLocaleString() : '—'} tone="text-blue-700" />
        <KPI label={t('status.completed')} value={stats ? stats.completed.toLocaleString() : '—'} tone="text-green-700" />
        <KPI
          label={t('table.amountKip')}
          value={stats ? formatMoney(stats.totalsByStatus.approved ?? 0) : '—'}
          tone="text-black"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-2 text-[12px] text-red-700">
          {error}
        </div>
      )}

      <WithdrawalsTable role="all" paymentMode defaultStatus="approved" />
    </div>
  );
};

const KPI = ({ label, value, tone }: { label: string; value: string; tone: string }) => (
  <div className="rounded-lg px-4 py-3">
    <p className="text-[11px] font-semibold text-gray-500 tracking-wide">{label}</p>
    <p className={`text-xl font-bold tabular-nums mt-1 ${tone}`}>{value}</p>
  </div>
);

export default PaymentPage;
