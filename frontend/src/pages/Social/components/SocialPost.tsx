import React, { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, User, Flag } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import Avatar from "@/components/ui/Avatar";
import ReportModal from "@/components/ReportModal";
import { apiClient } from "@/services/apiClient";
import { formatTimeAgo } from "../utils/time";

export interface BackendPost {
  _id: string;
  user: {
    _id: string;
    name?: string;
    username?: string;
    profileImage?: string;
  };
  mediaUrl: string;
  mediaType: "image" | "video";
  caption?: string;
  likes: string[];
  comments: { _id?: string; user: any; text: string; createdAt: string }[];
  createdAt: string;
}

interface SocialPostProps {
  post: BackendPost;
  currentUserId?: string;
}

export default function SocialPost({ post, currentUserId }: SocialPostProps) {
  const { t } = useTranslation("common");
  const [likes, setLikes] = useState<string[]>(post.likes || []);
  const [isSaved, setIsSaved] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState(post.comments || []);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportCommentId, setReportCommentId] = useState<string | null>(null);
  const [showCommentList, setShowCommentList] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const isLiked = currentUserId ? likes.includes(currentUserId) : false;
  const username = post.user?.username || post.user?.name || "user";
  const profileHref = `/u/${post.user?._id || ""}`;
  const isOwnPost = Boolean(currentUserId && post.user?._id === currentUserId);

  const toggleLike = async () => {
    if (!currentUserId) return;
    const wasLiked = isLiked;
    setLikes((prev) =>
      wasLiked ? prev.filter((id) => id !== currentUserId) : [...prev, currentUserId]
    );
    try {
      await apiClient(`/posts/${post._id}/like`, { method: "POST" });
    } catch {
      setLikes((prev) =>
        wasLiked ? [...prev, currentUserId] : prev.filter((id) => id !== currentUserId)
      );
    }
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await apiClient(`/posts/${post._id}/comments`, {
        method: "POST",
        body: JSON.stringify({ text: commentText.trim() }),
      });
      if (res?.data) {
        setComments((prev) => [...prev, res.data]);
        setCommentText("");
      }
    } catch (err) {
      console.error("Comment failed", err);
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <>
      <article className="bg-white border border-gray-border rounded-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between px-3 py-3">
          <Link href={profileHref} className="flex items-center gap-3">
            <Avatar
              src={post.user?.profileImage}
              name={post.user?.name}
              username={post.user?.username}
              userId={post.user?._id}
              size={32}
              className="rounded-full border border-gray-border"
              alt={username}
            />
            <div>
              <h3 className="text-sm font-bold leading-none hover:text-dark/80 transition-colors text-dark">
                {username}
              </h3>
              <p className="text-[10px] text-gray-500 mt-1">{formatTimeAgo(post.createdAt, t)}</p>
            </div>
          </Link>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((s) => !s)}
              className="p-1.5 hover:bg-gray-light rounded-full transition-colors"
              aria-label={t("actions.more")}
            >
              <MoreHorizontal size={18} className="text-dark" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-border rounded-lg shadow-xl py-1 min-w-[160px] z-20">
                {!isOwnPost ? (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setReportOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[12px] font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Flag size={14} /> {t("pages.social.reportPost")}
                  </button>
                ) : (
                  <span className="block px-3 py-2 text-[11px] text-gray-400">
                    {t("status.empty")}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {post.caption && (
          <div className="px-3 pb-2">
            <p className="text-sm text-dark whitespace-pre-wrap leading-relaxed">
              <Link href={profileHref} className="font-bold mr-2 hover:text-dark/80 transition-colors">
                {username}
              </Link>
              {post.caption}
            </p>
          </div>
        )}

        <div className="aspect-square bg-gray-light relative group">
          {post.mediaType === "video" ? (
            <video
              src={post.mediaUrl}
              controls
              playsInline
              preload="metadata"
              className="w-full h-full object-cover bg-black"
            />
          ) : (
            <img
              src={post.mediaUrl}
              alt={post.caption || "post"}
              className="w-full h-full object-cover cursor-pointer"
              onDoubleClick={toggleLike}
            />
          )}
        </div>

        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <button onClick={toggleLike} className="active:scale-125 transition-transform">
                <Heart
                  size={24}
                  className={`transition-colors ${
                    isLiked ? "text-red-500 fill-red-500" : "text-dark hover:text-gray-500"
                  }`}
                />
              </button>
              <button onClick={() => setShowCommentInput(!showCommentInput)}>
                <MessageCircle size={24} className="text-dark cursor-pointer hover:text-gray-500" />
              </button>
              <Send size={24} className="text-dark cursor-pointer hover:text-gray-500 -rotate-12" />
            </div>
            <button onClick={() => setIsSaved((s) => !s)}>
              <Bookmark
                size={24}
                className={`transition-colors ${
                  isSaved ? "text-dark fill-dark" : "text-dark hover:text-gray-500"
                }`}
              />
            </button>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-bold text-dark">{likes.length.toLocaleString()} {likes.length === 1 ? t("pages.social.likeOne") : t("pages.social.likeMany")}</p>
            {comments.length > 0 && (
              <button
                className="text-sm text-gray-500"
                onClick={() => setShowCommentList((v) => !v)}
              >
                {showCommentList ? t("common.showLess") : t("pages.social.viewAllComments", { count: comments.length })}
              </button>
            )}
          </div>
        </div>

        {showCommentList && comments.length > 0 && (
          <div className="border-t border-gray-border px-3 py-2 space-y-2 max-h-[260px] overflow-y-auto">
            {comments.map((c, idx) => {
              const cid = c._id || `c-${idx}`;
              const cUser = (c.user || {}) as { _id?: string; username?: string; name?: string };
              const cAuthor = cUser.username || cUser.name || "user";
              const isOwnComment = currentUserId && cUser._id === currentUserId;
              return (
                <div key={cid} className="flex items-start justify-between gap-2 group">
                  <div className="text-[13px] text-dark flex-1 leading-snug">
                    <span className="font-bold mr-1.5">{cAuthor}</span>
                    {c.text}
                  </div>
                  {!isOwnComment && c._id && (
                    <button
                      onClick={() => {
                        setReportCommentId(c._id as string);
                        setReportOpen(true);
                      }}
                      title={t("actions.report")}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                      <Flag size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {showCommentInput && (
          <div className="border-t border-gray-border px-3 py-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-6 h-6 rounded-full bg-gray-light overflow-hidden flex items-center justify-center">
                <User size={14} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitComment();
                }}
                placeholder={t("pages.social.commentPlaceholder")}
                className="text-sm outline-none flex-1 text-dark bg-transparent"
              />
            </div>
            <button
              onClick={submitComment}
              disabled={!commentText.trim() || submittingComment}
              className="text-primary font-semibold text-sm hover:text-primary-hover disabled:opacity-40"
            >
              {t("actions.post")}
            </button>
          </div>
        )}
      </article>

      <ReportModal
        isOpen={reportOpen}
        onClose={() => {
          setReportOpen(false);
          setReportCommentId(null);
        }}
        targetType={reportCommentId ? "comment" : "post"}
        targetId={reportCommentId || post._id}
        targetLabel={reportCommentId ? `comment on @${username}` : username}
      />
    </>
  );
}
