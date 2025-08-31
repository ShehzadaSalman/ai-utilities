import { Router } from "express";
import { SlotsController } from "../controllers/slotsController";
import {
  validateAvailableSlots,
  validateReserveSlot,
  validateUpdateSlot,
} from "../middleware/validation";

const router = Router();
const slotsController = new SlotsController();

/**
 * @route GET /api/slots/available
 * @description Get available time slots for an event type
 * @access Public
 */
router.get(
  "/available",
  validateAvailableSlots,
  slotsController.getAvailableSlots
);

/**
 * @route POST /api/slots/reserve
 * @description Reserve a time slot
 * @access Public
 */
router.post("/reserve", validateReserveSlot, slotsController.reserveSlot);

/**
 * @route PUT /api/slots/:reservationId
 * @description Update an existing reservation
 * @access Public
 */
router.put("/:reservationId", validateUpdateSlot, slotsController.updateSlot);

export { router as slotsRoutes };
