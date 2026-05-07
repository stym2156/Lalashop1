import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  ArrowLeft, Wallet, User, Building, Hash, FileText, Save, Check, X,
  Loader2, Banknote, Clock,
} from 'lucide-react';
import {
  fetchAdminWithdrawal,
  processAdminWithdrawal,
  type AdminWithdrawRow,
  type WithdrawStatus,
} from '@/services/adminApi';

const statusBadge: Record<WithdrawStatus, string> = {
  pending: 'bg-orange-50 text-orange-700',
  approved: 'bg-blue-50 text-blue-700',
  completed: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
  failed: 'bg-red-50 text-red-700',
};

const statusLabel: Record<WithdrawStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  completed: 'Completed',
  rejected: 'Rejected',
  failed: 'Failed',
};

const formatMoney = (n: number): string =>
  Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

const formatDate = (s?: string): string => {
  if (!s) return '—';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '—';
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const WithdrawalDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [item, setItem] = useState<AdminWithdrawRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const load = async (withdrawalId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminWithdrawal(withdrawalId);
      const data = res.data ?? null;
      setItem(data);
      if (data) {
        setReference(data.reference ?? '');
        setAdminNote(data.adminNote ?? '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load withdrawal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof id !== 'string') return;
    load(id);
  }, [id]);

  const onProcess = async (decision: 'approve' | 'reject' | 'complete' | 'fail') => {
    if (typeof id !== 'string') return;
    if (decision === 'reject' || decision === 'fail') {
      const ok = window.confirm(
        decision === 'reject'
          ? 'Reject this withdrawal? The amount will be refunded to the user balance.'
          : 'Mark this withdrawal as failed? The amount will be refunded to the user balance.',
      );
      if (!ok) return;
    }
    setBusy(true);
    setSavedMessage(null);
    try {
      await processAdminWithdrawal(id, {
        decision,
        reference: decision === 'complete' ? (reference || undefined) : undefined,
        adminNote: adminNote || undefined,
      });
      await load(id);
      setSavedMessage(`Marked as ${decision}d`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center">
        <Loader2 className="w-6 h-6 mx-auto animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="space-y-4 text-sm">
        <button
          onClick={() => router.push('/withdrawpage/Seller/SellerWithdrawals')}
          className="inline-flex items-center gap-2 text-[12px] text-gray-500 hover:text-black font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to withdrawals
        </button>
        <div className="rounded-lg bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {error || 'Withdrawal not found'}
        </div>
      </div>
    );
  }

  const user = item.user;
  const bank = item.bankAccount;
  const isPending = item.status === 'pending';
  const isApproved = item.status === 'approved';
  const isFinal = item.status === 'completed' || item.status === 'rejected' || item.status === 'failed';

  return (
    <div className="space-y-4 text-sm">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-[12px] text-gray-500 hover:text-black font-medium transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2.5 rounded-lg bg-gray-100">
            <Wallet className="w-4 h-4 text-gray-500" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[16px] font-bold text-gray-900">
              WD-{item._id.slice(-6).toUpperCase()}
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${statusBadge[item.status]}`}>
                {statusLabel[item.status]}
              </span>
              <span className="text-[11px] text-gray-500">Requested {formatDate(item.createdAt)}</span>
              {item.processedAt && (
                <span className="text-[11px] text-gray-500">· Processed {formatDate(item.processedAt)}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {isPending && (
            <>
              <button
                disabled={busy}
                onClick={() => onProcess('approve')}
                className="px-3 py-1.5 rounded-md text-xs font-semibold text-blue-700 bg-blue-50 inline-flex items-center hover:bg-blue-100 disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5 mr-1.5" /> Approve
              </button>
              <button
                disabled={busy}
                onClick={() => onProcess('reject')}
                className="px-3 py-1.5 rounded-md text-xs font-semibold text-red-600 bg-red-50 inline-flex items-center hover:bg-red-100 disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5 mr-1.5" /> Reject
              </button>
            </>
          )}
          {isApproved && (
            <>
              <button
                disabled={busy}
                onClick={() => onProcess('complete')}
                className="px-3 py-1.5 rounded-md text-xs font-semibold text-green-700 bg-green-50 inline-flex items-center hover:bg-green-100 disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5 mr-1.5" /> Mark Paid
              </button>
              <button
                disabled={busy}
                onClick={() => onProcess('fail')}
                className="px-3 py-1.5 rounded-md text-xs font-semibold text-red-600 bg-red-50 inline-flex items-center hover:bg-red-100 disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5 mr-1.5" /> Mark Failed
              </button>
            </>
          )}
          {isFinal && (
            <span className="text-[11px] text-gray-400 font-medium">No further actions available</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Section icon={Banknote} title="Amount">
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Amount" value={`฿${formatMoney(item.amount)}`} tone="text-black" />
              <Stat label="Fee" value={`฿${formatMoney(item.fee)}`} tone="text-gray-700" />
              <Stat label="Net to user" value={`฿${formatMoney(item.netAmount)}`} tone="text-green-700" />
            </div>
          </Section>

          <Section icon={Building} title="Bank account">
            {bank ? (
              <div className="space-y-2">
                <Row label="Bank name" value={bank.bankName} />
                <Row label="Account number" value={bank.accountNumber} mono />
                <Row label="Account name" value={bank.accountName} />
                <Row
                  label="Verified"
                  value={
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                        bank.isVerified ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {bank.isVerified ? 'verified' : 'unverified'}
                    </span>
                  }
                />
              </div>
            ) : (
              <p className="text-[12px] text-gray-400">Bank account not on file</p>
            )}
          </Section>

          <Section icon={FileText} title="Admin processing note">
            <div className="space-y-3">
              {(isApproved || item.status === 'completed') && (
                <label className="block">
                  <span className="text-[11px] font-semibold text-gray-500 tracking-wide">
                    BANK TRANSFER REFERENCE
                  </span>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="e.g. TXN-882910 (used when marking as paid)"
                    className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-md text-[12px] outline-none focus:border-primary"
                  />
                </label>
              )}

              <label className="block">
                <span className="text-[11px] font-semibold text-gray-500 tracking-wide">
                  ADMIN NOTE
                </span>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={3}
                  placeholder="Internal notes about this withdrawal..."
                  className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-md text-[12px] outline-none focus:border-primary resize-none"
                />
              </label>

              <div className="flex items-center justify-end gap-2">
                {savedMessage && (
                  <span className="text-[12px] text-green-700 font-medium">{savedMessage}</span>
                )}
                <button
                  disabled={busy || isFinal}
                  onClick={async () => {
                    if (isApproved) {
                      await onProcess('complete');
                    } else if (isPending) {
                      // For pending: just update note via approve/reject? We allow note save through approve+reject buttons.
                      alert('Use Approve or Reject to save note while withdrawal is pending');
                    }
                  }}
                  className="bg-black text-white px-3 py-1.5 rounded-md text-xs font-semibold inline-flex items-center hover:bg-gray-900 disabled:opacity-50"
                  title={isFinal ? 'Final state — note locked' : 'Save & complete'}
                >
                  <Save className="w-3.5 h-3.5 mr-1.5" /> Save
                </button>
              </div>
            </div>
          </Section>
        </div>

        <div className="space-y-4">
          <Section icon={User} title="User">
            {user ? (
              <>
                <Row label="Name" value={user.name || '—'} />
                {user.email && <Row label="Email" value={user.email} />}
                {user.customId && <Row label="Custom ID" value={user.customId} mono />}
                {user.seller_type && <Row label="Seller type" value={user.seller_type} />}
                <Link
                  href={`/users/${user._id}`}
                  className="block mt-3 px-3 py-2 rounded-md text-xs font-medium text-center bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  Open user profile →
                </Link>
              </>
            ) : (
              <p className="text-[12px] text-gray-400">User not available</p>
            )}
          </Section>

          <Section icon={Hash} title="Reference">
            <Row label="Withdrawal ID" value={item._id} mono />
            <Row label="Reference" value={item.reference || '—'} mono />
            <Row label="Status" value={
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${statusBadge[item.status]}`}>
                {statusLabel[item.status]}
              </span>
            } />
          </Section>

          <Section icon={Clock} title="Timeline">
            <Row label="Requested" value={formatDate(item.createdAt)} />
            {item.processedAt && <Row label="Processed" value={formatDate(item.processedAt)} />}
            <Row label="Last updated" value={formatDate(item.updatedAt)} />
          </Section>
        </div>
      </div>
    </div>
  );
};

const Section = ({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof User;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-lg border border-gray-100 p-4 space-y-2">
    <div className="flex items-center gap-2 mb-1">
      <Icon className="w-3.5 h-3.5 text-gray-400" />
      <h3 className="text-[11px] font-semibold text-gray-500 tracking-wide">{title}</h3>
    </div>
    {children}
  </div>
);

const Row = ({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) => (
  <div className="flex items-start justify-between gap-3">
    <span className="text-[11px] text-gray-500 flex-shrink-0">{label}</span>
    <span className={`text-[12px] text-gray-900 truncate text-right ${mono ? 'font-mono text-[11px]' : ''}`}>
      {value}
    </span>
  </div>
);

const Stat = ({ label, value, tone }: { label: string; value: string; tone: string }) => (
  <div className="rounded-md bg-gray-50 px-3 py-2.5">
    <p className="text-[10px] font-semibold text-gray-500 tracking-wide">{label}</p>
    <p className={`text-[15px] font-bold tabular-nums mt-0.5 ${tone}`}>{value}</p>
  </div>
);

export default WithdrawalDetailPage;
