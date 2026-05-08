import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { fetchMyOrders, type SellerOrderRow } from '@/services/sellerApi';

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
  label: string;
  description: string;
  match: (o: SellerOrderRow) => boolean;
}

const FILTERS: FilterDef[] = [
  {
    key: 'all',
    label: 'All',
    description: 'Every order from your shop, regardless of status.',
    match: () => true,
  },
  {
    key: 'pending',
    label: 'Pending shipment',
    description:
      'Approved orders ready to be packed and shipped. Payment has been verified.',
    match: (o) => o.isPaid && o.status === 'processing',
  },
  {
    key: 'processing',
    label: 'Processing',
    description: 'Orders that are paid and ready to be packed and shipped.',
    match: (o) => o.isPaid && o.status === 'processing',
  },
  {
    key: 'shipping',
    label: 'Shipping',
    description: 'Orders currently in transit to the customer.',
    match: (o) => o.status === 'shipped',
  },
  {
    key: 'delivered',
    label: 'Delivered',
    description: 'Successfully delivered orders.',
    match: (o) => o.status === 'delivered',
  },
  {
    key: 'cancelled',
    label: 'Cancelled',
    description: 'Orders that were cancelled before delivery.',
    match: (o) => o.status === 'canceled' && !o.isPaid,
  },
  {
    key: 'returned',
    label: 'Returned / Refunded',
    description:
      'Paid orders that were cancelled (proxy for refund until a dedicated Dispute model is added).',
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
        <h1 className="text-[16px] font-bold text-gray-900">Orders</h1>
        <p className="text-[12px] text-gray-500 mt-0.5">{active.description}</p>
      </div>

      <div className="rounded-lg px-3 py-2 flex flex-wrap items-center gap-2">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-bold bg-white border border-gray-200 hover:border-gray-300 text-gray-800 min-w-[180px] justify-between transition-colors"
          >
            <span className="inline-flex items-center gap-2">
              {active.label}
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
                  <span>{f.label}</span>
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
            ? 'Loading...'
            : `${filtered.length} order${filtered.length === 1 ? '' : 's'}`}
        </span>

        <div className="ml-auto relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="text"
            placeholder="Search order ID, customer..."
            className="pl-7 pr-3 py-1 rounded text-[11px] w-64 bg-gray-50 border border-gray-100 focus:border-[#00aeff] outline-none"
          />
        </div>
      </div>

      <div className="rounded-lg overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] tabular-nums">
            <thead className="text-[11px] text-gray-500 tracking-wide bg-gray-50/50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">Order</th>
                <th className="px-4 py-2 text-left font-semibold">Customer</th>
                <th className="px-4 py-2 text-right font-semibold">Items</th>
                <th className="px-4 py-2 text-right font-semibold">Amount</th>
                <th className="px-4 py-2 text-left font-semibold">Payment</th>
                <th className="px-4 py-2 text-left font-semibold">Created</th>
                <th className="px-4 py-2 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                    Loading...
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
                    ? o.user.name || o.user.email || 'Guest'
                    : o.shippingAddress?.fullName || 'Guest';
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
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded capitalize ${
                          statusBadge[o.status] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                    No orders match this view
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

export default OrdersPage;
