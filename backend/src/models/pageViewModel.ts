import mongoose, { Document, Schema, Types } from "mongoose";

// Lightweight page-view event used by the storefront tracker. We store one
// document per view so we can aggregate by day/source/page on demand. Indexes
// scoped by shop for efficient seller-side queries.

export type PageViewSource = "direct" | "search" | "social" | "referral" | "internal";

export interface IPageView extends Document {
  shop?: Types.ObjectId | null; // owning shop when the page is product/profile
  product?: Types.ObjectId | null;
  user?: Types.ObjectId | null; // logged-in viewer (optional)
  sessionId: string;
  path: string;
  pageType: "product" | "shop" | "category" | "home" | "post" | "other";
  referrer: string;
  source: PageViewSource;
  device: "mobile" | "desktop" | "tablet" | "unknown";
  country?: string;
  ip: string;
  createdAt: Date;
}

const pageViewSchema = new Schema<IPageView>(
  {
    shop: { type: Schema.Types.ObjectId, ref: "User", index: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", index: true },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    sessionId: { type: String, required: true, index: true },
    path: { type: String, required: true },
    pageType: {
      type: String,
      enum: ["product", "shop", "category", "home", "post", "other"],
      default: "other",
    },
    referrer: { type: String, default: "" },
    source: {
      type: String,
      enum: ["direct", "search", "social", "referral", "internal"],
      default: "direct",
    },
    device: {
      type: String,
      enum: ["mobile", "desktop", "tablet", "unknown"],
      default: "unknown",
    },
    country: { type: String, default: "" },
    ip: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

// Compound for fast per-shop, per-day queries
pageViewSchema.index({ shop: 1, createdAt: -1 });

const PageView = mongoose.model<IPageView>("PageView", pageViewSchema);
export default PageView;
