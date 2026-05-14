import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import { submitKyc, getMyKyc } from "../controllers/kycController";

const router: Router = Router();

// KYC documents now live in R2 — the frontend uploads via the presign flow and
// only sends the resulting public URLs here, so there is no multipart parser.
router.post("/submit", protect, submitKyc);
router.get("/me", protect, getMyKyc);

export default router;
