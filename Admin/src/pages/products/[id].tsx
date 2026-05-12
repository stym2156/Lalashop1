import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  ArrowLeft, Package, AlertCircle, Image as ImageIcon, Ban, CheckCircle, Star, Tag, Award, Flag,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  fetchAdminProduct,
  updateAdminProduct,
  fetchAdminReports,
  type AdminProductRow,
  type AdminReportRow,
} from '@/services/adminApi';
import Link from 'next/link';

type Tab = 'overview' | 'images' | 'reviews' | 'reports' | 'history';

const formatMoney = (n: number): string =>
  Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

const formatDate = (s?: string): string => {
  if (!s) return '—';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '—';
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const productImages = (p: AdminProductRow): string[] => {
  const list: string[] = [];
  if (Array.isArray(p.images)) list.push(...p.images);
  if (typeof p.image === 'string' && p.image) list.push(p.image);
  else if (Array.isArray(p.image)) list.push(...p.image);
  return Array.from(new Set(list)).filter(Boolean);
};

const ProductDetailPage = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { id } = router.query;
  const [tab, setTab] = useState<Tab>('overview');
  const [product, setProduct] = useState<AdminProductRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reports, setReports] = useState<AdminReportRow[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  const loadProduct = async (productId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminProduct(productId);
      setProduct(res.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pages.products.details.loading'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof id !== 'string') return;
    loadProduct(id);
  }, [id]);

  useEffect(() => {
    if (typeof id !== 'string' || tab !== 'reports') return;
    let cancelled = false;
    setReportsLoading(true);
    fetchAdminReports({ targetType: 'product', targetId: id, limit: 50 })
      .then((res) => {
        if (cancelled) return;
        setReports(res.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setReports([]);
      })
      .finally(() => {
        if (!cancelled) setReportsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, tab]);

  const onAction = async (
    action: 'approve' | 'ban' | 'unban' | 'feature' | 'unfeature' | 'flag-violation' | 'clear-violation',
  ) => {
    if (typeof id !== 'string' || !product) return;
    setBusy(true);
    try {
      await updateAdminProduct(String(id), { action });
      await loadProduct(String(id));
    } catch (err) {
      alert(err instanceof Error ? err.message : t('actions.update'));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="text-[13px] text-gray-400 py-12 text-center">{t('pages.products.details.loading')}</div>;
  }

  if (error || !product) {
    return (
      <div className="space-y-4 text-sm">
        <button
          onClick={() => router.push('/products')}
          className="inline-flex items-center gap-2 text-[12px] text-gray-500 hover:text-black font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> {t('pages.products.details.back')}
        </button>
        <div className="rounded-lg bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {error || t('pages.products.details.notFound')}
        </div>
      </div>
    );
  }

  const images = productImages(product);
  const tags = product.tags || [];
  const isBanned = tags.includes('banned');
  const isFeatured = tags.includes('featured');
  const hasViolation = tags.includes('violation') || tags.includes('reported');

  return (
    <div className="space-y-4 text-sm">
      <button
        onClick={() => router.push('/products')}
        className="inline-flex items-center gap-2 text-[12px] text-gray-500 hover:text-black font-medium transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> {t('pages.products.details.back')}
      </button>

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={images[0]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <Package className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-[18px] font-bold text-gray-900 truncate">{product.name}</h1>
            <p className="text-[12px] text-gray-500 mt-1">
              {product.category} · <span className="font-mono">{product._id.slice(-8).toUpperCase()}</span>
              {product.seller?.name ? ` · ${product.seller.name}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {!isFeatured ? (
            <button
              disabled={busy}
              onClick={() => onAction('feature')}
              className="px-3 py-1.5 rounded-md text-xs font-semibold text-purple-700 bg-purple-50 inline-flex items-center hover:bg-purple-100 disabled:opacity-50"
            >
              <Award className="w-3.5 h-3.5 mr-1.5" /> {t('pages.products.details.feature')}
            </button>
          ) : (
            <button
              disabled={busy}
              onClick={() => onAction('unfeature')}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 inline-flex items-center hover:bg-gray-100 disabled:opacity-50"
            >
              {t('pages.products.details.unfeature')}
            </button>
          )}
          {!hasViolation ? (
            <button
              disabled={busy}
              onClick={() => onAction('flag-violation')}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-amber-700 bg-amber-50 inline-flex items-center hover:bg-amber-100 disabled:opacity-50"
            >
              <Flag className="w-3.5 h-3.5 mr-1.5" /> {t('pages.products.details.flag')}
            </button>
          ) : (
            <button
              disabled={busy}
              onClick={() => onAction('clear-violation')}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 inline-flex items-center hover:bg-gray-100 disabled:opacity-50"
            >
              {t('pages.products.details.clearViolation')}
            </button>
          )}
          {!isBanned ? (
            <button
              disabled={busy}
              onClick={() => onAction('ban')}
              className="px-3 py-1.5 rounded-md text-xs font-semibold text-red-600 bg-red-50 inline-flex items-center hover:bg-red-100 disabled:opacity-50"
            >
              <Ban className="w-3.5 h-3.5 mr-1.5" /> {t('pages.products.details.ban')}
            </button>
          ) : (
            <button
              disabled={busy}
              onClick={() => onAction('unban')}
              className="px-3 py-1.5 rounded-md text-xs font-semibold text-green-700 bg-green-50 inline-flex items-center hover:bg-green-100 disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> {t('pages.products.details.reinstate')}
            </button>
          )}
          {product.status === 'Draft' && (
            <button
              disabled={busy}
              onClick={() => onAction('approve')}
              className="px-3 py-1.5 rounded-md text-xs font-semibold text-green-700 bg-green-50 inline-flex items-center hover:bg-green-100 disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> {t('pages.products.details.approve')}
            </button>
          )}
        </div>
      </div>

      <div className="flex border-b border-gray-100 text-[12px]">
        {([
          { id: 'overview', label: t('pages.products.details.tabOverview'), icon: Tag },
          { id: 'images', label: t('pages.products.details.tabImages'), icon: ImageIcon },
          { id: 'reviews', label: t('pages.products.details.tabReviews'), icon: Star },
          { id: 'reports', label: t('pages.products.details.tabReports'), icon: AlertCircle },
          { id: 'history', label: t('pages.products.details.tabHistory'), icon: Package },
        ] as { id: Tab; label: string; icon: typeof Tag }[]).map((tabItem) => (
          <button
            key={tabItem.id}
            onClick={() => setTab(tabItem.id)}
            className={`px-4 py-2.5 inline-flex items-center gap-2 -mb-px font-medium transition-colors ${
              tab === tabItem.id
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-black border-b-2 border-transparent'
            }`}
          >
            <tabItem.icon className="w-3.5 h-3.5" />
            {tabItem.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-lg p-5 lg:col-span-1 space-y-4">
            <div>
              <h3 className="text-[11px] font-semibold text-gray-500 tracking-wide mb-3">{t('pages.products.details.sectionProductInfo')}</h3>
              <div className="space-y-2 text-[12px]">
                <Row label={t('pages.products.details.labelProductId')} value={product._id} mono />
                <Row label={t('pages.products.details.labelShop')} value={product.seller?.name || '—'} link={product.seller?._id ? `/shops/${product.seller._id}` : undefined} />
                <Row label={t('pages.products.details.labelCategory')} value={product.category} />
                <Row label={t('pages.products.details.labelPrice')} value={`${formatMoney(product.price)} ₭`} />
                <Row label={t('pages.products.details.labelStock')} value={product.countInStock.toString()} />
                <Row label={t('pages.products.details.labelStatus')} value={product.status} />
                <Row label={t('pages.products.details.labelCreated')} value={formatDate(product.createdAt)} />
                {product.tags && product.tags.length > 0 && (
                  <Row label={t('pages.products.details.labelTags')} value={product.tags.join(', ')} />
                )}
              </div>
            </div>

            {product.description && (
              <div>
                <h3 className="text-[11px] font-semibold text-gray-500 tracking-wide mb-2">{t('pages.products.details.sectionDescription')}</h3>
                <p className="text-[12px] text-gray-700 leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div>
              <h3 className="text-[11px] font-semibold text-gray-500 tracking-wide mb-2">{t('pages.products.details.sectionPerformance')}</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Metric label={t('pages.products.details.metricUnitsSold')} value={(product.soldCount ?? 0).toString()} tone="text-black" />
                <Metric label={t('pages.products.details.metricAvgRating')} value={`${(product.rating ?? 0).toFixed(1)} ★`} tone="text-orange-700" />
                <Metric label={t('pages.products.details.metricReviews')} value={(product.numReviews ?? 0).toString()} tone="text-black" />
                <Metric label={t('pages.products.details.metricStock')} value={product.countInStock.toString()} tone={product.countInStock > 0 ? 'text-green-700' : 'text-red-700'} />
              </div>
            </div>

            <div>
              <h3 className="text-[11px] font-semibold text-gray-500 tracking-wide mb-2">
                {t('pages.products.details.images')} ({images.length})
              </h3>
              <div className="grid grid-cols-4 gap-3">
                {images.length === 0 && (
                  <div className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center col-span-4">
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                {images.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={`${src}-${i}`}
                    src={src}
                    alt={`${product.name} ${i + 1}`}
                    className="aspect-square rounded-lg object-cover bg-gray-100"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'images' && (
        <div className="grid grid-cols-3 gap-3">
          {images.length === 0 && (
            <div className="col-span-3 text-center py-12 text-gray-400 text-[12px]">{t('pages.products.details.noImages')}</div>
          )}
          {images.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={`${src}-${i}`} src={src} alt={`${product.name} ${i + 1}`} className="aspect-square rounded-lg object-cover bg-gray-100" />
          ))}
        </div>
      )}

      {tab === 'reviews' && (
        <div className="rounded-lg py-12 text-center text-gray-400 text-[12px]">
          {(product.numReviews ?? 0) > 0
            ? `${product.numReviews} ${product.numReviews === 1 ? t('pages.support.table.reply') : t('pages.support.table.replies')}`
            : t('pages.products.details.noReviews')}
        </div>
      )}

      {tab === 'reports' && (
        reportsLoading ? (
          <div className="rounded-lg py-12 text-center text-gray-400 text-[12px]">{t('pages.products.details.loadingReports')}</div>
        ) : reports.length === 0 ? (
          <div className="rounded-lg py-12 text-center text-gray-400 text-[12px]">
            {hasViolation ? t('pages.products.details.noReports') : t('pages.products.details.noReports')}
          </div>
        ) : (
          <div className="rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] tabular-nums">
                <thead className="text-[11px] text-gray-500 tracking-wide">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">{t('pages.products.details.reportTableId')}</th>
                    <th className="px-4 py-2 text-left font-semibold">{t('pages.products.details.reportTableReason')}</th>
                    <th className="px-4 py-2 text-left font-semibold">{t('pages.products.details.reportTableBy')}</th>
                    <th className="px-4 py-2 text-left font-semibold">{t('pages.products.details.reportTableDesc')}</th>
                    <th className="px-4 py-2 text-left font-semibold">{t('pages.products.details.reportTableStatus')}</th>
                    <th className="px-4 py-2 text-right font-semibold">{t('pages.products.details.reportTableOpen')}</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r._id}>
                      <td className="px-4 py-2 font-mono text-[11px] text-gray-600">
                        <Link href={`/reports/${r._id}`} className="hover:text-primary">
                          RPT-{r._id.slice(-6).toUpperCase()}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-gray-700 capitalize">{t(`pages.reports.reasonLabel.${r.reason}`)}</td>
                      <td className="px-4 py-2 text-gray-900 font-medium">
                        {r.reportedBy?.name || r.reportedBy?.email || '—'}
                      </td>
                      <td className="px-4 py-2 text-gray-700">
                        <p className="line-clamp-1 max-w-xs">{r.description || <span className="text-gray-300">—</span>}</p>
                      </td>
                      <td className="px-4 py-2 text-gray-700 capitalize">{t(`pages.reports.statusLabel.${r.status}`)}</td>
                      <td className="px-4 py-2 text-right">
                        <Link href={`/reports/${r._id}`} className="text-[12px] text-primary hover:underline font-medium">
                          {t('pages.products.details.reportView')}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {tab === 'history' && (
        <ProductHistoryTimeline product={product} reports={reports} t={t} />
      )}
    </div>
  );
};

interface HistoryTimelineProps {
  product: AdminProductRow;
  reports: AdminReportRow[];
  t: (k: string, opts?: Record<string, unknown>) => string;
}

interface TimelineEvent {
  at: string;
  title: string;
  detail?: string;
  tone: 'created' | 'updated' | 'flag' | 'report';
}

const ProductHistoryTimeline: React.FC<HistoryTimelineProps> = ({ product, reports, t }) => {
  const events: TimelineEvent[] = [
    {
      at: product.createdAt,
      title: t('pages.products.details.tabOverview'),
      detail: `${t('pages.products.details.labelShop')}: ${product.seller?.name || product.seller?.email || '—'}`,
      tone: 'created',
    },
  ];

  if (product.updatedAt && product.updatedAt !== product.createdAt) {
    events.push({
      at: product.updatedAt,
      title: t('table.updatedAt'),
      detail: `${t('table.status')}: ${product.status}` + (product.tags?.length ? ` · ${t('pages.products.details.labelTags')}: ${product.tags.join(', ')}` : ''),
      tone: 'updated',
    });
  }

  for (const r of reports) {
    events.push({
      at: r.createdAt,
      title: `${t('pages.products.details.tabReports')} (${t(`pages.reports.reasonLabel.${r.reason}`)})`,
      detail: r.description?.slice(0, 120) || `${t('table.status')}: ${t(`pages.reports.statusLabel.${r.status}`)}`,
      tone: 'report',
    });
  }

  if (Array.isArray(product.tags)) {
    for (const tag of product.tags) {
      if (['banned', 'featured', 'violation', 'reported'].includes(tag)) {
        events.push({
          at: product.updatedAt,
          title: `${t('pages.products.details.flag')}: ${tag}`,
          detail: `"${tag}"`,
          tone: 'flag',
        });
      }
    }
  }

  events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  if (events.length === 0) {
    return (
      <div className="rounded-lg py-12 text-center text-gray-400 text-[12px]">
        {t('pages.products.details.noActivity')}
      </div>
    );
  }

  const toneClass: Record<TimelineEvent['tone'], string> = {
    created: 'bg-blue-500',
    updated: 'bg-amber-500',
    flag: 'bg-purple-500',
    report: 'bg-red-500',
  };

  return (
    <div className="px-2">
      <div className="rounded-lg bg-amber-50 px-4 py-2 mb-4 text-[11px] text-amber-700">
        {t('pages.products.details.tabHistory')}
      </div>
      <div className="border-l border-gray-200 ml-2 pl-2">
        {events.map((e, i) => (
          <div key={i} className="relative pl-6 pb-5 last:pb-0">
            <div className={`absolute -left-[7px] top-1 w-2.5 h-2.5 rounded-full bg-white border-2 ${toneClass[e.tone]}`} />
            <p className="text-[12px] font-semibold text-gray-900">{e.title}</p>
            {e.detail && <p className="text-[11px] text-gray-600 mt-0.5">{e.detail}</p>}
            <p className="text-[10px] text-gray-400 mt-0.5 tabular-nums">{formatDate(e.at)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const Row = ({ label, value, mono, link }: { label: string; value: string; mono?: boolean; link?: string }) => (
  <div className="flex items-start justify-between gap-3">
    <span className="text-gray-500 flex-shrink-0">{label}</span>
    {link ? (
      <a href={link} className="text-right text-gray-900 hover:text-primary transition-colors truncate">{value}</a>
    ) : (
      <span className={`text-right text-gray-900 truncate ${mono ? 'font-mono text-[11px]' : ''}`}>{value}</span>
    )}
  </div>
);

const Metric = ({ label, value, tone }: { label: string; value: string; tone: string }) => (
  <div className="rounded-lg px-4 py-3">
    <p className="text-[11px] font-semibold text-gray-500 tracking-wide">{label}</p>
    <p className={`text-xl font-bold tabular-nums mt-1 ${tone}`}>{value}</p>
  </div>
);

export default ProductDetailPage;
