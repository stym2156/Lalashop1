import { Router } from "express";
import { listPublicBanners } from "../controllers/heroBannerController";

const router: Router = Router();

router.get("/", listPublicBanners);

export default router;
