import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import OrderTable from '@/components/Orders/OrderTable';
import { fetchAdminOrderStats, type AdminOrderStats } from '@/services/adminApi';

const OrdersPage = () => {
  const { t } = useTranslation('common');
  const [stats, setStats] = useState<AdminOrderStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAdminOrderStats()
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
      <div className="flex items-center gap-2">
        <button className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 inline-flex items-center hover:bg-gray-100">
          <Download className="w-3.5 h-3.5 mr-1.5" /> {t('actions.exportCsv')}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label={t('pages.orders.kpi.allOrders')} value={stats ? stats.totalOrders.toLocaleString() : '—'} />
        <KPI label={t('pages.orders.kpi.today')} value={stats ? stats.todayOrders.toLocaleString() : '—'} tone="text-blue-700" />
        <KPI label={t('pages.orders.kpi.disputes')} value={stats ? stats.disputes.toLocaleString() : '—'} tone="text-red-700" />
        <KPI label={t('pages.orders.kpi.refunds')} value={stats ? stats.refunded.toLocaleString() : '—'} tone="text-cyan-700" />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-2 text-[12px] text-red-700">
          {t('pages.orders.failedToLoadStats')}: {error}
        </div>
      )}

      <OrderTable initialFilter="all" />
    </div>
  );
};

const KPI = ({ label, value, tone }: { label: string; value: string; tone?: string }) => (
  <div className="rounded-lg px-4 py-3">
    <p className="text-[11px] font-semibold text-gray-500 tracking-wide">{label}</p>
    <p className={`text-xl font-bold tabular-nums mt-1 ${tone || 'text-black'}`}>{value}</p>
  </div>
);

export default OrdersPage;
