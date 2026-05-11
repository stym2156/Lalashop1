import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Wallet, TrendingUp, ArrowDownToLine, Loader2 } from 'lucide-react';
import { useCurrentSeller } from '@/services/useCurrentSeller';
import {
  fetchMyOrders,
  fetchMyWithdrawals,
  type SellerOrderRow,
  type SellerWithdrawalRow,
} from '@/services/sellerApi';

const formatMoney = (n: number): string =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (s?: string): string => {
  if (!s) return '—';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '—';
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const BalancePage = () => {
  const { t } = useTranslation('common');
  const { seller } = useCurrentSeller();
  const [orders, setOrders] = useState<SellerOrderRow[]>([]);
  const [withdrawals, setWithdrawals] = useState<SellerWithdrawalRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchMyOrders().catch(() => []), fetchMyWithdrawals().catch(() => [])])
      .then(([ord, wd]) => {
        if (!cancelled) {
          setOrders(ord);
          setWithdrawals(wd);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const totalRevenue = orders.filter((o) => o.isPaid).reduce((s, o) => s + o.totalPrice, 0);
  const totalWithdrawn = withdrawals
    .filter((w) => w.status === 'completed')
    .reduce((s, w) => s + w.netAmount, 0);
  const pendingWithdraw = withdrawals
    .filter((w) => w.status === 'pending' || w.status === 'approved')
    .reduce((s, w) => s + w.netAmount, 0);

  return (
    <div className="space-y-4 text-sm">
      <h1 className="text-[16px] font-bold text-gray-900">{t('pages.balancePage.title')}</h1>

      <div className="rounded-2xl bg-gradient-to-br from-[#00aeff] to-[#0096db] text-white p-6">
        <div className="flex items-center gap-2 text-white/80 text-[11px] font-semibold tracking-wide">
          <Wallet className="w-3.5 h-3.5" /> {t('pages.balancePage.availableBalance')}
        </div>
        <p className="text-[36px] font-black mt-2 tabular-nums">
          {loading ? '—' : `฿${formatMoney(seller?.balance ?? 0)}`}
        </p>
        <div className="mt-4 flex items-center gap-3 text-[11px] text-white/80">
          <span>{t('pages.balancePage.paidOrders', { count: orders.filter((o) => o.isPaid).length })}</span>
          <span>·</span>
          <span>{t('pages.balancePage.withdrawalsCount', { count: withdrawals.length })}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <KPI
          icon={TrendingUp}
          label={t('pages.balancePage.allTimeRevenue')}
          value={loading ? '—' : `฿${formatMoney(totalRevenue)}`}
          tone="text-green-700"
        />
        <KPI
          icon={ArrowDownToLine}
          label={t('pages.balancePage.totalWithdrawn')}
          value={loading ? '—' : `฿${formatMoney(totalWithdrawn)}`}
          tone="text-blue-700"
        />
        <KPI
          icon={Loader2}
          label={t('pages.balancePage.pendingWithdraw')}
          value={loading ? '—' : `฿${formatMoney(pendingWithdraw)}`}
          tone="text-orange-700"
        />
      </div>

      <div className="rounded-lg border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-[13px] font-bold text-gray-900">{t('pages.balancePage.recentWithdrawals')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] tabular-nums">
            <thead className="text-[11px] text-gray-500 tracking-wide bg-gray-50/50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">{t('pages.balancePage.tableReference')}</th>
                <th className="px-4 py-2 text-right font-semibold">{t('pages.balancePage.tableAmount')}</th>
                <th className="px-4 py-2 text-right font-semibold">{t('pages.balancePage.tableNet')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('pages.balancePage.tableBank')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('pages.balancePage.tableStatus')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('pages.balancePage.tableDate')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-[12px]">{t('status.loading')}</td></tr>
              )}
              {!loading && withdrawals.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                    {t('pages.balancePage.noWithdrawals')}
                  </td>
                </tr>
              )}
              {!loading && withdrawals.slice(0, 10).map((w) => (
                <tr key={w._id} className="border-t border-gray-50">
                  <td className="px-4 py-2 font-mono text-[11px] text-gray-600">
                    WD-{w._id.slice(-6).toUpperCase()}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-900">฿{formatMoney(w.amount)}</td>
                  <td className="px-4 py-2 text-right font-semibold text-gray-900">฿{formatMoney(w.netAmount)}</td>
                  <td className="px-4 py-2 text-gray-700 text-[11px]">
                    {w.bankAccount?.bankName || '—'}{' '}
                    {w.bankAccount?.accountNumber && (
                      <span className="font-mono text-gray-400">{w.bankAccount.accountNumber}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded capitalize ${
                      w.status === 'completed' ? 'bg-green-50 text-green-700' :
                      w.status === 'pending' || w.status === 'approved' ? 'bg-orange-50 text-orange-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {w.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-500 text-[11px]">{formatDate(w.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const KPI = ({ icon: Icon, label, value, tone }: { icon: typeof Wallet; label: string; value: string; tone: string }) => (
  <div className="rounded-lg border border-gray-100 px-4 py-3">
    <div className="flex items-center gap-1.5">
      <Icon className="w-3 h-3 text-gray-400" />
      <p className="text-[11px] font-semibold text-gray-500 tracking-wide">{label}</p>
    </div>
    <p className={`text-[20px] font-bold tabular-nums mt-1 ${tone}`}>{value}</p>
  </div>
);

export default BalancePage;
