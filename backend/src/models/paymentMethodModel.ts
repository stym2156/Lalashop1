import mongoose, { Document, Schema } from "mongoose";

export type PaymentMethodKind = "bank" | "promptpay" | "static_qr";

// Platform-level payment methods that the admin manages. Customers see the
// active ones at checkout. Banks are shown as account-number cards;
// promptpay rows generate a dynamic QR per order; static_qr rows display
// a fixed QR image (e.g. wallet apps that don't support EMVCo).
export interface IPaymentMethod extends Document {
  kind: PaymentMethodKind;
  label: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  promptpayId?: string;
  qrImageUrl?: string;
  notes?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const paymentMethodSchema = new Schema<IPaymentMethod>(
  {
    kind: {
      type: String,
      enum: ["bank", "promptpay", "static_qr"],
      required: true,
    },
    label: { type: String, required: true, trim: true },
    bankName: { type: String, default: "" },
    accountNumber: { type: String, default: "" },
    accountName: { type: String, default: "" },
    promptpayId: { type: String, default: "" },
    qrImageUrl: { type: String, default: "" },
    notes: { type: String, default: "" },
    isActive: { type: Boolean, default: true, index: true },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

paymentMethodSchema.index({ isActive: 1, displayOrder: 1 });

const PaymentMethod = mongoose.model<IPaymentMethod>("PaymentMethod", paymentMethodSchema);
export default PaymentMethod;
