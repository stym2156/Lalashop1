import "../styles/globals.css";
import "@/i18n/config";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import SellerLayout from "@/components/Layout/SellerLayout";
import AuthGuard from "@/components/AuthGuard";

const PUBLIC_ROUTES = ["/login"];

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isPublic = PUBLIC_ROUTES.includes(router.pathname);

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
