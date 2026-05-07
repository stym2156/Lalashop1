// Lightweight page-view tracker. Fires a single beacon-style POST to the
// backend on every route change. Best-effort — failures are swallowed so
// tracking never breaks the user-facing experience.
//
// Session id is generated once per browser tab and persisted to sessionStorage
// so unique-session counts are consistent across navigations.

const SESSION_KEY = "lalashop_pv_sid";

const getSessionId = (): string => {
  if (typeof window === "undefined") return "";
  let sid = window.sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    window.sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
};

interface TrackParams {
  path: string;
  pageType?: "product" | "shop" | "category" | "home" | "post" | "other";
  productId?: string;
  shopId?: string;
}

export const trackPageView = (params: TrackParams): void => {
  if (typeof window === "undefined") return;
  const payload = {
    path: params.path,
    pageType: params.pageType || "other",
    productId: params.productId,
    shopId: params.shopId,
    sessionId: getSessionId(),
    referrer: document.referrer || "",
  };

  const token = window.localStorage.getItem("token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token && token !== "null" && token !== "undefined") {
    headers.Authorization = `Bearer ${token}`;
  }

  fetch("/api/tracking/pageview", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // Tracking failures are silent — never break the page.
  });
};
