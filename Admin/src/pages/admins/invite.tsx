import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Mail, ShieldCheck, X, Loader2, KeyRound, Eye, EyeOff,
  RefreshCw, UserPlus, Copy, Check,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  fetchAdminAccounts,
  createAdminAccount,
  revokeAdminAccount,
  type AdminAccountRow,
  type AdminAccountRole,
} from "@/services/adminApi";

const roleBadge: Record<AdminAccountRole, string> = {
  super: "bg-purple-50 text-purple-700",
  finance: "bg-emerald-50 text-emerald-700",
  support: "bg-sky-50 text-sky-700",
  content: "bg-amber-50 text-amber-700",
};

const formatDate = (s?: string): string => {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Generate a memorable password — 12 chars, upper+lower+digit. Used by the
// "Generate" button so admins don't have to invent one themselves.
const generatePassword = (): string => {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const all = upper + lower + digits;
  const pickRandom = (set: string) => set[Math.floor(Math.random() * set.length)];
  let pwd = pickRandom(upper) + pickRandom(lower) + pickRandom(digits);
  for (let i = 0; i < 9; i++) pwd += pickRandom(all);
  return pwd
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
};

const CreateAdminPage = () => {
  const { t } = useTranslation("common");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [roleId, setRoleId] = useState<AdminAccountRole>("support");
  const [showPassword, setShowPassword] = useState(false);

  const [items, setItems] = useState<AdminAccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    email: string;
    password: string;
    promoted: boolean;
  } | null>(null);
  const [copied, setCopied] = useState<"email" | "password" | "both" | null>(null);

  const ROLES: { id: AdminAccountRole; name: string; description: string }[] = [
    { id: "super", name: t("roles.super"), description: t("admins.invite.roles.superDesc") },
    { id: "finance", name: t("roles.finance"), description: t("admins.invite.roles.financeDesc") },
    { id: "support", name: t("roles.support"), description: t("admins.invite.roles.supportDesc") },
    { id: "content", name: t("roles.content"), description: t("admins.invite.roles.contentDesc") },
  ];

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminAccounts();
      setItems(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admins.invite.failedToLoad"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    if (password.length < 6) {
      alert(t("admins.create.passwordMin", "Password must be at least 6 characters"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await createAdminAccount({
        email: email.trim(),
        password,
        name: name.trim() || undefined,
        adminRole: roleId,
      });
      const data = res.data;
      if (data) {
        setSuccess({
          email: data.email,
          password,
          promoted: !!data.promoted,
        });
      }
      setEmail("");
      setName("");
      setPassword("");
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : t("admins.invite.failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const onRevoke = async (id: string, displayName: string) => {
    if (
      !window.confirm(
        t("admins.create.confirmRevoke", "Remove admin access for {{name}}?", { name: displayName })
      )
    )
      return;
    setBusyId(id);
    try {
      await revokeAdminAccount(id);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setBusyId(null);
    }
  };

  const onCopyCreds = async (kind: "email" | "password" | "both") => {
    if (!success) return;
    const text =
      kind === "email"
        ? success.email
        : kind === "password"
          ? success.password
          : `${success.email} / ${success.password}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* clipboard blocked */
    }
  };

  const selectedRole = ROLES.find((r) => r.id === roleId)!;

  return (
    <div className="space-y-4 text-sm">
      <Link
        href="/admins"
        className="inline-flex items-center gap-2 text-[12px] text-gray-500 hover:text-black font-medium transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> {t("common.backToAdmins")}
      </Link>

      <p className="text-[12px] text-gray-500">
        {t(
          "admins.create.subtitle",
          "Create an admin account by setting an email and password directly. No invitation email is sent — share the credentials with the new admin yourself."
        )}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <form
          onSubmit={onCreate}
          className="lg:col-span-2 rounded-lg border border-gray-100 p-5 space-y-4"
        >
          {/* Email */}
          <div>
            <label className="text-[11px] font-semibold text-gray-500 tracking-wide uppercase">
              {t("common.email")}
            </label>
            <div className="relative mt-1">
              <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                placeholder="admin@anything.com"
                className="w-full pl-8 pr-3 py-2 rounded-md text-[12px] bg-gray-50 border border-gray-100 focus:border-primary outline-none"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              {t(
                "admins.create.emailHint",
                "Any email works — no verification email is sent."
              )}
            </p>
          </div>

          {/* Password */}
          <div>
            <label className="text-[11px] font-semibold text-gray-500 tracking-wide uppercase">
              {t("admins.create.password", "Password")}
            </label>
            <div className="relative mt-1">
              <KeyRound className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                placeholder={t("admins.create.passwordPlaceholder", "Min 6 characters")}
                className="w-full pl-8 pr-20 py-2 rounded-md text-[12px] bg-gray-50 border border-gray-100 focus:border-primary outline-none font-mono"
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                  title={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPassword(generatePassword());
                    setShowPassword(true);
                  }}
                  className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                  title={t("admins.create.generate", "Generate password")}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              {t(
                "admins.create.passwordHint",
                "Set the password yourself or click ↻ to generate one. Share it with the new admin via your preferred channel."
              )}
            </p>
          </div>

          {/* Name */}
          <div>
            <label className="text-[11px] font-semibold text-gray-500 tracking-wide uppercase">
              {t("common.fullName")} <span className="text-gray-400 font-normal">({t("common.optional")})</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              placeholder="e.g. Mali Thongdy"
              className="w-full mt-1 px-3 py-2 rounded-md text-[12px] bg-gray-50 border border-gray-100 focus:border-primary outline-none"
            />
          </div>

          {/* Role */}
          <div>
            <label className="text-[11px] font-semibold text-gray-500 tracking-wide uppercase">
              {t("common.role")}
            </label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value as AdminAccountRole)}
              className="w-full mt-1 px-3 py-2 rounded-md text-[12px] bg-gray-50 border border-gray-100 focus:border-primary outline-none"
            >
              {ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="submit"
              disabled={submitting || !email.trim() || password.length < 6}
              className="bg-black text-white px-4 py-2 rounded-md text-[12px] font-semibold inline-flex items-center hover:bg-gray-900 disabled:opacity-40"
            >
              {submitting ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <UserPlus className="w-3.5 h-3.5 mr-1.5" />
              )}
              {submitting ? t("common.creating") : t("admins.create.create", "Create admin")}
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
            {t("admins.invite.viewRoleMatrix")} →
          </Link>
        </div>
      </div>

      {/* Success modal — shows credentials once for copy/paste */}
      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                <Check className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {success.promoted
                    ? t("admins.create.promoted", "Existing user promoted to admin")
                    : t("admins.create.created", "Admin account created")}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {t(
                    "admins.create.shareCreds",
                    "Share these credentials with the new admin. They won't be shown again."
                  )}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-100">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    {t("common.email")}
                  </p>
                  <p className="text-sm font-mono text-slate-900 truncate">{success.email}</p>
                </div>
                <button
                  onClick={() => onCopyCreds("email")}
                  className="p-2 rounded-md hover:bg-white text-slate-500"
                >
                  {copied === "email" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-100">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    {t("admins.create.password", "Password")}
                  </p>
                  <p className="text-sm font-mono text-slate-900 truncate">{success.password}</p>
                </div>
                <button
                  onClick={() => onCopyCreds("password")}
                  className="p-2 rounded-md hover:bg-white text-slate-500"
                >
                  {copied === "password" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => onCopyCreds("both")}
                className="text-[12px] font-bold text-primary hover:underline inline-flex items-center gap-1"
              >
                {copied === "both" ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {t("admins.create.copyBoth", "Copy both")}
              </button>
              <button
                onClick={() => setSuccess(null)}
                className="bg-black text-white px-4 py-2 rounded-md text-[12px] font-semibold hover:bg-gray-900"
              >
                {t("common.done")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing admins table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[12px] font-bold text-black">
            {t("admins.create.adminAccounts", "Admin accounts")}
          </h2>
          <span className="text-[11px] text-gray-500">
            {t("admins.create.totalAdmins", "{{count}} total", { count: items.length })}
          </span>
        </div>

        <div className="rounded-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] tabular-nums">
              <thead className="text-[11px] text-gray-500 tracking-wide bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold uppercase">{t("common.fullName")}</th>
                  <th className="px-4 py-2 text-left font-semibold uppercase">{t("common.email")}</th>
                  <th className="px-4 py-2 text-left font-semibold uppercase">{t("common.role")}</th>
                  <th className="px-4 py-2 text-left font-semibold uppercase">
                    {t("common.created", "Created")}
                  </th>
                  <th className="px-4 py-2 text-right font-semibold uppercase">
                    {t("common.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    </td>
                  </tr>
                )}
                {!loading && error && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-red-500 text-[12px]">
                      {error}
                    </td>
                  </tr>
                )}
                {!loading &&
                  !error &&
                  items.map((admin) => {
                    const role = admin.adminRole ? ROLES.find((r) => r.id === admin.adminRole) : null;
                    const displayName = admin.name || admin.email;
                    return (
                      <tr key={admin._id} className="border-t border-gray-50">
                        <td className="px-4 py-2 font-medium text-gray-900">
                          {displayName}
                          {admin.isSuspended && (
                            <span className="ml-2 text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                              {t("status.suspended")}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-gray-700">{admin.email}</td>
                        <td className="px-4 py-2">
                          {admin.adminRole && (
                            <span
                              className={`text-[11px] font-medium px-2 py-0.5 rounded ${roleBadge[admin.adminRole]}`}
                            >
                              {role?.name ?? admin.adminRole}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-gray-500 text-[11px]">
                          {formatDate(admin.createdAt)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button
                            disabled={busyId === admin._id}
                            onClick={() => onRevoke(admin._id, displayName)}
                            title={t("admins.create.revokeAccess", "Remove admin access")}
                            className="text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded p-1.5 disabled:opacity-30"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                {!loading && !error && items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                      {t("admins.create.noAdmins", "No admin accounts yet")}
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

export default CreateAdminPage;
