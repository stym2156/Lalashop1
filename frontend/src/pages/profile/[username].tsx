import React, { useEffect, useState } from "react";
import Head from "next/head";
import {
  ChevronLeft,
  Grid,
  Play,
  UserSquare,
  MoreHorizontal,
  Heart,
  MessageCircle,
  Plus,
  Store,
  Star,
  Flag,
  User as UserIcon,
} from "lucide-react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import FollowButton from "@/pages/Social/components/FollowButton";
import UserListModal from "@/pages/Social/components/UserListModal";
import SocialPost from "@/pages/Social/components/SocialPost";
import MainSidebar from "@/components/layout/MainSidebar";
import ReportModal, { type ReportTargetType } from "@/components/ReportModal";
import { apiClient } from "@/services/apiClient";
import { useCurrentUser } from "@/services/useCurrentUser";

export default function UserProfilePage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const { username } = router.query; // This is actually the user ID in our current routing
  const [targetUser, setTargetUser] = useState<any>(null);
  const [userProducts, setUserProducts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [userListModal, setUserListModal] = useState<{
    isOpen: boolean;
    type: "followers" | "following";
    title: string;
  }>({
    isOpen: false,
    type: "followers",
    title: "Followers"
  });

  const { user: me } = useCurrentUser();
  const currentUserId = me?._id || null;

  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<ReportTargetType>("user");
  const menuRef = React.useRef<HTMLDivElement>(null);

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

  const openReport = (type: ReportTargetType) => {
    setReportTarget(type);
    setMenuOpen(false);
    setReportOpen(true);
  };

  const fetchTargetProfile = async () => {
    if (!username) return;
    setLoading(true);
    try {
      const data = await apiClient(`/users/profile/${username}`);
      if (data.data) {
        setTargetUser(data.data);

        if (currentUserId) {
          setIsFollowing(
            (data.data.followers || []).some(
              (f: any) => (typeof f === "string" ? f : f._id) === currentUserId
            )
          );
        }
      }
    } catch (error) {
      console.error("Fetch target profile error:", error);
    } finally {
      setLoading(false);
    }
  };

  const isOwnProfile = !!(currentUserId && targetUser?._id && currentUserId === targetUser._id);

  const [activeTab, setActiveTab] = useState<"posts" | "shop">("posts");
  const [shopProducts, setShopProducts] = useState<any[]>([]);
  const [shopLoading, setShopLoading] = useState(false);

  useEffect(() => {
    fetchTargetProfile();

    const handleFollowChange = (e: any) => {
        if (e.detail.userId === username) {
            setIsFollowing(e.detail.isFollowing);
            fetchTargetProfile(); // Refresh counts
        }
    };

    window.addEventListener('followStatusChanged', handleFollowChange as any);
    return () => window.removeEventListener('followStatusChanged', handleFollowChange as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, currentUserId]);

  useEffect(() => {
    const fetchShop = async () => {
      if (!targetUser?._id || !targetUser?.isSeller) return;
      setShopLoading(true);
      try {
        const res = await apiClient(`/products/seller/${targetUser._id}`);
        setShopProducts(res?.data || []);
      } catch (e) {
        setShopProducts([]);
      } finally {
        setShopLoading(false);
      }
    };
    fetchShop();
  }, [targetUser?._id, targetUser?.isSeller]);

  if (loading && !targetUser) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!targetUser) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
        <h2 className="text-xl font-bold text-slate-800 mb-2">{t("status.empty")}</h2>
        <p className="text-slate-500 mb-6 text-center">{t("status.empty")}</p>
        <button onClick={() => router.back()} className="bg-primary text-white px-8 py-2 rounded-full font-bold">{t("actions.back")}</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-sans md:pl-[64px]">
      <Head>
        <title>{targetUser.name} (@{targetUser.name?.toLowerCase().replace(/\s+/g, '_')}) | Lala</title>
      </Head>

      <MainSidebar />

      {/* Top Navigation - Mobile Only Sticky */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between md:hidden">
        <button onClick={() => router.back()} className="p-1 text-slate-800"><ChevronLeft size={24} /></button>
        <h1 className="text-sm font-bold tracking-tight text-slate-800">
            {targetUser.name?.toLowerCase().replace(/\s+/g, '_')}
        </h1>
        <div className="relative" ref={menuRef}>
          {!isOwnProfile ? (
            <>
              <button onClick={() => setMenuOpen((s) => !s)} className="p-1 text-slate-800">
                <MoreHorizontal size={24} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl py-1 min-w-[180px] z-40">
                  <button
                    onClick={() => openReport("user")}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[12px] font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Flag size={14} /> {t("pages.publicShop.reportUser")}
                  </button>
                  {targetUser.isSeller && (
                    <button
                      onClick={() => openReport("shop")}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[12px] font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Flag size={14} /> {t("pages.publicShop.reportShop")}
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="w-7" />
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto pt-4 md:pt-12 px-4 pb-24">

        {/* Profile Header Section */}
        <section className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-12 mb-10">
          {/* Avatar */}
          <div className="flex-shrink-0 mx-auto md:mx-0">
            <div className="w-24 h-24 md:w-40 md:h-40 rounded-full p-[2px] bg-gradient-to-tr from-accent via-primary to-navy shadow-lg">
              <div className="w-full h-full rounded-full border-4 border-white overflow-hidden bg-gray-100">
                {targetUser.profileImage ? (
                    <img src={targetUser.profileImage} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                        <UserIcon size={60} className="text-gray-200" />
                    </div>
                )}
              </div>
            </div>
          </div>

          {/* User Details */}
          <div className="flex-1 w-full text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
              <h2 className="text-xl md:text-2xl font-light text-slate-800">
                {targetUser.name?.toLowerCase().replace(/\s+/g, '_')}
              </h2>
              {!isOwnProfile && (
                <div className="flex gap-2 justify-center">
                  <FollowButton
                      className="px-8 py-2 text-sm font-bold rounded-lg shadow-sm"
                      userId={targetUser._id}
                      initialFollowing={isFollowing}
                  />
                  <button className="px-8 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-bold transition-colors">
                    {t("pages.profile2.message")}
                  </button>
                </div>
              )}
            </div>

            {/* Stats - Desktop View */}
            <div className="hidden md:flex gap-10 mb-6">
              <span className="text-sm"><strong>{userProducts.length}</strong> posts</span>
              <button 
                onClick={() => setUserListModal({ isOpen: true, type: 'followers', title: 'Followers' })}
                className="text-sm hover:opacity-70 transition-opacity"
              >
                <strong>{targetUser.followers?.length || 0}</strong> followers
              </button>
              <button 
                onClick={() => setUserListModal({ isOpen: true, type: 'following', title: 'Following' })}
                className="text-sm hover:opacity-70 transition-opacity"
              >
                <strong>{targetUser.following?.length || 0}</strong> following
              </button>
            </div>

            {/* Bio */}
            <div className="text-sm md:text-base">
              <h3 className="font-bold text-slate-800">{targetUser.name}</h3>
              <p className="text-slate-600 whitespace-pre-line mt-1">
                {targetUser.bio || "Premium wholesaler products. 📦"}
              </p>
              <Link href="#" className="text-navy font-bold hover:underline block mt-2">
                supplynet.com/{targetUser.name?.toLowerCase().replace(/\s+/g, '_')}
              </Link>
            </div>
          </div>
        </section>

        {/* Mobile Only Stats */}
        <div className="flex md:hidden justify-around py-4 border-t border-gray-100 text-center mb-6">
          <div><div className="font-bold text-slate-800">{userProducts.length}</div><div className="text-xs text-slate-400 font-medium">posts</div></div>
          <div onClick={() => setUserListModal({ isOpen: true, type: 'followers', title: 'Followers' })}>
            <div className="font-bold text-slate-800">{targetUser.followers?.length || 0}</div><div className="text-xs text-slate-400 font-medium">followers</div>
          </div>
          <div onClick={() => setUserListModal({ isOpen: true, type: 'following', title: 'Following' })}>
            <div className="font-bold text-slate-800">{targetUser.following?.length || 0}</div><div className="text-xs text-slate-400 font-medium">following</div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex justify-center border-t border-gray-100">
          <button
            onClick={() => setActiveTab("posts")}
            className={`flex items-center gap-2 py-4 px-8 -mt-[1px] text-[10px] font-black tracking-widest ${
              activeTab === "posts"
                ? "border-t-2 border-slate-800 text-slate-800"
                : "text-gray-400"
            }`}
          >
            <Grid size={16} /> Posts
          </button>
          {targetUser.isSeller && (
            <button
              onClick={() => setActiveTab("shop")}
              className={`flex items-center gap-2 py-4 px-8 -mt-[1px] text-[10px] font-black tracking-widest ${
                activeTab === "shop"
                  ? "border-t-2 border-slate-800 text-slate-800"
                  : "text-gray-400"
              }`}
            >
              <Store size={16} /> Shop ({shopProducts.length})
            </button>
          )}
          
        </div>

        {/* Content Grid */}
        {activeTab === "posts" ? (
          <div className="grid grid-cols-3 gap-[2px] mt-2">
            {userProducts.length > 0 ? userProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => setSelectedPost(product)}
                className="relative aspect-square group cursor-pointer overflow-hidden bg-gray-50"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-bold">
                  <div className="flex items-center gap-1"><Heart fill="white" size={20} /> {product.likes}</div>
                  <div className="flex items-center gap-1"><MessageCircle fill="white" size={20} /> {product.comments}</div>
                </div>
              </div>
            )) : (
              <div className="col-span-3 py-24 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserIcon size={32} className="text-gray-300" />
                </div>
                <p className="text-slate-400 font-medium">{t("pages.social.noPosts")}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-2">
            {shopLoading ? (
              <div className="py-16 flex justify-center">
                <div className="w-6 h-6 border-2 border-slate-200 border-t-primary rounded-full animate-spin" />
              </div>
            ) : shopProducts.length === 0 ? (
              <div className="py-24 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Store size={32} className="text-gray-300" />
                </div>
                <p className="text-slate-400 font-medium">{t("pages.shop.noProducts")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {shopProducts.map((p) => {
                  const cover = Array.isArray(p.images) && p.images.length
                    ? p.images[0]
                    : Array.isArray(p.image) ? p.image[0] : p.image;
                  const rating = Number(p.rating) || 0;
                  return (
                    <Link
                      key={p._id}
                      href={`/product/${p._id}`}
                      className="block group bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-all"
                    >
                      <div className="aspect-square bg-gray-50 relative overflow-hidden">
                        <img
                          src={cover}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {p.freeShipping && (
                          <span className="absolute bottom-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-600 text-white">
                            {t("pages.profile2.freeShipping")}
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="text-xs font-bold text-slate-800 line-clamp-2 min-h-[32px]">
                          {p.name}
                        </h3>
                        {p.description && (
                          <p className="mt-1 text-[11px] text-slate-500 line-clamp-2 leading-snug">
                            {p.description}
                          </p>
                        )}
                        <div className="mt-1.5 flex items-center gap-1 text-[#ffab00]">
                          <Star size={11} fill="currentColor" />
                          <span className="text-[10px] font-bold text-slate-700">
                            {rating > 0 ? rating.toFixed(1) : "—"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium ml-1">
                            ({Number(p.numReviews) || 0})
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium ml-auto">
                            {t("pages.profile2.stockShort", { count: Number(p.countInStock) || 0 })}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm font-black text-primary">
                          ฿{Number(p.price || 0).toLocaleString()}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Responsive Post Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-10 bg-black/60 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setSelectedPost(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-xl overflow-hidden shadow-2xl">
            <div className="max-h-[90vh] overflow-y-auto">
                <SocialPost post={{ ...selectedPost, username: targetUser.name, avatar: targetUser.profileImage }} />
            </div>
            <button onClick={() => setSelectedPost(null)} className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white p-2 rounded-full transition-colors z-10">
              <Plus size={24} className="rotate-45" />
            </button>
          </div>
        </div>
      )}

      {userListModal.isOpen && (
        <UserListModal
          {...userListModal}
          userId={targetUser._id}
          onClose={() => setUserListModal(prev => ({ ...prev, isOpen: false }))}
        />
      )}

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType={reportTarget}
        targetId={targetUser._id}
        targetLabel={targetUser.name || targetUser.username}
      />
    </div>
  );
}