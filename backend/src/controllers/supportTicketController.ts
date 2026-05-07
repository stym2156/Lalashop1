import { Request, Response } from "express";
import mongoose from "mongoose";
import SupportTicket from "../models/supportTicketModel";
import { IAuthRequest } from "../middlewares/authMiddleware";
import { recordAudit } from "../utils/auditLog";

interface ListQuery {
  page?: string;
  limit?: string;
  status?: string;
  category?: string;
  search?: string;
  user?: string;
}

const ALLOWED_CATEGORY = ["payments", "orders", "account", "products", "shop", "other"];
const ALLOWED_STATUS = ["open", "in_progress", "resolved", "closed"];
const ALLOWED_PRIORITY = ["low", "normal", "high", "urgent"];

const parsePagination = (query: ListQuery) => {
  const page = Math.max(parseInt(query.page || "1", 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit || "50", 10) || 50, 1), 200);
  return { page, limit, skip: (page - 1) * limit };
};

// ─── User: create / list mine ─────────────────────────────────────────

export const createTicket = async (req: IAuthRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    const { subject, category, description, attachments, priority } = req.body as {
      subject: string;
      category: string;
      description: string;
      attachments?: string[];
      priority?: string;
    };
    if (!subject || !description) {
      return res.status(400).json({ success: false, message: "subject and description required" });
    }
    const cat = ALLOWED_CATEGORY.includes(category) ? category : "other";
    const pri = ALLOWED_PRIORITY.includes(priority || "") ? priority : "normal";
    const ticket = await SupportTicket.create({
      subject: subject.trim(),
      category: cat,
      priority: pri,
      user: req.user._id,
      description,
      attachments: Array.isArray(attachments) ? attachments.filter((a) => typeof a === "string") : [],
    });
    res.status(201).json({ success: true, data: ticket });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const listMyTickets = async (req: IAuthRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    const tickets = await SupportTicket.find({ user: req.user._id })
      .sort({ updatedAt: -1 })
      .lean();
    res.status(200).json({ success: true, data: tickets });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Admin: list / get / reply / status ───────────────────────────────

export const adminListTickets = async (req: Request, res: Response) => {
  try {
    const { page, limit, skip } = parsePagination(req.query as ListQuery);
    const { status, category, search, user } = req.query as ListQuery;

    const filter: Record<string, unknown> = {};
    if (status && status !== "all") filter.status = status;
    if (category && category !== "all") filter.category = category;
    if (user && mongoose.isValidObjectId(user)) filter.user = new mongoose.Types.ObjectId(user);
    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [{ subject: new RegExp(safe, "i") }, { description: new RegExp(safe, "i") }];
    }

    const [items, total] = await Promise.all([
      SupportTicket.find(filter)
        .sort({ status: 1, updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "name email customId")
        .populate("assignedTo", "name email customId")
        .lean(),
      SupportTicket.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: items,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminGetTicket = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }
    const ticket = await SupportTicket.findById(id)
      .populate("user", "name email customId profileImage")
      .populate("assignedTo", "name email customId")
      .populate("replies.author", "name email customId")
      .lean();
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });
    res.status(200).json({ success: true, data: ticket });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminReplyTicket = async (req: IAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }
    const { message } = req.body as { message: string };
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "message required" });
    }
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    const ticket = await SupportTicket.findById(id);
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });

    ticket.replies.push({
      author: req.user._id as any,
      authorRole: "admin",
      message: message.trim(),
      createdAt: new Date(),
    } as any);

    if (ticket.status === "open") ticket.status = "in_progress";
    await ticket.save();

    await recordAudit(req, {
      action: "support.reply",
      targetType: "other",
      targetId: ticket._id as mongoose.Types.ObjectId,
    });

    res.status(200).json({ success: true, data: ticket });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminUpdateTicketStatus = async (req: IAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }
    const { status, priority, assignedTo } = req.body as {
      status?: string;
      priority?: string;
      assignedTo?: string | null;
    };

    const ticket = await SupportTicket.findById(id);
    if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });

    if (status) {
      if (!ALLOWED_STATUS.includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status" });
      }
      ticket.status = status as any;
      if (status === "resolved") ticket.resolvedAt = new Date();
      if (status === "closed") ticket.closedAt = new Date();
    }
    if (priority && ALLOWED_PRIORITY.includes(priority)) {
      ticket.priority = priority as any;
    }
    if (assignedTo === null) {
      ticket.assignedTo = undefined;
    } else if (assignedTo && mongoose.isValidObjectId(assignedTo)) {
      ticket.assignedTo = new mongoose.Types.ObjectId(assignedTo) as any;
    }

    await ticket.save();

    await recordAudit(req, {
      action: "support.update",
      targetType: "other",
      targetId: ticket._id as mongoose.Types.ObjectId,
      after: { status: ticket.status, priority: ticket.priority },
    });

    res.status(200).json({ success: true, data: ticket });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminTicketStats = async (_req: Request, res: Response) => {
  try {
    const [total, open, inProgress, resolved, closed] = await Promise.all([
      SupportTicket.countDocuments({}),
      SupportTicket.countDocuments({ status: "open" }),
      SupportTicket.countDocuments({ status: "in_progress" }),
      SupportTicket.countDocuments({ status: "resolved" }),
      SupportTicket.countDocuments({ status: "closed" }),
    ]);
    res.status(200).json({
      success: true,
      data: { total, open, inProgress, resolved, closed },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
