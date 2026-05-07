import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import PageView, { type PageViewSource } from "../models/pageViewModel";
import Order from "../models/orderModel";
import Cart from "../models/cartModel";
import { IAuthRequest } from "../middlewares/authMiddleware";

const KNOWN_SEARCH = ["google.", "bing.", "duckduckgo.", "yahoo.", "baidu."];
const KNOWN_SOCIAL = [
  "facebook.",
  "instagram.",
  "tiktok.",
  "twitter.",
  "x.com",
  "line.me",
  "youtube.",
  "messenger.",
  "fb.com",
  "t.me",
];

const classifySource = (referrer: string, host: string): PageViewSource => {
  if (!referrer) return "direct";
  try {
    const url = new URL(referrer);
    const ref = url.hostname.toLowerCase();
    if (host && ref === host) return "internal";
    if (KNOWN_SEARCH.some((s) => ref.includes(s))) return "search";
    if (KNOWN_SOCIAL.some((s) => ref.includes(s))) return "social";
    return "referral";
  } catch {
    return "direct";
  }
};

const detectDevice = (ua: string): "mobile" | "desktop" | "tablet" | "unknown" => {
  const u = (ua || "").toLowerCase();
  if (!u) return "unknown";
  if (/ipad|tablet/.test(u)) return "tablet";
  if (/iphone|android|mobile/.test(u)) return "mobile";
  return "desktop";
};

// POST /api/tracking/pageview
// Public endpoint — anyone (including unauth viewers) can hit it. Body:
// { path, sessionId, referrer?, productId?, shopId?, pageType? }
export const trackPageView = async (req: Request, res: Response) => {
  try {
    const body = (req.body || {}) as {
      path?: string;
      sessionId?: string;
      referrer?: string;
      productId?: string;
      shopId?: string;
      pageType?: string;
    };

    if (!body.path || !body.sessionId) {
      return res.status(400).json({ success: false, message: "path and sessionId required" });
    }
    if (body.path.length > 2048 || body.sessionId.length > 128) {
      return res.status(400).json({ success: false, message: "Payload too large" });
    }

    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
      req.socket.remoteAddress ||
      "";
    const ua = String(req.headers["user-agent"] || "");
    const host = String(req.headers.host || "");
    const auth = req as IAuthRequest;
    const userId = auth.user?._id ? String(auth.user._id) : null;

    await PageView.create({
      shop: body.shopId && isValidObjectId(body.shopId) ? body.shopId : null,
      product: body.productId && isValidObjectId(body.productId) ? body.productId : null,
      user: userId,
      sessionId: body.sessionId.slice(0, 128),
      path: body.path.slice(0, 2048),
      pageType: ["product", "shop", "category", "home", "post"].includes(String(body.pageType))
        ? (body.pageType as "product" | "shop" | "category" | "home" | "post")
        : "other",
      referrer: (body.referrer || "").slice(0, 1024),
      source: classifySource(body.referrer || "", host),
      device: detectDevice(ua),
      ip,
    });

    res.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server Error";
    res.status(500).json({ success: false, message: msg });
  }
};

