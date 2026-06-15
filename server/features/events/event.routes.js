import express from "express";
import {
  createEventController,
  getAllEventsController,
  getEventByIdController,
  updateEventController,
  deleteEventController,
  getOrganizerEventsController,
} from "./event.controller.js";
import { getMe } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { validate, validateQuery } from "../../middleware/validate.middleware.js";
import { createEventSchema, getEventsQuerySchema, updateEventSchema } from "./event.validate.js";

const eventRoutes = express.Router();

eventRoutes.get("/", getMe, validateQuery(getEventsQuerySchema), getAllEventsController);
eventRoutes.get("/organizer/events", getMe, getOrganizerEventsController);
eventRoutes.get("/:id", getMe, getEventByIdController);
eventRoutes.post("/", getMe, validate(createEventSchema), createEventController);
eventRoutes.patch("/:id", getMe, validate(updateEventSchema), updateEventController);
eventRoutes.delete("/:id", getMe, deleteEventController);

export default eventRoutes;
