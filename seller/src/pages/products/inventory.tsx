import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, AlertTriangle, Package } from 'lucide-react';
import { fetchMyProducts, type SellerProductRow } from '@/services/sellerApi';

const formatMoney = (n: number): string =>
  Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

const InventoryPage = () => {
  const { t } = useTranslation('common');
  const [items, setItems] = useState<SellerProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchMyProducts()
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

  const stats = useMemo(() => {
    const total = items.length;
    const out = items.filter((p) => p.countInStock === 0).length;
    const low = items.filter((p) => p.countInStock > 0 && p.countInStock < 10).length;
    const value = items.reduce((s, p) => s + p.price * p.countInStock, 0);
    return { total, out, low, value };
  }, [items]);

  const filtered = items.filter((p) => {
    if (filter === 'low' && !(p.countInStock > 0 && p.countInStock < 10)) return false;
    if (filter === 'out' && p.countInStock !== 0) return false;
    if (!q) return true;
    return p.name.toLowerCase().includes(q.toLowerCase()) ||
      (p.description?.toLowerCase().includes(q.toLowerCase()) ?? false);
  });

  return (
    <div className="space-y-4 text-sm">
      <h1 className="text-[16px] font-bold text-gray-900">{t('pages.inventory.title')}</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label={t('pages.inventory.totalSkus')} value={stats.total.toLocaleString()} tone="text-black" />
        <KPI label={t('pages.inventory.outOfStock')} value={stats.out.toLocaleString()} tone="text-red-700" />
        <KPI label={t('pages.inventory.lowStock')} value={stats.low.toLocaleString()} tone="text-amber-700" />
        <KPI label={t('pages.inventory.inventoryValue')} value={`฿${formatMoney(stats.value)}`} tone="text-green-700" />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded text-[11px] font-bold ${filter === 'all' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          {t('pages.inventory.filterAll')} ({stats.total})
        </button>
        <button
          onClick={() => setFilter('low')}
          className={`px-3 py-1 rounded text-[11px] font-bold ${filter === 'low' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          {t('pages.inventory.filterLow')} ({stats.low})
        </button>
        <button
          onClick={() => setFilter('out')}
          className={`px-3 py-1 rounded text-[11px] font-bold ${filter === 'out' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          {t('pages.inventory.filterOut')} ({stats.out})
        </button>

        <div className="ml-auto relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="text"
            placeholder={t('pages.inventory.searchPlaceholder')}
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
                <th className="px-4 py-2 text-left font-semibold">{t('pages.inventory.tableProduct')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('pages.inventory.tableCategory')}</th>
                <th className="px-4 py-2 text-right font-semibold">{t('pages.inventory.tablePrice')}</th>
                <th className="px-4 py-2 text-right font-semibold">{t('pages.inventory.tableStock')}</th>
                <th className="px-4 py-2 text-right font-semibold">{t('pages.inventory.tableSold')}</th>
                <th className="px-4 py-2 text-right font-semibold">{t('pages.inventory.tableValue')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-[12px]">{t('status.loading')}</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                    <Package className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                    {t('pages.inventory.noProducts')}
                  </td>
                </tr>
              )}
              {!loading && filtered.map((p) => {
                const isOut = p.countInStock === 0;
                const isLow = !isOut && p.countInStock < 10;
                const value = p.price * p.countInStock;
                return (
                  <tr key={p._id} className="border-t border-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-900">
                      <p className="line-clamp-1 max-w-xs">{p.name}</p>
                    </td>
                    <td className="px-4 py-2 text-gray-700">{p.category}</td>
                    <td className="px-4 py-2 text-right text-gray-900">฿{formatMoney(p.price)}</td>
                    <td className={`px-4 py-2 text-right font-semibold ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-900'}`}>
                      <span className="inline-flex items-center gap-1 justify-end">
                        {(isOut || isLow) && <AlertTriangle className="w-3 h-3" />}
                        {p.countInStock}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right text-gray-700">{(p.soldCount ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-2 text-right text-gray-900 font-semibold">฿{formatMoney(value)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const KPI = ({ label, value, tone }: { label: string; value: string; tone: string }) => (
  <div className="rounded-lg border border-gray-100 px-4 py-3">
    <p className="text-[11px] font-semibold text-gray-500 tracking-wide">{label}</p>
    <p className={`text-[20px] font-bold tabular-nums mt-1 ${tone}`}>{value}</p>
  </div>
);

export default InventoryPage;
