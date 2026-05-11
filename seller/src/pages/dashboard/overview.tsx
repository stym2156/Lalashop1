import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Package, ShoppingCart, DollarSign } from 'lucide-react';
import { fetchMyOrders, fetchMyProducts, type SellerOrderRow, type SellerProductRow } from '@/services/sellerApi';

type RangeKey = '7d' | '30d' | '90d';

const RANGES: { key: RangeKey; tKey: string; days: number }[] = [
  { key: '7d', tKey: 'ranges.days7', days: 7 },
  { key: '30d', tKey: 'ranges.days30', days: 30 },
  { key: '90d', tKey: 'ranges.days90', days: 90 },
];

const formatMoney = (n: number): string =>
  Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

const Overview = () => {
  const { t } = useTranslation('common');
  const [range, setRange] = useState<RangeKey>('30d');
  const [orders, setOrders] = useState<SellerOrderRow[]>([]);
  const [products, setProducts] = useState<SellerProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchMyOrders().catch(() => []), fetchMyProducts().catch(() => [])])
      .then(([ord, prod]) => {
        if (!cancelled) {
          setOrders(ord);
          setProducts(prod);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const cutoff = useMemo(() => {
    const r = RANGES.find((x) => x.key === range)!;
    const d = new Date();
    d.setDate(d.getDate() - r.days);
    return d;
  }, [range]);

  const ordersInRange = useMemo(
    () => orders.filter((o) => new Date(o.paidAt || o.createdAt) >= cutoff),
    [orders, cutoff]
  );

  const revenue = ordersInRange.filter((o) => o.isPaid).reduce((s, o) => s + o.totalPrice, 0);
  const totalOrders = ordersInRange.length;
  const pending = ordersInRange.filter((o) => o.status === 'pending' || o.status === 'processing').length;
  const lowStock = products.filter((p) => p.countInStock < 10 && p.status === 'Active').length;

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between">
        <h1 className="text-[16px] font-bold text-gray-900">{t('pages.overview.title')}</h1>
        <div className="flex items-center gap-1.5 bg-gray-100 rounded p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`px-3 py-1 rounded text-[11px] font-bold transition-all ${
                range === r.key ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'
              }`}
            >
              {t(r.tKey)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI icon={DollarSign} label={t('pages.overview.revenue')} value={loading ? '—' : `฿${formatMoney(revenue)}`} tone="text-green-700" />
        <KPI icon={ShoppingCart} label={t('pages.overview.orders')} value={loading ? '—' : totalOrders.toLocaleString()} tone="text-blue-700" />
        <KPI icon={ShoppingCart} label={t('pages.overview.pendingFulfillment')} value={loading ? '—' : pending.toLocaleString()} tone="text-orange-700" />
        <KPI icon={AlertTriangle} label={t('pages.overview.lowStockItems')} value={loading ? '—' : lowStock.toLocaleString()} tone="text-red-700" />
      </div>

      <div className="rounded-lg border border-gray-100 px-5 py-4">
        <h3 className="text-[12px] font-bold text-gray-700 mb-2">{t('pages.overview.allTimeTotals')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[12px]">
          <div>
            <p className="text-gray-500">{t('pages.overview.products')}</p>
            <p className="text-[18px] font-bold text-gray-900 tabular-nums mt-0.5">{products.length}</p>
          </div>
          <div>
            <p className="text-gray-500">{t('pages.overview.activeProducts')}</p>
            <p className="text-[18px] font-bold text-gray-900 tabular-nums mt-0.5">
              {products.filter((p) => p.status === 'Active').length}
            </p>
          </div>
          <div>
            <p className="text-gray-500">{t('pages.overview.totalOrders')}</p>
            <p className="text-[18px] font-bold text-gray-900 tabular-nums mt-0.5">{orders.length}</p>
          </div>
          <div>
            <p className="text-gray-500">{t('pages.overview.totalRevenue')}</p>
            <p className="text-[18px] font-bold text-green-700 tabular-nums mt-0.5">
              ฿{formatMoney(orders.filter((o) => o.isPaid).reduce((s, o) => s + o.totalPrice, 0))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface KPIProps {
  icon: typeof DollarSign;
  label: string;
  value: string;
  tone: string;
}

const KPI: React.FC<KPIProps> = ({ icon: Icon, label, value, tone }) => (
  <div className="rounded-lg border border-gray-100 px-4 py-3">
    <div className="flex items-center gap-1.5">
      <Icon className="w-3 h-3 text-gray-400" />
      <p className="text-[11px] font-semibold text-gray-500 tracking-wide">{label}</p>
    </div>
    <p className={`text-[20px] font-bold tabular-nums mt-1 ${tone}`}>{value}</p>
  </div>
);

export default Overview;
