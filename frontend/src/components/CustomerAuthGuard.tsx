import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Loader2 } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

// Light-weight gate for customer-side protected pages (cart, checkout, profile,
// orders, creator hub, post creation). Checks token presence and redirects to
// /login if missing — does NOT round-trip to /auth/me. An expired token still
// reaches the page; the backend rejects subsequent API calls with 401, which
// the apiClient surfaces to the UI. We trade a one-RTT freshness check for a
// snappier protected-page nav.
const CustomerAuthGuard: React.FC<Props> = ({ children }) => {
  const router = useRouter();
  const [state, setState] = useState<"checking" | "ok" | "denied">("checking");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("token");
    if (!token || token === "null" || token === "undefined") {
      setState("denied");
      void router.replace(`/login?next=${encodeURIComponent(router.asPath)}`);
      return;
    }
    setState("ok");
  }, [router.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  if (state !== "ok") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return <>{children}</>;
};

export default CustomerAuthGuard;
