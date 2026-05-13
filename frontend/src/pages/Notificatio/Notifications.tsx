import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  ArrowLeft,
  Bell,
  ShieldAlert,
  CreditCard,
  Zap,
  Info,
  CheckCircle2,
  XCircle,
  X,
  ExternalLink,
  Copy,
  Check,
  Mail,
  Lock,
  Store,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiClient } from "@/services/apiClient";

type NotificationType =
  | "kyc_approved"
  | "kyc_rejected"
  | "system"
  | "security"
  | "payout"
  | "info";

interface Credentials {
  email: string;
  password: string;
  loginUrl: string;
}

interface NotificationMetadata {
  kycId?: string;
  sellerDashboardUrl?: string;
  credentials?: Credentials;
  [key: string]: unknown;
}

interface NotificationItem {
  _id: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: string;
  metadata?: NotificationMetadata;
}

const formatTimeAgo = (iso: string | undefined, t: any): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diffSec = Math.max(0, (Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return t("time.justNow");
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return t("time.minutesAgo", { count: diffMin });
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return t("time.hoursAgo", { count: diffHr });
  const diffDay = Math.floor(diffHr / 24);
  return t("time.daysAgo", { count: diffDay });
};

const formatFullDate = (iso?: string): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
};

const getIcon = (type: NotificationType, size = 20): JSX.Element => {
  switch (type) {
    case "kyc_approved":
      return <CheckCircle2 size={size} className="text-emerald-600" />;
    case "kyc_rejected":
      return <XCircle size={size} className="text-red-500" />;
    case "payout":
      return <CreditCard size={size} className="text-blue-500" />;
    case "security":
      return <ShieldAlert size={size} className="text-orange-500" />;
    case "system":
      return <Zap size={size} className="text-violet-500" />;
    default:
      return <Info size={size} className="text-slate-400" />;
  }
};

interface CopyButtonProps {
  value: string;
  label?: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ value, label }) => {
  const { t } = useTranslation("common");
  const [copied, setCopied] = useState(false);

  const onCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore — older browsers */
    }
  };

  return (
    <button
      onClick={onCopy}
      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00aeff] hover:text-[#0096db] transition-colors"
      aria-label={`Copy ${label || "value"}`}
    >
      {copied ? (
        <>
          <Check size={12} /> {t("pages.notifications2.copiedShort")}
        </>
      ) : (
        <>
          <Copy size={12} /> {t("pages.notifications2.copyShort")}
        </>
      )}
    </button>
  );
};

interface CredentialsCardProps {
  credentials: Credentials;
}

const CredentialsCard: React.FC<CredentialsCardProps> = ({ credentials }) => {
  const { t } = useTranslation("common");
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="rounded-2xl  from-emerald-50 to-white p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Store className="w-4 h-4 text-emerald-600" />
        <h3 className="text-[13px] font-black text-emerald-900 tracking-wide ">
          {t("pages.notifications2.sellerCredentials")}
        </h3>
      </div>

      <div className="space-y-3">
        <div className="rounded-lg bg-white border border-emerald-100 px-4 py-3">
          <div className="flex items-center justify-between gap-3 mb-1">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-slate-500 tracking-widest">
              <Mail size={11} /> {t("pages.notifications2.email")}
            </span>
            <CopyButton value={credentials.email} label="email" />
          </div>
          <p className="text-[15px] font-mono text-slate-900 break-all">{credentials.email}</p>
        </div>

        <div className="rounded-lg bg-white border border-emerald-100 px-4 py-3">
          <div className="flex items-center justify-between gap-3 mb-1">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-slate-500 tracking-widest">
              <Lock size={11} /> {t("pages.notifications2.password")}
            </span>
            <div className="inline-flex items-center gap-3">
              <button
                onClick={() => setRevealed((v) => !v)}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800"
              >
                {revealed ? t("pages.notifications2.hide") : t("pages.notifications2.reveal")}
              </button>
              <CopyButton value={credentials.password} label="password" />
            </div>
          </div>
          <p className="text-[15px] font-mono text-slate-900 tracking-wider">
            {revealed ? credentials.password : "•".repeat(credentials.password.length)}
          </p>
        </div>
      </div>

      <a
        href={credentials.loginUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black py-3 rounded-xl transition-colors shadow-md shadow-emerald-200"
      >
        <ExternalLink size={16} />
        {t("pages.notifications2.openSellerDashboard")}
      </a>

      <div className="text-[11px] text-emerald-800 bg-emerald-100/60 rounded-lg px-3 py-2 leading-relaxed">
        <strong className="font-black">{t("pages.notifications2.savePassword")}</strong> {t("pages.notifications2.savePasswordDesc")}
      </div>
    </div>
  );
};

