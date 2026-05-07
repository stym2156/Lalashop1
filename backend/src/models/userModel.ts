import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  name: string;
  username: string;
  email: string;
  phone: string;
  password?: string;
  isAdmin: boolean;
  profileImage?: string;
  bio?: string;
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
  twoFactorEnabled: boolean;
  twoFactorType: 'email' | 'authenticator' | 'none';
  twoFactorSecret?: string;
  isSeller: boolean;
  seller_type?: string;
  adminRole?: "super" | "finance" | "support" | "content";
  balance: number;
  otp?: string;
  otpExpires?: Date;
  customId: string;
  lastUsernameChange?: Date;
  withdrawPin?: string;
  lastKnownIp?: string;
}

const userSchema: Schema = new Schema(
  {
    name: { type: String, required: false },
    username: { type: String, unique: true, sparse: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: false },
    password: { type: String, required: false },
    isAdmin: { type: Boolean, default: false },
    isSeller: { type: Boolean, default: false },
    seller_type: { type: String },
    adminRole: { type: String, enum: ["super", "finance", "support", "content"] },
    balance: { type: Number, default: 0 },
    profileImage: { type: String, default: "" },
    bio: { type: String, default: "" },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorType: { type: String, enum: ['email', 'authenticator', 'none'], default: 'none' },
    twoFactorSecret: { type: String },
    otp: { type: String },
    otpExpires: { type: Date },
    customId: { type: String, unique: true },
    lastUsernameChange: { type: Date },
    withdrawPin: { type: String },
    googleId: { type: String },
    facebookId: { type: String },
    lastKnownIp: { type: String },
  },
  { timestamps: true }
);

const generateCustomId = () => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    let res = "LS"; // Lalashop prefix
    for (let i = 0; i < 4; i++) res += numbers.charAt(Math.floor(Math.random() * numbers.length));
    res += letters.charAt(Math.floor(Math.random() * letters.length));
    return res;
};

userSchema.pre("save", async function (next) {
  if (this.isNew && !this.customId) {
    this.customId = generateCustomId();
  }

  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password as string, salt);
  next();
});

export default mongoose.model<IUser>("User", userSchema);