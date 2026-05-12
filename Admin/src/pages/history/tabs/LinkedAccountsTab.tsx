import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchHistoryLinkedAccounts } from '@/services/adminApi';

interface LinkedRow {
  _id: string;
  name?: string;
  email?: string;
  customId?: string;
  googleId?: string;
  facebookId?: string;
}

const LinkedAccountsTab = () => {
  const { t } = useTranslation('common');
  const [items, setItems] = useState<LinkedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchHistoryLinkedAccounts({ limit: 100 })
      .then((res) => {
        if (cancelled) return;
        setItems((res.data ?? []) as LinkedRow[]);
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

  const googleCount = items.filter((u) => u.googleId).length;
  const fbCount = items.filter((u) => u.facebookId).length;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 px-4 py-3 bg-gray-50/50 text-[11px]">
        <div>
          <p className="text-gray-500">{t('pages.history.history.linkedAccounts.linkedAccountsLabel')}</p>
          <p className="text-base font-bold tabular-nums">{items.length}</p>
        </div>
        <div>
          <p className="text-gray-500">Google</p>
          <p className="text-base font-bold tabular-nums">{googleCount}</p>
        </div>
        <div>
          <p className="text-gray-500">Facebook</p>
          <p className="text-base font-bold tabular-nums">{fbCount}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[12px] tabular-nums">
          <thead className="text-[11px] text-gray-500 tracking-wide">
            <tr>
              <th className="px-4 py-2 text-left font-semibold">{t('pages.history.history.linkedAccounts.thUser')}</th>
              <th className="px-4 py-2 text-left font-semibold">{t('pages.history.history.linkedAccounts.thEmail')}</th>
              <th className="px-4 py-2 text-left font-semibold">{t('pages.history.history.linkedAccounts.thProviders')}</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={3} className="px-4 py-12 text-center text-gray-400 text-[12px]">{t('pages.history.history.linkedAccounts.loading')}</td></tr>
            )}
            {!loading && error && (
              <tr><td colSpan={3} className="px-4 py-12 text-center text-red-500 text-[12px]">{error}</td></tr>
            )}
            {!loading && !error && items.map((u) => (
              <tr key={u._id} className="border-t border-gray-50">
                <td className="px-4 py-2">
                  <Link href={`/users/${u._id}`} className="font-medium text-gray-900 hover:text-primary transition-colors">
                    {u.name || u.email}
                  </Link>
                  {u.customId && <div className="font-mono text-[11px] text-gray-500">{u.customId}</div>}
                </td>
                <td className="px-4 py-2 text-gray-700">
                  <span className="inline-flex items-center gap-1">
                    <Mail className="w-3 h-3 text-gray-400" /> {u.email}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {u.googleId && (
                      <span className="inline-flex items-center gap-1 text-[11px] bg-red-50 text-red-700 px-2 py-0.5 rounded">
                        <Globe className="w-3 h-3" /> Google
                      </span>
                    )}
                    {u.facebookId && (
                      <span className="inline-flex items-center gap-1 text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                        <Globe className="w-3 h-3" /> Facebook
                      </span>
                    )}
                    {!u.googleId && !u.facebookId && <span className="text-gray-300 text-[11px]">{t('pages.history.history.linkedAccounts.none')}</span>}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && !error && items.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-12 text-center text-gray-400 text-[12px]">{t('pages.history.history.linkedAccounts.noAccounts')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LinkedAccountsTab;
