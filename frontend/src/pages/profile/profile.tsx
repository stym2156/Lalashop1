import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import Head from "next/head";
import {
  User,
  ChevronRight,
  Grid,
  Play,
  UserSquare,
  Plus,
  Heart,
  MessageCircle,
  CornerUpRight,
  PencilLine,
  MoreVertical,
  MapPin,
  Camera,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import UserListModal from "@/pages/Social/components/UserListModal";
import SocialPost from "@/pages/Social/components/SocialPost";
import MainSidebar from "@/components/layout/MainSidebar";
import { apiClient } from "@/services/apiClient";

export default function ProfilePage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("posts");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [displayProducts, setDisplayProducts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [location, setLocation] = useState("Vientiane, Laos");
  const [userListModal, setUserListModal] = useState<{
    isOpen: boolean;
    type: "followers" | "following";
    title: string;
  }>({
    isOpen: false,
    type: "followers",
    title: "Followers"
  });

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      const data = await apiClient("/users/profile");
      if (data.data) {
        setUser(data.data);
      }
    } catch (error) {
      console.error("Fetch profile error:", error);
    }
  };
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImgSrc(reader.result as string);
    reader.readAsDataURL(file);
  };
  useEffect(() => {
    fetchProfile();

    const handleFollowChange = () => {
      fetchProfile();
    };

    window.addEventListener('followStatusChanged', handleFollowChange);
    return () => window.removeEventListener('followStatusChanged', handleFollowChange);
  }, []);

  const handleProfileUpdate = (updatedUser: any) => {
    fetchProfile();
  };

  const openUserList = (type: "followers" | "following") => {
    setUserListModal({
      isOpen: true,
      type,
      title: type.charAt(0).toUpperCase() + type.slice(1)
    });
  };

  const handlePostClick = (product: any) => {
    setSelectedPost(product);
  };

  function setPreviewOpen(arg0: boolean): void {
    throw new Error("Function not implemented.");
  }

  return (
    <div className="min-h-screen bg-white font-sans md:pl-[64px]">

      <MainSidebar />

      <div className="max-w-4xl mx-auto pb-24">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-base text-dark mb-0.5">{user?.name}</h2>
            <ChevronRight size={16} className="rotate-90 text-gray-500" />
          </div>
        </header>

        <main className="pt-6">
          {/* Profile Info */}
          <section className="px-4 mb-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="relative group w-20 h-20">
                  {/* คอนเทนเนอร์รูปโปรไฟล์ */}
                  <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-[#00aeff] ring-2 ring-[#00aeff]/20 group">
                    {user?.profileImage ? (
                      <img src={user.profileImage} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <User size={30} className="text-gray-300" />
                      </div>
                    )}

                    {/* Overlay: View & Edit Buttons - จะแสดงเมื่อ Hover หรือแตะ */}
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 gap-1">
                      <button
                        onClick={() => setPreviewOpen(true)}
                        className="w-full h-1/2 flex items-center justify-center hover:bg-white/20 transition-colors border-b border-white/10"
                        title={t("header.viewProfile")}
                      >
                        <Eye size={16} className="text-white" />
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-1/2 flex items-center justify-center hover:bg-white/20 transition-colors"
                        title={t("header.editPhoto")}
                      >
                        <Camera size={16} className="text-white" />
                      </button>
                    </div>
                  </div>

                  {/* ปุ่ม + ตกแต่งมุมขวาล่างแบบ TikTok (ถ้าต้องการคงไว้) */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#00aeff] rounded-full flex items-center justify-center border-2 border-white z-10 pointer-events-none group-hover:scale-0 transition-transform duration-200">
                    <Plus size={12} strokeWidth={3} className="text-white" />
                  </div>

                  {/* Hidden Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </div>

                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-black text-slate-800 truncate">{user?.name || t("pages.profile.lalaUser")}</h2>
                  <p
                    onClick={() => navigator.clipboard.writeText(`@${user?.username || ""}`)}
                    className="text-xs text-[#00aeff] font-black mb-1 cursor-pointer active:opacity-60"
                  >@{user?.username || user?.handle || ""}</p>
                  <div className="mt-1 flex flex-col gap-1">
                    <div className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: '#00aeff' }}>
                      <MapPin size={12} /> {location}
                    </div>
                    
                  </div>
                </div>
                
              </div>
              <Link href="/me/profilesetting/settings">
                <button className="p-1.5 text-slate-400 hover:text-slate-600 active:scale-90 transition-all">
                  <MoreVertical size={24} />
                </button>
              </Link>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:gap-8 mb-6">
              <div className="md:flex-1">
                <p className="text-sm text-dark whitespace-pre-wrap">
                  {user?.bio}
                </p>
              </div>

            </div>
          </section>

          {/* Tabs */}
          <div className="flex border-t border-gray-100">
            <button
              onClick={() => setActiveTab("posts")}
              className={`flex-1 flex items-center justify-center py-3 border-t-2 ${activeTab === "posts" ? "border-dark text-dark" : "border-transparent text-gray-400"}`}
            >
              <Grid size={22} />
            </button>
            <button
              onClick={() => setActiveTab("reels")}
              className={`flex-1 flex items-center justify-center py-3 border-t-2 ${activeTab === "reels" ? "border-dark text-dark" : "border-transparent text-gray-400"}`}
            >
              <Play size={22} />
            </button>
            <button
              onClick={() => setActiveTab("tagged")}
              className={`flex-1 flex items-center justify-center py-3 border-t-2 ${activeTab === "tagged" ? "border-dark text-dark" : "border-transparent text-gray-400"}`}
            >
              <UserSquare size={22} />
            </button>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-3 gap-[2px] w-full">
            {displayProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => handlePostClick(product)}
                className="relative aspect-square group cursor-pointer overflow-hidden bg-gray-100"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-dark/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-bold">
                  <div className="flex items-center gap-1">
                    <Heart size={20} fill="white" />
                    <span>{product.likes}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle size={20} fill="white" />
                    <span>{product.comments}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark/80 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setSelectedPost(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-xl overflow-hidden shadow-2xl">
            <div className="max-h-[90vh] overflow-y-auto">
              <SocialPost post={selectedPost} />
            </div>
            <button
              onClick={() => setSelectedPost(null)}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white p-2 rounded-full transition-colors z-10"
            >
              <Plus className="rotate-45" size={24} />
            </button>
          </div>
        </div>
      )}
      {userListModal.isOpen && (
        <UserListModal
          isOpen={userListModal.isOpen}
          type={userListModal.type}
          title={userListModal.title}
          userId={user?._id}
          onClose={() => setUserListModal(prev => ({ ...prev, isOpen: false }))}
        />
      )}
    </div>
  );
}

function setImgSrc(arg0: string): any {
  throw new Error("Function not implemented.");
}
