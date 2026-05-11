import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ChevronDown, Loader2, Check } from 'lucide-react';
import {
  fetchMyOrders,
  updateMyOrderStatus,
  type SellerOrderRow,
  type SellerOrderStatus,
} from '@/services/sellerApi';

// All seller order views in one page. The dropdown switches the active
// filter (formerly: pending, processing, shipping, delivered, cancelled,
// returned) — each one was a separate route + boilerplate file before.
type OrderFilterKey =
  | 'all'
  | 'pending'
  | 'processing'
  | 'shipping'
  | 'delivered'
  | 'cancelled'
  | 'returned';

interface FilterDef {
  key: OrderFilterKey;
  labelKey: string;
  descKey: string;
  match: (o: SellerOrderRow) => boolean;
}

const FILTERS: FilterDef[] = [
  {
    key: 'all',
    labelKey: 'pages.ordersList.filterAll',
    descKey: 'pages.ordersList.filterAllDesc',
    match: () => true,
  },
  {
    key: 'pending',
    labelKey: 'pages.ordersList.filterPending',
    descKey: 'pages.ordersList.filterPendingDesc',
    match: (o) => o.isPaid && o.status === 'processing',
  },
  {
    key: 'processing',
    labelKey: 'pages.ordersList.filterProcessing',
    descKey: 'pages.ordersList.filterProcessingDesc',
    match: (o) => o.isPaid && o.status === 'processing',
  },
  {
    key: 'shipping',
    labelKey: 'pages.ordersList.filterShipping',
    descKey: 'pages.ordersList.filterShippingDesc',
    match: (o) => o.status === 'shipped',
  },
  {
    key: 'delivered',
    labelKey: 'pages.ordersList.filterDelivered',
    descKey: 'pages.ordersList.filterDeliveredDesc',
    match: (o) => o.status === 'delivered',
  },
  {
    key: 'cancelled',
    labelKey: 'pages.ordersList.filterCancelled',
    descKey: 'pages.ordersList.filterCancelledDesc',
    match: (o) => o.status === 'canceled' && !o.isPaid,
  },
  {
    key: 'returned',
    labelKey: 'pages.ordersList.filterReturned',
    descKey: 'pages.ordersList.filterReturnedDesc',
    match: (o) => o.status === 'canceled' && o.isPaid,
  },
];

const statusBadge: Record<string, string> = {
  pending: 'bg-orange-50 text-orange-700',
  processing: 'bg-blue-50 text-blue-700',
  shipped: 'bg-purple-50 text-purple-700',
  delivered: 'bg-green-50 text-green-700',
  canceled: 'bg-red-50 text-red-700',
};

// What status can a seller move this order TO from its current state?
// Backend has the same guards — frontend just hides options the API would
// reject (so the dropdown doesn't surface dead-end choices).
const allowedTransitions = (o: SellerOrderRow): SellerOrderStatus[] => {
  if (o.status === 'delivered' || o.status === 'canceled') return [];
  if (!o.isPaid) return []; // payment must be verified by admin first
  switch (o.status) {
    case 'pending':
    case 'processing':
      return ['shipped', 'canceled'];
    case 'shipped':
      return ['delivered', 'canceled'];
    default:
      return [];
  }
};

