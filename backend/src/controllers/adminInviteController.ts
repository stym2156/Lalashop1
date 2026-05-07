import { Request, Response } from "express";
import crypto from "crypto";
import mongoose from "mongoose";
import AdminInvite, { InviteRole } from "../models/adminInviteModel";
import User from "../models/userModel";
import { IAuthRequest } from "../middlewares/authMiddleware";
import { recordAudit } from "../utils/auditLog";

const ALLOWED_ROLES: InviteRole[] = ["super", "finance", "support", "content"];

const generateToken = (): string => crypto.randomBytes(24).toString("hex");

export const adminListInvites = async (req: Request, res: Response) => {
  try {
    const { status } = req.query as { status?: string };

    // Auto-expire stale invites
    const now = new Date();
    await AdminInvite.updateMany(
      { status: "pending", expiresAt: { $lt: now } },
      { $set: { status: "expired" } }
    );

    const filter: Record<string, unknown> = {};
    if (status && status !== "all") filter.status = status;

    const items = await AdminInvite.find(filter)
      .sort({ createdAt: -1 })
      .populate("invitedBy", "name email customId")
      .populate("acceptedBy", "name email customId")
      .lean();

    res.status(200).json({ success: true, data: items });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminCreateInvite = async (req: IAuthRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const { email, name, role, message, expiryDays } = req.body as {
      email: string;
      name?: string;
      role: InviteRole;
      message?: string;
      expiryDays?: number;
    };

    if (!email || typeof email !== "string") {
      return res.status(400).json({ success: false, message: "email required" });
    }
    const cleaned = email.trim().toLowerCase();
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(cleaned)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }
    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const existing = await AdminInvite.findOne({ email: cleaned, status: "pending" });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "An active invitation already exists for this email",
      });
    }

    const days = Math.min(Math.max(typeof expiryDays === "number" ? expiryDays : 7, 1), 30);
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const token = generateToken();

    const invite = await AdminInvite.create({
      email: cleaned,
      name: name?.trim() ?? "",
      role,
      invitedBy: req.user._id,
      message: message?.trim() ?? "",
      token,
      expiresAt,
    });

    await recordAudit(req, {
      action: "admin.invite.create",
      targetType: "invite",
      targetId: invite._id as mongoose.Types.ObjectId,
      after: { email: cleaned, role, expiresAt },
    });

    res.status(201).json({ success: true, data: invite });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminRevokeInvite = async (req: IAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }
    const invite = await AdminInvite.findById(id);
    if (!invite) return res.status(404).json({ success: false, message: "Invite not found" });
    if (invite.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot revoke ${invite.status} invite`,
      });
    }
    invite.status = "revoked";
    await invite.save();

    await recordAudit(req, {
      action: "admin.invite.revoke",
      targetType: "invite",
      targetId: invite._id as mongoose.Types.ObjectId,
      metadata: { email: invite.email },
    });

    res.status(200).json({ success: true, data: invite });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminResendInvite = async (req: IAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }
    const invite = await AdminInvite.findById(id);
    if (!invite) return res.status(404).json({ success: false, message: "Invite not found" });
    if (invite.status === "accepted") {
      return res.status(400).json({ success: false, message: "Invite already accepted" });
    }

    invite.status = "pending";
    invite.token = generateToken();
    invite.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await invite.save();

    await recordAudit(req, {
      action: "admin.invite.resend",
      targetType: "invite",
      targetId: invite._id as mongoose.Types.ObjectId,
    });

    res.status(200).json({ success: true, data: invite });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Public endpoint — invitee accepts via token
export const acceptInvite = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password, name } = req.body as { password: string; name?: string };

    if (!token) return res.status(400).json({ success: false, message: "Token required" });
    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password is required (min 6 characters)",
      });
    }

    const invite = await AdminInvite.findOne({ token });
    if (!invite) return res.status(404).json({ success: false, message: "Invite not found" });

    if (invite.status !== "pending") {
      return res.status(400).json({ success: false, message: `Invite is ${invite.status}` });
    }
    if (invite.expiresAt < new Date()) {
      invite.status = "expired";
      await invite.save();
      return res.status(400).json({ success: false, message: "Invite has expired" });
    }

    let user = await User.findOne({ email: invite.email });
    if (user) {
      user.isAdmin = true;
      user.adminRole = invite.role;
      if (name) user.name = name;
      user.password = password; // will be hashed by pre-save
    } else {
      user = new User({
        email: invite.email,
        name: name || invite.name || invite.email.split("@")[0],
        password, // will be hashed by pre-save
        isAdmin: true,
        adminRole: invite.role,
      });
    }
    await user.save();

    invite.status = "accepted";
    invite.acceptedAt = new Date();
    invite.acceptedBy = user._id as mongoose.Types.ObjectId;
    await invite.save();

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        email: user.email,
        name: user.name,
        adminRole: user.adminRole,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
