import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import { getCreatorAnalytics } from "../controllers/analyticsController";
import { getChatAnalytics } from "../controllers/analyticsExtraController";

const router: Router = Router();

router.get("/creator/me", protect, getCreatorAnalytics);
router.get("/chat", protect, getChatAnalytics);

export default router;
