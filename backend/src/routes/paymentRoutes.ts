import express from "express";
import { protect, admin } from "../middlewares/authMiddleware";
import {
  listActiveMethods,
  getPromptPayQr,
  submitPaymentSlip,
  listOrderSlips,
  adminListMethods,
  adminCreateMethod,
  adminUpdateMethod,
  adminDeleteMethod,
  adminListSlips,
  adminGetSlipStats,
  adminReviewSlip,
} from "../controllers/paymentController";

const router = express.Router();

// Public — list active methods at checkout
router.get("/methods", listActiveMethods);

// Customer (auth required)
router.get("/methods/promptpay-qr/:methodId/:orderId", protect, getPromptPayQr);
router.post("/orders/:orderId/slip", protect, submitPaymentSlip);
router.get("/orders/:id/slips", protect, listOrderSlips);

// Admin
router.get("/admin/methods", protect, admin, adminListMethods);
router.post("/admin/methods", protect, admin, adminCreateMethod);
router.put("/admin/methods/:id", protect, admin, adminUpdateMethod);
router.delete("/admin/methods/:id", protect, admin, adminDeleteMethod);

router.get("/admin/slips", protect, admin, adminListSlips);
router.get("/admin/slips/stats", protect, admin, adminGetSlipStats);
router.put("/admin/slips/:id", protect, admin, adminReviewSlip);

export default router;
