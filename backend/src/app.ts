import dotenv from "dotenv";
dotenv.config();
import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";

import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import productRoutes from "./routes/productRoutes";
import orderRoutes from "./routes/orderRoutes";
import bankRoutes from "./routes/bankRoutes";
import addressRoutes from "./routes/addressRoutes";
import cartRoutes from "./routes/cartRoutes";
import postRoutes from "./routes/postRoutes";
import adminRoutes from "./routes/adminRoutes";
import kycRoutes from "./routes/kycRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import withdrawRoutes from "./routes/withdrawRoutes";
import creatorProductRoutes from "./routes/creatorProductRoutes";
import affiliateRoutes from "./routes/affiliateRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";
import reportRoutes from "./routes/reportRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import supportRoutes from "./routes/supportRoutes";
import inviteRoutes from "./routes/inviteRoutes";
import { cookieParser } from "./middlewares/cookieParser";
import { trackAndRedirect } from "./controllers/affiliateController";
import { optionalProtect } from "./middlewares/authMiddleware";
import "./config/passport";

const app: Application = express();

const MONGODB_URI = process.env.MONGODB_URI || "";
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use(cookieParser);

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use("/uploads", express.static(UPLOAD_DIR));

app.get("/", (req: Request, res: Response) => {
  res.send("Soshop API is running...");
});

// Public affiliate redirect — short URL: /r/:code
app.get("/r/:code", optionalProtect, trackAndRedirect);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/bank", bankRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/kyc", kycRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/withdraw", withdrawRoutes);
app.use("/api/creator-products", creatorProductRoutes);
app.use("/api/affiliate", affiliateRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/support", supportRoutes);
app.use("/api", inviteRoutes);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

server.on("error", (err: any) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Please kill the existing process or use a different port.`);
    process.exit(1);
  }
});

export default app;
