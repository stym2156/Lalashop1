import "../styles/globals.css";
import i18n, { getStoredLanguage } from "@/i18n/config";
import { useEffect } from "react";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import AdminLayout from "@/components/Layout/AdminLayout";
import AdminAuthGuard from "@/components/AdminAuthGuard";

// Routes that anonymous visitors are allowed on. Everything else is wrapped
// in AdminAuthGuard which forces redirect to /login if no admin token.
const AUTH_ROUTES = [
  "/login",
  "/forgot-password",
  "/2fa",
  "/accept-invite/[token]",
];

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isAuthRoute = AUTH_ROUTES.includes(router.pathname);

  // Switch i18n language after mount to avoid SSR/CSR hydration mismatch.
  // Server always renders in fallback "en"; we re-render with the persisted
  // user language only after the page has hydrated.
  useEffect(() => {
    const stored = getStoredLanguage();
    if (stored && stored !== i18n.language) {
      void i18n.changeLanguage(stored);
    }
  }, []);

  if (isAuthRoute) {
    return <Component {...pageProps} />;
  }

  return (
    <AdminAuthGuard>
      <AdminLayout>
        <Component {...pageProps} />
      </AdminLayout>
    </AdminAuthGuard>
  );
}
