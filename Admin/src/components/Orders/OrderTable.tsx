import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  Search, Calendar, ChevronDown, Receipt, Check, X, Loader2, ExternalLink,
} from 'lucide-react';
import {
  fetchAdminOrders,
  reviewAdminSlip,
  type AdminOrderRow,
  type AdminOrderStatus,
} from '@/services/adminApi';

export type OrderStatus = AdminOrderStatus;
export type Order = AdminOrderRow;

const statusBadge: Record<OrderStatus, string> = {
  paid: 'bg-blue-50 text-blue-700',
  shipping: 'bg-purple-50 text-purple-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-gray-100 text-gray-600',
  refunded: 'bg-cyan-50 text-cyan-700',
  disputed: 'bg-red-50 text-red-700',
  pending_payment: 'bg-orange-50 text-orange-700',
};

const statusLabelKey: Record<OrderStatus, string> = {
  paid: 'status.paid',
  shipping: 'status.shipping',
  delivered: 'status.delivered',
  cancelled: 'status.cancelled',
  refunded: 'status.refunded',
  disputed: 'status.disputed',
  pending_payment: 'status.pendingPayment',
};

const formatCurrency = (n: number): string =>
  Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

const formatDate = (s?: string): string => {
  if (!s) return '—';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '—';
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

interface OrderTableProps {
  initialFilter?: 'all' | OrderStatus;
  hideFilters?: boolean;
}

const OrderTable = ({ initialFilter = 'all', hideFilters = false }: OrderTableProps) => {
  const { t } = useTranslation('common');
  const [filter, setFilter] = useState<'all' | OrderStatus>(initialFilter);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busySlipId, setBusySlipId] = useState<string | null>(null);
  // Reject modal — admin must enter a reason that's then sent to the buyer
  // as a notification so they know what to fix on the next slip upload.
  const [rejectFor, setRejectFor] = useState<{ orderId: string; slipId: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);
  // Lightbox for viewing slip image full-size in the same page (clicking the
  // thumbnail keeps the admin in context instead of opening a new tab).
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchAdminOrders({
      status: filter === 'all' ? undefined : filter,
      search: q || undefined,
      limit: 100,
    })
      .then((res) => {
        if (cancelled) return;
        setOrders(res.data ?? []);
        setTotal(res.meta?.total ?? 0);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message || t('pages.orders.failedToLoad'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filter, q]);

  const tabs: ('all' | OrderStatus)[] = useMemo(
    () => ['all', 'paid', 'shipping', 'delivered', 'disputed'],
    []
  );

  // Verify a slip — flips the underlying order to paid+processing on the
  // server and credits the seller's balance. Refresh locally afterwards so
  // the row's status badge / actions update without a full reload.
  const handleApprove = async (slipId: string) => {
    setBusySlipId(slipId);
    try {
      await reviewAdminSlip(slipId, { action: 'verify' });
      const res = await fetchAdminOrders({
        status: filter === 'all' ? undefined : filter,
        search: q || undefined,
        limit: 100,
      });
      setOrders(res.data ?? []);
    } catch (err) {
      alert(err instanceof Error ? err.message : t('pages.orders.rejectModal.approveFailed'));
    } finally {
      setBusySlipId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectFor) return;
    if (!rejectReason.trim()) {
      setRejectError(t('pages.orders.rejectModal.missingReason'));
      return;
    }
    setBusySlipId(rejectFor.slipId);
    setRejectError(null);
    try {
      await reviewAdminSlip(rejectFor.slipId, {
        action: 'reject',
        reason: rejectReason.trim(),
      });
      setRejectFor(null);
      setRejectReason('');
      const res = await fetchAdminOrders({
        status: filter === 'all' ? undefined : filter,
        search: q || undefined,
        limit: 100,
      });
      setOrders(res.data ?? []);
    } catch (err) {
      setRejectError(err instanceof Error ? err.message : t('pages.orders.rejectModal.rejectFailed'));
    } finally {
      setBusySlipId(null);
    }
  };

  return (
    <>
      <div className="rounded-lg px-3 py-2 flex flex-wrap items-center gap-2">
        {!hideFilters && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen(!open)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 min-w-[100px] justify-between"
            >
              <span>{filter === 'all' ? t('common.all') : t(statusLabelKey[filter as OrderStatus])}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
              <div className="absolute top-full left-0 mt-1 bg-white  border-gray-100 rounded-md shadow-md py-1 z-10 min-w-[120px]">
                {tabs.map((tabKey) => (
                  <button
                    key={tabKey}
                    onClick={() => { setFilter(tabKey); setOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                      filter === tabKey
                        ? 'bg-gray-50 text-black'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-black'
                    }`}
                  >
                    {tabKey === 'all' ? t('common.all') : t(statusLabelKey[tabKey as OrderStatus])}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <button className="inline-flex items-center text-[11px] font-medium text-gray-700 px-2 py-1 rounded">
          <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-400" /> {t('table.dateRange')}
        </button>

        <div className="ml-auto relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="text"
            placeholder={t('pages.orders.searchPlaceholder')}
            className="pl-7 pr-3 py-1 rounded text-[11px] w-64 bg-gray-50 border border-gray-100 focus:border-primary outline-none"
          />
        </div>
      </div>

      <div className="rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] tabular-nums">
            <thead className="text-[11px] text-gray-500 tracking-wide">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">{t('table.orderId')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('table.user')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('table.shop')}</th>
                <th className="px-4 py-2 text-right font-semibold">{t('table.order')}</th>
                <th className="px-4 py-2 text-right font-semibold">{t('table.amountKip')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('table.payment')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('table.slip')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('table.createdAt')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('table.status')}</th>
                <th className="px-4 py-2 text-right font-semibold">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                    {t('pages.orders.loadingOrders')}
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-red-500 text-[12px]">
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && orders.map((o) => {
                const slip = o.slip;
                const isPendingSlip = slip?.status === 'pending';
                const isThisBusy = busySlipId === slip?._id;
                const userLink = o.customerUserId || o.customerId;
                return (
                <tr key={o._id} className="border-t border-gray-50">
                  <td className="px-4 py-2 font-mono text-[11px] text-gray-600">
                    <Link href={`/orders/${o._id}`} className="hover:text-primary transition-colors">
                      {o._id.slice(-8).toUpperCase()}
                    </Link>
                  </td>
                  <td className="px-4 py-2 font-medium text-gray-900">
                    {userLink ? (
                      <Link href={`/users/${userLink}`} className="hover:text-primary transition-colors">
                        {o.customer}
                      </Link>
                    ) : (
                      o.customer
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {o.shopId ? (
                      <Link href={`/shops/${o.shopId}`} className="text-gray-700 hover:text-primary transition-colors">
                        {o.shop}
                      </Link>
                    ) : (
                      <span className="text-gray-700">{o.shop}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {/* Click the count to jump straight to the items list in the order detail page. */}
                    <Link
                      href={`/orders/${o._id}`}
                      className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full  text-primary text-[11px] font-bold tabular-nums transition-colors"
                    >
                      {o.itemCount}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-right font-semibold text-gray-900">{t("common.currencySymbol", "฿")}{formatCurrency(o.amount)}</td>
                  <td className="px-4 py-2 text-gray-700">{o.paymentMethod}</td>
                  <td className="px-4 py-2">
                    {/* Slip thumbnail — click to lightbox. Pill colour mirrors slip.status. */}
                    {slip ? (
                      <button
                        type="button"
                        onClick={() => setSlipPreview(slip.slipImageUrl)}
                        className="group inline-flex items-center gap-2 hover:opacity-90"
                        title={t('pages.orders.viewSlip')}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={slip.slipImageUrl}
                          alt={t('pages.orders.slipAlt')}
                          className="w-9 h-9 rounded object-cover border border-gray-200"
                        />
                        <span
                          className={`text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded ${
                            slip.status === 'verified'
                              ? 'bg-emerald-50 text-emerald-700'
                              : slip.status === 'rejected'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {slip.status}
                        </span>
                      </button>
                    ) : (
                      <span className="text-gray-400 text-[11px]">{t('pages.orders.noSlip')}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-gray-500 text-[11px]">{formatDate(o.createdAt)}</td>
                  <td className="px-4 py-2">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${statusBadge[o.status]}`}>
                      {t(statusLabelKey[o.status])}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="inline-flex items-center justify-end gap-1">
                      {isPendingSlip ? (
                        <>
                          <button
                            type="button"
                            disabled={isThisBusy}
                            onClick={() => handleApprove(slip!._id)}
                            title={t('pages.orders.approveTitle')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {isThisBusy ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                            {t('actions.approve')}
                          </button>
                          <button
                            type="button"
                            disabled={isThisBusy}
                            onClick={() => {
                              setRejectFor({ orderId: o._id, slipId: slip!._id });
                              setRejectReason('');
                              setRejectError(null);
                            }}
                            title={t('pages.orders.rejectTitle')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 disabled:opacity-50"
                          >
                            <X className="w-3 h-3" />
                            {t('actions.reject')}
                          </button>
                        </>
                      ) : slip ? (
                        <span className="text-gray-400 text-[10px] font-medium tracking-wide">
                          {slip.status}
                        </span>
                      ) : (
                        <Link
                          href={`/orders/${o._id}`}
                          className="text-gray-400 hover:text-primary text-[11px] inline-flex items-center gap-1"
                        >
                          <Receipt className="w-3 h-3" /> {t('actions.detail')}
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
              {!loading && !error && orders.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                    {t('pages.orders.noMatch')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-2.5 text-[11px] text-gray-500">
          <span>{t('pages.orders.showing', { shown: orders.length, total })}</span>
          <div className="flex items-center gap-1">
            <button className="px-2.5 py-1 rounded text-[11px] font-medium text-gray-400 cursor-not-allowed">{t('actions.prev')}</button>
            <button className="px-2.5 py-1 rounded text-[11px] font-medium text-gray-700">{t('actions.next')}</button>
          </div>
        </div>
      </div>

      {/* Slip lightbox — click anywhere to close, ESC also fine via blur. */}
      {slipPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSlipPreview(null)}
        >
          <div className="relative max-w-2xl max-h-[90vh]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slipPreview}
              alt={t('pages.orders.transferSlipAlt')}
              className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain bg-white"
            />
            <a
              href={slipPreview}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded bg-white/90 hover:bg-white text-xs font-bold text-gray-800"
            >
              <ExternalLink className="w-3 h-3" /> {t('actions.open')}
            </a>
          </div>
        </div>
      )}

      {/* Reject modal — admin must enter a reason. Buyer receives this in
          their notification feed and can re-upload a clearer slip. */}
      {rejectFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="text-[14px] font-bold">{t('pages.orders.rejectModal.title')}</h3>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-[12px] text-gray-600">
                {t('pages.orders.rejectModal.description')}
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder={t('pages.orders.rejectModal.placeholder')}
                className="w-full px-3 py-2 rounded border border-gray-200 focus:border-primary outline-none text-[12px]"
              />
              {rejectError && (
                <p className="rounded px-3 py-2 bg-red-50 text-red-700 text-[11px]">
                  {rejectError}
                </p>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-100">
              <button
                onClick={() => setRejectFor(null)}
                disabled={busySlipId !== null}
                className="px-3 py-1.5 rounded text-[11px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50"
              >
                {t('actions.cancel')}
              </button>
              <button
                onClick={handleReject}
                disabled={busySlipId !== null || !rejectReason.trim()}
                className="px-4 py-1.5 rounded text-[11px] font-bold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 inline-flex items-center gap-1"
              >
                {busySlipId !== null ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : null}
                {busySlipId !== null ? t('pages.orders.rejectModal.rejectingShort') : t('pages.orders.rejectModal.rejectButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderTable;
