import React, { useEffect, useState } from 'react';
import { Banknote } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchHistoryDepositSources } from '@/services/adminApi';

interface SourceRow {
  _id: string;
  count: number;
  total: number;
}

const formatMoney = (n: number): string =>
  Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

const colors = [
  'bg-blue-500',
  'bg-green-500',
  'bg-amber-500',
  'bg-cyan-500',
  'bg-purple-500',
  'bg-rose-500',
  'bg-teal-500',
];

const DepositSourcesTab = () => {
  const { t } = useTranslation('common');
  const [items, setItems] = useState<SourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchHistoryDepositSources()
      .then((res) => {
        if (cancelled) return;
        setItems((res.data ?? []) as SourceRow[]);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const grandTotal = items.reduce((s, i) => s + i.total, 0);

  if (loading) return <div className="px-4 py-12 text-center text-gray-400 text-[12px]">{t('pages.history.history.depositSources.loading')}</div>;
  if (error) return <div className="px-4 py-12 text-center text-red-500 text-[12px]">{error}</div>;
  if (items.length === 0) return <div className="px-4 py-12 text-center text-gray-400 text-[12px]">{t('pages.history.history.depositSources.noSources')}</div>;

  return (
    <div className="space-y-4">
      <div className="px-4 py-3 bg-gray-50/50">
        <p className="text-[11px] text-gray-500 mb-2">{t('pages.history.history.depositSources.breakdownLabel')}</p>
        <div className="flex h-2 rounded overflow-hidden">
          {items.map((b, i) => {
            const pct = grandTotal > 0 ? (b.total / grandTotal) * 100 : 0;
            return (
              <div
                key={b._id || `src-${i}`}
                className={colors[i % colors.length]}
                style={{ width: `${pct}%` }}
                title={`${b._id}: ${pct.toFixed(1)}%`}
              />
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto px-4">
        <table className="w-full text-[12px] tabular-nums">
          <thead className="text-[11px] text-gray-500 tracking-wide">
            <tr>
              <th className="px-4 py-2 text-left font-semibold">{t('pages.history.history.depositSources.thPaymentMethod')}</th>
              <th className="px-4 py-2 text-right font-semibold">{t('pages.history.history.depositSources.thOrders')}</th>
              <th className="px-4 py-2 text-right font-semibold">{t('pages.history.history.depositSources.thTotalKip')}</th>
              <th className="px-4 py-2 text-right font-semibold">{t('pages.history.history.depositSources.thPctOfTotal')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s, i) => {
              const pct = grandTotal > 0 ? (s.total / grandTotal) * 100 : 0;
              return (
                <tr key={s._id || `src-${i}`} className="border-t border-gray-50">
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${colors[i % colors.length]}`} />
                      <Banknote className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-gray-700">{s._id || t('pages.history.history.depositSources.unknown')}</span>
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right text-gray-700">{s.count}</td>
                  <td className="px-4 py-2 text-right font-semibold text-gray-900">{formatMoney(s.total)}</td>
                  <td className="px-4 py-2 text-right text-gray-500">{pct.toFixed(1)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DepositSourcesTab;
