import React, { useState, useRef, useEffect } from "react";
import {
  ImageIcon, X, Upload, Loader2, CheckCircle2, Globe, Users,
  UserMinus, UserCheck, ChevronRight, MessageSquare, Video,
  Send
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { compressImage, formatSize } from "../utils/media";
import { apiClient } from "@/services/apiClient";
import { useCurrentUser } from "@/services/useCurrentUser";
import { uploadImage } from "@/services/uploadImage";

type Visibility = "public" | "friends" | "friends_except" | "specific_friends";

interface MediaUploadProps {
  onUpload: (post: any) => void;
  onCancel: () => void;
}

export default function MediaUpload({ onUpload, onCancel }: MediaUploadProps) {
  const { t } = useTranslation("common");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<"image" | "video">("image");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  
  // Visibility States
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
  const [connections, setConnections] = useState<any[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectingTarget, setSelectingTarget] = useState<"include" | "exclude" | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user: me } = useCurrentUser();

  useEffect(() => {
    if (!me?._id) return;
    let cancelled = false;
    (async () => {
      try {
        const [followersData, followingData] = await Promise.all([
          apiClient(`/users/followers/${me._id}`),
          apiClient(`/users/following/${me._id}`),
        ]);
        if (cancelled) return;
        const all = [
          ...(followersData?.data || []),
          ...(followingData?.data || []),
        ];
        const unique = Array.from(new Map(all.map((item: any) => [item._id, item])).values());
        setConnections(unique);
      } catch (err) {
        console.error("Fetch connections error:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [me?._id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const type = selectedFile.type.startsWith("video") ? "video" : "image";
      setFileType(type);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  // R2 upload via backend presign — supports both image and video.
  const handleUploadMedia = (file: File): Promise<string> => uploadImage(file, "posts");

  const handleShare = async () => {
    if (!file) return;
    setUploading(true);
    try {
      // 1. Upload to R2
      let mediaUrl = "";
      if (fileType === "image") {
        const compressedBlob = await compressImage(file);
        const compressedFile = new File([compressedBlob], file.name, { type: file.type });
        mediaUrl = await handleUploadMedia(compressedFile);
      } else {
        mediaUrl = await handleUploadMedia(file);
      }

      if (!mediaUrl) throw new Error("Upload failed");

      // 2. Save to Backend
      const body: any = {
        mediaUrl,
        mediaType: fileType,
        caption,
        visibility
      };

      if (visibility === "specific_friends") body.visibleTo = selectedUserIds;
      if (visibility === "friends_except") body.hiddenFrom = selectedUserIds;

      const response = await apiClient("/posts", {
        method: "POST",
        body: JSON.stringify(body)
      });

      if (response.success) {
        onUpload(response.data);
      }
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to share post. Please check your connection.");
    } finally {
      setUploading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const getVisibilityLabel = () => {
    switch(visibility) {
      case "public": return "Public";
      case "friends": return "Followers/Following";
      case "friends_except": return "Friends Except...";
      case "specific_friends": return "Specific Friends";
      default: return "Public";
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-dark/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-gray-border flex items-center justify-between">
          <h2 className="font-black text-lg text-dark tracking-widest">{t("pages.posts.createTitle")}</h2>
          <button onClick={onCancel} className="p-2 hover:bg-gray-light rounded-full transition-colors text-dark">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!preview ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-video border-2 border-dashed border-gray-border rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-[#00aeff] hover:bg-[#00aeff]/5 transition-all group"
            >
              <div className="p-5 bg-gray-light rounded-2xl group-hover:bg-[#00aeff]/10 transition-colors">
                <Upload size={32} className="text-gray-400 group-hover:text-[#00aeff]" />
              </div>
              <div className="text-center">
                <p className="font-black text-dark tracking-widest text-sm">{t("pages.posts.selectFromGallery")}</p>
                <p className="text-[10px] text-gray-400 mt-1 font-bold tracking-tighter">{t("pages.posts.uploadMedia")}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-white ring-1 ring-slate-100">
                {fileType === "video" ? (
                  <video src={preview} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                )}
                <button 
                  onClick={() => { setFile(null); setPreview(null); }}
                  className="absolute top-4 right-4 p-2 bg-dark/50 text-white rounded-full hover:bg-red-500 transition-all backdrop-blur-md"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Caption */}
              <div className="space-y-2">
                 <div className="flex items-center gap-2 text-slate-400 px-1">
                    <MessageSquare size={14} />
                    <span className="text-[10px] font-black tracking-widest">{t("actions.comment")}</span>
                 </div>
                 <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder={t("pages.posts.captionPlaceholder")}
                    className="w-full bg-slate-50 rounded-2xl p-4 text-sm font-medium outline-none border-2 border-transparent focus:border-[#00aeff] transition-all min-h-[100px] resize-none"
                 />
              </div>

              {/* Visibility Selector */}
              <div className="space-y-2">
                 <div className="flex items-center gap-2 text-slate-400 px-1">
                    <Globe size={14} />
                    <span className="text-[10px] font-black tracking-widest">Audience</span>
                 </div>
                 <button 
                    onClick={() => setShowVisibilityMenu(true)}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all"
                 >
                    <span className="text-sm font-bold text-slate-700">{getVisibilityLabel()}</span>
                    <ChevronRight size={18} className="text-slate-300" />
                 </button>
              </div>
            </div>
          )}

          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileChange} 
            accept="image/*,video/*"
          />
        </div>

        <div className="p-6 bg-slate-50/50 border-t border-slate-100">
          <button
            disabled={!file || uploading}
            onClick={handleShare}
            className="w-full bg-[#00aeff] hover:bg-[#0096db] disabled:bg-slate-200 text-white font-black tracking-[0.2em] py-4 rounded-2xl shadow-xl shadow-[#00aeff]/20 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            {uploading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {t("pages.checkout.processing")}
              </>
            ) : (
              <>
                <Send size={18} className="-rotate-12" />
                {t("pages.social.shareTo")}
              </>
            )}
          </button>
        </div>

        {/* Visibility Menu Modal */}
        {showVisibilityMenu && (
           <div className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10">
                 <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                    <h2 className="text-[11px] font-black tracking-widest">Audience</h2>
                    <button onClick={() => setShowVisibilityMenu(false)}><X size={18} /></button>
                 </div>
                 <div className="p-2">
                    {[
                       { id: "public", label: "Public", icon: Globe },
                       { id: "friends", label: "Followers/Following", icon: Users },
                       { id: "friends_except", label: "Friends Except...", icon: UserMinus },
                       { id: "specific_friends", label: "Specific Friends", icon: UserCheck },
                    ].map((item) => (
                       <button 
                          key={item.id}
                          onClick={() => {
                             setVisibility(item.id as Visibility);
                             if (item.id === "friends_except" || item.id === "specific_friends") {
                                setSelectingTarget(item.id === "friends_except" ? "exclude" : "include");
                             } else {
                                setShowVisibilityMenu(false);
                             }
                          }}
                          className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${visibility === item.id ? "bg-[#00aeff]/5 text-[#00aeff]" : "hover:bg-slate-50 text-slate-600"}`}
                       >
                          <item.icon size={18} />
                          <span className="text-sm font-bold">{item.label}</span>
                          {visibility === item.id && <CheckCircle2 size={16} className="ml-auto" />}
                       </button>
                    ))}
                 </div>
              </div>
           </div>
        )}

        {/* User Selection Modal */}
        {selectingTarget && (
           <div className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-md h-[70vh] rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl">
                 <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                    <h2 className="text-[11px] font-black tracking-widest">
                       {selectingTarget === "include" ? "Select Friends" : "Exclude Friends"}
                    </h2>
                    <button 
                       onClick={() => {
                          setSelectingTarget(null);
                          setShowVisibilityMenu(false);
                       }} 
                       className="px-6 py-2 bg-[#00aeff] text-white text-[10px] font-black tracking-widest rounded-full"
                    >
                       Done
                    </button>
                 </div>
                 <div className="flex-1 overflow-y-auto p-2">
                    {connections.map(user => (
                       <button 
                          key={user._id}
                          onClick={() => toggleUserSelection(user._id)}
                          className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all ${selectedUserIds.includes(user._id) ? "bg-[#00aeff]/5" : "hover:bg-slate-50"}`}
                       >
                          <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden">
                             <img src={user.profileImage || "/assets/placeholder-user.png"} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="text-left flex-1">
                             <p className="text-xs font-bold text-slate-800">{user.name}</p>
                             <p className="text-[10px] text-[#00aeff] font-bold">@{user.username}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedUserIds.includes(user._id) ? "bg-[#00aeff] border-[#00aeff]" : "border-slate-200"}`}>
                             {selectedUserIds.includes(user._id) && <X size={10} className="text-white" />}
                          </div>
                       </button>
                    ))}
                 </div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
}
