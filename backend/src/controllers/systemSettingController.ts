import { Request, Response } from "express";
import SystemSetting, { SettingType } from "../models/systemSettingModel";
import { IAuthRequest } from "../middlewares/authMiddleware";
import { recordAudit } from "../utils/auditLog";

const DEFAULT_SETTINGS: Array<{
  key: string;
  value: string;
  type: SettingType;
  group: string;
  description: string;
  isPublic: boolean;
}> = [
  { key: "site_name", value: "LalaShop", type: "string", group: "general", description: "Public title for the storefront", isPublic: true },
  { key: "support_email", value: "support@lalashop.com", type: "string", group: "general", description: "Support contact email", isPublic: true },
  { key: "default_currency", value: "THB", type: "string", group: "localization", description: "Default currency for transactions", isPublic: true },
  { key: "default_locale", value: "th-TH", type: "string", group: "localization", description: "Default locale", isPublic: true },
  { key: "maintenance_mode", value: "false", type: "boolean", group: "system", description: "Toggle public access to storefront", isPublic: true },
  { key: "withdraw_min_amount", value: "100", type: "number", group: "finance", description: "Minimum withdraw amount", isPublic: false },
  { key: "withdraw_fee_percent", value: "0", type: "number", group: "finance", description: "Withdraw fee % charged from user", isPublic: false },
  { key: "kyc_required_for_seller", value: "true", type: "boolean", group: "kyc", description: "Require KYC before opening shop", isPublic: false },
  { key: "max_product_images", value: "8", type: "number", group: "products", description: "Max images per product", isPublic: false },
  { key: "post_default_visibility", value: "public", type: "string", group: "social", description: "Default visibility for new posts", isPublic: false },
];

export const adminListSettings = async (_req: Request, res: Response) => {
  try {
    // Seed defaults on first call (only inserts missing keys)
    const existing = await SystemSetting.find({}).select("key").lean();
    const existingKeys = new Set(existing.map((s) => s.key));
    const toInsert = DEFAULT_SETTINGS.filter((d) => !existingKeys.has(d.key));
    if (toInsert.length > 0) {
      await SystemSetting.insertMany(toInsert, { ordered: false });
    }

    const settings = await SystemSetting.find({}).sort({ group: 1, key: 1 }).lean();
    res.status(200).json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminUpdateSetting = async (req: IAuthRequest, res: Response) => {
  try {
    const { key } = req.params;
    const { value } = req.body as { value: string };

    if (!key) return res.status(400).json({ success: false, message: "key required" });
    if (typeof value !== "string") {
      return res.status(400).json({ success: false, message: "value must be string" });
    }

    const setting = await SystemSetting.findOne({ key: key.toLowerCase() });
    if (!setting) {
      return res.status(404).json({ success: false, message: "Setting not found" });
    }

    if (setting.type === "number" && Number.isNaN(Number(value))) {
      return res.status(400).json({ success: false, message: "value must be a number" });
    }
    if (setting.type === "boolean" && !["true", "false"].includes(value.toLowerCase())) {
      return res.status(400).json({ success: false, message: "value must be true or false" });
    }
    if (setting.type === "json") {
      try {
        JSON.parse(value);
      } catch {
        return res.status(400).json({ success: false, message: "value must be valid JSON" });
      }
    }

    const before = { value: setting.value };
    setting.value = value;
    await setting.save();

    await recordAudit(req, {
      action: "setting.update",
      targetType: "setting",
      metadata: { key: setting.key },
      before,
      after: { value: setting.value },
    });

    res.status(200).json({ success: true, data: setting });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Public endpoint — only returns settings flagged isPublic
export const listPublicSettings = async (_req: Request, res: Response) => {
  try {
    const settings = await SystemSetting.find({ isPublic: true })
      .select("key value type group")
      .lean();
    res.status(200).json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
