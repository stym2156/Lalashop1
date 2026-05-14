import mongoose, { Schema, Document } from "mongoose";

// Hero banner shown on the customer homepage carousel. Admins manage these
// via /api/admin/banners; the public site reads /api/banners (active only).
export interface IHeroBanner extends Document {
  imageUrl: string;
  title: string;
  subtitle: string;
  linkUrl: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const heroBannerSchema = new Schema<IHeroBanner>(
  {
    imageUrl: { type: String, required: true, trim: true },
    title: { type: String, default: "", trim: true },
    subtitle: { type: String, default: "", trim: true },
    // Optional CTA target. Empty string = no link, the slide is decorative.
    linkUrl: { type: String, default: "", trim: true },
    displayOrder: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

heroBannerSchema.index({ isActive: 1, displayOrder: 1 });

export default mongoose.model<IHeroBanner>("HeroBanner", heroBannerSchema);
