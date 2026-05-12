import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  ArrowLeft, Loader2, AlertCircle, Send, CheckCircle2,
  Mail, Calendar, User as UserIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  fetchAdminTicket,
  replyAdminTicket,
  updateAdminTicket,
  type AdminTicketRow,
  type TicketStatus,
  type TicketPriority,
} from "@/services/adminApi";

const formatDate = (s?: string): string => {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const STATUS_BADGE: Record<TicketStatus, string> = {
  open: "bg-blue-50 text-blue-700",
  in_progress: "bg-amber-50 text-amber-700",
  resolved: "bg-green-50 text-green-700",
  closed: "bg-gray-100 text-gray-600",
};

const SupportDetailPage: React.FC = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const ticketId = typeof router.query.id === "string" ? router.query.id : null;

  const [ticket, setTicket] = useState<AdminTicketRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);

  const reload = async () => {
    if (!ticketId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminTicket(ticketId);
      setTicket(res.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pages.support.details.notFound'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketId || !reply.trim()) return;
    setSending(true);
    try {
      const res = await replyAdminTicket(ticketId, reply.trim());
      if (res.data) setTicket(res.data);
      setReply("");
    } catch (err) {
      alert(err instanceof Error ? err.message : t('pages.support.details.reply'));
    } finally {
      setSending(false);
    }
  };

  const updateField = async (
    payload: { status?: TicketStatus; priority?: TicketPriority }
  ) => {
    if (!ticketId) return;
    setUpdating(true);
    try {
      const res = await updateAdminTicket(ticketId, payload);
      if (res.data) setTicket(res.data);
    } catch (err) {
      alert(err instanceof Error ? err.message : t('actions.update'));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="w-5 h-5 animate-spin text-gray-300 mx-auto" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="space-y-3">
        <Link href="/support" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-black">
          <ArrowLeft className="w-4 h-4" /> {t('pages.support.details.back')}
        </Link>
        <div className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700 inline-flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5" /> {error || t('pages.support.details.notFound')}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-sm max-w-4xl">
      <Link
        href="/support"
        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-black"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> {t('pages.support.details.back')}
      </Link>

      {/* Header */}
      <div className="rounded-lg border border-gray-100 p-4 bg-white">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[16px] font-bold text-gray-900">{ticket.subject}</h1>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wide ${STATUS_BADGE[ticket.status]}`}
              >
                {ticket.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              {t('pages.support.details.category')}: <span className="font-bold capitalize">{ticket.category}</span> · {t('pages.support.details.opened')}{" "}
              {formatDate(ticket.createdAt)}
            </p>
          </div>
        </div>

        {/* Quick controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <Field label={t('pages.support.details.statusLabel')}>
            <select
              value={ticket.status}
              onChange={(e) => updateField({ status: e.target.value as TicketStatus })}
              disabled={updating}
              className="w-full bg-gray-50 border border-gray-100 focus:bg-white focus:border-gray-200 outline-none rounded px-2 py-1.5 text-xs disabled:opacity-50"
            >
              <option value="open">{t('pages.support.details.statusOptions.open')}</option>
              <option value="in_progress">{t('pages.support.details.statusOptions.inProgress')}</option>
              <option value="resolved">{t('pages.support.details.statusOptions.resolved')}</option>
              <option value="closed">{t('pages.support.details.statusOptions.closed')}</option>
            </select>
          </Field>
          <Field label={t('pages.support.details.priority')}>
            <select
              value={ticket.priority}
              onChange={(e) => updateField({ priority: e.target.value as TicketPriority })}
              disabled={updating}
              className="w-full bg-gray-50 border border-gray-100 focus:bg-white focus:border-gray-200 outline-none rounded px-2 py-1.5 text-xs disabled:opacity-50"
            >
              <option value="low">{t('pages.support.details.priorityOptions.low')}</option>
              <option value="normal">{t('pages.support.details.priorityOptions.normal')}</option>
              <option value="high">{t('pages.support.details.priorityOptions.high')}</option>
              <option value="urgent">{t('pages.support.details.priorityOptions.urgent')}</option>
            </select>
          </Field>
        </div>
      </div>

      {/* User panel */}
      <div className="rounded-lg border border-gray-100 p-4 bg-white">
        <h3 className="text-[11px] font-bold text-gray-500 tracking-wide mb-3">
          {t('pages.support.details.submittedBy')}
        </h3>
        <div className="flex items-center gap-3">
          {ticket.user?.profileImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ticket.user.profileImage}
              alt=""
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-gray-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">
              {ticket.user?.name || ticket.user?.email || "—"}
            </p>
            <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-0.5">
              {ticket.user?.email && (
                <span className="inline-flex items-center gap-1">
                  <Mail className="w-3 h-3" /> {ticket.user.email}
                </span>
              )}
              {ticket.user?.customId && <span>{ticket.user.customId}</span>}
            </div>
          </div>
          {ticket.user?._id && (
            <Link
              href={`/users/${ticket.user._id}`}
              className="text-[11px] font-bold text-[#00aeff] hover:underline"
            >
              {t('pages.support.details.viewProfile')}
            </Link>
          )}
        </div>
      </div>

      {/* Conversation */}
      <div className="rounded-lg border border-gray-100 bg-white">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">{t('pages.support.details.conversation')}</h3>
        </div>
        <div className="p-4 space-y-3">
          {/* Initial message */}
          <MessageBubble
            authorRole="user"
            authorName={ticket.user?.name || ticket.user?.email || t('table.user')}
            message={ticket.description}
            createdAt={ticket.createdAt}
            youAdminLabel={t('pages.support.details.youAdmin')}
          />
          {ticket.replies.map((r) => (
            <MessageBubble
              key={r._id || r.createdAt}
              authorRole={r.authorRole}
              authorName={
                typeof r.author === "string"
                  ? "—"
                  : r.author?.name || r.author?.email || "—"
              }
              message={r.message}
              createdAt={r.createdAt}
              youAdminLabel={t('pages.support.details.youAdmin')}
            />
          ))}
        </div>

        {/* Reply form */}
        {ticket.status === "closed" ? (
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-center">
            <p className="text-[11px] text-gray-500">
              <CheckCircle2 className="w-3 h-3 inline mr-1" /> {t('pages.support.details.ticketClosed')}
            </p>
          </div>
        ) : (
          <form onSubmit={handleReply} className="px-4 py-3 border-t border-gray-100 space-y-2">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={3}
              placeholder={t('pages.support.details.replyPlaceholder')}
              className="w-full bg-gray-50 border border-gray-100 focus:bg-white focus:border-gray-200 outline-none rounded px-3 py-2 text-xs resize-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!reply.trim() || sending}
                className="bg-[#00aeff] text-white px-4 py-1.5 rounded-md text-xs font-bold inline-flex items-center hover:bg-[#0096db] disabled:opacity-50"
              >
                {sending ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                )}
                {sending ? t('pages.support.details.sending') : t('pages.support.details.sendReply')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

interface MessageBubbleProps {
  authorRole: "user" | "admin";
  authorName: string;
  message: string;
  createdAt: string;
  youAdminLabel: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ authorRole, authorName, message, createdAt, youAdminLabel }) => {
  const mine = authorRole === "admin";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 shadow-sm ${
          mine
            ? "bg-[#00aeff] text-white rounded-br-md"
            : "bg-gray-50 text-gray-900 rounded-bl-md border border-gray-100"
        }`}
      >
        <div
          className={`flex items-center gap-2 text-[10px] mb-1 ${
            mine ? "text-white/80" : "text-gray-500"
          }`}
        >
          <span className="font-bold">{mine ? youAdminLabel : authorName}</span>
          <Calendar className="w-2.5 h-2.5" />
          <span>{formatDate(createdAt)}</span>
        </div>
        <p className="text-xs whitespace-pre-wrap leading-relaxed">{message}</p>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="text-[10px] font-bold text-gray-500 tracking-wide block mb-1">
      {label}
    </label>
    {children}
  </div>
);

export default SupportDetailPage;
