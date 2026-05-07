import { Request } from "express";
import mongoose from "mongoose";
import AdminAuditLog, { AuditTargetType } from "../models/adminAuditLogModel";
import { IAuthRequest } from "../middlewares/authMiddleware";

const extractIp = (req: Request): string => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return (req.ip || req.socket?.remoteAddress || "").replace(/^::ffff:/, "");
};

interface AuditOptions {
  action: string;
  targetType?: AuditTargetType;
  targetId?: mongoose.Types.ObjectId | string | null;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export const recordAudit = async (req: IAuthRequest, opts: AuditOptions): Promise<void> => {
  try {
    if (!req.user?._id) return;
    const targetId = opts.targetId
      ? typeof opts.targetId === "string"
        ? mongoose.isValidObjectId(opts.targetId)
          ? new mongoose.Types.ObjectId(opts.targetId)
          : undefined
        : opts.targetId
      : undefined;

    await AdminAuditLog.create({
      admin: req.user._id,
      action: opts.action,
      targetType: opts.targetType,
      targetId,
      before: opts.before,
      after: opts.after,
      metadata: opts.metadata,
      ip: extractIp(req),
      userAgent: req.headers["user-agent"]?.toString(),
    });
  } catch (err) {
    // Audit log must never block the actual operation
    console.error("[audit] failed to record:", err);
  }
};
