import { Router } from "express";
import { listPublicCategories } from "../controllers/categoryController";

const router: Router = Router();

router.get("/", listPublicCategories);

export default router;