const renderBodyText = (body: string): JSX.Element[] => {
  // Highlight URLs as clickable links and preserve line breaks.
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return body.split("\n").map((line, idx) => {
    const parts = line.split(urlRegex);
    return (
      <p key={idx} className="text-[14px] text-slate-700 leading-[1.7] min-h-[1.2em]">
        {parts.map((part, i) =>
          urlRegex.test(part) ? (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00aeff] hover:underline font-medium break-all"
            >
              {part}
            </a>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </p>
    );
  });
};

export default function SystemNotifications(): JSX.Element {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<NotificationItem | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient("/notifications");
      setNotifications(res?.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("pages.notifications.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const emitUpdated = (): void => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("notificationsUpdated"));
    }
  };

  const markAsRead = async (n: NotificationItem): Promise<void> => {
    if (n.read) return;
    try {
      await apiClient(`/notifications/${n._id}/read`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((p) => (p._id === n._id ? { ...p, read: true } : p))
      );
      emitUpdated();
    } catch {
      /* swallow — non-critical */
    }
  };

  const handleClick = async (n: NotificationItem): Promise<void> => {
    setActive({ ...n, read: true });
    await markAsRead(n);
  };

  const handleMarkAllRead = async (): Promise<void> => {
    try {
      await apiClient("/notifications/read-all", { method: "PATCH" });
      setNotifications((prev) => prev.map((p) => ({ ...p, read: true })));
      emitUpdated();
    } catch {
      /* swallow */
    }
  };

  const isExternalLink = (link?: string): boolean =>
    Boolean(link && /^https?:\/\//i.test(link));

  const openActiveLink = (): void => {
    if (!active?.link) return;
    if (isExternalLink(active.link)) {
      window.open(active.link, "_blank", "noopener,noreferrer");
    } else {
      router.push(active.link);
    }
  };

  return (
    <div className="w-full min-h-screen bg-white">
      <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-5 flex items-center justify-between z-30">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="p-2 -ml-2 hover:bg-slate-50 rounded-full transition-all active:scale-90"
          >
            <ArrowLeft size={24} strokeWidth={2.5} className="text-slate-900" />
          </Link>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">{t("pages.notifications.title")}</h1>
            {!loading && notifications.length > 0 && (
              <p className="text-[11px] text-slate-400 font-medium">
                {t("pages.notifications2.unreadOf", { unread: notifications.filter((n) => !n.read).length, total: notifications.length })}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="text-[11px] font-black tracking-widest text-[#00aeff] hover:opacity-70 transition-opacity"
        >
          {t("pages.notifications.markAllRead")}
        </button>
      </div>

      {error && (
        <div className="mx-6 my-4 px-4 py-3 rounded-md bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-[#00aeff] animate-spin rounded-full" />
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((n) => (
            <button
              key={n._id}
              onClick={() => handleClick(n)}
              className={`text-left flex items-start gap-5 p-6 md:px-10 border-b border-slate-50 hover:bg-slate-50/50 transition-all group relative ${
                !n.read ? "bg-emerald-50/20" : ""
              }`}
            >
              <div className="flex-shrink-0 mt-1">{getIcon(n.type)}</div>
              <div className="flex-1 space-y-1 relative min-w-0">
                <div className="flex items-center gap-2">
                  <h3
                    className={`text-[15px] font-black ${
                      !n.read ? "text-slate-900" : "text-slate-600"
                    }`}
                  >
                    {n.title}
                  </h3>
                  {!n.read && (
                    <span className="w-1.5 h-1.5 bg-[#00aeff] rounded-full shadow-[0_0_8px_rgba(0,174,255,0.6)]" />
                  )}
                </div>
                <p className="text-sm text-slate-500 leading-relaxed max-w-3xl pb-4 line-clamp-2 whitespace-pre-wrap">
                  {n.body}
                </p>
                {n.metadata?.credentials && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded tracking-wider">
                    <Store size={10} /> {t("pages.notifications2.tapToViewCreds")}
                  </span>
                )}
                <div className="absolute bottom-0 right-0 bg-white/50 pl-2">
                  <p className="text-[10px] font-black text-slate-400 tracking-tight">
                    {formatTimeAgo(n.createdAt, t)}
                  </p>
                </div>              </div>
            </button>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-48 text-slate-200">
            <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mb-6">
              <Bell size={48} strokeWidth={1.2} className="text-slate-300" />
            </div>
            <p className="text-[11px] font-black tracking-[0.3em] text-slate-400">
              {t("pages.notifications.noNotifications")}
            </p>
          </div>
        )}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center animate-in fade-in duration-200"
          onClick={() => setActive(null)}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-t-3xl md:rounded-3xl shadow-2xl animate-in slide-in-from-bottom md:zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-slate-100">
              <div className="flex gap-4 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                  {getIcon(active.type, 22)}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-black text-slate-900 leading-tight">
                    {active.title}
                  </h2>
                  <p className="text-[11px] font-bold text-slate-400 tracking-wider mt-1">
                    {formatFullDate(active.createdAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActive(null)}
                className="p-2 -mr-2 -mt-2 hover:bg-slate-50 rounded-full active:scale-90 transition-all"
                aria-label={t("actions.close")}
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-6 flex-1 space-y-4">
              {active.metadata?.credentials && (
                <CredentialsCard credentials={active.metadata.credentials} />
              )}

              <div className="space-y-1">{renderBodyText(active.body || t("pages.notifications2.noContent"))}</div>

              {active.link && !active.metadata?.credentials && (
                <button
                  onClick={openActiveLink}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#00aeff] hover:bg-[#0096db] text-white text-sm font-black py-3 rounded-xl transition-colors mt-4"
                >
                  <ExternalLink size={16} />
                  {t("pages.notifications2.openLink")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
