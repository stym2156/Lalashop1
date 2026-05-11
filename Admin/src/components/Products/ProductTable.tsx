import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Search, MoreHorizontal, Package, ChevronDown } from 'lucide-react';
import {
  fetchAdminProducts,
  type AdminProductRow,
  type ListProductsParams,
} from '@/services/adminApi';

export type ProductStatus =
  | 'live'
  | 'pending_review'
  | 'violation'
  | 'banned'
  | 'draft'
  | 'featured';

const statusBadge: Record<ProductStatus, string> = {
  live: 'bg-green-50 text-green-700',
  featured: 'bg-purple-50 text-purple-700',
  pending_review: 'bg-orange-50 text-orange-700',
  violation: 'bg-amber-50 text-amber-700',
  banned: 'bg-red-50 text-red-700',
  draft: 'bg-gray-100 text-gray-600',
};

const statusLabelKey: Record<ProductStatus, string> = {
  live: 'status.active',
  featured: 'pages.products.featured',
  pending_review: 'pages.products.pending',
  violation: 'pages.products.violations',
  banned: 'pages.products.banned',
  draft: 'status.draft',
};

const formatCurrency = (n: number): string =>
  Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

const filterToQuery = (f: 'all' | ProductStatus): ListProductsParams => {
  switch (f) {
    case 'live':
      return { status: 'active' };
    case 'featured':
      return { flag: 'featured' };
    case 'pending_review':
      return { status: 'pending' };
    case 'violation':
      return { flag: 'violations' };
    case 'banned':
      return { flag: 'banned' };
    case 'draft':
      return { status: 'archived' };
    default:
      return {};
  }
};

const productImage = (p: AdminProductRow): string => {
  if (Array.isArray(p.images) && p.images.length > 0) return p.images[0];
  if (typeof p.image === 'string' && p.image) return p.image;
  if (Array.isArray(p.image) && p.image.length > 0) return p.image[0];
  return '';
};

const productUiStatus = (p: AdminProductRow): ProductStatus => {
  const tags = p.tags || [];
  if (tags.includes('banned')) return 'banned';
  if (tags.includes('violation') || tags.includes('reported')) return 'violation';
  if (tags.includes('featured')) return 'featured';
  if (p.status === 'Draft') return 'pending_review';
  if (p.status === 'Archived') return 'draft';
  return 'live';
};

interface ProductTableProps {
  initialFilter?: 'all' | ProductStatus;
  hideFilters?: boolean;
  showReportColumn?: boolean;
}

const ProductTable = ({
  initialFilter = 'all',
  hideFilters = false,
  showReportColumn = false,
}: ProductTableProps) => {
  const { t } = useTranslation('common');
  const [filter, setFilter] = useState<'all' | ProductStatus>(initialFilter);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<AdminProductRow[]>([]);
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
    fetchAdminProducts({
      ...filterToQuery(filter),
      search: q || undefined,
      limit: 100,
    })
      .then((res) => {
        if (cancelled) return;
        setProducts(res.data ?? []);
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

  const tabs: ('all' | ProductStatus)[] = useMemo(
    () => ['all', 'live', 'featured', 'pending_review', 'violation', 'banned'],
    []
  );

  return (
    <>
      <div className="rounded-lg px-3 py-2 flex flex-wrap items-center gap-2">
        {!hideFilters && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen(!open)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 min-w-[100px] justify-between"
            >
              <span>{filter === 'all' ? t('common.all') : t(statusLabelKey[filter as ProductStatus])}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-100 rounded-md shadow-md py-1 z-10 min-w-[120px]">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => { setFilter(tab); setOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                      filter === tab
                        ? 'bg-gray-50 text-black'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-black'
                    }`}
                  >
                    {tab === 'all' ? t('common.all') : t(statusLabelKey[tab as ProductStatus])}
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
            placeholder={t('pages.products.searchPlaceholder')}
            className="pl-7 pr-3 py-1 rounded text-[11px] w-64 bg-gray-50 border border-gray-100 focus:border-primary outline-none"
          />
        </div>
      </div>

      <div className="rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] tabular-nums">
            <thead className="text-[11px] text-gray-500 tracking-wide">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">{t('pages.products.table.product')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('pages.products.table.shop')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('pages.products.table.category')}</th>
                <th className="px-4 py-2 text-right font-semibold">{t('pages.products.table.price')} ({t('common.currencySymbol', '฿')})</th>
                <th className="px-4 py-2 text-right font-semibold">{t('pages.products.table.stock')}</th>
                <th className="px-4 py-2 text-right font-semibold">{t('table.sales')}</th>
                {showReportColumn && (
                  <th className="px-4 py-2 text-right font-semibold">{t('actions.review')}</th>
                )}
                <th className="px-4 py-2 text-left font-semibold">{t('table.status')}</th>
                <th className="px-4 py-2 text-right font-semibold">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={showReportColumn ? 9 : 8} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                    {t('pages.products.loadingProducts')}
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={showReportColumn ? 9 : 8} className="px-4 py-12 text-center text-red-500 text-[12px]">
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && products.map((p) => {
                const uiStatus = productUiStatus(p);
                const img = productImage(p);
                return (
                  <tr key={p._id}>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={img} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/products/${p._id}`} className="font-medium text-gray-900 hover:text-primary transition-colors block truncate">
                            {p.name}
                          </Link>
                          <p className="font-mono text-[11px] text-gray-500">{p._id.slice(-8).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      {p.seller?._id ? (
                        <Link href={`/shops/${p.seller._id}`} className="text-gray-700 hover:text-primary transition-colors">
                          {p.seller.name || p.seller.email || '—'}
                        </Link>
                      ) : (
                        <span className="text-gray-700">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-700">{p.category}</td>
                    <td className="px-4 py-2 text-right font-semibold text-gray-900">{t('common.currencySymbol', '฿')}{formatCurrency(p.price)}</td>
                    <td className="px-4 py-2 text-right text-gray-900">{p.countInStock}</td>
                    <td className="px-4 py-2 text-right text-gray-900">{p.soldCount ?? 0}</td>
                    {showReportColumn && (
                      <td className="px-4 py-2 text-right">
                        {p.numReviews && p.numReviews > 0 ? (
                          <span className="text-gray-900 font-bold">{p.numReviews}</span>
                        ) : (
                          <span className="text-gray-300">0</span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-2">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${statusBadge[uiStatus]}`}>
                        {t(statusLabelKey[uiStatus])}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link href={`/products/${p._id}`} className="inline-block text-gray-500 hover:text-black hover:bg-gray-100 rounded p-1">
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {!loading && !error && products.length === 0 && (
                <tr>
                  <td colSpan={showReportColumn ? 9 : 8} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                    {t('pages.products.noMatch')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-2.5 text-[11px] text-gray-500">
          <span>{t('table.showingLabeled', { shown: products.length, total, label: t('nav.products').toLowerCase() })}</span>
          <div className="flex items-center gap-1">
            <button className="px-2.5 py-1 rounded text-[11px] font-medium text-gray-400 cursor-not-allowed">{t('actions.prev')}</button>
            <button className="px-2.5 py-1 rounded text-[11px] font-medium text-gray-700">{t('actions.next')}</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductTable;
