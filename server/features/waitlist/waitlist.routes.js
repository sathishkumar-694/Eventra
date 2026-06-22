import express from "express";
import {
  createWaitlistController,
  getWaitlistPositionController,
  deleteWaitlistController,
} from "./waitlist.controller.js";
import { getMe } from "../../middleware/auth.middleware.js";

const waitlistRoutes = express.Router();

waitlistRoutes.post("/:eventId", getMe, createWaitlistController);
waitlistRoutes.get("/:eventId/position", getMe, getWaitlistPositionController);
waitlistRoutes.delete("/:eventId", getMe, deleteWaitlistController);

export default waitlistRoutes;