const transitionLabelKey: Record<SellerOrderStatus, string> = {
  processing: 'pages.ordersList.transitionProcessing',
  shipped: 'pages.ordersList.transitionShipped',
  delivered: 'pages.ordersList.transitionDelivered',
  canceled: 'pages.ordersList.transitionCancel',
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

const OrdersPage: React.FC = () => {
  const { t } = useTranslation('common');
  const [allOrders, setAllOrders] = useState<SellerOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [activeKey, setActiveKey] = useState<OrderFilterKey>('all');
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchMyOrders()
      .then((res) => {
        if (!cancelled) setAllOrders(res);
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

  // Close the dropdown when clicking outside it.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const active = useMemo(
    () => FILTERS.find((f) => f.key === activeKey) || FILTERS[0],
    [activeKey],
  );

  // Pre-compute counts for each filter so the dropdown can show e.g.
  // "Pending shipment (3)" without scanning the array per render.
  const counts = useMemo(() => {
    const map = {} as Record<OrderFilterKey, number>;
    for (const f of FILTERS) {
      map[f.key] = allOrders.filter(f.match).length;
    }
    return map;
  }, [allOrders]);

  const filtered = useMemo(() => {
    const base = allOrders.filter(active.match);
    if (!q) return base;
    const needle = q.toLowerCase();
    return base.filter((o) => {
      const haystack = [
        o._id,
        typeof o.user === 'object' && o.user ? o.user.name : '',
        typeof o.user === 'object' && o.user ? o.user.email : '',
        o.shippingAddress?.fullName,
        o.paymentMethod,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [allOrders, active, q]);

  return (
    <div className="space-y-4 text-sm">
      <div>
        <h1 className="text-[16px] font-bold text-gray-900">{t('pages.ordersList.title')}</h1>
        <p className="text-[12px] text-gray-500 mt-0.5">{t(active.descKey)}</p>
      </div>

      <div className="rounded-lg px-3 py-2 flex flex-wrap items-center gap-2">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-bold bg-white border border-gray-200 hover:border-gray-300 text-gray-800 min-w-[180px] justify-between transition-colors"
          >
            <span className="inline-flex items-center gap-2">
              {t(active.labelKey)}
              <span className="text-[10px] font-bold text-gray-400 tabular-nums">
                ({counts[active.key]})
              </span>
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </button>
          {open && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-100 rounded-md shadow-lg py-1 z-20 min-w-[220px]">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => {
                    setActiveKey(f.key);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-[11px] font-semibold transition-colors flex items-center justify-between gap-2 ${
                    activeKey === f.key
                      ? 'bg-[#00aeff]/5 text-[#00aeff]'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-black'
                  }`}
                >
                  <span>{t(f.labelKey)}</span>
                  <span className="text-[10px] font-bold text-gray-400 tabular-nums">
                    {counts[f.key]}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="text-[11px] text-gray-500 ml-2">
          {loading
            ? t('status.loading')
            : t('pages.ordersList.orderCount', { count: filtered.length })}
        </span>

        <div className="ml-auto relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="text"
            placeholder={t('pages.ordersList.searchPlaceholder')}
            className="pl-7 pr-3 py-1 rounded text-[11px] w-64 bg-gray-50 border border-gray-100 focus:border-[#00aeff] outline-none"
          />
        </div>
      </div>

      <div className="rounded-lg overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] tabular-nums">
            <thead className="text-[11px] text-gray-500 tracking-wide bg-gray-50/50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">{t('pages.ordersList.tableOrder')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('pages.ordersList.tableCustomer')}</th>
                <th className="px-4 py-2 text-right font-semibold">{t('pages.ordersList.tableItems')}</th>
                <th className="px-4 py-2 text-right font-semibold">{t('pages.ordersList.tableAmount')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('pages.ordersList.tablePayment')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('pages.ordersList.tableCreated')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('pages.ordersList.tableStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                    {t('status.loading')}
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-red-500 text-[12px]">
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && filtered.map((o) => {
                const customer =
                  typeof o.user === 'object' && o.user
                    ? o.user.name || o.user.email || t('common.guest')
                    : o.shippingAddress?.fullName || t('common.guest');
                const itemCount = o.orderItems?.length || 0;
                return (
                  <tr key={o._id} className="border-t border-gray-50">
                    <td className="px-4 py-2 font-mono text-[11px] text-gray-600">
                      {o._id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-4 py-2 font-medium text-gray-900">{customer}</td>
                    <td className="px-4 py-2 text-right text-gray-900">{itemCount}</td>
                    <td className="px-4 py-2 text-right font-semibold text-gray-900">
                      ฿{formatMoney(o.totalPrice)}
                    </td>
                    <td className="px-4 py-2 text-gray-700">{o.paymentMethod || '—'}</td>
                    <td className="px-4 py-2 text-gray-500 text-[11px]">{formatDate(o.createdAt)}</td>
                    <td className="px-4 py-2">
                      <StatusCell
                        order={o}
                        onChanged={(updated) => {
                          // Optimistic refresh — splice the updated order into
                          // the local array so the dropdown closes on the new
                          // state without a full refetch.
                          setAllOrders((prev) =>
                            prev.map((row) =>
                              row._id === updated._id
                                ? { ...row, status: updated.status, isDelivered: updated.isDelivered }
                                : row,
                            ),
                          );
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                    {t('pages.ordersList.noMatch')}
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

// Inline status editor — clicking the badge opens a list of allowed
// transitions. Disabled when the order is in a terminal state (delivered /
// canceled) or unpaid (admin needs to verify the slip first).
interface StatusCellProps {
  order: SellerOrderRow;
  onChanged: (updated: { _id: string; status: SellerOrderStatus; isDelivered: boolean }) => void;
}

const StatusCell: React.FC<StatusCellProps> = ({ order, onChanged }) => {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<SellerOrderStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const transitions = allowedTransitions(order);
  const editable = transitions.length > 0;

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setError(null);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const apply = async (next: SellerOrderStatus) => {
    if (next === 'canceled') {
      const ok = window.confirm(t('pages.ordersList.cancelConfirm'));
      if (!ok) return;
    }
    setBusy(next);
    setError(null);
    try {
      const updated = await updateMyOrderStatus(order._id, next);
      if (!updated) throw new Error(t('pages.ordersList.noResponse'));
      onChanged({
        _id: updated._id,
        status: updated.status,
        isDelivered: updated.isDelivered,
      });
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pages.ordersList.failedUpdate'));
    } finally {
      setBusy(null);
    }
  };

  const badge = (
    <span
      className={`text-[11px] font-medium px-2 py-0.5 rounded capitalize ${
        statusBadge[order.status] || 'bg-gray-100 text-gray-600'
      }`}
    >
      {order.status}
    </span>
  );

  if (!editable) {
    return badge;
  }

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
        title={t('pages.ordersList.changeStatus')}
      >
        {badge}
        <ChevronDown
          className={`w-3 h-3 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-100 rounded-md shadow-lg py-1 z-20 min-w-[160px]">
          {transitions.map((trans) => {
            const isThisBusy = busy === trans;
            const tone =
              trans === 'canceled'
                ? 'text-rose-700 hover:bg-rose-50'
                : 'text-gray-700 hover:bg-gray-50';
            return (
              <button
                key={trans}
                onClick={() => apply(trans)}
                disabled={busy !== null}
                className={`w-full text-left px-3 py-2 text-[11px] font-bold transition-colors flex items-center justify-between disabled:opacity-50 ${tone}`}
              >
                <span>{t(transitionLabelKey[trans])}</span>
                {isThisBusy ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Check className="w-3 h-3 opacity-0" />
                )}
              </button>
            );
          })}
          {error && (
            <p className="px-3 py-2 text-[10px] text-rose-700 bg-rose-50">{error}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
