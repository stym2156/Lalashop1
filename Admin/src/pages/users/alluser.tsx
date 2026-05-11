import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Check,
  Download,
} from 'lucide-react';
import { fetchUsers, type AdminUser } from '@/services/adminApi';

type RoleFilter = 'all' | 'seller' | 'buyer' | 'admin';

type ColumnId =
  | 'id'
  | 'name'
  | 'email'
  | 'balance'
  | 'phone'
  | 'twofa'
  | 'joined'
  | 'status'
  | 'bank'
  | 'username'
  | 'ip';

interface ColumnDef {
  id: ColumnId;
  labelKey: string;
  align: 'left' | 'right';
  defaultVisible: boolean;
}

const COLUMNS: ColumnDef[] = [
  { id: 'id', labelKey: 'table.id', align: 'left', defaultVisible: true },
  { id: 'name', labelKey: 'table.name', align: 'left', defaultVisible: true },
  { id: 'email', labelKey: 'table.email', align: 'left', defaultVisible: true },
  { id: 'balance', labelKey: 'table.balance', align: 'right', defaultVisible: true },
  { id: 'phone', labelKey: 'table.phone', align: 'left', defaultVisible: true },
  { id: 'twofa', labelKey: 'table.twofa', align: 'left', defaultVisible: true },
  { id: 'joined', labelKey: 'table.joined', align: 'left', defaultVisible: true },
  { id: 'status', labelKey: 'table.status', align: 'left', defaultVisible: true },
  { id: 'bank', labelKey: 'table.bank', align: 'left', defaultVisible: false },
  { id: 'username', labelKey: 'table.username', align: 'left', defaultVisible: false },
  { id: 'ip', labelKey: 'table.ip', align: 'left', defaultVisible: false },
];

const COLUMN_PREF_KEY = 'admin.alluser.columns.v2';

const roleTabs: RoleFilter[] = ['all', 'seller', 'buyer', 'admin'];
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

