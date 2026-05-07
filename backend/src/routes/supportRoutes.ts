import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import { createTicket, listMyTickets } from "../controllers/supportTicketController";

const router: Router = Router();

router.post("/", protect, createTicket);
router.get("/mine", protect, listMyTickets);

export default router;
