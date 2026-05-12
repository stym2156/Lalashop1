import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Mail, Send, ShieldCheck, Copy, RefreshCw, X, Check, Loader2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  fetchAdminInvites,
  createAdminInvite,
  revokeAdminInvite,
  resendAdminInvite,
  type AdminInviteRow,
  type InviteRole,
  type InviteStatus,
} from '@/services/adminApi';

const ROLES: { id: InviteRole; name: string; description: string }[] = [
  { id: 'super', name: 'Super Admin', description: 'Full access — manage admins, roles, and every module.' },
  { id: 'finance', name: 'Finance Admin', description: 'Approve withdrawals, payouts, refunds, financial reports.' },
  { id: 'support', name: 'Support Admin', description: 'Customer support, KYC review, basic account ops.' },
  { id: 'content', name: 'Content Admin', description: 'Manage posts, banners, notifications, marketing.' },
];

const statusBadge: Record<InviteStatus, string> = {
  pending: 'bg-orange-50 text-orange-700',
  accepted: 'bg-green-50 text-green-700',
  revoked: 'bg-gray-100 text-gray-600',
  expired: 'bg-red-50 text-red-700',
};

const formatDate = (s?: string): string => {
  if (!s) return '—';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '—';
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const buildAcceptLink = (token: string): string => {
  if (typeof window === 'undefined') return `/accept-invite/${token}`;
  return `${window.location.origin}/accept-invite/${token}`;
};

const InviteAdminPage = () => {
  const { t } = useTranslation('common');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [roleId, setRoleId] = useState<InviteRole>('support');
  const [message, setMessage] = useState('');
  const [expiry, setExpiry] = useState(7);

  const [items, setItems] = useState<AdminInviteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const ROLES: { id: InviteRole; name: string; description: string }[] = [
    { id: 'super', name: t('roles.super'), description: t('admins.invite.roles.superDesc') },
    { id: 'finance', name: t('roles.finance'), description: t('admins.invite.roles.financeDesc') },
    { id: 'support', name: t('roles.support'), description: t('admins.invite.roles.supportDesc') },
    { id: 'content', name: t('roles.content'), description: t('admins.invite.roles.contentDesc') },
  ];

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminInvites();
      setItems(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admins.invite.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setInfo(null);
    try {
      await createAdminInvite({
        email: email.trim(),
        name: name.trim() || undefined,
        role: roleId,
        message: message.trim() || undefined,
        expiryDays: expiry,
      });
      setInfo(t('admins.invite.sentSuccess', { email: email.trim() }));
      setEmail('');
      setName('');
      setMessage('');
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('admins.invite.failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const onRevoke = async (id: string) => {
    if (!window.confirm(t('admins.invite.confirmRevoke'))) return;
    setBusyId(id);
    try {
      await revokeAdminInvite(id);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setBusyId(null);
    }
  };

  const onResend = async (id: string) => {
    setBusyId(id);
    try {
      await resendAdminInvite(id);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setBusyId(null);
    }
  };

  const onCopy = async (id: string, token: string) => {
    try {
      await navigator.clipboard.writeText(buildAcceptLink(token));
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      alert(t('common.copyFailed'));
    }
  };

  const selectedRole = ROLES.find((r) => r.id === roleId)!;
  const pendingCount = items.filter((i) => i.status === 'pending').length;

  return (
    <div className="space-y-4 text-sm">
      <Link
        href="/admins"
        className="inline-flex items-center gap-2 text-[12px] text-gray-500 hover:text-black font-medium transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> {t('common.backToAdmins')}
      </Link>

      <p className="text-[12px] text-gray-500">
        {t('admins.invite.subtitle')}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <form
          onSubmit={onSend}
          className="lg:col-span-2 rounded-lg border border-gray-100 p-5 space-y-4"
        >
          <div>
            <label className="text-[11px] font-semibold text-gray-500 tracking-wide uppercase">{t('common.email')}</label>
            <div className="relative mt-1">
              <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                placeholder="name@lalashop.com"
                className="w-full pl-8 pr-3 py-2 rounded-md text-[12px] bg-gray-50 border border-gray-100 focus:border-primary outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-gray-500 tracking-wide uppercase">
              {t('common.fullName')} <span className="text-gray-400 font-normal">({t('common.optional')})</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              placeholder="e.g. Mali Thongdy"
              className="w-full mt-1 px-3 py-2 rounded-md text-[12px] bg-gray-50 border border-gray-100 focus:border-primary outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-gray-500 tracking-wide uppercase">{t('common.role')}</label>
              <select
                value={roleId}
                onChange={(e) => setRoleId(e.target.value as InviteRole)}
                className="w-full mt-1 px-3 py-2 rounded-md text-[12px] bg-gray-50 border border-gray-100 focus:border-primary outline-none"
              >
                {ROLES.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-500 tracking-wide uppercase">{t('admins.invite.expiresIn')}</label>
              <input
                value={expiry}
                onChange={(e) => setExpiry(Math.min(Math.max(Number(e.target.value), 1), 30))}
                type="number"
                min={1}
                max={30}
                className="w-full mt-1 px-3 py-2 rounded-md text-[12px] bg-gray-50 border border-gray-100 focus:border-primary outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-gray-500 tracking-wide uppercase">
              {t('common.message')} <span className="text-gray-400 font-normal">({t('common.optional')})</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder={t('admins.invite.messagePlaceholder')}
              className="w-full mt-1 px-3 py-2 rounded-md text-[12px] bg-gray-50 border border-gray-100 focus:border-primary outline-none resize-none"
            />
          </div>

          {info && (
            <div className="rounded-md bg-green-50 px-3 py-2 text-[12px] text-green-700">{info}</div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="submit"
              disabled={submitting || !email.trim()}
              className="bg-black text-white px-4 py-2 rounded-md text-[12px] font-semibold inline-flex items-center hover:bg-gray-900 disabled:opacity-40"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1.5" />}
              {submitting ? t('common.creating') : t('admins.invite.send')}
            </button>
          </div>
        </form>

        <div className="rounded-lg border border-gray-100 p-5 space-y-3 h-fit">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <h3 className="text-[12px] font-bold text-black">{selectedRole.name}</h3>
          </div>
          <p className="text-[11px] text-gray-500">{selectedRole.description}</p>
          <Link href="/admins/roles" className="text-[11px] text-primary hover:underline">
            {t('admins.invite.viewRoleMatrix')} →
          </Link>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[12px] font-bold text-black">{t('admins.invite.invitations')}</h2>
          <span className="text-[11px] text-gray-500">{t('admins.invite.pendingCount', { count: pendingCount })}</span>
        </div>

        <div className="rounded-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] tabular-nums">
              <thead className="text-[11px] text-gray-500 tracking-wide bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold uppercase">{t('common.email')}</th>
                  <th className="px-4 py-2 text-left font-semibold uppercase">{t('common.role')}</th>
                  <th className="px-4 py-2 text-left font-semibold uppercase">{t('admins.invite.invitedBy')}</th>
                  <th className="px-4 py-2 text-left font-semibold uppercase">{t('common.sent')}</th>
                  <th className="px-4 py-2 text-left font-semibold uppercase">{t('common.expires')}</th>
                  <th className="px-4 py-2 text-left font-semibold uppercase">{t('common.status')}</th>
                  <th className="px-4 py-2 text-right font-semibold uppercase">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                      {t('admins.invite.loading')}
                    </td>
                  </tr>
                )}
                {!loading && error && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-red-500 text-[12px]">{error}</td>
                  </tr>
                )}
                {!loading && !error && items.map((inv) => {
                  const role = ROLES.find((r) => r.id === inv.role)!;
                  return (
                    <tr key={inv._id} className="border-t border-gray-50">
                      <td className="px-4 py-2 font-medium text-gray-900">{inv.email}</td>
                      <td className="px-4 py-2 text-gray-700">{role?.name ?? inv.role}</td>
                      <td className="px-4 py-2 text-gray-500 text-[11px]">
                        {inv.invitedBy?.name || inv.invitedBy?.email || '—'}
                      </td>
                      <td className="px-4 py-2 text-gray-500 text-[11px]">{formatDate(inv.createdAt)}</td>
                      <td className="px-4 py-2 text-gray-500 text-[11px]">{formatDate(inv.expiresAt)}</td>
                      <td className="px-4 py-2">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${statusBadge[inv.status]}`}>
                          {t(`status.${inv.status}`, inv.status)}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          {inv.status === 'pending' && (
                            <button
                              onClick={() => onCopy(inv._id, inv.token)}
                              title={t('admins.invite.copyLink')}
                              className="text-gray-500 hover:text-black hover:bg-gray-100 rounded p-1"
                            >
                              {copiedId === inv._id ? (
                                <Check className="w-3.5 h-3.5 text-green-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                          {(inv.status === 'expired' || inv.status === 'revoked') && (
                            <button
                              disabled={busyId === inv._id}
                              onClick={() => onResend(inv._id)}
                              title={t('actions.resend')}
                              className="text-gray-500 hover:text-blue-700 hover:bg-gray-100 rounded p-1 disabled:opacity-30"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {inv.status === 'pending' && (
                            <button
                              disabled={busyId === inv._id}
                              onClick={() => onRevoke(inv._id)}
                              title={t('actions.revoke')}
                              className="text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded p-1 disabled:opacity-30"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!loading && !error && items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                      {t('admins.invite.noInvites')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteAdminPage;