// GET /api/tracking/traffic — seller-scoped
export const getTraffic = async (req: IAuthRequest, res: Response) => {
  try {
    if (!req.user?._id) return res.status(401).json({ success: false, message: "Not authenticated" });
    const shopId = req.user._id.toString();
    const days = Math.min(Number(req.query.days) || 30, 365);
    const since = new Date(Date.now() - days * 86400000);

    const views = await PageView.find({ shop: shopId, createdAt: { $gte: since } })
      .select("path pageType source device sessionId createdAt referrer")
      .lean();

    // Aggregations
    const sessions = new Set(views.map((v) => v.sessionId));
    const sourceCount: Record<string, number> = {
      direct: 0,
      search: 0,
      social: 0,
      referral: 0,
      internal: 0,
    };
    const deviceCount: Record<string, number> = {
      mobile: 0,
      desktop: 0,
      tablet: 0,
      unknown: 0,
    };
    const pageMap = new Map<string, { path: string; views: number; sessions: Set<string> }>();
    const referrerMap = new Map<string, number>();

    for (const v of views) {
      sourceCount[v.source] = (sourceCount[v.source] || 0) + 1;
      deviceCount[v.device] = (deviceCount[v.device] || 0) + 1;

      const pageKey = v.path;
      if (!pageMap.has(pageKey)) {
        pageMap.set(pageKey, { path: pageKey, views: 0, sessions: new Set() });
      }
      const pageRow = pageMap.get(pageKey)!;
      pageRow.views += 1;
      pageRow.sessions.add(v.sessionId);

      if (v.referrer && v.source !== "direct" && v.source !== "internal") {
        try {
          const host = new URL(v.referrer).hostname;
          referrerMap.set(host, (referrerMap.get(host) || 0) + 1);
        } catch {
          /* skip malformed */
        }
      }
    }

    // Daily trend
    const daily: Array<{ date: string; views: number; sessions: number }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      d.setHours(0, 0, 0, 0);
      daily.push({ date: d.toISOString().slice(0, 10), views: 0, sessions: 0 });
    }
    const dayMap = new Map(daily.map((d) => [d.date, d]));
    const sessionByDay = new Map<string, Set<string>>();
    for (const v of views) {
      const key = v.createdAt.toISOString().slice(0, 10);
      const row = dayMap.get(key);
      if (!row) continue;
      row.views += 1;
      if (!sessionByDay.has(key)) sessionByDay.set(key, new Set());
      sessionByDay.get(key)!.add(v.sessionId);
    }
    for (const d of daily) {
      d.sessions = sessionByDay.get(d.date)?.size || 0;
    }

    const topPages = Array.from(pageMap.values())
      .map((r) => ({ path: r.path, views: r.views, uniqueSessions: r.sessions.size }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    const topReferrers = Array.from(referrerMap.entries())
      .map(([host, count]) => ({ host, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        rangeDays: days,
        totalViews: views.length,
        uniqueSessions: sessions.size,
        bySource: sourceCount,
        byDevice: deviceCount,
        topPages,
        topReferrers,
        daily,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server Error";
    res.status(500).json({ success: false, message: msg });
  }
};

// GET /api/tracking/conversion — seller funnel
export const getConversion = async (req: IAuthRequest, res: Response) => {
  try {
    if (!req.user?._id) return res.status(401).json({ success: false, message: "Not authenticated" });
    const shopId = req.user._id.toString();
    const days = Math.min(Number(req.query.days) || 30, 365);
    const since = new Date(Date.now() - days * 86400000);

    // Step 1: product views (sessions that viewed any product of this shop)
    const productViews = await PageView.find({
      shop: shopId,
      pageType: "product",
      createdAt: { $gte: since },
    })
      .select("sessionId user createdAt product")
      .lean();
    const viewSessions = new Set(productViews.map((v) => v.sessionId));
    const viewerUserIds = new Set(
      productViews.filter((v) => v.user).map((v) => String(v.user))
    );

    // Step 2: carts that contain this shop's products (proxy for "added to cart")
    const carts = await Cart.find({ "items.seller": shopId, updatedAt: { $gte: since } })
      .select("user")
      .lean();
    const cartUsers = new Set(carts.map((c) => String(c.user)));

    // Step 3: orders placed against this shop in range
    const orders = await Order.find({ "orderItems.seller": shopId, createdAt: { $gte: since } })
      .select("user totalPrice isPaid createdAt")
      .lean();
    const orderUsers = new Set(orders.map((o) => String(o.user)));
    const paidOrders = orders.filter((o) => (o as { isPaid?: boolean }).isPaid);
    const paidRevenue = paidOrders.reduce((s, o) => s + (Number(o.totalPrice) || 0), 0);

    // Funnel — when user identity exists, we use it; else fallback to session count.
    const viewersWhoCarted = Array.from(viewerUserIds).filter((u) => cartUsers.has(u)).length;
    const viewersWhoOrdered = Array.from(viewerUserIds).filter((u) => orderUsers.has(u)).length;
    const cartersWhoOrdered = Array.from(cartUsers).filter((u) => orderUsers.has(u)).length;

    res.json({
      success: true,
      data: {
        rangeDays: days,
        productViewSessions: viewSessions.size,
        productViewers: viewerUserIds.size,
        cartUsers: cartUsers.size,
        orderUsers: orderUsers.size,
        paidOrders: paidOrders.length,
        paidRevenue,
        viewToCartRate:
          viewerUserIds.size > 0 ? +((viewersWhoCarted / viewerUserIds.size) * 100).toFixed(1) : 0,
        viewToOrderRate:
          viewerUserIds.size > 0 ? +((viewersWhoOrdered / viewerUserIds.size) * 100).toFixed(1) : 0,
        cartToOrderRate:
          cartUsers.size > 0 ? +((cartersWhoOrdered / cartUsers.size) * 100).toFixed(1) : 0,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server Error";
    res.status(500).json({ success: false, message: msg });
  }
};
