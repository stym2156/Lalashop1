import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Search, ChevronRight, User, ChevronDown } from 'lucide-react';
import { fetchKycSubmissions, type AdminKycSubmission, type KycStatus } from '@/services/adminApi';

type StatusFilter = 'all' | KycStatus;

const statusBadge: Record<KycStatus, string> = {
  pending: 'bg-orange-50 text-orange-700',
  approved: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
};

const statusLabelKey: Record<KycStatus, string> = {
  pending: 'status.pending',
  approved: 'status.approved',
  rejected: 'status.rejected',
};

const businessTypeKey: Record<string, string> = {
  individual: 'kyc.businessTypes.individual',
  sole_proprietor: 'kyc.businessTypes.sole_proprietor',
  corporate: 'kyc.businessTypes.corporate',
  partnership: 'kyc.businessTypes.partnership',
};

const formatDateTime = (iso?: string): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const fullName = (sub: AdminKycSubmission): string => {
  const parts = [sub.identity.firstName, sub.identity.middleName, sub.identity.lastName]
    .filter((s) => s && s.trim() !== '');
  if (parts.length > 0) return parts.join(' ');
  return sub.user?.name || sub.user?.username || sub.user?.email || '—';
};

const KycListPage = () => {
  const { t } = useTranslation('common');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [submissions, setSubmissions] = useState<AdminKycSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchKycSubmissions({
        status: filter === 'all' ? undefined : filter,
        search: q.trim() || undefined,
      });
      setSubmissions(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('kyc.failedToLoad'));
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [filter, q]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tabs: StatusFilter[] = ['all', 'pending', 'approved', 'rejected'];

  return (
    <div className="space-y-4 text-sm">
      <div className="rounded-lg px-3 py-2 flex flex-wrap items-center gap-2">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 min-w-[100px] justify-between"
          >
            <span>{filter === 'all' ? t('common.all') : t(statusLabelKey[filter as KycStatus])}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          {open && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-100 rounded-md shadow-md py-1 z-10 min-w-[120px]">
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
                  {tabKey === 'all' ? t('common.all') : t(statusLabelKey[tabKey as KycStatus])}
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="text-[11px] text-gray-500">
          {loading ? t('status.loadingShort') : t('kyc.submissionsCount', { count: submissions.length })}
        </span>

        <div className="ml-auto relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="text"
            placeholder={t('kyc.searchPlaceholder')}
            className="pl-7 pr-3 py-1 rounded text-[11px] w-64 bg-gray-50 border border-gray-100 focus:border-primary outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg px-4 py-2.5 bg-red-50 text-red-700 text-[12px]">
          {error}
        </div>
      )}

      <div className="rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] tabular-nums">
            <thead className="text-[11px] text-gray-500 tracking-wide">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">{t('table.kycId')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('table.shop')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('table.applicant')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('table.businessType')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('table.submittedAt')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('table.status')}</th>
                <th className="px-4 py-2 text-right font-semibold">{t('table.action')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && submissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-[11px]">
                    {t('kyc.loadingSubmissions')}
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-[11px]">
                    {t('kyc.noMatch')}
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr key={sub._id}>
                    <td className="px-4 py-2 font-mono text-[11px] text-gray-600">
                      {sub._id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-4 py-2 font-medium text-gray-900">
                      {sub.shopInfo.shopName}
                    </td>
                    <td className="px-4 py-2 text-gray-700">
                      <span className="inline-flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        {fullName(sub)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-700 capitalize">
                      {businessTypeKey[sub.businessType] ? t(businessTypeKey[sub.businessType]) : sub.businessType}
                    </td>
                    <td className="px-4 py-2 text-gray-500 text-[11px]">
                      {formatDateTime(sub.submittedAt || sub.createdAt)}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${statusBadge[sub.status]}`}>
                        {t(statusLabelKey[sub.status])}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Link
                        href={`/kyc/kycverification?id=${sub._id}`}
                        className="inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline"
                      >
                        {t('kyc.review')} <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default KycListPage;
