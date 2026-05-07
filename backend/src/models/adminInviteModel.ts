import mongoose, { Schema, Document } from "mongoose";

export type InviteRole = "super" | "finance" | "support" | "content";
export type InviteStatus = "pending" | "accepted" | "revoked" | "expired";

export interface IAdminInvite extends Document {
  email: string;
  name?: string;
  role: InviteRole;
  invitedBy: mongoose.Types.ObjectId;
  token: string;
  message?: string;
  status: InviteStatus;
  expiresAt: Date;
  acceptedAt?: Date;
  acceptedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const adminInviteSchema = new Schema<IAdminInvite>(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    name: { type: String, default: "" },
    role: {
      type: String,
      enum: ["super", "finance", "support", "content"],
      default: "support",
    },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true, unique: true, index: true },
    message: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "accepted", "revoked", "expired"],
      default: "pending",
      index: true,
    },
    expiresAt: { type: Date, required: true },
    acceptedAt: { type: Date },
    acceptedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model<IAdminInvite>("AdminInvite", adminInviteSchema);
