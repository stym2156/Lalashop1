import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { X, Send, Loader2, ArrowLeft, MessageCircle, Search, Image as ImageIcon, Check, CheckCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import Avatar from "@/components/ui/Avatar";
import { useChat } from "./ChatContext";
import { useCurrentUser } from "@/services/useCurrentUser";
import { uploadImage } from "@/services/uploadImage";
import {
  fetchMessages,
  markConversationRead,
  sendMessage,
  type ChatMessage,
  type ProductContext,
} from "@/services/messagesApi";

// Compact time used in conversation list previews and message bubbles.
const formatTime = (s?: string): string => {
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d`;
  return d.toLocaleDateString();
};

// Explicit clock time shown under each message bubble (e.g. "14:23").
const formatClock = (s?: string): string => {
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
};

// Day separator label shown between message clusters from different days.
const formatDayLabel = (s?: string): string => {
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const that = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayMs = 86400000;
  const diff = (today.getTime() - that.getTime()) / dayMs;
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return d.toLocaleDateString([], { weekday: "long" });
  return d.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
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

const ChatPanel: React.FC = () => {
  const { t } = useTranslation("common");
  const router = useRouter();
  const {
    isOpen,
    close,
    conversations,
    activeConversationId,
    setActiveConversationId,
    refreshConversations,
    refreshUnread,
    isAuthed,
  } = useChat();

  // Navigate to a peer's profile and close the panel — used by avatar/name
  // click-throughs both in the conversation list and the message header.
  const goToProfile = (peerId?: string) => {
    if (!peerId) return;
    close();
    void router.push(`/u/${peerId}`);
  };

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resolve current user id. Try cached userInfo first so the first render
  // already knows who "me" is — otherwise messages briefly render on the
  // wrong side while /auth/me is in flight.
  const { user: currentUser } = useCurrentUser();
  const cachedMeId = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      const cached = JSON.parse(window.localStorage.getItem("userInfo") || "null");
      return cached?._id ? String(cached._id) : null;
    } catch {
      return null;
    }
  }, []);
  const meId = currentUser?._id ?? cachedMeId;

  const activeConversation = useMemo(
    () => conversations.find((c) => c._id === activeConversationId) || null,
    [conversations, activeConversationId]
  );

  // Load messages when active conversation changes.
  useEffect(() => {
    if (!activeConversationId || !isAuthed) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setLoadingMessages(true);
    fetchMessages(activeConversationId)
      .then(async (list) => {
        if (cancelled) return;
        setMessages(list);
        try {
          await markConversationRead(activeConversationId);
          await refreshUnread();
          await refreshConversations();
        } catch {
          /* ignore */
        }
      })
      .catch(() => {
        if (!cancelled) setMessages([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingMessages(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeConversationId, isAuthed, refreshUnread, refreshConversations]);

  // Auto-scroll to latest message.
  useEffect(() => {
    if (!messagesEndRef.current) return;
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeConversationId]);

  // Focus the composer when a conversation is opened.
  useEffect(() => {
    if (activeConversationId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeConversationId]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = draft.trim();
    if (!text || !activeConversationId || sending) return;
    setSending(true);
    setDraft("");
    try {
      const msg = await sendMessage(activeConversationId, { body: text });
      if (msg) {
        setMessages((prev) => [...prev, msg]);
        await refreshConversations();
      }
    } catch {
      setDraft(text);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // Upload image to R2 then send it as a chat attachment. Multiple files
  // produce one message per image so each can be tapped/zoomed individually.
  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length || !activeConversationId || uploading) return;
    setUploading(true);
    try {
      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;
        const url = await uploadImage(file, "messages");
        const msg = await sendMessage(activeConversationId, {
          kind: "image",
          imageUrl: url,
        });
        if (msg) setMessages((prev) => [...prev, msg]);
      }
      await refreshConversations();
    } catch (err) {
      // Surface a minimal error in the input so the user knows something failed.
      console.error("Image send failed", err);
    } finally {
      setUploading(false);
    }
  };

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const peer = c.peer;
      if (!peer) return false;
      return (
        peer.name?.toLowerCase().includes(q) ||
        peer.username?.toLowerCase().includes(q) ||
        c.lastMessageText?.toLowerCase().includes(q)
      );
    });
  }, [conversations, search]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[80] bg-black/30 backdrop-blur-sm md:bg-transparent md:backdrop-blur-0"
        onClick={close}
        aria-hidden
      />
      <aside
        className="fixed top-0 right-0 z-[81] h-full w-full sm:w-[420px] bg-white shadow-2xl border-l border-slate-100 flex flex-col animate-in slide-in-from-right duration-200"
        role="dialog"
        aria-label="Messages"
      >
        {!activeConversation ? (
          <ConversationList
            search={search}
            setSearch={setSearch}
            conversations={filteredConversations}
            onSelect={(id) => setActiveConversationId(id)}
            onClose={close}
            onPeerClick={goToProfile}
          />
        ) : (
          <ConversationView
            peerName={activeConversation.peer?.name || activeConversation.peer?.username || "User"}
            peerUsername={activeConversation.peer?.username}
            peerAvatar={activeConversation.peer?.profileImage}
            peerId={activeConversation.peer?._id}
            messages={messages}
            loading={loadingMessages}
            meId={meId}
            draft={draft}
            setDraft={setDraft}
            sending={sending}
            uploading={uploading}
            onSend={handleSend}
            onPickImage={() => fileInputRef.current?.click()}
            onBack={() => setActiveConversationId(null)}
            onClose={close}
            onPeerClick={goToProfile}
            inputRef={inputRef}
            messagesEndRef={messagesEndRef}
          />
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImagePick}
        />
      </aside>
    </>
  );
};

interface ConversationListProps {
  search: string;
  setSearch: (v: string) => void;
  conversations: ReturnType<typeof useChat>["conversations"];
  onSelect: (id: string) => void;
  onClose: () => void;
  onPeerClick: (peerId?: string) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  search,
  setSearch,
  conversations,
  onSelect,
  onClose,
  onPeerClick,
}) => {
  const { t } = useTranslation("common");
  return (
  <>
    <header className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
      <h2 className="text-base font-bold text-slate-900">{t("components.chat.title")}</h2>
      <button
        onClick={onClose}
        className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
        aria-label={t("actions.close")}
      >
        <X size={18} />
      </button>
    </header>

    <div className="px-3 py-2 border-b border-slate-100">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("components.chat.search")}
          className="w-full bg-slate-50 border border-transparent focus:bg-white focus:border-slate-200 outline-none rounded-full pl-9 pr-3 py-1.5 text-sm transition-colors"
        />
      </div>
    </div>

    <div className="flex-1 overflow-y-auto">
      {conversations.length === 0 ? (
        <div className="text-center py-16 px-4 text-slate-400">
          <MessageCircle size={36} className="mx-auto mb-3 text-slate-200" />
          <p className="text-sm font-bold text-slate-600">{t("components.chat.noConversations")}</p>
          <p className="text-xs mt-1">
            {t("components.chat.startChat")}
          </p>
        </div>
      ) : (
        conversations.map((c) => {
          const peer = c.peer;
          const name = peer?.name || peer?.username || t("components.chat.viewProfile");
          const subtitle = c.lastMessageText || t("components.chat.startChat");
          return (
            <div
              key={c._id}
              className="px-3 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors border-b border-slate-50"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPeerClick(peer?._id);
                }}
                className="flex-shrink-0 rounded-full ring-offset-2 hover:ring-2 hover:ring-primary/30 transition"
                aria-label={`View ${name}'s profile`}
              >
                <Avatar
                  src={peer?.profileImage}
                  name={peer?.name}
                  username={peer?.username}
                  userId={peer?._id}
                  size={44}
                  className="rounded-full"
                />
              </button>
              <button
                onClick={() => onSelect(c._id)}
                className="flex-1 min-w-0 text-left"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      onPeerClick(peer?._id);
                    }}
                    className={`text-sm truncate hover:underline cursor-pointer ${
                      c.unreadCount > 0 ? "font-bold text-slate-900" : "font-semibold text-slate-700"
                    }`}
                  >
                    {name}
                  </span>
                  <span className="text-[10px] text-slate-400 flex-shrink-0">
                    {formatTime(c.lastMessageAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <span className={`text-xs truncate ${c.unreadCount > 0 ? "text-slate-900 font-semibold" : "text-slate-500"}`}>
                    {subtitle}
                  </span>
                  {c.unreadCount > 0 && (
                    <span className="bg-primary text-white text-[10px] font-bold rounded-full px-1.5 min-w-[18px] h-[18px] inline-flex items-center justify-center flex-shrink-0">
                      {c.unreadCount > 99 ? "99+" : c.unreadCount}
                    </span>
                  )}
                </div>
              </button>
            </div>
          );
        })
      )}
    </div>
  </>
  );
};

