import dotenv from "dotenv";
dotenv.config();
import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import mongoose from "mongoose";
import passport from "passport";

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
import bannerRoutes from "./routes/bannerRoutes";
import supportRoutes from "./routes/supportRoutes";
import inviteRoutes from "./routes/inviteRoutes";
import marketingRoutes from "./routes/marketingRoutes";
import messageRoutes from "./routes/messageRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import shopSettingRoutes from "./routes/shopSettingRoutes";
import customerRoutes from "./routes/customerRoutes";
import financeRoutes from "./routes/financeRoutes";
import trackingRoutes from "./routes/trackingRoutes";
import paymentRoutes from "./routes/paymentRoutes";
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

// CORS — explicit allowlist parsed from env. In dev (no env) fall back to "*".
// Format: ALLOWED_ORIGINS=https://app.lalashop.com,https://admin.lalashop.com
const allowedOrigins =
  process.env.ALLOWED_ORIGINS?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
app.use(
  cors({
    origin: (origin, cb) => {
      // Same-origin or curl/Postman/health checks → no Origin header.
      if (!origin) return cb(null, true);
      if (allowedOrigins.length === 0) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);

// Body limit kept tight — files now upload directly to R2, the API only
// accepts JSON. 2 MB is plenty for product/order payloads.
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser);

// Required for passport.authenticate("google" | "facebook", ...) to find the
// strategies registered in ./config/passport. Without this middleware,
// passport throws "Unknown authentication strategy" and OAuth silently breaks.
app.use(passport.initialize());

// Liveness/readiness probe — used by load balancers and uptime monitors.
app.get("/healthz", (_req: Request, res: Response) => {
  const dbReady = mongoose.connection.readyState === 1;
  res.status(dbReady ? 200 : 503).json({
    status: dbReady ? "ok" : "degraded",
    db: dbReady ? "connected" : "disconnected",
    uptime: process.uptime(),
  });
});

app.get("/", (_req: Request, res: Response) => {
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
app.use("/api/banners", bannerRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/marketing", marketingRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/shop-settings", shopSettingRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/tracking", trackingRoutes);
// Payment routes mounted at /api so admin paths are /api/admin/methods etc.
app.use("/api/payment", paymentRoutes);
app.use("/api", inviteRoutes);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
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
