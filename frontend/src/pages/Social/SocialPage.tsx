import React, { useEffect, useMemo, useState } from "react";
import {
  Heart,
  Send,
  Search,
  PlusSquare,
  Image as ImageIcon,
  Video,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import SocialPost, { BackendPost } from "./components/SocialPost";
import MediaUpload from "./components/MediaUpload";
import Avatar from "@/components/ui/Avatar";
import { apiClient } from "@/services/apiClient";
import { useChat } from "@/components/chat/ChatContext";

interface MiniUser {
  _id: string;
  name?: string;
  username?: string;
  profileImage?: string;
  bio?: string;
}

export default function SocialPage() {
  const { t } = useTranslation("common");
  const { open: openChat, unreadMessages } = useChat();
  const [posts, setPosts] = useState<BackendPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MiniUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [me, setMe] = useState<MiniUser | null>(null);

  // Build the href for a clicked user — own profile → /me/me (the editable
  // first-person view), anyone else → /u/{id}. Used by every Avatar/name link
  // on this page so the redirect is consistent everywhere.
  const profileHref = (uid: string): string =>
    me?._id && uid === me._id ? "/me/me" : `/u/${uid}`;

  // Resolve current user identity from /auth/me using the JWT in localStorage.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("token");
    if (!token || token === "null" || token === "undefined") return;
    let cancelled = false;
    apiClient("/auth/me")
      .then((res) => {
        if (cancelled) return;
        if (res?._id) {
          setMe({
            _id: res._id,
            name: res.name,
            username: res.username,
            profileImage: res.profileImage,
          });
        }
      })
      .catch(() => {
        /* unauthenticated viewer — feed still loads */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchFeed = async () => {
    setLoadingPosts(true);
    try {
      const res = await apiClient("/posts");
      setPosts(res?.data || []);
    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  // Build a story rail of distinct authors from the loaded feed.
  const storyAuthors: MiniUser[] = useMemo(() => {
    const map = new Map<string, MiniUser>();
    for (const p of posts) {
      if (p.user && !map.has(p.user._id)) map.set(p.user._id, p.user);
    }
    return Array.from(map.values()).slice(0, 12);
  }, [posts]);

  // Debounced server-side user search.
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setShowResults(false);
      setSearching(false);
      return;
    }
    setSearching(true);
    const handle = setTimeout(async () => {
      try {
        const res = await apiClient(`/users/search?q=${encodeURIComponent(q)}&limit=20`);
        const list = (res?.data ?? []) as MiniUser[];
        setSearchResults(list);
        setShowResults(true);
      } catch (err) {
        console.error("Search failed", err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  const handleUpload = (newPostData: any) => {
    setShowUpload(false);
    if (newPostData?._id) {
      const normalized: BackendPost = {
        _id: newPostData._id,
        user:
          newPostData.user ||
          (me
            ? { _id: me._id, name: me.name, username: me.username, profileImage: me.profileImage }
            : { _id: "me", name: "Me", username: "me" }),
        mediaUrl: newPostData.mediaUrl,
        mediaType: newPostData.mediaType,
        caption: newPostData.caption,
        likes: newPostData.likes || [],
        comments: newPostData.comments || [],
        createdAt: newPostData.createdAt || new Date().toISOString(),
      };
      setPosts((prev) => [normalized, ...prev]);
    } else {
      fetchFeed();
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24 md:pb-8 font-sans">
      <nav className="sticky top-0 z-[60] bg-white/90 backdrop-blur-lg border-b border-slate-100 px-4 py-3 flex items-center justify-between max-w-5xl mx-auto w-full md:px-8 shadow-sm">
        <div className="flex-1 max-w-[240px] md:max-w-[320px] relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder={t("pages.social.exploreUsers")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length > 0 && setShowResults(true)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-10 pr-4 text-sm outline-none text-dark focus:bg-white focus:ring-2 focus:ring-primary/10 focus:border-primary/30 transition-all"
            />
            {searching && (
              <Loader2
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400"
              />
            )}
          </div>

          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-border rounded-xl shadow-xl max-h-[400px] overflow-y-auto z-[70] animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-2 border-b border-gray-border flex justify-between items-center bg-gray-light/50">
                <span className="text-[10px] font-bold text-gray-400 tracking-widest pl-2">
                  {t("actions.search")}
                </span>
                <button
                  onClick={() => setShowResults(false)}
                  className="text-[10px] text-primary font-bold pr-2 hover:underline"
                >
                  {t("actions.close")}
                </button>
              </div>
              {searchResults.length === 0 ? (
                <div className="px-4 py-8 text-center text-[12px] text-gray-400">
                  {searching ? t("pages.search.searching") : t("components.userList.noUsers")}
                </div>
              ) : (
                searchResults.map((u) => (
                  <Link
                    key={u._id}
                    href={profileHref(u._id)}
                    onClick={() => setShowResults(false)}
                    className="flex items-center gap-3 p-3 hover:bg-gray-light transition-colors group"
                  >
                    <Avatar
                      src={u.profileImage}
                      name={u.name}
                      username={u.username}
                      userId={u._id}
                      size={40}
                      className="rounded-full border border-gray-border flex-shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-dark truncate group-hover:text-primary transition-colors">
                        {u.username || u.name || "user"}
                      </span>
                      <span className="text-xs text-gray-500 truncate">{u.name || ""}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 md:gap-6 ml-4">
          <PlusSquare
            size={24}
            className="cursor-pointer hover:text-primary transition-colors text-dark"
            onClick={() => setShowUpload(true)}
          />
          <Heart
            size={24}
            className="cursor-pointer hover:text-red-500 transition-colors text-dark hidden sm:block"
          />
          <button
            onClick={openChat}
            className="relative cursor-pointer text-dark hover:text-primary transition-colors"
            aria-label={t("nav.messages")}
          >
            <Send size={24} className="-rotate-12" />
            {unreadMessages > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold inline-flex items-center justify-center ring-2 ring-white">
                {unreadMessages > 99 ? "99+" : unreadMessages}
              </span>
            )}
          </button>
        </div>
      </nav>

      {showResults && (
        <div
          className="fixed inset-0 z-[55] bg-transparent"
          onClick={() => setShowResults(false)}
        />
      )}

      <main className="max-w-5xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-8">
        <div className="flex-1 max-w-xl mx-auto lg:mx-0 w-full">
          <div className="bg-white border border-slate-100 rounded-2xl p-4 mb-6 shadow-sm hidden md:block">
            <div className="flex items-center gap-4 mb-4">
              <Avatar
                src={me?.profileImage}
                name={me?.name}
                username={me?.username}
                userId={me?._id}
                size={40}
                className="rounded-full bg-slate-100 flex-shrink-0"
              />
              <button
                onClick={() => setShowUpload(true)}
                className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-400 text-left px-5 py-2.5 rounded-full text-sm transition-colors"
              >
                {me ? t("pages.socialPage2.whatsOnMind", { name: me.username || me.name || "" }) : t("pages.socialPage2.whatsOnMindGeneric")}
              </button>
            </div>
            <div className="flex items-center justify-around pt-3 border-t border-slate-50">
              <button
                onClick={() => setShowUpload(true)}
                className="flex items-center gap-2 text-slate-600 text-sm font-bold hover:bg-slate-50 px-4 py-2 rounded-lg transition-colors"
              >
                <ImageIcon size={18} className="text-emerald-500" /> {t("pages.socialPage2.photo")}
              </button>
              <button
                onClick={() => setShowUpload(true)}
                className="flex items-center gap-2 text-slate-600 text-sm font-bold hover:bg-slate-50 px-4 py-2 rounded-lg transition-colors"
              >
                <Video size={18} className="text-rose-500" /> {t("pages.socialPage2.video")}
              </button>
            </div>
          </div>

          {storyAuthors.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-2xl mb-6 p-4 flex gap-4 overflow-x-auto no-scrollbar shadow-sm">
              {storyAuthors.map((u) => (
                <Link
                  key={u._id}
                  href={profileHref(u._id)}
                  className="flex flex-col items-center gap-2 min-w-[72px] group"
                >
                  <div className="w-16 h-16 rounded-full p-[2px] ring-2 ring-primary ring-offset-2 group-hover:ring-accent transition-all duration-300">
                    <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-white">
                      <Avatar
                        src={u.profileImage}
                        name={u.name}
                        username={u.username}
                        userId={u._id}
                        size={56}
                        className="rounded-full"
                      />
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-gray-500 truncate w-16 text-center">
                    {(u.username || u.name || "user").split(" ")[0]}
                  </span>
                </Link>
              ))}
            </div>
          )}

          <div className="space-y-8">
            {loadingPosts ? (
              <div className="flex justify-center py-20">
                <Loader2 size={32} className="animate-spin text-slate-300" />
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-2xl py-20 text-center text-sm text-slate-400">
                {t("pages.socialPage2.noPostsYet")}
              </div>
            ) : (
              posts.map((post) => (
                <SocialPost key={post._id} post={post} currentUserId={me?._id} />
              ))
            )}
          </div>
        </div>

        <aside className="hidden lg:block w-80 space-y-6 sticky top-24 self-start">
          <div className="bg-white border border-gray-border rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-gray-500">{t("pages.socialPage2.suggestedForYou")}</span>
              <button className="text-xs font-bold text-dark hover:underline">{t("pages.socialPage2.seeAll")}</button>
            </div>

            <div className="space-y-4">
              {storyAuthors.length === 0 ? (
                <p className="text-xs text-gray-400">{t("pages.socialPage2.noSuggestions")}</p>
              ) : (
                storyAuthors.slice(0, 5).map((u) => (
                  <div key={u._id} className="flex items-center justify-between group">
                    <Link href={profileHref(u._id)} className="flex items-center gap-3 min-w-0">
                      <Avatar
                        src={u.profileImage}
                        name={u.name}
                        username={u.username}
                        userId={u._id}
                        size={40}
                        className="rounded-full border border-gray-border flex-shrink-0"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-dark truncate group-hover:text-primary transition-colors">
                          {u.username || u.name || "user"}
                        </span>
                        <span className="text-[10px] text-gray-500">{t("pages.socialPage2.suggestedForYou")}</span>
                      </div>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </main>

      {showUpload && <MediaUpload onUpload={handleUpload} onCancel={() => setShowUpload(false)} />}
    </div>
  );
}
