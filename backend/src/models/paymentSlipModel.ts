import mongoose, { Document, Schema, Types } from "mongoose";

export type SlipStatus = "pending" | "verified" | "rejected";

// Payment proof uploaded by a customer for a manual-transfer order.
// Admin reviews each slip and either marks it verified (which marks the
// order as paid) or rejected (customer can re-upload with corrections).
export interface IPaymentSlip extends Document {
  order: Types.ObjectId;
  user: Types.ObjectId;
  paymentMethod: Types.ObjectId;
  slipImageUrl: string;
  transferAmount: number;
  transferRef: string;
  transferredAt?: Date;
  buyerNote: string;
  status: SlipStatus;
  rejectionReason: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSlipSchema = new Schema<IPaymentSlip>(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    paymentMethod: { type: Schema.Types.ObjectId, ref: "PaymentMethod", required: true },
    slipImageUrl: { type: String, required: true },
    transferAmount: { type: Number, required: true },
    transferRef: { type: String, default: "" },
    transferredAt: { type: Date },
    buyerNote: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
      index: true,
    },
    rejectionReason: { type: String, default: "" },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

paymentSlipSchema.index({ status: 1, createdAt: -1 });

const PaymentSlip = mongoose.model<IPaymentSlip>("PaymentSlip", paymentSlipSchema);
export default PaymentSlip;
