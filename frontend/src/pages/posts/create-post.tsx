import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import {
  X, Plus, ChevronRight, Globe, Users, UserMinus, UserCheck,
  AtSign, Hash, Send, Loader2, CheckCircle2, Link as LinkIcon,
  MoreHorizontal, MessageCircle, AlertCircle, ShoppingBag, Trash2
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiClient } from "@/services/apiClient";
import { uploadImage } from "@/services/uploadImage";
import { motion, AnimatePresence } from "framer-motion";

type Visibility = "public" | "friends" | "friends_except" | "specific_friends";

export default function CreatePostPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // States
  const [media, setMedia] = useState<{ url: string; type: "image" | "video" } | null>(null);
  const [caption, setCaption] = useState("");
  const [postStage, setPostStage] = useState<"idle" | "uploading" | "saving" | "success">("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
  const [connections, setConnections] = useState<any[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [selectingTarget, setSelectingTarget] = useState<"include" | "exclude" | null>(null);

  useEffect(() => { fetchConnections(); }, []);

  const fetchConnections = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      if (!userInfo._id) return;
      const [followers, following] = await Promise.all([
        apiClient(`/users/followers/${userInfo._id}`).catch(() => ({ data: [] })),
        apiClient(`/users/following/${userInfo._id}`).catch(() => ({ data: [] }))
      ]);
      const all = [...(followers.data || []), ...(following.data || [])];
      setConnections(Array.from(new Map(all.filter(u => u && u._id).map(item => [item._id, item])).values()));
    } catch (err) { console.error("Fetch Error:", err); }
  };

  const uploadMedia = async (file: File) => {
    setPostStage("uploading");
    setUploadProgress(0);
    try {
      // Animate progress while the presign+PUT round-trip runs. We don't get
      // real byte-level progress from fetch, so we fake a smooth ramp.
      const progressTimer = setInterval(() => {
        setUploadProgress((p) => (p < 90 ? p + 5 : p));
      }, 200);
      const url = await uploadImage(file, "posts");
      clearInterval(progressTimer);
      setUploadProgress(100);
      setMedia({ url, type: file.type.startsWith("video") ? "video" : "image" });
      setPostStage("idle");
    } catch (err) {
      console.error("Upload failed:", err);
      setPostStage("idle");
      setUploadProgress(0);
    }
  };

  const insertSymbol = (sym: string) => {
    setCaption(prev => prev + sym);
    textareaRef.current?.focus();
  };

  const handlePost = async () => {
    if (!media) return;
    setPostStage("saving");
    try {
      const body: any = { mediaUrl: media.url, mediaType: media.type, caption, visibility };
      if (visibility === "specific_friends") body.visibleTo = selectedUserIds;
      if (visibility === "friends_except") body.hiddenFrom = selectedUserIds;
      const res = await apiClient("/posts", { method: "POST", body: JSON.stringify(body) });
      if (res.success) { setPostStage("success"); setTimeout(() => router.push("/me/me"), 1000); }
    } catch (err) { setPostStage("idle"); }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col overflow-hidden font-body text-dark">
      {/* Top Navigation */}
      <nav className="h-14 flex items-center justify-between px-4 border-b border-gray-border bg-white shadow-sm">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-light rounded-full transition-all">
          <X size={24} className="text-dark" />
        </button>
        <div className="w-10" />
      </nav>

      <main className="flex-1 overflow-y-auto bg-white p-4 space-y-4 pb-32">
        {/* Content Section */}
        <div className="flex gap-3 min-h-[160px]">
          {/* Media Box */}
          <div
            onClick={() => !media && document.getElementById("file-input")?.click()}
            className="w-24 h-32 flex-shrink-0 bg-gray-light rounded-xl border-2 border-dashed border-gray-border overflow-hidden relative flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-all"
          >
            {media ? (
              <>
                {media.type === "video" ? <video src={media.url} className="w-full h-full object-cover" /> : <img src={media.url} className="w-full h-full object-cover" alt="" />}
                <button onClick={(e) => { e.stopPropagation(); setMedia(null); }} className="absolute top-1 right-1 bg-dark/70 text-white p-1 rounded-md">
                  <X size={14} />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center text-slate-400">
                <Plus size={20} />
              </div>
            )}
            {postStage === "uploading" && (
              <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm flex items-center justify-center flex-col">
                <Loader2 className="animate-spin text-primary" size={20} />
                <span className="text-[10px] font-bold text-primary">{uploadProgress}%</span>
              </div>
            )}
            <input type="file" id="file-input" hidden onChange={(e) => e.target.files?.[0] && uploadMedia(e.target.files[0])} accept="image/*,video/*" />
          </div>

          {/* Text Area */}
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              className="w-full h-full p-2 text-sm font-medium outline-none border-none placeholder:text-slate-300 resize-none"
              placeholder={t("pages.posts.captionPlaceholder")}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>
        </div>

        {/* Quick Tags Bar (TikTok Style) */}
        <div className="flex gap-4 py-2">
          <button
            onClick={() => insertSymbol("#")}
            className="text-xs font-semibold text-gray-500 flex items-center gap-1 active:text-primary transition-colors"
          ><Hash size={14} /> </button>
          <button
          onClick={() => insertSymbol("@")}
            className="text-xs font-semibold text-gray-500 flex items-center gap-1 active:text-primary transition-colors"
          ><AtSign size={14} /></button>
        </div>

        {/* Action List */}
        <div className="space-y-0.5">
          <button onClick={() => setShowVisibilityMenu(true)} className="w-full flex items-center justify-between py-4 border-b border-gray-border group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-soft text-primary rounded-xl flex items-center justify-center">
                <Users size={20} />
              </div>
              <div className="text-left">
                <p className="text-xs font-black  tracking-tighter">{t("pages.posts.addLocation")}</p>
                <p className="text-[10px] font-bold text-slate-400">
                  {visibility === "specific_friends"
                    ? `${selectedUserIds.length}`
                    : visibility.replace('_', ' ')}
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-300" />

          </button>

          <button className="w-full flex items-center justify-between py-4 border-b border-gray-border group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-light text-slate-400 rounded-xl flex items-center justify-center">
                <LinkIcon size={20} />
              </div>
              <p className="text-xs font-black tracking-tighter">{t("pages.posts.addProductTag")}</p>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </button>

          <button className="w-full flex items-center justify-between py-4 border-b border-gray-border group opacity-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-light text-slate-400 rounded-xl flex items-center justify-center">
                <MoreHorizontal size={20} />
              </div>
              <p className="text-xs font-black  tracking-tighter">{t("actions.more")}</p>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </button>
        </div>
      </main>

      {/* Bottom Sticky Button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-border flex gap-3 pb-8">
        <button
          onClick={handlePost}
          disabled={!media || postStage !== "idle"}
          className="flex-1 h-14 bg-primary text-white rounded-xl font-black text-xs  tracking-[0.2em] shadow-lg shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 transition-all"
        >
          {postStage === "saving" ? <Loader2 className="animate-spin" /> : (
            <>{t("actions.post")} </>
          )}
        </button>
      </div>

      {/* Visibility Menu (Bottom Sheet Style) */}
      <AnimatePresence>
        {showVisibilityMenu && (
          <div className="fixed inset-0 z-[200] flex items-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowVisibilityMenu(false)} className="absolute inset-0 bg-dark/40 backdrop-blur-sm" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative bg-white w-full rounded-t-[2.5rem] p-6 pb-12">
              <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6" />
              <h3 className="text-center font-display font-black  mb-6 tracking-widest">{t("pages.settings.security")}</h3>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: "public", label: "Everyone", icon: Globe, desc: "Public visibility" },
                  { id: "friends", label: "Friends", icon: Users, desc: "Followers you follow back" },
                  { id: "specific_friends", label: "Selected", icon: UserCheck, desc: "Choose specific people" }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => { 
                      setVisibility(item.id as any); 
                      if (item.id === "specific_friends" || item.id === "friends_except") {
                        setShowUserSelector(true);
                      } else {
                        setShowVisibilityMenu(false);
                      }
                    }}
                    className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${visibility === item.id ? "bg-primary-soft border border-primary/20" : "bg-gray-light"}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${visibility === item.id ? "bg-primary text-white" : "bg-white text-slate-400 shadow-sm"}`}>
                      <item.icon size={18} />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-black ">{item.label}</p>
                      <p className="text-[10px] font-bold text-slate-400">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* User Selector for Visibility */}
      <AnimatePresence>
        {showUserSelector && (
          <div className="fixed inset-0 z-[250] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
            <nav className="h-14 flex items-center justify-between px-4 border-b">
              <button onClick={() => setShowUserSelector(false)} className="p-2 font-bold text-xs">{t("actions.back")}</button>
              <h3 className="font-black text-sm tracking-widest">{t("pages.profile.followers")}</h3>
              <button onClick={() => { setShowUserSelector(false); setShowVisibilityMenu(false); }} className="p-2 font-bold text-xs text-primary">{t("actions.done")}</button>
            </nav>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {connections.length > 0 ? connections.map(friend => (
                <div 
                  key={friend._id} 
                  onClick={() => toggleUserSelection(friend._id)}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedUserIds.includes(friend._id) ? "border-primary bg-primary-soft" : "border-gray-50 bg-gray-50/50"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                      <img src={friend.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`} alt="" />
                    </div>
                    <div>
                      <p className="text-xs font-black">{friend.name}</p>
                      <p className="text-[10px] font-bold text-slate-400">@{friend.username}</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedUserIds.includes(friend._id) ? "bg-primary border-primary" : "border-slate-200"}`}>
                    {selectedUserIds.includes(friend._id) && <CheckCircle2 size={12} className="text-white" />}
                  </div>
                </div>
              )) : (
                <div className="py-20 text-center text-slate-400 text-xs font-bold tracking-widest">{t("components.userList.noUsers")}</div>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}