import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import KycSubmission from "../models/kycSubmissionModel";
import Notification from "../models/notificationModel";
import User from "../models/userModel";
import { IAuthRequest } from "../middlewares/authMiddleware";

interface SubmitKycBody {
  businessType?: string;
  shopInfo?: {
    shopName?: string;
    shopAccount?: string;
    bankName?: string;
    shopCategory?: string;
    shopEmail?: string;
    phoneNumber?: string;
    isEmailVerified?: boolean;
    isPhoneVerified?: boolean;
    entityName?: string;
  };
  identity?: {
    idType?: string;
    idNumber?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    birthDate?: string;
    expiryDate?: string;
    tinNumber?: string;
    businessLicenseUrl?: string;
    idDocumentUrl?: string;
    address?: {
      street?: string;
      apartment?: string;
      city?: string;
      state?: string;
      zip?: string;
      country?: string;
    };
  };
  warehouse?: { fullAddress?: string };
}

const guessMimeFromUrl = (url: string): string => {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() || "";
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "pdf":
      return "application/pdf";
    default:
      return "application/octet-stream";
  }
};

export const submitKyc = async (req: IAuthRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const body = (req.body || {}) as SubmitKycBody;

    if (!body.businessType) {
      return res.status(400).json({ success: false, message: "businessType is required" });
    }
    if (!body.shopInfo?.shopName) {
      return res.status(400).json({ success: false, message: "shopInfo.shopName is required" });
    }

    const existingPending = await KycSubmission.findOne({
      user: req.user._id,
      status: "pending",
    });
    if (existingPending) {
      return res.status(409).json({
        success: false,
        message: "You already have a pending KYC submission.",
        data: existingPending,
      });
    }

    const businessLicenseUrl = body.identity?.businessLicenseUrl || "";
    const idDocumentUrl = body.identity?.idDocumentUrl || "";

    const documents = [
      ...(businessLicenseUrl
        ? [{ url: businessLicenseUrl, label: "Business License", mimeType: guessMimeFromUrl(businessLicenseUrl) }]
        : []),
      ...(idDocumentUrl
        ? [{
            url: idDocumentUrl,
            label: body.identity?.idType === "passport" ? "Passport" : "ID Card",
            mimeType: guessMimeFromUrl(idDocumentUrl),
          }]
        : []),
    ];

    const submission = await KycSubmission.create({
      user: req.user._id,
      status: "pending",
      businessType: body.businessType,
      shopInfo: {
        shopName: body.shopInfo.shopName,
        shopAccount: body.shopInfo.shopAccount || "",
        bankName: body.shopInfo.bankName || "",
        shopCategory: body.shopInfo.shopCategory || "",
        shopEmail: body.shopInfo.shopEmail || "",
        phoneNumber: body.shopInfo.phoneNumber || "",
        isEmailVerified: Boolean(body.shopInfo.isEmailVerified),
        isPhoneVerified: Boolean(body.shopInfo.isPhoneVerified),
        entityName: body.shopInfo.entityName || "",
      },
      identity: {
        idType: body.identity?.idType || "passport",
        idNumber: body.identity?.idNumber || "",
        firstName: body.identity?.firstName || "",
        middleName: body.identity?.middleName || "",
        lastName: body.identity?.lastName || "",
        birthDate: body.identity?.birthDate || "",
        expiryDate: body.identity?.expiryDate || "",
        tinNumber: body.identity?.tinNumber || "",
        businessLicenseUrl,
        idDocumentUrl,
        documents,
        address: {
          street: body.identity?.address?.street || "",
          apartment: body.identity?.address?.apartment || "",
          city: body.identity?.address?.city || "",
          state: body.identity?.address?.state || "",
          zip: body.identity?.address?.zip || "",
          country: body.identity?.address?.country || "",
        },
      },
      warehouse: { fullAddress: body.warehouse?.fullAddress || "" },
      submittedAt: new Date(),
    });

    res.status(201).json({ success: true, data: submission });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyKyc = async (req: IAuthRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    const latest = await KycSubmission.findOne({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json({ success: true, data: latest || null });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminListKyc = async (req: Request, res: Response) => {
  try {
    const { status, search, user } = req.query as {
      status?: string;
      search?: string;
      user?: string;
    };
    const filter: Record<string, unknown> = {};
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      filter.status = status;
    }
    if (user) {
      filter.user = user;
    }
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [
        { "shopInfo.shopName": regex },
        { "shopInfo.shopEmail": regex },
        { "identity.firstName": regex },
        { "identity.lastName": regex },
        { "identity.idNumber": regex },
      ];
    }

    const submissions = await KycSubmission.find(filter)
      .sort({ createdAt: -1 })
      .populate("user", "name username email customId phone")
      .lean();

    res.status(200).json({ success: true, data: submissions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminGetKyc = async (req: Request, res: Response) => {
  try {
    const submission = await KycSubmission.findById(req.params.id)
      .populate("user", "name username email customId phone profileImage")
      .populate("reviewedBy", "name email")
      .lean();
    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }
    res.status(200).json({ success: true, data: submission });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminReviewKyc = async (req: IAuthRequest, res: Response) => {
  try {
    const { decision, note } = req.body as {
      decision?: "approved" | "rejected";
      note?: string;
    };
    if (decision !== "approved" && decision !== "rejected") {
      return res
        .status(400)
        .json({ success: false, message: "decision must be 'approved' or 'rejected'" });
    }

    const submission = await KycSubmission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }
    if (submission.status !== "pending") {
      return res
        .status(409)
        .json({ success: false, message: `Already ${submission.status}` });
    }

    submission.status = decision;
    submission.reviewedAt = new Date();
    submission.reviewNote = (note || "").trim();
    if (req.user?._id) {
      submission.reviewedBy = req.user._id;
    }
    await submission.save();

    const isApproved = decision === "approved";
    const sellerDashboardUrl =
      process.env.SELLER_DASHBOARD_URL || "http://localhost:3002";

    // For approved KYC: generate a fresh seller password (separate from the
    // user's customer password). Store hashed copy on the User; surface
    // plaintext one-time inside the notification body + metadata so the user
    // can copy it from the in-app inbox.
    let generatedSellerPassword: string | null = null;
    let sellerEmail: string | null = null;
    if (isApproved) {
      const owner = await User.findById(submission.user);
      if (owner) {
        generatedSellerPassword = crypto.randomBytes(6).toString("base64").slice(0, 10);
        const salt = await bcrypt.genSalt(10);
        owner.sellerPassword = await bcrypt.hash(generatedSellerPassword, salt);
        owner.isSeller = true;
        owner.seller_type = submission.businessType;
        await owner.save();
        sellerEmail = owner.email;
      }
    }

    const approvedBody = generatedSellerPassword && sellerEmail
      ? [
          "Congratulations! Your shop has been approved and the Seller Center is now open.",
          "",
          "Use the following credentials to sign in to your seller dashboard:",
          "",
          `Email:    ${sellerEmail}`,
          `Password: ${generatedSellerPassword}`,
          "",
          `Seller dashboard:  ${sellerDashboardUrl}/login`,
          "",
          "Notes:",
          "• This password is separate from the password you use on the customer site — your customer login is unchanged.",
          "• Save this password now. Once you read this notification, the system will not show the password again.",
          "• You can change your seller password from the Seller Center → Settings after first login.",
        ].join("\n")
      : "Congratulations! Your shop is now active.";

    const rejectedBody =
      submission.reviewNote ||
      "Your shop application was rejected. Please review the notes and resubmit your KYC documents.";

    await Notification.create({
      user: submission.user,
      type: isApproved ? "kyc_approved" : "kyc_rejected",
      title: isApproved
        ? "Shop application approved — Seller Center is now open"
        : "Shop application rejected",
      body: isApproved ? approvedBody : rejectedBody,
      link: isApproved ? `${sellerDashboardUrl}/login` : "/me/opensho/openshop",
      metadata: {
        kycId: submission._id.toString(),
        sellerDashboardUrl,
        ...(isApproved && sellerEmail && generatedSellerPassword
          ? {
              credentials: {
                email: sellerEmail,
                password: generatedSellerPassword,
                loginUrl: `${sellerDashboardUrl}/login`,
              },
            }
          : {}),
      },
    });

    res.status(200).json({ success: true, data: submission });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
