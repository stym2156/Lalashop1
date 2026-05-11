import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Package, TrendingUp, AlertTriangle } from "lucide-react";
import {
  fetchMyProducts, fetchMyOrders, type SellerProductRow, type SellerOrderRow,
} from "@/services/sellerApi";

const formatMoney = (n: number): string =>
  Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

const productImage = (p: SellerProductRow): string => {
  if (Array.isArray(p.images) && p.images.length > 0) return p.images[0];
  if (typeof p.image === "string") return p.image;
  if (Array.isArray(p.image) && p.image.length > 0) return p.image[0];
  return "";
};

interface ProductPerf {
  product: SellerProductRow;
  unitsSold: number;
  revenue: number;
}

const ProductsAnalyticsPage: React.FC = () => {
  const { t } = useTranslation("common");
  const [products, setProducts] = useState<SellerProductRow[]>([]);
  const [orders, setOrders] = useState<SellerOrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchMyProducts(), fetchMyOrders()])
      .then(([p, o]) => {
        if (cancelled) return;
        setProducts(p);
        setOrders(o);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const performance: ProductPerf[] = useMemo(() => {
    const map = new Map<string, ProductPerf>();
    for (const p of products) {
      map.set(p._id, { product: p, unitsSold: 0, revenue: 0 });
    }
    for (const o of orders) {
      if (!o.isPaid) continue;
      for (const item of o.orderItems) {
        const pid =
          typeof item.product === "string"
            ? item.product
            : (item.product as { _id?: string })?._id;
        if (!pid) continue;
        const row = map.get(String(pid));
        if (!row) continue;
        row.unitsSold += item.qty;
        row.revenue += item.qty * item.price;
      }
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [products, orders]);

  const lowStock = products.filter((p) => p.countInStock < 10 && p.status === "Active");

  return (
    <div className="space-y-4 text-sm">
      <div>
        <h1 className="text-[16px] font-bold text-gray-900">{t('pages.productsAnalytics.title')}</h1>
        <p className="text-[12px] text-gray-500 mt-0.5">
          {t('pages.productsAnalytics.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <KPI icon={Package} label={t('pages.productsAnalytics.products')} value={products.length} tone="text-blue-700" />
        <KPI
          icon={TrendingUp}
          label={t('pages.productsAnalytics.totalUnitsSold')}
          value={performance.reduce((s, p) => s + p.unitsSold, 0)}
          tone="text-emerald-700"
        />
        <KPI icon={AlertTriangle} label={t('pages.productsAnalytics.lowStockAlerts')} value={lowStock.length} tone="text-amber-700" />
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-400 text-[12px]">
          <Loader2 className="w-5 h-5 mx-auto animate-spin" />
        </div>
      ) : (
        <div className="rounded-lg overflow-hidden border border-gray-100">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-[13px] font-bold text-gray-900">Top sellers (by revenue)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] tabular-nums">
              <thead className="text-[11px] text-gray-500 tracking-wide bg-gray-50/50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold w-10">#</th>
                  <th className="px-4 py-2 text-left font-semibold">Product</th>
                  <th className="px-4 py-2 text-right font-semibold">Stock</th>
                  <th className="px-4 py-2 text-right font-semibold">Units sold</th>
                  <th className="px-4 py-2 text-right font-semibold">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {performance.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                      No sales yet
                    </td>
                  </tr>
                )}
                {performance.slice(0, 30).map((perf, i) => {
                  const cover = productImage(perf.product);
                  const lowS = perf.product.countInStock < 10;
                  return (
                    <tr key={perf.product._id} className="border-t border-gray-50">
                      <td className="px-4 py-2 text-gray-500">{i + 1}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded bg-gray-50 overflow-hidden flex-shrink-0">
                            {cover && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={cover} alt={perf.product.name} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <p className="text-[12px] font-medium text-gray-900 line-clamp-1">{perf.product.name}</p>
                        </div>
                      </td>
                      <td className={`px-4 py-2 text-right ${lowS ? "text-amber-600 font-bold" : "text-gray-700"}`}>
                        {perf.product.countInStock}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-900">{perf.unitsSold}</td>
                      <td className="px-4 py-2 text-right font-bold text-emerald-700">
                        ฿{formatMoney(perf.revenue)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const KPI: React.FC<{ icon: typeof Package; label: string; value: number; tone: string }> = ({
  icon: Icon, label, value, tone,
}) => (
  <div className="rounded-lg border border-gray-100 px-4 py-3">
    <div className="flex items-center gap-1.5">
      <Icon className="w-3 h-3 text-gray-400" />
      <p className="text-[11px] font-semibold text-gray-500 tracking-wide">{label}</p>
    </div>
    <p className={`text-[20px] font-bold tabular-nums mt-1 ${tone}`}>{value.toLocaleString()}</p>
  </div>
);

export default ProductsAnalyticsPage;