interface ConversationViewProps {
  peerName: string;
  peerUsername?: string;
  peerAvatar?: string;
  peerId?: string;
  messages: ChatMessage[];
  loading: boolean;
  meId: string | null;
  draft: string;
  setDraft: (v: string) => void;
  sending: boolean;
  uploading: boolean;
  onSend: (e?: React.FormEvent) => void;
  onPickImage: () => void;
  onBack: () => void;
  onClose: () => void;
  onPeerClick: (peerId?: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const ConversationView: React.FC<ConversationViewProps> = ({
  peerName,
  peerUsername,
  peerAvatar,
  peerId,
  messages,
  loading,
  meId,
  draft,
  setDraft,
  sending,
  uploading,
  onSend,
  onPickImage,
  onBack,
  onClose,
  onPeerClick,
  inputRef,
  messagesEndRef,
}) => {
  const { t } = useTranslation("common");
  // Always compare ids as strings — Mongoose returns ObjectId-shaped values
  // from populate() that look like strings after JSON but trip strict ===.
  const meIdStr = meId ? String(meId) : "";

  const senderIdOf = (m: ChatMessage): string => {
    const s = m.sender;
    if (!s) return "";
    if (typeof s === "string") return s;
    return String(s._id || "");
  };

  // Find the index of the LAST message I sent that the peer has read — used
  // to show a single "Seen" indicator at the bottom of my latest read run.
  const lastReadIndex = useMemo(() => {
    if (!meIdStr || !peerId) return -1;
    const peerIdStr = String(peerId);
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (senderIdOf(m) !== meIdStr) continue;
      if ((m.readBy || []).some((r) => String(r) === peerIdStr)) return i;
    }
    return -1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, meIdStr, peerId]);

  // Find the LAST message I sent overall — used to show "Sent" when peer hasn't read yet.
  const lastMineIndex = useMemo(() => {
    if (!meIdStr) return -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (senderIdOf(messages[i]) === meIdStr) return i;
    }
    return -1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, meIdStr]);

