import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Loader2, Users, Search, ArrowRight } from "lucide-react";
import { fetchCustomers, type SellerCustomer, type CustomerSegment } from "@/services/sellerApi";

const formatMoney = (n: number): string =>
  Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

const formatDate = (s?: string): string => {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const SEGMENT_BADGE: Record<CustomerSegment, string> = {
  vip: "bg-amber-100 text-amber-700",
  regular: "bg-blue-100 text-blue-700",
  new: "bg-emerald-100 text-emerald-700",
  inactive: "bg-gray-100 text-gray-600",
  blocked: "bg-red-100 text-red-700",
  "": "",
};

const initial = (name?: string): string =>
  (name || "?").trim().charAt(0).toUpperCase() || "?";

const CustomerListPage: React.FC = () => {
  const { t } = useTranslation("common");
  const [items, setItems] = useState<SellerCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | CustomerSegment>("all");

  useEffect(() => {
    let cancelled = false;
    fetchCustomers()
      .then((list) => {
        if (!cancelled) setItems(list);
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((c) => {
      if (filter !== "all" && (c.segment || "") !== filter) return false;
      if (
        q &&
        !c.name?.toLowerCase().includes(q) &&
        !c.username?.toLowerCase().includes(q) &&
        !c.email?.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [items, filter, search]);

  return (
    <div className="space-y-4 text-sm">
      <div>
        <h1 className="text-[16px] font-bold text-gray-900">{t('pages.customersList.title')}</h1>
        <p className="text-[12px] text-gray-500 mt-0.5">
          {t('pages.customersList.subtitle')}
        </p>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 bg-gray-100 rounded p-0.5">
          {(["all", "vip", "regular", "new", "inactive"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k as "all" | CustomerSegment)}
              className={`px-3 py-1 rounded text-[11px] font-bold capitalize ${
                filter === k ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-black"
              }`}
            >
              {k === "all" ? t('pages.customersList.filterAll') :
               k === "vip" ? t('pages.customersList.filterVip') :
               k === "regular" ? t('pages.customersList.filterRegular') :
               k === "new" ? t('pages.customersList.filterNew') :
               t('pages.customersList.filterInactive')}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('pages.customersList.searchPlaceholder')}
            className="bg-gray-50 border border-gray-100 focus:bg-white focus:border-gray-200 outline-none rounded-md pl-8 pr-3 py-1.5 text-xs w-64"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="py-12 text-center">
          <Loader2 className="w-5 h-5 animate-spin text-gray-300 mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <Users className="w-8 h-8 mx-auto mb-3 text-gray-300" />
          <p className="text-[13px] font-bold text-gray-700">
            {items.length === 0 ? t('pages.customersList.noCustomers') : t('common.noMatches')}
          </p>
          {items.length === 0 && (
            <p className="text-[11px] text-gray-500 mt-1">
              {t('pages.customersList.noCustomersHint')}
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-100 overflow-hidden bg-white">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 tracking-wider">
              <tr>
                <th className="px-4 py-2 text-left">{t('pages.customersList.tableCustomer')}</th>
                <th className="px-4 py-2 text-left">{t('pages.customersList.tableSegment')}</th>
                <th className="px-4 py-2 text-right">{t('pages.customersList.tableOrders')}</th>
                <th className="px-4 py-2 text-right">{t('pages.customersList.tableTotalSpent')}</th>
                <th className="px-4 py-2 text-left">{t('pages.customersList.tableLastOrder')}</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {c.profileImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.profileImage}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00aeff] to-[#0096db] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                          {initial(c.name || c.username)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate">
                          {c.name || c.username || t('orders.customer')}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">{c.email || "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {c.segment ? (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wide ${SEGMENT_BADGE[c.segment]}`}
                      >
                        {c.segment}
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {c.paidOrderCount}/{c.orderCount}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-bold text-emerald-700">
                    ฿{formatMoney(c.totalSpent)}
                  </td>
                  <td className="px-4 py-3 text-[11px] text-gray-500">
                    {formatDate(c.lastOrderAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/customers/activity?id=${c._id}`}
                      className="text-[11px] font-bold text-[#00aeff] hover:underline inline-flex items-center"
                    >
                      {t('pages.customersList.view')} <ArrowRight className="w-3 h-3 ml-0.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CustomerListPage;
