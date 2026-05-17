import "@/pages/globals.css";
import i18n, { getStoredLanguage } from "@/i18n/config";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import MainSidebar from "@/components/layout/MainSidebar";
import BottomNav from "@/components/layout/BottomNav";
import { LoadingProvider } from "../../LoadingContext";
import { ChatProvider } from "@/components/chat/ChatContext";
import ChatPanel from "@/components/chat/ChatPanel";
import CustomerAuthGuard from "@/components/CustomerAuthGuard";
import { useRouter } from "next/router";
import { trackPageView } from "@/services/pageViewTracker";

// Routes that require a logged-in customer. Match is prefix-based so all
// /me/*, /orders/*, /creator/*, /buyproduct/* sub-routes are covered. Public
// flows (home, product detail, category, search, login/signup, social feed,
// posts viewing, shop profile pages) are NOT in this list — they render
// without a token and the apiClient sends requests as anonymous.
const PROTECTED_PREFIXES = [
  "/cart",
  "/buyproduct/",
  "/me",
  "/orders",
  "/creator",
  "/posts/create-post",
];

// Classify the current route into a page-type bucket so analytics can roll up
// by category. We extract product/shop IDs from the dynamic segments so the
// seller dashboard knows which resource was viewed.
const classifyRoute = (
  pathname: string,
  query: Record<string, string | string[] | undefined>,
  asPath: string
): {
  pageType: "product" | "shop" | "category" | "home" | "post" | "other";
  productId?: string;
  shopId?: string;
} => {
  if (pathname === "/") return { pageType: "home" };
  if (pathname.startsWith("/product/")) {
    const id = Array.isArray(query.id) ? query.id[0] : query.id;
    return { pageType: "product", productId: id };
  }
  if (pathname.startsWith("/u/")) {
    const id = Array.isArray(query.id) ? query.id[0] : query.id;
    return { pageType: "shop", shopId: id };
  }
  if (pathname.startsWith("/category/")) {
    return { pageType: "category" };
  }
  if (pathname.startsWith("/posts/")) {
    return { pageType: "post" };
  }
  return { pageType: "other" };
};

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const hideSidebar = ["/login", "/register", "/Adminsell"].some((path) =>
    router.pathname.startsWith(path)
  );
  const hideBottomNav = ["/login", "/register", "/Adminsell"].some((path) =>
    router.pathname.startsWith(path)
  );

  // Switch i18n language after mount to avoid SSR/CSR hydration mismatch.
  useEffect(() => {
    const stored = getStoredLanguage();
    if (stored && stored !== i18n.language) {
      void i18n.changeLanguage(stored);
    }
  }, []);

  // Fire a page-view event on every navigation. Listening to routeChangeComplete
  // catches client-side navigations; the initial server-rendered load is also
  // tracked once on mount.
  useEffect(() => {
    const fire = (asPath: string) => {
      const url = new URL(asPath, window.location.origin);
      const meta = classifyRoute(router.pathname, router.query, asPath);
      // Product and shop pages track themselves AFTER fetching data so they can
      // include the owning shopId — skip them here to avoid double-counting.
      if (meta.pageType === "product" || meta.pageType === "shop") return;
      trackPageView({
        path: url.pathname,
        pageType: meta.pageType,
      });
    };
    fire(router.asPath);
    const onRouteChange = (asPath: string) => fire(asPath);
    router.events.on("routeChangeComplete", onRouteChange);
    return () => {
      router.events.off("routeChangeComplete", onRouteChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.pathname]);

  const requiresAuth = PROTECTED_PREFIXES.some(
    (p) => router.pathname === p || router.pathname.startsWith(p),
  );

  const inner = <Component {...pageProps} />;
  const maybeGuarded = requiresAuth ? <CustomerAuthGuard>{inner}</CustomerAuthGuard> : inner;

  return (
    <LoadingProvider>
      <ChatProvider>
        <div className="flex min-h-screen bg-gray-50/50">
          {!hideSidebar && <MainSidebar />}
          <main
            className={`flex-1 ${!hideSidebar ? "md:pl-[64px]" : ""} min-h-screen flex flex-col`}
          >
            {maybeGuarded}
          </main>
          {!hideBottomNav && <BottomNav />}
          <ChatPanel />
        </div>
      </ChatProvider>
    </LoadingProvider>
  );
}
