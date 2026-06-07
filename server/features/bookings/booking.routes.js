import express from "express";
import {
  createBookingController,
  getUserBookingsController,
  cancelBookingController,
} from "./bookings.controller.js";
import { getMe } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createBookingSchema } from "./booking.validate.js";

const bookingRoutes = express.Router();

bookingRoutes.post("/", getMe, validate(createBookingSchema), createBookingController);
bookingRoutes.get("/", getMe, getUserBookingsController);
bookingRoutes.patch("/:id/cancel", getMe, cancelBookingController);

export default bookingRoutes;
