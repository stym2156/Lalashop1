import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  Pencil, X, KeyRound, Copy, Check, Store, Loader2, ArrowLeft,
  Shield, ShieldCheck, ShieldAlert, ShieldOff, User as UserIcon, Mail,
  Phone, Package, ShoppingBag, FileText, Wallet,
  ExternalLink, Ban, RefreshCw, BadgeCheck, AlertTriangle, Hash,
  ArrowDownCircle, ArrowUpCircle, TrendingUp, Clock, Receipt,
  Gift, Scan,
} from "lucide-react";
import type { AdminUserFinance } from "@/services/adminApi";
import {
  fetchUserById,
  updateUser as apiUpdateUser,
  updateUserBank as apiUpdateUserBank,
  issueSellerCredentials,
  suspendUser,
  updateUserAdminRole,
  type AdminUserDetail,
  type IssueSellerCredentialsResponse,
  type AdminRole,
} from "@/services/adminApi";

const formatNumber = (n: number): string =>
  new Intl.NumberFormat("en-US").format(n);

const formatCurrency = (n: number, t: (k: string) => string): string =>
  `${t('common.currencySymbol')}${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n)}`;

const formatDate = (iso?: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
};

const formatDateTime = (iso?: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const initial = (name?: string): string =>
  (name || "?").trim().charAt(0).toUpperCase() || "?";

interface EditFormState {
  name: string;
  email: string;
  phone: string;
  balance: string;
  password: string;
  pin: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

const buildInitialForm = (user: AdminUserDetail): EditFormState => ({
  name: user.name ?? "",
  email: user.email ?? "",
  phone: user.phone ?? "",
  balance: String(user.balance ?? 0),
  password: "",
  pin: "",
  bankName: user.bank?.bankName ?? "",
  accountNumber: user.bank?.accountNumber ?? "",
  accountName: user.bank?.accountName ?? "",
});

const UserDetailsPage = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const idParam = router.query.id;
  const id = typeof idParam === "string" ? idParam : null;

  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<EditFormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [issuing, setIssuing] = useState(false);
  const [issuedCreds, setIssuedCreds] = useState<IssueSellerCredentialsResponse | null>(null);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<"email" | "password" | null>(null);

  const [suspendOpen, setSuspendOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendBusy, setSuspendBusy] = useState(false);

  const [adminBusy, setAdminBusy] = useState(false);

  const ROLE_LABELS: Record<AdminRole, string> = {
    super: t('roles.super'),
    finance: t('roles.finance'),
    support: t('roles.support'),
    content: t('roles.content'),
  };

  const reload = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchUserById(id);
      setUser(res.data ?? null);
      if (!res.data) setError(res.message || t('pages.users.details.notFound'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pages.users.details.loadingError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onCopy = async (field: "email" | "password", value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleIssueCredentials = async () => {
    if (!id || !user) return;
    if (
      !window.confirm(
        t('pages.users.details.issueConfirm', { email: user.email })
      )
    )
      return;
    setIssuing(true);
    setIssueError(null);
    setIssuedCreds(null);
    try {
      const res = await issueSellerCredentials(id);
      if (res.data) setIssuedCreds(res.data);
    } catch (err) {
      setIssueError(err instanceof Error ? err.message : t('pages.users.details.issueError'));
    } finally {
      setIssuing(false);
    }
  };

  const openEdit = () => {
    if (!user) return;
    setForm(buildInitialForm(user));
    setSaveError(null);
    setEditOpen(true);
  };

  const closeEdit = () => {
    if (saving) return;
    setEditOpen(false);
    setForm(null);
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!user || !form) return;
    setSaving(true);
    setSaveError(null);
    try {
      const userPayload: Record<string, unknown> = {};
      if (form.name.trim() !== (user.name ?? "")) userPayload.name = form.name.trim();
      if (form.email.trim().toLowerCase() !== (user.email ?? "").toLowerCase()) {
        userPayload.email = form.email.trim();
      }
      if (form.phone.trim() !== (user.phone ?? "")) userPayload.phone = form.phone.trim();

      const balanceNum = Number(form.balance);
      if (Number.isFinite(balanceNum) && balanceNum !== (user.balance ?? 0)) {
        userPayload.balance = balanceNum;
      }
      if (form.password.length > 0) userPayload.password = form.password;
      if (form.pin.length > 0) userPayload.pin = form.pin;

      let nextUser: AdminUserDetail = user;
      if (Object.keys(userPayload).length > 0) {
        const res = await apiUpdateUser(user._id, userPayload);
        if (!res.data) throw new Error(res.message || t('pages.users.details.saveError'));
        nextUser = { ...user, ...res.data, bank: user.bank };
      }

      const bankFilled = form.bankName.trim() && form.accountNumber.trim() && form.accountName.trim();
      const bankChanged =
        form.bankName.trim() !== (user.bank?.bankName ?? "") ||
        form.accountNumber.trim() !== (user.bank?.accountNumber ?? "") ||
        form.accountName.trim() !== (user.bank?.accountName ?? "");

      if (bankFilled && bankChanged) {
        const bankRes = await apiUpdateUserBank(user._id, {
          bankName: form.bankName.trim(),
          accountNumber: form.accountNumber.trim(),
          accountName: form.accountName.trim(),
        });
        if (!bankRes.data) throw new Error(bankRes.message || t('pages.users.details.bankUpdateError'));
        nextUser = { ...nextUser, bank: bankRes.data };
      }

      setUser(nextUser);
      setEditOpen(false);
      setForm(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t('pages.users.details.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleSuspendToggle = async () => {
    if (!user || !id) return;
    const next = !user.isSuspended;
    if (next && !suspendReason.trim()) {
      alert(t('pages.users.details.suspendModal.reasonRequired'));
      return;
    }
    setSuspendBusy(true);
    try {
      await suspendUser(id, { suspended: next, reason: suspendReason.trim() });
      setSuspendOpen(false);
      setSuspendReason("");
      await reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('pages.users.details.suspendError'));
    } finally {
      setSuspendBusy(false);
    }
  };

  const handleAdminRoleChange = async (role: AdminRole | null) => {
    if (!user) return;
    const willBeAdmin = role !== null;
    const verb = willBeAdmin
      ? t('pages.users.details.promoteConfirm', { email: user.email, role: ROLE_LABELS[role!] })
      : t('pages.users.details.demoteConfirm', { email: user.email });
    if (!window.confirm(verb)) return;
    setAdminBusy(true);
    try {
      await updateUserAdminRole(user._id, {
        isAdmin: willBeAdmin,
        adminRole: role,
      });
      await reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setAdminBusy(false);
    }
  };

  const trustScore = useMemo(() => {
    if (!user) return 0;
    let score = 50;
    if (user.twoFactorEnabled) score += 15;
    if (user.hasPassword) score += 10;
    if (user.hasPin) score += 5;
    if (user.kyc?.status === "approved") score += 10;
    if (user.bank) score += 5;
    if (user.isSuspended) score -= 50;
    return Math.max(0, Math.min(100, score));
  }, [user]);

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-3">
        <Link href="/users/alluser" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-black">
          <ArrowLeft className="w-3.5 h-3.5" /> {t('pages.users.details.back')}
        </Link>
        <div className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700">
          {error || t('pages.users.details.notFound')}
        </div>
      </div>
    );
  }

  const stats = user.stats;
  const kyc = user.kyc;

  return (
    <div className="space-y-4 text-sm">
      <Link
        href="/users/alluser"
        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-black"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> {t('pages.users.details.back')}
      </Link>

      {/* Suspended banner */}
      {user.isSuspended && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 flex items-start gap-3">
          <Ban className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[13px] font-bold text-rose-900">{t('pages.users.details.accountSuspended')}</p>
            <p className="text-[11px] text-rose-700 mt-0.5">
              {user.suspendedReason || t('common.noReason')} · {t('common.since')}{" "}
              {formatDate(user.suspendedAt)}
            </p>
          </div>
          <button
            onClick={() => {
              setSuspendReason("");
              setSuspendOpen(true);
            }}
            className="px-3 py-1.5 rounded-md text-[11px] font-bold bg-white border border-rose-200 text-rose-700 hover:bg-rose-50"
          >
            {t('pages.users.details.liftSuspension')}
          </button>
        </div>
      )}

      {/* Hero header */}
      <div className="rounded-lg  p-5 bg-white">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
            {user.isSeller && (
              <button
                onClick={handleIssueCredentials}
                disabled={issuing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold  text-emerald-700 disabled:opacity-50"
              >
                {issuing ? <Loader2 className="w-3 h-3 animate-spin" /> : <KeyRound className="w-3 h-3" />}
                {issuing ? t('pages.users.details.issuing') : t('pages.users.details.issueSellerPassword')}
              </button>
            )}
            {!user.isSuspended && !user.isAdmin && (
              <button
                onClick={() => {
                  setSuspendReason("");
                  setSuspendOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold  text-rose-700 "
              >
                <Ban className="w-3 h-3" /> {t('pages.users.details.suspendUser')}
              </button>
            )}
            {user.isSuspended && (
              <button
                onClick={() => {
                  setSuspendReason("");
                  setSuspendOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold  text-emerald-700 hover:bg-emerald-100"
              >
                <RefreshCw className="w-3 h-3" /> {t('pages.users.details.unsuspend')}
              </button>
            )}
            <button
              onClick={openEdit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold  text-gray-700 "
            >
              <Pencil className="w-3 h-3" /> {t('pages.users.details.editUser')}
            </button>
          </div>
        </div>
      </div>

      {/* Issued credentials banner (after re-issue) */}
      {issueError && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700">{issueError}</div>
      )}
      {issuedCreds && (
        <div className="rounded-2xl border-2 border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-emerald-600" />
            <h3 className="text-[12px] font-black text-emerald-900 tracking-wide">
              {t('pages.users.details.credsIssued')}
            </h3>
          </div>
          <p className="text-[11px] text-emerald-800">
            {t('pages.users.details.credsIssuedDesc')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <CredCard
              label={t('common.email')}
              value={issuedCreds.email}
              copied={copiedField === "email"}
              onCopy={() => onCopy("email", issuedCreds.email)}
              t={t}
            />
            <CredCard
              label={t('common.password')}
              value={issuedCreds.password}
              copied={copiedField === "password"}
              onCopy={() => onCopy("password", issuedCreds.password)}
              t={t}
            />
          </div>
          <a
            href={issuedCreds.loginUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-emerald-700 hover:underline font-medium inline-flex items-center gap-1"
          >
            {t('pages.users.details.loginUrl')}: {issuedCreds.loginUrl} <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
      {/* 3-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profile / Identity */}
        <Section title={t('pages.users.details.identity')} icon={UserIcon}>
          <Row label={t('pages.users.details.labels.displayName')} value={user.name || "—"} />
          <Row label={t('common.username')} value={user.username ? `@${user.username}` : "—"} />
          <Row
            label={t('common.id')}
            value={user.customId || "—"}
            mono
          />
          <Row label={t('common.email')} value={user.email} mono />
          <Row label={t('common.phone')} value={user.phone || "—"} />
          <Row
            label={t('pages.users.details.labels.followers')}
            value={formatNumber(user.followers?.length ?? 0)}
          />
          <Row
            label={t('pages.users.details.labels.following')}
            value={formatNumber(user.following?.length ?? 0)}
          />
          <Row label={t('common.joined')} value={formatDate(user.createdAt)} />
        </Section>

        {/* Financial */}
        <Section title={t('pages.users.details.financial')} icon={Wallet}>
          <Row
            label={t('pages.users.details.labels.webBalance')}
            value={formatCurrency(user.balance ?? 0, t)}
            tone="text-[#00aeff] font-bold"
          />
          {user.isSeller && (
            <Row
              label={t('pages.users.details.labels.posRevenue')}
              value={formatCurrency(user.posRevenue ?? 0, t)}
              tone="text-emerald-700 font-bold"
            />
          )}
          <Row
            label={t('pages.users.details.labels.pendingWithdrawals')}
            value={formatNumber(stats?.pendingWithdrawals ?? 0)}
            tone={
              (stats?.pendingWithdrawals ?? 0) > 0
                ? "text-amber-700 font-bold"
                : ""
            }
          />
          <Row
            label={t('pages.users.details.editModal.bankHeader')}
            value={user.bank?.bankName || t('common.notLinked')}
            tone={user.bank ? "" : "text-gray-400"}
          />
          <Row
            label={t('common.accountNumber')}
            value={user.bank?.accountNumber || "—"}
            tone={user.bank ? "" : "text-gray-400"}
            mono
          />
          <Row
            label={t('common.accountName')}
            value={user.bank?.accountName || "—"}
            tone={user.bank ? "" : "text-gray-400"}
          />
          <Row
            label={t('common.verified')}
            value={
              user.bank?.isVerified ? (
                <span className="text-emerald-600 inline-flex items-center gap-1">
                  <BadgeCheck className="w-3 h-3" /> {t('common.verified')}
                </span>
              ) : user.bank ? (
                <span className="text-amber-600">{t('common.unverified')}</span>
              ) : (
                "—"
              )
            }
          />
        </Section>

        {/* Security & Activity */}
        <Section title={t('pages.users.details.security')} icon={Shield}>
          <Row
            label={t('pages.users.details.labels.twoFactor')}
            value={
              user.twoFactorEnabled ? (
                <span className="text-emerald-600 inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  {t('status.enabled')}
                  {user.twoFactorType && user.twoFactorType !== "none"
                    ? ` (${user.twoFactorType})`
                    : ""}
                </span>
              ) : (
                <span className="text-gray-400 inline-flex items-center gap-1">
                  <ShieldOff className="w-3 h-3" /> {t('status.disabled')}
                </span>
              )
            }
          />
          <Row
            label={t('pages.users.details.labels.customerPassword')}
            value={
              user.hasPassword ? (
                <span className="text-emerald-600 font-mono">●●●●●●●</span>
              ) : (
                <span className="text-gray-400">{t('status.notSet')}</span>
              )
            }
          />
          {user.isSeller && (
            <Row
              label={t('pages.users.details.labels.sellerPassword')}
              value={
                user.hasSellerPassword ? (
                  <span className="text-emerald-600 font-mono">●●●●●●●</span>
                ) : (
                  <span className="text-gray-400">{t('status.notIssued')}</span>
                )
              }
            />
          )}
          <Row
            label={t('pages.users.details.labels.withdrawalPin')}
            value={
              user.hasPin ? (
                <span className="text-emerald-600 font-mono">●●●●●●</span>
              ) : (
                <span className="text-gray-400">{t('status.notSet')}</span>
              )
            }
          />
          <Row
            label={t('pages.users.details.labels.lastKnownIp')}
            value={user.lastKnownIp || "—"}
            mono
          />
          <Row
            label={t('pages.users.details.labels.lastUpdate')}
            value={formatDateTime(user.updatedAt)}
            mono
          />
          {(user.googleId || user.facebookId) && (
            <Row
              label={t('pages.users.details.labels.linkedAccounts')}
              value={
                <span className="inline-flex items-center gap-1">
                  {user.googleId && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">
                      Google
                    </span>
                  )}
                  {user.facebookId && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">
                      Facebook
                    </span>
                  )}
                </span>
              }
            />
          )}
        </Section>
      </div>

      {/* Money source / income breakdown — compliance review */}
      {user.finance && (
        <Section
          title={t('pages.users.details.moneySource')}
          icon={Wallet}
          hint={t('pages.users.details.moneySourceDesc')}
        >
          <IncomeBreakdown finance={user.finance} isSeller={user.isSeller} t={t} />
        </Section>
      )}

      {/* Withdrawal history breakdown */}
      {user.finance && (
        <Section title={t('pages.users.details.withdrawalHistory')} icon={ArrowDownCircle}>
          <WithdrawalBreakdown finance={user.finance} userId={user._id} t={t} />
        </Section>
      )}

      {/* Order activity — buyer + seller */}
      {user.finance && (
        <Section title={t('pages.users.details.orderActivity')} icon={ShoppingBag}>
          <OrderActivity finance={user.finance} isSeller={user.isSeller} userId={user._id} t={t} />
        </Section>
      )}

      {/* Shop / KYC info row (sellers only) */}
      {user.isSeller && (
        <Section title={t('pages.users.details.shopAndKyc')} icon={Store}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <div className="space-y-2">
              <Row label={t('common.shopName')} value={user.shopName || "—"} />
              <Row label={t('common.shopCategory')} value={user.shopCategory || "—"} />
              <Row label={t('common.sellerType')} value={user.seller_type || "—"} />
              {kyc && (
                <>
                  <Row label={t('common.kycStatus')} value={
                    <span className={
                      kyc.status === "approved" ? "text-emerald-600 font-bold" :
                      kyc.status === "rejected" ? "text-rose-600 font-bold" :
                      "text-amber-600 font-bold"
                    }>{t(`status.${kyc.status}`)}</span>
                  } />
                  <Row label={t('common.kycSubmitted')} value={formatDateTime(kyc.submittedAt)} mono />
                  {kyc.reviewedAt && (
                    <Row label={t('common.kycReviewed')} value={formatDateTime(kyc.reviewedAt)} mono />
                  )}
                  {kyc.rejectionReason && (
                    <Row label={t('common.rejectionReason')} value={kyc.rejectionReason} />
                  )}
                </>
              )}
            </div>
            <div className="flex flex-col gap-2 mt-3 md:mt-0">
              <Link
                href={`/shops/${user._id}`}
                className="rounded-lg border border-gray-100 px-3 py-2.5 hover:bg-gray-50 inline-flex items-center justify-between text-[12px] font-bold"
              >
                <span className="inline-flex items-center gap-2">
                  <Store className="w-3.5 h-3.5 text-gray-400" /> {t('pages.shops.details.openProfile')}
                </span>
                <ExternalLink className="w-3 h-3 text-gray-400" />
              </Link>
              <Link
                href={`/products?seller=${user._id}`}
                className="rounded-lg border border-gray-100 px-3 py-2.5 hover:bg-gray-50 inline-flex items-center justify-between text-[12px] font-bold"
              >
                <span className="inline-flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 text-gray-400" /> {t('pages.shops.details.viewProducts')} ({stats?.productCount ?? 0})
                </span>
                <ExternalLink className="w-3 h-3 text-gray-400" />
              </Link>
              <Link
                href={`/orders?seller=${user._id}`}
                className="rounded-lg border border-gray-100 px-3 py-2.5 hover:bg-gray-50 inline-flex items-center justify-between text-[12px] font-bold"
              >
                <span className="inline-flex items-center gap-2">
                  <ShoppingBag className="w-3.5 h-3.5 text-gray-400" /> {t('pages.shops.details.viewOrders')}
                </span>
                <ExternalLink className="w-3 h-3 text-gray-400" />
              </Link>
            </div>
          </div>
        </Section>
      )}
      {/* System metadata */}
      <Section title={t('pages.users.details.systemMetadata')} icon={Hash}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
          <div className="space-y-2">
            <Row label={t('common.userId')} value={user._id} mono />
            <Row label={t('common.id')} value={user.customId || "—"} mono />
            <Row label={t('common.created')} value={formatDateTime(user.createdAt)} mono />
          </div>
          <div className="space-y-2">
            <Row label={t('common.updated')} value={formatDateTime(user.updatedAt)} mono />
            <Row label={t('common.lastIp')} value={user.lastKnownIp || "—"} mono />
            {user.isSuspended && (
              <Row
                label={t('common.suspendedAt')}
                value={formatDateTime(user.suspendedAt)}
                mono
                tone="text-rose-700"
              />
            )}
          </div>
        </div>
      </Section>

      {/* Edit modal */}
      {editOpen && form && (
        <Modal title={t('pages.users.details.editModal.title')} onClose={closeEdit} disabled={saving}>
          <div className="space-y-4 text-[12px]">
            <Field label={t('common.name')} value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Field
              label={t('common.email')}
              type="email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
            />
            <Field label={t('common.phone')} value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <Field
              label={`${t('common.balance')} (${t('common.currencySymbol')})`}
              type="number"
              value={form.balance}
              onChange={(v) => setForm({ ...form, balance: v })}
            />

            <div className="border-t border-gray-100 pt-3 space-y-3">
              <p className="text-[11px] tracking-wider text-gray-500 font-bold">
                {t('pages.users.details.editModal.bankHeader')}
              </p>
              <Field
                label={t('common.bankName')}
                value={form.bankName}
                onChange={(v) => setForm({ ...form, bankName: v })}
              />
              <Field
                label={t('common.accountNumber')}
                value={form.accountNumber}
                onChange={(v) => setForm({ ...form, accountNumber: v })}
              />
              <Field
                label={t('common.accountName')}
                value={form.accountName}
                onChange={(v) => setForm({ ...form, accountName: v })}
              />
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-3">
              <p className="text-[11px] tracking-wider text-gray-500 font-bold">
                {t('pages.users.details.editModal.credsHeader')}
              </p>
              <Field
                label={t('pages.users.details.editModal.newPassword')}
                type="password"
                value={form.password}
                onChange={(v) => setForm({ ...form, password: v })}
                placeholder={t('pages.users.details.editModal.passwordPlaceholder')}
              />
              <Field
                label={t('pages.users.details.editModal.newPin')}
                type="password"
                value={form.pin}
                onChange={(v) => setForm({ ...form, pin: v.replace(/\D/g, "").slice(0, 6) })}
                placeholder={t('pages.users.details.editModal.pinPlaceholder')}
              />
            </div>

            {saveError && (
              <div className="rounded px-3 py-2 bg-red-50 text-red-700 text-[11px]">{saveError}</div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100 mt-4">
            <button
              onClick={closeEdit}
              disabled={saving}
              className="px-3 py-1.5 rounded text-[11px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50"
            >
              {t('actions.cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 rounded text-[11px] font-bold bg-[#00aeff] text-white hover:bg-[#0096db] disabled:opacity-50"
            >
              {saving ? t('actions.saving') : t('actions.saveChanges')}
            </button>
          </div>
        </Modal>
      )}

      {/* Suspend modal */}
      {suspendOpen && (
        <Modal
          title={user.isSuspended ? t('pages.users.details.suspendModal.liftTitle') : t('pages.users.details.suspendModal.title')}
          onClose={() => setSuspendOpen(false)}
          disabled={suspendBusy}
        >
          <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <p>
                {user.isSuspended
                  ? t('pages.users.details.suspendModal.liftDesc')
                  : t('pages.users.details.suspendModal.suspendDesc')}
              </p>
            </div>
            {!user.isSuspended && (
              <Field
                label={t('pages.users.details.suspendModal.reason')}
                value={suspendReason}
                onChange={setSuspendReason}
                placeholder={t('pages.users.details.suspendModal.reasonPlaceholder')}
              />
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100 mt-4">
            <button
              onClick={() => setSuspendOpen(false)}
              disabled={suspendBusy}
              className="px-3 py-1.5 rounded text-[11px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50"
            >
              {t('actions.cancel')}
            </button>
            <button
              onClick={handleSuspendToggle}
              disabled={suspendBusy}
              className={`px-4 py-1.5 rounded text-[11px] font-bold text-white disabled:opacity-50 ${
                user.isSuspended ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
              }`}
            >
              {suspendBusy ? t('actions.saving') : t('actions.confirm')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

const Section = ({
  title,
  icon: Icon,
  children,
  hint,
}: {
  title: string;
  icon: typeof UserIcon;
  children: React.ReactNode;
  hint?: string;
}) => (
  <div className="rounded-lg border border-gray-100 bg-white">
    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
      <Icon className="w-3.5 h-3.5 text-gray-400" />
      <div className="flex-1 min-w-0">
        <h3 className="text-[13px] font-bold text-gray-900">{title}</h3>
        {hint && <p className="text-[10px] text-gray-500 mt-0.5">{hint}</p>}
      </div>
    </div>
    <div className="p-4 space-y-2 text-[12px]">{children}</div>
  </div>
);

const Row = ({ label, value, mono, tone }: { label: string; value: React.ReactNode; mono?: boolean; tone?: string }) => (
  <div className="flex items-center justify-between gap-3 py-1.5 border-b border-gray-50 last:border-b-0">
    <span className="text-gray-500 text-[11px]">{label}</span>
    <span className={`text-right text-gray-900 break-all ${mono ? "font-mono" : ""} ${tone || ""}`}>
      {value}
    </span>
  </div>
);

const CredCard = ({ label, value, copied, onCopy, t }: { label: string; value: string; copied: boolean; onCopy: () => void; t: (k: string) => string }) => (
  <div className="rounded-lg bg-white border border-emerald-100 px-3 py-2">
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold text-slate-500 tracking-widest">{label}</span>
      <button
        onClick={onCopy}
        className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-900"
      >
        {copied ? (
          <>
            <Check size={10} /> {t('common.copied')}
          </>
        ) : (
          <>
            <Copy size={10} /> {t('common.copy')}
          </>
        )}
      </button>
    </div>
    <p className="text-[12px] font-mono text-slate-900 mt-1 break-all">{value}</p>
  </div>
);

const Modal = ({ title, onClose, children, disabled }: { title: string; onClose: () => void; children: React.ReactNode; disabled?: boolean }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl shadow-xl">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <h3 className="text-[14px] font-bold">{title}</h3>
        <button
          onClick={onClose}
          disabled={disabled}
          className="text-gray-500 hover:text-black p-1 rounded disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  </div>
);

const Field = ({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) => (
  <label className="block">
    <span className="block text-[11px] text-gray-500 mb-1 font-bold tracking-wide">
      {label}
    </span>
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded border border-gray-200 focus:border-[#00aeff] outline-none text-[12px]"
    />
  </label>
);

const IncomeBreakdown = ({ finance, isSeller, t }: { finance: AdminUserFinance; isSeller: boolean; t: (k: string) => string }) => {
  const sellerWeb = finance.income.sellerWebSales.total;
  const creator = finance.income.creatorEarnings.settledTotal;
  const pos = finance.income.posRevenue;
  const totalIncome = sellerWeb + creator + pos;
  const balance = finance.income.currentBalance;
  const withdrawn = finance.withdrawals.totalNet;
  const refunded = finance.outgoing.refundsIssued.total;

  const pct = (n: number): number =>
    totalIncome > 0 ? Math.round((n / totalIncome) * 100) : 0;

  const sources = [
    {
      label: t('financial.webSalesAsSeller'),
      value: sellerWeb,
      pct: pct(sellerWeb),
      color: "bg-emerald-500",
      icon: Store,
      hint: `${finance.income.sellerWebSales.orders} ${t('common.orders')} · ${finance.income.sellerWebSales.itemsSold} ${t('common.itemsSold')}`,
    },
    {
      label: t('financial.creatorCommission'),
      value: creator,
      pct: pct(creator),
      color: "bg-purple-500",
      icon: Gift,
      hint: `${
        finance.income.creatorEarnings.byStatus.settled?.count || 0
      } ${t('status.settled')} · ${
        finance.income.creatorEarnings.byStatus.pending?.count || 0
      } ${t('status.pending')}`,
    },
    {
      label: t('financial.posRevenueInStore'),
      value: pos,
      pct: pct(pos),
      color: "bg-amber-500",
      icon: Scan,
      hint: t('financial.nonWithdrawable'),
    },
  ];

  const reconciled = totalIncome - withdrawn - refunded;
  const drift = balance - reconciled;
  const driftSign = drift > 0 ? "+" : "";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniKPI label={t('financial.lifetimeIncome')} value={formatCurrency(totalIncome, t)} tone="text-emerald-700" />
        <MiniKPI label={t('financial.withdrawnNet')} value={formatCurrency(withdrawn, t)} tone="text-rose-700" />
        <MiniKPI label={t('financial.refundsIssued')} value={formatCurrency(refunded, t)} tone="text-amber-700" hint={`${finance.outgoing.refundsIssued.count} ${t('common.refunds')}`} />
        <MiniKPI label={t('financial.currentBalance')} value={formatCurrency(balance, t)} tone="text-[#00aeff]" hint={Math.abs(drift) > 1 ? `${t('financial.drift')} ${driftSign}${formatCurrency(drift, t)}` : t('financial.reconciles')} />
      </div>

      {totalIncome > 0 && (
        <div>
          <div className="h-3 rounded-full bg-gray-100 overflow-hidden flex">
            {sources.map((s) =>
              s.value > 0 ? (
                <div
                  key={s.label}
                  className={s.color}
                  style={{ width: `${s.pct}%` }}
                  title={`${s.label}: ${formatCurrency(s.value, t)} (${s.pct}%)`}
                />
              ) : null
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {sources.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="flex items-center gap-3">
              <span className={`w-6 h-6 rounded ${s.color}/20 inline-flex items-center justify-center`}>
                <Icon className={`w-3 h-3 text-white ${s.color.replace("bg-", "fill-")}`} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-bold text-gray-900">{s.label}</p>
                  <p className="text-[12px] font-black tabular-nums text-gray-900">
                    {formatCurrency(s.value, t)}
                    <span className="text-[10px] text-gray-400 font-normal ml-1.5">
                      {s.pct}%
                    </span>
                  </p>
                </div>
                <p className="text-[10px] text-gray-500">{s.hint}</p>
              </div>
            </div>
          );
        })}
      </div>

      {!isSeller && sellerWeb === 0 && creator === 0 && balance > 0 && (
        <div className="rounded-md bg-amber-50 border border-amber-100 px-3 py-2 text-[11px] text-amber-800 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <p>
            <strong>{t('common.headsUp')}:</strong> {t('pages.users.details.noIncomeWarning')}
          </p>
        </div>
      )}
    </div>
  );
};

const WITHDRAW_STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
  failed: "bg-rose-100 text-rose-700",
  cancelled: "bg-gray-100 text-gray-600",
};

const WithdrawalBreakdown = ({ finance, userId, t }: { finance: AdminUserFinance; userId: string; t: (k: string) => string }) => {
  const w = finance.withdrawals;
  const statuses = ["pending", "approved", "completed", "rejected", "failed", "cancelled"];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniKPI label={t('financial.totalRequests')} value={formatNumber(w.totalCount)} />
        <MiniKPI label={t('financial.totalAmount')} value={formatCurrency(w.totalAmount, t)} tone="text-rose-700" />
        <MiniKPI label={t('financial.netToBank')} value={formatCurrency(w.totalNet, t)} tone="text-emerald-700" />
        <MiniKPI label={t('financial.lastWithdrawal')} value={w.last ? formatCurrency(w.last.amount, t) : "—"} hint={w.last ? `${formatDateTime(w.last.createdAt)}${w.last.status ? ` · ${t(`status.${w.last.status}`)}` : ""}` : t('common.noHistory')} />
      </div>

      <div>
        <p className="text-[10px] font-bold text-gray-500 tracking-wide mb-2">{t('financial.byStatus')}</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {statuses.map((s) => {
            const row = w.byStatus[s];
            if (!row) return null;
            return (
              <div key={s} className="rounded-md border border-gray-100 px-3 py-2 flex items-center justify-between gap-2">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wide ${WITHDRAW_STATUS_TONE[s] || ""}`}>
                  {t(`status.${s}`)}
                </span>
                <div className="text-right">
                  <p className="text-[12px] font-black tabular-nums text-gray-900">{formatCurrency(row.totalAmount, t)}</p>
                  <p className="text-[10px] text-gray-500">{row.count} {t('common.requests')}</p>
                </div>
              </div>
            );
          })}
          {Object.keys(w.byStatus).length === 0 && (
            <div className="col-span-full text-[11px] text-gray-400 text-center py-4">{t('common.noHistory')}</div>
          )}
        </div>
      </div>

      {w.last && (
        <div className="rounded-md bg-gray-50 px-3 py-2 text-[11px] space-y-0.5">
          <p className="text-gray-500">
            <strong className="text-gray-700">{t('financial.lastWithdrawal')}:</strong>{" "}
            {formatCurrency(w.last.amount, t)} ({t('common.net')} {formatCurrency(w.last.netAmount, t)} · {t('common.fee')} {formatCurrency(w.last.fee, t)}) · {t('common.status')}{" "}
            <strong className="">{t(`status.${w.last.status}`)}</strong>
          </p>
          <p className="text-gray-500">
            {formatDateTime(w.last.createdAt)}
            {w.last.processedAt && ` · ${t('status.processed')} ${formatDateTime(w.last.processedAt)}`}
            {w.last.bank?.bankName && ` · ${w.last.bank.bankName} ····${(w.last.bank.accountNumber || "").slice(-4)}`}
          </p>
        </div>
      )}

      <Link href={`/withdrawpage/Seller/SellerWithdrawals?userId=${userId}`} className="text-[11px] text-[#00aeff] font-bold hover:underline inline-flex items-center gap-1">
        {t('pages.users.details.viewAllWithdrawals')} →
      </Link>
    </div>
  );
};

const OrderActivity = ({ finance, isSeller, userId, t }: { finance: AdminUserFinance; isSeller: boolean; userId: string; t: (k: string) => string }) => {
  const buyer = finance.buyerActivity;
  const seller = finance.sellerActivity;
  const totalBuyerOrders = buyer.paidCount + buyer.unpaidCount;
  const avgOrderValue = buyer.paidCount > 0 ? buyer.paidTotal / buyer.paidCount : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-md border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingBag className="w-3.5 h-3.5 text-blue-500" />
            <h4 className="text-[12px] font-bold text-gray-900">{t('financial.asBuyer')}</h4>
          </div>
          <div className="space-y-2">
            <Row label={t('financial.ordersPlacedLifetime')} value={formatNumber(totalBuyerOrders)} />
            <Row label={t('financial.paidOrders')} value={formatNumber(buyer.paidCount)} tone="text-emerald-700" />
            <Row label={t('financial.unpaidPending')} value={formatNumber(buyer.unpaidCount)} tone={buyer.unpaidCount > 0 ? "text-amber-700" : "text-gray-400"} />
            <Row label={t('financial.totalSpent')} value={formatCurrency(buyer.paidTotal, t)} tone="text-rose-700 font-bold" />
            <Row label={t('financial.averageOrder')} value={formatCurrency(avgOrderValue, t)} />
            <Row label={t('financial.lastPaidOrder')} value={buyer.lastPaidAt ? `${formatCurrency(buyer.lastPaidAmount, t)} · ${formatDate(buyer.lastPaidAt)}` : "—"} />
          </div>
        </div>

        <div className="rounded-md border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Store className="w-3.5 h-3.5 text-emerald-500" />
            <h4 className="text-[12px] font-bold text-gray-900">{t('financial.asSeller')}</h4>
          </div>
          {isSeller ? (
            <div className="space-y-2">
              <Row label={t('financial.ordersReceived')} value={formatNumber(seller.ordersReceived)} />
              <Row label={t('financial.itemsSold')} value={formatNumber(seller.itemsSold)} />
              <Row label={t('financial.grossRevenue')} value={formatCurrency(seller.grossRevenue, t)} tone="text-emerald-700 font-bold" />
              <Row label={t('financial.avgOrderReceived')} value={seller.ordersReceived > 0 ? formatCurrency(seller.grossRevenue / seller.ordersReceived, t) : "—"} />
            </div>
          ) : (
            <div className="text-[11px] text-gray-400 text-center py-6">{t('common.notASeller')}</div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href={`/orders?user=${userId}`} className="text-[11px] text-[#00aeff] font-bold hover:underline inline-flex items-center gap-1">
          {t('pages.users.details.viewBuyerOrders')} →
        </Link>
        {isSeller && (
          <Link href={`/orders?seller=${userId}`} className="text-[11px] text-emerald-700 font-bold hover:underline inline-flex items-center gap-1">
            {t('pages.users.details.viewSellerOrders')} →
          </Link>
        )}
      </div>
    </div>
  );
};

const MiniKPI = ({ label, value, tone, hint }: { label: string; value: string; tone?: string; hint?: string }) => (
  <div className="rounded-md bg-gray-50 px-3 py-2">
    <p className="text-[10px] font-semibold text-gray-500 tracking-wide uppercase truncate">{label}</p>
    <p className={`text-[16px] font-bold tabular-nums mt-0.5 truncate ${tone || "text-gray-900"}`}>{value}</p>
    {hint && <p className="text-[9px] text-gray-400 mt-0.5 truncate">{hint}</p>}
  </div>
);

export default UserDetailsPage;
