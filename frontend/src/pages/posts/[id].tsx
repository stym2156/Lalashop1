import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Heart,
  MessageCircle,
  Share2,
  ChevronLeft,
  Trash2,
  Edit3,
  Send,
  X,
  Copy,
  Facebook,
  Instagram,
  Twitter,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiClient } from "@/services/apiClient";
import Header from "@/components/layout/Header";

export default function PostDetailPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const { id } = router.query;

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editedCaption, setEditedCaption] = useState("");
  const [updating, setUpdating] = useState(false);

  // Share Modal State
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPost();
      fetchComments();
    }
  }, [id]);

  const fetchPost = async () => {
    try {
      const res = await apiClient(`/posts/${id}`);
      if (res.success) {
        setPost(res.data);
        setEditedCaption(res.data.caption || "");
        const userInfoStr = localStorage.getItem("userInfo");
        if (userInfoStr) {
           const userInfo = JSON.parse(userInfoStr);
           setIsLiked(res.data.likes?.includes(userInfo._id));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await apiClient(`/posts/${id}/comments`);
      if (res.success) setComments(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLike = async () => {
    try {
      const res = await apiClient(`/posts/${id}/like`, { method: "POST" });
      if (res.success) {
        const userInfoStr = localStorage.getItem("userInfo");
        if (userInfoStr) {
           const userInfo = JSON.parse(userInfoStr);
           setIsLiked(!isLiked);
           setPost((prev: any) => ({
             ...prev,
             likes: !isLiked
               ? [...(prev.likes || []), userInfo._id]
               : prev.likes.filter((l: string) => l !== userInfo._id),
           }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;
    try {
      setPosting(true);
      const res = await apiClient(`/posts/${id}/comments`, {
        method: "POST",
        body: JSON.stringify({ text: newComment }),
      });
      if (res.success) {
        setComments((prev) => [res.data, ...prev]);
        setNewComment("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  };

  const handleUpdateCaption = async () => {
    try {
      setUpdating(true);
      const res = await apiClient(`/posts/${id}`, {
        method: "PUT",
        body: JSON.stringify({ caption: editedCaption }),
      });
      if (res.success) {
        setPost((prev: any) => ({ ...prev, caption: editedCaption }));
        setIsEditing(false);
      }
    } catch (err) {
      console.error(err);
      alert(t("pages.posts2.failedUpdatePost"));
    } finally {
      setUpdating(false);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm(t("pages.profile.deletePostConfirm"))) return;
    try {
      const res = await apiClient(`/posts/${id}`, { method: "DELETE" });
      if (res.success) {
        router.push("/me/me");
      }
    } catch (err) {
      console.error(err);
      alert(t("pages.posts2.failedDeletePost"));
    }
  };

  const copyToClipboard = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert(t("pages.posts2.linkCopiedShort"));
  };

  const timeAgo = (date: any) => {
    if (!date) return "";
    const seconds = Math.floor(
      (new Date().getTime() - new Date(date).getTime()) / 1000
    );
    if (seconds < 60) return t("pages.posts2.justNow");
    const m = Math.floor(seconds / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#00aeff] rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <p className="text-gray-500 mb-4">{t("pages.posts.deletedPost")}</p>
        <button onClick={() => router.back()} className="text-[#00aeff] font-bold">{t("actions.back")}</button>
      </div>
    );
  }

  const userInfoStr = typeof window !== "undefined" ? localStorage.getItem("userInfo") : null;
  const userInfo = userInfoStr ? JSON.parse(userInfoStr) : {};
  const isMyPost = post.user?._id === userInfo._id || post.user === userInfo._id;

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <Header />

      <div className="flex flex-1 overflow-hidden relative">
        {/* LEFT MEDIA */}
        <div className="flex-1 bg-black relative flex items-center justify-center h-full">
          {post.mediaType === "video" ? (
            <video
              src={post.mediaUrl}
              className="w-full h-full object-contain"
              autoPlay
              loop
              muted
              controls
            />
          ) : (
            <img
              src={post.mediaUrl}
              className="w-full h-full object-contain"
              alt=""
            />
          )}

          <button
            onClick={() => router.back()}
            className="absolute top-4 left-4 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-all z-10"
          >
            <ChevronLeft size={24} />
          </button>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-full md:w-[400px] border-l flex flex-col bg-white h-full shadow-2xl">
          {/* HEADER */}
          <div className="p-4 flex items-center justify-between border-b shrink-0">
            <div className="flex items-center gap-3">
              <img
                src={post.user?.profileImage || "/assets/placeholder-user.png"}
                className="w-10 h-10 rounded-full object-cover border"
                alt=""
              />
              <div>
                <p className="text-sm font-semibold truncate max-w-[150px]">
                  {post.user?.name || "User"}
                </p>
                <p className="text-xs text-gray-400">
                  @{post.user?.username || "username"}
                </p>
              </div>
            </div>

            {isMyPost && (
              <div className="flex gap-1">
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                  title={t("pages.posts2.editCaption")}
                >
                  <Edit3 size={18} />
                </button>
                <button 
                  onClick={handleDeletePost}
                  className="p-2 hover:bg-red-50 text-red-500 rounded-full transition-colors"
                  title={t("pages.posts2.deletePostTitle")}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            )}
          </div>

          {/* CAPTION / EDIT AREA */}
          <div className="p-4 border-b shrink-0 bg-slate-50/30">
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editedCaption}
                  onChange={(e) => setEditedCaption(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-[#00aeff] transition-all"
                  rows={3}
                  placeholder={t("pages.posts.captionPlaceholder")}
                />
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => { setIsEditing(false); setEditedCaption(post.caption); }}
                    className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg"
                  >
                    {t("pages.posts2.cancel")}
                  </button>
                  <button
                    onClick={handleUpdateCaption}
                    disabled={updating}
                    className="px-4 py-1.5 bg-[#00aeff] text-white text-xs font-bold rounded-lg shadow-sm"
                  >
                    {updating ? t("pages.posts2.saving") : t("pages.posts2.save")}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-800 leading-relaxed mb-1 whitespace-pre-wrap">{post.caption}</p>
                <span className="text-[10px] font-bold text-gray-400 tracking-wider">
                  {timeAgo(post.createdAt)}
                </span>
              </>
            )}
          </div>

          {/* ACTIONS */}
          <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
            <div className="flex gap-6">
              <button
                onClick={handleLike}
                className="flex items-center gap-1.5 group"
              >
                <Heart
                  size={22}
                  className={`transition-all ${isLiked ? "text-red-500 fill-red-500 scale-110" : "text-gray-600 group-hover:scale-110"}`}
                />
                <span className="text-xs font-bold text-gray-700">
                  {post.likes?.length || 0}
                </span>
              </button>

              <div className="flex items-center gap-1.5">
                <MessageCircle size={22} className="text-gray-600" />
                <span className="text-xs font-bold text-gray-700">{comments.length}</span>
              </div>
            </div>

            <button 
              onClick={() => setShowShareModal(true)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Share2 size={20} className="text-gray-600" />
            </button>
          </div>

          {/* COMMENTS */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {comments.length > 0 ? comments.map((c, i) => (
              <div key={i} className="flex gap-3">
                <img
                  src={c.user?.profileImage || "/assets/placeholder-user.png"}
                  className="w-8 h-8 rounded-full object-cover border flex-shrink-0"
                  alt=""
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-bold text-gray-900">
                      @{c.user?.username || "user"}
                    </span>
                    <span className="text-[9px] text-gray-400">{timeAgo(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-snug">{c.text}</p>
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-300 italic py-10">
                <p className="text-xs">{t("status.empty")}</p>
              </div>
            )}
          </div>

          {/* INPUT */}
          <div className="p-4 border-t shrink-0">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-full px-4 py-2.5 focus-within:bg-white focus-within:border-[#00aeff]/30 focus-within:shadow-sm transition-all">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t("pages.social.commentPlaceholder")}
                className="flex-1 bg-transparent outline-none text-sm text-gray-800"
              />
              <button
                onClick={handleComment}
                disabled={posting || !newComment.trim()}
                className="text-[#00aeff] disabled:text-gray-300 transition-colors"
              >
                {posting ? <div className="w-4 h-4 border-2 border-[#00aeff] border-t-transparent rounded-full animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SHARE MODAL POPUP */}
      {showShareModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowShareModal(false)} />
          <div className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden relative shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-slate-800  tracking-tight">{t("pages.social.shareTo")}</h3>
                <button onClick={() => setShowShareModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="grid grid-cols-4 gap-4 mb-8">
                <button className="flex flex-col items-center gap-2 group">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                    <Facebook size={22} fill="white" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 ">{t("pages.posts2.facebook")}</span>
                </button>
                <button className="flex flex-col items-center gap-2 group">
                  <div className="w-12 h-12 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-100 group-hover:scale-110 transition-transform">
                    <Instagram size={22} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 ">{t("pages.posts2.instagram")}</span>
                </button>
                <button className="flex flex-col items-center gap-2 group">
                  <div className="w-12 h-12 bg-sky-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-sky-100 group-hover:scale-110 transition-transform">
                    <Twitter size={22} fill="white" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 ">{t("pages.posts2.twitter")}</span>
                </button>
                <button className="flex flex-col items-center gap-2 group">
                  <div className="w-12 h-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-gray-200 group-hover:scale-110 transition-transform">
                    <Send size={22} className="-rotate-12" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 ">{t("pages.posts2.telegram")}</span>
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black text-gray-400  tracking-widest px-1">{t("pages.social.shareLink")}</p>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl p-2 pl-4">
                  <p className="text-xs text-gray-500 truncate flex-1 font-medium">{typeof window !== 'undefined' ? window.location.href : ''}</p>
                  <button 
                    onClick={copyToClipboard}
                    className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-sm text-slate-600 hover:text-[#00aeff] transition-colors active:scale-95"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 flex justify-center">
              <p className="text-[9px] font-bold text-slate-400  tracking-[0.2em]">lala Social Commerce</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
