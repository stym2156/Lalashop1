import { Request, Response } from "express";
import mongoose from "mongoose";
import AdminAuditLog from "../models/adminAuditLogModel";

interface ListQuery {
  page?: string;
  limit?: string;
  admin?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

const parsePagination = (query: ListQuery) => {
  const page = Math.max(parseInt(query.page || "1", 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit || "100", 10) || 100, 1), 500);
  return { page, limit, skip: (page - 1) * limit };
};

export const adminListAuditLogs = async (req: Request, res: Response) => {
  try {
    const { page, limit, skip } = parsePagination(req.query as ListQuery);
    const { admin, action, targetType, targetId, startDate, endDate, search } = req.query as ListQuery;

    const filter: Record<string, unknown> = {};
    if (admin && mongoose.isValidObjectId(admin)) {
      filter.admin = new mongoose.Types.ObjectId(admin);
    }
    if (action && action !== "all") filter.action = action;
    if (targetType && targetType !== "all") filter.targetType = targetType;
    if (targetId && mongoose.isValidObjectId(targetId)) {
      filter.targetId = new mongoose.Types.ObjectId(targetId);
    }
    if (startDate || endDate) {
      const range: Record<string, Date> = {};
      if (startDate) range.$gte = new Date(startDate);
      if (endDate) range.$lte = new Date(endDate);
      filter.createdAt = range;
    }
    if (search) {
      const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.action = new RegExp(safe, "i");
    }

    const [items, total] = await Promise.all([
      AdminAuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("admin", "name email customId")
        .lean(),
      AdminAuditLog.countDocuments(filter),
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

export const adminAuditStats = async (_req: Request, res: Response) => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [total, last7d, byAction, byAdmin] = await Promise.all([
      AdminAuditLog.countDocuments({}),
      AdminAuditLog.countDocuments({ createdAt: { $gte: since } }),
      AdminAuditLog.aggregate([
        { $group: { _id: "$action", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      AdminAuditLog.aggregate([
        { $group: { _id: "$admin", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "admin",
          },
        },
        { $unwind: { path: "$admin", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            count: 1,
            "admin.name": 1,
            "admin.email": 1,
            "admin.customId": 1,
          },
        },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: { total, last7d, byAction, byAdmin },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
