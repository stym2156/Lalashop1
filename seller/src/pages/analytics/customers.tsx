import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Users, Repeat, ShoppingBag } from "lucide-react";
import { fetchMyOrders, type SellerOrderRow } from "@/services/sellerApi";

const formatMoney = (n: number): string =>
  Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

interface CustomerStat {
  userId: string;
  name: string;
  email: string;
  orderCount: number;
  totalSpent: number;
  lastOrder: Date;
}

const CustomersAnalyticsPage: React.FC = () => {
  const { t } = useTranslation("common");
  const [orders, setOrders] = useState<SellerOrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchMyOrders()
      .then((data) => {
        if (!cancelled) setOrders(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const customers: CustomerStat[] = useMemo(() => {
    const map = new Map<string, CustomerStat>();
    for (const o of orders) {
      if (!o.isPaid) continue;
      const user = typeof o.user === "object" ? o.user : null;
      if (!user || !user._id) continue;
      const key = user._id;
      const d = new Date(o.paidAt || o.createdAt);
      if (!map.has(key)) {
        map.set(key, {
          userId: key,
          name: user.name || user.email || "—",
          email: user.email || "",
          orderCount: 0,
          totalSpent: 0,
          lastOrder: d,
        });
      }
      const c = map.get(key)!;
      c.orderCount += 1;
      c.totalSpent += o.totalPrice;
      if (d > c.lastOrder) c.lastOrder = d;
    }
    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  const repeat = customers.filter((c) => c.orderCount > 1);
  const repeatRate = customers.length > 0 ? (repeat.length / customers.length) * 100 : 0;
  const avgSpent =
    customers.length > 0 ? customers.reduce((s, c) => s + c.totalSpent, 0) / customers.length : 0;

  return (
    <div className="space-y-4 text-sm">
      <div>
        <h1 className="text-[16px] font-bold text-gray-900">{t('pages.customersAnalytics.title')}</h1>
        <p className="text-[12px] text-gray-500 mt-0.5">
          {t('pages.customersAnalytics.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <KPI icon={Users} label={t('pages.customersAnalytics.uniqueCustomers')} value={customers.length.toLocaleString()} tone="text-blue-700" />
        <KPI icon={Repeat} label={t('pages.customersAnalytics.repeatRate')} value={`${repeatRate.toFixed(1)}%`} tone="text-purple-700" />
        <KPI icon={ShoppingBag} label={t('pages.customersAnalytics.avgLifetimeSpend')} value={`฿${formatMoney(avgSpent)}`} tone="text-emerald-700" />
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-400 text-[12px]">
          <Loader2 className="w-5 h-5 mx-auto animate-spin" />
        </div>
      ) : (
        <div className="rounded-lg overflow-hidden border border-gray-100">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-[13px] font-bold text-gray-900">Top customers</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] tabular-nums">
              <thead className="text-[11px] text-gray-500 tracking-wide bg-gray-50/50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Customer</th>
                  <th className="px-4 py-2 text-right font-semibold">Orders</th>
                  <th className="px-4 py-2 text-right font-semibold">Lifetime spend</th>
                  <th className="px-4 py-2 text-left font-semibold">Last order</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                      No customers yet
                    </td>
                  </tr>
                )}
                {customers.slice(0, 30).map((c) => (
                  <tr key={c.userId} className="border-t border-gray-50">
                    <td className="px-4 py-2">
                      <p className="font-medium text-gray-900">{c.name}</p>
                      <p className="text-[10px] text-gray-500">{c.email}</p>
                    </td>
                    <td className="px-4 py-2 text-right text-gray-900">{c.orderCount}</td>
                    <td className="px-4 py-2 text-right font-bold text-emerald-700">
                      ฿{formatMoney(c.totalSpent)}
                    </td>
                    <td className="px-4 py-2 text-gray-500 text-[11px]">
                      {c.lastOrder.toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const KPI: React.FC<{ icon: typeof Users; label: string; value: string; tone: string }> = ({
  icon: Icon, label, value, tone,
}) => (
  <div className="rounded-lg border border-gray-100 px-4 py-3">
    <div className="flex items-center gap-1.5">
      <Icon className="w-3 h-3 text-gray-400" />
      <p className="text-[11px] font-semibold text-gray-500 tracking-wide">{label}</p>
    </div>
    <p className={`text-[20px] font-bold tabular-nums mt-1 ${tone}`}>{value}</p>
  </div>
);

export default CustomersAnalyticsPage;