const computeStatus = (u: AdminUser): { labelKey: string; cls: string } => {
  const updated = new Date(u.updatedAt);
  const ageDays = (Date.now() - updated.getTime()) / (1000 * 60 * 60 * 24);
  if (Number.isFinite(ageDays) && ageDays > 90) {
    return { labelKey: 'status.inactive', cls: ' text-gray-600' };
  }
  if (u.twoFactorEnabled) {
    return { labelKey: 'status.verified', cls: ' text-emerald-700' };
  }
  return { labelKey: 'status.active', cls: ' text-green-700' };
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

const AllUsers = () => {
  const { t } = useTranslation('common');
  const [filter, setFilter] = useState<RoleFilter>('all');
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

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [balanceTotal, setBalanceTotal] = useState(0);
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
      // localStorage not available or quota exceeded — silently ignore.
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
        role: filter === 'all' ? undefined : filter,
        limit: pageSize,
        page,
      });
      setUsers(res.data ?? []);
      setTotal(res.meta?.total ?? res.data?.length ?? 0);
      setPages(res.meta?.pages ?? 1);
      setBalanceTotal(res.meta?.balanceTotal ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pages.users.loadingUsers'));
      setUsers([]);
      setTotal(0);
      setPages(1);
      setBalanceTotal(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, filter, pageSize, page]);

  useEffect(() => {
    load();
  }, [load]);

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

  const cellValue = (u: AdminUser, id: ColumnId): string => {
    switch (id) {
      case 'id':
        return u.customId || u._id.slice(-6);
      case 'name':
        return u.name || u.username || '';
      case 'email':
        return u.email || '';
      case 'balance':
        return String(u.balance ?? 0);
      case 'phone':
        return u.phone || '';
      case 'twofa':
        return u.twoFactorEnabled ? t('status.on') : t('status.off');
      case 'joined':
        return formatDate(u.createdAt);
      case 'status':
        return t(computeStatus(u).labelKey);
      case 'bank':
        return u.bank ? `${u.bank.bankName} ${u.bank.accountNumber}` : '';
      case 'username':
        return u.username ? `@${u.username}` : '';
      case 'ip':
        return u.lastKnownIp || '';
      default:
        return '';
    }
  };

  const escapeCsv = (raw: string): string => {
    if (raw.includes('"') || raw.includes(',') || raw.includes('\n')) {
      return `"${raw.replace(/"/g, '""')}"`;
    }
    return raw;
  };

  const handleExport = () => {
    if (users.length === 0) return;
    const header = visibleColumns.map((c) => escapeCsv(t(c.labelKey))).join(',');
    const rows = users.map((u) =>
      visibleColumns.map((c) => escapeCsv(cellValue(u, c.id))).join(','),
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const colCount = visibleColumns.length || 1;
  const balanceColIndex = visibleColumns.findIndex((c) => c.id === 'balance');

  const renderCell = (u: AdminUser, col: ColumnDef) => {
    switch (col.id) {
      case 'id':
        return (
          <td key={col.id} className="px-4 py-2 font-mono text-[11px] text-gray-500">
            {u.customId || u._id.slice(-6)}
          </td>
        );
      case 'name':
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
      case 'balance':
        return (
          <td key={col.id} className="px-4 py-2 text-right font-semibold text-gray-900">
            {formatNumber(u.balance ?? 0)}
          </td>
        );
      case 'phone':
        return (
          <td key={col.id} className="px-4 py-2 text-gray-700">
            {u.phone || '—'}
          </td>
        );
      case 'twofa':
        return (
          <td key={col.id} className="px-4 py-2">
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                u.twoFactorEnabled
                  ? ' text-green-700'
                  : ' text-gray-600'
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
        const s = computeStatus(u);
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
                <span className="text-gray-500 font-mono text-[10px]">
                  {u.bank.accountNumber}
                </span>
              </div>
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </td>
        );
      case 'username':
        return (
          <td key={col.id} className="px-4 py-2 text-gray-600 text-[11px]">
            {u.username ? `@${u.username}` : '—'}
          </td>
        );
      case 'ip':
        return (
          <td key={col.id} className="px-4 py-2 font-mono text-[11px] text-gray-600">
            {u.lastKnownIp || '—'}
          </td>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 text-sm">
      <div className="rounded-lg px-3 py-2 flex flex-wrap items-center gap-2">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-semibold capitalize bg-gray-100 hover:bg-gray-200 text-gray-700 min-w-[100px] justify-between"
          >
            <span>{t(`pages.users.filters.${filter}`)}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          {open && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-100 rounded-md shadow-md py-1 z-10 min-w-[120px]">
              {roleTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setFilter(tab);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-[11px] font-semibold capitalize transition-colors ${
                    filter === tab
                      ? 'bg-gray-50 text-black'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-black'
                  }`}
                >
                  {t(`pages.users.filters.${tab}`)}
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="inline-flex items-center text-[11px] font-medium text-gray-700 px-2 py-1 rounded">
          <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-400" /> {t('table.dateRange')}
        </button>

        <span className="text-[11px] text-gray-500">
          {loading ? t('status.loadingShort') : t('pages.users.usersCount', { count: total })}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              type="text"
              placeholder={t('pages.users.searchPlaceholder')}
              className="pl-7 pr-3 py-1 rounded text-[11px] w-64 bg-gray-50 border border-gray-100 focus:border-primary outline-none"
            />
          </div>

          <button
            onClick={handleExport}
            disabled={users.length === 0}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
            title={t('pages.users.exportTitle')}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('actions.export')}</span>
          </button>

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
                          className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-colors ${
                            checked
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
                    className={`px-4 py-2 font-semibold ${
                      c.align === 'right' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {t(c.labelKey)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 ? (
                <tr>
                  <td
                    colSpan={colCount}
                    className="px-4 py-8 text-center text-gray-400 text-[11px]"
                  >
                    {t('pages.users.loadingUsers')}
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={colCount}
                    className="px-4 py-8 text-center text-gray-400 text-[11px]"
                  >
                    {t('pages.users.noMatch')}
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id}>
                    {visibleColumns.map((c) => renderCell(u, c))}
                  </tr>
                ))
              )}
            </tbody>
            {users.length > 0 && balanceColIndex >= 0 && (
              <tfoot className="text-[11px] text-gray-700 border-t border-gray-100">
                <tr>
                  {balanceColIndex > 0 && (
                    <td
                      className="px-4 py-3 font-semibold text-gray-500"
                      colSpan={balanceColIndex}
                    >
                      {t('pages.users.totalBalance', { count: total })}
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
                    className={`w-full text-left px-3 py-1.5 font-semibold transition-colors ${
                      pageSize === size
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

export default AllUsers;
