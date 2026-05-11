import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Plus, Search, MoreHorizontal, ShieldCheck } from 'lucide-react';
import { fetchUsers, type AdminUser } from '@/services/adminApi';

const formatDate = (s?: string): string => {
  if (!s) return '—';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '—';
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const AdminsList = () => {
  const { t } = useTranslation('common');
  const [q, setQ] = useState('');
  const [items, setItems] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchUsers({ role: 'admin', search: q || undefined, limit: 100 })
      .then((res) => {
        if (cancelled) return;
        setItems(res.data ?? []);
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
  }, [q]);

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center gap-2">
        <Link
          href="/admins/audit"
          className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 inline-flex items-center hover:bg-gray-100"
        >
          {t('nav.auditLog')}
        </Link>
        <Link
          href="/admins/roles"
          className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 inline-flex items-center hover:bg-gray-100"
        >
          <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> {t('nav.rolesAndPermissions')}
        </Link>
        <Link
          href="/admins/invite"
          className="bg-black text-white px-3 py-1.5 rounded-md text-xs font-semibold inline-flex items-center hover:bg-gray-900"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" /> {t('pages.admins.invite.title')}
        </Link>
      </div>

      <div className="rounded-lg px-3 py-2 flex flex-wrap items-center gap-2">
        <h2 className="text-[13px] font-semibold text-gray-900">{t('pages.admins.title')}</h2>
        <div className="ml-auto relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="text"
            placeholder={t('pages.users.searchPlaceholder')}
            className="pl-7 pr-3 py-1 rounded text-[11px] w-64 bg-gray-50 border border-gray-100 focus:border-primary outline-none"
          />
        </div>
      </div>

      <div className="rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] tabular-nums">
            <thead className="text-[11px] text-gray-500 tracking-wide">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">{t('table.id')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('table.name')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('table.email')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('table.phone')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('table.twofa')}</th>
                <th className="px-4 py-2 text-left font-semibold">{t('table.joined')}</th>
                <th className="px-4 py-2 text-right font-semibold">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-[12px]">{t('status.loading')}</td></tr>
              )}
              {!loading && error && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-red-500 text-[12px]">{error}</td></tr>
              )}
              {!loading && !error && items.map((a) => (
                <tr key={a._id}>
                  <td className="px-4 py-2 font-mono text-[11px] text-gray-600">{a.customId || a._id.slice(-8).toUpperCase()}</td>
                  <td className="px-4 py-2 font-medium text-gray-900">
                    <Link href={`/users/${a._id}`} className="hover:text-primary transition-colors">
                      {a.name || a.username || '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-gray-700">{a.email}</td>
                  <td className="px-4 py-2 text-gray-700">{a.phone || '—'}</td>
                  <td className="px-4 py-2">
                    {a.twoFactorEnabled ? (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-green-50 text-green-700">{t('status.on')}</span>
                    ) : (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-red-50 text-red-700">{t('status.off')}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-gray-500 text-[11px]">{formatDate(a.createdAt)}</td>
                  <td className="px-4 py-2 text-right">
                    <Link href={`/users/${a._id}`} className="inline-block text-gray-500 hover:text-black hover:bg-gray-100 rounded p-1">
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
              {!loading && !error && items.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-[12px]">{t('pages.admins.noAdmins')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminsList;
