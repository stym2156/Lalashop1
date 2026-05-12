import "../styles/globals.css";
import i18n, { getStoredLanguage } from "@/i18n/config";
import { useEffect } from "react";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import SellerLayout from "@/components/Layout/SellerLayout";
import AuthGuard from "@/components/AuthGuard";

const PUBLIC_ROUTES = ["/login"];

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isPublic = PUBLIC_ROUTES.includes(router.pathname);

  // Switch i18n language after mount to avoid SSR/CSR hydration mismatch.
  useEffect(() => {
    const stored = getStoredLanguage();
    if (stored && stored !== i18n.language) {
      void i18n.changeLanguage(stored);
    }
  }, []);

  if (isPublic) {
    return <Component {...pageProps} />;
  }

  return (
    <AuthGuard>
      <SellerLayout>
        <Component {...pageProps} />
      </SellerLayout>
    </AuthGuard>
  );
}
