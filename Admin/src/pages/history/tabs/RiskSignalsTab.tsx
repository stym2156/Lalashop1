import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { fetchHistoryRiskSignals } from '@/services/adminApi';
import { useTranslation } from 'react-i18next';

interface RiskRow {
  _id: string;
  count: number;
  lastAt: string;
  totalRejected: number;
  user?: { _id: string; name?: string; email?: string; customId?: string };
}

const formatMoney = (n: number): string =>
  Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

const formatDate = (s?: string): string => {
  if (!s) return '—';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '—';
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const severityFor = (count: number): 'critical' | 'high' | 'medium' | 'low' => {
  if (count >= 5) return 'critical';
  if (count >= 3) return 'high';
  if (count >= 2) return 'medium';
  return 'low';
};

const sevBadge: Record<string, { cls: string; icon: typeof AlertTriangle }> = {
  critical: { cls: 'bg-red-50 text-red-700 border-l-red-500', icon: AlertTriangle },
  high: { cls: 'bg-orange-50 text-orange-700 border-l-orange-500', icon: AlertCircle },
  medium: { cls: 'bg-amber-50 text-amber-700 border-l-amber-500', icon: AlertCircle },
  low: { cls: 'bg-blue-50 text-blue-700 border-l-blue-500', icon: AlertCircle },
};

const RiskSignalsTab = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<RiskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchHistoryRiskSignals()
      .then((res) => {
        if (cancelled) return;
        setItems((res.data ?? []) as RiskRow[]);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const counts = items.reduce<Record<string, number>>((acc, r) => {
    const sev = severityFor(r.count);
    acc[sev] = (acc[sev] || 0) + 1;
    return acc;
  }, {});

  if (loading) return <div className="px-4 py-12 text-center text-gray-400 text-[12px]">{t('pages.history.riskSignals.loading')}</div>;
  if (error) return <div className="px-4 py-12 text-center text-red-500 text-[12px]">{error}</div>;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 px-4 py-3 bg-gray-50/50 text-[11px]">
        <div>
          <p className="text-gray-500">{t('pages.history.riskSignals.critical')}</p>
          <p className="text-base font-bold tabular-nums text-red-700">{counts.critical || 0}</p>
        </div>
        <div>
          <p className="text-gray-500">{t('pages.history.riskSignals.high')}</p>
          <p className="text-base font-bold tabular-nums text-orange-700">{counts.high || 0}</p>
        </div>
        <div>
          <p className="text-gray-500">{t('pages.history.riskSignals.medium')}</p>
          <p className="text-base font-bold tabular-nums text-amber-700">{counts.medium || 0}</p>
        </div>
        <div>
          <p className="text-gray-500">{t('pages.history.riskSignals.low')}</p>
          <p className="text-base font-bold tabular-nums text-blue-700">{counts.low || 0}</p>
        </div>
        <div>
          <p className="text-gray-500">{t('pages.history.riskSignals.totalSignals')}</p>
          <p className="text-base font-bold tabular-nums">{items.length}</p>
        </div>
      </div>

      <div className="space-y-2 px-4">
        {items.length === 0 && (
          <div className="py-8 text-center text-gray-400 text-[12px]">{t('pages.history.riskSignals.noSignals')}</div>
        )}
        {items.map((r) => {
          const sev = severityFor(r.count);
          const S = sevBadge[sev];
          const Icon = S.icon;
          return (
            <div key={r._id} className={`border-l-4 px-3 py-2 rounded text-[12px] ${S.cls}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">
                      {r.count} {t('pages.history.riskSignals.rejectedFrom')}{' '}
                      {r.user?._id ? (
                        <Link href={`/users/${r.user._id}`} className="underline hover:text-primary">
                          {r.user?.name || r.user?.email}
                        </Link>
                      ) : t('pages.history.riskSignals.unknownUser')}
                    </p>
                    <p className="text-gray-700 mt-0.5">
                      {t('pages.history.riskSignals.totalRejectedAmount')} {formatMoney(r.totalRejected)} ₭ — {t('pages.history.riskSignals.lastAttempt')} {formatDate(r.lastAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right text-[11px] shrink-0">
                  <div className="font-semibold capitalize">{sev}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RiskSignalsTab;
