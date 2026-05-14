import { Request, Response } from "express";
import HeroBanner from "../models/heroBannerModel";

interface BannerInput {
  imageUrl?: string;
  title?: string;
  subtitle?: string;
  linkUrl?: string;
  displayOrder?: number;
  isActive?: boolean;
}

const sanitize = (raw: BannerInput) => {
  const out: Partial<BannerInput> = {};
  if (typeof raw.imageUrl === "string") out.imageUrl = raw.imageUrl.trim();
  if (typeof raw.title === "string") out.title = raw.title.trim();
  if (typeof raw.subtitle === "string") out.subtitle = raw.subtitle.trim();
  if (typeof raw.linkUrl === "string") out.linkUrl = raw.linkUrl.trim();
  if (typeof raw.displayOrder === "number" && Number.isFinite(raw.displayOrder)) {
    out.displayOrder = Math.max(0, Math.floor(raw.displayOrder));
  }
  if (typeof raw.isActive === "boolean") out.isActive = raw.isActive;
  return out;
};

// Public — homepage carousel reads this. Active banners only, ordered.
export const listPublicBanners = async (_req: Request, res: Response) => {
  try {
    const banners = await HeroBanner.find({ isActive: true })
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();
    res.json({ success: true, data: banners });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin — list all (including inactive) for the management table.
export const adminListBanners = async (_req: Request, res: Response) => {
  try {
    const banners = await HeroBanner.find()
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();
    res.json({ success: true, data: banners });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const adminCreateBanner = async (req: Request, res: Response) => {
  try {
    const body = sanitize(req.body || {});
    if (!body.imageUrl) {
      return res
        .status(400)
        .json({ success: false, message: "imageUrl is required" });
    }
    const banner = await HeroBanner.create({
      imageUrl: body.imageUrl,
      title: body.title ?? "",
      subtitle: body.subtitle ?? "",
      linkUrl: body.linkUrl ?? "",
      displayOrder: body.displayOrder ?? 0,
      isActive: body.isActive ?? true,
    });
    res.status(201).json({ success: true, data: banner });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const adminUpdateBanner = async (req: Request, res: Response) => {
  try {
    const updates = sanitize(req.body || {});
    if (Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No fields to update" });
    }
    const banner = await HeroBanner.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }
    res.json({ success: true, data: banner });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const adminDeleteBanner = async (req: Request, res: Response) => {
  try {
    const banner = await HeroBanner.findByIdAndDelete(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }
    res.json({ success: true, message: "Banner deleted" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