  return (
  <>
    <header className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-100">
      <button onClick={onBack} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500">
        <ArrowLeft size={18} />
      </button>
      <button
        onClick={() => onPeerClick(peerId)}
        className="flex items-center gap-2 flex-1 min-w-0 hover:bg-slate-50 -mx-1 px-1 py-0.5 rounded-md transition-colors text-left"
        aria-label={`View ${peerName}'s profile`}
      >
        <Avatar
          src={peerAvatar}
          name={peerName}
          username={peerUsername}
          userId={peerId}
          size={36}
          className="rounded-full flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate hover:underline">{peerName}</p>
          {peerUsername && (
            <p className="text-[11px] text-slate-500 truncate">@{peerUsername}</p>
          )}
        </div>
      </button>
      <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500">
        <X size={18} />
      </button>
    </header>

    <div className="flex-1 overflow-y-auto bg-slate-50/30 px-3 py-3 space-y-2">
      {loading ? (
        <div className="text-center py-12">
          <Loader2 size={20} className="animate-spin mx-auto text-slate-300" />
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xs text-slate-400">{t("components.chat.noMessages")}</p>
        </div>
      ) : (
        messages.map((m, i) => {
          const mine = !!meIdStr && senderIdOf(m) === meIdStr;
          const prev = messages[i - 1];
          const showDayBreak = !isSameDay(prev?.createdAt, m.createdAt);
          return (
            <React.Fragment key={m._id}>
              {showDayBreak && (
                <div className="flex justify-center my-2">
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {formatDayLabel(m.createdAt)}
                  </span>
                </div>
              )}
              <div className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                {m.kind === "product" && m.productContext ? (
                  <ProductCard product={m.productContext} mine={!!mine} extraText={m.body} />
                ) : (
                  <div
                    className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
                      mine
                        ? "bg-primary text-white rounded-br-md"
                        : "bg-white text-slate-900 rounded-bl-md border border-slate-100"
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
                <span className="text-[10px] text-slate-400 mt-0.5 px-1 tabular-nums inline-flex items-center gap-1">
                  {formatClock(m.createdAt)}
                  {mine && i === lastReadIndex && (
                    <span className="text-primary inline-flex items-center gap-0.5 font-bold">
                      <CheckCheck size={11} /> Seen
                    </span>
                  )}
                  {mine && i === lastMineIndex && i !== lastReadIndex && (
                    <span className="text-slate-400 inline-flex items-center" title="Sent">
                      <Check size={11} />
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
      className="border-t border-slate-100 px-3 py-2.5 flex items-center gap-2 bg-white"
    >
      <button
        type="button"
        onClick={onPickImage}
        disabled={uploading}
        className="p-2 rounded-full text-slate-500 hover:text-primary hover:bg-slate-100 transition-colors disabled:opacity-50"
        aria-label={t("actions.upload")}
        title={t("actions.upload")}
      >
        {uploading ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
      </button>
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={t("components.chat.typePlaceholder")}
        className="flex-1 bg-slate-50 rounded-full px-4 py-2 text-sm border border-transparent focus:bg-white focus:border-slate-200 outline-none transition-colors"
      />
      <button
        type="submit"
        disabled={!draft.trim() || sending}
        className="p-2 rounded-full bg-primary text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-hover transition-colors"
        aria-label={t("components.chat.send")}
      >
        {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
      </button>
    </form>
  </>
  );
};

interface ProductCardProps {
  product: ProductContext;
  mine: boolean;
  extraText?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, mine, extraText }) => (
  <div
    className={`max-w-[80%] rounded-2xl shadow-sm overflow-hidden ${
      mine ? "rounded-br-md" : "rounded-bl-md border border-slate-100"
    }`}
  >
    <Link
      href={`/product/${product.productId}`}
      className={`block ${mine ? "bg-primary text-white" : "bg-white text-slate-900"}`}
    >
      <div className="flex gap-2 p-2">
        {product.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-slate-50"
          />
        )}
        <div className="flex-1 min-w-0 py-0.5">
          <p
            className={`text-[10px] font-bold tracking-wide ${
              mine ? "text-white/80" : "text-slate-400"
            }`}
          >
            Asking about
          </p>
          <p className="text-sm font-bold leading-snug line-clamp-2">{product.name}</p>
          <p
            className={`text-xs font-black tabular-nums mt-0.5 ${
              mine ? "text-white" : "text-primary"
            }`}
          >
            ฿{Number(product.price || 0).toLocaleString()}
          </p>
        </div>
      </div>
    </Link>
    {extraText && (
      <p
        className={`px-3 py-2 text-sm border-t whitespace-pre-wrap break-words ${
          mine
            ? "bg-primary/90 text-white border-white/20"
            : "bg-white text-slate-900 border-slate-100"
        }`}
      >
        {extraText}
      </p>
    )}
  </div>
);

export default ChatPanel;
