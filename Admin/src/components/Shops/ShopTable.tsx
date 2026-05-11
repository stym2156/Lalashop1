import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Search, MoreHorizontal, ChevronDown } from 'lucide-react';
import { fetchAdminShops, type AdminShopRow, type ListShopsParams } from '@/services/adminApi';

export type ShopStatus = 'active' | 'closed' | 'pending';

const statusBadge: Record<ShopStatus, string> = {
  active: 'bg-green-50 text-green-700',
  pending: 'bg-orange-50 text-orange-700',
  closed: 'bg-gray-100 text-gray-600',
};

const statusLabelKey: Record<ShopStatus, string> = {
  active: 'status.active',
  pending: 'status.pending',
  closed: 'status.closed',
};

const formatMoney = (n: number): string =>
  Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

const formatDate = (s?: string): string => {
  if (!s) return '—';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '—';
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

interface ShopTableProps {
  initialFilter?: 'all' | ShopStatus;
  hideFilters?: boolean;
}

const ShopTable = ({ initialFilter = 'all', hideFilters = false }: ShopTableProps) => {
  const { t } = useTranslation('common');
  const [filter, setFilter] = useState<'all' | ShopStatus>(initialFilter);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [shops, setShops] = useState<AdminShopRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const params: ListShopsParams = {
      status: filter === 'all' ? undefined : filter,
      search: q || undefined,
      limit: 100,
    };
    fetchAdminShops(params)
      .then((res) => {
        if (cancelled) return;
        setShops(res.data ?? []);
        setTotal(res.meta?.total ?? 0);
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
  }, [filter, q]);

  const tabs: ('all' | ShopStatus)[] = useMemo(
    () => ['all', 'active', 'pending', 'closed'],
    []
  );

  return (
    <>
      <div className="rounded-lg px-3 py-2 flex flex-wrap items-center gap-2">
        {!hideFilters && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen(!open)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-semibold capitalize bg-gray-100 hover:bg-gray-200 text-gray-700 min-w-[100px] justify-between"
            >
              <span>{filter === 'all' ? t('common.all') : t(statusLabelKey[filter as ShopStatus])}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-100 rounded-md shadow-md py-1 z-10 min-w-[120px]">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => { setFilter(tab); setOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 text-[11px] font-semibold capitalize transition-colors ${
                      filter === tab
                        ? 'bg-gray-50 text-black'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-black'
                    }`}
                  >
                    {tab === 'all' ? t('common.all') : t(statusLabelKey[tab as ShopStatus])}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="ml-auto relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="text"
            placeholder={t('pages.shops.searchTablePlaceholder')}
            className="pl-7 pr-3 py-1 rounded text-[11px] w-64 bg-gray-50 border border-gray-100 focus:border-primary outline-none"
          />
        </div>
      </div>

      <div className="rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] tabular-nums">
            <thead className="text-[11px] text-gray-500 tracking-wide">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">{t('table.shopId')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('table.shop')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('table.owner')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('table.category')}</th>
                <th className="px-4 py-2 text-right font-semibold">{t('table.products')}</th>
                <th className="px-4 py-2 text-right font-semibold">{t('table.salesKip')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('table.createdAt')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('table.status')}</th>
                <th className="px-4 py-2 text-right font-semibold">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                    {t('pages.shops.loadingShops')}
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-red-500 text-[12px]">
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && shops.map((s) => {
                const status: ShopStatus =
                  s.seller_type === 'closed'
                    ? 'closed'
                    : !s.seller_type || s.seller_type === ''
                    ? 'pending'
                    : 'active';
                return (
                  <tr key={s._id}>
                    <td className="px-4 py-2 font-mono text-[11px] text-gray-600">{s.customId || s._id.slice(-8).toUpperCase()}</td>
                    <td className="px-4 py-2 font-medium text-gray-900">
                      <Link href={`/shops/${s._id}`} className="hover:text-primary transition-colors">
                        {s.shopName || s.ownerName || s.ownerEmail || '—'}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-gray-700">{s.ownerName || s.ownerEmail || '—'}</td>
                    <td className="px-4 py-2 text-gray-700">{s.shopCategory || '—'}</td>
                    <td className="px-4 py-2 text-right text-gray-900">{s.productsCount}</td>
                    <td className="px-4 py-2 text-right font-semibold text-gray-900">{formatMoney(s.revenue)}</td>
                    <td className="px-4 py-2 text-gray-500 text-[11px]">{formatDate(s.createdAt)}</td>
                    <td className="px-4 py-2">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded capitalize ${statusBadge[status]}`}>
                        {t(statusLabelKey[status])}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link href={`/shops/${s._id}`} className="inline-block text-gray-500 hover:text-black hover:bg-gray-100 rounded p-1">
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {!loading && !error && shops.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                    {t('pages.shops.noMatch')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-2.5 text-[11px] text-gray-500">
          <span>{t('table.showingLabeled', { shown: shops.length, total, label: t('nav.shops').toLowerCase() })}</span>
        </div>
      </div>
    </>
  );
};

export default ShopTable;
