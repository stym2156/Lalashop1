import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  ChevronLeft,
  Search,
  User as UserIcon,
  MoreHorizontal,
} from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import FollowButton from "@/pages/Social/components/FollowButton";
import BottomNav from "@/components/layout/BottomNav";
import { apiClient } from "@/services/apiClient";

interface FollowerUser {
  _id: string;
  username?: string;
  name?: string;
  email?: string;
  profileImage?: string;
  bio?: string;
}

export default function FollowersPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const { username } = router.query;
  const [searchQuery, setSearchQuery] = useState("");
  const [userList, setUserList] = useState<FollowerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username || typeof username !== "string") return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const profileRes = await apiClient(`/users/profile/${username}`);
        const userId = profileRes?._id || profileRes?.data?._id || profileRes?.user?._id;
        if (!userId) {
          if (!cancelled) {
            setUserList([]);
            setLoading(false);
          }
          return;
        }
        const followersRes = await apiClient(`/users/followers/${userId}`);
        if (!cancelled) {
          const list = Array.isArray(followersRes)
            ? followersRes
            : followersRes?.data ?? followersRes?.followers ?? [];
          setUserList(list as FollowerUser[]);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("pages.followersPage.failedToLoad"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [username]);

  const filteredUsers = userList.filter((user) => {
    const q = searchQuery.toLowerCase();
    return (
      (user.username && user.username.toLowerCase().includes(q)) ||
      (user.name && user.name.toLowerCase().includes(q))
    );
  });

  if (!username && !loading) return null;

  return (
    <div className="min-h-screen bg-white font-sans pb-20">
      <Head>
        <title>{t("pages.followersPage.titleSuffix", { username })}</title>
      </Head>

      <header className="sticky top-0 z-50 bg-white border-b border-gray-border px-4 py-3 flex items-center justify-between max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-1 hover:bg-gray-light rounded-full transition-colors">
            <ChevronLeft size={28} className="text-dark" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-base font-bold text-dark">{t("pages.followersPage.title")}</h1>
            <span className="text-[10px] text-gray-500 font-medium tracking-wider">@{username}</span>
          </div>
        </div>
        <button className="p-1 hover:bg-gray-light rounded-full transition-colors">
          <MoreHorizontal size={24} className="text-dark" />
        </button>
      </header>

      <main className="max-w-2xl mx-auto w-full pt-4">
        <div className="px-4 mb-6">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t("pages.followersPage.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-light border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all text-dark"
            />
          </div>
        </div>

        <div className="px-4 flex flex-col gap-5">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-14 h-14 rounded-full bg-gray-light" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-light rounded w-32" />
                  <div className="h-3 bg-gray-light rounded w-48" />
                </div>
                <div className="w-24 h-9 bg-gray-light rounded-lg" />
              </div>
            ))
          ) : error ? (
            <div className="py-12 text-center text-red-500 text-sm">{error}</div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div key={user._id} className="flex items-center justify-between gap-3 group animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Link
                  href={`/profile/${user.username || user._id}`}
                  className="flex items-center gap-3 flex-1 overflow-hidden"
                >
                  <div className="w-14 h-14 rounded-full overflow-hidden border border-gray-border bg-gray-light flex-shrink-0 transition-transform group-hover:scale-105">
                    {user.profileImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.profileImage} alt={user.username || user.name || ""} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <UserIcon size={28} className="text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold truncate text-dark leading-tight">
                      {user.username || user.name || user.email}
                    </span>
                    {user.name && (
                      <span className="text-xs text-gray-500 truncate leading-tight">{user.name}</span>
                    )}
                    {user.bio && (
                      <span className="text-[11px] text-gray-400 truncate mt-1">{user.bio}</span>
                    )}
                  </div>
                </Link>
                <FollowButton
                  initialFollowing={false}
                  userId={user._id}
                  className="h-9 px-5 text-xs font-bold"
                />
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <div className="w-20 h-20 rounded-full bg-gray-light flex items-center justify-center mb-4">
                <Search size={32} strokeWidth={1.5} className="opacity-40" />
              </div>
              <p className="text-base font-bold text-dark mb-1">{t("pages.followersPage.noFollowers")}</p>
              <p className="text-sm">{t("pages.followersPage.appearHere", { username })}</p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
