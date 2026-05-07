import mongoose, { Schema, Document } from "mongoose";

export type TicketCategory = "payments" | "orders" | "account" | "products" | "shop" | "other";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "normal" | "high" | "urgent";

export interface ITicketReply {
  _id?: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  authorRole: "user" | "admin";
  message: string;
  attachments?: string[];
  createdAt: Date;
}

export interface ISupportTicket extends Document {
  subject: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority;
  user: mongoose.Types.ObjectId;
  description: string;
  attachments?: string[];
  assignedTo?: mongoose.Types.ObjectId;
  replies: ITicketReply[];
  resolvedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ticketReplySchema = new Schema<ITicketReply>(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    authorRole: { type: String, enum: ["user", "admin"], required: true },
    message: { type: String, required: true },
    attachments: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    subject: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["payments", "orders", "account", "products", "shop", "other"],
      default: "other",
      index: true,
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    description: { type: String, required: true },
    attachments: { type: [String], default: [] },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    replies: { type: [ticketReplySchema], default: [] },
    resolvedAt: { type: Date },
    closedAt: { type: Date },
  },
  { timestamps: true }
);

supportTicketSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model<ISupportTicket>("SupportTicket", supportTicketSchema);
