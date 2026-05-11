import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  Search, Send, Check, CheckCheck, Loader2, MessageCircle, Package, ExternalLink,
  Image as ImageIcon,
} from "lucide-react";
import {
  fetchConversations,
  fetchMessages,
  markConversationRead,
  sendChatMessage,
  type ChatConversation,
  type ChatMessage,
} from "@/services/messagesApi";
import { useCurrentSeller } from "@/services/useCurrentSeller";
import { uploadImage } from "@/services/uploadImage";

type FilterKey = "all" | "unread";

const FILTER_LABEL_KEYS: Record<FilterKey, string> = {
  all: "pages.inbox.filterAll",
  unread: "pages.inbox.filterUnread",
};
const FILTERS: { key: FilterKey }[] = [
  { key: "all" },
  { key: "unread" },
];

const REFRESH_MS = 15000;

const formatTime = (s?: string): string => {
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d`;
  return d.toLocaleDateString();
};

const formatClock = (s?: string): string => {
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
};

const isSameDay = (a?: string, b?: string): boolean => {
  if (!a || !b) return false;
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
};

const formatDayLabel = (s?: string): string => {
  if (!s) return "";
  const d = new Date(s);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const that = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = (today.getTime() - that.getTime()) / 86400000;
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return d.toLocaleDateString([], { weekday: "long" });
  return d.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
};

const initial = (name?: string): string =>
  (name || "?").trim().charAt(0).toUpperCase() || "?";

const InboxPage: React.FC = () => {
  const { t } = useTranslation("common");
  const { seller } = useCurrentSeller();
  const meId = seller?._id || null;

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reload conversations + poll periodically so inbound messages appear without
  // a manual refresh.
  const loadConversations = async () => {
    try {
      const list = await fetchConversations();
      setConversations(list);
      // Auto-select the most recent conversation on first load.
      setSelectedId((prev) => prev ?? list[0]?._id ?? null);
    } catch {
      /* surfaces empty state */
    } finally {
      setLoadingConvs(false);
    }
  };

  useEffect(() => {
    void loadConversations();
    const handle = setInterval(loadConversations, REFRESH_MS);
    return () => clearInterval(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load thread when active conversation changes; poll for new messages.
  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setLoadingMessages(true);

    const load = async () => {
      try {
        const list = await fetchMessages(selectedId);
        if (!cancelled) setMessages(list);
      } catch {
        if (!cancelled) setMessages([]);
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    };

    void load();
    const handle = setInterval(load, REFRESH_MS / 3);

    // Mark read once (best-effort) when opening the thread. Notify the sidebar
    // so its Messages badge updates without waiting for its next poll.
    markConversationRead(selectedId).then(() => {
      void loadConversations();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("messages:refresh"));
      }
    }).catch(() => {});

    return () => {
      cancelled = true;
      clearInterval(handle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedId]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c._id === selectedId) || null,
    [conversations, selectedId]
  );

  const visibleConversations = useMemo(() => {
    return conversations.filter((c) => {
      if (filter === "unread" && c.unreadCount === 0) return false;
      if (search) {
        const q = search.toLowerCase();
        const peer = c.peer;
        if (
          !peer?.name?.toLowerCase().includes(q) &&
          !peer?.username?.toLowerCase().includes(q) &&
          !c.lastMessageText?.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [conversations, filter, search]);

  const stats = useMemo(() => {
    const unread = conversations.reduce((s, c) => s + c.unreadCount, 0);
    const awaiting = conversations.filter((c) => c.unreadCount > 0).length;
    return { total: conversations.length, unread, awaiting };
  }, [conversations]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = draft.trim();
    if (!text || !selectedId || sending) return;
    setSending(true);
    setDraft("");
    try {
      const msg = await sendChatMessage(selectedId, { body: text });
      if (msg) {
        setMessages((prev) => [...prev, msg]);
        await loadConversations();
      }
    } catch {
      setDraft(text);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // Upload + send images. Each file becomes its own message so the buyer can
  // tap individual images.
  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length || !selectedId || uploading) return;
    setUploading(true);
    try {
      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;
        const url = await uploadImage(file, "messages");
        const msg = await sendChatMessage(selectedId, { kind: "image", imageUrl: url });
        if (msg) setMessages((prev) => [...prev, msg]);
      }
      await loadConversations();
    } catch (err) {
      console.error("Image send failed", err);
    } finally {
      setUploading(false);
    }
  };

  const handleMarkAllRead = async () => {
    const unread = conversations.filter((c) => c.unreadCount > 0);
    await Promise.all(unread.map((c) => markConversationRead(c._id)));
    await loadConversations();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("messages:refresh"));
    }
  };

  return (
    <div className="space-y-4 text-sm">
      {/* Title bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[16px] font-bold text-gray-900">{t('pages.inbox.title')}</h1>
          <p className="text-[12px] text-gray-500 mt-0.5">
            {t('pages.inbox.subtitle')}
          </p>
        </div>
        <button
          onClick={handleMarkAllRead}
          disabled={stats.unread === 0}
          className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-100 inline-flex items-center disabled:opacity-50"
        >
          <Check className="w-3.5 h-3.5 mr-1.5" /> {t('pages.inbox.markAllRead')}
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        <KPI label={t('pages.inbox.totalConversations')} value={stats.total.toString()} />
        <KPI label={t('pages.inbox.unreadMessages')} value={stats.unread.toString()} tone="text-rose-600" />
        <KPI label={t('pages.inbox.awaitingReply')} value={stats.awaiting.toString()} tone="text-amber-600" />
      </div>

      {/* 3-column workspace */}
      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-260px)] min-h-[480px]">
        {/* Left: conversation list */}
        <div className="col-span-12 md:col-span-4 lg:col-span-3 rounded-lg border border-gray-100 flex flex-col overflow-hidden bg-white">
          <div className="px-3 py-2.5 border-b border-gray-100">
            <div className="inline-flex items-center bg-gray-100 rounded-md p-0.5 w-full">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`flex-1 px-2 py-1 rounded text-[11px] font-bold transition-colors ${
                    filter === f.key ? "bg-white text-black shadow-sm" : "text-gray-600 hover:text-black"
                  }`}
                >
                  {t(FILTER_LABEL_KEYS[f.key])}
                </button>
              ))}
            </div>
          </div>

          <div className="px-3 py-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('pages.inbox.searchPlaceholder')}
                className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-gray-200 outline-none pl-7 pr-3 py-1.5 rounded text-[11px]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="text-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-gray-300 mx-auto" />
              </div>
            ) : visibleConversations.length === 0 ? (
              <div className="text-center py-10 px-4 text-gray-400">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                <p className="text-[12px] font-bold text-gray-600">
                  {conversations.length === 0 ? t('pages.inbox.noMessages') : t('common.noMatches')}
                </p>
                {conversations.length === 0 && (
                  <p className="text-[11px] mt-1">
                    {t('pages.inbox.buyerHint')}
                  </p>
                )}
              </div>
            ) : (
              visibleConversations.map((c) => {
                const isSelected = c._id === selectedId;
                const peer = c.peer;
                const name = peer?.name || peer?.username || t('common.user');
                return (
                  <button
                    key={c._id}
                    onClick={() => setSelectedId(c._id)}
                    className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 transition-colors border-b border-gray-50 ${
                      isSelected ? "bg-blue-50/50" : "hover:bg-gray-50"
                    }`}
                  >
                    {peer?.profileImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={peer.profileImage}
                        alt={name}
                        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00aeff] to-[#0096db] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {initial(peer?.name || peer?.username)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-xs truncate ${
                            c.unreadCount > 0 ? "font-bold text-gray-900" : "font-semibold text-gray-700"
                          }`}
                        >
                          {name}
                        </span>
                        <span className="text-[10px] text-gray-400 tabular-nums flex-shrink-0">
                          {formatTime(c.lastMessageAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <span
                          className={`text-[11px] truncate ${
                            c.unreadCount > 0 ? "text-gray-900 font-semibold" : "text-gray-500"
                          }`}
                        >
                          {c.lastMessageText || t('pages.inbox.tapToView')}
                        </span>
                        {c.unreadCount > 0 && (
                          <span className="text-[10px] font-bold bg-[#00aeff] text-white rounded-full px-1.5 py-px tabular-nums flex-shrink-0">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Middle: thread */}
        <div className="col-span-12 md:col-span-8 lg:col-span-9 rounded-lg border border-gray-100 flex flex-col overflow-hidden bg-white">
          {!activeConversation ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <MessageCircle className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-[13px] font-bold text-gray-600">{t('pages.inbox.selectConversation')}</p>
              <p className="text-[11px] mt-1">{t('pages.inbox.selectConversationHint')}</p>
            </div>
          ) : (
            <ThreadPane
              conversation={activeConversation}
              messages={messages}
              loading={loadingMessages}
              meId={meId}
              draft={draft}
              setDraft={setDraft}
              sending={sending}
              uploading={uploading}
              onSend={handleSend}
              onPickImage={() => fileInputRef.current?.click()}
              inputRef={inputRef}
              messagesEndRef={messagesEndRef}
            />
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleImagePick}
      />
    </div>
  );
};

interface ThreadPaneProps {
  conversation: ChatConversation;
  messages: ChatMessage[];
  loading: boolean;
  meId: string | null;
  draft: string;
  setDraft: (v: string) => void;
  sending: boolean;
  uploading: boolean;
  onSend: (e?: React.FormEvent) => void;
  onPickImage: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const ThreadPane: React.FC<ThreadPaneProps> = ({
  conversation, messages, loading, meId, draft, setDraft, sending, uploading, onSend, onPickImage, inputRef, messagesEndRef,
}) => {
  const peer = conversation.peer;
  const peerId = peer?._id;
  const name = peer?.name || peer?.username || "User";

  // Last message I sent that the buyer has read → "Seen" indicator.
  const lastReadIndex = useMemo(() => {
    if (!meId || !peerId) return -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      const senderId = typeof m.sender === "string" ? m.sender : m.sender?._id;
      if (senderId !== meId) continue;
      if ((m.readBy || []).some((r) => String(r) === peerId)) return i;
    }
    return -1;
  }, [messages, meId, peerId]);

  const lastMineIndex = useMemo(() => {
    if (!meId) return -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      const senderId = typeof m.sender === "string" ? m.sender : m.sender?._id;
      if (senderId === meId) return i;
    }
    return -1;
  }, [messages, meId]);

  return (
    <>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
        <div className="flex items-center gap-2.5 min-w-0">
          {peer?.profileImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={peer.profileImage}
              alt={name}
              className="w-9 h-9 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00aeff] to-[#0096db] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
              {initial(peer?.name || peer?.username)}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-bold text-black truncate">{name}</p>
            {peer?.username && (
              <p className="text-[11px] text-gray-500 truncate">@{peer.username}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-gray-50/30">
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-gray-300 mx-auto" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-[11px] text-gray-400 py-8">No messages in this thread.</p>
        ) : (
          messages.map((m, i) => {
            const senderId = typeof m.sender === "string" ? m.sender : m.sender?._id;
            const mine = meId && senderId === meId;
            const prev = messages[i - 1];
            const showDay = !isSameDay(prev?.createdAt, m.createdAt);
            return (
              <React.Fragment key={m._id}>
                {showDay && (
                  <div className="flex justify-center my-2">
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-200/70 px-2.5 py-0.5 rounded-full">
                      {formatDayLabel(m.createdAt)}
                    </span>
                  </div>
                )}
                <div className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                  {m.kind === "product" && m.productContext ? (
                    <ProductInquiryCard product={m.productContext} mine={!!mine} body={m.body} />
                  ) : (
                    <div
                      className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
                        mine
                          ? "bg-[#00aeff] text-white rounded-br-md"
                          : "bg-white text-gray-900 rounded-bl-md border border-gray-100"
                      }`}
                    >
                      {m.kind === "image" && m.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.imageUrl} alt="" className="rounded-lg max-w-full" />
                      ) : (
                        <span className="whitespace-pre-wrap break-words">{m.body}</span>
                      )}
                    </div>
                  )}
                  <span className="text-[10px] text-gray-400 mt-0.5 px-1 tabular-nums inline-flex items-center gap-1">
                    {formatClock(m.createdAt)}
                    {mine && i === lastReadIndex && (
                      <span className="text-[#00aeff] inline-flex items-center gap-0.5 font-bold">
                        <CheckCheck className="w-3 h-3" /> Seen
                      </span>
                    )}
                    {mine && i === lastMineIndex && i !== lastReadIndex && (
                      <span className="text-gray-400 inline-flex items-center" title="Sent">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </span>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={onSend}
        className="px-3 py-2.5 flex items-center gap-2 border-t border-gray-100 bg-white"
      >
        <button
          type="button"
          onClick={onPickImage}
          disabled={uploading}
          className="p-2 rounded-full text-gray-500 hover:text-[#00aeff] hover:bg-gray-100 transition-colors disabled:opacity-50"
          aria-label="Send photo"
          title="Send photo"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
        </button>
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Reply to ${name}…`}
          className="flex-1 bg-gray-50 rounded-full px-4 py-2 text-sm border border-transparent focus:bg-white focus:border-gray-200 outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending}
          className="p-2 rounded-full bg-[#00aeff] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#0096db] transition-colors"
          aria-label="Send"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </>
  );
};

interface ProductInquiryCardProps {
  product: { productId: string; name: string; image: string; price: number; slug?: string };
  mine: boolean;
  body?: string;
}

const ProductInquiryCard: React.FC<ProductInquiryCardProps> = ({ product, mine, body }) => (
  <div
    className={`max-w-[80%] rounded-2xl shadow-sm overflow-hidden ${
      mine ? "rounded-br-md" : "rounded-bl-md border border-gray-100"
    }`}
  >
    <div className={mine ? "bg-[#00aeff] text-white" : "bg-white text-gray-900"}>
      <div className="flex gap-2 p-2">
        {product.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-gray-100"
          />
        )}
        <div className="flex-1 min-w-0 py-0.5">
          <p
            className={`text-[10px] font-bold tracking-wide flex items-center gap-1 ${
              mine ? "text-white/80" : "text-gray-400"
            }`}
          >
            <Package className="w-3 h-3" /> Asking about
          </p>
          <p className="text-sm font-bold leading-snug line-clamp-2">{product.name}</p>
          <div className="flex items-center justify-between mt-0.5">
            <p
              className={`text-xs font-black tabular-nums ${
                mine ? "text-white" : "text-[#00aeff]"
              }`}
            >
              ฿{Number(product.price || 0).toLocaleString()}
            </p>
            <Link
              href={`/products/list?highlight=${product.productId}`}
              className={`text-[10px] font-bold inline-flex items-center gap-0.5 hover:underline ${
                mine ? "text-white/90" : "text-gray-500"
              }`}
            >
              Open <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
    {body && (
      <p
        className={`px-3 py-2 text-sm border-t whitespace-pre-wrap break-words ${
          mine
            ? "bg-[#00aeff]/90 text-white border-white/20"
            : "bg-white text-gray-900 border-gray-100"
        }`}
      >
        {body}
      </p>
    )}
  </div>
);

interface KPIProps {
  label: string;
  value: string;
  tone?: string;
}

const KPI: React.FC<KPIProps> = ({ label, value, tone }) => (
  <div className="rounded-lg border border-gray-100 bg-white px-4 py-3">
    <p className="text-[11px] font-semibold text-gray-500 tracking-wide">{label}</p>
    <p className={`text-xl font-bold tabular-nums mt-1 ${tone || "text-gray-900"}`}>{value}</p>
  </div>
);

export default InboxPage;
