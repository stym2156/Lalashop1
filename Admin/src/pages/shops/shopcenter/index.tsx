import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  Download,
  Plus,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Check,
} from 'lucide-react';
import { fetchUsers, type AdminUser } from '@/services/adminApi';

type ShopFilter = 'all' | 'verified' | 'pending';

type ColumnId =
  | 'shopId'
  | 'shop'
  | 'owner'
  | 'email'
  | 'phone'
  | 'balance'
  | 'type'
  | 'twofa'
  | 'joined'
  | 'status'
  | 'bank';

interface ColumnDef {
  id: ColumnId;
  labelKey: string;
  align: 'left' | 'right';
  defaultVisible: boolean;
}

const COLUMNS: ColumnDef[] = [
  { id: 'shopId', labelKey: 'table.shopId', align: 'left', defaultVisible: true },
  { id: 'shop', labelKey: 'table.shop', align: 'left', defaultVisible: true },
  { id: 'owner', labelKey: 'table.owner', align: 'left', defaultVisible: true },
  { id: 'email', labelKey: 'table.email', align: 'left', defaultVisible: true },
  { id: 'phone', labelKey: 'table.phone', align: 'left', defaultVisible: true },
  { id: 'balance', labelKey: 'table.balance', align: 'right', defaultVisible: true },
  { id: 'type', labelKey: 'table.type', align: 'left', defaultVisible: false },
  { id: 'twofa', labelKey: 'table.twofa', align: 'left', defaultVisible: false },
  { id: 'joined', labelKey: 'table.joined', align: 'left', defaultVisible: true },
  { id: 'status', labelKey: 'table.status', align: 'left', defaultVisible: true },
  { id: 'bank', labelKey: 'table.bank', align: 'left', defaultVisible: false },
];

const COLUMN_PREF_KEY = 'admin.shopcenter.columns.v1';

const filterTabs: ShopFilter[] = ['all', 'verified', 'pending'];
const pageSizeOptions: number[] = [100, 150, 300];

const formatNumber = (value: number): string => new Intl.NumberFormat('en-US').format(value);

const formatDate = (iso?: string): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB');
};

const useDebounce = (value: string, delay: number): string => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const isVerifiedSeller = (u: AdminUser): boolean =>
  Boolean(u.seller_type && u.seller_type.trim() !== '');

const computeShopStatus = (u: AdminUser): { labelKey: string; cls: string } => {
  if (isVerifiedSeller(u)) {
    return { labelKey: 'status.verified', cls: ' text-emerald-700' };
  }
  return { labelKey: 'status.pending', cls: 'text-orange-700' };
};

const loadColumnPrefs = (): Record<ColumnId, boolean> => {
  const defaults = COLUMNS.reduce<Record<ColumnId, boolean>>((acc, c) => {
    acc[c.id] = c.defaultVisible;
    return acc;
  }, {} as Record<ColumnId, boolean>);
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = window.localStorage.getItem(COLUMN_PREF_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<Record<ColumnId, boolean>>;
    return COLUMNS.reduce<Record<ColumnId, boolean>>((acc, c) => {
      acc[c.id] = typeof parsed[c.id] === 'boolean' ? Boolean(parsed[c.id]) : c.defaultVisible;
      return acc;
    }, {} as Record<ColumnId, boolean>);
  } catch {
    return defaults;
  }
};

