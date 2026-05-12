import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Check, Save, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  fetchUsers,
  updateUserAdminRole,
  type AdminUser,
  type AdminRole,
} from '@/services/adminApi';

const ROLES: { id: AdminRole; name: string; description: string; permissions: string[] }[] = [
  {
    id: 'super',
    name: 'Super Admin',
    description: 'Full access — can manage admins, roles, and every module.',
    permissions: ['Manage admins', 'Manage roles', 'View audit log', 'All admin permissions'],
  },
  {
    id: 'finance',
    name: 'Finance Admin',
    description: 'Approve withdrawals, payouts, refunds and financial reports.',
    permissions: ['Approve withdrawals', 'Process payouts', 'View financial reports', 'Refund orders'],
  },
  {
    id: 'support',
    name: 'Support Admin',
    description: 'Customer support, KYC review, basic account operations.',
    permissions: ['View users', 'Reply tickets', 'View orders', 'Verify KYC'],
  },
  {
    id: 'content',
    name: 'Content Admin',
    description: 'Manage posts, banners, notifications, and marketing content.',
    permissions: ['Manage posts', 'Manage banners', 'Send notifications', 'Edit categories'],
  },
];

const RolesPage = () => {
  const { t } = useTranslation('common');
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const ROLES: { id: AdminRole; name: string; description: string; permissions: string[] }[] = [
    {
      id: 'super',
      name: t('roles.super'),
      description: t('admins.invite.roles.superDesc'),
      permissions: [
        t('admins.roles.perms.manageAdmins'),
        t('admins.roles.perms.manageRoles'),
        t('admins.roles.perms.viewAuditLog'),
        t('admins.roles.perms.allAdminPerms'),
      ],
    },
    {
      id: 'finance',
      name: t('roles.finance'),
      description: t('admins.invite.roles.financeDesc'),
      permissions: [
        t('admins.roles.perms.approveWithdrawals'),
        t('admins.roles.perms.processPayouts'),
        t('admins.roles.perms.viewFinancialReports'),
        t('admins.roles.perms.refundOrders'),
      ],
    },
    {
      id: 'support',
      name: t('roles.support'),
      description: t('admins.invite.roles.supportDesc'),
      permissions: [
        t('admins.roles.perms.viewUsers'),
        t('admins.roles.perms.replyTickets'),
        t('admins.roles.perms.viewOrders'),
        t('admins.roles.perms.verifyKyc'),
      ],
    },
    {
      id: 'content',
      name: t('roles.content'),
      description: t('admins.invite.roles.contentDesc'),
      permissions: [
        t('admins.roles.perms.managePosts'),
        t('admins.roles.perms.manageBanners'),
        t('admins.roles.perms.sendNotifications'),
        t('admins.roles.perms.editCategories'),
      ],
    },
  ];

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchUsers({ role: 'admin', limit: 200 });
      setAdmins(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admins.roles.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onAssign = async (userId: string, role: AdminRole | null) => {
    setBusyId(userId);
    try {
      await updateUserAdminRole(userId, { adminRole: role });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('admins.roles.failedToAssign'));
    } finally {
      setBusyId(null);
    }
  };

  const onRevokeAdmin = async (userId: string) => {
    if (!window.confirm(t('admins.roles.confirmRevoke'))) return;
    setBusyId(userId);
    try {
      await updateUserAdminRole(userId, { isAdmin: false });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('admins.roles.failedToRevoke'));
    } finally {
      setBusyId(null);
    }
  };

  const countByRole = ROLES.reduce<Record<string, number>>((acc, r) => {
    acc[r.id] = admins.filter((a) => (a as any).adminRole === r.id).length;
    return acc;
  }, {});

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center gap-2">
        <Link
          href="/admins"
          className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 inline-flex items-center hover:bg-gray-100"
        >
          ← {t('common.backToAdmins')}
        </Link>
      </div>

      <div className="rounded-lg bg-blue-50 px-4 py-3 text-[12px] text-blue-700">
        <strong>{t('common.note')}:</strong> {t('admins.roles.note')}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ROLES.map((r) => (
          <div key={r.id} className="rounded-lg border border-gray-100 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <h3 className="text-[13px] font-bold text-black">{r.name}</h3>
              </div>
              <span className="text-[11px] text-gray-500 font-medium">
                {t('admins.roles.adminCount', { count: countByRole[r.id] || 0 })}
              </span>
            </div>
            <p className="text-[12px] text-gray-600">{r.description}</p>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 tracking-wide mb-1.5 uppercase">{t('admins.roles.permissions')}</p>
              <ul className="space-y-1">
                {r.permissions.map((p) => (
                  <li key={p} className="flex items-center gap-1.5 text-[11px] text-gray-700">
                    <Check className="w-3 h-3 text-green-600" /> {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-[12px] font-bold text-black">{t('admins.roles.assignRoles')}</h2>
          <span className="text-[11px] text-gray-500">{t('admins.roles.adminCount', { count: admins.length })}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] tabular-nums">
            <thead className="text-[11px] text-gray-500 tracking-wide bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold uppercase">{t('common.admin')}</th>
                <th className="px-4 py-2 text-left font-semibold uppercase">{t('common.email')}</th>
                <th className="px-4 py-2 text-left font-semibold uppercase">{t('admins.roles.currentRole')}</th>
                <th className="px-4 py-2 text-right font-semibold uppercase">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                    {t('status.loading')}
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-red-500 text-[12px]">{error}</td>
                </tr>
              )}
              {!loading && !error && admins.map((a) => {
                const currentRole = (a as any).adminRole as AdminRole | undefined;
                return (
                  <tr key={a._id} className="border-t border-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-900">
                      <Link href={`/users/${a._id}`} className="hover:text-primary">
                        {a.name || a.username || '—'}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-gray-700">{a.email}</td>
                    <td className="px-4 py-2">
                      {currentRole ? (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                          {ROLES.find((r) => r.id === currentRole)?.name ?? currentRole}
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400 font-medium">{t('admins.roles.noRoleAssigned')}</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="inline-flex items-center gap-1">
                        <select
                          value={currentRole ?? ''}
                          onChange={(e) => onAssign(a._id, (e.target.value || null) as AdminRole | null)}
                          disabled={busyId === a._id}
                          className="bg-gray-100 rounded text-[11px] px-2 py-1 outline-none cursor-pointer disabled:opacity-50"
                        >
                          <option value="">— {t('admins.roles.noRole')} —</option>
                          {ROLES.map((r) => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                        <button
                          disabled={busyId === a._id}
                          onClick={() => onRevokeAdmin(a._id)}
                          title={t('admins.roles.revokeTitle')}
                          className="text-[11px] text-red-600 hover:bg-red-50 px-2 py-1 rounded disabled:opacity-30"
                        >
                          {t('actions.revoke')}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && !error && admins.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                    {t('admins.noAdmins')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RolesPage;
