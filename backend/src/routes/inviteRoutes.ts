import { Router } from "express";
import { acceptInvite } from "../controllers/adminInviteController";
import { listPublicSettings } from "../controllers/systemSettingController";

const router: Router = Router();

// Public — invitee accepts via token
router.post("/admin-invite/accept/:token", acceptInvite);

// Public site settings
router.get("/settings/public", listPublicSettings);

export default router;
