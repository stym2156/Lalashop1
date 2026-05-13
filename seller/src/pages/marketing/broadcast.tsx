import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Loader2, Plus, Megaphone, Trash2, Send, Mail, Smartphone, Users,
  CheckCircle2, Clock, AlertCircle, X,
} from "lucide-react";
import {
  fetchMyBroadcasts,
  createBroadcast,
  sendBroadcast,
  deleteBroadcast,
  type SellerBroadcast,
  type BroadcastInput,
  type BroadcastChannel,
  type BroadcastAudience,
  type BroadcastStatus,
} from "@/services/sellerApi";

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

const STATUS_BADGE: Record<BroadcastStatus, string> = {
  draft: "bg-gray-100 text-gray-600",
  scheduled: "bg-blue-100 text-blue-700",
  sent: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
};

const CHANNEL_ICONS: Record<BroadcastChannel, typeof Mail> = {
  in_app: Smartphone,
  email: Mail,
};

const initialForm: BroadcastInput = {
  title: "",
  body: "",
  channel: "in_app",
  audience: "all_customers",
  link: "",
};

const BroadcastPage: React.FC = () => {
  const { t } = useTranslation("common");
  const [items, setItems] = useState<SellerBroadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<BroadcastInput>(initialForm);
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyBroadcasts();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pages.broadcast.errLoad'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const stats = useMemo(() => {
    const sent = items.filter((b) => b.status === "sent").length;
    const drafts = items.filter((b) => b.status === "draft").length;
    const totalReach = items.reduce(
      (s, b) => s + (b.metrics?.delivered || 0),
      0
    );
    return { total: items.length, sent, drafts, totalReach };
  }, [items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.title.trim()) return setError(t('pages.broadcast.errTitle'));
    if (!form.body.trim()) return setError(t('pages.broadcast.errBody'));
    setSaving(true);
    try {
      await createBroadcast(form);
      setShowForm(false);
      setForm(initialForm);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pages.broadcast.errCreate'));
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async (id: string) => {
    if (!window.confirm(t('pages.broadcast.sendConfirm'))) return;
    setSendingId(id);
    try {
      await sendBroadcast(id);
      await reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('pages.broadcast.errSend'));
    } finally {
      setSendingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('pages.broadcast.deleteConfirm'))) return;
    try {
      await deleteBroadcast(id);
      await reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('pages.broadcast.errDelete'));
    }
  };

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[16px] font-bold text-gray-900">{t('pages.broadcast.title')}</h1>
          <p className="text-[12px] text-gray-500 mt-0.5">
            {t('pages.broadcast.subtitle')}
          </p>
        </div>
        <button
          onClick={() => {
            setForm(initialForm);
            setShowForm(true);
          }}
          className="bg-[#00aeff] text-white px-3 py-1.5 rounded-md text-xs font-bold inline-flex items-center hover:bg-[#0096db]"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> {t('pages.broadcast.newBroadcast')}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Stat label={t('pages.broadcast.totalBroadcasts')} value={stats.total.toString()} />
        <Stat label={t('pages.broadcast.sent')} value={stats.sent.toString()} tone="text-emerald-700" />
        <Stat label={t('pages.broadcast.drafts')} value={stats.drafts.toString()} tone="text-gray-700" />
        <Stat
          label={t('pages.broadcast.totalReach')}
          value={stats.totalReach.toLocaleString()}
          tone="text-[#00aeff]"
        />
      </div>

      {error && !showForm && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="py-12 text-center">
          <Loader2 className="w-5 h-5 animate-spin text-gray-300 mx-auto" />
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center">
          <Megaphone className="w-8 h-8 mx-auto mb-3 text-gray-300" />
          <p className="text-[13px] font-bold text-gray-700">{t('pages.broadcast.noBroadcasts')}</p>
          <p className="text-[11px] text-gray-500 mt-1">
            {t('pages.broadcast.noBroadcastsHint')}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((b) => {
            const ChannelIcon = CHANNEL_ICONS[b.channel];
            return (
              <div
                key={b._id}
                className="rounded-lg border border-gray-100 p-4 flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-md bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <Megaphone className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-[13px] font-bold text-gray-900 truncate">{b.title}</h3>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wide ${STATUS_BADGE[b.status]}`}
                    >
                      {b.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 mt-1 line-clamp-2">{b.body}</p>
                  <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-2 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <ChannelIcon className="w-3 h-3" />
                      {b.channel === "in_app" ? t('pages.broadcast.inApp') : t('pages.broadcast.email')}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3 h-3" /> {t(`pages.broadcast.audience${b.audience === 'all_customers' ? 'AllCustomers' : b.audience === 'all_followers' ? 'AllFollowers' : b.audience === 'vip' ? 'Vip' : 'Inactive'}`)}
                    </span>
                    {b.audienceCount > 0 && (
                      <span className="text-gray-700 font-bold">
                        {t('pages.broadcast.recipients', { count: b.audienceCount })}
                      </span>
                    )}
                    {b.sentAt ? (
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {t('pages.broadcast.sentAt', { date: formatDate(b.sentAt) })}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {t('pages.broadcast.createdAt', { date: formatDate(b.createdAt) })}
                      </span>
                    )}
                  </div>
                  {b.status === "sent" && (
                    <div className="grid grid-cols-3 gap-2 mt-3 text-[11px]">
                      <div className="bg-gray-50 rounded px-2 py-1">
                        <p className="text-gray-400 text-[10px]">{t('pages.broadcast.delivered')}</p>
                        <p className="font-bold tabular-nums">
                          {b.metrics?.delivered?.toLocaleString() || 0}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded px-2 py-1">
                        <p className="text-gray-400 text-[10px]">{t('pages.broadcast.opened')}</p>
                        <p className="font-bold tabular-nums">
                          {b.metrics?.opened?.toLocaleString() || 0}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded px-2 py-1">
                        <p className="text-gray-400 text-[10px]">{t('pages.broadcast.clicked')}</p>
                        <p className="font-bold tabular-nums">
                          {b.metrics?.clicked?.toLocaleString() || 0}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {b.status === "draft" && (
                    <button
                      onClick={() => handleSend(b._id)}
                      disabled={sendingId === b._id}
                      className="bg-emerald-600 text-white px-3 py-1.5 rounded-md text-[11px] font-bold inline-flex items-center hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {sendingId === b._id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-3 h-3 mr-1" /> {t('pages.broadcast.sendNow')}
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(b._id)}
                    className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"
                    title={t('actions.delete')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-auto">
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[14px] font-bold text-gray-900">{t('pages.broadcast.newBroadcastForm')}</h2>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 px-3 py-2 text-[12px] text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5" /> {error}
                </div>
              )}

              <Field label={t('pages.broadcast.fieldTitle')}>
                <input
                  required
                  className="w-full border rounded px-2 py-1.5 text-xs"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder={t('pages.broadcast.titlePlaceholder')}
                />
              </Field>

              <Field label={t('pages.broadcast.fieldMessage')}>
                <textarea
                  required
                  className="w-full border rounded px-2 py-1.5 text-xs"
                  rows={4}
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder={t('pages.broadcast.messagePlaceholder')}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label={t('pages.broadcast.fieldChannel')}>
                  <select
                    className="w-full border rounded px-2 py-1.5 text-xs"
                    value={form.channel}
                    onChange={(e) =>
                      setForm({ ...form, channel: e.target.value as BroadcastChannel })
                    }
                  >
                    <option value="in_app">{t('pages.broadcast.channelInApp')}</option>
                    <option value="email">{t('pages.broadcast.channelEmail')}</option>
                  </select>
                </Field>
                <Field label={t('pages.broadcast.fieldAudience')}>
                  <select
                    className="w-full border rounded px-2 py-1.5 text-xs"
                    value={form.audience}
                    onChange={(e) =>
                      setForm({ ...form, audience: e.target.value as BroadcastAudience })
                    }
                  >
                    <option value="all_customers">{t('pages.broadcast.audienceAllCustomers')}</option>
                    <option value="all_followers">{t('pages.broadcast.audienceAllFollowers')}</option>
                    <option value="vip">{t('pages.broadcast.audienceVip')}</option>
                    <option value="inactive">{t('pages.broadcast.audienceInactive')}</option>
                  </select>
                </Field>
              </div>

              <Field label={t('pages.broadcast.fieldLink')}>
                <input
                  className="w-full border rounded px-2 py-1.5 text-xs"
                  value={form.link || ""}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  placeholder={t('pages.broadcast.linkPlaceholder')}
                />
              </Field>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-3 py-1.5 rounded border text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  {t('actions.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 rounded bg-[#00aeff] text-white text-xs font-bold hover:bg-[#0096db] disabled:opacity-50"
                >
                  {saving ? t('actions.saving') : t('pages.broadcast.saveAsDraft')}
                </button>
              </div>
              <p className="text-[10px] text-gray-400 text-center">
                {t('pages.broadcast.draftHint')}
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block">
    <span className="text-[10px] font-semibold text-gray-500 tracking-wide block mb-1">
      {label}
    </span>
    {children}
  </label>
);

const Stat: React.FC<{ label: string; value: string; tone?: string }> = ({
  label,
  value,
  tone,
}) => (
  <div className="rounded-lg border border-gray-100 px-4 py-3">
    <p className="text-[11px] font-semibold text-gray-500 tracking-wide">{label}</p>
    <p className={`text-[20px] font-bold tabular-nums mt-1 ${tone || "text-gray-900"}`}>{value}</p>
  </div>
);

export default BroadcastPage;
