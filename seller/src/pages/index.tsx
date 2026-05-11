import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { Download, Package, ShoppingBag, DollarSign, Wallet } from 'lucide-react';
import { useCurrentSeller } from '@/services/useCurrentSeller';
import {
  fetchMyOrders,
  fetchMyProducts,
  type SellerOrderRow,
  type SellerProductRow,
} from '@/services/sellerApi';

type RangeKey = 'today' | '7d' | '30d' | '90d';

const RANGES: { key: RangeKey; tKey: string; days: number }[] = [
  { key: 'today', tKey: 'ranges.today', days: 1 },
  { key: '7d', tKey: 'ranges.7d', days: 7 },
  { key: '30d', tKey: 'ranges.30d', days: 30 },
  { key: '90d', tKey: 'ranges.90d', days: 90 },
];

const statusStyles: Record<string, string> = {
  delivered: 'bg-green-50 text-green-700',
  pending: 'bg-orange-50 text-orange-700',
  processing: 'bg-blue-50 text-blue-700',
  shipped: 'bg-purple-50 text-purple-700',
  canceled: 'bg-red-50 text-red-700',
};

const formatMoney = (n: number): string =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Dashboard = () => {
  const router = useRouter();
  const { t } = useTranslation('common');
  const { seller } = useCurrentSeller();
  const [range, setRange] = useState<RangeKey>('today');
  const [orders, setOrders] = useState<SellerOrderRow[]>([]);
  const [products, setProducts] = useState<SellerProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchMyOrders().catch(() => []), fetchMyProducts().catch(() => [])])
      .then(([ord, prod]) => {
        if (cancelled) return;
        setOrders(ord);
        setProducts(prod);
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

  const cutoff = useMemo(() => {
    const r = RANGES.find((x) => x.key === range)!;
    const d = new Date();
    d.setDate(d.getDate() - r.days);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [range]);

  const ordersInRange = useMemo(
    () =>
      orders.filter((o) => {
        const d = new Date(o.paidAt || o.createdAt);
        return !Number.isNaN(d.getTime()) && d >= cutoff;
      }),
    [orders, cutoff]
  );

  const totalRevenue = ordersInRange
    .filter((o) => o.isPaid)
    .reduce((sum, o) => sum + (o.totalPrice || 0), 0);

  const itemsSold = ordersInRange
    .filter((o) => o.isPaid)
    .reduce((sum, o) => sum + (o.orderItems?.reduce((s, i) => s + (i.qty || 0), 0) || 0), 0);

  const recentOrders = orders.slice(0, 6);

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center gap-2">
        <h1 className="text-[18px] font-bold text-gray-900">
          {t('pages.dashboard.welcome', { name: seller?.name || t('pages.dashboard.seller') })}
        </h1>
        <span className="text-[11px] text-gray-400">·</span>
        <span className="text-[11px] text-gray-500">
          {seller?.customId ? <span className="font-mono">{seller.customId}</span> : t('pages.dashboard.manageShop')}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 inline-flex items-center hover:bg-gray-100">
          <Download className="w-3.5 h-3.5 mr-1.5" /> {t('actions.exportCsv')}
        </button>
        <div className="ml-auto flex items-center gap-1.5 bg-gray-100 rounded p-0.5">
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

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-2 text-[12px] text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI
          icon={DollarSign}
          label={t('pages.dashboard.revenueInRange')}
          value={loading ? '—' : `${t("common.currencySymbol", "฿")}${formatMoney(totalRevenue)}`}
          tone="text-green-700"
        />
        <KPI
          icon={ShoppingBag}
          label={t('pages.dashboard.ordersInRange')}
          value={loading ? '—' : ordersInRange.length.toLocaleString()}
          tone="text-blue-700"
        />
        <KPI
          icon={Package}
          label={t('pages.dashboard.itemsSold')}
          value={loading ? '—' : itemsSold.toLocaleString()}
          tone="text-purple-700"
        />
        <KPI
          icon={Wallet}
          label={t('pages.dashboard.currentBalance')}
          value={loading ? '—' : `${t("common.currencySymbol", "฿")}${formatMoney(seller?.balance ?? 0)}`}
          tone="text-black"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-lg border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-[13px] font-bold text-gray-900">{t('pages.dashboard.recentOrders')}</h3>
            <button
              onClick={() => router.push('/dashboard/orders')}
              className="text-[11px] text-[#00aeff] font-bold hover:underline"
            >
              {t('actions.viewAll')} →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] tabular-nums">
              <thead className="text-[11px] text-gray-500 tracking-wide bg-gray-50/50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">{t('pages.dashboard.tableOrder')}</th>
                  <th className="px-4 py-2 text-left font-semibold">{t('pages.dashboard.tableCustomer')}</th>
                  <th className="px-4 py-2 text-right font-semibold">{t('pages.dashboard.tableItems')}</th>
                  <th className="px-4 py-2 text-right font-semibold">{t('pages.dashboard.tableAmount')}</th>
                  <th className="px-4 py-2 text-left font-semibold">{t('pages.dashboard.tableStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                      {t('status.loading')}
                    </td>
                  </tr>
                )}
                {!loading && recentOrders.map((o) => {
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
                        {t("common.currencySymbol", "฿")}{formatMoney(o.totalPrice)}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded capitalize ${statusStyles[o.status] || 'bg-gray-100 text-gray-600'}`}>
                          {t(`status.${o.status}`, o.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {!loading && recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                      {t('pages.dashboard.noOrdersYet')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-[13px] font-bold text-gray-900">{t('pages.dashboard.topProducts')}</h3>
            <button
              onClick={() => router.push('/products/list')}
              className="text-[11px] text-[#00aeff] font-bold hover:underline"
            >
              {t('actions.viewAll')} →
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {loading && (
              <div className="px-4 py-12 text-center text-gray-400 text-[12px]">{t('status.loading')}</div>
            )}
            {!loading && products.length === 0 && (
              <div className="px-4 py-12 text-center text-gray-400 text-[12px]">
                {t('pages.dashboard.noProductsYet')}
              </div>
            )}
            {!loading &&
              [...products]
                .sort((a, b) => (b.soldCount ?? 0) - (a.soldCount ?? 0))
                .slice(0, 5)
                .map((p) => {
                  const cover = Array.isArray(p.images) && p.images.length
                    ? p.images[0]
                    : Array.isArray(p.image)
                    ? p.image[0]
                    : p.image;
                  return (
                    <div
                      key={p._id}
                      className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded bg-gray-100 flex-shrink-0 overflow-hidden">
                        {cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cover as string} alt={p.name} className="w-full h-full object-cover" />
                        ) : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-gray-900 truncate">{p.name}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {t('pages.dashboard.soldStockSummary', { sold: (p.soldCount ?? 0).toLocaleString(), stock: p.countInStock })}
                        </p>
                      </div>
                      <div className="text-[12px] font-bold text-gray-900">
                        {t("common.currencySymbol", "฿")}{formatMoney(p.price)}
                      </div>
                    </div>
                  );
                })}
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

export default Dashboard;
