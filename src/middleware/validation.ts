import { body, query, param } from "express-validator";

/**
 * Validation rules for available slots endpoint
 */
export const validateAvailableSlots = [
  query("eventTypeId")
    .notEmpty()
    .withMessage("Event type ID is required")
    .isString()
    .withMessage("Event type ID must be a string"),

  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid ISO 8601 date"),

  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid ISO 8601 date")
    .custom((endDate, { req }) => {
      if (req.query?.startDate && endDate) {
        const start = new Date(req.query.startDate as string);
        const end = new Date(endDate);
        if (end <= start) {
          throw new Error("End date must be after start date");
        }
      }
      return true;
    }),

  query("timezone")
    .optional()
    .isString()
    .withMessage("Timezone must be a string")
    .matches(/^[A-Za-z_]+\/[A-Za-z_]+$/)
    .withMessage('Timezone must be in format like "America/New_York"'),
];

/**
 * Validation rules for reserve slot endpoint
 */
export const validateReserveSlot = [
  body("eventTypeId")
    .notEmpty()
    .withMessage("Event type ID is required")
    .isString()
    .withMessage("Event type ID must be a string"),

  body("start")
    .notEmpty()
    .withMessage("Start time is required")
    .isISO8601()
    .withMessage("Start time must be a valid ISO 8601 date"),

  body("end")
    .notEmpty()
    .withMessage("End time is required")
    .isISO8601()
    .withMessage("End time must be a valid ISO 8601 date")
    .custom((endTime, { req }) => {
      const start = new Date(req.body.start);
      const end = new Date(endTime);
      if (end <= start) {
        throw new Error("End time must be after start time");
      }
      return true;
    }),

  body("attendee.name")
    .notEmpty()
    .withMessage("Attendee name is required")
    .isString()
    .withMessage("Attendee name must be a string")
    .isLength({ min: 1, max: 100 })
    .withMessage("Attendee name must be between 1 and 100 characters"),

  body("attendee.email")
    .notEmpty()
    .withMessage("Attendee email is required")
    .isEmail()
    .withMessage("Attendee email must be a valid email address"),

  body("attendee.timezone")
    .optional()
    .isString()
    .withMessage("Attendee timezone must be a string")
    .matches(/^[A-Za-z_]+\/[A-Za-z_]+$/)
    .withMessage('Attendee timezone must be in format like "America/New_York"'),

  body("metadata")
    .optional()
    .isObject()
    .withMessage("Metadata must be an object"),
];

/**
 * Validation rules for update slot endpoint
 */
export const validateUpdateSlot = [
  param("reservationId")
    .notEmpty()
    .withMessage("Reservation ID is required")
    .isString()
    .withMessage("Reservation ID must be a string"),

  body("start")
    .optional()
    .isISO8601()
    .withMessage("Start time must be a valid ISO 8601 date"),

  body("end")
    .optional()
    .isISO8601()
    .withMessage("End time must be a valid ISO 8601 date")
    .custom((endTime, { req }) => {
      if (req.body.start && endTime) {
        const start = new Date(req.body.start);
        const end = new Date(endTime);
        if (end <= start) {
          throw new Error("End time must be after start time");
        }
      }
      return true;
    }),

  body("attendee.name")
    .optional()
    .isString()
    .withMessage("Attendee name must be a string")
    .isLength({ min: 1, max: 100 })
    .withMessage("Attendee name must be between 1 and 100 characters"),

  body("attendee.email")
    .optional()
    .isEmail()
    .withMessage("Attendee email must be a valid email address"),

  body("metadata")
    .optional()
    .isObject()
    .withMessage("Metadata must be an object"),
];
