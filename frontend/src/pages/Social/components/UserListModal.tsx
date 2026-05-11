import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  User as UserIcon,
  ChevronLeft
} from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import FollowButton from "./FollowButton";
import { apiClient } from "@/services/apiClient";
import { useCurrentUser } from "@/services/useCurrentUser";

interface UserListItem {
  _id: string;
  name: string;
  profileImage?: string;
  bio?: string;
  isFollowing?: boolean;
}

interface UserListModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  type: "followers" | "following";
  userId: string;
}

export default function UserListModal({ title, isOpen, onClose, type, userId }: UserListModalProps) {
  const { t } = useTranslation("common");
  const [searchQuery, setSearchQuery] = useState("");
  const [userList, setUserList] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: me } = useCurrentUser();
  const currentUserId = me?._id;

  useEffect(() => {
    const fetchUsers = async () => {
      if (!isOpen || !userId) return;
      setLoading(true);
      try {
        const endpoint = type === "followers" ? "followers" : "following";
        const data = await apiClient(`/users/${endpoint}/${userId}`);

        const processedUsers = (data.data || []).map((u: any) => ({
          ...u,
          isFollowing:
            type === "following" && userId === currentUserId
              ? true
              : Array.isArray(u.followers) && currentUserId
              ? u.followers.includes(currentUserId)
              : false,
        }));

        setUserList(processedUsers);
      } catch (error) {
        console.error("Fetch users error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isOpen, type, userId, currentUserId]);

  if (!isOpen) return null;

  const filteredUsers = userList.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-dark/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-slate-800" />
          </button>
        </header>

        {/* Search Bar */}
        <div className="px-4 py-3 shrink-0">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={`${t("actions.search")}...`}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-800"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* User List Area */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col gap-5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-24" />
                    <div className="h-2 bg-gray-100 rounded w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="flex flex-col gap-5">
              {filteredUsers.map((user) => (
                <div key={user._id} className="flex items-center justify-between gap-3 group">
                  <Link
                    href={`/u/${user._id}`}
                    onClick={onClose}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-100 bg-gray-50">
                        {user.profileImage ? (
                          <img
                            src={user.profileImage}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <UserIcon size={24} className="text-gray-300" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col min-w-0 text-left">
                      <span className="text-sm font-bold truncate text-slate-800 leading-tight">
                        {user.name}
                      </span>
                      {user.bio && (
                        <span className="text-xs text-slate-500 truncate mt-0.5">
                          {user.bio}
                        </span>
                      )}
                    </div>
                  </Link>

                  <div className="flex-shrink-0">
                    {currentUserId && currentUserId !== user._id && (
                      <FollowButton
                        initialFollowing={user.isFollowing}
                        userId={user._id}
                        className="h-8 py-0 px-4 text-[11px] font-bold rounded-lg shadow-sm"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <Search size={40} className="mb-3 opacity-20" />
              <p className="text-sm">{t("status.noResults")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}