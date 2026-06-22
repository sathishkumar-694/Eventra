import express from "express";
import {
  createBookingController,
  getUserBookingsController,
  cancelBookingController,
} from "./booking.controller.js";
import {
  createSeatHoldController,
  cancelSeatHoldController,
  getSeatHoldController,
} from "./seat-hold.controller.js";
import { getMe } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createBookingSchema } from "./booking.validate.js";
import { createSeatHoldSchema } from "./seat-hold.validate.js";

const bookingRoutes = express.Router();

bookingRoutes.post("/", getMe, validate(createBookingSchema), createBookingController);
bookingRoutes.get("/", getMe, getUserBookingsController);
bookingRoutes.patch("/:id/cancel", getMe, cancelBookingController);

bookingRoutes.get("/hold/status", getMe, getSeatHoldController);
bookingRoutes.post("/hold", getMe, validate(createSeatHoldSchema), createSeatHoldController);
bookingRoutes.delete("/hold/:id", getMe, cancelSeatHoldController);

export default bookingRoutes;