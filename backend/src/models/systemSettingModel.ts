import mongoose, { Schema, Document } from "mongoose";

export type SettingType = "string" | "number" | "boolean" | "json";

export interface ISystemSetting extends Document {
  key: string;
  value: string;
  type: SettingType;
  group: string;
  description?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const systemSettingSchema = new Schema<ISystemSetting>(
  {
    key: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    value: { type: String, default: "" },
    type: { type: String, enum: ["string", "number", "boolean", "json"], default: "string" },
    group: { type: String, default: "general", index: true },
    description: { type: String, default: "" },
    isPublic: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<ISystemSetting>("SystemSetting", systemSettingSchema);
