import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, MessageSquare, X, Loader2, Send, AlertCircle } from "lucide-react";
import {
  fetchMyTickets,
  createTicket,
  type SellerTicketRow,
  type TicketCategory,
  type TicketStatus,
} from "@/services/sellerApi";

const statusBadge: Record<TicketStatus, string> = {
  open: "bg-blue-50 text-blue-700",
  in_progress: "bg-amber-50 text-amber-700",
  resolved: "bg-green-50 text-green-700",
  closed: "bg-gray-100 text-gray-600",
};

const priorityBadge: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  normal: "bg-blue-50 text-blue-700",
  high: "bg-orange-50 text-orange-700",
  urgent: "bg-red-50 text-red-700",
};

const formatDate = (s?: string): string => {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const TicketsPage: React.FC = () => {
  const { t } = useTranslation("common");
  const [tickets, setTickets] = useState<SellerTicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [active, setActive] = useState<SellerTicketRow | null>(null);

  // form state
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<TicketCategory>("other");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high" | "urgent">("normal");
  const [submitting, setSubmitting] = useState(false);

  const load = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyTickets();
      setTickets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      await createTicket({
        subject: subject.trim(),
        category,
        description: description.trim(),
        priority,
      });
      setSubject("");
      setDescription("");
      setCategory("other");
      setPriority("normal");
      setCreating(false);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[16px] font-bold text-gray-900">{t('pages.tickets.title')}</h1>
          <p className="text-[12px] text-gray-500 mt-0.5">
            {t('pages.tickets.subtitle')}
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="bg-[#00aeff] text-white px-3 py-1.5 rounded-md text-xs font-bold inline-flex items-center hover:bg-[#0096db]"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" /> {t('pages.tickets.newTicket')}
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700 inline-flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </div>
      )}

      <div className="rounded-lg overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] tabular-nums">
            <thead className="text-[11px] text-gray-500 tracking-wide bg-gray-50/50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">Ticket</th>
                <th className="px-4 py-2 text-left font-semibold">Category</th>
                <th className="px-4 py-2 text-left font-semibold">Priority</th>
                <th className="px-4 py-2 text-left font-semibold">Status</th>
                <th className="px-4 py-2 text-right font-semibold">Replies</th>
                <th className="px-4 py-2 text-left font-semibold">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                    <Loader2 className="w-5 h-5 mx-auto animate-spin" />
                  </td>
                </tr>
              )}
              {!loading && tickets.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-[12px]">
                    <MessageSquare className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                    No tickets yet — open one to ask for help.
                  </td>
                </tr>
              )}
              {!loading &&
                tickets.map((t) => (
                  <tr
                    key={t._id}
                    onClick={() => setActive(t)}
                    className="border-t border-gray-50 hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4 py-2">
                      <p className="font-bold text-gray-900 line-clamp-1">{t.subject}</p>
                      <p className="font-mono text-[10px] text-gray-400">
                        TKT-{t._id.slice(-6).toUpperCase()}
                      </p>
                    </td>
                    <td className="px-4 py-2 text-gray-700 capitalize">{t.category}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded capitalize ${priorityBadge[t.priority]}`}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded capitalize ${statusBadge[t.status]}`}
                      >
                        {t.status === "in_progress" ? "in progress" : t.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right text-gray-700">{t.replies?.length ?? 0}</td>
                    <td className="px-4 py-2 text-gray-500 text-[11px]">{formatDate(t.createdAt)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create ticket modal */}
      {creating && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !submitting && setCreating(false)}
        >
          <form
            onSubmit={onSubmit}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-lg p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-gray-900">New support ticket</h2>
              <button
                type="button"
                onClick={() => setCreating(false)}
                disabled={submitting}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 tracking-wide">SUBJECT</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                placeholder="Briefly summarize your issue"
                className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-md text-sm outline-none focus:border-[#00aeff]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-500 tracking-wide">CATEGORY</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TicketCategory)}
                  className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-md text-sm outline-none focus:border-[#00aeff]"
                >
                  <option value="payments">Payments</option>
                  <option value="orders">Orders</option>
                  <option value="account">Account</option>
                  <option value="products">Products</option>
                  <option value="shop">Shop</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 tracking-wide">PRIORITY</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as typeof priority)}
                  className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-md text-sm outline-none focus:border-[#00aeff]"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 tracking-wide">DESCRIPTION</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={5}
                placeholder="Describe what happened, what you've tried, and what you need..."
                className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-md text-sm outline-none focus:border-[#00aeff] resize-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCreating(false)}
                disabled={submitting}
                className="px-4 py-2 rounded-md text-[12px] font-medium text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#00aeff] text-white px-4 py-2 rounded-md text-[12px] font-bold inline-flex items-center hover:bg-[#0096db] disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1.5" />}
                {submitting ? "Submitting..." : "Submit ticket"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Detail modal */}
      {active && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActive(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-[15px] font-bold text-gray-900">{active.subject}</h2>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  TKT-{active._id.slice(-6).toUpperCase()} ·{" "}
                  <span className="capitalize">{active.category}</span> ·{" "}
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold capitalize ${statusBadge[active.status]}`}
                  >
                    {active.status === "in_progress" ? "in progress" : active.status}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setActive(null)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-4 flex-1 space-y-3">
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-[10px] font-bold text-gray-500 tracking-wide mb-1">
                  You · {formatDate(active.createdAt)}
                </p>
                <p className="text-[13px] text-gray-700 whitespace-pre-wrap">{active.description}</p>
              </div>
              {active.replies?.map((r, idx) => (
                <div
                  key={r._id || idx}
                  className={`rounded-lg p-3 ${r.authorRole === "admin" ? "bg-blue-50" : "bg-gray-50"}`}
                >
                  <p className="text-[10px] font-bold tracking-wide mb-1 text-gray-500">
                    {r.authorRole === "admin" ? "Support team" : "You"} · {formatDate(r.createdAt)}
                  </p>
                  <p className="text-[13px] text-gray-700 whitespace-pre-wrap">{r.message}</p>
                </div>
              ))}
              {(!active.replies || active.replies.length === 0) && (
                <p className="text-[11px] text-gray-400 text-center py-4">
                  Awaiting a response from the support team.
                </p>
              )}
            </div>
            <div className="px-5 py-3 border-t border-gray-100 text-[11px] text-gray-400">
              Reply via the customer site or wait for an admin response — you'll be notified when
              the team replies.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketsPage;
