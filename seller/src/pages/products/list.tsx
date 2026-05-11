import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Package, Star, AlertTriangle } from 'lucide-react';
import { fetchMyProducts, type SellerProductRow } from '@/services/sellerApi';

const statusBadge: Record<string, string> = {
  Active: 'bg-green-50 text-green-700',
  Draft: 'bg-orange-50 text-orange-700',
  Archived: 'bg-gray-100 text-gray-600',
};

const formatMoney = (n: number): string =>
  Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

const productImage = (p: SellerProductRow): string => {
  if (Array.isArray(p.images) && p.images.length > 0) return p.images[0];
  if (typeof p.image === 'string' && p.image) return p.image;
  if (Array.isArray(p.image) && p.image.length > 0) return p.image[0];
  return '';
};

const ProductsList = () => {
  const { t } = useTranslation('common');
  const [items, setItems] = useState<SellerProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Draft' | 'Archived'>('all');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchMyProducts()
      .then((res) => {
        if (!cancelled) setItems(res);
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

  const filtered = items.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (!q) return true;
    return p.name.toLowerCase().includes(q.toLowerCase());
  });

  const counts = {
    all: items.length,
    Active: items.filter((p) => p.status === 'Active').length,
    Draft: items.filter((p) => p.status === 'Draft').length,
    Archived: items.filter((p) => p.status === 'Archived').length,
  };

  const tabs: Array<{ id: typeof statusFilter; label: string }> = [
    { id: 'all', label: `${t('pages.productsList.tabAll')} (${counts.all})` },
    { id: 'Active', label: `${t('pages.productsList.tabActive')} (${counts.Active})` },
    { id: 'Draft', label: `${t('pages.productsList.tabDraft')} (${counts.Draft})` },
    { id: 'Archived', label: `${t('pages.productsList.tabArchived')} (${counts.Archived})` },
  ];

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between">
        <h1 className="text-[16px] font-bold text-gray-900">{t('pages.productsList.title')}</h1>
        <Link
          href="/products/add"
          className="bg-[#00aeff] text-white px-3 py-1.5 rounded-md text-xs font-semibold inline-flex items-center hover:bg-[#0096db]"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" /> {t('pages.productsList.addProduct')}
        </Link>
      </div>

      <div className="flex border-b border-gray-100 text-[12px]">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setStatusFilter(t.id)}
            className={`px-4 py-2.5 -mb-px font-medium transition-colors ${
              statusFilter === t.id
                ? 'text-[#00aeff] border-b-2 border-[#00aeff]'
                : 'text-gray-500 hover:text-black border-b-2 border-transparent'
            }`}
          >
            {t.label}
          </button>
        ))}

        <div className="ml-auto relative my-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="text"
            placeholder={t('pages.productsList.searchPlaceholder')}
            className="pl-7 pr-3 py-1 rounded text-[11px] w-64 bg-gray-50 border border-gray-100 focus:border-[#00aeff] outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-2 text-[12px] text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="py-12 text-center text-gray-400 text-[12px]">{t('status.loadingProducts')}</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-300">
          <Package size={48} strokeWidth={1} />
          <p className="mt-4 text-[11px] font-bold tracking-widest">{t('pages.productsList.noProductsView')}</p>
          <Link
            href="/products/add"
            className="mt-4 bg-[#00aeff] text-white px-4 py-2 rounded-md text-[12px] font-semibold inline-flex items-center hover:bg-[#0096db]"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" /> {t('pages.productsList.createFirst')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {filtered.map((p) => {
            const cover = productImage(p);
            const lowStock = p.countInStock < 10;
            return (
              <Link
                key={p._id}
                href={`/products/${p._id}`}
                className="border border-gray-100 rounded-lg overflow-hidden hover:shadow-md hover:border-[#00aeff]/40 transition-all bg-white block group"
              >
                <div className="aspect-square bg-gray-50 relative overflow-hidden">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cover}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                  {p.status && (
                    <span className={`absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded ${statusBadge[p.status]}`}>
                      {p.status}
                    </span>
                  )}
                  {p.freeShipping && (
                    <span className="absolute bottom-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-600 text-white">
                      {t('pages.productsList.freeShip')}
                    </span>
                  )}
                </div>
                <div className="p-3 space-y-1">
                  <h3 className="text-[12px] font-bold text-gray-900 line-clamp-2 min-h-[32px] group-hover:text-[#00aeff]">
                    {p.name}
                  </h3>
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="w-3 h-3" fill="currentColor" />
                      <span className="font-semibold text-gray-700">{(p.rating ?? 0).toFixed(1)}</span>
                      <span className="text-gray-400">({p.numReviews ?? 0})</span>
                    </div>
                    <span className="text-gray-500">{t('pages.productsList.soldCount', { count: (p.soldCount ?? 0) })}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[14px] font-bold text-[#00aeff]">฿{formatMoney(p.price)}</span>
                    <span className={`text-[10px] font-medium inline-flex items-center gap-0.5 ${lowStock ? 'text-red-600' : 'text-gray-500'}`}>
                      {lowStock && <AlertTriangle className="w-3 h-3" />}
                      {t('pages.productsList.stockCount', { count: p.countInStock })}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductsList;
