import express from "express";
import { protect, optionalProtect } from "../middlewares/authMiddleware";
import {
  trackPageView,
  getTraffic,
  getConversion,
} from "../controllers/trackingController";

const router = express.Router();

// Public POST — anonymous viewers should be tracked too. optionalProtect
// attaches req.user when a token is present so we can dedupe by user.
router.post("/pageview", optionalProtect, trackPageView);

// Seller-only analytics
router.get("/traffic", protect, getTraffic);
router.get("/conversion", protect, getConversion);

export default router;