const ShopCenter = () => {
  const { t } = useTranslation('common');
  const [filter, setFilter] = useState<ShopFilter>('all');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [pageSize, setPageSize] = useState<number>(100);
  const [page, setPage] = useState<number>(1);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  const pageSizeRef = useRef<HTMLDivElement>(null);

  const [columns, setColumns] = useState<Record<ColumnId, boolean>>(() =>
    COLUMNS.reduce<Record<ColumnId, boolean>>((acc, c) => {
      acc[c.id] = c.defaultVisible;
      return acc;
    }, {} as Record<ColumnId, boolean>),
  );
  const [columnsOpen, setColumnsOpen] = useState(false);
  const columnsRef = useRef<HTMLDivElement>(null);

  const [shops, setShops] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [balanceTotal, setBalanceTotal] = useState(0);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [allShopsCount, setAllShopsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debouncedQ = useDebounce(q, 350);

  useEffect(() => {
    setColumns(loadColumnPrefs());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(COLUMN_PREF_KEY, JSON.stringify(columns));
    } catch {
      // localStorage not available — silently ignore.
    }
  }, [columns]);

  const visibleColumns = useMemo(
    () => COLUMNS.filter((c) => columns[c.id]),
    [columns],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchUsers({
        search: debouncedQ || undefined,
        role: 'seller',
        limit: pageSize,
        page,
      });
      const data = res.data ?? [];
      setShops(data);
      setTotal(res.meta?.total ?? data.length);
      setPages(res.meta?.pages ?? 1);
      setBalanceTotal(res.meta?.balanceTotal ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pages.shops.loadingShops'));
      setShops([]);
      setTotal(0);
      setPages(1);
      setBalanceTotal(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, pageSize, page]);

  const loadKpis = useCallback(async () => {
    try {
      const all = await fetchUsers({ role: 'seller', limit: 1, page: 1 });
      setAllShopsCount(all.meta?.total ?? 0);
    } catch {
      setAllShopsCount(0);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadKpis();
  }, [loadKpis]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, filter, pageSize]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
      if (pageSizeRef.current && !pageSizeRef.current.contains(e.target as Node)) {
        setPageSizeOpen(false);
      }
      if (columnsRef.current && !columnsRef.current.contains(e.target as Node)) {
        setColumnsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredShops = useMemo(() => {
    if (filter === 'all') return shops;
    return shops.filter((s) =>
      filter === 'verified' ? isVerifiedSeller(s) : !isVerifiedSeller(s),
    );
  }, [shops, filter]);

  useEffect(() => {
    const verified = shops.reduce((acc, s) => acc + (isVerifiedSeller(s) ? 1 : 0), 0);
    setVerifiedCount(verified);
    setPendingCount(shops.length - verified);
  }, [shops]);

  const startIndex = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, total);
  const canPrev = page > 1;
  const canNext = page < pages;

  const toggleColumn = (id: ColumnId) => {
    setColumns((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const resetColumns = () => {
    setColumns(
      COLUMNS.reduce<Record<ColumnId, boolean>>((acc, c) => {
        acc[c.id] = c.defaultVisible;
        return acc;
      }, {} as Record<ColumnId, boolean>),
    );
  };

  const colCount = visibleColumns.length || 1;
  const balanceColIndex = visibleColumns.findIndex((c) => c.id === 'balance');
  

  const renderCell = (u: AdminUser, col: ColumnDef) => {
    switch (col.id) {
      case 'shopId':
        return (
          <td key={col.id} className="px-4 py-2 font-mono text-[11px] text-gray-500">
            {u.customId || u._id.slice(-6)}
          </td>
        );
      case 'shop':
        return (
          <td key={col.id} className="px-4 py-2 font-medium text-gray-900">
            <Link href={`/shops/${u._id}`} className="hover:text-primary transition-colors flex items-center gap-2">
              <span>{u.shopName || u.name || u.username || '—'}</span>
            </Link>
          </td>
        );
      case 'owner':
        return (
          <td key={col.id} className="px-4 py-2 font-medium text-gray-900">
            <Link href={`/users/${u._id}`} className="hover:text-primary transition-colors">
              {u.name || u.username || '—'}
            </Link>
          </td>
        );
      case 'email':
        return (
          <td key={col.id} className="px-4 py-2 text-gray-700">
            {u.email}
          </td>
        );
      case 'phone':
        return (
          <td key={col.id} className="px-4 py-2 text-gray-700">
            {u.phone || '—'}
          </td>
        );
      case 'balance':
        return (
          <td key={col.id} className="px-4 py-2 text-right font-semibold text-gray-900">
            {formatNumber(u.balance ?? 0)}
          </td>
        );
      case 'type':
        return (
          <td key={col.id} className="px-4 py-2 text-gray-600 text-[11px]">
            {u.seller_type || '—'}
          </td>
        );
      case 'twofa':
        return (
          <td key={col.id} className="px-4 py-2">
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded ${u.twoFactorEnabled
                  ? 'bg-green-50 text-green-700'
                  : 'bg-gray-100 text-gray-600'
                }`}
            >
              {u.twoFactorEnabled ? t('status.on') : t('status.off')}
            </span>
          </td>
        );
      case 'joined':
        return (
          <td key={col.id} className="px-4 py-2 text-gray-500 text-[11px]">
            {formatDate(u.createdAt)}
          </td>
        );
      case 'status': {
        const s = computeShopStatus(u);
        return (
          <td key={col.id} className="px-4 py-2">
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded capitalize ${s.cls}`}>
              {t(s.labelKey)}
            </span>
          </td>
        );
      }
      case 'bank':
        return (
          <td key={col.id} className="px-4 py-2 text-gray-700 text-[11px]">
            {u.bank ? (
              <div className="flex flex-col leading-tight">
                <span className="font-medium text-gray-800">{u.bank.bankName}</span>
                <span className="text-gray-500 font-mono text-[10px]">{u.bank.accountNumber}</span>
              </div>
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </td>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center gap-2">
        <button className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 inline-flex items-center hover:bg-gray-100">
          <Download className="w-3.5 h-3.5 mr-1.5" /> {t('actions.export')}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI
          label={t('pages.shops.kpi.allShops')}
          value={loading && allShopsCount === 0 ? '—' : formatNumber(allShopsCount)}
        />
        <KPI label={t('pages.shops.kpi.verified')} value={formatNumber(verifiedCount)} tone="text-emerald-700" />
        <KPI label={t('pages.shops.kpi.pending')} value={formatNumber(pendingCount)} tone="text-orange-700" />
        <KPI
          label={t('pages.shops.kpi.totalBalance')}
          value={formatNumber(balanceTotal)}
          tone="text-blue-700"
        />
      </div>

      <div className="rounded-lg px-3 py-2 flex flex-wrap items-center gap-2">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-semibold capitalize bg-gray-100 hover:bg-gray-200 text-gray-700 min-w-[100px] justify-between"
          >
            <span>{t(`pages.shops.${filter}`)}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          {open && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-100 rounded-md shadow-md py-1 z-10 min-w-[120px]">
              {filterTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setFilter(tab);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-[11px] font-semibold capitalize transition-colors ${filter === tab
                      ? 'bg-gray-50 text-black'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-black'
                    }`}
                >
                  {t(`pages.shops.${tab}`)}
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="text-[11px] text-gray-500">
          {loading ? t('status.loadingShort') : t('pages.shops.shopsCount', { count: total })}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              type="text"
              placeholder={t('pages.shops.searchPlaceholder')}
              className="pl-7 pr-3 py-1 rounded text-[11px] w-64 bg-gray-50 border border-gray-100 focus:border-primary outline-none"
            />
          </div>

          <div className="relative" ref={columnsRef}>
            <button
              onClick={() => setColumnsOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700"
              title={t('table.columnsTitle')}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{t('table.columns')}</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform ${columnsOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {columnsOpen && (
              <div className="absolute top-full right-0 mt-1 bg-white border border-gray-100 rounded-md shadow-lg py-1 z-20 min-w-[200px]">
                <div className="px-3 py-2 flex items-center justify-between border-b border-gray-100">
                  <span className="text-[11px] font-semibold text-gray-700">
                    {t('table.showColumns')}
                  </span>
                  <button
                    onClick={resetColumns}
                    className="text-[10px] font-medium text-blue-600 hover:underline"
                  >
                    {t('actions.reset')}
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto py-1">
                  {COLUMNS.map((c) => {
                    const checked = columns[c.id];
                    return (
                      <button
                        key={c.id}
                        onClick={() => toggleColumn(c.id)}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-700 hover:bg-gray-50"
                      >
                        <span
                          className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-colors ${checked
                              ? 'bg-black border-black text-white'
                              : 'border-gray-300 bg-white'
                            }`}
                        >
                          {checked && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
                        </span>
                        <span className="font-medium">{t(c.labelKey)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg px-4 py-2.5 bg-red-50 text-red-700 text-[12px]">
          {error}
        </div>
      )}

      <div className="rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] tabular-nums">
            <thead className="text-[11px] text-gray-500 tracking-wide">
              <tr>
                {visibleColumns.map((c) => (
                  <th
                    key={c.id}
                    className={`px-4 py-2 font-semibold ${c.align === 'right' ? 'text-right' : 'text-left'
                      }`}
                  >
                    {t(c.labelKey)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && filteredShops.length === 0 ? (
                <tr>
                  <td
                    colSpan={colCount}
                    className="px-4 py-8 text-center text-gray-400 text-[11px]"
                  >
                    {t('pages.shops.loadingShops')}
                  </td>
                </tr>
              ) : filteredShops.length === 0 ? (
                <tr>
                  <td
                    colSpan={colCount}
                    className="px-4 py-8 text-center text-gray-400 text-[11px]"
                  >
                    {t('pages.shops.noMatch')}
                  </td>
                </tr>
              ) : (
                filteredShops.map((u) => (
                  <tr key={u._id}>
                    {visibleColumns.map((c) => renderCell(u, c))}
                  </tr>
                ))
              )}
            </tbody>
            {filteredShops.length > 0 && balanceColIndex >= 0 && (
              <tfoot className="text-[11px] text-gray-700 border-t border-gray-100">
                <tr>
                  {balanceColIndex > 0 && (
                    <td
                      className="px-4 py-3 font-semibold text-gray-500"
                      colSpan={balanceColIndex}
                    >
                      {t('pages.shops.totalBalance', { count: total })}
                    </td>
                  )}
                  <td className="px-4 py-3 text-right font-bold text-blue-600 text-[13px]">
                    {formatNumber(balanceTotal)}
                  </td>
                  {visibleColumns.length - balanceColIndex - 1 > 0 && (
                    <td colSpan={visibleColumns.length - balanceColIndex - 1} />
                  )}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-3 pt-2 text-[11px] text-gray-600">
        <div>
          {total === 0
            ? t('table.noResultsShort')
            : t('table.showingResults', { from: formatNumber(startIndex), to: formatNumber(endIndex), total: formatNumber(total) })}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => canPrev && setPage((p) => Math.max(1, p - 1))}
              disabled={!canPrev}
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3 h-3" /> {t('actions.prev')}
            </button>
            <span className="text-gray-500">
              {t('table.pageOf', { page: formatNumber(page), total: formatNumber(Math.max(pages, 1)) })}
            </span>
            <button
              onClick={() => canNext && setPage((p) => p + 1)}
              disabled={!canNext}
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t('actions.next')} <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="relative" ref={pageSizeRef}>
            <button
              onClick={() => setPageSizeOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 min-w-[110px] justify-between"
            >
              <span>{t('table.perPage', { count: pageSize })}</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform ${pageSizeOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {pageSizeOpen && (
              <div className="absolute bottom-full right-0 mb-1 bg-white border border-gray-100 rounded-md shadow-md py-1 z-10 min-w-[110px]">
                {pageSizeOptions.map((size) => (
                  <button
                    key={size}
                    onClick={() => {
                      setPageSize(size);
                      setPageSizeOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 font-semibold transition-colors ${pageSize === size
                        ? 'bg-gray-50 text-black'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-black'
                      }`}
                  >
                    {t('table.perPage', { count: size })}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const KPI = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) => (
  <div className="rounded-lg px-4 py-3 bg-white border border-gray-100">
    <p className="text-[11px] font-semibold text-gray-500 tracking-wide">{label}</p>
    <p className={`text-xl font-bold tabular-nums mt-1 ${tone || 'text-black'}`}>{value}</p>
  </div>
);

export default ShopCenter;
