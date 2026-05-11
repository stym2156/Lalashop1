import React, { useEffect, useState, useRef } from "react";
import { User as UserIcon, CheckCircle, Camera, Loader2, Edit2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiClient } from "@/services/apiClient";
import { uploadImage } from "@/services/uploadImage";

export const GeneralSection: React.FC = () => {
  const { t } = useTranslation("common");
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
    username: "",
    profileImage: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [originalPhone, setOriginalPhone] = useState<string>(""); // Track if phone was already set from DB
  const maxLength = 150;
  const length = userData.bio?.length || 0;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const rawCached = localStorage.getItem("userInfo");
        const parsedCached = JSON.parse(rawCached || "{}");

        // Normalize data extraction from cache (handling nested user/data objects)
        const cached = parsedCached?.data || parsedCached?.user || parsedCached;

        if (cached.email || cached.name || cached.phone) {
          const cachedPhone = cached.phone || cached.phoneNumber || cached.tel || "";
          setUserData(prev => ({
            ...prev,
            ...cached,
            phone: cachedPhone || prev.phone || ""
          }));
          if (cachedPhone) setOriginalPhone(cachedPhone);
        }

        const data = await apiClient("/auth/me");
        // Handle flat response { success, _id, name, ... } or nested { data: {...} }
        const { success: _, ...rest } = data || {};
        const u = data?.data || data?.user || rest;

        if (u) {
          console.log("--- Check API Data ---");
          console.table({ email: u.email, phone: u.phone, phoneNumber: u.phoneNumber });

          const apiPhone = u.phone || u.phoneNumber || u.tel || "";
          setUserData(prev => ({
            ...prev,
            ...u,
            username: u.username || prev.username || cached.username || "",
            phone: apiPhone || prev.phone || cached.phone || "",
          }));
          if (apiPhone) setOriginalPhone(apiPhone);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleProfileUpload = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      return await uploadImage(file, "profile");
    } catch (err) {
      console.error("Profile image upload failed:", err);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserData(prev => ({ ...prev, profileImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      let finalImageUrl = userData.profileImage;

      if (selectedFile) {
        const uploadedUrl = await handleProfileUpload(selectedFile);
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        }
      }

      console.log("Updating profile with image:", finalImageUrl);
      // Only send phone if it's a new addition (no original phone)
      const updatePayload: any = {
        name: userData.name,
        bio: userData.bio,
        username: userData.username,
        profileImage: finalImageUrl,
      };
      if (!originalPhone && userData.phone) {
        updatePayload.phone = userData.phone;
      }

      const data = await apiClient("/users/profile", {
        method: "PUT",
        body: JSON.stringify(updatePayload),
      });

      console.log("Profile updated successfully:", data);
      setSuccess(true);

      const updatedUser = { ...userData, profileImage: finalImageUrl };
      localStorage.setItem("userInfo", JSON.stringify(updatedUser));
      // Lock phone after successful save
      if (!originalPhone && userData.phone) {
        setOriginalPhone(userData.phone);
      }
      window.dispatchEvent(new Event("profileUpdate"));

      setTimeout(() => setSuccess(false), 2000);
    } catch (error) {
      console.error("Update failed:", error);
      alert("Failed to update profile: " + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-[#00aeff] animate-spin rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 ">Store Name / Name</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-[#00aeff] outline-none"
            value={userData.name}
            onChange={(e) => setUserData({ ...userData, name: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 "> Email</label>
          <input
            type="email"
            className="w-full border border-gray-200 bg-gray-50 rounded-md px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
            value={userData.email}
            disabled
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 ">Username Handle (@)</label>
          <div className="relative group">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#00aeff] font-black text-base z-50 pointer-events-none">@</span>
            <input
              type="text"
              placeholder="username"
              className="w-full border border-gray-300 rounded-md pl-10 pr-2 py-2.5 text-sm font-bold focus:ring-2 focus:ring-[#00aeff]/20 focus:border-[#00aeff] outline-none bg-white relative z-10 transition-all"
              value={userData.username || ""}
              onChange={(e) => setUserData({ ...userData, username: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
            />
          </div>
          <p className="text-[10px] text-gray-400 italic">Example: @member_shop (Can be changed once every 7 days)</p>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500"> Phone</label>
          {originalPhone ? (
            /* Phone already set — locked */
            <input
              type="text"
              className="w-full border border-gray-200 bg-gray-50 rounded-md px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
              value={userData.phone || ""}
              disabled
            />
          ) : (
            /* No phone yet (social login) — allow input */
            <>
              <input
                type="tel"
                placeholder="+856 20 XXXX XXXX"
                className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm font-bold focus:ring-2 focus:ring-[#00aeff]/20 focus:border-[#00aeff] outline-none bg-white transition-all"
                value={userData.phone || ""}
                onChange={(e) => setUserData({ ...userData, phone: e.target.value.replace(/[^0-9+\- ]/g, "") })}
              />
              <p className="text-[10px] text-amber-500 font-medium">Phone number can only be set once and cannot be changed later.</p>
            </>
          )}
        </div>
        <div className="space-y-1 md:col-span-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-gray-500">
              {t("pages.settings.bio")}
            </label>

            <span
              className={`text-[10px] font-bold ${length > maxLength ? "text-red-500" : "text-gray-400"
                }`}
            >
              {length} / {maxLength}
            </span>
          </div>

          <textarea
            rows={3}
            maxLength={200}
            className={`w-full border ${length > maxLength ? "border-red-500" : "border-gray-300"
              } rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-[#00aeff] outline-none transition-colors`}
            placeholder={t("pages.settings.bioPlaceholder")}
            value={userData.bio}
            onChange={(e) =>
              setUserData({ ...userData, bio: e.target.value })
            }
          />

          {/* progress bar */}
          <div className="h-1 w-full bg-gray-200 rounded-full">
            <div
              className={`h-1 rounded-full transition-all ${length > maxLength ? "bg-red-500" : "bg-[#00aeff]"
                }`}
              style={{
                width: `${Math.min((length / maxLength) * 100, 100)}%`,
              }}
            />
          </div>

          {length > maxLength && (
            <p className="text-[10px] text-red-500 font-bold animate-pulse">
              Bio is too long! Please shorten it.
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-50">
        <button
          onClick={handleUpdate}
          disabled={saving || uploading || userData.bio.trim().split(/\s+/).filter(Boolean).length > 88}
          className="bg-[#00aeff] text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-[#008ecc] transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? "Saving..." : "Save Changes"}
          {success && <CheckCircle size={16} />}
        </button>
      </div>
    </div>
  );
};
