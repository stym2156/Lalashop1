import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { ShieldAlert, Loader2 } from "lucide-react";
import { apiClient } from "@/services/apiClient";

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

interface AdminProfile {
  _id: string;
  email?: string;
  name?: string;
  isAdmin?: boolean;
  adminRole?: "super" | "finance" | "support" | "content";
}

// Wraps every protected admin page. Performs a single /auth/me check on mount,
// redirects to /login if the user is not authenticated AND not an admin.
// While the check is in flight we render a small loader so the underlying
// dashboard never flashes for unauthorized users.
const AdminAuthGuard: React.FC<AdminAuthGuardProps> = ({ children }) => {
  const router = useRouter();
  const { t } = useTranslation("common");
  const [state, setState] = useState<"checking" | "ok" | "denied">("checking");

  useEffect(() => {
    let cancelled = false;
    const verify = async () => {
      if (typeof window === "undefined") return;
      const token = window.localStorage.getItem("token");
      if (!token || token === "null" || token === "undefined") {
        if (!cancelled) {
          setState("denied");
          void router.replace(`/login?next=${encodeURIComponent(router.asPath)}`);
        }
        return;
      }
      try {
        const res = (await apiClient("/auth/me")) as AdminProfile | { data?: AdminProfile };
        const profile = (res as { data?: AdminProfile }).data ?? (res as AdminProfile);
        if (cancelled) return;
        if (!profile?._id) {
          setState("denied");
          void router.replace(`/login?next=${encodeURIComponent(router.asPath)}`);
          return;
        }
        if (!profile.isAdmin) {
          // Authenticated but not an admin — clear token + redirect.
          window.localStorage.removeItem("token");
          setState("denied");
          void router.replace("/login?error=not_admin");
          return;
        }
        setState("ok");
      } catch {
        if (!cancelled) {
          window.localStorage.removeItem("token");
          setState("denied");
          void router.replace(`/login?next=${encodeURIComponent(router.asPath)}`);
        }
      }
    };
    void verify();
    return () => {
      cancelled = true;
    };
    // Re-run on route change so accidental token wipes redirect immediately.
  }, [router.pathname]);  // eslint-disable-line react-hooks/exhaustive-deps

  if (state === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p className="text-xs font-medium tracking-wide">{t("components.authGuard.checking")}</p>
        </div>
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <ShieldAlert className="w-7 h-7 text-rose-500" />
          <p className="text-sm font-bold text-gray-700">{t("components.authGuard.checking")}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminAuthGuard;
