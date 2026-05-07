import mongoose, { Schema, Document } from "mongoose";

export type AuditTargetType =
  | "user"
  | "shop"
  | "product"
  | "order"
  | "withdrawal"
  | "kyc"
  | "report"
  | "category"
  | "notification"
  | "setting"
  | "admin"
  | "invite"
  | "other";

export interface IAdminAuditLog extends Document {
  admin: mongoose.Types.ObjectId;
  action: string;
  targetType?: AuditTargetType;
  targetId?: mongoose.Types.ObjectId;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const adminAuditLogSchema = new Schema<IAdminAuditLog>(
  {
    admin: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    action: { type: String, required: true, index: true },
    targetType: {
      type: String,
      enum: [
        "user", "shop", "product", "order", "withdrawal", "kyc", "report",
        "category", "notification", "setting", "admin", "invite", "other",
      ],
      index: true,
    },
    targetId: { type: Schema.Types.ObjectId, index: true },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

adminAuditLogSchema.index({ createdAt: -1 });

export default mongoose.model<IAdminAuditLog>("AdminAuditLog", adminAuditLogSchema);
