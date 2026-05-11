"use client";

import React from "react";
import Header from "@/components/layout/Header";
import {
   User, Wallet, Gift,
   Package,
   TrendingUp, MapPin, LayoutGrid, ShoppingBag, Smartphone,
   MoreVertical, Plus, Heart, Trash2,
   Camera,
   Eye,
   Banknote,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";

import Balance from "./menu/balance";
import Points from "./menu/Orderme/orderme";
import Coupons from "./menu/coupons";
import CreditLimit from "./menu/promo";
import Withdraw from "./menu/withdraw";
import MyShopPage from "./myshop/myshop";
import UserListModal from "@/pages/Social/components/UserListModal";
import { apiClient } from "@/services/apiClient";
import { uploadImage } from "@/services/uploadImage";

type SubView = "none" | "balance" | "points" | "coupons" | "creditLimit" | "withdraw";

const MePage: React.FC = () => {
   const { t } = useTranslation("common");
   const router = useRouter();

   const [user, setUser] = useState<any>(null);
   const [loading, setLoading] = useState(true);
   const [subView, setSubView] = useState<SubView>("none");
   const [isSeller, setIsSeller] = useState<boolean | null>(false);
   const [location, setLocation] = useState("Vientiane, Laos");
   const [previewOpen, setPreviewOpen] = useState(false);
   const [menuOpen, setMenuOpen] = useState(false);
   const fileInputRef = useRef<HTMLInputElement>(null);
   const [imgSrc, setImgSrc] = useState<string | null>(null);

   // react-easy-crop states
   const [cropPos, setCropPos] = useState({ x: 0, y: 0 });
   const [zoom, setZoom] = useState(1);
   const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

   const [contentTab, setContentTab] = useState<"posts" | "shop">("posts");
   const [myPosts, setMyPosts] = useState<any[]>([]);
   const [loadingPosts, setLoadingPosts] = useState(false);
   const [userListModal, setUserListModal] = useState<{
      isOpen: boolean;
      type: "followers" | "following";
      title: string;
   }>({ isOpen: false, type: "followers", title: "Followers" });

   const fetchLocation = () => {
      if (typeof window !== "undefined" && "geolocation" in navigator) {
         navigator.geolocation.getCurrentPosition(async (position) => {
            try {
               const { latitude, longitude } = position.coords;
               const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
               const data = await res.json();
               const city = data.address.city || data.address.town || data.address.village || "Somewhere";
               const country = data.address.country || "Earth";
               setLocation(`${city}, ${country}`);
            } catch (e) {
               console.error("Loc fetch error:", e);
            }
         }, (err) => console.warn("Geo error:", err));
      }
   };

   const fetchProfile = async () => {
      try {
         const data = await apiClient("/auth/me");
         // Handle both flat response { success, _id, name, ... } and nested { data: {...} }
         const { success, ...rest } = data || {};
         const profileData = data?.data || data?.user || rest;
         if (profileData) {
            setUser((prev: any) => {
               const cached = JSON.parse(localStorage.getItem("userInfo") || "{}");
               const merged = {
                  ...profileData,
                  username: profileData.username || prev?.username || cached?.username || "",
                  bio: profileData.bio || prev?.bio || cached?.bio || "",
                  phone: profileData.phone || profileData.phoneNumber || profileData.tel || prev?.phone || cached?.phone || "",
                  email: profileData.email || prev?.email || cached?.email || ""
               };
               localStorage.setItem("userInfo", JSON.stringify(merged));
               return merged;
            });
            setIsSeller(!!(profileData?.isSeller));
         }
      } catch (e) {
         console.error(e);
      } finally {
         setLoading(false);
      }
   };

   const fetchMyPosts = async () => {
      setLoadingPosts(true);
      try {
         const data = await apiClient("/posts/my");
         setMyPosts(data.data || []);
      } catch (err) {
         console.error(err);
      } finally {
         setLoadingPosts(false);
      }
   };

   const handleDeletePost = async (postId: string) => {
      if (!confirm(t("pages.profile.deletePostConfirm"))) return;
      try {
         await apiClient(`/posts/${postId}`, { method: "DELETE" });
         setMyPosts(prev => prev.filter(p => p._id !== postId));
      } catch (err) {
         console.error("Delete failed:", err);
         alert(t("pages.profile.deletePostFailed"));
      }
   };

   useEffect(() => {
      const cachedUser = localStorage.getItem("userInfo");
      if (cachedUser) setUser(JSON.parse(cachedUser));
      fetchProfile();
      fetchMyPosts();
      fetchLocation();
      const handleUpdate = () => fetchProfile();
      window.addEventListener("profileUpdate", handleUpdate);
      return () => window.removeEventListener("profileUpdate", handleUpdate);
   }, []);

   const openUserList = (type: "followers" | "following") => {
      setUserListModal({ isOpen: true, type, title: type.charAt(0).toUpperCase() + type.slice(1) });
   };

   const onCropComplete = useCallback((_: any, croppedPixels: any) => {
      setCroppedAreaPixels(croppedPixels);
   }, []);

   const handleCropUpload = async () => {
      if (!imgSrc || !croppedAreaPixels) return;

      const image = new Image();
      image.src = imgSrc;
      await new Promise(r => { image.onload = r; });

      const canvas = document.createElement("canvas");
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(
         image,
         croppedAreaPixels.x, croppedAreaPixels.y,
         croppedAreaPixels.width, croppedAreaPixels.height,
         0, 0,
         croppedAreaPixels.width, croppedAreaPixels.height
      );

      canvas.toBlob(async (blob) => {
         if (!blob) return;
         const file = new File([blob], "profile.png", { type: "image/png" });
         await handleUploadProfileImage(file);
         setImgSrc(null);
      }, "image/png");
   };

   const handleUploadProfileImage = async (file: File) => {
      const url = await uploadImage(file, "profile");
      await apiClient("/users/profile", { method: "PUT", body: JSON.stringify({ profileImage: url }) });
      setUser((p: any) => ({ ...p, profileImage: url }));
      localStorage.setItem("userInfo", JSON.stringify({ ...user, profileImage: url }));
      window.dispatchEvent(new Event("profileUpdate"));
   };

   const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => setImgSrc(reader.result as string);
      reader.readAsDataURL(file);
   };

   if (loading) {
      return (
         <div className="flex items-center justify-center min-h-screen bg-gray-light">
            <div className="w-8 h-8 border-4 border-gray-border border-t-primary-hover animate-spin rounded-full" />
         </div>
      );
   }

   if (subView === "balance") return <Balance onBack={() => setSubView("none")} />;
   if (subView === "points") return <Points onBack={() => setSubView("none")} />;
   if (subView === "coupons") return <Coupons onBack={() => setSubView("none")} />;
   if (subView === "creditLimit") return <CreditLimit onBack={() => setSubView("none")} />;
   if (subView === "withdraw") return <Withdraw onBack={() => setSubView("none")} />;

   const stats = [
      { id: "balance", icon: Wallet, label: t("pages.profile.webBalance"), val: `฿${user?.balance?.toLocaleString() || 0}` },
      { id: "points", icon: Package, label: t("pages.profile.ordersStat"), val: `${user?.orderCount || 0} ` },
      { id: "coupons", icon: Gift, label: t("pages.profile.couponsStat"), val: "0" },
      { id: "creditLimit", icon: TrendingUp, label: t("pages.profile.promotions"), val: "0" },
      { id: "withdraw", icon: Banknote, label: t("pages.profile.withdraw"), val: `฿${user?.balance?.toLocaleString() || 0}` },
   ];

   return (
      <div className="flex-1 flex flex-col min-h-screen bg-gray-light font-body text-dark antialiased">
         <Header />

         {/* Preview Modal */}
         <AnimatePresence>
            {previewOpen && (
               <div className="fixed inset-0 z-[200] flex items-center justify-center">
                  <div onClick={() => setPreviewOpen(false)} className="absolute inset-0 bg-black/90" />
                  <motion.div
                     initial={{ scale: 0.9, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     exit={{ scale: 0.9, opacity: 0 }}
                     className="relative z-10 w-[90%] max-w-md"
                  >
                     <div className="w-full aspect-square bg-black rounded-2xl overflow-hidden">
                        {user?.profileImage
                           ? <img src={user.profileImage} className="w-full h-full object-cover" />
                           : <div className="flex items-center justify-center h-full text-white">{t("status.noImage")}</div>
                        }
                     </div>
                  </motion.div>
               </div>
            )}
         </AnimatePresence>

         {/* Crop Modal */}
         {imgSrc && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[300] p-4">
               <div className="bg-white  w-full max-w-sm overflow-hidden shadow-2xl">

                  {/* Header */}
                  <div className="flex items-center justify-between px-5 pt-4 pb-3">
                     <span className="text-[15px] font-bold text-slate-800">{t("pages.profile.profile")}</span>
                     <button
                        onClick={() => setImgSrc(null)}
                        className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm"
                     >✕</button>
                  </div>

                  {/* Cropper */}
                  <div className="relative w-full h-72 bg-[#1a1a1a] overflow-hidden">
                     <Cropper
                        image={imgSrc}
                        crop={cropPos}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={setCropPos}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                     />
                  </div>

                  {/* Zoom + extra buttons */}
                  <div className="px-5 pt-4">
                     <div className="flex items-center gap-3">
                        <button
                           onClick={() => setZoom(prev => Math.max(1, parseFloat((prev - 0.1).toFixed(1))))}
                           className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 text-lg font-bold flex items-center justify-center"
                        >−</button>
                        <input
                           type="range" min={1} max={3} step={0.1}
                           value={zoom}
                           onChange={(e) => setZoom(Number(e.target.value))}
                           className="flex-1 accent-[#0095f6]"
                        />
                        <button
                           onClick={() => setZoom(prev => Math.min(3, parseFloat((prev + 0.1).toFixed(1))))}
                           className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 text-lg font-bold flex items-center justify-center"
                        >+</button>
                     </div>


                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-end gap-3 px-5 py-4 mt-2 border-t border-gray-100">
                     <button
                        onClick={() => setImgSrc(null)}
                        className="px-5 py-2 rounded-full border border-gray-200 text-[14px] font-semibold text-slate-700"
                     >{t("pages.profile.cancel")}</button>
                     <button
                        onClick={handleCropUpload}
                        className="px-6 py-2 rounded-full bg-[#0095f6] text-white text-[14px] font-semibold"
                     >{t("pages.profile.save")}</button>
                  </div>

               </div>
            </div>
         )}

         <main className="w-full">
            {/* PROFILE HEADER */}
            <section className="bg-white border-b border-slate-200 w-full p-4 sm:p-6 flex flex-col gap-5">
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
                           <p className="mt-2 text-[12px] text-slate-600 whitespace-pre-wrap leading-relaxed line-clamp-2 md:line-clamp-none">
                              {user?.bio}
                           </p>
                        </div>
                     </div>
                  </div>
                  <Link href="/me/profilesetting/settings">
                     <button className="p-1.5 text-slate-400 hover:text-slate-600 active:scale-90 transition-all">
                        <MoreVertical size={24} />
                     </button>
                  </Link>
               </div>

               <div className="flex border-t border-slate-50 pt-4">
                  {[
                     { label: t("pages.profile.posts"), val: myPosts.length, onClick: () => setContentTab("posts") },
                     { label: t("pages.profile.followers"), val: user?.followers?.length || 0, onClick: () => openUserList("followers") },
                     { label: t("pages.profile.following"), val: user?.following?.length || 0, onClick: () => openUserList("following") },
                     { label: t("pages.profile.likes"), val: myPosts.reduce((acc, curr) => acc + (curr.likes?.length || 0), 0), onClick: null },
                  ].map((m, i) => (
                     <button key={i} onClick={m.onClick || undefined} className="flex-1 flex flex-col items-center justify-center px-1 active:scale-95 transition-transform">
                        <span className="text-base sm:text-lg font-bold text-slate-900 leading-none">{m.val.toLocaleString()}</span>
                        <span className="mt-1 text-[10px] font-medium text-slate-400 tracking-wider">{m.label}</span>
                     </button>
                  ))}
               </div>
            </section>

            {/* FINANCIAL STATS */}
            <section className="bg-white border-y border-gray-border grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-gray-light w-full shadow-sm shadow-black/[0.02]">
               {stats.map((s) => (
                  <button key={s.id} onClick={() => setSubView(s.id as SubView)} className="p-6 flex flex-col items-start active:bg-gray-light transition-colors group relative overflow-hidden">
                     <s.icon size={15} className="mb-4 text-primary-hover group-hover:scale-110 transition-transform duration-300" />
                     <p className="text-[9px] font-bold text-gray-400 tracking-widest mb-1">{s.label}</p>
                     <p className="font-black text-[15px] tracking-tight text-dark">{s.val}</p>
                  </button>
               ))}
            </section>

            {/* TABS */}
            <div className="sticky top-[52px] z-30 bg-white border-b border-gray-border flex w-full">
               <button onClick={() => setContentTab("posts")} className={`flex-1 py-4 flex flex-col items-center relative transition-colors ${contentTab === 'posts' ? 'text-dark' : 'text-gray-400'}`}>
                  <LayoutGrid size={22} strokeWidth={contentTab === 'posts' ? 2.5 : 2} />
                  {contentTab === 'posts' && <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-dark" />}
               </button>
               <button onClick={() => setContentTab("shop")} className={`flex-1 py-4 flex flex-col items-center relative transition-colors ${contentTab === 'shop' ? 'text-dark' : 'text-gray-400'}`}>
                  <ShoppingBag size={22} strokeWidth={contentTab === 'shop' ? 2.5 : 2} />
                  {contentTab === 'shop' && <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-dark" />}
               </button>
            </div>

            {/* CONTENT */}
            <div className="w-full bg-white">
               {contentTab === "posts" ? (
                  <div className="w-full">
                     {loadingPosts ? (
                        <div className="flex justify-center py-20">
                           <div className="w-6 h-6 border-2 border-slate-200 border-t-[#00aeff] animate-spin rounded-full" />
                        </div>
                     ) : myPosts.length > 0 ? (
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-[1px]">
                           {myPosts.map((post) => (
                              <div key={post._id} onClick={() => router.push(`/posts/${post._id}`)} className="aspect-[3/4] bg-slate-100 relative group cursor-pointer overflow-hidden border-[0.5px] border-slate-50">
                                 {post.mediaType === "video"
                                    ? <video src={post.mediaUrl} className="w-full h-full object-cover" muted loop onMouseEnter={e => e.currentTarget.play()} onMouseLeave={e => e.currentTarget.pause()} />
                                    : <img src={post.mediaUrl} className="w-full h-full object-cover" alt="" />
                                 }
                                 <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                                    <div className="flex items-center gap-1">
                                       <Heart size={16} fill="white" />
                                       <span className="text-xs font-bold">{post.likes?.length || 0}</span>
                                    </div>
                                    <button onClick={e => { e.stopPropagation(); handleDeletePost(post._id); }} className="p-1 px-2 hover:bg-red-500 rounded text-xs font-bold transition-colors">
                                       <Trash2 size={16} />
                                    </button>
                                 </div>
                              </div>
                           ))}
                        </div>
                     ) : (
                        <div className="flex flex-col items-center justify-center py-24 px-10 text-center">
                           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
                              <LayoutGrid size={40} strokeWidth={1} />
                           </div>
                           <button onClick={() => router.push("/posts/create-post")} className="flex items-center gap-2 bg-[#00aeff] text-white px-10 py-4 rounded-full text-xs font-black shadow-lg shadow-[#00aeff]/20 active:scale-95 transition-all tracking-widest">
                              <Plus size={18} /> {t("pages.profile.newPost")}
                           </button>
                        </div>
                     )}
                     <button onClick={() => router.push("/posts/create-post")} className="fixed bottom-24 right-6 w-14 h-14 bg-[#00aeff] text-white rounded-full flex items-center justify-center shadow-2xl shadow-[#00aeff]/40 active:scale-90 transition-all z-50">
                        <Plus size={28} strokeWidth={3} />
                     </button>
                  </div>
               ) : (
                  <div className="w-full">
                     {isSeller ? (
                        <MyShopPage isSeller={true} />
                     ) : (
                        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
                           <div className="w-24 h-24 bg-[#F8FAFC] rounded-full flex items-center justify-center text-[#CBD5E1] mb-8 shadow-inner">
                              <ShoppingBag size={40} strokeWidth={1.5} />
                           </div>
                           <p className="text-[14px] text-[#94A3B8] max-w-xs mb-10 font-medium leading-relaxed">
                              {t("pages.profile.openShopPrompt")}
                           </p>
                           <button onClick={() => router.push("/me/opensho/openshop")} className="w-full sm:w-auto px-12 py-4 bg-[#00aeff] text-white rounded-full font-black text-[13px] tracking-widest shadow-xl shadow-[#00aeff]/30 hover:bg-[#0096db] active:scale-95 transition-all">
                              {t("pages.profile.startSelling")}
                           </button>
                        </div>
                     )}
                  </div>
               )}
            </div>

            <UserListModal
               isOpen={userListModal.isOpen}
               type={userListModal.type}
               title={userListModal.title}
               userId={user?._id}
               onClose={() => setUserListModal(prev => ({ ...prev, isOpen: false }))}
            />

            <div className="py-20 flex items-center justify-center opacity-10">
               <p className="text-[11px] font-black tracking-[0.8em] text-dark">{t("pages.profile.footerTagline")}</p>
            </div>
         </main>
      </div>
   );
};
export default MePage;