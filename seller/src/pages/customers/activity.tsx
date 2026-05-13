import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  Loader2, ArrowLeft, Package, Mail, Calendar, Tag, MessageCircle,
} from "lucide-react";
import {
  fetchCustomerActivity,
  fetchCustomers,
  type CustomerActivity,
  type SellerCustomer,
  type CustomerSegment,
} from "@/services/sellerApi";

const formatMoney = (n: number): string =>
  Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

const formatDate = (s?: string): string => {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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

const ActivityPage: React.FC = () => {
  const { t } = useTranslation("common");
  const router = useRouter();
  const queryId = typeof router.query.id === "string" ? router.query.id : null;

  const [list, setList] = useState<SellerCustomer[]>([]);
  const [data, setData] = useState<CustomerActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchCustomers()
      .then((customers) => {
        if (cancelled) return;
        setList(customers);
        // If no id is provided, default to the first customer.
        if (!queryId && customers[0]) {
          router.replace(`/customers/activity?id=${customers[0]._id}`, undefined, { shallow: true });
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!queryId) {
      setData(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchCustomerActivity(queryId)
      .then((d) => {
        if (!cancelled) setData(d);
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
  }, [queryId]);

  const summary = list.find((c) => c._id === queryId);

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center gap-2">
        <Link
          href="/customers/list"
          className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-[16px] font-bold text-gray-900">{t('pages.customerActivity.title')}</h1>
          <p className="text-[12px] text-gray-500 mt-0.5">
            {t('pages.customerActivity.subtitle')}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="py-12 text-center">
          <Loader2 className="w-5 h-5 animate-spin text-gray-300 mx-auto" />
        </div>
      ) : !data || !queryId ? (
        <div className="py-16 text-center">
          <Package className="w-8 h-8 mx-auto mb-3 text-gray-300" />
          <p className="text-[13px] font-bold text-gray-700">{t("pages.customerActivity.noCustomerSelected")}</p>
          <Link
            href="/customers/list"
            className="text-[12px] text-[#00aeff] font-bold hover:underline mt-2 inline-block"
          >
            {t("pages.customerActivity.openCustomerList")} →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Profile column */}
          <div className="space-y-3">
            <div className="rounded-lg border border-gray-100 p-4 bg-white">
              <div className="flex items-center gap-3">
                {data.profile.profileImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={data.profile.profileImage}
                    alt=""
                    className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00aeff] to-[#0096db] text-white text-lg font-black flex items-center justify-center flex-shrink-0">
                    {initial(data.profile.name || data.profile.username)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-gray-900 truncate">
                    {data.profile.name || data.profile.username || t("common.user")}
                  </p>
                  {data.profile.username && (
                    <p className="text-[11px] text-gray-500 truncate">@{data.profile.username}</p>
                  )}
                </div>
              </div>
              {data.profile.email && (
                <p className="text-[11px] text-gray-500 mt-3 inline-flex items-center gap-1.5">
                  <Mail className="w-3 h-3" /> {data.profile.email}
                </p>
              )}
              {data.profile.createdAt && (
                <p className="text-[11px] text-gray-500 mt-1 inline-flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> {t("pages.customerActivity.joined", { date: formatDate(data.profile.createdAt) })}
                </p>
              )}
            </div>

            {summary && (
              <div className="rounded-lg border border-gray-100 p-4 bg-white space-y-2">
                <h3 className="text-[11px] font-bold text-gray-500 tracking-wide">
                  {t("pages.customerActivity.lifetimeValue")}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-gray-400">{t("pages.customerActivity.orders")}</p>
                    <p className="text-[18px] font-black text-gray-900 tabular-nums">
                      {summary.paidOrderCount}/{summary.orderCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">{t("pages.customerActivity.totalSpent")}</p>
                    <p className="text-[18px] font-black text-emerald-700 tabular-nums">
                      ฿{formatMoney(summary.totalSpent)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {data.label && (data.label.tags?.length || data.label.segment || data.label.note) && (
              <div className="rounded-lg border border-gray-100 p-4 bg-white space-y-2">
                <h3 className="text-[11px] font-bold text-gray-500 tracking-wide">
                  {t("pages.customerActivity.labelsTitle")}
                </h3>
                {data.label.segment && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wide ${SEGMENT_BADGE[data.label.segment]}`}
                  >
                    {data.label.segment}
                  </span>
                )}
                {data.label.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {data.label.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] font-medium bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded inline-flex items-center gap-1"
                      >
                        <Tag className="w-2.5 h-2.5" /> {t}
                      </span>
                    ))}
                  </div>
                )}
                {data.label.note && (
                  <p className="text-[11px] text-gray-600 leading-relaxed border-t pt-2">
                    {data.label.note}
                  </p>
                )}
              </div>
            )}

            <Link
              href="/messages/inbox"
              className="block rounded-lg border border-gray-100 p-3 bg-white hover:bg-gray-50 transition-colors"
            >
              <p className="text-[12px] font-bold text-gray-900 inline-flex items-center gap-2">
                <MessageCircle className="w-3.5 h-3.5 text-[#00aeff]" />
                {t("pages.customerActivity.viewMessages")}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {t("pages.customerActivity.viewMessagesDesc")}
              </p>
            </Link>
          </div>

          {/* Order history */}
          <div className="lg:col-span-2 rounded-lg border border-gray-100 bg-white">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-black">
                {t("pages.customerActivity.orderHistory", { count: data.orders.length })}
              </h3>
            </div>
            {data.orders.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Package className="w-7 h-7 mx-auto mb-2 text-gray-300" />
                <p className="text-[12px]">{t("pages.customerActivity.noOrdersYet")}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {data.orders.map((o) => (
                  <div key={o._id} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[12px] font-bold text-gray-900 font-mono">
                          #{o._id.slice(-8).toUpperCase()}
                        </p>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wide ${
                            o.isPaid
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {o.isPaid ? t("pages.customerActivity.paid") : t("pages.customerActivity.pending")}
                        </span>
                        {o.channel && (
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                            {o.channel}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {formatDate(o.createdAt)} · {o.items?.length || 0} item
                        {(o.items?.length || 0) === 1 ? "" : "s"}
                      </p>
                    </div>
                    <p className="text-[14px] font-black tabular-nums text-emerald-700">
                      ฿{formatMoney(o.totalPrice)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityPage;
