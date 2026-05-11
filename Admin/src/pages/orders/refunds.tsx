import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Search, Eye } from 'lucide-react';
import { fetchAdminOrders, type AdminOrderRow } from '@/services/adminApi';

const formatCurrency = (n: number): string =>
  Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

const formatDate = (s?: string): string => {
  if (!s) return '—';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '—';
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const RefundsPage = () => {
  const { t } = useTranslation('common');
  const [refunds, setRefunds] = useState<AdminOrderRow[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchAdminOrders({ status: 'refunded', search: q || undefined, limit: 100 })
      .then((res) => {
        if (cancelled) return;
        setRefunds(res.data ?? []);
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
  }, [q]);

  return (
    <div className="space-y-4 text-sm">
      <div className="rounded-lg px-3 py-2 flex flex-wrap items-center gap-2">
        <h2 className="text-[13px] font-semibold text-gray-900">{t('pages.orders.refunds.title')}</h2>
        <div className="ml-auto relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="text"
            placeholder={t('pages.orders.searchPlaceholder')}
            className="pl-7 pr-3 py-1 rounded text-[11px] w-64 bg-gray-50 border border-gray-100 focus:border-primary outline-none"
          />
        </div>
      </div>

      <div className="rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] tabular-nums">
            <thead className="text-[11px] text-gray-500 tracking-wide">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">{t('table.order')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('pages.orders.details.customer')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('table.shop')}</th>
                <th className="px-4 py-2 text-right font-semibold">{t('table.amountKip')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('table.payment')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('status.refunded')}</th>
                <th className="px-4 py-2 text-right font-semibold">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                    {t('pages.orders.loadingOrders')}
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-red-500 text-[12px]">{error}</td>
                </tr>
              )}
              {!loading && !error && refunds.map((r) => (
                <tr key={r._id}>
                  <td className="px-4 py-2 font-mono text-[11px] text-gray-600">
                    <Link href={`/orders/${r._id}`} className="hover:text-primary transition-colors">
                      {r._id.slice(-8).toUpperCase()}
                    </Link>
                  </td>
                  <td className="px-4 py-2 font-medium text-gray-900">
                    {r.customerId ? (
                      <Link href={`/users/${r.customerId}`} className="hover:text-primary transition-colors">
                        {r.customer}
                      </Link>
                    ) : r.customer}
                  </td>
                  <td className="px-4 py-2 text-gray-700">
                    {r.shopId ? (
                      <Link href={`/shops/${r.shopId}`} className="hover:text-primary transition-colors">
                        {r.shop}
                      </Link>
                    ) : r.shop}
                  </td>
                  <td className="px-4 py-2 text-right font-semibold text-gray-900">{formatCurrency(r.amount)}</td>
                  <td className="px-4 py-2 text-gray-700">{r.paymentMethod}</td>
                  <td className="px-4 py-2 text-gray-500 text-[11px]">{formatDate(r.updatedAt)}</td>
                  <td className="px-4 py-2 text-right">
                    <Link href={`/orders/${r._id}`} title={t('actions.view')} className="inline-block text-gray-500 hover:text-black hover:bg-gray-100 rounded p-1">
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
              {!loading && !error && refunds.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                    {t('pages.orders.refunds.noMatch')}
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

export default RefundsPage;
