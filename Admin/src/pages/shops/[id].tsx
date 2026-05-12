import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  fetchUserById,
  fetchShopKycByUserId,
  fetchAdminProducts,
  fetchAdminOrders,
  fetchAdminReports,
  type AdminUserDetail,
  type AdminKycSubmission,
  type AdminProductRow,
  type AdminOrderRow,
  type AdminReportRow,
} from '@/services/adminApi';

type Tab = 'overview' | 'products' | 'orders' | 'violations' | 'analytics';

const ShopDetailPage = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { id } = router.query;

  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [kyc, setKyc] = useState<AdminKycSubmission | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: t('pages.shops.details.overview') },
    { id: 'products', label: t('pages.shops.details.products') },
    { id: 'orders', label: t('pages.shops.details.orders') },
    { id: 'violations', label: t('pages.shops.details.violations') },
    { id: 'analytics', label: t('pages.shops.details.analytics') },
  ];

  useEffect(() => {
    if (typeof id !== 'string' || !id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([fetchUserById(id), fetchShopKycByUserId(id)])
      .then(([userRes, kycData]) => {
        if (cancelled) return;
        if (userRes.data) {
          setUser(userRes.data);
        } else {
          setError(userRes.message || t('pages.shops.details.notFound'));
        }
        setKyc(kycData);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : t('pages.shops.details.loadingError'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, t]);

  const status = useMemo(() => {
    if (!user) return null;
    if (kyc?.status === 'approved' || (user.seller_type && user.seller_type.trim() !== '')) {
      return { key: 'active', label: t('status.active'), cls: ' text-emerald-700' };
    }
    if (kyc?.status === 'rejected') {
      return { key: 'rejected', label: t('status.rejected'), cls: 'bg-red-50 text-red-700' };
    }
    if (kyc?.status === 'pending') {
      return { key: 'pending', label: t('status.pending'), cls: 'bg-orange-50 text-orange-700' };
    }
    return { key: 'closed', label: t('pages.shops.details.unverified'), cls: 'bg-gray-100 text-gray-600' };
  }, [user, kyc, t]);

  if (loading) {
    return (
      <div className="text-[12px] text-gray-400 py-12 text-center">{t('common.loading')}…</div>
    );
  }

  if (error || !user) {
    return (
      <div className="text-[12px] text-red-600 py-12 text-center">
        {error || t('pages.shops.details.notFound')}
      </div>
    );
  }

  const shopName = kyc?.shopInfo?.shopName || user.name || user.username || '—';
  const ownerName =
    `${kyc?.identity?.firstName ?? ''} ${kyc?.identity?.middleName ?? ''} ${kyc?.identity?.lastName ?? ''}`
      .replace(/\s+/g, ' ')
      .trim() ||
    user.name ||
    '—';
  const category = kyc?.shopInfo?.shopCategory || user.seller_type || '';
  const businessType = kyc?.businessType || '—';
  const followers = user.followers?.length ?? 0;
  const following = user.following?.length ?? 0;
  const stats = user.stats;
  const finance = user.finance;
  const lifetimeIncome = finance
    ? finance.income.sellerWebSales.total +
      finance.income.creatorEarnings.settledTotal +
      finance.income.posRevenue
    : 0;
  const pendingWithdrawalsCount = stats?.pendingWithdrawals ?? 0;

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-black">{shopName}</h1>
            {status && (
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded ${status.cls}`}
              >
                {status.label}
              </span>
            )}
          </div>
          <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
            <span className="font-mono">
              {user.customId || user._id.slice(-6)}
            </span>
            {category && <span>· {category}</span>}
            <span>· {formatNumber(followers)} {t('pages.shops.details.followers')}</span>
            <span>· {formatNumber(following)} {t('pages.shops.details.following')}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200">
            {t('pages.shops.details.message')}
          </button>
          <button className="px-3 py-1.5 rounded-md text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100">
            {t('pages.shops.details.suspend')}
          </button>
          <button className="px-3 py-1.5 rounded-md text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100">
            {t('pages.shops.details.closeShop')}
          </button>
        </div>
      </div>

      <div className="flex border-b border-gray-100 text-[12px]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 -mb-px font-medium transition-colors ${
              tab === t.id
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-black border-b-2 border-transparent'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 space-y-4">
            <Section title="">
              <Row label={t('common.fullName')} value={ownerName} />
              <Row label={t('common.shopEmail')} value={kyc?.shopInfo?.shopEmail || '—'} />
              <Row label={t('common.phone')} value={user.phone || '—'} />
              <Row label={t('common.created')} value={formatDate(user.createdAt)} />
              <Row label={t('common.verified')} value={formatDate(kyc?.reviewedAt)} />
              <Row label={t('common.lastIp')} value={user.lastKnownIp || '—'} />
              <Row label={t('common.shopCategory')} value={kyc?.shopInfo?.shopCategory || '—'} />
              <Row label={t('common.businessType')} value={businessType} />
              <Row label={t('common.sellerType')} value={user.seller_type || '—'} />
              <Row label={t('common.entityName')} value={kyc?.shopInfo?.entityName || '—'} />
              <Row label={t('common.tinNumber')} value={kyc?.identity?.tinNumber || '—'} />
            </Section>

            <Section title={t('common.kycIdentity')}>
              <Row label={t('common.idType')} value={kyc?.identity?.idType || '—'} />
              <Row label={t('common.idNumber')} value={kyc?.identity?.idNumber || '—'} />
              <Row label={t('common.birthDate')} value={formatDate(kyc?.identity?.birthDate)} />
              <Row label={t('common.idExpiry')} value={formatDate(kyc?.identity?.expiryDate)} />
              <Row label={t('common.address')} value={buildAddress(kyc, t)} />
              {kyc?.warehouse?.fullAddress && (
                <Row label={t('common.warehouse')} value={kyc.warehouse.fullAddress} />
              )}
            </Section>

            <Section title={t('common.kycDocuments')}>
              <KycDocLinks kyc={kyc} t={t} />
            </Section>

            {user.bank ? (
              <Section title={t('common.bank')}>
                <Row label={t('common.bankName')} value={user.bank.bankName} />
                <Row label={t('common.accountName')} value={user.bank.accountName} />
                <Row label={t('common.accountNumber')} value={user.bank.accountNumber} />
                <Row
                  label={t('common.verified')}
                  value={user.bank.isVerified ? t('common.yes') : t('common.no')}
                />
              </Section>
            ) : (
              <Section title={t('common.bank')}>
                <p className="text-[12px] text-gray-400">
                  {t('common.notLinked')}
                </p>
              </Section>
            )}
          </div>

          <div className="lg:col-span-2 space-y-4">
            <Section title={t('pages.shops.details.lifetimeTotals')}>
              <div className="grid grid-cols-3 gap-3">
                <MetricCard
                  label={t('pages.shops.details.metrics.totalProducts')}
                  value={formatNumber(stats?.productCount ?? 0)}
                />
                <MetricCard
                  label={t('pages.shops.details.metrics.totalOrders')}
                  value={formatNumber(finance?.sellerActivity.ordersReceived ?? 0)}
                />
                <MetricCard
                  label={t('pages.shops.details.metrics.grossRevenue')}
                  value={formatCurrency(finance?.sellerActivity.grossRevenue ?? 0, t)}
                />
              </div>
            </Section>

            <Section title={t('pages.shops.details.balancePayout')}>
              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  label={t('pages.shops.details.metrics.currentBalance')}
                  value={formatCurrency(user.balance ?? 0, t)}
                />
                <MetricCard
                  label={t('pages.shops.details.metrics.pendingWithdrawals')}
                  value={formatNumber(pendingWithdrawalsCount)}
                />
                <MetricCard
                  label={t('pages.shops.details.metrics.posRevenue')}
                  value={formatCurrency(user.posRevenue ?? 0, t)}
                />
                <MetricCard
                  label={t('pages.shops.details.metrics.lifetimeIncome')}
                  value={formatCurrency(lifetimeIncome, t)}
                />
              </div>
            </Section>

            {finance && (
              <Section title={t('pages.users.details.moneySource')}>
                <div className="grid grid-cols-3 gap-3">
                  <MetricCard
                    label={t('financial.webSales')}
                    value={formatCurrency(finance.income.sellerWebSales.total, t)}
                  />
                  <MetricCard
                    label={t('financial.creatorCommission')}
                    value={formatCurrency(finance.income.creatorEarnings.settledTotal, t)}
                  />
                  <MetricCard
                    label={t('financial.posRevenue')}
                    value={formatCurrency(finance.income.posRevenue, t)}
                  />
                </div>
                <div className="mt-3 space-y-2 text-[12px]">
                  <Row
                    label={t('financial.webSalesOrders')}
                    value={`${formatNumber(finance.income.sellerWebSales.orders)} ${t('common.orders')} · ${formatNumber(finance.income.sellerWebSales.itemsSold)} ${t('common.itemsSold')}`}
                  />
                  <Row
                    label={t('financial.creatorEarningsSettled')}
                    value={`${finance.income.creatorEarnings.byStatus.settled?.count ?? 0} ${t('status.settled')} · ${finance.income.creatorEarnings.byStatus.pending?.count ?? 0} ${t('status.pending')}`}
                  />
                  <Row
                    label={t('financial.refundsIssued')}
                    value={`${formatCurrency(finance.outgoing.refundsIssued.total, t)} (${finance.outgoing.refundsIssued.count} ${t('common.refunds')})`}
                  />
                </div>
              </Section>
            )}

            {finance && (
              <Section title={t('pages.users.details.withdrawalHistory')}>
                <div className="grid grid-cols-3 gap-3">
                  <MetricCard
                    label={t('financial.totalRequests')}
                    value={formatNumber(finance.withdrawals.totalCount)}
                  />
                  <MetricCard
                    label={t('financial.totalAmount')}
                    value={formatCurrency(finance.withdrawals.totalAmount, t)}
                  />
                  <MetricCard
                    label={t('financial.netToBank')}
                    value={formatCurrency(finance.withdrawals.totalNet, t)}
                  />
                </div>
                <div className="mt-3 space-y-2 text-[12px]">
                  {Object.entries(finance.withdrawals.byStatus).map(([statusKey, row]) => (
                    <Row
                      key={statusKey}
                      label={t(`status.${statusKey}`)}
                      value={`${formatCurrency(row.totalAmount, t)} · ${row.count} ${t('common.requests')}`}
                    />
                  ))}
                  {Object.keys(finance.withdrawals.byStatus).length === 0 && (
                    <p className="text-[12px] text-gray-400">{t('common.noHistory')}</p>
                  )}
                  {finance.withdrawals.last && (
                    <Row
                      label={t('financial.lastWithdrawal')}
                      value={`${formatCurrency(finance.withdrawals.last.amount, t)} (${t('common.net')} ${formatCurrency(finance.withdrawals.last.netAmount, t)} · ${t('common.fee')} ${formatCurrency(finance.withdrawals.last.fee, t)}) · ${t(`status.${finance.withdrawals.last.status}`)} · ${formatDateTime(finance.withdrawals.last.createdAt)}`}
                    />
                  )}
                </div>
              </Section>
            )}

            {finance && (
              <Section title={t('pages.users.details.orderActivity')}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] font-semibold text-gray-500 tracking-wide mb-2">
                      {t('financial.asSeller')} ({t('common.thisShop')})
                    </p>
                    <div className="space-y-2 text-[12px]">
                      <Row
                        label={t('financial.ordersReceived')}
                        value={formatNumber(finance.sellerActivity.ordersReceived)}
                      />
                      <Row
                        label={t('financial.itemsSold')}
                        value={formatNumber(finance.sellerActivity.itemsSold)}
                      />
                      <Row
                        label={t('financial.grossRevenue')}
                        value={formatCurrency(finance.sellerActivity.grossRevenue, t)}
                      />
                      <Row
                        label={t('financial.avgOrder')}
                        value={
                          finance.sellerActivity.ordersReceived > 0
                            ? formatCurrency(finance.sellerActivity.grossRevenue / finance.sellerActivity.ordersReceived, t)
                            : '—'
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-gray-500 tracking-wide mb-2">
                      {t('financial.asBuyer')} ({t('common.ownerAccount')})
                    </p>
                    <div className="space-y-2 text-[12px]">
                      <Row
                        label={t('financial.paidOrders')}
                        value={formatNumber(finance.buyerActivity.paidCount)}
                      />
                      <Row
                        label={t('financial.unpaidPending')}
                        value={formatNumber(finance.buyerActivity.unpaidCount)}
                      />
                      <Row
                        label={t('financial.totalSpent')}
                        value={formatCurrency(finance.buyerActivity.paidTotal, t)}
                      />
                      <Row
                        label={t('financial.lastPaidOrder')}
                        value={
                          finance.buyerActivity.lastPaidAt
                            ? `${formatCurrency(finance.buyerActivity.lastPaidAmount, t)} · ${formatDate(finance.buyerActivity.lastPaidAt)}`
                            : '—'
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-[11px]">
                  <Link
                    href={`/orders?seller=${user._id}`}
                    className="text-emerald-700 font-bold hover:underline"
                  >
                    {t('pages.shops.details.viewOrders')} →
                  </Link>
                  <Link
                    href={`/orders?user=${user._id}`}
                    className="text-primary font-bold hover:underline"
                  >
                    {t('pages.users.details.viewBuyerOrders')} →
                  </Link>
                  <Link
                    href={`/products?seller=${user._id}`}
                    className="text-gray-700 font-bold hover:underline"
                  >
                    {t('pages.shops.details.viewProducts')} →
                  </Link>
                </div>
              </Section>
            )}

            {stats?.lastOrderAt && (
              <Section title={t('pages.shops.details.lastOrder')}>
                <Row
                  label={t('common.amount')}
                  value={formatCurrency(stats.lastOrderTotal, t)}
                />
                <Row
                  label={t('common.status')}
                  value={stats.lastOrderStatus || '—'}
                />
                <Row
                  label={t('common.when')}
                  value={formatDateTime(stats.lastOrderAt)}
                />
              </Section>
            )}

            {user.bio && (
              <Section title={t('pages.shops.details.shopBio')}>
                <p className="text-[12px] text-gray-700 whitespace-pre-wrap">
                  {user.bio}
                </p>
              </Section>
            )}

            <Section title={t('common.timestamps')}>
              <Row label={t('common.created')} value={formatDateTime(user.createdAt)} />
              <Row label={t('common.updated')} value={formatDateTime(user.updatedAt)} />
              {kyc && (
                <>
                  <Row
                    label={t('common.kycSubmitted')}
                    value={formatDateTime(kyc.submittedAt)}
                  />
                  <Row
                    label={t('common.kycReviewed')}
                    value={formatDateTime(kyc.reviewedAt)}
                  />
                  {kyc.reviewedBy && (
                    <Row
                      label={t('common.reviewedBy')}
                      value={kyc.reviewedBy.name || kyc.reviewedBy.email || '—'}
                    />
                  )}
                  {kyc.reviewNote && (
                    <Row label={t('common.reviewNote')} value={kyc.reviewNote} />
                  )}
                </>
              )}
            </Section>
          </div>
        </div>
      )}

      {tab === 'products' && <ProductsTab sellerId={user._id} t={t} />}
      {tab === 'orders' && <OrdersTab sellerId={user._id} t={t} />}
      {tab === 'violations' && <ViolationsTab sellerId={user._id} t={t} />}
      {tab === 'analytics' && <AnalyticsTab user={user} t={t} />}
    </div>
  );
};

const formatNumber = (value: number): string =>
  new Intl.NumberFormat('en-US').format(value);

const formatCurrency = (value: number, t: (k: string) => string): string =>
  `${t('common.currencySymbol')}${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)}`;

const formatDate = (iso?: string): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB');
};

const formatDateTime = (iso?: string): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB');
};

const buildAddress = (kyc: AdminKycSubmission | null, t: (k: string) => string): string => {
  if (!kyc) return '—';
  const a = kyc.identity?.address;
  if (!a) return kyc.warehouse?.fullAddress || '—';
  const parts = [a.street, a.apartment, a.city, a.state, a.zip, a.country]
    .filter((p) => Boolean(p && String(p).trim()))
    .join(', ');
  return parts || kyc.warehouse?.fullAddress || '—';
};

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section = ({ title, children }: SectionProps) => (
  <div className="rounded-lg p-5 bg-white border border-gray-100">
    {title && (
      <h3 className="text-[11px] font-semibold text-gray-500 tracking-wide mb-4 uppercase">
        {title}
      </h3>
    )}
    <div className="space-y-3 text-[12px]">{children}</div>
  </div>
);

interface RowProps {
  label: string;
  value: string;
  link?: string;
  mono?: boolean;
}

const Row = ({ label, value, link, mono }: RowProps) => (
  <div>
    <p className="text-[11px] font-semibold text-gray-500 tracking-wide uppercase">
      {label}
    </p>
    {link ? (
      <Link
        href={link}
        className="block mt-0.5 text-gray-900 hover:text-primary transition-colors"
      >
        {value}
      </Link>
    ) : (
      <p className={`mt-0.5 text-gray-900 break-words ${mono ? 'font-mono' : ''}`}>{value}</p>
    )}
  </div>
);

interface MetricCardProps {
  label: string;
  value: string;
}

const MetricCard = ({ label, value }: MetricCardProps) => (
  <div className="rounded-lg px-4 py-3 bg-gray-50">
    <p className="text-[11px] font-semibold text-gray-500 tracking-wide uppercase">
      {label}
    </p>
    <p className="text-xl font-bold text-black tabular-nums mt-1">{value}</p>
  </div>
);

interface KycDocLinksProps {
  kyc: AdminKycSubmission | null;
  t: (k: string) => string;
}

const KycDocLinks = ({ kyc, t }: KycDocLinksProps) => {
  if (!kyc) {
    return <p className="text-[12px] text-gray-400">{t('common.noKyc')}</p>;
  }
  const docs: { label: string; url?: string }[] = [];
  if (kyc.identity?.idDocumentUrl) {
    docs.push({
      label: `${kyc.identity.idType || 'ID'} ${t('common.document')}`,
      url: kyc.identity.idDocumentUrl,
    });
  }
  if (kyc.identity?.businessLicenseUrl) {
    docs.push({
      label: t('common.businessLicense'),
      url: kyc.identity.businessLicenseUrl,
    });
  }
  (kyc.identity?.documents || []).forEach((d) => {
    docs.push({ label: d.label || t('common.supportingDocument'), url: d.url });
  });

  if (docs.length === 0) {
    return <p className="text-[12px] text-gray-400">{t('common.noDocuments')}</p>;
  }

  return (
    <div className="space-y-2">
      {docs.map((d, i) => (
        <a
          key={`${d.label}-${i}`}
          href={d.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-[12px] text-primary hover:underline break-all"
        >
          {d.label} →
        </a>
      ))}
    </div>
  );
};

// ─── Tabs ────────────────────────────────────────────────────────────

interface ProductsTabProps {
  sellerId: string;
  t: (k: string) => string;
}

const ProductsTab = ({ sellerId, t }: ProductsTabProps) => {
  const [products, setProducts] = useState<AdminProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAdminProducts({ seller: sellerId, limit: 200 })
      .then((res) => {
        if (cancelled) return;
        setProducts(res.data ?? []);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : t('common.loadingError'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sellerId, t]);

  const totals = useMemo(() => {
    const inStock = products.reduce((s, p) => s + (p.countInStock || 0), 0);
    const active = products.filter((p) => p.status === 'Active').length;
    const draft = products.filter((p) => p.status === 'Draft').length;
    const archived = products.filter((p) => p.status === 'Archived').length;
    return { inStock, active, draft, archived };
  }, [products]);

  if (loading) {
    return <div className="text-[12px] text-gray-400 py-12 text-center">{t('common.loading')}…</div>;
  }
  if (error) {
    return <div className="text-[12px] text-red-600 py-6 text-center">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricCard label={t('common.totalProducts')} value={formatNumber(products.length)} />
        <MetricCard label={t('status.active')} value={formatNumber(totals.active)} />
        <MetricCard label={t('status.draft')} value={formatNumber(totals.draft)} />
        <MetricCard label={t('status.archived')} value={formatNumber(totals.archived)} />
        <MetricCard label={t('common.inStockUnits')} value={formatNumber(totals.inStock)} />
      </div>

      <Section title="">
        {products.length === 0 ? (
          <p className="text-[12px] text-gray-400 text-center py-8">{t('common.noProducts')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-[12px]">
              <thead>
                <tr className="text-left text-[11px] font-semibold text-gray-500 tracking-wide uppercase">
                  <th className="py-2 pr-3">{t('common.product')}</th>
                  <th className="py-2 pr-3">{t('common.category')}</th>
                  <th className="py-2 pr-3 text-right">{t('common.price')}</th>
                  <th className="py-2 pr-3 text-right">{t('common.stock')}</th>
                  <th className="py-2 pr-3 text-right">{t('common.sold')}</th>
                  <th className="py-2 pr-3">{t('common.status')}</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const cover = Array.isArray(p.image) ? p.image[0] : p.image;
                  return (
                    <tr key={p._id} className="border-t border-gray-50">
                      <td className="py-2 pr-3">
                        <Link
                          href={`/products/${p._id}`}
                          className="flex items-center gap-2 hover:text-primary"
                        >
                          {cover ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={cover}
                              alt={p.name}
                              className="w-9 h-9 rounded object-cover bg-gray-100 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded bg-gray-100 flex-shrink-0" />
                          )}
                          <span className="font-medium line-clamp-1">{p.name}</span>
                        </Link>
                      </td>
                      <td className="py-2 pr-3 text-gray-600">{p.category || '—'}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {formatCurrency(p.price, t)}
                      </td>
                      <td
                        className={`py-2 pr-3 text-right tabular-nums ${
                          p.countInStock <= 0 ? 'text-rose-600 font-bold' : ''
                        }`}
                      >
                        {formatNumber(p.countInStock)}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums text-gray-600">
                        {formatNumber(p.soldCount ?? 0)}
                      </td>
                      <td className="py-2 pr-3">
                        <span
                          className={`text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded uppercase ${
                            p.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700'
                              : p.status === 'Draft'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
};

interface OrdersTabProps {
  sellerId: string;
  t: (k: string) => string;
}

const OrdersTab = ({ sellerId, t }: OrdersTabProps) => {
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAdminOrders({ seller: sellerId, limit: 200 })
      .then((res) => {
        if (cancelled) return;
        setOrders(res.data ?? []);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : t('common.loadingError'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sellerId, t]);

  if (loading) {
    return <div className="text-[12px] text-gray-400 py-12 text-center">{t('common.loading')}…</div>;
  }
  if (error) {
    return <div className="text-[12px] text-red-600 py-6 text-center">{error}</div>;
  }

  return (
    <Section title={t('pages.shops.details.orders')}>
       <div className="overflow-x-auto">
          <table className="min-w-full text-[12px]">
            <thead>
              <tr className="text-left text-[11px] font-semibold text-gray-500 tracking-wide uppercase">
                <th className="py-2 pr-3">{t('common.orderId')}</th>
                <th className="py-2 pr-3">{t('common.buyer')}</th>
                <th className="py-2 pr-3 text-right">{t('common.amount')}</th>
                <th className="py-2 pr-3">{t('common.status')}</th>
                <th className="py-2 pr-3">{t('common.date')}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id} className="border-t border-gray-50">
                  <td className="py-2 pr-3">
                    <Link href={`/orders/${o._id}`} className="text-primary hover:underline">
                      #{o._id.slice(-6).toUpperCase()}
                    </Link>
                  </td>
                  <td className="py-2 pr-3">{o.customer || '—'}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{formatCurrency(o.amount, t)}</td>
                  <td className="py-2 pr-3">
                    <span className="text-[10px] font-bold uppercase">{t(`status.${o.rawStatus}`)}</span>
                  </td>
                  <td className="py-2 pr-3 text-gray-500">{formatDate(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
       </div>
    </Section>
  );
};

const ViolationsTab = ({ sellerId, t }: { sellerId: string; t: (k: string) => string }) => (
  <Section title={t('pages.shops.details.violations')}>
    <p className="text-[12px] text-gray-400 py-8 text-center">{t('common.noViolations')}</p>
  </Section>
);

const AnalyticsTab = ({ user, t }: { user: AdminUserDetail; t: (k: string) => string }) => (
  <Section title={t('pages.shops.details.analytics')}>
    <p className="text-[12px] text-gray-400 py-8 text-center">{t('common.noAnalytics')}</p>
  </Section>
);

export default ShopDetailPage;
