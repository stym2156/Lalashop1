import "../styles/globals.css";
import "@/i18n/config";
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
