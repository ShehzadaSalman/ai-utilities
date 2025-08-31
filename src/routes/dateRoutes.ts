import { Router } from "express";
import { DateController } from "../controllers/dateController";

const router = Router();
const dateController = new DateController();

/**
 * @route GET /api/date
 * @description Get current date and timestamp
 * @access Public
 */
router.get("/", dateController.getCurrentDate);

export { router as dateRoutes };
