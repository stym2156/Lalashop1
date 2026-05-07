import { Response } from "express";
import { Types } from "mongoose";
import Conversation from "../models/conversationModel";
import Message from "../models/messageModel";
import Order from "../models/orderModel";
import { IAuthRequest } from "../middlewares/authMiddleware";

const requireUser = (req: IAuthRequest, res: Response): string | null => {
  const id = req.user?._id?.toString();
  if (!id) {
    res.status(401).json({ success: false, message: "Not authenticated" });
    return null;
  }
  return id;
};

// GET /api/analytics/chat
// Computes chat metrics over the requested range from existing Conversation +
// Message data. No tracking infrastructure needed — everything is derived.
export const getChatAnalytics = async (req: IAuthRequest, res: Response) => {
  try {
    const me = requireUser(req, res);
    if (!me) return;

    const days = Math.min(Number(req.query.days) || 30, 365);
    const since = new Date(Date.now() - days * 86400000);

    const conversations = await Conversation.find({ participants: me })
      .select("_id participants createdAt")
      .lean();

    const convIds = conversations.map((c) => c._id);
    const messages = await Message.find({
      conversation: { $in: convIds },
      createdAt: { $gte: since },
    })
      .select("conversation sender body createdAt readBy")
      .lean();

    // Per-conversation: pair incoming buyer message → first seller reply.
    // The diff is the response time. We only count pairs where the seller
    // replied AFTER a buyer message (ignore seller-initiated threads).
    const responseTimesMs: number[] = [];
    let myMessageCount = 0;
    let inboundMessageCount = 0;
    let unreadInbound = 0;

    const byConv = new Map<string, typeof messages>();
    for (const m of messages) {
      const k = String(m.conversation);
      if (!byConv.has(k)) byConv.set(k, []);
      byConv.get(k)!.push(m);
    }
    for (const list of byConv.values()) {
      list.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      let pendingBuyerAt: Date | null = null;
      for (const m of list) {
        const senderId = String(m.sender);
        if (senderId === me) {
          myMessageCount += 1;
          if (pendingBuyerAt) {
            const diff = m.createdAt.getTime() - pendingBuyerAt.getTime();
            if (diff > 0) responseTimesMs.push(diff);
            pendingBuyerAt = null;
          }
        } else {
          inboundMessageCount += 1;
          if (!pendingBuyerAt) pendingBuyerAt = m.createdAt;
          if (!(m.readBy || []).some((r) => String(r) === me)) {
            unreadInbound += 1;
          }
        }
      }
    }

    // Daily volume — how many messages/day in range
    const days30: Array<{ date: string; inbound: number; outbound: number }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString().slice(0, 10);
      days30.push({ date: key, inbound: 0, outbound: 0 });
    }
    const dayMap = new Map(days30.map((d) => [d.date, d]));
    for (const m of messages) {
      const key = m.createdAt.toISOString().slice(0, 10);
      const row = dayMap.get(key);
      if (!row) continue;
      if (String(m.sender) === me) row.outbound += 1;
      else row.inbound += 1;
    }

    const avgResponseSec = responseTimesMs.length
      ? Math.round(responseTimesMs.reduce((s, n) => s + n, 0) / responseTimesMs.length / 1000)
      : 0;

    // p50/p95 response times
    const sortedRT = [...responseTimesMs].sort((a, b) => a - b);
    const pct = (p: number): number => {
      if (sortedRT.length === 0) return 0;
      const idx = Math.min(sortedRT.length - 1, Math.floor((sortedRT.length * p) / 100));
      return Math.round(sortedRT[idx] / 1000);
    };

    // Conversion: how many conversations led to an order from that buyer
    // within 7 days of first message?
    const buyersInRange = new Set<string>();
    for (const c of conversations) {
      const others = c.participants.filter((p) => String(p) !== me);
      if (others.length) buyersInRange.add(String(others[0]));
    }
    const orders = await Order.find({
      "orderItems.seller": me,
      user: { $in: Array.from(buyersInRange) },
      createdAt: { $gte: since },
    })
      .select("user createdAt")
      .lean();
    const buyersWhoOrdered = new Set(orders.map((o) => String(o.user)));
    const chatConversionRate =
      buyersInRange.size > 0
        ? (buyersWhoOrdered.size / buyersInRange.size) * 100
        : 0;

    res.json({
      success: true,
      data: {
        rangeDays: days,
        totalConversations: conversations.length,
        totalMessages: messages.length,
        inboundMessages: inboundMessageCount,
        outboundMessages: myMessageCount,
        unreadInbound,
        avgResponseSec,
        p50ResponseSec: pct(50),
        p95ResponseSec: pct(95),
        responseSampleSize: responseTimesMs.length,
        dailyVolume: days30,
        buyersWhoChat: buyersInRange.size,
        buyersWhoOrdered: buyersWhoOrdered.size,
        chatConversionRate: Number(chatConversionRate.toFixed(1)),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server Error";
    res.status(500).json({ success: false, message: msg });
  }
};
