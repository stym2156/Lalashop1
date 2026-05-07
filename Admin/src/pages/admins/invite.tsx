import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Mail, Send, ShieldCheck, Copy, RefreshCw, X, Check, Loader2,
} from 'lucide-react';
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

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminInvites();
      setItems(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invites');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
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
      setInfo(`Invitation created for ${email}. Copy the accept link from the table below to share.`);
      setEmail('');
      setName('');
      setMessage('');
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create invite');
    } finally {
      setSubmitting(false);
    }
  };

  const onRevoke = async (id: string) => {
    if (!window.confirm('Revoke this invitation?')) return;
    setBusyId(id);
    try {
      await revokeAdminInvite(id);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
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
      alert(err instanceof Error ? err.message : 'Action failed');
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
      alert('Failed to copy. Please copy manually.');
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
        <ArrowLeft className="w-3.5 h-3.5" /> Back to admins
      </Link>

      <p className="text-[12px] text-gray-500">
        Invite a teammate. Once accepted via the link, the user becomes an admin with the role you assigned.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <form
          onSubmit={onSend}
          className="lg:col-span-2 rounded-lg border border-gray-100 p-5 space-y-4"
        >
          <div>
            <label className="text-[11px] font-semibold text-gray-500 tracking-wide">EMAIL</label>
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
            <label className="text-[11px] font-semibold text-gray-500 tracking-wide">
              FULL NAME <span className="text-gray-400 font-normal">(optional)</span>
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
              <label className="text-[11px] font-semibold text-gray-500 tracking-wide">ROLE</label>
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
              <label className="text-[11px] font-semibold text-gray-500 tracking-wide">EXPIRES IN (DAYS)</label>
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
            <label className="text-[11px] font-semibold text-gray-500 tracking-wide">
              MESSAGE <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Add a note that will be shared with the invitee..."
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
              {submitting ? 'Creating...' : 'Send Invitation'}
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
            View role matrix →
          </Link>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[12px] font-bold text-black">Invitations</h2>
          <span className="text-[11px] text-gray-500">{pendingCount} pending</span>
        </div>

        <div className="rounded-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] tabular-nums">
              <thead className="text-[11px] text-gray-500 tracking-wide bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Email</th>
                  <th className="px-4 py-2 text-left font-semibold">Role</th>
                  <th className="px-4 py-2 text-left font-semibold">Invited By</th>
                  <th className="px-4 py-2 text-left font-semibold">Sent</th>
                  <th className="px-4 py-2 text-left font-semibold">Expires</th>
                  <th className="px-4 py-2 text-left font-semibold">Status</th>
                  <th className="px-4 py-2 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                      Loading invites...
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
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          {inv.status === 'pending' && (
                            <button
                              onClick={() => onCopy(inv._id, inv.token)}
                              title="Copy accept link"
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
                              title="Resend"
                              className="text-gray-500 hover:text-blue-700 hover:bg-gray-100 rounded p-1 disabled:opacity-30"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {inv.status === 'pending' && (
                            <button
                              disabled={busyId === inv._id}
                              onClick={() => onRevoke(inv._id)}
                              title="Revoke"
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
                      No invitations yet
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
